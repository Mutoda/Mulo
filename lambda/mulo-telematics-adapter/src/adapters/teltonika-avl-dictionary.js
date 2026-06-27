/**
 * TELTONIKA AVL ELEMENT ID DICTIONARY
 * ─────────────────────────────────────────────────────────────────────────
 * Source: Teltonika Wiki — wiki.teltonika-gps.com/view/FMB_AVL_ID_List
 * Applies to: FMB140, FMB920, FMB125, FMC130, FMC640, FMT100 series
 *
 * This file is the single source of truth for mapping raw Teltonika IO
 * element IDs to the Muḽo Unified Telematics Schema (MUTS).
 *
 * Each entry:
 *   id       — Teltonika AVL IO element ID (integer)
 *   name     — Human-readable name
 *   unit     — Raw unit from device
 *   muts     — Target MUTS field name (null = store raw, not mapped to MUTS)
 *   convert  — Optional conversion function string (applied at normalisation)
 *   priority — 1=critical (always parse), 2=important, 3=supplementary
 */

const AVL_DICTIONARY = {

  // ── POSITIONING ──────────────────────────────────────────────────────────
  // GPS coordinates come in the packet header, not as IO elements
  // but we include them here for documentation completeness
  GPS_LATITUDE:   { id: "gps_lat",  name: "GPS Latitude",   unit: "degrees",  muts: "lat",          priority: 1 },
  GPS_LONGITUDE:  { id: "gps_lng",  name: "GPS Longitude",  unit: "degrees",  muts: "lng",          priority: 1 },
  GPS_ALTITUDE:   { id: "gps_alt",  name: "GPS Altitude",   unit: "metres",   muts: "altitude_m",   priority: 3 },
  GPS_ANGLE:      { id: "gps_ang",  name: "GPS Heading",    unit: "degrees",  muts: "heading_deg",  priority: 3 },
  GPS_SATELLITES: { id: "gps_sat",  name: "Satellites",     unit: "count",    muts: "gps_sats",     priority: 2 },
  GPS_SPEED:      { id: "gps_spd",  name: "GPS Speed",      unit: "km/h",     muts: "speed_kmh",    priority: 1 },

  // ── CRITICAL IO ELEMENTS (Priority 1) ───────────────────────────────────
  239: {
    id: 239, name: "Ignition",
    unit: "boolean",          // 0 = off, 1 = on
    muts: "ignition",
    convert: "toBoolean",
    priority: 1
  },
  240: {
    id: 240, name: "Movement",
    unit: "boolean",          // 0 = stationary, 1 = moving
    muts: "moving",
    convert: "toBoolean",
    priority: 1
  },
  199: {
    id: 199, name: "Trip Odometer",
    unit: "metres",           // cumulative metres since ignition on
    muts: "trip_distance_m",
    convert: "metresToKm",    // → km
    priority: 1
  },
  16: {
    id: 16, name: "Total Odometer",
    unit: "metres",           // lifetime odometer
    muts: "odometer_km",
    convert: "metresToKm",
    priority: 1
  },

  // ── DRIVING BEHAVIOUR (Priority 1) ──────────────────────────────────────
  247: {
    id: 247, name: "Harsh Braking",
    unit: "boolean",          // 1 = harsh brake event detected
    muts: "harsh_brake_event",
    convert: "toBoolean",
    priority: 1,
    threshold_g: 0.3          // default G threshold on FMB devices
  },
  246: {
    id: 246, name: "Harsh Acceleration",
    unit: "boolean",
    muts: "harsh_accel_event",
    convert: "toBoolean",
    priority: 1,
    threshold_g: 0.3
  },
  248: {
    id: 248, name: "Harsh Cornering",
    unit: "boolean",
    muts: "harsh_corner_event",
    convert: "toBoolean",
    priority: 1,
    threshold_g: 0.3
  },
  253: {
    id: 253, name: "Green Driving Type",
    unit: "enum",             // 1=harsh_accel, 2=harsh_brake, 3=harsh_corner
    muts: "eco_event_type",
    priority: 1
  },
  254: {
    id: 254, name: "Green Driving Value",
    unit: "mG",               // milliG force at event
    muts: "eco_event_mg",
    convert: "mGtoG",         // divide by 1000 → G
    priority: 1
  },

  // ── POWER & BATTERY (Priority 1) ────────────────────────────────────────
  66: {
    id: 66, name: "External Voltage",
    unit: "mV",               // vehicle battery / alternator voltage
    muts: "vehicle_battery_mv",
    convert: null,            // store raw mV, convert to V in normaliser
    priority: 1
  },
  67: {
    id: 67, name: "Battery Voltage",
    unit: "mV",               // internal device backup battery
    muts: "device_battery_mv",
    priority: 2
  },
  68: {
    id: 68, name: "Battery Current",
    unit: "mA",
    muts: null,               // supplementary — store raw
    priority: 3
  },
  113: {
    id: 113, name: "Battery Level",
    unit: "percent",          // 0–100
    muts: "device_battery_pct",
    priority: 2
  },

  // ── OBD / CAN BUS (Priority 2 — device-dependent) ───────────────────────
  // Available when Teltonika device is connected to OBD-II port
  // FMB140 has built-in OBD; FMB920 requires OBD cable
  36: {
    id: 36, name: "Engine RPM",
    unit: "RPM",
    muts: "engine_rpm",
    priority: 2,
    requires: "OBD"
  },
  37: {
    id: 37, name: "Vehicle Speed (OBD)",
    unit: "km/h",             // cross-check against GPS speed
    muts: "obd_speed_kmh",
    priority: 2,
    requires: "OBD"
  },
  31: {
    id: 31, name: "Coolant Temperature",
    unit: "°C",
    muts: "coolant_temp_c",
    priority: 2,
    requires: "OBD"
  },
  32: {
    id: 32, name: "Throttle Position",
    unit: "percent",
    muts: "throttle_pct",
    priority: 2,
    requires: "OBD"
  },
  40: {
    id: 40, name: "Fuel Level",
    unit: "percent",
    muts: "fuel_level_pct",
    priority: 2,
    requires: "OBD"
  },
  48: {
    id: 48, name: "Fuel Consumed",
    unit: "ml",               // cumulative fuel consumption
    muts: "fuel_consumed_ml",
    priority: 2,
    requires: "OBD"
  },
  89: {
    id: 89, name: "Fuel Rate",
    unit: "ml/100km",
    muts: "fuel_rate_ml_100km",
    priority: 3,
    requires: "OBD"
  },
  30: {
    id: 30, name: "Number of DTC",
    unit: "count",            // active diagnostic trouble codes
    muts: "dtc_count",
    priority: 2,
    requires: "OBD"
  },
  182: {
    id: 182, name: "DTC Codes",
    unit: "hex_string",       // raw DTC codes — parse separately
    muts: "dtc_codes_raw",
    priority: 2,
    requires: "OBD"
  },

  // ── NETWORK & SIGNAL (Priority 3) ────────────────────────────────────────
  21: {
    id: 21, name: "GSM Signal Strength",
    unit: "0–5",
    muts: null,
    priority: 3
  },
  0: {
    id: 0, name: "Digital Input 1",
    unit: "boolean",          // often wired to panic button or door sensor
    muts: "digital_input_1",
    priority: 3
  },
  1: {
    id: 1, name: "Digital Input 2",
    unit: "boolean",
    muts: "digital_input_2",
    priority: 3
  },

  // ── SPEEDING (Priority 1) ─────────────────────────────────────────────────
  // Teltonika calculates speeding vs configurable limit on-device
  250: {
    id: 250, name: "Trip Event (Speeding)",
    unit: "boolean",
    muts: "speeding_event",
    convert: "toBoolean",
    priority: 1
  },

  // ── IDLING (Priority 2) ───────────────────────────────────────────────────
  251: {
    id: 251, name: "Idling",
    unit: "boolean",          // 1 = idling detected (ignition on, speed = 0)
    muts: "idling",
    convert: "toBoolean",
    priority: 2
  },
  200: {
    id: 200, name: "Sleep Mode",
    unit: "enum",             // 0=no sleep, 1=gps sleep, 2=deep sleep
    muts: "sleep_mode",
    priority: 3
  },
};

