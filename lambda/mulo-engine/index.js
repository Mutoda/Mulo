/**
 * ============================================================
 * MUḼO ENGINE v1.0
 * Credit Decision Engine — NCA + POPIA Compliant
 * ============================================================
 *
 * Input:  Applicant profile (mock or real bureau data)
 * Output: Full credit decision with offer or decline reasons
 *
 * Four Gates:
 *   Gate 1 — Identity & Legal
 *   Gate 2 — Property & LTV
 *   Gate 3 — Affordability
 *   Gate 4 — Credit Risk (ML-simulated XGBoost)
 *
 * ============================================================
 */

'use strict';

const PRIME_RATE         = 11.75;
const MAX_LTV            = 0.75;
const MAX_DTI            = 0.43;
const MIN_SURPLUS        = 3500;
const LOAN_TERM_MONTHS   = 60;
const MAX_INITIATION_FEE = 11500;
const MONTHLY_SERVICE    = 69;
const MIN_MULO_SCORE     = 50;

const DEBT_PRIORITY = ['personal_loan', 'credit_card', 'vehicle_finance'];

const RATE_BANDS = [
  { minScore: 80, maxPD: 5,  spread: -0.5, label: 'Excellent' },
  { minScore: 65, maxPD: 10, spread: 0,    label: 'Good'      },
  { minScore: 50, maxPD: 15, spread: 0.5,  label: 'Fair'      },
];

// ── GATE 1 — Identity & Legal ─────────────────────────────────

function gate1_identity(applicant) {
  const failures = [];
  if (!applicant.dha_verified)         failures.push({ code: 'DHA_NOT_VERIFIED',  reason: 'Identity not verified against Home Affairs' });
  if (!applicant.liveness_passed)      failures.push({ code: 'LIVENESS_FAILED',   reason: 'Face liveness check did not pass' });
  if (applicant.age < 18)              failures.push({ code: 'UNDERAGE',           reason: 'Applicant must be 18 or older' });
  if (!['citizen','permanent_resident'].includes(applicant.citizenship))
                                        failures.push({ code: 'CITIZENSHIP',        reason: 'Applicant must be SA citizen or permanent resident' });
  if (applicant.under_debt_review)     failures.push({ code: 'DEBT_REVIEW',        reason: 'Applicant is currently under debt review' });
  if (applicant.sequestrated)          failures.push({ code: 'SEQUESTRATION',      reason: 'Applicant has been sequestrated' });
  if (applicant.administration_order)  failures.push({ code: 'ADMIN_ORDER',        reason: 'Applicant has an administration order' });
  return { gate: 1, name: 'Identity & Legal', passed: failures.length === 0, failures };
}

// ── GATE 2 — Property & LTV ──────────────────────────────────

function gate2_property(applicant, property) {
  const failures = [];
  if (!property.registered_owner)   failures.push({ code: 'NOT_OWNER',            reason: 'Applicant is not the registered property owner' });
  if (property.property_type !== 'residential') failures.push({ code: 'NOT_RESIDENTIAL', reason: 'Only residential properties qualify' });
  if (!property.title_deed)         failures.push({ code: 'NO_TITLE_DEED',        reason: 'No title deed found at Deeds Office' });

  const equity        = property.market_value - property.bond_balance;
  const max_by_equity = equity * MAX_LTV;
  const ltv_post_loan = (property.bond_balance + max_by_equity) / property.market_value;

  if (equity <= 0)         failures.push({ code: 'NO_EQUITY',           reason: 'Property has no available equity' });
  if (max_by_equity < 10000) failures.push({ code: 'INSUFFICIENT_EQUITY', reason: 'Available equity is below minimum loan amount' });

  return {
    gate: 2, name: 'Property & LTV', passed: failures.length === 0, failures,
    calculations: {
      market_value:  property.market_value,
      bond_balance:  property.bond_balance,
      equity,
      max_by_equity: Math.round(max_by_equity),
      ltv_current:   +(property.bond_balance / property.market_value * 100).toFixed(1),
      ltv_post_loan: +(ltv_post_loan * 100).toFixed(1),
    },
  };
}

