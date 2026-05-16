const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { Client } = require('pg');
const crypto = require('crypto');

const s3 = new S3Client({ region: 'af-south-1' });
const DOCS_BUCKET = 'mulo-documents-prod';
let dbCredentials = null;

// ── Helpers ───────────────────────────────────────────────────────────────────

const resp = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
  },
  body: JSON.stringify(body)
});

const getDb = async () => {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
  });
  await client.connect();
  return client;
};

const hashId = (id) => crypto.createHash('sha256').update(id).digest('hex');

// ── SA ID Validation ──────────────────────────────────────────────────────────

const validateSAID = (id) => {
  if (!/^\d{13}$/.test(id)) return { valid: false, error: 'ID must be 13 digits' };
  const year = id.substring(0, 2);
  const month = id.substring(2, 4);
  const day = id.substring(4, 6);
  const fullYear = parseInt(year) <= 25 ? `20${year}` : `19${year}`;
  const dob = new Date(`${fullYear}-${month}-${day}`);
  if (isNaN(dob.getTime())) return { valid: false, error: 'Invalid date of birth in ID' };
  const age = Math.floor((Date.now() - dob) / (365.25 * 24 * 60 * 60 * 1000));
  if (age < 18) return { valid: false, error: 'Applicant must be 18 or older' };
  const citizenship = parseInt(id[10]);
  if (citizenship !== 0 && citizenship !== 1) return { valid: false, error: 'Invalid citizenship digit' };
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    let digit = parseInt(id[i]);
    if (i % 2 === 1) { digit *= 2; if (digit > 9) digit -= 9; }
    sum += digit;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  if (checkDigit !== parseInt(id[12])) return { valid: false, error: 'Invalid ID number (checksum failed)' };
  const dobFormatted = dob.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
  return {
    valid: true,
    dob: dobFormatted,
    dob_raw: `${fullYear}-${month}-${day}`,
    age,
    gender: parseInt(id.substring(6, 10)) >= 5000 ? 'Male' : 'Female',
    citizen: citizenship === 0 ? 'SA Citizen' : 'Permanent Resident'
  };
};

// ── Route Handlers ────────────────────────────────────────────────────────────

const verifyId = async (body) => {
  const { id_number } = body;
  if (!id_number) return resp(400, { error: 'id_number is required' });
  const validation = validateSAID(id_number);
  if (!validation.valid) return resp(400, { error: validation.error });
  const db = await getDb();
  try {
    const hash = hashId(id_number);
    const existing = await db.query('SELECT id FROM applicants WHERE id_number_hash = $1', [hash]);
    if (existing.rows.length === 0) {
      await db.query(
        'INSERT INTO applicants (id_number_hash, dha_verified, date_of_birth) VALUES ($1, false, $2)',
        [hash, validation.dob_raw]
      );
    }
    return resp(200, { valid: true, returning: existing.rows.length > 0, dob: validation.dob, age: validation.age, gender: validation.gender, citizen: validation.citizen });
  } finally {
    await db.end();
  }
};

const sendOtp = async (body) => {
  const { id_number, cellphone } = body;
  if (!id_number || !cellphone) return resp(400, { error: 'id_number and cellphone are required' });
  const otp = process.env.DEMO_MODE === 'true' ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
  const hash = hashId(id_number);
  const db = await getDb();
  try {
    await db.query('UPDATE applicants SET cellphone = $1 WHERE id_number_hash = $2', [cellphone, hash]);
    await db.query(
      "INSERT INTO audit_log (entity, action, actor, payload) VALUES ('otp', 'send', $1, $2)",
      [hash, JSON.stringify({ otp_hash: hashId(otp), expires_at: new Date(Date.now() + 10 * 60 * 1000), cellphone })]
    );
    console.log(`OTP for demo: ${otp}`);
    return resp(200, { sent: true, message: `OTP sent to ${cellphone}` });
  } finally {
    await db.end();
  }
};

const verifyOtp = async (body) => {
  const { id_number, otp } = body;
  if (!id_number || !otp) return resp(400, { error: 'id_number and otp are required' });
  if (process.env.DEMO_MODE === 'true' && otp === '123456') {
    const db = await getDb();
    try {
      await db.query('UPDATE applicants SET dha_verified = true WHERE id_number_hash = $1', [hashId(id_number)]);
    } finally {
      await db.end();
    }
    return resp(200, { verified: true });
  }
  return resp(400, { error: 'Invalid OTP' });
};

