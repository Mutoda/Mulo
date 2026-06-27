/**
 * MUḼO TELEMATICS — INSURER API HANDLER
 * ─────────────────────────────────────────────────────────────────────────
 * REST API served via API Gateway z30zl849k8 under /telematics/ prefix.
 * All routes require a valid insurer API key in the X-Mulo-API-Key header.
 *
 * Routes:
 *   GET  /telematics/score/vrn/{vrn}         — score by registration number
 *   GET  /telematics/score/id/{id_hash}      — score by ID number hash
 *   GET  /telematics/health/{vrn}            — vehicle health predictions
 *   GET  /telematics/history/{vrn}           — 12-month trip history
 *   POST /telematics/consent                 — record POPIA consent
 *   POST /telematics/webhook/register        — register insurer webhook
 *
 * Authentication:
 *   Header: X-Mulo-API-Key: {key}
 *   Key is SHA-256 hashed and looked up in telem_api_keys.
 *   Consent record must exist before score is released.
 *
 * Rate limiting:
 *   Monthly query limit per tier (Starter 500, Growth 2500, Enterprise unlimited)
 *   Excess queries billed at R5/query
 */

"use strict";

const { Pool }       = require("pg");
const { createHash } = require("crypto");

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl:      { rejectUnauthorized: false },
  max:      10,
});

// ── Helpers ────────────────────────────────────────────────────────────────
const ok  = (body)   => ({ statusCode: 200, headers: CORS, body: JSON.stringify(body) });
const err = (code, msg) => ({ statusCode: code, headers: CORS, body: JSON.stringify({ error: msg }) });

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

function hashKey(key) {
  return createHash("sha256").update(key).digest("hex");
}

function normaliseVRN(vrn) {
  return vrn?.toUpperCase().replace(/[\s\-]/g, "").trim() || null;
}

// ── API Key authentication & rate check ───────────────────────────────────
async function authenticate(client, rawKey) {
  if (!rawKey) return null;
  const keyHash = hashKey(rawKey);
  const res = await client.query(`
    SELECT id, insurer_code, insurer_name, tier, monthly_query_limit,
           query_count_mtd, active
    FROM telem_api_keys
    WHERE key_hash = $1 AND active = TRUE
    LIMIT 1
  `, [keyHash]);
  if (!res.rowCount) return null;

  // Update last_used_at
  await client.query(
    `UPDATE telem_api_keys SET last_used_at = NOW() WHERE id = $1`,
    [res.rows[0].id]
  );
  return res.rows[0];
}

async function checkAndIncrementQuota(client, apiKey) {
  const limit = apiKey.monthly_query_limit;
  const used  = apiKey.query_count_mtd;
  const tier  = apiKey.tier;

  // Enterprise = unlimited
  if (tier === "enterprise") return { allowed: true, overage: false };

  // Increment counter
  await client.query(`
    UPDATE telem_api_keys
    SET query_count_mtd = query_count_mtd + 1
    WHERE id = $1
  `, [apiKey.id]);

  return {
    allowed:      true,
    overage:      used >= limit,
    queries_used: used + 1,
    queries_limit: limit,
  };
}

async function logQuery(client, apiKeyId, endpoint, vehicleId, statusCode, startMs) {
  const ms = Date.now() - startMs;
  await client.query(`
    INSERT INTO telem_api_log (api_key_id, endpoint, mulo_vehicle_id, status_code, response_ms)
    VALUES ($1, $2, $3, $4, $5)
  `, [apiKeyId, endpoint, vehicleId, statusCode, ms]).catch(() => {});
}

// ── Vehicle lookup ────────────────────────────────────────────────────────
async function findVehicle(client, { vrn, id_hash }) {
  if (vrn) {
    const res = await client.query(
      `SELECT id, vrn, imei, source FROM telem_vehicles WHERE vrn = $1 LIMIT 1`,
      [normaliseVRN(vrn)]
    );
    return res.rows[0] || null;
  }
  if (id_hash) {
    const res = await client.query(
      `SELECT id, vrn, imei, source FROM telem_vehicles WHERE id_number_hash = $1 LIMIT 1`,
      [id_hash]
    );
    return res.rows[0] || null;
  }
  return null;
}

