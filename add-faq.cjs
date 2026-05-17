const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const faqSection = `
          {/* FAQ Section */}
          <div style={{padding:"0 24px 32px"}}>
            <div style={{fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:800,color:"#0A1628",marginBottom:4}}>Frequently asked questions</div>
            <div style={{fontSize:13,color:"#8FA3BE",marginBottom:20}}>Everything you need to know before you apply.</div>
            {[
              {
                q: "What exactly is Muḽo?",
                a: "Muḽo is a digital platform that lets South African homeowners access the equity in their home to pay off expensive unsecured debt — personal loans, credit cards and vehicle finance. Instead of paying 20–28% interest on those debts, you consolidate them into your existing home loan at your current home loan rate. You apply in under 5 minutes, entirely online."
              },
              {
                q: "What interest rate will I pay?",
                a: "You pay your current home loan interest rate — not a new rate. Because this is a further advance on your existing bond, it is added to your current facility at the same rate your bank already approved for you. This is typically prime minus 0.5% to prime plus 1%, depending on your original bond agreement. No new credit committee approval is needed."
              },
              {
                q: "How long is the repayment term?",
                a: "Your repayment term is the number of years remaining on your current home loan — not a fixed 5-year personal loan term. For example, if you have 10 years left on your bond, the further advance is repaid over those same 10 years. This makes your monthly payment significantly lower than an unsecured loan for the same amount. We require a minimum of 5 years remaining on your bond to qualify."
              },
              {
                q: "Do I qualify?",
                a: "You may qualify if you: (1) own a home in South Africa with a registered bond, (2) have at least 5 years remaining on your home loan, (3) have unsecured debt such as personal loans, credit cards or vehicle finance to consolidate, and (4) have sufficient equity — we lend up to 75% of your property's current market value, less your outstanding bond balance."
              },
              {
                q: "Why only up to 75% of my property value?",
                a: "The 75% limit is a responsible lending rule that protects you. It ensures you retain at least 25% equity in your home even after the further advance. This protects you if property values dip, and it protects the bank's security. It is also the standard limit applied by South African banks for further advances under the National Credit Act."
              },
              {
                q: "How is my money paid out?",
                a: "Funds are released one debt at a time, directly into your verified bank account — the same account linked to your home loan. You then pay the creditor yourself and upload proof of settlement. Once Muḽo confirms the account is closed with the credit bureau, the next payment is released. This step-by-step approach ensures every rand goes exactly where it should."
              },
              {
                q: "Is my personal data safe?",
                a: "Yes — your data is protected by multiple layers of security. Your SA ID number is never stored in full; we store only a one-way SHA-256 cryptographic hash that cannot be reversed. All data is stored exclusively on AWS servers located in South Africa (Cape Town region) in compliance with POPIA. We obtain your explicit consent before accessing any bureau data, and your information is never sold or shared with third parties."
              },
              {
                q: "How does Muḽo access my financial information?",
                a: "With your explicit consent, Muḽo retrieves your property valuation and bond details from Lightstone, your income and bank statements from TruID (read-only, no transactions possible), and your credit profile from TransUnion. This data is used solely to calculate your offer. You can withdraw consent at any time from your profile settings."
              },
              {
                q: "Will applying affect my credit score?",
                a: "Checking your eligibility on Muḽo does not affect your credit score. A credit enquiry is only recorded when you formally accept an offer and the further advance is processed by your bank — which is standard practice for any credit application."
              },
              {
                q: "How long does the process take?",
                a: "The application takes under 5 minutes. Once submitted, your documents are reviewed within 30 minutes during business hours. Funds are typically released within 24–48 hours of signing."
              },
            ].map((item, idx) => <FaqItem key={idx} q={item.q} a={item.a} />)}
          </div>`;

// Find the end of the landing page scroll content to insert FAQ before the bottom CTA
const insertBefore = `      <div className="bottom-cta">
        <button className="btn btn-primary" onClick={() => go("id-verify")}>Check if you qualify →</button>`;

if (!code.includes(insertBefore)) {
  console.log('INSERT POINT NOT FOUND');
  process.exit(1);
}

code = code.replace(insertBefore, faqSection + '\n' + insertBefore);

// Add FaqItem component before Landing function
const faqComponent = `
function FaqItem({ q, a }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{borderBottom:"1px solid rgba(0,0,0,0.06)",paddingBottom:0}}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 0",cursor:"pointer",gap:12}}
      >
        <div style={{fontSize:14,fontWeight:600,color:"#0A1628",lineHeight:1.4}}>{q}</div>
        <div style={{fontSize:18,color:"#00B8A9",flexShrink:0,transition:"transform 0.2s",transform:open?"rotate(45deg)":"rotate(0deg)"}}>+</div>
      </div>
      {open && (
        <div style={{fontSize:13,color:"#4A6080",lineHeight:1.7,paddingBottom:16}}>
          {a}
        </div>
      )}
    </div>
  );
}

`;

const insertComponentBefore = `function Landing({ go }) {`;
if (code.includes(insertComponentBefore)) {
  code = code.replace(insertComponentBefore, faqComponent + insertComponentBefore);
  console.log('FaqItem component added');
}

// Add React import for useState in FaqItem
if (!code.includes("import React")) {
  code = code.replace(
    `import { useState, useEffect, useRef } from "react";`,
    `import React, { useState, useEffect, useRef } from "react";`
  );
  console.log('React import updated');
}

fs.writeFileSync('src/App.jsx', code);
console.log('SUCCESS - FAQ section added');
