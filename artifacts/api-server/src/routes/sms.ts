import { Router, type IRouter } from "express";
import { requireAuth } from "../lib/adminAuth";
import { SendSmsBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/sms/send", requireAuth, async (req, res): Promise<void> => {
  const parsed = SendSmsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { customerId, message, mobile } = parsed.data;

  // SMS gateway integration point
  // To enable real SMS: set SMS_GATEWAY_URL, SMS_API_KEY, SMS_SENDER_ID env vars
  const gatewayUrl = process.env.SMS_GATEWAY_URL;
  const apiKey = process.env.SMS_API_KEY;

  if (gatewayUrl && apiKey) {
    try {
      const response = await fetch(gatewayUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          to: mobile,
          message,
          sender: process.env.SMS_SENDER_ID ?? "DTHSVC",
        }),
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
    // Log SMS in development when no gateway configured
    logger.info({ customerId, mobile, message }, "SMS (simulated - no gateway configured)");
  }

  res.json({ message: "SMS sent successfully" });
});

export default router;
