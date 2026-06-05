import { Router, type IRouter } from "express";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { db, customersTable, rechargesTable } from "@workspace/db";
import { requireAuth } from "../lib/adminAuth";
import { GetDueAlertsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

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

router.get("/dashboard/stats", requireAuth, async (_req, res): Promise<void> => {
  const customers = await db.select().from(customersTable);
  const recharges = await db.select().from(rechargesTable);

  const rechargeMap = new Map<number, typeof rechargesTable.$inferSelect>();
  for (const r of recharges) {
    rechargeMap.set(r.customerId, r);
  }

  let active = 0, expiringSoon = 0, expired = 0, pending = 0;
  const providerMap = new Map<string, { count: number; activeCount: number }>();

  for (const c of customers) {
    const status = computeStatus(c.nextRechargeDate ?? null);
    if (status === "active") active++;
    else if (status === "expiring_soon") expiringSoon++;
    else if (status === "expired") expired++;
    else pending++;

    const entry = providerMap.get(c.provider) ?? { count: 0, activeCount: 0 };
    entry.count++;
    if (status === "active" || status === "expiring_soon") entry.activeCount++;
    providerMap.set(c.provider, entry);
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyRecharges = recharges.filter(r => new Date(r.rechargeDate) >= startOfMonth);

  const monthlyRevenueInr = monthlyRecharges.reduce((s, r) => s + parseFloat(r.amountInr), 0);
  const monthlyRevenueLkr = monthlyRecharges.reduce((s, r) => s + parseFloat(r.amountLkr), 0);
  const totalRevenueInr = recharges.reduce((s, r) => s + parseFloat(r.amountInr), 0);
  const totalRevenueLkr = recharges.reduce((s, r) => s + parseFloat(r.amountLkr), 0);

  const customersByProvider = Array.from(providerMap.entries()).map(([provider, v]) => ({
    provider,
    count: v.count,
    activeCount: v.activeCount,
  }));

  res.json({
    totalCustomers: customers.length,
    activeCustomers: active,
    expiringSoonCustomers: expiringSoon,
    expiredCustomers: expired,
    pendingCustomers: pending,
    monthlyRevenueInr,
    monthlyRevenueLkr,
    totalRevenueInr,
    totalRevenueLkr,
    customersByProvider,
  });
});

router.get("/dashboard/due-alerts", requireAuth, async (req, res): Promise<void> => {
  const params = GetDueAlertsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const customers = await db.select().from(customersTable);
  const recharges = await db.select().from(rechargesTable).orderBy(rechargesTable.rechargeDate);

  const rechargeMap = new Map<number, typeof rechargesTable.$inferSelect>();
  for (const r of recharges) {
    rechargeMap.set(r.customerId, r);
  }

  const formatted = customers.map(c => formatCustomer(c, rechargeMap.get(c.id)));

  const dueToday = formatted.filter(c => c.daysUntilExpiry === 0);
  const dueIn3Days = formatted.filter(c => c.daysUntilExpiry !== null && c.daysUntilExpiry > 0 && c.daysUntilExpiry <= 3);
  const dueIn7Days = formatted.filter(c => c.daysUntilExpiry !== null && c.daysUntilExpiry > 3 && c.daysUntilExpiry <= 7);
  const dueIn15Days = formatted.filter(c => c.daysUntilExpiry !== null && c.daysUntilExpiry > 7 && c.daysUntilExpiry <= 15);
  const overdue = formatted.filter(c => c.daysUntilExpiry !== null && c.daysUntilExpiry < 0);

  res.json({ dueToday, dueIn3Days, dueIn7Days, dueIn15Days, overdue });
});

export default router;
