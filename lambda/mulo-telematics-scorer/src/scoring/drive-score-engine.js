/**
 * MUḼO TELEMATICS — DRIVE SCORE ENGINE
 * ─────────────────────────────────────────────────────────────────────────
 * Computes the Muḽo Drive Score (0–100) from normalised trip data
 * in the telem_trips table.
 *
 * Score components (total = 100):
 *   Braking behaviour      25%   harsh_brake_count / km
 *   Speed compliance       20%   speeding_event_count / km
 *   Acceleration           20%   harsh_accel_count / km
 *   Cornering              15%   harsh_corner_count / km
 *   Time of driving        10%   night_driving % of trips
 *   Mileage profile        10%   monthly km (frequency proxy)
 *
 * Score bands:
 *   85–100  Platinum   −15% to −20% premium adjustment
 *   70–84   Gold       −5%  to −14%
 *   55–69   Silver     no adjustment
 *   40–54   Bronze     +5%  to +15%
 *   0–39    High Risk  refer to underwriter
 *
 * Lambda trigger:
 *   Invoked by Kinesis stream consumer after normaliser writes trips.
 *   Can also be invoked directly via API Gateway GET /score/{vehicleId}
 *
 * Environment variables:
 *   DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
 *   SCORE_LOOKBACK_DAYS  — default 90 (3 months of data)
 *   MIN_TRIPS_REQUIRED   — default 10 (minimum trips before scoring)
 */

"use strict";

const { Pool }       = require("pg");
const { randomUUID } = require("crypto");

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl:      { rejectUnauthorized: false },
  max:      5,
});

const LOOKBACK_DAYS   = parseInt(process.env.SCORE_LOOKBACK_DAYS  || "90");
const MIN_TRIPS       = parseInt(process.env.MIN_TRIPS_REQUIRED    || "10");

// ── Component weights ──────────────────────────────────────────────────────
const WEIGHTS = {
  braking:      0.25,
  speeding:     0.20,
  acceleration: 0.20,
  cornering:    0.15,
  time:         0.10,
  mileage:      0.10,
};

// ── Per-km event rate thresholds ───────────────────────────────────────────
// These define what "perfect" (0 events/km) vs "worst" looks like.
// Rates above WORST get capped at 0 for that component.
const THRESHOLDS = {
  braking:      { perfect: 0, worst: 0.10 },  // harsh brakes per km
  speeding:     { perfect: 0, worst: 0.08 },  // speeding events per km
  acceleration: { perfect: 0, worst: 0.10 },  // harsh accels per km
  cornering:    { perfect: 0, worst: 0.12 },  // harsh corners per km
};

// ── Mileage score — monthly km bands ─────────────────────────────────────
// Lower mileage = lower risk. Very high mileage = higher exposure.
function mileageScore(monthly_km) {
  if (monthly_km <= 500)   return 100;   // very low mileage
  if (monthly_km <= 1000)  return 90;
  if (monthly_km <= 1500)  return 80;
  if (monthly_km <= 2000)  return 70;
  if (monthly_km <= 2500)  return 60;
  if (monthly_km <= 3000)  return 50;
  if (monthly_km <= 4000)  return 40;
  return 30;                             // 4000+ km/month = high exposure
}

// ── Rate-based component score ─────────────────────────────────────────────
function rateScore(events, km, component) {
  if (km <= 0) return 50;  // no data — neutral score
  const rate = events / km;
  const { perfect, worst } = THRESHOLDS[component];
  if (rate <= perfect) return 100;
  if (rate >= worst)   return 0;
  // Linear interpolation between perfect and worst
  return Math.round(100 * (1 - (rate - perfect) / (worst - perfect)));
}

// ── Night driving score ───────────────────────────────────────────────────
function nightScore(night_trip_pct) {
  if (night_trip_pct <= 0.05) return 100;
  if (night_trip_pct <= 0.10) return 85;
  if (night_trip_pct <= 0.20) return 70;
  if (night_trip_pct <= 0.30) return 55;
  if (night_trip_pct <= 0.40) return 40;
  return 25;
}