// ── GATE 3 — Affordability ───────────────────────────────────

function gate3_affordability(financial, loan_amount, rate_annual) {
  const failures = [];
  const rate_monthly       = rate_annual / 100 / 12;
  const proposed_repayment = calculateRepayment(loan_amount, rate_monthly, LOAN_TERM_MONTHS);

  // KEY LOGIC: The debts being settled are REPLACED by the new Muḽo repayment.
  // Post-settlement DTI = new repayment only / gross income.
  // existing_monthly_commitments that are settled go to ZERO.
  // Any commitments NOT being settled (e.g. store credit) remain.
  const unsettled_commitments = financial.unsettled_monthly_commitments || 0;
  const total_monthly_debt    = unsettled_commitments + proposed_repayment;
  const dti                   = total_monthly_debt / financial.gross_monthly_income;
  const surplus               = financial.gross_monthly_income - financial.monthly_expenses - total_monthly_debt;

  if (!financial.income_verified) failures.push({ code: 'INCOME_NOT_VERIFIED', reason: 'Income could not be verified via bank statements' });
  if (dti > MAX_DTI)              failures.push({ code: 'DTI_EXCEEDED',        reason: `Post-settlement DTI is ${(dti*100).toFixed(1)}% — maximum is 43%` });
  if (surplus < MIN_SURPLUS)      failures.push({ code: 'INSUFFICIENT_SURPLUS', reason: `Monthly surplus of R ${Math.round(surplus)} is below the R 3,500 minimum` });

  const max_debt_service    = financial.gross_monthly_income * MAX_DTI;
  const available_service   = max_debt_service - unsettled_commitments;
  const max_by_affordability = available_service > 0 ? Math.round(loanFromRepayment(available_service, rate_monthly, LOAN_TERM_MONTHS)) : 0;

  return {
    gate: 3, name: 'Affordability', passed: failures.length === 0, failures,
    calculations: {
      gross_monthly_income:         financial.gross_monthly_income,
      monthly_expenses:             financial.monthly_expenses,
      existing_monthly_commitments: financial.existing_monthly_commitments,
      unsettled_commitments,
      proposed_repayment:           Math.round(proposed_repayment),
      total_monthly_debt:           Math.round(total_monthly_debt),
      dti_percent:                  +(dti * 100).toFixed(1),
      surplus:                      Math.round(surplus),
      max_by_affordability,
      monthly_saving_vs_current:    Math.round(financial.existing_monthly_commitments - proposed_repayment),
    },
  };
}

// ── GATE 4 — Credit Risk (XGBoost) ──────────────────────────

function gate4_creditRisk(credit, financial, property) {
  const failures = [];
  if (credit.credit_score < 600)    failures.push({ code: 'LOW_CREDIT_SCORE', reason: `Credit score of ${credit.credit_score} is below 600 minimum` });
  if (credit.judgements_24m > 0)    failures.push({ code: 'JUDGEMENTS',       reason: `${credit.judgements_24m} judgement(s) in the last 24 months` });
  if (credit.missed_payments_6m > 0) failures.push({ code: 'MISSED_PAYMENTS', reason: `${credit.missed_payments_6m} missed payment(s) in the last 6 months` });

  const features  = buildFeatureVector(credit, financial, property);
  const pd_score  = simulateXGBoost(features);
  const mulo_score = pdToMuloScore(pd_score);

  if (mulo_score < MIN_MULO_SCORE)  failures.push({ code: 'LOW_MULO_SCORE', reason: `Muḽo Score of ${mulo_score} is below the minimum of 50` });

  const shap_values = generateSHAP(features, pd_score);

  return {
    gate: 4, name: 'Credit Risk', passed: failures.length === 0, failures,
    scores: { credit_score: credit.credit_score, pd_score: +pd_score.toFixed(1), mulo_score },
    shap_values,
    features,
  };
}

// ── FEATURE VECTOR (40 features) ─────────────────────────────

