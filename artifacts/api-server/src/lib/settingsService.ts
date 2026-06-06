import { db, appConfigTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface SmsGatewayConfig {
  gatewayUrl: string;
  apiKey: string;
  senderId: string;
  enabled: boolean;
}

export interface FirebaseAuthConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  enabled: boolean;
}

export interface FirebaseDbConfig {
  projectId: string;
  databaseUrl: string;
  serviceAccountJson: string;
  enabled: boolean;
}

const DEFAULTS = {
  sms: { gatewayUrl: "", apiKey: "", senderId: "ASIANDTH", enabled: false } as SmsGatewayConfig,
  firebase_auth: { apiKey: "", authDomain: "", projectId: "", appId: "", enabled: false } as FirebaseAuthConfig,
  firebase_db: { projectId: "", databaseUrl: "", serviceAccountJson: "", enabled: false } as FirebaseDbConfig,
};

async function getRaw(key: string): Promise<string | null> {
  const [row] = await db.select().from(appConfigTable).where(eq(appConfigTable.key, key));
  return row?.value ?? null;
}

async function setRaw(key: string, value: string): Promise<void> {
  await db.insert(appConfigTable)
    .values({ key, value })
    .onConflictDoUpdate({ target: appConfigTable.key, set: { value, updatedAt: new Date() } });
}

export async function getSmsConfig(): Promise<SmsGatewayConfig> {
  const raw = await getRaw("sms");
  if (!raw) return { ...DEFAULTS.sms, senderId: process.env.SMS_SENDER_ID ?? "ASIANDTH" };
  try {
    const parsed = JSON.parse(raw) as SmsGatewayConfig;
    // Fall back to env vars if not set in DB
    return {
      gatewayUrl: parsed.gatewayUrl || process.env.SMS_GATEWAY_URL || "",
      apiKey: parsed.apiKey || process.env.SMS_API_KEY || "",
      senderId: parsed.senderId || process.env.SMS_SENDER_ID || "ASIANDTH",
      enabled: parsed.enabled ?? false,
    };
  } catch { return DEFAULTS.sms; }
}

export async function setSmsConfig(cfg: SmsGatewayConfig): Promise<void> {
  await setRaw("sms", JSON.stringify(cfg));
}

export async function getFirebaseAuthConfig(): Promise<FirebaseAuthConfig> {
  const raw = await getRaw("firebase_auth");
  if (!raw) return DEFAULTS.firebase_auth;
  try { return JSON.parse(raw) as FirebaseAuthConfig; }
  catch { return DEFAULTS.firebase_auth; }
}

export async function setFirebaseAuthConfig(cfg: FirebaseAuthConfig): Promise<void> {
  await setRaw("firebase_auth", JSON.stringify(cfg));
}

export async function getFirebaseDbConfig(): Promise<FirebaseDbConfig> {
  const raw = await getRaw("firebase_db");
  if (!raw) return DEFAULTS.firebase_db;
  try { return JSON.parse(raw) as FirebaseDbConfig; }
  catch { return DEFAULTS.firebase_db; }
}

export async function setFirebaseDbConfig(cfg: FirebaseDbConfig): Promise<void> {
  await setRaw("firebase_db", JSON.stringify(cfg));
}

export async function getAllSettings() {
  const [sms, firebaseAuth, firebaseDb] = await Promise.all([
    getSmsConfig(),
    getFirebaseAuthConfig(),
    getFirebaseDbConfig(),
  ]);
  // Mask sensitive values for GET response
  return {
    sms: {
      ...sms,
      apiKey: sms.apiKey ? sms.apiKey.slice(0, 4) + "••••••••" : "",
    },
    firebaseAuth,
    firebaseDb: {
      ...firebaseDb,
      serviceAccountJson: firebaseDb.serviceAccountJson ? "••••••••" : "",
    },
  };
}
