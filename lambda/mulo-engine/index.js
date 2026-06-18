const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { Client } = require('pg');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const s3 = new S3Client({ region: 'af-south-1', requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED' });
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


const sendEmail = async (to, subject, html) => {
  const { SESv2Client, SendEmailCommand } = await import('@aws-sdk/client-sesv2');
  const ses = new SESv2Client({ region: 'af-south-1' });
  await ses.send(new SendEmailCommand({
    FromEmailAddress: 'noreply@mulo.co.za',
    Destination: { ToAddresses: [to] },
    Content: {
      Simple: {
        Subject: { Data: subject },
        Body: { Html: { Data: html } }
      }
    }
  }));
};
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

// ── Mock Bureau Layer ─────────────────────────────────────────────────────────
// Deterministic mock data based on ID hash — consistent per applicant
// Replace each function with real API call when credentials are available

const mockLightstone = (idHash) => {
  // Use hash bytes to seed realistic property data
  const seed = parseInt(idHash.substring(0, 8), 16);
  const propertyValues = [850000, 1200000, 1500000, 1850000, 2200000, 2800000, 3500000];
  const suburbs = [
    { name: 'Kempton Park Ext 2', city: 'Ekurhuleni', province: 'Gauteng' },
    { name: 'Midrand', city: 'Johannesburg', province: 'Gauteng' },
    { name: 'Centurion', city: 'Tshwane', province: 'Gauteng' },
    { name: 'Bedfordview', city: 'Ekurhuleni', province: 'Gauteng' },
    { name: 'Sandton', city: 'Johannesburg', province: 'Gauteng' },
    { name: 'Fourways', city: 'Johannesburg', province: 'Gauteng' },
    { name: 'Bellville', city: 'Cape Town', province: 'Western Cape' },
  ];
  const streets = ['Jacaranda', 'Protea', 'Acacia', 'Baobab', 'Tamboti', 'Marula', 'Kiepersol'];
  const banks = ['Nedbank Home Loans', 'Standard Bank', 'Absa Home Loans', 'FNB Home Loans', 'SA Home Loans'];

  const idx = seed % propertyValues.length;
  const suburb = suburbs[seed % suburbs.length];
  const street = streets[(seed >> 4) % streets.length];
  const streetNo = 10 + (seed % 90);
  const erf = 1000 + (seed % 8000);
  const titleDeed = `T ${40000 + (seed % 20000)}/2${2015 + (seed % 9)}`;
  const propertyValue = propertyValues[idx];
  const bondLtv = 0.55 + (seed % 20) / 100; // 55-75% LTV
  const bondBalance = Math.round(propertyValue * bondLtv / 1000) * 1000;
  const bondHolder = banks[seed % banks.length];
  const bondStart = `${2013 + (seed % 8)}-0${1 + (seed % 9)}-01`;

  return {
    address: `${streetNo} ${street} Avenue, ${suburb.name}, ${suburb.city}`,
    suburb: suburb.name,
    city: suburb.city,
    province: suburb.province,
    erf_number: `Erf ${erf}`,
    title_deed: titleDeed,
    market_value: propertyValue,
    bond_balance: bondBalance,
    bond_holder: bondHolder,
    bond_start_date: bondStart,
    bond_term_months: 240,
    bond_rate_margin: [-0.5, 0, 0.5, 1.0][seed % 4],
    ltv: Math.round(bondBalance / propertyValue * 100) / 100
  };
};

const mockTruID = (idHash) => {
  const seed = parseInt(idHash.substring(8, 16), 16);
  const incomes = [28000, 35000, 45000, 52000, 65000, 85000, 110000];
  const employers = ['Sasol', 'Anglo American', 'Standard Bank', 'Shoprite Holdings', 'MTN Group', 'Vodacom', 'Discovery'];
  const income = incomes[seed % incomes.length];
  const employer = employers[seed % employers.length];
  const expenseRatio = 0.30 + (seed % 15) / 100; // 30-45% of income
  const expenses = Math.round(income * expenseRatio / 500) * 500;

  return {
    employer,
    employment_type: 'permanent',
    gross_monthly_income: income,
    net_monthly_income: Math.round(income * 0.72),
    monthly_expenses: expenses,
    bank: ['Nedbank', 'FNB', 'Absa', 'Standard Bank', 'Capitec'][seed % 5],
    account_verified: true,
    statements_months: 3
  };
};

const mockTransUnion = (idHash) => {
  const seed = parseInt(idHash.substring(16, 24), 16);
  const scores = [620, 650, 680, 710, 735, 755, 780];
  const creditScore = scores[seed % scores.length];

  const debtTypes = [
    { type: 'personal', creditors: ['African Bank', 'Nedbank', 'Capitec', 'Standard Bank', 'Wesbank'] },
    { type: 'credit_card', creditors: ['Capitec', 'FNB', 'Absa', 'Standard Bank', 'Nedbank'] },
    { type: 'vehicle', creditors: ['Wesbank', 'MFC', 'Absa Vehicle Finance', 'Standard Bank Vehicle'] }
  ];

  const numDebts = 2 + (seed % 4); // 2-5 debts
  const debts = [];
  const balances = [25000, 45000, 68000, 95000, 125000, 180000, 245000];

  for (let i = 0; i < numDebts; i++) {
    const debtType = debtTypes[i % debtTypes.length];
    const balance = balances[(seed + i) % balances.length];
    const monthly = Math.round(balance * 0.025); // ~2.5% of balance
    debts.push({
      creditor: debtType.creditors[(seed + i) % debtType.creditors.length],
      type: debtType.type,
      balance,
      monthly,
      status: 'current'
    });
  }

  return {
    credit_score: creditScore,
    debts,
    judgements: 0,
    missed_payments_6m: 0,
    in_debt_review: false,
    sequestrated: false
  };
};

const getLightstoneData = async (idNumber) => {
  const apiKey = process.env.LIGHTSTONE_API_KEY;
  if (!apiKey) throw new Error('LIGHTSTONE_API_KEY not set');
  const baseUrl = 'https://apis.lightstone.co.za';

  // Step 1: Get property ID from ID number
  const ownersRes = await fetch(`${baseUrl}/lspdata/v1/homeOwners/getNaturalHomeOwners`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': apiKey
    },
    body: JSON.stringify({ idNumbers: [idNumber], maxRows: 1 })
  });
  if (!ownersRes.ok) throw new Error(`Lightstone owners error: ${ownersRes.status}`);
  const owners = await ownersRes.json();
  if (!owners || owners.length === 0) throw new Error('No property found for this ID number');
  const propId = owners[0].propId;

  // Step 2: Get property value (AIVM)
  const [aivmRes, ownersDataRes, legalRes, bondsRes] = await Promise.all([
    fetch(`${baseUrl}/lspdata/v1/property/${propId}/aivm`, { headers: { 'Ocp-Apim-Subscription-Key': apiKey } }),
    fetch(`${baseUrl}/lspdata/v1/property/${propId}/owners`, { headers: { 'Ocp-Apim-Subscription-Key': apiKey } }),
    fetch(`${baseUrl}/lspdata/v1/property/${propId}/legal`, { headers: { 'Ocp-Apim-Subscription-Key': apiKey } }),
    fetch(`${baseUrl}/lspdata/v1/property/${propId}/bonds`, { headers: { 'Ocp-Apim-Subscription-Key': apiKey } }),
  ]);

  const aivm = aivmRes.ok ? await aivmRes.json() : null;
  const ownersData = ownersDataRes.ok ? await ownersDataRes.json() : null;
  const legal = legalRes.ok ? await legalRes.json() : null;
  const bonds = bondsRes.ok ? await bondsRes.json() : null;

  return {
    propId,
    market_value: aivm?.predictedValue || 0,
    market_value_low: aivm?.predictedValueLow || 0,
    market_value_high: aivm?.predictedValueHigh || 0,
    accuracy_score: aivm?.predictValueAccuracyScore || 0,
    title_deed: legal?.titleDeedNumber || null,
    erf_number: legal?.erfNumber || null,
    registered_owner: ownersData?.[0]?.ownerName || null,
    bond_balance: bonds?.[0]?.currentBalance || 0,
    bond_holder: bonds?.[0]?.bankName || null,
    bond_start_date: bonds?.[0]?.registrationDate || null,
    bond_term_months: 240,
    bond_rate_margin: 0,
    address: legal?.address || null,
    source: 'lightstone_live'
  };
};