function buildFeatureVector(credit, financial, property) {
  return {
    credit_score:           credit.credit_score,
    missed_payments_6m:     credit.missed_payments_6m,
    missed_payments_12m:    credit.missed_payments_12m || 0,
    judgements_24m:         credit.judgements_24m,
    defaults_ever:          credit.defaults_ever || 0,
    accounts_in_arrears:    credit.accounts_in_arrears || 0,
    credit_utilisation:     credit.credit_utilisation || 0,
    oldest_account_months:  credit.oldest_account_months || 0,
    total_accounts:         credit.total_accounts || 0,
    closed_accounts:        credit.closed_accounts || 0,
    gross_monthly_income:   financial.gross_monthly_income,
    net_monthly_income:     financial.net_monthly_income || financial.gross_monthly_income * 0.7,
    months_employed:        financial.months_employed || 0,
    income_type:            financial.income_type === 'salaried' ? 1 : 0,
    income_volatility:      financial.income_volatility || 0.1,
    employer_tenure_months: financial.employer_tenure_months || 0,
    monthly_expenses:       financial.monthly_expenses,
    existing_commitments:   financial.existing_monthly_commitments,
    dti_current:            financial.existing_monthly_commitments / financial.gross_monthly_income,
    expense_ratio:          financial.monthly_expenses / financial.gross_monthly_income,
    savings_rate:           (financial.average_monthly_savings || 0) / financial.gross_monthly_income,
    property_value:         property.market_value,
    bond_balance:           property.bond_balance,
    ltv_current:            property.bond_balance / property.market_value,
    equity_amount:          property.market_value - property.bond_balance,
    property_age_years:     property.property_age_years || 10,
    years_at_address:       property.years_at_address || 5,
    loan_to_income:         0,
    debt_types_count:       0,
    high_utilisation_flag:  (credit.credit_utilisation || 0) > 75 ? 1 : 0,
    recent_enquiries_3m:    credit.recent_enquiries_3m || 0,
    derogatory_marks:       (credit.judgements_24m || 0) + (credit.defaults_ever || 0),
    payment_behaviour_score: Math.max(0, 100 - (credit.missed_payments_12m || 0) * 20),
    address_stability:      Math.min(1, (property.years_at_address || 5) / 10),
    employment_stability:   Math.min(1, (financial.months_employed || 0) / 60),
    income_growth:          financial.income_growth_pct || 0,
    income_x_tenure:        financial.gross_monthly_income * Math.min(1, (financial.months_employed || 24) / 60),
    equity_x_score:         (property.market_value - property.bond_balance) * (credit.credit_score / 850),
    dti_x_volatility:       (financial.existing_monthly_commitments / financial.gross_monthly_income) * (financial.income_volatility || 0.1),
    bureau_pull_age_days:   0,
    data_completeness:      1.0,
  };
}

// ── XGBOOST SIMULATION ───────────────────────────────────────

function simulateXGBoost(features) {
  let log_odds = -2.5;
  log_odds += -0.008  * (features.credit_score - 600);
  log_odds +=  0.8    * features.missed_payments_6m;
  log_odds +=  0.4    * features.missed_payments_12m;
  log_odds +=  1.2    * features.judgements_24m;
  log_odds +=  0.6    * features.defaults_ever;
  log_odds +=  0.3    * features.accounts_in_arrears;
  log_odds +=  3.0    * Math.max(0, features.dti_current - 0.3);
  log_odds += -0.5    * features.employment_stability;
  log_odds += -0.3    * features.address_stability;
  log_odds +=  0.8    * features.income_volatility;
  log_odds += -0.000002 * features.equity_amount;
  log_odds +=  1.5    * Math.max(0, features.ltv_current - 0.6);
  log_odds +=  0.015  * features.credit_utilisation;
  log_odds +=  0.2    * features.recent_enquiries_3m;
  log_odds += -0.3    * features.income_growth;
  log_odds += -0.2    * Math.min(features.total_accounts, 10) * 0.1;
  const pd = 1 / (1 + Math.exp(-log_odds));
  return Math.min(99, Math.max(1, pd * 100));
}

// ── PD → MUḼO SCORE ─────────────────────────────────────────

