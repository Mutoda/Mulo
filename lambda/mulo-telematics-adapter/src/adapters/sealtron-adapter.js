/**
 * MUḼO TELEMATICS — SEALTRON ADAPTER
 * ─────────────────────────────────────────────────────────────────────────
 * Adapter for Sealtron IoT tracking devices (Teltonika hardware).
 *
 * Architecture:
 *   Sealtron devices (Teltonika FMB/FMC) → Fleet platform (Wialon/Navixy/custom)
 *   → THIS ADAPTER (polls REST API) → Muḽo Telematics normaliser
 *
 * Swap strategy:
 *   If Sealtron runs Wialon   → use WialonClient below (default)
 *   If Sealtron runs Navixy   → swap WialonClient for NavixyClient (same interface)
 *   If Sealtron runs custom   → implement SealtronCustomClient (same interface)
 *   Only the client class changes. Normaliser and scoring are untouched.
 *
 * Lambda entry point: handler() — invoked every 60s by EventBridge rule
 *
 * Environment variables:
 *   SEALTRON_PLATFORM    — "wialon" | "navixy" | "custom"
 *   SEALTRON_API_BASE    — https://[fleet-platform]/wialon/ajax.html  (Wialon)
 *                          https://api.navixy.com/v2  (Navixy)
 *   SEALTRON_API_TOKEN   — API token (from Secrets Manager)
 *   KINESIS_STREAM_NAME  — mulo-telematics-raw
 *   AWS_REGION           — af-south-1
 */

"use strict";

const https   = require("https");
const { KinesisClient, PutRecordsCommand } = require("@aws-sdk/client-kinesis");
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const { lookupAVL, convertValue } = require("./teltonika-avl-dictionary");

const kinesis = new KinesisClient({ region: process.env.AWS_REGION || "af-south-1" });
const secrets = new SecretsManagerClient({ region: process.env.AWS_REGION || "af-south-1" });

// ── Secret loader ──────────────────────────────────────────────────────────
let _cachedToken = null;
async function getApiToken() {
  if (_cachedToken) return _cachedToken;
  const cmd = new GetSecretValueCommand({ SecretId: "mulo/telematics/sealtron" });
  const res = await secrets.send(cmd);
  const parsed = JSON.parse(res.SecretString);
  _cachedToken = parsed.apiToken;
  return _cachedToken;
}

// ── HTTP helper ────────────────────────────────────────────────────────────
function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON parse error: ${data.slice(0, 200)}`)); }
      });
    }).on("error", reject);
  });
}

function httpPost(url, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const urlObj  = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) }
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON parse error: ${data.slice(0, 200)}`)); }
      });
    });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

// ══════════════════════════════════════════════════════════════════════════
// WIALON CLIENT
// Wialon is the most common fleet platform for Teltonika-based trackers in SA.
// API docs: sdk.wialon.com/wiki/en/sidebar/remoteapi/apiref/apiref
// ══════════════════════════════════════════════════════════════════════════
class WialonClient {
  constructor(baseUrl, token) {
    this.base   = baseUrl;   // e.g. https://hosting.wialon.com/wialon/ajax.html
    this.token  = token;
    this.sid    = null;      // session ID — refreshed on auth
  }

  // Authenticate and get session ID
  async login() {
    const url = `${this.base}?svc=token/login&params={"token":"${this.token}"}`;
    const res = await httpGet(url);
    if (res.error) throw new Error(`Wialon login failed: error ${res.error}`);
    this.sid = res.eid;
    console.log(`[Wialon] Authenticated. Session: ${this.sid}`);
    return this.sid;
  }

  // Build a Wialon API URL for a given service
  _url(svc, params) {
    return `${this.base}?svc=${svc}&params=${encodeURIComponent(JSON.stringify(params))}&sid=${this.sid}`;
  }

