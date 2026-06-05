import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, customersTable, rechargesTable } from "@workspace/db";
import { requireAuth } from "../lib/adminAuth";
import {
  AddRechargeBody,
  AddRechargeParams,
  DeleteRechargeParams,
  ListRechargesParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function computeStatus(nextRechargeDate: string | null): string {
  if (!nextRechargeDate) return "pending";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = new Date(nextRechargeDate);
  next.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "expired";
  if (diffDays <= 7) return "expiring_soon";
  return "active";
}

function formatRecharge(r: typeof rechargesTable.$inferSelect) {
  return {
    id: r.id,
    customerId: r.customerId,
    rechargeDate: r.rechargeDate,
    validityDays: r.validityDays,
    nextRechargeDate: r.nextRechargeDate,
    amountInr: parseFloat(r.amountInr),
    amountLkr: parseFloat(r.amountLkr),
    customerAmountLkr: r.customerAmountLkr ? parseFloat(r.customerAmountLkr) : null,
    planName: r.planName ?? null,
    profitMargin: r.profitMargin ? parseFloat(r.profitMargin) : null,
    notes: r.notes ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/customers/:customerId/recharges", requireAuth, async (req, res): Promise<void> => {
  const params = ListRechargesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const recharges = await db.select().from(rechargesTable)
    .where(eq(rechargesTable.customerId, params.data.customerId))
    .orderBy(rechargesTable.rechargeDate);

  res.json(recharges.map(formatRecharge));
});

router.post("/customers/:customerId/recharges", requireAuth, async (req, res): Promise<void> => {
  const params = AddRechargeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AddRechargeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, params.data.customerId));
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  const nextRechargeDate = addDays(parsed.data.rechargeDate, parsed.data.validityDays);

  const customerAmountLkr = parsed.data.customerAmountLkr ?? null;
  const profitMargin = customerAmountLkr != null
    ? customerAmountLkr - parsed.data.amountLkr
    : null;

  const [recharge] = await db.insert(rechargesTable).values({
    customerId: params.data.customerId,
    rechargeDate: parsed.data.rechargeDate,
    validityDays: parsed.data.validityDays,
    nextRechargeDate,
    amountInr: String(parsed.data.amountInr),
    amountLkr: String(parsed.data.amountLkr),
    customerAmountLkr: customerAmountLkr != null ? String(customerAmountLkr) : null,
    planName: parsed.data.planName ?? null,
    profitMargin: profitMargin != null ? String(profitMargin) : null,
    notes: parsed.data.notes ?? null,
  }).returning();

  const newStatus = computeStatus(nextRechargeDate);
  await db.update(customersTable).set({
    lastRechargeDate: parsed.data.rechargeDate,
    nextRechargeDate,
    status: newStatus,
  }).where(eq(customersTable.id, params.data.customerId));

  res.status(201).json(formatRecharge(recharge));
});

router.delete("/recharges/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteRechargeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [recharge] = await db.delete(rechargesTable)
    .where(eq(rechargesTable.id, params.data.id))
    .returning();

  if (!recharge) {
    res.status(404).json({ error: "Recharge not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