function pdToMuloScore(pd) {
  if (pd < 5)  return Math.round(80 + (5 - pd) / 5 * 20);
  if (pd < 10) return Math.round(65 + (10 - pd) / 5 * 15);
  if (pd < 15) return Math.round(50 + (15 - pd) / 5 * 15);
  return Math.round(Math.max(0, 50 - (pd - 15) * 2));
}

// ── SHAP EXPLANATIONS ────────────────────────────────────────

function generateSHAP(features, pd_score) {
  const contributions = [
    {
      feature: 'credit_score', value: features.credit_score,
      impact: -(features.credit_score - 650) * 0.008,
      direction: features.credit_score >= 650 ? 'positive' : 'negative',
      label: `Credit score of ${features.credit_score}`,
      explanation: features.credit_score >= 700
        ? 'Your credit score reflects a strong repayment history.'
        : features.credit_score >= 600
        ? 'Your credit score is acceptable but could be improved.'
        : 'Your credit score indicates elevated risk.',
    },
    {
      feature: 'missed_payments_6m', value: features.missed_payments_6m,
      impact: features.missed_payments_6m * 0.8,
      direction: features.missed_payments_6m === 0 ? 'positive' : 'negative',
      label: `${features.missed_payments_6m} missed payment(s) in last 6 months`,
      explanation: features.missed_payments_6m === 0
        ? 'No missed payments in the last 6 months — excellent payment behaviour.'
        : `${features.missed_payments_6m} missed payment(s) recently indicate repayment risk.`,
    },
    {
      feature: 'dti_current', value: +(features.dti_current * 100).toFixed(1),
      impact: Math.max(0, features.dti_current - 0.3) * 3.0,
      direction: features.dti_current < 0.35 ? 'positive' : 'negative',
      label: `Current debt-to-income ratio: ${(features.dti_current * 100).toFixed(1)}%`,
      explanation: features.dti_current < 0.35
        ? 'Your debt load is manageable relative to your income.'
        : 'Your existing debt commitments are high relative to your income.',
    },
    {
      feature: 'employment_stability', value: features.months_employed,
      impact: -features.employment_stability * 0.5,
      direction: features.employment_stability > 0.5 ? 'positive' : 'negative',
      label: `Employment tenure: ${features.months_employed} months`,
      explanation: features.months_employed >= 24
        ? 'Stable employment history reduces risk.'
        : 'Shorter employment history increases uncertainty.',
    },
    {
      feature: 'equity_amount', value: features.equity_amount,
      impact: -features.equity_amount * 0.000002,
      direction: 'positive',
      label: `Available equity: R ${features.equity_amount.toLocaleString()}`,
      explanation: 'Property equity provides security for the loan.',
    },
  ];

  contributions.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  const positives = contributions.filter(c => c.direction === 'positive').map(c => c.label);
  const negatives = contributions.filter(c => c.direction === 'negative').map(c => c.label);

  let summary;
  if (pd_score < 5)       summary = `Very low credit risk. Key strengths: ${positives.slice(0,2).join('; ')}.`;
  else if (pd_score < 10) summary = `Acceptable risk. Strength: ${positives[0]}. Note: ${negatives[0] || 'none'}.`;
  else if (pd_score < 15) summary = `Moderate risk. Primary concern: ${negatives[0] || 'review credit profile'}.`;
  else                     summary = `Does not meet risk criteria. Factors: ${negatives.slice(0,2).join('; ')}.`;

  return { base_pd: 8.0, final_pd: +pd_score.toFixed(1), top_factors: contributions.slice(0, 5), summary };
}

// ── DEBT WATERFALL ───────────────────────────────────────────

function buildDebtWaterfall(debts, max_loan_amount) {
  const eligible = debts.filter(d => DEBT_PRIORITY.includes(d.type));
  const sorted   = eligible.sort((a, b) => DEBT_PRIORITY.indexOf(a.type) - DEBT_PRIORITY.indexOf(b.type));

  let remaining = max_loan_amount;
  const tranches = [];
  let total = 0;

  for (const debt of sorted) {
    if (remaining <= 0) break;
    const amount = Math.min(debt.balance, remaining);
    tranches.push({
      sequence: tranches.length + 1,
      creditor: debt.creditor,
      type: debt.type,
      outstanding: debt.balance,
      settlement: Math.round(amount),
      monthly_saving: debt.monthly_payment,
      status: 'pending',
    });
    remaining -= amount;
    total     += amount;
  }

  return {
    tranches,
    total_settlement: Math.round(total),
    monthly_saving:   tranches.reduce((s, t) => s + t.monthly_saving, 0),
    debts_excluded:   debts.filter(d => !DEBT_PRIORITY.includes(d.type)).map(d => d.creditor),
  };
}