const getBureauData = async (idNumber) => {
  const hash = hashId(idNumber);
  let lightstone;
  try {
    lightstone = await getLightstoneData(idNumber);
    console.log('Lightstone live data retrieved for', hash.substring(0, 8));
  } catch (err) {
    console.log('Lightstone fallback to mock:', err.message);
    lightstone = { ...mockLightstone(hash), source: 'mock' };
  }
  return {
    lightstone,
    truid: mockTruID(hash),
    transunion: mockTransUnion(hash)
  };
};

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
    const existing = await db.query('SELECT id, email, password_hash, current_screen FROM applicants WHERE id_number_hash = $1', [hash]);
    if (existing.rows.length === 0) {
      await db.query(
        'INSERT INTO applicants (id_number_hash, dha_verified, date_of_birth) VALUES ($1, false, $2)',
        [hash, validation.dob_raw]
      );
    }
    const hasAccount = existing.rows.length > 0 && !!existing.rows[0].password_hash;
    return resp(200, { valid: true, returning: existing.rows.length > 0, hasAccount, dob: validation.dob, age: validation.age, gender: validation.gender, citizen: validation.citizen });
  } finally {
    await db.end();
  }
};

const sendWhatsAppOtp = async (cellphone, otp) => {
  const token = process.env.WA_TOKEN;
  const phoneNumberId = process.env.WA_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) { console.log('WhatsApp not configured'); return; }

  // Format SA number to international format
  let to = cellphone.replace(/\D/g, '');
  if (to.startsWith('0')) to = '27' + to.slice(1);

  const res = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: { name: 'mulo_otp_verification', language: { code: 'en' }, components: [{ type: 'body', parameters: [{ type: 'text', text: otp }] }, { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: otp }] }] }
    })
  });
  const data = await res.json();
  console.log('WhatsApp send result:', JSON.stringify(data));
  return data;
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
    console.log(`OTP CODE FOR ${cellphone}: ${otp}`);
    await sendWhatsAppOtp(cellphone, otp);
    return resp(200, { sent: true, success: true, message: `OTP sent to ${cellphone}` });
  } finally {
    await db.end();
  }
};