// ── Score band lookup ──────────────────────────────────────────────────────
function scoreBand(score) {
  if (score >= 85) return { band: "Platinum", premium_adjustment: -0.175 };
  if (score >= 70) return { band: "Gold",     premium_adjustment: -0.095 };
  if (score >= 55) return { band: "Silver",   premium_adjustment:  0.000 };
  if (score >= 40) return { band: "Bronze",   premium_adjustment:  0.100 };
  return             { band: "High Risk", premium_adjustment:  null };
}

// ── Confidence score ───────────────────────────────────────────────────────
// Confidence reflects data sufficiency. Low trip count = low confidence.
function confidenceScore(trip_count, data_days) {
  let conf = 1.0;
  if (trip_count < MIN_TRIPS)        conf *= 0.5;
  else if (trip_count < MIN_TRIPS*2) conf *= 0.75;
  if (data_days < 30)                conf *= 0.7;
  else if (data_days < 60)           conf *= 0.85;
  return Math.round(conf * 100) / 100;
}

// ── Main scorer ───────────────────────────────────────────────────────────
async function computeScore(vehicleId) {
  const client = await pool.connect();
  try {
    // Pull trips for lookback window
    const res = await client.query(`
      SELECT
        COUNT(*)::int                          AS trip_count,
        COALESCE(SUM(distance_km), 0)          AS total_km,
        COALESCE(SUM(harsh_brake_count), 0)    AS total_brakes,
        COALESCE(SUM(harsh_accel_count), 0)    AS total_accels,
        COALESCE(SUM(harsh_corner_count), 0)   AS total_corners,
        COALESCE(SUM(speeding_event_count), 0) AS total_speeding,
        COALESCE(AVG(CASE WHEN night_driving THEN 1 ELSE 0 END), 0) AS night_pct,
        MIN(start_ts)                          AS oldest_trip,
        MAX(start_ts)                          AS newest_trip
      FROM telem_trips
      WHERE mulo_vehicle_id = $1
        AND start_ts >= NOW() - INTERVAL '${LOOKBACK_DAYS} days'
    `, [vehicleId]);

    if (!res.rowCount) throw new Error(`No trip data for vehicle ${vehicleId}`);

    const d = res.rows[0];
    const trip_count = parseInt(d.trip_count);
    const total_km   = parseFloat(d.total_km);
    const data_days  = d.oldest_trip
      ? Math.ceil((Date.now()/1000 - d.oldest_trip.getTime()/1000) / 86400)
      : 0;

    // Monthly km (annualise then divide by 12)
    const monthly_km = data_days > 0
      ? (total_km / data_days) * 30
      : 0;

    // Component scores
    const components = {
      braking:      rateScore(parseInt(d.total_brakes),   total_km, "braking"),
      speeding:     rateScore(parseInt(d.total_speeding), total_km, "speeding"),
      acceleration: rateScore(parseInt(d.total_accels),   total_km, "acceleration"),
      cornering:    rateScore(parseInt(d.total_corners),  total_km, "cornering"),
      time:         nightScore(parseFloat(d.night_pct)),
      mileage:      mileageScore(monthly_km),
    };

    // Weighted composite score
    const raw_score =
      components.braking      * WEIGHTS.braking      +
      components.speeding     * WEIGHTS.speeding      +
      components.acceleration * WEIGHTS.acceleration  +
      components.cornering    * WEIGHTS.cornering     +
      components.time         * WEIGHTS.time          +
      components.mileage      * WEIGHTS.mileage;

    const score      = Math.round(raw_score);
    const { band, premium_adjustment } = scoreBand(score);
    const confidence = confidenceScore(trip_count, data_days);

    const scoreRecord = {
      id:                 randomUUID(),
      mulo_vehicle_id:    vehicleId,
      score,
      band,
      premium_adjustment,
      confidence,
      trip_count,
      total_km:           Math.round(total_km),
      data_days,
      monthly_km_avg:     Math.round(monthly_km),
      component_braking:      components.braking,
      component_speeding:     components.speeding,
      component_acceleration: components.acceleration,
      component_cornering:    components.cornering,
      component_time:         components.time,
      component_mileage:      components.mileage,
      computed_at:        new Date(),
    };

    // Persist to telem_scores
    await client.query(`
      INSERT INTO telem_scores (
        id, mulo_vehicle_id, score, band, premium_adjustment, confidence,
        trip_count, total_km, data_days, monthly_km_avg,
        component_braking, component_speeding, component_acceleration,
        component_cornering, component_time, component_mileage, computed_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW()
      )
    `, [
      scoreRecord.id, vehicleId, score, band, premium_adjustment, confidence,
      trip_count, scoreRecord.total_km, data_days, scoreRecord.monthly_km_avg,
      components.braking, components.speeding, components.acceleration,
      components.cornering, components.time, components.mileage,
    ]);

    // Update vehicle record with latest score
    await client.query(`
      UPDATE telem_vehicles
      SET current_score = $1, current_band = $2, score_updated_at = NOW()
      WHERE id = $3
    `, [score, band, vehicleId]);

    console.log(`[Scorer] Vehicle ${vehicleId}: score=${score} band=${band} confidence=${confidence}`);
    return scoreRecord;

  } finally {
    client.release();
  }
}