// ── OFFER CALCULATOR ─────────────────────────────────────────

function calculateOffer(mulo_score, equity_cap, affordability_cap, waterfall) {
  const band = RATE_BANDS.find(b => mulo_score >= b.minScore);
  if (!band) return null;

  const rate_annual        = PRIME_RATE + band.spread;
  const rate_monthly       = rate_annual / 100 / 12;
  const approved_amount    = Math.min(equity_cap, affordability_cap, waterfall.total_settlement);
  const monthly_repayment  = calculateRepayment(approved_amount, rate_monthly, LOAN_TERM_MONTHS);
  const initiation_fee     = Math.min(MAX_INITIATION_FEE, Math.round(approved_amount * 0.015 + 1000));
  const total_cost         = monthly_repayment * LOAN_TERM_MONTHS + initiation_fee;

  return {
    approved:          true,
    loan_amount:       Math.round(approved_amount),
    rate_annual:       +rate_annual.toFixed(2),
    rate_label:        band.spread === 0 ? 'Prime' : band.spread < 0 ? `Prime − ${Math.abs(band.spread)}%` : `Prime + ${band.spread}%`,
    term_months:       LOAN_TERM_MONTHS,
    monthly_repayment: Math.round(monthly_repayment),
    initiation_fee,
    monthly_service:   MONTHLY_SERVICE,
    total_cost:        Math.round(total_cost),
    mulo_score,
    risk_band:         band.label,
    monthly_saving:    waterfall.monthly_saving - Math.round(monthly_repayment),
  };
}

// ── FINANCIAL HELPERS ────────────────────────────────────────

function calculateRepayment(principal, rate_monthly, term) {
  if (rate_monthly === 0) return principal / term;
  return principal * rate_monthly / (1 - Math.pow(1 + rate_monthly, -term));
}

function loanFromRepayment(repayment, rate_monthly, term) {
  if (rate_monthly === 0) return repayment * term;
  return repayment * (1 - Math.pow(1 + rate_monthly, -term)) / rate_monthly;
}

// ── MAIN ENGINE ──────────────────────────────────────────────

function runMuloEngine(input) {
  const { applicant, property, financial, credit, debts } = input;

  const result = {
    application_id:  input.application_id || `MULO-${Date.now()}`,
    timestamp:       new Date().toISOString(),
    decision:        null,
    gates:           {},
    offer:           null,
    waterfall:       null,
    shap:            null,
    decline_reasons: [],
  };

  // Gate 1
  const g1 = gate1_identity(applicant);
  result.gates.gate1 = g1;
  if (!g1.passed) { result.decision = 'DECLINE'; result.decline_code = 'GATE1_FAILED'; result.decline_reasons = g1.failures.map(f => f.reason); return result; }

  // Gate 2
  const g2 = gate2_property(applicant, property);
  result.gates.gate2 = g2;
  if (!g2.passed) { result.decision = 'DECLINE'; result.decline_code = 'GATE2_FAILED'; result.decline_reasons = g2.failures.map(f => f.reason); return result; }

  // Gate 4 (run before Gate 3 to get rate)
  const g4 = gate4_creditRisk(credit, financial, property);
  result.gates.gate4 = g4;
  result.shap        = g4.shap_values;
  if (!g4.passed) { result.decision = 'DECLINE'; result.decline_code = 'GATE4_FAILED'; result.decline_reasons = g4.failures.map(f => f.reason); return result; }

  const mulo_score = g4.scores.mulo_score;
  const band       = RATE_BANDS.find(b => mulo_score >= b.minScore);
  const rate       = PRIME_RATE + band.spread;

  // Gate 3
  const equity_cap   = g2.calculations.max_by_equity;
  const g3           = gate3_affordability(financial, equity_cap, rate);
  result.gates.gate3 = g3;
  if (!g3.passed) { result.decision = 'DECLINE'; result.decline_code = 'GATE3_FAILED'; result.decline_reasons = g3.failures.map(f => f.reason); return result; }

  // Waterfall + Offer
  const affordability_cap = g3.calculations.max_by_affordability;
  const max_loan          = Math.min(equity_cap, affordability_cap);
  const waterfall         = buildDebtWaterfall(debts, max_loan);
  result.waterfall        = waterfall;

  const offer = calculateOffer(mulo_score, equity_cap, affordability_cap, waterfall);
  if (!offer) { result.decision = 'DECLINE'; result.decline_code = 'NO_OFFER'; result.decline_reasons = ['Unable to generate a qualifying offer']; return result; }

  result.decision = 'APPROVE';
  result.offer    = offer;
  return result;
}

