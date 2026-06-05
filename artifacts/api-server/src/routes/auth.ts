import { Router, type IRouter } from "express";
import { checkAdminCredentials } from "../lib/adminAuth";
import { AdminLoginBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;
  if (!checkAdminCredentials(username, password)) {
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

export default router;
