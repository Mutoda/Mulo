const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'lambda/mulo-engine/index.js');
let code = fs.readFileSync(filePath, 'utf8');
let changes = 0;

const replacements = [
  // 1. Add bond_rate_margin to mockLightstone
  [`    bond_term_months: 240,\n    ltv: Math.round(bondBalance / propertyValue * 100) / 100`,
   `    bond_term_months: 240,\n    bond_rate_margin: [-0.5, 0, 0.5, 1.0][seed % 4],\n    ltv: Math.round(bondBalance / propertyValue * 100) / 100`,
   'Added bond_rate_margin to mockLightstone'],

  // 2. Update calculateOffer signature
  [`const calculateOffer = (propertyValue, bondBalance, grossIncome, monthlyExpenses, debts) => {`,
   `const calculateOffer = (propertyValue, bondBalance, grossIncome, monthlyExpenses, debts, bondStartDate, bondRateMargin) => {`,
   'Updated calculateOffer signature'],

  // 3. Add remaining term + bond rate before debt sort
  [`  // Sort debts by priority: personal loans first, then credit cards, then vehicle`,
   `  // Calculate remaining bond term (assume 20yr/240 month original term)\n  const bondStart = bondStartDate ? new Date(bondStartDate) : new Date('2016-01-01');\n  const monthsElapsed = Math.floor((Date.now() - bondStart.getTime()) / (1000 * 60 * 60 * 24 * 30.44));\n  const remainingMonths = Math.max(0, 240 - monthsElapsed);\n\n  if (remainingMonths < 60) {\n    return { approved: false, reason: 'Your home loan has less than 5 years remaining. A further advance is not available at this stage.' };\n  }\n\n  const margin = bondRateMargin !== undefined ? bondRateMargin : 0;\n  const bondRate = PRIME_RATE + margin;\n  const rateLabel = margin === -0.5 ? 'Prime - 0.5%' : margin === 0 ? 'Prime' : margin === 0.5 ? 'Prime + 0.5%' : 'Prime + 1%';\n\n  // Sort debts by priority: personal loans first, then credit cards, then vehicle`,
   'Added remaining term + bond rate'],

  // 4. Replace termMonths=60 and rate bands
  [`  const loanAmount = totalDebt;\n  const termMonths = 60;\n\n  // Try each rate band\n  const bands = [\n    { score: 82, pd: 0.032, rate: PRIME_RATE - 0.5, label: 'Prime - 0.5%', band: 'Excellent' },\n    { score: 70, pd: 0.075, rate: PRIME_RATE, label: 'Prime', band: 'Good' },\n    { score: 55, pd: 0.125, rate: PRIME_RATE + 0.5, label: 'Prime + 0.5%', band: 'Fair' }\n  ];\n\n  // Simple credit score estimation based on available data\n  const dtiRatio = currentCommitments / grossIncome;\n  let muloScore = 82;\n  if (dtiRatio > 0.35) muloScore = 70;\n  if (dtiRatio > 0.40) muloScore = 55;\n  if (dtiRatio > 0.43) return { approved: false, reason: 'DTI ratio exceeds 43% — affordability limit reached' };\n\n  const band = bands.find(b => muloScore >= b.score) || bands[bands.length - 1];\n  const monthlyRate = band.rate / 100 / 12;\n  const monthlyRepayment = Math.round(loanAmount * monthlyRate * Math.pow(1 + monthlyRate, termMonths) / (Math.pow(1 + monthlyRate, termMonths) - 1));`,
   `  const loanAmount = totalDebt;\n  const termMonths = remainingMonths;\n\n  const dtiRatio = currentCommitments / grossIncome;\n  let muloScore = 82;\n  if (dtiRatio > 0.35) muloScore = 70;\n  if (dtiRatio > 0.40) muloScore = 55;\n  if (dtiRatio > 0.43) return { approved: false, reason: 'DTI ratio exceeds 43% — affordability limit reached' };\n\n  const monthlyRate = bondRate / 100 / 12;\n  const monthlyRepayment = Math.round(loanAmount * monthlyRate * Math.pow(1 + monthlyRate, termMonths) / (Math.pow(1 + monthlyRate, termMonths) - 1));`,
   'Replaced termMonths=60 and rate bands'],

  // 5. Fix return statement
  [`    interest_rate: band.rate,\n    rate_label: band.label,\n    term_months: termMonths,`,
   `    interest_rate: bondRate,\n    rate_label: rateLabel,\n    term_months: termMonths,\n    remaining_months: remainingMonths,`,
   'Updated return to use bondRate'],

  // 6. Fix pd_score and risk_band
  [`    pd_score: band.pd,\n    risk_band: band.band,`,
   `    pd_score: muloScore >= 75 ? 0.032 : muloScore >= 60 ? 0.075 : 0.125,\n    risk_band: muloScore >= 75 ? 'Excellent' : muloScore >= 60 ? 'Good' : 'Fair',`,
   'Fixed pd_score and risk_band'],

  // 7. Pass bond data to calculateOffer
  [`  const result = calculateOffer(\n    Number(propValue),\n    Number(bondBal),\n    Number(grossInc),\n    Number(monthlyExp || 0),\n    debtList\n  );`,
   `  const bondStartDate = body.bond_start_date || bureau?.lightstone?.bond_start_date;\n  const bondRateMargin = body.bond_rate_margin !== undefined ? body.bond_rate_margin : bureau?.lightstone?.bond_rate_margin;\n  const result = calculateOffer(\n    Number(propValue),\n    Number(bondBal),\n    Number(grossInc),\n    Number(monthlyExp || 0),\n    debtList,\n    bondStartDate,\n    bondRateMargin\n  );`,
   'Pass bond data to calculateOffer'],
];

for (const [from, to, label] of replacements) {
  if (code.includes(from)) {
    code = code.replace(from, to);
    changes++;
    console.log('OK:', label);
  } else {
    console.log('SKIP (not found):', label);
  }
}

fs.writeFileSync(filePath, code);
console.log('\nTotal changes:', changes);
console.log('bondRate refs:', (code.match(/bondRate/g)||[]).length);
console.log('remainingMonths refs:', (code.match(/remainingMonths/g)||[]).length);