  /**
   * Get all units (vehicles) in the account.
   * Returns array of: { id, name, imei, last_position }
   */
  async getUnits() {
    const res = await httpGet(this._url("core/search_items", {
      spec: {
        itemsType: "avl_unit",
        propName: "sys_name",
        propValueMask: "*",
        sortType: "sys_name"
      },
      force: 1,
      flags: 0x00000001 | // base data
             0x00000100 | // last message
             0x00000400,  // custom fields (registration number etc)
      from: 0,
      to: 0
    }));

    if (!res || !res.items) throw new Error("Wialon getUnits: no items returned");

    return res.items.map(unit => ({
      id:           unit.id,
      name:         unit.nm,
      imei:         unit.uid,
      phone:        unit.ph,
      vrn:          this._extractVRN(unit),       // vehicle registration number
      last_message: this._parseLastMessage(unit),
    }));
  }

  // Extract vehicle registration from custom fields
  _extractVRN(unit) {
    if (!unit.flds) return null;
    for (const key of Object.keys(unit.flds)) {
      const field = unit.flds[key];
      if (field.n && /reg|vrn|plate|registration/i.test(field.n)) {
        return field.v;
      }
    }
    return null;
  }

  // Parse the last message packet embedded in unit search result
  _parseLastMessage(unit) {
    if (!unit.pos) return null;
    return {
      timestamp:  unit.lmsg?.t  || null,
      lat:        unit.pos?.y   || null,
      lng:        unit.pos?.x   || null,
      speed_kmh:  unit.pos?.s   || 0,
      heading:    unit.pos?.c   || 0,
      altitude:   unit.pos?.z   || 0,
      satellites: unit.pos?.sc  || 0,
      params:     unit.lmsg?.p  || {},   // raw IO elements as key-value
    };
  }

  /**
   * Get trip history for a unit between two timestamps.
   * Returns array of trip objects with IO element summaries.
   */
  async getTrips(unitId, fromTs, toTs) {
    const res = await httpGet(this._url("messages/load_interval", {
      itemId:   unitId,
      timeFrom: fromTs,
      timeTo:   toTs,
      flags:    0x0000,
      flagsMask: 0xFF00,
      loadCount: 0xFFFFFFFF
    }));
    if (!res || !res.messages) return [];
    return this._groupIntoTrips(res.messages);
  }

  // Group raw messages into trip objects
  // A trip starts on ignition=ON, ends on ignition=OFF
  _groupIntoTrips(messages) {
    const trips = [];
    let currentTrip = null;

    for (const msg of messages) {
      const params = msg.p || {};
      const ignition = params.io_239 === 1 || params.ign === 1;

      if (ignition && !currentTrip) {
        // Trip start
        currentTrip = {
          start_ts:    msg.t,
          start_lat:   msg.pos?.y,
          start_lng:   msg.pos?.x,
          messages:    [msg],
          harsh_brakes: 0,
          harsh_accels: 0,
          harsh_corners: 0,
          speeding_events: 0,
          max_speed_kmh: 0,
          idling_seconds: 0,
        };
      } else if (!ignition && currentTrip) {
        // Trip end
        currentTrip.end_ts   = msg.t;
        currentTrip.end_lat  = msg.pos?.y;
        currentTrip.end_lng  = msg.pos?.x;
        currentTrip.messages.push(msg);
        trips.push(this._summariseTrip(currentTrip));
        currentTrip = null;
      } else if (currentTrip) {
        currentTrip.messages.push(msg);
        // Accumulate events
        if (params.io_247 === 1) currentTrip.harsh_brakes++;
        if (params.io_246 === 1) currentTrip.harsh_accels++;
        if (params.io_248 === 1) currentTrip.harsh_corners++;
        if (params.io_250 === 1) currentTrip.speeding_events++;
        if (params.io_251 === 1) currentTrip.idling_seconds += 60; // approx
        const spd = msg.pos?.s || 0;
        if (spd > currentTrip.max_speed_kmh) currentTrip.max_speed_kmh = spd;
      }
    }

    // Close any open trip (device still on at end of window)
    if (currentTrip && currentTrip.messages.length > 1) {
      const last = currentTrip.messages[currentTrip.messages.length - 1];
      currentTrip.end_ts  = last.t;
      currentTrip.end_lat = last.pos?.y;
      currentTrip.end_lng = last.pos?.x;
      trips.push(this._summariseTrip(currentTrip));
    }

    return trips;
  }

