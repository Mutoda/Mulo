import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { createClient } from "redis";
import crypto from "crypto";

const REGION               = "af-south-1";
const MAX_VERIFY_ATTEMPTS  = parseInt(process.env.MAX_VERIFY_ATTEMPTS ?? "5");
const VERIFIED_TOKEN_TTL_S = 900;

const smClient = new SecretsManagerClient({ region: REGION });
let redisClient      = null;
let cachedJwtSecret  = null;

async function getJwtSecret() {
  if (cachedJwtSecret) return cachedJwtSecret;
  const cmd = new GetSecretValueCommand({ SecretId: process.env.JWT_SECRET ?? "mulo/jwt" });
  const res = await smClient.send(cmd);
  cachedJwtSecret = JSON.parse(res.SecretString).secret;
  return cachedJwtSecret;
}

async function getRedis() {
  if (redisClient?.isReady) return redisClient;
  redisClient = createClient({ url: process.env.REDIS_URL, socket: { tls: true, rejectUnauthorized: true } });
  redisClient.on("error", (err) => console.error("Redis error:", err));
  await redisClient.connect();
  return redisClient;
}

function normalisePhone(raw) {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("27") && digits.length === 11) return `+${digits}`;
  if (digits.startsWith("0")  && digits.length === 10) return `+27${digits.slice(1)}`;
  if (digits.length === 9)                              return `+27${digits}`;
  throw new Error(`Invalid SA phone number: ${raw}`);
}

function createVerifiedToken(phone, jwtSecret) {
  const header  = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    sub:   phone,
    scope: "phone_verified",
    iat:   Math.floor(Date.now() / 1000),
    exp:   Math.floor(Date.now() / 1000) + VERIFIED_TOKEN_TTL_S,
  })).toString("base64url");
  const sig = crypto.createHmac("sha256", jwtSecret).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${sig}`;
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type":                 "application/json",
      "Access-Control-Allow-Origin":  "https://mulo.co.za",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return response(200, {});

  let phoneRaw, submittedOtp;
  try {
    ({ phoneNumber: phoneRaw, otp: submittedOtp } = JSON.parse(event.body ?? "{}"));
    if (!phoneRaw)     throw new Error("phoneNumber is required");
    if (!submittedOtp) throw new Error("otp is required");
  } catch (err) {
    return response(400, { error: err.message });
  }

  let phone;
  try {
    phone = normalisePhone(phoneRaw);
  } catch (err) {
    return response(400, { error: err.message });
  }

  const redis  = await getRedis();
  const otpKey = `otp:${phone}`;
  const stored = await redis.get(otpKey);

  if (!stored) {
    return response(400, { error: "OTP has expired or was never sent. Please request a new code.", code: "OTP_NOT_FOUND" });
  }

  let otpRecord;
  try {
    otpRecord = JSON.parse(stored);
  } catch {
    await redis.del(otpKey);
    return response(500, { error: "Internal error. Please request a new code." });
  }

  if (Date.now() > otpRecord.expiresAt) {
    await redis.del(otpKey);
    return response(400, { error: "OTP has expired. Please request a new code.", code: "OTP_EXPIRED" });
  }

  otpRecord.attempts = (otpRecord.attempts ?? 0) + 1;

  if (otpRecord.attempts > MAX_VERIFY_ATTEMPTS) {
    await redis.del(otpKey);
    return response(429, { error: "Too many incorrect attempts. Please request a new code.", code: "OTP_LOCKED" });
  }

  const expected = Buffer.from(otpRecord.otp.padStart(10, "0"));
  const received = Buffer.from(submittedOtp.trim().padStart(10, "0"));
  const match    = expected.length === received.length && crypto.timingSafeEqual(expected, received);

  if (!match) {
    const remainingTtl = Math.ceil((otpRecord.expiresAt - Date.now()) / 1000);
    await redis.set(otpKey, JSON.stringify(otpRecord), { EX: Math.max(remainingTtl, 1) });
    const attemptsLeft = MAX_VERIFY_ATTEMPTS - otpRecord.attempts;
    return response(400, { error: "Incorrect code. Please try again.", code: "OTP_INCORRECT", attemptsLeft: Math.max(attemptsLeft, 0) });
  }

  await redis.del(otpKey);

  const jwtSecret     = await getJwtSecret();
  const verifiedToken = createVerifiedToken(phone, jwtSecret);

  await redis.set(`phone_verified:${phone}`, "1", { EX: VERIFIED_TOKEN_TTL_S });

  console.info(`OTP verified for +27***${phone.slice(-4)}`);
  return response(200, { verified: true, verifiedToken, expiresIn: VERIFIED_TOKEN_TTL_S, maskedPhone: `+27 *** *** ${phone.slice(-4)}` });
};
