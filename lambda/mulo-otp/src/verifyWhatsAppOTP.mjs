import crypto from "crypto";

const MAX_VERIFY_ATTEMPTS  = parseInt(process.env.MAX_VERIFY_ATTEMPTS ?? "5");
const VERIFIED_TOKEN_TTL_S = 900;

// Shared in-memory store — must be same container as send
// In production this will be Redis
const otpStore = new Map();

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

  const record = otpStore.get(phone);

  if (!record) {
    return response(400, { error: "OTP has expired or was never sent. Please request a new code.", code: "OTP_NOT_FOUND" });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(phone);
    return response(400, { error: "OTP has expired. Please request a new code.", code: "OTP_EXPIRED" });
  }

  record.attempts = (record.attempts ?? 0) + 1;

  if (record.attempts > MAX_VERIFY_ATTEMPTS) {
    otpStore.delete(phone);
    return response(429, { error: "Too many incorrect attempts. Please request a new code.", code: "OTP_LOCKED" });
  }

  const expected = Buffer.from(record.otp.padStart(10, "0"));
  const received = Buffer.from(submittedOtp.trim().padStart(10, "0"));
  const match    = expected.length === received.length && crypto.timingSafeEqual(expected, received);

  if (!match) {
    otpStore.set(phone, record);
    const attemptsLeft = MAX_VERIFY_ATTEMPTS - record.attempts;
    return response(400, { error: "Incorrect code. Please try again.", code: "OTP_INCORRECT", attemptsLeft: Math.max(attemptsLeft, 0) });
  }

  otpStore.delete(phone);

  console.info(`OTP verified for +27***${phone.slice(-4)}`);
  return response(200, {
    verified:    true,
    expiresIn:   VERIFIED_TOKEN_TTL_S,
    maskedPhone: `+27 *** *** ${phone.slice(-4)}`,
  });
};
