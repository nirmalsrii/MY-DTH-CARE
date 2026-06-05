import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const customersTable = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  mobile: text("mobile").notNull(),
  address: text("address"),
  provider: text("provider").notNull(),
  customerId: text("customer_id").notNull(),
  status: text("status").notNull().default("pending"),
  lastRechargeDate: text("last_recharge_date"),
  nextRechargeDate: text("next_recharge_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCustomerSchema = createInsertSchema(customersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customersTable.$inferSelect;

export const rechargesTable = pgTable("recharges", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customersTable.id, { onDelete: "cascade" }),
  rechargeDate: text("recharge_date").notNull(),
  validityDays: integer("validity_days").notNull(),
  nextRechargeDate: text("next_recharge_date").notNull(),
  amountInr: text("amount_inr").notNull(),
  amountLkr: text("amount_lkr").notNull(),
  customerAmountLkr: text("customer_amount_lkr"),
  planName: text("plan_name"),
  profitMargin: text("profit_margin"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRechargeSchema = createInsertSchema(rechargesTable).omit({ id: true, createdAt: true });
export type InsertRecharge = z.infer<typeof insertRechargeSchema>;
export type Recharge = typeof rechargesTable.$inferSelect;
