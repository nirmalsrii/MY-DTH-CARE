import { Router, type IRouter } from "express";
import {
  checkAdminCredentials,
  createAdminCredentials,
  updateAdminCredentials,
  isSetupRequired,
  getAdminFromDb,
} from "../lib/adminAuth";
import { requireAuth } from "../lib/adminAuth";
import { AdminLoginBody, SetupAdminBody, ChangePasswordBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/auth/setup-status", async (_req, res): Promise<void> => {
  const setupRequired = await isSetupRequired();
  res.json({ setupRequired });
});

router.post("/auth/setup", async (req, res): Promise<void> => {
  const setupRequired = await isSetupRequired();
  if (!setupRequired) {
    res.status(400).json({ error: "Admin already set up. Use change-password to update credentials." });
    return;
  }

  const parsed = SetupAdminBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters." });
    return;
  }

  await createAdminCredentials(username, password);

  const session = req.session as { adminAuthenticated?: boolean; adminUsername?: string };
  session.adminAuthenticated = true;
  session.adminUsername = username;

  res.json({ authenticated: true, username });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;
  const valid = await checkAdminCredentials(username, password);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const session = req.session as { adminAuthenticated?: boolean; adminUsername?: string };
  session.adminAuthenticated = true;
  session.adminUsername = username;

  res.json({ authenticated: true, username });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  req.session.destroy(() => {
    res.json({ message: "Logged out" });
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const session = req.session as { adminAuthenticated?: boolean; adminUsername?: string };
  if (!session.adminAuthenticated) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({ authenticated: true, username: session.adminUsername ?? null });
});

router.put("/auth/change-password", requireAuth, async (req, res): Promise<void> => {
  const parsed = ChangePasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { currentPassword, newPassword } = parsed.data;
  if (newPassword.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters." });
    return;
  }

  const session = req.session as { adminUsername?: string };
  const username = session.adminUsername ?? "admin";

  const valid = await checkAdminCredentials(username, currentPassword);
  if (!valid) {
    res.status(401).json({ error: "Current password is incorrect." });
    return;
  }

  const admin = await getAdminFromDb();
  if (admin) {
    await updateAdminCredentials(username, newPassword);
  } else {
    await createAdminCredentials(username, newPassword);
  }

  res.json({ message: "Password changed successfully." });
});

export default router;