  _summariseTrip(trip) {
    const first = trip.messages[0];
    const last  = trip.messages[trip.messages.length - 1];
    const odom_start = first.p?.io_16 || first.p?.io_199 || 0;
    const odom_end   = last.p?.io_16  || last.p?.io_199  || 0;
    const dist_m     = odom_end - odom_start;

    // Night driving: 22:00–04:00 SAST (UTC+2)
    const startHour = new Date((trip.start_ts + 7200) * 1000).getUTCHours();
    const isNight   = startHour >= 22 || startHour < 4;

    // Duration
    const duration_s = (trip.end_ts || trip.start_ts) - trip.start_ts;

    return {
      start_ts:          trip.start_ts,
      end_ts:            trip.end_ts,
      duration_s,
      start_lat:         trip.start_lat,
      start_lng:         trip.start_lng,
      end_lat:           trip.end_lat,
      end_lng:           trip.end_lng,
      distance_km:       Math.round((dist_m / 1000) * 100) / 100,
      max_speed_kmh:     trip.max_speed_kmh,
      harsh_brake_count: trip.harsh_brakes,
      harsh_accel_count: trip.harsh_accels,
      harsh_corner_count: trip.harsh_corners,
      speeding_event_count: trip.speeding_events,
      idling_s:          trip.idling_seconds,
      night_driving:     isNight,
      // Battery snapshot from last message
      vehicle_battery_v: last.p?.io_66 ? last.p.io_66 / 1000 : null,
    };
  }

  /**
   * Get current battery voltage for all units (heartbeat poll).
   * Used for battery health monitoring between trips.
   */
  async getBatterySnapshots(unitIds) {
    const snapshots = [];
    for (const id of unitIds) {
      const res = await httpGet(this._url("messages/load_last", {
        itemId: id,
        lastTime: 0,
        lastCount: 1,
        flags: 0x0000,
        flagsMask: 0xFF00,
        loadCount: 1
      }));
      if (res && res.messages && res.messages.length > 0) {
        const msg = res.messages[0];
        snapshots.push({
          unit_id:           id,
          timestamp:         msg.t,
          vehicle_battery_v: msg.p?.io_66 ? msg.p.io_66 / 1000 : null,
          device_battery_v:  msg.p?.io_67 ? msg.p.io_67 / 1000 : null,
          ignition:          msg.p?.io_239 === 1,
        });
      }
    }
    return snapshots;
  }
}

// ══════════════════════════════════════════════════════════════════════════
// NAVIXY CLIENT
// Alternative fleet platform — same interface as WialonClient.
// Swap by setting SEALTRON_PLATFORM=navixy
// ══════════════════════════════════════════════════════════════════════════
class NavixyClient {
  constructor(baseUrl, token) {
    this.base  = baseUrl;   // https://api.navixy.com/v2
    this.token = token;
  }

  async getUnits() {
    const res = await httpPost(`${this.base}/tracker/list`, {
      hash: this.token
    });
    if (!res || !res.list) throw new Error("Navixy getUnits failed");
    return res.list.map(t => ({
      id:    t.id,
      name:  t.label,
      imei:  t.source?.device_id || null,
      vrn:   t.source?.model     || null,
      last_message: null   // fetched separately
    }));
  }

  async getTrips(unitId, fromTs, toTs) {
    const res = await httpPost(`${this.base}/track/list`, {
      hash:       this.token,
      tracker_id: unitId,
      from:       new Date(fromTs * 1000).toISOString(),
      to:         new Date(toTs   * 1000).toISOString(),
    });
    if (!res || !res.list) return [];
    return res.list.map(trip => ({
      start_ts:          Math.floor(new Date(trip.start_date).getTime() / 1000),
      end_ts:            Math.floor(new Date(trip.end_date).getTime() / 1000),
      duration_s:        trip.duration,
      distance_km:       trip.length,
      max_speed_kmh:     trip.max_speed,
      harsh_brake_count: trip.events?.filter(e => e.type === "harsh_braking").length  || 0,
      harsh_accel_count: trip.events?.filter(e => e.type === "harsh_acceleration").length || 0,
      harsh_corner_count: trip.events?.filter(e => e.type === "harsh_cornering").length || 0,
      speeding_event_count: trip.events?.filter(e => e.type === "speeding").length || 0,
    }));
  }