// ── Consent check ────────────────────────────────────────────────────────
async function hasConsent(client, vehicleId, insurerCode) {
  const res = await client.query(`
    SELECT id FROM telem_consent
    WHERE mulo_vehicle_id = $1
      AND insurer_code = $2
      AND consented = TRUE
      AND withdrawn_at IS NULL
    LIMIT 1
  `, [vehicleId, insurerCode]);
  return res.rowCount > 0;
}

// ── Route handlers ────────────────────────────────────────────────────────

// GET /telematics/score/vrn/{vrn}  or  GET /telematics/score/id/{idHash}
async function handleGetScore(client, apiKey, params) {
  const vehicle = await findVehicle(client, params);
  if (!vehicle) return err(404, "Vehicle not found on Muḽo Telematics platform");

  // Consent gate
  const consented = await hasConsent(client, vehicle.id, apiKey.insurer_code);
  if (!consented) return err(403, "No POPIA consent on record for this vehicle and insurer. POST /telematics/consent first.");

  // Fetch latest score
  const res = await client.query(`
    SELECT * FROM v_telem_current_scores
    WHERE mulo_vehicle_id = $1
  `, [vehicle.id]);

  if (!res.rowCount) return err(404, "No drive score available yet — insufficient trip data");

  const s = res.rows[0];
  return ok({
    vrn:                normaliseVRN(vehicle.vrn),
    drive_score:        s.score,
    score_band:         s.band,
    premium_adjustment: s.premium_adjustment,
    confidence:         s.confidence,
    data_months:        Math.round((s.data_days || 0) / 30 * 10) / 10,
    trip_count:         s.trip_count,
    total_km:           s.total_km,
    monthly_km_avg:     s.monthly_km_avg,
    tracker_source:     s.tracker_source,
    components: {
      braking:      s.component_braking,
      speeding:     s.component_speeding,
      acceleration: s.component_acceleration,
      cornering:    s.component_cornering,
      time_of_day:  s.component_time,
      mileage:      s.component_mileage,
    },
    last_updated: s.computed_at,
  });
}

// GET /telematics/health/{vrn}
async function handleGetHealth(client, apiKey, params) {
  const vehicle = await findVehicle(client, params);
  if (!vehicle) return err(404, "Vehicle not found");

  const consented = await hasConsent(client, vehicle.id, apiKey.insurer_code);
  if (!consented) return err(403, "No POPIA consent on record");

  const res = await client.query(`
    SELECT * FROM telem_health_predictions
    WHERE mulo_vehicle_id = $1
    ORDER BY computed_at DESC LIMIT 1
  `, [vehicle.id]);

  if (!res.rowCount) return err(404, "No health predictions available yet");
  const h = res.rows[0];

  return ok({
    vrn:             normaliseVRN(vehicle.vrn),
    vehicle_health_score: h.vehicle_health_score,
    service: {
      due_in_km:    h.service_due_km,
      due_date:     h.service_due_date,
    },
    battery: {
      health_score: h.battery_health_score,
      risk_level:   h.battery_failure_risk,
      alert:        h.battery_alert,
    },
    tyres: {
      wear_index:    h.tyre_wear_index,    // 0=new, 100=replace
      km_remaining:  h.tyre_km_remaining,
    },
    brakes: {
      wear_pct:      h.brake_wear_pct,
      km_remaining:  h.brake_km_remaining,
    },
    computed_at: h.computed_at,
  });
}

