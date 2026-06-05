import { Router, type IRouter } from "express";
import { eq, like, and, or, sql, isNotNull } from "drizzle-orm";
import { db, customersTable, rechargesTable } from "@workspace/db";
import { requireAuth } from "../lib/adminAuth";
import {
  CreateCustomerBody,
  UpdateCustomerBody,
  ListCustomersQueryParams,
  GetCustomerParams,
  UpdateCustomerParams,
  DeleteCustomerParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function computeStatus(nextRechargeDate: string | null): string {
  if (!nextRechargeDate) return "pending";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = new Date(nextRechargeDate);
  next.setHours(0, 0, 0, 0);
  const diffMs = next.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "expired";
  if (diffDays <= 7) return "expiring_soon";
  return "active";
}

function computeDaysUntilExpiry(nextRechargeDate: string | null): number | null {
  if (!nextRechargeDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = new Date(nextRechargeDate);
  next.setHours(0, 0, 0, 0);
  return Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatCustomer(c: typeof customersTable.$inferSelect, lastRecharge?: typeof rechargesTable.$inferSelect | null) {
  const status = computeStatus(c.nextRechargeDate ?? null);
  const daysUntilExpiry = computeDaysUntilExpiry(c.nextRechargeDate ?? null);
  return {
    id: c.id,
    name: c.name,
    mobile: c.mobile,
    address: c.address ?? null,
    provider: c.provider,
    customerId: c.customerId,
    status,
    lastRechargeDate: c.lastRechargeDate ?? null,
    nextRechargeDate: c.nextRechargeDate ?? null,
    lastRechargeAmountInr: lastRecharge ? parseFloat(lastRecharge.amountInr) : null,
    lastRechargeAmountLkr: lastRecharge ? parseFloat(lastRecharge.amountLkr) : null,
    daysUntilExpiry,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

router.get("/customers", requireAuth, async (req, res): Promise<void> => {
  const params = ListCustomersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { provider, status, search, dueDays } = params.data;

  const customers = await db.select().from(customersTable).orderBy(customersTable.createdAt);

  const latestRecharges = await db
    .select()
    .from(rechargesTable)
    .orderBy(rechargesTable.rechargeDate);

  const rechargeMap = new Map<number, typeof rechargesTable.$inferSelect>();
  for (const r of latestRecharges) {
    rechargeMap.set(r.customerId, r);
  }

  let result = customers.map(c => formatCustomer(c, rechargeMap.get(c.id)));

  if (provider) {
    result = result.filter(c => c.provider === provider);
  }

  if (search) {
    const s = search.toLowerCase();
    result = result.filter(c =>
      c.name.toLowerCase().includes(s) ||
      c.mobile.includes(s) ||
      c.customerId.toLowerCase().includes(s)
    );
  }

  if (status) {
    result = result.filter(c => c.status === status);
  }

  if (dueDays !== undefined) {
    result = result.filter(c =>
      c.daysUntilExpiry !== null &&
      c.daysUntilExpiry >= 0 &&
      c.daysUntilExpiry <= dueDays
    );
  }

  res.json(result);
});

router.post("/customers/refresh-status", requireAuth, async (req, res): Promise<void> => {
  const customers = await db.select().from(customersTable);
  for (const c of customers) {
    const newStatus = computeStatus(c.nextRechargeDate ?? null);
    await db.update(customersTable).set({ status: newStatus }).where(eq(customersTable.id, c.id));
  }
  res.json({ message: `Refreshed ${customers.length} customers` });
});

router.post("/customers", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [customer] = await db.insert(customersTable).values({
    name: parsed.data.name,
    mobile: parsed.data.mobile,
    address: parsed.data.address ?? null,
    provider: parsed.data.provider,
    customerId: parsed.data.customerId,
    status: "pending",
  }).returning();

  res.status(201).json(formatCustomer(customer, null));
});

router.get("/customers/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, params.data.id));
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  const recharges = await db.select().from(rechargesTable)
    .where(eq(rechargesTable.customerId, params.data.id))
    .orderBy(rechargesTable.rechargeDate);

  const lastRecharge = recharges.length > 0 ? recharges[recharges.length - 1] : null;
  const base = formatCustomer(customer, lastRecharge);

  res.json({
    ...base,
    recharges: recharges.map(r => ({
      id: r.id,
      customerId: r.customerId,
      rechargeDate: r.rechargeDate,
      validityDays: r.validityDays,
      nextRechargeDate: r.nextRechargeDate,
      amountInr: parseFloat(r.amountInr),
      amountLkr: parseFloat(r.amountLkr),
      planName: r.planName ?? null,
      profitMargin: r.profitMargin ? parseFloat(r.profitMargin) : null,
      notes: r.notes ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
  });
});

router.patch("/customers/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [customer] = await db.update(customersTable)
    .set({ ...parsed.data })
    .where(eq(customersTable.id, params.data.id))
    .returning();

  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  const lastRecharge = await db.select().from(rechargesTable)
    .where(eq(rechargesTable.customerId, customer.id))
    .orderBy(rechargesTable.rechargeDate);

  const last = lastRecharge.length > 0 ? lastRecharge[lastRecharge.length - 1] : null;
  res.json(formatCustomer(customer, last));
});

router.delete("/customers/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [customer] = await db.delete(customersTable)
    .where(eq(customersTable.id, params.data.id))
    .returning();

  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