  async getBatterySnapshots(unitIds) {
    const snapshots = [];
    for (const id of unitIds) {
      const res = await httpPost(`${this.base}/tracker/readings`, {
        hash: this.token, tracker_id: id
      });
      if (res && res.inputs) {
        const extVolt = res.inputs.find(i => i.label?.toLowerCase().includes("external"));
        snapshots.push({
          unit_id:           id,
          timestamp:         Math.floor(Date.now() / 1000),
          vehicle_battery_v: extVolt ? extVolt.value / 1000 : null,
        });
      }
    }
    return snapshots;
  }
}

// ══════════════════════════════════════════════════════════════════════════
// ADAPTER FACTORY — selects client based on SEALTRON_PLATFORM env var
// ══════════════════════════════════════════════════════════════════════════
async function buildClient() {
  const token    = await getApiToken();
  const platform = (process.env.SEALTRON_PLATFORM || "wialon").toLowerCase();
  const baseUrl  = process.env.SEALTRON_API_BASE;

  switch (platform) {
    case "navixy":  return new NavixyClient(baseUrl, token);
    case "wialon":
    default:        return new WialonClient(baseUrl, token);
  }
}

// ══════════════════════════════════════════════════════════════════════════
// KINESIS PUBLISHER
// Publishes normalised raw events to the mulo-telematics-raw stream.
// ══════════════════════════════════════════════════════════════════════════
async function publishToKinesis(records) {
  if (!records || records.length === 0) return;

  // Kinesis PutRecords accepts up to 500 records per call
  const BATCH_SIZE = 500;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const cmd = new PutRecordsCommand({
      StreamName: process.env.KINESIS_STREAM_NAME || "mulo-telematics-raw",
      Records: batch.map(r => ({
        Data:         Buffer.from(JSON.stringify(r)),
        PartitionKey: r.unit_id?.toString() || "default",
      }))
    });
    const res = await kinesis.send(cmd);
    if (res.FailedRecordCount > 0) {
      console.error(`[Kinesis] ${res.FailedRecordCount} records failed`);
    }
    console.log(`[Kinesis] Published ${batch.length - res.FailedRecordCount} records`);
  }
}

// ══════════════════════════════════════════════════════════════════════════
// LAMBDA HANDLER
// EventBridge rule triggers this every 60 seconds.
// ══════════════════════════════════════════════════════════════════════════
exports.handler = async (event) => {
  console.log("[SealtronAdapter] Invoked", JSON.stringify(event));

  const client = await buildClient();

  // Wialon requires login; Navixy uses token in each request
  if (client instanceof WialonClient) {
    await client.login();
  }

  // 1. Get all tracked vehicles
  const units = await client.getUnits();
  console.log(`[SealtronAdapter] ${units.length} units found`);

  const now    = Math.floor(Date.now() / 1000);
  const fromTs = now - 120;  // last 2 minutes — overlap ensures no gaps

  const kinesisRecords = [];

  // 2. For each unit, fetch trips and battery snapshot
  for (const unit of units) {
    try {
      // Trips
      const trips = await client.getTrips(unit.id, fromTs, now);
      for (const trip of trips) {
        kinesisRecords.push({
          source:        "sealtron",
          record_type:   "trip",
          unit_id:       unit.id,
          unit_name:     unit.name,
          imei:          unit.imei,
          vrn:           unit.vrn,
          ingested_at:   now,
          ...trip
        });
      }

      // Battery snapshot (every invocation = ~60s cadence)
      const [battery] = await client.getBatterySnapshots([unit.id]);
      if (battery) {
        kinesisRecords.push({
          source:       "sealtron",
          record_type:  "battery_snapshot",
          unit_id:      unit.id,
          unit_name:    unit.name,
          imei:         unit.imei,
          vrn:          unit.vrn,
          ingested_at:  now,
          ...battery
        });
      }

    } catch (err) {
      console.error(`[SealtronAdapter] Error processing unit ${unit.id}:`, err.message);
    }
  }

  // 3. Publish to Kinesis
  await publishToKinesis(kinesisRecords);

  return {
    statusCode: 200,
    units_processed: units.length,
    records_published: kinesisRecords.length,
  };
};