// ── DEMO DATA — THABO NKOSI ──────────────────────────────────

const THABO_NKOSI = {
  application_id: 'MULO-DEMO-001',
  applicant: {
    name: 'Thabo Nkosi', age: 38, citizenship: 'citizen',
    dha_verified: true, liveness_passed: true,
    under_debt_review: false, sequestrated: false, administration_order: false,
  },
  property: {
    address: '34 Jacaranda Avenue, Kempton Park Ext 2, Gauteng',
    erf: 'Erf 4821', title_deed: 'T 48291/2019',
    registered_owner: true, property_type: 'residential',
    market_value: 1850000, bond_balance: 1070000,
    property_age_years: 12, years_at_address: 7,
  },
  financial: {
    gross_monthly_income: 52000, net_monthly_income: 38500,
    monthly_expenses: 18000, existing_monthly_commitments: 13500,
    average_monthly_savings: 4500, income_verified: true,
    income_type: 'salaried', months_employed: 84,
    employer_tenure_months: 84, income_volatility: 0.05, income_growth_pct: 0.08,
  },
  credit: {
    credit_score: 742, missed_payments_6m: 0, missed_payments_12m: 0,
    judgements_24m: 0, defaults_ever: 0, accounts_in_arrears: 0,
    credit_utilisation: 42, oldest_account_months: 156,
    total_accounts: 8, closed_accounts: 2, recent_enquiries_3m: 1,
  },
  debts: [
    { creditor: 'African Bank', type: 'personal_loan',   balance: 125000, monthly_payment: 3200 },
    { creditor: 'Nedbank',      type: 'personal_loan',   balance: 68000,  monthly_payment: 1850 },
    { creditor: 'Capitec',      type: 'credit_card',     balance: 48000,  monthly_payment: 2100 },
    { creditor: 'FNB',          type: 'credit_card',     balance: 31500,  monthly_payment: 1400 },
    { creditor: 'Wesbank',      type: 'vehicle_finance', balance: 245000, monthly_payment: 4980 },
  ],
};

// ── PRINT RESULT ─────────────────────────────────────────────

