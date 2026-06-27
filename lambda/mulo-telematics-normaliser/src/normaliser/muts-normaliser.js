/**
 * MUḼO TELEMATICS — MUTS NORMALISER
 * ─────────────────────────────────────────────────────────────────────────
 * Consumes raw records from the mulo-telematics-raw Kinesis stream,
 * normalises them into the Muḽo Unified Telematics Schema (MUTS),
 * and writes to the telem_trips / telem_battery tables in RDS PostgreSQL.
 *
 * Lambda trigger: Kinesis stream mulo-telematics-raw (batch size 100)
 *
 * MUTS (Muḽo Unified Telematics Schema) — canonical output fields:
 *
 *   IDENTITY
 *   ├─ mulo_vehicle_id    — UUID in telem_vehicles table
 *   ├─ vrn                — vehicle registration number (normalised)
 *   ├─ imei               — tracker IMEI
 *   └─ source             — "sealtron" | "cartrack" | "mix" | ...
 *
 *   TRIP (record_type = "trip")
 *   ├─ trip_id            — UUID
 *   ├─ start_ts / end_ts  — Unix timestamps
 *   ├─ duration_s         — seconds
 *   ├─ distance_km        — kilometres
 *   ├─ max_speed_kmh
 *   ├─ harsh_brake_count
 *   ├─ harsh_accel_count
 *   ├─ harsh_corner_count
 *   ├─ speeding_event_count
 *   ├─ idling_s           — seconds at idle
 *   ├─ night_driving      — boolean (22:00–04:00 SAST)
 *   └─ vehicle_battery_v  — voltage at end of trip
 *
 *   BATTERY SNAPSHOT (record_type = "battery_snapshot")
 *   ├─ snapshot_id        — UUID
 *   ├─ timestamp          — Unix timestamp
 *   ├─ vehicle_battery_v  — vehicle battery voltage
 *   ├─ device_battery_v   — tracker device battery
 *   └─ ignition           — boolean
 */

"use strict";

const { Pool }  = require("pg");
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

// ── VRN normaliser ─────────────────────────────────────────────────────────
// SA vehicle registration numbers vary by province format:
// GP: AAA 000 GP  | WC: CA 000-000  | KZN: ND 000 GP
// Normalise to uppercase, strip spaces and hyphens for matching.
function normaliseVRN(vrn) {
  if (!vrn) return null;
  return vrn.toUpperCase().replace(/[\s\-]/g, "").trim();
}

// ── Vehicle registry ───────────────────────────────────────────────────────
// Look up or create a vehicle record in telem_vehicles.
// Returns mulo_vehicle_id (UUID).
const vehicleCache = {};

async function resolveVehicleId(client, record) {
  const vrn  = normaliseVRN(record.vrn);
  const imei = record.imei;
  const cacheKey = vrn || imei;

  if (vehicleCache[cacheKey]) return vehicleCache[cacheKey];

  // Try lookup by VRN first, then IMEI
  let res = null;
  if (vrn) {
    res = await client.query(
      `SELECT id FROM telem_vehicles WHERE vrn = $1 LIMIT 1`, [vrn]
    );
  }
  if (!res?.rowCount && imei) {
    res = await client.query(
      `SELECT id FROM telem_vehicles WHERE imei = $1 LIMIT 1`, [imei]
    );
  }

  if (res?.rowCount > 0) {
    vehicleCache[cacheKey] = res.rows[0].id;
    return res.rows[0].id;
  }

  // Insert new vehicle
  const newId = randomUUID();
  await client.query(`
    INSERT INTO telem_vehicles (id, vrn, imei, source, unit_name, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    ON CONFLICT (imei) DO UPDATE SET vrn = EXCLUDED.vrn, updated_at = NOW()
  `, [newId, vrn, imei, record.source, record.unit_name]);

  vehicleCache[cacheKey] = newId;
  return newId;
}

