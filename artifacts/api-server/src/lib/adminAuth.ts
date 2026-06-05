import { Request, Response, NextFunction } from "express";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "dth@admin2024";

export function checkAdminCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const session = req.session as { adminAuthenticated?: boolean };
  if (!session.adminAuthenticated) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}