// GET /telematics/history/{vrn}
async function handleGetHistory(client, apiKey, params) {
  const vehicle = await findVehicle(client, params);
  if (!vehicle) return err(404, "Vehicle not found");

  const consented = await hasConsent(client, vehicle.id, apiKey.insurer_code);
  if (!consented) return err(403, "No POPIA consent on record");

  const res = await client.query(`
    SELECT
      DATE_TRUNC('month', start_ts) AS month,
      COUNT(*)::int                 AS trip_count,
      SUM(distance_km)              AS total_km,
      SUM(harsh_brake_count)        AS brakes,
      SUM(harsh_accel_count)        AS accels,
      SUM(harsh_corner_count)       AS corners,
      SUM(speeding_event_count)     AS speeding,
      AVG(CASE WHEN night_driving THEN 1 ELSE 0 END) AS night_pct,
      MAX(max_speed_kmh)            AS max_speed
    FROM telem_trips
    WHERE mulo_vehicle_id = $1
      AND start_ts >= NOW() - INTERVAL '12 months'
    GROUP BY 1 ORDER BY 1 DESC
  `, [vehicle.id]);

  return ok({
    vrn:     normaliseVRN(vehicle.vrn),
    months:  res.rows.map(r => ({
      month:       r.month,
      trip_count:  r.trip_count,
      total_km:    Math.round(r.total_km),
      harsh_brakes: parseInt(r.brakes),
      harsh_accels: parseInt(r.accels),
      harsh_corners: parseInt(r.corners),
      speeding_events: parseInt(r.speeding),
      night_driving_pct: Math.round(parseFloat(r.night_pct) * 100),
      max_speed_kmh: parseInt(r.max_speed),
    })),
  });
}

// POST /telematics/consent
async function handleConsent(client, apiKey, body) {
  const { vrn, id_hash, consent } = body;
  if (!vrn && !id_hash) return err(400, "vrn or id_hash required");
  if (typeof consent !== "boolean") return err(400, "consent must be true or false");

  const vehicle = await findVehicle(client, { vrn, id_hash });
  if (!vehicle) return err(404, "Vehicle not found");

  await client.query(`
    INSERT INTO telem_consent
      (mulo_vehicle_id, insurer_code, consented, consented_at, consent_source)
    VALUES ($1, $2, $3, NOW(), 'api')
    ON CONFLICT (mulo_vehicle_id, insurer_code)
    DO UPDATE SET
      consented    = EXCLUDED.consented,
      consented_at = NOW(),
      withdrawn_at = CASE WHEN EXCLUDED.consented = FALSE THEN NOW() ELSE NULL END
  `, [vehicle.id, apiKey.insurer_code, consent]);

  return ok({
    status:      "recorded",
    vrn:         normaliseVRN(vehicle.vrn),
    insurer:     apiKey.insurer_code,
    consented:   consent,
    recorded_at: new Date().toISOString(),
  });
}

// ── Lambda handler ─────────────────────────────────────────────────────────
exports.handler = async (event) => {
  const startMs = Date.now();
  const method  = event.httpMethod || event.requestContext?.http?.method;
  const path    = event.path || event.rawPath || "";
  const rawKey  = event.headers?.["x-mulo-api-key"] || event.headers?.["X-Mulo-API-Key"];

  const client = await pool.connect();
  try {
    // Authenticate
    const apiKey = await authenticate(client, rawKey);
    if (!apiKey) return err(401, "Invalid or missing API key");

    // Quota check
    const quota = await checkAndIncrementQuota(client, apiKey);

    // Route
    let response;
    const pp = event.pathParameters || {};

    if (method === "GET" && path.includes("/score/vrn/")) {
      response = await handleGetScore(client, apiKey, { vrn: pp.vrn });

    } else if (method === "GET" && path.includes("/score/id/")) {
      response = await handleGetScore(client, apiKey, { id_hash: pp.idHash });

    } else if (method === "GET" && path.includes("/health/")) {
      response = await handleGetHealth(client, apiKey, { vrn: pp.vrn });

    } else if (method === "GET" && path.includes("/history/")) {
      response = await handleGetHistory(client, apiKey, { vrn: pp.vrn });

    } else if (method === "POST" && path.includes("/consent")) {
      const body = JSON.parse(event.body || "{}");
      response = await handleConsent(client, apiKey, body);

    } else {
      response = err(404, `Route not found: ${method} ${path}`);
    }

    // Add quota headers
    if (response.headers) {
      response.headers["X-Mulo-Queries-Used"]  = String(quota.queries_used  || "unlimited");
      response.headers["X-Mulo-Queries-Limit"] = String(quota.queries_limit || "unlimited");
      response.headers["X-Mulo-Overage"]       = String(quota.overage || false);
    }

    await logQuery(client, apiKey.id, path, null, response.statusCode, startMs);
    return response;

  } finally {
    client.release();
  }
};