/**
 * CONVERSION FUNCTIONS
 * Applied by the normaliser when converting raw IO element values to MUTS.
 */
const CONVERTERS = {
  toBoolean:  (v) => v === 1 || v === true || v === "1",
  metresToKm: (v) => Math.round((v / 1000) * 100) / 100,
  mGtoG:      (v) => Math.round((v / 1000) * 1000) / 1000,
  mVtoV:      (v) => Math.round((v / 1000) * 100) / 100,
};

/**
 * Lookup an AVL element by numeric ID.
 * Returns the dictionary entry or null if unknown.
 */
function lookupAVL(id) {
  return AVL_DICTIONARY[id] || null;
}

/**
 * Apply conversion function to a raw value.
 */
function convertValue(entry, rawValue) {
  if (!entry || !entry.convert) return rawValue;
  const fn = CONVERTERS[entry.convert];
  return fn ? fn(rawValue) : rawValue;
}

/**
 * Get all Priority 1 element IDs — used to validate incoming packets.
 */
function criticalElementIds() {
  return Object.keys(AVL_DICTIONARY)
    .filter(k => AVL_DICTIONARY[k].priority === 1)
    .map(k => parseInt(k))
    .filter(k => !isNaN(k));
}

module.exports = { AVL_DICTIONARY, CONVERTERS, lookupAVL, convertValue, criticalElementIds };
