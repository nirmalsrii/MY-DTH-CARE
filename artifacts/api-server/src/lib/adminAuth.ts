import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { db, adminSettingsTable } from "@workspace/db";

const ENV_ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "admin";
const ENV_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "dth@admin2024";

export async function getAdminFromDb() {
  const [setting] = await db.select().from(adminSettingsTable).limit(1);
  return setting ?? null;
}

export async function isSetupRequired(): Promise<boolean> {
  const admin = await getAdminFromDb();
  return admin === null;
}

export async function checkAdminCredentials(username: string, password: string): Promise<boolean> {
  const admin = await getAdminFromDb();
  if (admin) {
    return username === admin.username && await bcrypt.compare(password, admin.passwordHash);
  }
  return username === ENV_ADMIN_USERNAME && password === ENV_ADMIN_PASSWORD;
}

export async function createAdminCredentials(username: string, password: string): Promise<void> {
  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(adminSettingsTable).values({ username, passwordHash });
}

export async function updateAdminCredentials(username: string, newPassword: string): Promise<void> {
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.update(adminSettingsTable).set({ passwordHash, username });
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const session = req.session as { adminAuthenticated?: boolean };
  if (!session.adminAuthenticated) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}