const saveConsent = async (body) => {
  const { id_number, sources } = body;
  if (!id_number || !sources) return resp(400, { error: 'id_number and sources are required' });
  const db = await getDb();
  try {
    const hash = hashId(id_number);
    const applicant = await db.query('SELECT id FROM applicants WHERE id_number_hash = $1', [hash]);
    if (applicant.rows.length === 0) return resp(404, { error: 'Applicant not found' });
    const applicantId = applicant.rows[0].id;
    for (const source of sources) {
      await db.query(
        'INSERT INTO consents (applicant_id, source, granted, granted_at) VALUES ($1, $2, true, NOW()) ON CONFLICT DO NOTHING',
        [applicantId, source]
      );
    }
    return resp(200, { saved: true });
  } finally {
    await db.end();
  }
};

const getOffer = async (body) => {
  return resp(200, {
    applicant: 'Thabo Nkosi',
    property: { address: '34 Jacaranda Avenue, Kempton Park Ext 2', value: 1850000, bond_balance: 1070000 },
    offer: { loan_amount: 517500, interest_rate: 11.25, term_months: 60, monthly_repayment: 7543, monthly_saving: 5987, mulo_score: 82, pd_score: 3.2, rate_band: 'Prime - 0.5%' },
    debts: [
      { creditor: 'African Bank', type: 'personal', balance: 125000, monthly: 3200, priority: 1 },
      { creditor: 'Nedbank', type: 'personal', balance: 68000, monthly: 1850, priority: 2 },
      { creditor: 'Capitec', type: 'credit_card', balance: 48000, monthly: 1400, priority: 3 },
      { creditor: 'FNB', type: 'credit_card', balance: 31500, monthly: 980, priority: 4 },
      { creditor: 'Wesbank', type: 'vehicle', balance: 245000, monthly: 5100, priority: 5 }
    ]
  });
};

const getUploadUrl = async (body) => {
  const { id_number, doc_type, file_name, content_type } = body;
  if (!id_number || !doc_type || !file_name) return resp(400, { error: 'id_number, doc_type and file_name are required' });
  const allowed = ['payslip', 'proof_of_address'];
  if (!allowed.includes(doc_type)) return resp(400, { error: 'doc_type must be payslip or proof_of_address' });
  const hash = hashId(id_number);
  const ext = file_name.split('.').pop().toLowerCase();
  const key = `documents/${hash}/${doc_type}_${Date.now()}.${ext}`;
  const command = new PutObjectCommand({
    Bucket: DOCS_BUCKET,
    Key: key,
    ContentType: content_type || 'application/pdf',
    ChecksumAlgorithm: undefined
  });
  const url = await getSignedUrl(s3, command, { expiresIn: 300, unhoistableHeaders: new Set(['x-amz-checksum-crc32', 'x-amz-sdk-checksum-algorithm']) });
  const db = await getDb();
  try {
    const applicant = await db.query('SELECT id FROM applicants WHERE id_number_hash = $1', [hash]);
    if (applicant.rows.length > 0) {
      await db.query(
        'INSERT INTO documents (applicant_id, doc_type, s3_key) VALUES ($1, $2, $3)',
        [applicant.rows[0].id, doc_type, key]
      );
    }
  } finally {
    await db.end();
  }
  return resp(200, { upload_url: url, key });
};

// ── Main Handler ──────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  if (event.requestContext?.http?.method === 'OPTIONS' || event.httpMethod === 'OPTIONS') {
    return resp(200, {});
  }
  const path = event.rawPath || event.path || '/';
  const method = event.requestContext?.http?.method || event.httpMethod || 'POST';
  let body = {};
  try { body = event.body ? (typeof event.body === 'string' ? JSON.parse(event.body) : event.body) : {}; } catch(e) {}

  console.log(`${method} ${path}`, JSON.stringify(body));

  try {
    if (path.endsWith('/verify-id') && method === 'POST') return await verifyId(body);
    if (path.endsWith('/otp/send') && method === 'POST') return await sendOtp(body);
    if (path.endsWith('/otp/verify') && method === 'POST') return await verifyOtp(body);
    if (path.endsWith('/consent') && method === 'POST') return await saveConsent(body);
    if (path.endsWith('/offer') && method === 'POST') return await getOffer(body);
    if (path.endsWith('/upload-url') && method === 'POST') return await getUploadUrl(body);
    return resp(404, { error: `Route not found: ${method} ${path}` });
  } catch (err) {
    console.error('Handler error:', err);
    return resp(500, { error: 'Internal server error', detail: err.message });
  }
};
