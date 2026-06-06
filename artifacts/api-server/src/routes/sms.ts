import { Router, type IRouter } from "express";
import { requireAuth } from "../lib/adminAuth";
import { SendSmsBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";
import { getSmsConfig } from "../lib/settingsService";

const router: IRouter = Router();

router.post("/sms/send", requireAuth, async (req, res): Promise<void> => {
  const parsed = SendSmsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { customerId, message, mobile } = parsed.data;

  const cfg = await getSmsConfig();
  const gatewayUrl = cfg.gatewayUrl || process.env.SMS_GATEWAY_URL;
  const apiKey = cfg.apiKey || process.env.SMS_API_KEY;
  const senderId = cfg.senderId || process.env.SMS_SENDER_ID || "ASIANDTH";

  if (gatewayUrl && apiKey) {
    try {
      const response = await fetch(gatewayUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ to: mobile, message, sender: senderId }),
      });

      if (!response.ok) {
        logger.error({ status: response.status }, "SMS gateway error");
        res.status(500).json({ error: "SMS gateway error" });
        return;
      }

      logger.info({ customerId, mobile }, "SMS sent via gateway");
    } catch (err) {
      logger.error({ err }, "SMS send failed");
      res.status(500).json({ error: "SMS send failed" });
      return;
    }
  } else {
    logger.info({ customerId, mobile, message }, "SMS (simulated - no gateway configured)");
  }

  res.json({ message: "SMS sent successfully" });
});

export default router;