// ── API response formatter ─────────────────────────────────────────────────
// Returns the JSON structure exposed to insurers via GET /telematics/score
function formatApiResponse(scoreRecord, tracker_source) {
  return {
    mulo_vehicle_id:    scoreRecord.mulo_vehicle_id,
    drive_score:        scoreRecord.score,
    score_band:         scoreRecord.band,
    premium_adjustment: scoreRecord.premium_adjustment,
    confidence:         scoreRecord.confidence,
    data_months:        Math.round(scoreRecord.data_days / 30 * 10) / 10,
    trip_count:         scoreRecord.trip_count,
    total_km:           scoreRecord.total_km,
    monthly_km_avg:     scoreRecord.monthly_km_avg,
    tracker_source:     tracker_source || "sealtron",
    components: {
      braking:      scoreRecord.component_braking,
      speeding:     scoreRecord.component_speeding,
      acceleration: scoreRecord.component_acceleration,
      cornering:    scoreRecord.component_cornering,
      time_of_day:  scoreRecord.component_time,
      mileage:      scoreRecord.component_mileage,
    },
    last_updated: scoreRecord.computed_at,
  };
}

// ── Lambda handler ─────────────────────────────────────────────────────────
exports.handler = async (event) => {
  // Called from:
  //   1. API Gateway (GET /telematics/score/{vehicleId}) — event.pathParameters
  //   2. Kinesis consumer trigger — event.vehicleId directly
  //   3. Batch re-score job — event.vehicleIds array

  if (event.vehicleIds && Array.isArray(event.vehicleIds)) {
    // Batch mode
    const results = [];
    for (const vid of event.vehicleIds) {
      try {
        const rec = await computeScore(vid);
        results.push({ vehicleId: vid, score: rec.score, band: rec.band });
      } catch (err) {
        results.push({ vehicleId: vid, error: err.message });
      }
    }
    return { results };
  }

  const vehicleId = event.vehicleId
    || event.pathParameters?.vehicleId
    || event.pathParameters?.id;

  if (!vehicleId) {
    return { statusCode: 400, body: JSON.stringify({ error: "vehicleId required" }) };
  }

  try {
    const rec = await computeScore(vehicleId);
    const response = formatApiResponse(rec);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(response),
    };
  } catch (err) {
    console.error("[Scorer] Error:", err.message);
    return {
      statusCode: err.message.includes("No trip data") ? 404 : 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

module.exports.computeScore      = computeScore;
module.exports.formatApiResponse = formatApiResponse;
module.exports.scoreBand         = scoreBand;