const verifyOtp = async (body) => {
  const { id_number, otp } = body;
  if (!id_number || !otp) return resp(400, { error: 'id_number and otp are required' });
  const hash = hashId(id_number);
  const db = await getDb();
  try {
    // Find most recent OTP for this applicant
    const result = await db.query(
      `SELECT payload FROM audit_log 
       WHERE entity = 'otp' AND action = 'send' AND actor = $1 
       ORDER BY ctid DESC LIMIT 1`,
      [hash]
    );
    console.log("audit_log rows:", result.rows.length, JSON.stringify(result.rows[0]?.payload));
    if (result.rows.length === 0) return resp(400, { error: 'OTP not found. Please request a new code.' });
    const payload = result.rows[0].payload;
    const { otp_hash, expires_at } = payload;
    if (new Date() > new Date(expires_at)) return resp(400, { error: 'OTP has expired. Please request a new code.' });
    if (hashId(otp) !== otp_hash) return resp(400, { error: 'Invalid OTP' });
    await db.query('UPDATE applicants SET dha_verified = true WHERE id_number_hash = $1', [hash]);
    return resp(200, { verified: true });
  } finally {
    await db.end();
  }
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

const PRIME_RATE = 11.75; // Current SA prime rate

const calculateOffer = (propertyValue, bondBalance, grossIncome, monthlyExpenses, debts, bondStartDate, bondRateMargin) => {
  // Gate 2: Property & LTV
  const equity = propertyValue - bondBalance;
  const maxByEquity = Math.floor(equity * 0.75);

  // Calculate remaining bond term (assume 20yr/240 month original term)
  const bondStart = bondStartDate ? new Date(bondStartDate) : new Date('2016-01-01');
  const monthsElapsed = Math.floor((Date.now() - bondStart.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  const remainingMonths = Math.max(0, 240 - monthsElapsed);

  if (remainingMonths < 60) {
    return { approved: false, reason: 'Your home loan has less than 5 years remaining. A further advance is not available at this stage.' };
  }

  const margin = bondRateMargin !== undefined ? bondRateMargin : 0;
  const bondRate = PRIME_RATE + margin;
  const rateLabel = margin === -0.5 ? 'Prime - 0.5%' : margin === 0 ? 'Prime' : margin === 0.5 ? 'Prime + 0.5%' : 'Prime + 1%';

  // Sort debts by priority: personal loans first, then credit cards, then vehicle
  const priorityOrder = { personal: 1, personal_loan: 1, credit_card: 2, vehicle: 3, vehicle_finance: 3 };
  const sortedDebts = [...debts].sort((a, b) => (priorityOrder[a.type] || 9) - (priorityOrder[b.type] || 9));

  // Gate 3: Affordability — DTI cap 43%, minimum surplus R3,500
  const maxDTI = grossIncome * 0.43;
  const currentCommitments = debts.reduce((s, d) => s + (d.monthly || 0), 0);

  // Greedily include debts up to equity cap
  let totalDebt = 0;
  const includedDebts = [];
  const excludedDebts = [];
  for (const debt of sortedDebts) {
    if (totalDebt + debt.balance <= maxByEquity) {
      totalDebt += debt.balance;
      includedDebts.push({ ...debt, included: true });
    } else {
      excludedDebts.push({ ...debt, included: false });
    }
  }

  if (totalDebt === 0) return { approved: false, reason: 'No debts qualify within your available equity' };

  // Calculate repayment for the loan amount
  const loanAmount = totalDebt;
  const termMonths = remainingMonths;

  const dtiRatio = currentCommitments / grossIncome;
  let muloScore = 82;
  if (dtiRatio > 0.35) muloScore = 70;
  if (dtiRatio > 0.40) muloScore = 55;
  if (dtiRatio > 0.43) return { approved: false, reason: 'DTI ratio exceeds 43% — affordability limit reached' };

  const monthlyRate = bondRate / 100 / 12;
  const monthlyRepayment = Math.round(loanAmount * monthlyRate * Math.pow(1 + monthlyRate, termMonths) / (Math.pow(1 + monthlyRate, termMonths) - 1));

  // Check surplus
  const surplus = grossIncome - monthlyExpenses - monthlyRepayment;
  if (surplus < 3500) return { approved: false, reason: `Monthly surplus of R${surplus.toLocaleString()} is below the minimum R3,500` };

  const currentMonthlyDebt = debts.reduce((s, d) => s + (d.monthly || 0), 0);
  const includedMonthlyDebt = includedDebts.reduce((s, d) => s + (d.monthly || 0), 0);
  const monthlySaving = includedMonthlyDebt - monthlyRepayment;

  return {
    approved: true,
    loan_amount: loanAmount,
    interest_rate: bondRate,
    rate_label: rateLabel,
    term_months: termMonths,
    remaining_months: remainingMonths,
    monthly_repayment: monthlyRepayment,
    monthly_saving: monthlySaving,
    mulo_score: muloScore,
    pd_score: muloScore >= 75 ? 0.032 : muloScore >= 60 ? 0.075 : 0.125,
    risk_band: muloScore >= 75 ? 'Excellent' : muloScore >= 60 ? 'Good' : 'Fair',
    surplus,
    dti_percent: Math.round(dtiRatio * 100 * 10) / 10,
    included_debts: includedDebts,
    excluded_debts: excludedDebts
  };
};

const getOffer = async (body) => {
  const { id_number, property_value, bond_balance, gross_income, monthly_expenses, debts } = body;

  // Use real data if provided, otherwise use mock bureau data
  let bureau = null;
  let propValue = property_value;
  let bondBal = bond_balance;
  let grossInc = gross_income;
  let monthlyExp = monthly_expenses;
  let debtList = debts;

  if (!propValue || !grossInc) {
    if (!id_number) return resp(400, { error: 'id_number is required' });
    const bureau = await getBureauData(id_number);
    propValue = propValue || bureau.lightstone.market_value;
    bondBal = bondBal || bureau.lightstone.bond_balance;
    grossInc = grossInc || bureau.truid.gross_monthly_income;
    monthlyExp = monthlyExp || bureau.truid.monthly_expenses;
    debtList = debtList || bureau.transunion.debts;
  }

  const bondStartDate = body.bond_start_date || bureau?.lightstone?.bond_start_date;
  const bondRateMargin = body.bond_rate_margin !== undefined ? body.bond_rate_margin : bureau?.lightstone?.bond_rate_margin;
  const result = calculateOffer(
    Number(propValue),
    Number(bondBal),
    Number(grossInc),
    Number(monthlyExp || 0),
    debtList,
    bondStartDate,
    bondRateMargin
  );

    if (!result.approved) {
      return resp(200, { approved: false, reason: result.reason });
    }

    // Save application to DB if id_number provided
    if (id_number) {
      const db = await getDb();
      try {
        const hash = hashId(id_number);
        const applicant = await db.query('SELECT id FROM applicants WHERE id_number_hash = $1', [hash]);
        if (applicant.rows.length > 0) {
          await db.query(
            `INSERT INTO applications (applicant_id, status, mulo_score, pd_score, loan_amount, interest_rate, term_months, monthly_repayment, monthly_saving)
             VALUES ($1, 'offered', $2, $3, $4, $5, 60, $6, $7)
             ON CONFLICT DO NOTHING`,
            [applicant.rows[0].id, result.mulo_score, result.pd_score, result.loan_amount, result.interest_rate / 100, result.monthly_repayment, result.monthly_saving]
          );
        }
      } finally {
        await db.end();
      }
    }

    return resp(200, { approved: true, offer: result, debts: result.included_debts, excluded: result.excluded_debts });
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
    ContentType: content_type || 'application/pdf'
  });
  const url = await getSignedUrl(s3, command, { expiresIn: 300 });
  // Strip checksum params that cause 403
  const cleanUrl = url.split('&').filter(p => !p.startsWith('x-amz-checksum') && !p.startsWith('x-amz-sdk-checksum')).join('&');
  const db = await getDb();
  try {
    const applicant = await db.query('SELECT id FROM applicants WHERE id_number_hash = $1', [hash]);
    if (applicant.rows.length > 0) {
      await db.query('INSERT INTO documents (applicant_id, doc_type, s3_key) VALUES ($1, $2, $3)', [applicant.rows[0].id, doc_type, key]);
    }
  } finally {
    await db.end();
  }
  return resp(200, { upload_url: cleanUrl, key });
};

// ── Main Handler ──────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  if (event.requestContext?.http?.method === 'OPTIONS' || event.httpMethod === 'OPTIONS') {
    return resp(200, {});
  }
  const rawPath = event.rawPath || event.path || '/';
  const path = rawPath.replace(/^\/prod/, '') || '/';
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
    if (path.endsWith('/bureau') && method === 'POST') {
      const { id_number } = body;
      if (!id_number) return resp(400, { error: 'id_number is required' });
      return resp(200, await getBureauData(id_number));
    }
    if (path.endsWith('/forgot-password') && method === 'POST') {
      const { id_number, email_confirm } = body;
      if (!id_number) return resp(400, { error: 'id_number is required' });
      const db = await getDb();
      try {
        const result = await db.query(
          'SELECT email_plain, password_hash FROM applicants WHERE id_number_hash = $1 AND password_hash IS NOT NULL',
          [hashId(id_number)]
        );
        if (result.rows.length === 0) return resp(404, { error: 'No account found for this ID number' });
        const emailPlain = result.rows[0].email_plain;
        if (!emailPlain) return resp(404, { error: 'No email on file. Please contact support.' });
        if (email_confirm) {
          if (email_confirm.toLowerCase() !== emailPlain) return resp(400, { error: 'Email does not match our records' });
          const crypto = require('crypto');
const bcrypt = require('bcryptjs');
          const resetCode = crypto.randomInt(100000, 999999).toString();
          const resetHash = crypto.createHash('sha256').update(resetCode).digest('hex');
          const expires = new Date(Date.now() + 15 * 60 * 1000);
          await db.query('UPDATE applicants SET password_hash = $1 WHERE id_number_hash = $2',
            [resetHash + ':reset:' + expires.toISOString(), hashId(id_number)]);
          await sendEmail(emailPlain, 'Your Muḽo password reset code', `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F0F4F8;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4F8;padding:40px 0">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%">
        
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0A1628,#1B3A5E);border-radius:18px 18px 0 0;padding:32px;text-align:center">
          <div style="font-size:28px;font-weight:800;color:#fff;letter-spacing:-1px">Mu<span style="color:#00B8A9">ḽ</span>o</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:4px;text-transform:uppercase;letter-spacing:2px">Financial Technologies</div>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#fff;padding:40px 32px">
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0A1628">Reset your password</h1>
          <p style="margin:0 0 24px;font-size:14px;color:#8FA3BE;line-height:1.6">
            We received a request to reset your Muḽo account password. Use the code below — it expires in <strong style="color:#0A1628">15 minutes</strong>.
          </p>

          <!-- Code box -->
          <div style="background:#F7F9FC;border:1px solid #E2E9F0;border-radius:16px;padding:28px;text-align:center;margin:0 0 24px">
            <div style="font-size:11px;font-weight:600;color:#8FA3BE;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px">Your reset code</div>
            <div style="font-size:40px;font-weight:800;letter-spacing:10px;color:#00B8A9;font-family:monospace">${resetCode}</div>
          </div>

          <!-- Security notice -->
          <div style="background:#FFF8F0;border:1px solid #FFE0B2;border-radius:12px;padding:16px;margin-bottom:24px">
            <div style="font-size:12px;color:#E65100;line-height:1.6">
              🔒 <strong>Security reminder:</strong> Muḽo will never call or message you asking for this code. Never share it with anyone.
            </div>
          </div>

          <p style="font-size:12px;color:#C5D0DC;line-height:1.6;margin:0">
            If you didn't request a password reset, you can safely ignore this email. Your account remains secure.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#F7F9FC;border-radius:0 0 18px 18px;padding:24px 32px;border-top:1px solid #E2E9F0">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:11px;color:#C5D0DC;line-height:1.8">
                <a href="https://mulo.co.za" style="color:#00B8A9;text-decoration:none">mulo.co.za</a> · <a href="mailto:support@mulo.co.za" style="color:#00B8A9;text-decoration:none">support@mulo.co.za</a>
              </td>
              <td align="right" style="font-size:10px;color:#E2E9F0">
                NCR Registered<br>POPIA Compliant
              </td>
            </tr>
          </table>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`);
          return resp(200, { sent: true });
        }
        const [user, domain] = emailPlain.split('@');
        const masked = user[0] + "***" + (user.length > 3 ? user.slice(-3) : "") + "@" + domain;
        return resp(200, { found: true, maskedEmail: masked });
      } finally { await db.end(); }
    }

    if (path.endsWith('/reset-password') && method === 'POST') {
      const { id_number, reset_code, new_password } = body;
      if (!id_number || !reset_code || !new_password) return resp(400, { error: 'Missing fields' });
      const crypto = require('crypto');
const bcrypt = require('bcryptjs');
      const db = await getDb();
      try {
        const result = await db.query('SELECT password_hash FROM applicants WHERE id_number_hash = $1', [hashId(id_number)]);
        if (!result.rows.length) return resp(404, { error: 'Account not found' });
        const stored = result.rows[0].password_hash || '';
        if (!stored.includes(':reset:')) return resp(400, { error: 'No reset in progress' });
        const parts = stored.split(':reset:');
        const storedHash = parts[0];
        const expiresStr = parts[1];
        if (new Date() > new Date(expiresStr)) return resp(400, { error: 'Reset code expired' });
        if (crypto.createHash('sha256').update(reset_code).digest('hex') !== storedHash) return resp(400, { error: 'Invalid reset code' });
        const newHash = await bcrypt.hash(new_password, 12);
        await db.query('UPDATE applicants SET password_hash = $1 WHERE id_number_hash = $2', [newHash, hashId(id_number)]);
        const emailRow = await db.query('SELECT email_plain FROM applicants WHERE id_number_hash = $1 LIMIT 1', [hashId(id_number)]);
        if (emailRow.rows[0]?.email_plain) {
          const eHash = crypto.createHash('sha256').update(emailRow.rows[0].email_plain.toLowerCase()).digest('hex');
          await db.query('UPDATE applicants SET password_hash = $1 WHERE email = $2', [newHash, eHash]);
        }
        return resp(200, { reset: true });
      } finally { await db.end(); }
    }
    if (path.endsWith('/smile-capture') && method === 'POST') {
      const { id_number, images } = body;
      if (!id_number || !images) return resp(400, { error: 'id_number and images required' });
      try {
        const smileCore = require('smile-identity-core');
        const secret = await getSecret('mulo/smileid');
        const { partnerId, apiKey } = JSON.parse(secret);
        const WebApi = smileCore.WebApi;
        const connection = new WebApi(partnerId, process.env.SMILE_CALLBACK_URL || 'https://z30zl849k8.execute-api.af-south-1.amazonaws.com/prod/smile-callback', apiKey, '0');
        const partner_params = {
          job_id: 'job-' + hashId(id_number).substring(0, 16),
          user_id: hashId(id_number).substring(0, 16),
          job_type: 1
        };
        const id_info = {
          first_name: '',
          last_name: '',
          country: 'ZA',
          id_type: 'NATIONAL_ID',
          id_number: id_number,
          entered: true
        };
        const imageList = images.map(img => ({
          image_type_id: img.image_type_id,
          image: img.image
        }));
        await connection.submit_job(partner_params, imageList, id_info, {});
        return resp(200, { submitted: true });
      } catch(err) {
        console.error('Smile capture error:', err.message);
        return resp(500, { error: err.message });
      }
    }
    if (path.endsWith('/smile-callback') && method === 'POST') {
      // Smile ID posts verification result here
      console.log('Smile callback received:', JSON.stringify(body));
      const { ResultCode, IDNumber, Actions } = body;
      if (!IDNumber) return resp(200, { received: true });
      const verified = ResultCode === '0990' || Actions?.Verify_ID_Against_ID_Authority === 'Verified' || ResultCode === '1014';
      const db = await getDb();
      try {
        await db.query(
          'UPDATE applicants SET dha_verified = $1 WHERE id_number_hash = $2',
          [verified, hashId(IDNumber)]
        );
        return resp(200, { received: true, verified });
      } finally { await db.end(); }
    }
    if (path.endsWith('/smile-status') && method === 'GET') {
      const id_number = event.queryStringParameters?.id_number;
      if (!id_number) return resp(400, { error: 'id_number required' });
      const db = await getDb();
      try {
        const result = await db.query(
          'SELECT dha_verified FROM applicants WHERE id_number_hash = $1',
          [hashId(id_number)]
        );
        const verified = result.rows[0]?.dha_verified || false;
        return resp(200, { verified });
      } finally { await db.end(); }
    }
    if (path.endsWith('/admin/migrate') && method === 'POST') {
      const db = await getDb();
      try {
        await db.query('ALTER TABLE applicants ADD COLUMN IF NOT EXISTS email TEXT');
        if (body.clear) { await db.query('UPDATE applicants SET email = NULL, email_plain = NULL, password_hash = NULL, current_screen = NULL WHERE id_number_hash = $1', [hashId('8301012322099')]); return resp(200, { cleared: true }); }
        await db.query('ALTER TABLE applicants ADD COLUMN IF NOT EXISTS email_plain TEXT');
        await db.query("ALTER TABLE applicants ADD COLUMN IF NOT EXISTS current_screen TEXT DEFAULT 'id-verify'");
        await db.query('ALTER TABLE applicants ADD COLUMN IF NOT EXISTS password_hash TEXT');
        return resp(200, { migrated: true });
      } finally { await db.end(); }
    }
    if (path.endsWith('/save-screen') && method === 'POST') {
      const { id_number, screen } = body;
      if (!id_number || !screen) return resp(400, { error: 'id_number and screen required' });
      const db = await getDb();
      try {
        await db.query('UPDATE applicants SET current_screen = $1 WHERE id_number_hash = $2', [screen, hashId(id_number)]);
        return resp(200, { saved: true });
      } finally { await db.end(); }
    }
    if (path.endsWith('/save-account') && method === 'POST') {
      const { id_number, email, password } = body;
      if (!id_number || !email || !password) return resp(400, { error: 'id_number, email and password required' });
      const crypto = require('crypto');
const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash(password, 12);
      const emailHash = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
      const db = await getDb();
      try {
        await db.query(
          'UPDATE applicants SET email = $1, password_hash = $2, email_plain = $3 WHERE id_number_hash = $4',
          [emailHash, passwordHash, email.toLowerCase(), hashId(id_number)]
        );
        return resp(200, { saved: true });
      } finally { await db.end(); }
    }
    if (path.endsWith('/login') && method === 'POST') {
      const { email, password } = body;
      if (!email || !password) return resp(400, { error: 'email and password required' });
      const crypto = require('crypto');
const bcrypt = require('bcryptjs');
      const emailHash = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
      const db = await getDb();
      try {
        const result = await db.query(
          `SELECT a.id_number_hash, a.dha_verified, a.cellphone, a.current_screen, a.password_hash,
                  ap.status, ap.mulo_score, ap.loan_amount, ap.interest_rate, ap.monthly_repayment, ap.monthly_saving
           FROM applicants a
           LEFT JOIN applications ap ON ap.applicant_id = a.id
           WHERE a.email = $1
           ORDER BY a.created_at DESC LIMIT 1`,
          [emailHash]
        );
        if (result.rows.length === 0) return resp(401, { error: 'Invalid email or password' });
        const passwordMatch = await bcrypt.compare(password, result.rows[0].password_hash || '');
        if (!passwordMatch) return resp(401, { error: 'Invalid email or password' });
        const applicant = result.rows[0];
        return resp(200, {
          authenticated: true,
          currentScreen: applicant.current_screen || 'consent',
          cellphone: applicant.cellphone,
          dhaVerified: applicant.dha_verified,
          offer: applicant.loan_amount ? {
            loan_amount: applicant.loan_amount,
            interest_rate: applicant.interest_rate,
            monthly_repayment: applicant.monthly_repayment,
            monthly_saving: applicant.monthly_saving,
            mulo_score: applicant.mulo_score,
          } : null
        });
      } finally { await db.end(); }
    }
    if ((path.endsWith('/admin/applications') || path.includes('/admin/applications')) && method === 'GET') {
      const db = await getDb();
      try {
        const result = await db.query(`
          SELECT 
            a.id,
            a.id_number_hash,
            a.dha_verified,
            a.date_of_birth,
            a.cellphone,
            a.email_plain,
            a.current_screen,
            a.created_at,
            ap.status,
            ap.mulo_score,
            ap.loan_amount,
            ap.interest_rate,
            ap.monthly_repayment,
            ap.monthly_saving,
            ap.created_at as applied_at,
            COUNT(DISTINCT d.id) as doc_count,
            COUNT(DISTINCT c.id) as consent_count
          FROM applicants a
          LEFT JOIN applications ap ON ap.applicant_id = a.id
          LEFT JOIN documents d ON d.applicant_id = a.id
          LEFT JOIN consents c ON c.applicant_id = a.id
          GROUP BY a.id, ap.id
          ORDER BY a.created_at DESC
          LIMIT 50
        `);
        return resp(200, { applicants: result.rows, total: result.rowCount });
      } finally {
        await db.end();
      }
    }
    return resp(404, { error: `Route not found: ${method} ${path}` });
  } catch (err) {
    console.error('Handler error:', err);
    return resp(500, { error: 'Internal server error', detail: err.message });
  }
};