// ── MUTS normalisation ─────────────────────────────────────────────────────
function normaliseTrip(raw, vehicleId) {
  return {
    id:                   randomUUID(),
    mulo_vehicle_id:      vehicleId,
    source:               raw.source,
    start_ts:             raw.start_ts,
    end_ts:               raw.end_ts,
    duration_s:           raw.duration_s           || null,
    distance_km:          raw.distance_km          || 0,
    max_speed_kmh:        raw.max_speed_kmh         || 0,
    harsh_brake_count:    raw.harsh_brake_count     || 0,
    harsh_accel_count:    raw.harsh_accel_count     || 0,
    harsh_corner_count:   raw.harsh_corner_count    || 0,
    speeding_event_count: raw.speeding_event_count  || 0,
    idling_s:             raw.idling_s              || 0,
    night_driving:        raw.night_driving         || false,
    vehicle_battery_v:    raw.vehicle_battery_v     || null,
    ingested_at:          raw.ingested_at,
  };
}

function normaliseSnapshot(raw, vehicleId) {
  return {
    id:                randomUUID(),
    mulo_vehicle_id:   vehicleId,
    source:            raw.source,
    timestamp:         raw.timestamp,
    vehicle_battery_v: raw.vehicle_battery_v || null,
    device_battery_v:  raw.device_battery_v  || null,
    ignition:          raw.ignition          || false,
    ingested_at:       raw.ingested_at,
  };
}

// ── DB writers ─────────────────────────────────────────────────────────────
async function writeTrip(client, trip) {
  await client.query(`
    INSERT INTO telem_trips (
      id, mulo_vehicle_id, source,
      start_ts, end_ts, duration_s, distance_km, max_speed_kmh,
      harsh_brake_count, harsh_accel_count, harsh_corner_count,
      speeding_event_count, idling_s, night_driving,
      vehicle_battery_v, ingested_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,to_timestamp($16)
    )
    ON CONFLICT (mulo_vehicle_id, start_ts) DO NOTHING
  `, [
    trip.id, trip.mulo_vehicle_id, trip.source,
    trip.start_ts   ? new Date(trip.start_ts * 1000)   : null,
    trip.end_ts     ? new Date(trip.end_ts   * 1000)   : null,
    trip.duration_s, trip.distance_km, trip.max_speed_kmh,
    trip.harsh_brake_count, trip.harsh_accel_count, trip.harsh_corner_count,
    trip.speeding_event_count, trip.idling_s, trip.night_driving,
    trip.vehicle_battery_v, trip.ingested_at,
  ]);
}

async function writeSnapshot(client, snap) {
  await client.query(`
    INSERT INTO telem_battery_snapshots (
      id, mulo_vehicle_id, source,
      snapshot_ts, vehicle_battery_v, device_battery_v, ignition, ingested_at
    ) VALUES (
      $1,$2,$3,to_timestamp($4),$5,$6,$7,to_timestamp($8)
    )
    ON CONFLICT (mulo_vehicle_id, snapshot_ts) DO NOTHING
  `, [
    snap.id, snap.mulo_vehicle_id, snap.source,
    snap.timestamp, snap.vehicle_battery_v,
    snap.device_battery_v, snap.ignition, snap.ingested_at,
  ]);
}

// ── Lambda handler ─────────────────────────────────────────────────────────
exports.handler = async (event) => {
  console.log(`[Normaliser] Received ${event.Records?.length || 0} Kinesis records`);

  const client = await pool.connect();
  let trips_written = 0, snapshots_written = 0, errors = 0;

  try {
    for (const kRecord of event.Records) {
      let raw;
      try {
        raw = JSON.parse(Buffer.from(kRecord.kinesis.data, "base64").toString("utf8"));
      } catch (e) {
        console.error("[Normaliser] Failed to parse Kinesis record:", e.message);
        errors++;
        continue;
      }

      try {
        const vehicleId = await resolveVehicleId(client, raw);

        if (raw.record_type === "trip") {
          const trip = normaliseTrip(raw, vehicleId);
          await writeTrip(client, trip);
          trips_written++;

          // Trigger score recalculation asynchronously (fire and forget)
          // The scoring Lambda is invoked separately by a Kinesis consumer
          // No action needed here — scoring reads from telem_trips directly

        } else if (raw.record_type === "battery_snapshot") {
          const snap = normaliseSnapshot(raw, vehicleId);
          await writeSnapshot(client, snap);
          snapshots_written++;
        }

      } catch (err) {
        console.error(`[Normaliser] Error processing record for unit ${raw.unit_id}:`, err.message);
        errors++;
      }
    }

  } finally {
    client.release();
  }

  console.log(`[Normaliser] Done. trips=${trips_written} snapshots=${snapshots_written} errors=${errors}`);
  return { trips_written, snapshots_written, errors };
};
