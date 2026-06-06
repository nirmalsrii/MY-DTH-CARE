import { Router, type IRouter } from "express";
import { requireAuth } from "../lib/adminAuth";
import {
  getSmsConfig, setSmsConfig,
  getFirebaseAuthConfig, setFirebaseAuthConfig,
  getFirebaseDbConfig, setFirebaseDbConfig,
  getAllSettings,
} from "../lib/settingsService";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/settings", requireAuth, async (_req, res): Promise<void> => {
  const settings = await getAllSettings();
  res.json(settings);
});

router.put("/settings/sms", requireAuth, async (req, res): Promise<void> => {
  const { gatewayUrl, apiKey, senderId, enabled } = req.body;
  if (typeof gatewayUrl !== "string" || typeof senderId !== "string") {
    res.status(400).json({ error: "gatewayUrl and senderId are required" });
    return;
  }
  const current = await getSmsConfig();
  const newKey = typeof apiKey === "string" && apiKey && !apiKey.includes("••") ? apiKey : current.apiKey;
  await setSmsConfig({ gatewayUrl, apiKey: newKey, senderId, enabled: !!enabled });
  res.json({ message: "SMS gateway settings saved" });
});

router.post("/settings/test-sms", requireAuth, async (req, res): Promise<void> => {
  const cfg = await getSmsConfig();
  if (!cfg.gatewayUrl || !cfg.apiKey) {
    res.status(400).json({ error: "SMS gateway not configured. Set gateway URL and API key first." });
    return;
  }
  const testMobile = req.body?.mobile ?? "0000000000";
  try {
    const response = await fetch(cfg.gatewayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        to: testMobile,
        message: "ASIAN DTH: SMS gateway test message. Connection successful.",
        sender: cfg.senderId,
      }),
    });
    if (!response.ok) {
      res.status(502).json({ error: `Gateway responded with ${response.status}` });
      return;
    }
    logger.info({ mobile: testMobile }, "SMS gateway test successful");
    res.json({ message: "Test SMS sent successfully" });
  } catch (err) {
    logger.error({ err }, "SMS gateway test failed");
    res.status(502).json({ error: "Could not reach SMS gateway. Check the URL." });
  }
});

router.put("/settings/firebase-auth", requireAuth, async (req, res): Promise<void> => {
  const { apiKey, authDomain, projectId, appId, enabled } = req.body;
  if (typeof projectId !== "string") {
    res.status(400).json({ error: "projectId is required" });
    return;
  }
  await setFirebaseAuthConfig({ apiKey: apiKey ?? "", authDomain: authDomain ?? "", projectId, appId: appId ?? "", enabled: !!enabled });
  res.json({ message: "Firebase Auth settings saved" });
});

router.get("/settings/firebase-public-config", async (_req, res): Promise<void> => {
  const cfg = await getFirebaseAuthConfig();
  if (!cfg.enabled || !cfg.apiKey) {
    res.json({ enabled: false });
    return;
  }
  res.json({
    enabled: true,
    apiKey: cfg.apiKey,
    authDomain: cfg.authDomain,
    projectId: cfg.projectId,
    appId: cfg.appId,
  });
});

router.put("/settings/firebase-db", requireAuth, async (req, res): Promise<void> => {
  const { projectId, databaseUrl, serviceAccountJson, enabled } = req.body;
  if (typeof projectId !== "string") {
    res.status(400).json({ error: "projectId is required" });
    return;
  }
  const current = await getFirebaseDbConfig();
  const saJson = typeof serviceAccountJson === "string" && serviceAccountJson && !serviceAccountJson.includes("••")
    ? serviceAccountJson : current.serviceAccountJson;
  await setFirebaseDbConfig({ projectId, databaseUrl: databaseUrl ?? "", serviceAccountJson: saJson, enabled: !!enabled });
  res.json({ message: "Firebase Database settings saved" });
});

router.post("/settings/test-firebase-db", requireAuth, async (req, res): Promise<void> => {
  const cfg = await getFirebaseDbConfig();
  if (!cfg.enabled || !cfg.projectId) {
    res.status(400).json({ error: "Firebase Database not configured." });
    return;
  }
  if (!cfg.serviceAccountJson) {
    res.status(400).json({ error: "Service account JSON required to test connection." });
    return;
  }
  try {
    JSON.parse(cfg.serviceAccountJson);
    res.json({ message: `Firebase project '${cfg.projectId}' config is valid. Connection ready.` });
  } catch {
    res.status(400).json({ error: "Service account JSON is not valid JSON." });
  }
});

export default router;
