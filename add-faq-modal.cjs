const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Add FAQ modal state to Landing component
code = code.replace(
  `function Landing({ go }) {`,
  `function Landing({ go }) {
  const [faqOpen, setFaqOpen] = React.useState(false);`
);

// 2. Add FAQ nav button next to Sign in
code = code.replace(
  `<div className="hero-signin" onClick={() => go("login")}>Sign in →</div>`,
  `<div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.6)",cursor:"pointer"}} onClick={() => setFaqOpen(true)}>FAQ</div>
            <div className="hero-signin" onClick={() => go("login")}>Sign in →</div>
          </div>`
);

// 3. Add FAQ modal before closing screen div
code = code.replace(
  `function IdVerify({ go }) {`,
  `function FaqModal({ onClose }) {
  const faqs = [
    { q: "What exactly is Muḽo?", a: "Muḽo is a digital platform that lets South African homeowners access the equity in their home to pay off expensive unsecured debt — personal loans, credit cards and vehicle finance. Instead of paying 20–28% interest on those debts, you consolidate them into your existing home loan at your current home loan interest rate. You apply in under 5 minutes, entirely online." },
    { q: "What interest rate will I pay?", a: "You pay your current home loan interest rate — not a new rate. Because this is a further advance on your existing bond, it is added to your current facility at the same rate your bank already approved for you. This means no new credit committee approval is needed, and you benefit from a much lower rate than any unsecured loan." },
    { q: "How long is the repayment term?", a: "Your repayment term is the number of years remaining on your current home loan. For example, if you have 10 years left on your bond, the further advance is repaid over those same 10 years. This keeps your monthly payment much lower than a typical 5-year personal loan for the same amount. We require a minimum of 5 years remaining on your home loan to qualify." },
    { q: "Do I qualify?", a: "You may qualify if you: (1) own a home in South Africa with a registered bond, (2) have at least 5 years remaining on your home loan, (3) have unsecured debt such as personal loans, credit cards or vehicle finance to consolidate, and (4) have sufficient equity — we lend up to 75% of your property's current market value, less your outstanding bond balance." },
    { q: "Why only up to 75% of my property value?", a: "The 75% limit is a responsible lending rule that protects you. It ensures you retain at least 25% equity in your home even after the further advance. This protects you if property values dip, and gives the bank adequate security. It is the standard limit applied by South African banks for further advances under the National Credit Act." },
    { q: "How is my money paid out?", a: "Funds are released one debt at a time, directly into your verified bank account. You settle each creditor yourself and upload proof of payment. Once Muḽo confirms with the credit bureau that the account is closed, the next payment is released into your account. This step-by-step approach ensures every rand goes exactly where it should — no money is sent directly to creditors without your involvement." },
    { q: "Is my personal data safe?", a: "Yes — your data is protected by multiple layers of security. Your SA ID number is never stored as-is; we store only a one-way SHA-256 cryptographic hash that cannot be reversed. All data is stored on AWS servers in South Africa (Cape Town) in compliance with POPIA. Your information is never sold or shared with third parties." },
    { q: "How does Muḽo access my financial information?", a: "With your explicit consent, Muḽo retrieves your property valuation and bond details from Lightstone, your income and bank statements from TruID (read-only access — no transactions are possible), and your credit profile from TransUnion. This data is used solely to calculate your personalised offer and is never stored beyond what is necessary." },
    { q: "Will applying affect my credit score?", a: "Checking your eligibility on Muḽo does not affect your credit score. A credit enquiry is only recorded when you formally accept an offer and the further advance is processed by your bank — which is standard practice for any credit application in South Africa." },
    { q: "How long does the process take?", a: "The application takes under 5 minutes. Your documents are reviewed within 30 minutes during business hours. Funds are typically released within 24–48 hours of signing your agreement." },
  ];
  const [openIdx, setOpenIdx] = React.useState(null);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(10,22,40,0.85)",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:"24px 24px 0 0",width:"100%",maxWidth:430,maxHeight:"85vh",overflow:"hidden",display:"flex",flexDirection:"column"}} onClick={e => e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 24px 16px",borderBottom:"1px solid rgba(0,0,0,0.06)"}}>
          <div style={{fontFamily:"'Sora',sans-serif",fontSize:17,fontWeight:800,color:"#0A1628"}}>Frequently asked questions</div>
          <div style={{width:32,height:32,borderRadius:"50%",background:"#F7F9FC",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:16,color:"#8FA3BE"}} onClick={onClose}>✕</div>
        </div>
        <div style={{overflowY:"auto",flex:1,padding:"0 24px 32px"}}>
          {faqs.map((item, idx) => (
            <div key={idx} style={{borderBottom:"1px solid rgba(0,0,0,0.06)"}}>
              <div onClick={() => setOpenIdx(openIdx === idx ? null : idx)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 0",cursor:"pointer",gap:12}}>
                <div style={{fontSize:14,fontWeight:600,color:"#0A1628",lineHeight:1.4}}>{item.q}</div>
                <div style={{fontSize:20,color:"#00B8A9",flexShrink:0,transition:"transform 0.2s",transform:openIdx===idx?"rotate(45deg)":"rotate(0deg)"}}>+</div>
              </div>
              {openIdx === idx && (
                <div style={{fontSize:13,color:"#4A6080",lineHeight:1.7,paddingBottom:16}}>{item.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function IdVerify({ go }) {`
);

// 4. Add FAQ modal render inside Landing return
code = code.replace(
  `    <div className="screen fade-in">
      <div className="screen-scroll">
        <div className="landing-hero">`,
  `    <div className="screen fade-in">
      {faqOpen && <FaqModal onClose={() => setFaqOpen(false)} />}
      <div className="screen-scroll">
        <div className="landing-hero">`
);

fs.writeFileSync('src/App.jsx', code);
console.log('SUCCESS - FAQ modal added');
console.log('faqOpen refs:', (code.match(/faqOpen/g)||[]).length);
console.log('FaqModal refs:', (code.match(/FaqModal/g)||[]).length);
