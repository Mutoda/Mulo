import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import crypto from "crypto";

const REGION          = "af-south-1";
const OTP_TTL_SECONDS = 600;
const MAX_ATTEMPTS    = parseInt(process.env.MAX_OTP_ATTEMPTS ?? "3");
const WA_API_VERSION  = "v19.0";
const WA_API_BASE     = "https://graph.facebook.com";

const smClient = new SecretsManagerClient({ region: REGION });
let cachedSecrets = null;

// In-memory OTP store (per Lambda container — good enough for demo)
const otpStore = new Map();

async function getWhatsAppSecrets() {
  if (cachedSecrets) return cachedSecrets;
  const cmd = new GetSecretValueCommand({ SecretId: process.env.WHATSAPP_SECRET ?? "mulo/whatsapp" });
  const res = await smClient.send(cmd);
  cachedSecrets = JSON.parse(res.SecretString);
  return cachedSecrets;
}

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

function normalisePhone(raw) {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("27") && digits.length === 11) return `+${digits}`;
  if (digits.startsWith("0")  && digits.length === 10) return `+27${digits.slice(1)}`;
  if (digits.length === 9)                              return `+27${digits}`;
  throw new Error(`Invalid SA phone number: ${raw}`);
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type":                 "application/json",
      "Access-Control-Allow-Origin":  "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return response(200, {});

  let phoneRaw;
  try {
    ({ phoneNumber: phoneRaw } = JSON.parse(event.body ?? "{}"));
    if (!phoneRaw) throw new Error("phoneNumber is required");
  } catch (err) {
    return response(400, { error: err.message });
  }

  let phone;
  try {
    phone = normalisePhone(phoneRaw);
  } catch (err) {
    return response(400, { error: err.message });
  }

  const otp       = generateOTP();
  const expiresAt = Date.now() + OTP_TTL_SECONDS * 1000;

  // Store in memory
  otpStore.set(phone, { otp, expiresAt, attempts: 0 });

  const { accessToken, phoneNumberId, templateName } = await getWhatsAppSecrets();

  const waRes = await fetch(`${WA_API_BASE}/${WA_API_VERSION}/${phoneNumberId}/messages`, {
    method:  "POST",
    headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to:   phone,
      type: "template",
      template: {
        name:     templateName,
        language: { code: "en_US" },
      },
    }),
  });

  const waData = await waRes.json();

  if (!waRes.ok) {
    console.error("WhatsApp API error:", JSON.stringify(waData));
    otpStore.delete(phone);
    return response(502, { error: "Failed to deliver OTP. Please try again.", debug: waData });
  }

  console.info(`OTP sent to +27***${phone.slice(-4)}`);
  return response(200, {
    success:    true,
    otp,
    messageId:  waData.messages?.[0]?.id,
    expiresIn:  OTP_TTL_SECONDS,
    maskedPhone: `+27 *** *** ${phone.slice(-4)}`,
  });
};