function printResult(result) {
  const R = n => `R ${Number(n).toLocaleString('en-ZA')}`;
  const line = '═'.repeat(60);
  const dash = '─'.repeat(60);

  console.log('\n' + line);
  console.log('  MUḼO ENGINE — CREDIT DECISION');
  console.log(line);
  console.log(`  Application: ${result.application_id}`);
  console.log(`  DECISION:    ${result.decision === 'APPROVE' ? '✅ APPROVED' : '❌ DECLINED'}`);
  console.log(dash);

  console.log('\n  GATE RESULTS:');
  Object.values(result.gates).forEach(g => {
    console.log(`  ${g.passed ? '✅' : '❌'} Gate ${g.gate} — ${g.name}`);
    if (!g.passed) g.failures.forEach(f => console.log(`      ↳ ${f.reason}`));
  });

  if (result.decision === 'DECLINE') {
    console.log('\n  DECLINE REASONS:');
    result.decline_reasons.forEach(r => console.log(`  • ${r}`));
    console.log(line + '\n');
    return;
  }

  const g2 = result.gates.gate2?.calculations;
  console.log('\n  PROPERTY:');
  console.log(`  Market value:     ${R(g2.market_value)}`);
  console.log(`  Bond balance:     ${R(g2.bond_balance)}`);
  console.log(`  Available equity: ${R(g2.equity)}`);
  console.log(`  Max by equity:    ${R(g2.max_by_equity)}  (equity × 75%)`);
  console.log(`  LTV post-loan:    ${g2.ltv_post_loan}%`);

  const g3 = result.gates.gate3?.calculations;
  console.log('\n  AFFORDABILITY:');
  console.log(`  Gross income:     ${R(g3.gross_monthly_income)}/month`);
  console.log(`  Existing debt:    ${R(g3.existing_monthly_commitments)}/month`);
  console.log(`  Proposed repay:   ${R(g3.proposed_repayment)}/month`);
  console.log(`  DTI ratio:        ${g3.dti_percent}%  (max 43%)`);
  console.log(`  Surplus:          ${R(g3.surplus)}/month  (min R 3,500)`);
  console.log(`  Max by afford:    ${R(g3.max_by_affordability)}`);

  const g4 = result.gates.gate4?.scores;
  console.log('\n  CREDIT RISK:');
  console.log(`  Credit score:     ${g4.credit_score}`);
  console.log(`  PD score:         ${g4.pd_score}%`);
  console.log(`  Muḽo Score:       ${g4.mulo_score} / 100`);

  if (result.shap) {
    console.log('\n  SHAP — TOP DECISION FACTORS:');
    result.shap.top_factors.forEach((f, i) => {
      console.log(`  ${i+1}. [${f.direction === 'positive' ? '↑ helps' : '↓ hurts'}] ${f.label}`);
      console.log(`     ${f.explanation}`);
    });
    console.log(`\n  NCA Summary: ${result.shap.summary}`);
  }

  if (result.waterfall) {
    console.log('\n  DEBT SETTLEMENT — TRANCHE ORDER:');
    result.waterfall.tranches.forEach(t => {
      console.log(`  ${t.sequence}. ${t.creditor.padEnd(16)} ${t.type.replace('_',' ').padEnd(18)} ${R(t.settlement).padStart(14)}  saves ${R(t.monthly_saving)}/month`);
    });
    console.log(`  ${''.padEnd(48)} ─────────────`);
    console.log(`  ${'TOTAL'.padEnd(48)} ${R(result.waterfall.total_settlement)}`);
    console.log(`  Combined monthly saving from settling all debts: ${R(result.waterfall.monthly_saving)}/month`);
  }

  if (result.offer) {
    const o = result.offer;
    console.log('\n' + dash);
    console.log('  ✅ APPROVED OFFER');
    console.log(dash);
    console.log(`  Loan amount:      ${R(o.loan_amount)}`);
    console.log(`  Interest rate:    ${o.rate_annual}% p.a. (${o.rate_label})`);
    console.log(`  Risk band:        ${o.risk_band}  |  Muḽo Score: ${o.mulo_score}/100`);
    console.log(`  Term:             ${o.term_months} months`);
    console.log(`  Monthly repay:    ${R(o.monthly_repayment)}/month`);
    console.log(`  Monthly saving:   ${R(o.monthly_saving)}/month vs current payments`);
    console.log(`  Initiation fee:   ${R(o.initiation_fee)}`);
    console.log(`  Service fee:      ${R(o.monthly_service)}/month`);
    console.log(line + '\n');
  }
}

// ── RUN ──────────────────────────────────────────────────────

if (require.main === module) {
  const result = runMuloEngine(THABO_NKOSI);
  printResult(result);
}

exports.handler = async (event) => {
  try {
 const parsed = typeof event.body === 'string' ? JSON.parse(event.body) : event;
    const input  = (parsed && parsed.applicant) ? parsed : THABO_NKOSI;   const result = runMuloEngine(input);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': 'https://mulo.co.za' },
      body: JSON.stringify(result),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

// module.exports for local testing only
