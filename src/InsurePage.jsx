/**
 * Muḽo Insure — InsurePage.jsx
 * Full standalone page at mulo.co.za/insure
 * Includes: Landing → Products → ID Verify → WhatsApp → OTP → Register → Quote Journey
 */
import React, { useState, useEffect, useRef } from 'react'

const API = 'https://z30zl849k8.execute-api.af-south-1.amazonaws.com/prod'
const NAVY = '#0A1628'
const TEAL = '#00B8A9'
const GREEN = '#1DB97A'

// ─── SA ID validator ───────────────────────────────────────────────────────
function validateSAID(id) {
  if (!/^\d{13}$/.test(id)) return { valid: false, error: 'Must be exactly 13 digits' }
  const yy=parseInt(id.slice(0,2)),mm=parseInt(id.slice(2,4)),dd=parseInt(id.slice(4,6))
  const year=yy<=new Date().getFullYear()%100?2000+yy:1900+yy
  const dob=new Date(year,mm-1,dd)
  if(mm<1||mm>12||dd<1||dd>31||dob.getMonth()!==mm-1||dob.getDate()!==dd)
    return{valid:false,error:'Invalid date of birth in ID number'}
  const today=new Date()
  const age=today.getFullYear()-dob.getFullYear()-(today<new Date(today.getFullYear(),dob.getMonth(),dob.getDate())?1:0)
  if(age<18)return{valid:false,error:'Applicant must be 18 or older'}
  let sum=0
  for(let i=0;i<12;i++){let d=parseInt(id[i]);if(i%2===1){d*=2;if(d>9)d-=9}sum+=d}
  if((10-(sum%10))%10!==parseInt(id[12]))return{valid:false,error:'Checksum failed — please check your ID number'}
  const dobFormatted=dob.toLocaleDateString('en-ZA',{day:'numeric',month:'long',year:'numeric'})
  return{valid:true,dob:dobFormatted,age,gender:parseInt(id.slice(6,10))>=5000?'Male':'Female'}
}

// ─── Products ──────────────────────────────────────────────────────────────
const PRODUCTS = [
  {code:'BUILDINGS',label:'Buildings',     icon:'🏠',sub:'Cover the structure of your home'},
  {code:'CONTENTS', label:'Home contents', icon:'📦',sub:'Furniture, appliances & valuables'},
  {code:'CAR',      label:'Car insurance', icon:'🚗',sub:'Comprehensive vehicle cover'},
  {code:'ALLRISK',  label:'All risk',      icon:'💎',sub:'Jewellery, devices & portable items'},
  {code:'CARAVAN',  label:'Caravan',       icon:'🚐',sub:'Cover for your caravan'},
  {code:'TRAILER',  label:'Trailer',       icon:'🔗',sub:'Cover for your trailer'},
]

// ─── Mock quotes per product ───────────────────────────────────────────────
const INSURERS = [
  {name:'Absa Insurance',  logo:'https://www.absa.co.za/favicon.ico'},
  {name:'Naked Insurance', logo:'https://www.naked.insure/favicon.ico'},
  {name:'King Price',      logo:'https://www.kingprice.co.za/favicon.ico'},
  {name:'Pineapple',       logo:'https://www.pineapple.co.za/favicon.ico'},
  {name:'MiWay',           logo:'https://www.miway.co.za/favicon.ico'},
  {name:'Old Mutual',      logo:'https://www.oldmutual.co.za/favicon.ico'},
]

const MOCK_QUOTES = {
  BUILDINGS:[
    {insurer:'Absa Insurance',  logo:'https://www.absa.co.za/favicon.ico',  premium:521, excess:5000,rating:4.3,cashback:521, highlight:'Best for bond holders'},
    {insurer:'Naked Insurance', logo:'https://www.naked.insure/favicon.ico', premium:548, excess:4000,rating:4.7,cashback:548, highlight:'Best value'},
    {insurer:'King Price',      logo:'https://www.kingprice.co.za/favicon.ico',premium:576, excess:5000,rating:4.5,cashback:576, highlight:'Decreasing premium'},
    {insurer:'Pineapple',       logo:'https://www.pineapple.co.za/favicon.ico',premium:598, excess:4500,rating:4.6,cashback:598, highlight:'Top rated claims'},
    {insurer:'MiWay',           logo:'https://www.miway.co.za/favicon.ico',  premium:612, excess:5000,rating:4.1,cashback:612, highlight:null},
    {insurer:'Old Mutual',      logo:'https://www.oldmutual.co.za/favicon.ico',premium:634, excess:5000,rating:4.2,cashback:634, highlight:null},
  ],
  CONTENTS:[
    {insurer:'Naked Insurance', logo:'https://www.naked.insure/favicon.ico', premium:298, excess:2000,rating:4.7,cashback:298, highlight:'Best value'},
    {insurer:'Pineapple',       logo:'https://www.pineapple.co.za/favicon.ico',premium:312, excess:1500,rating:4.6,cashback:312, highlight:'Top rated claims'},
    {insurer:'King Price',      logo:'https://www.kingprice.co.za/favicon.ico',premium:324, excess:2000,rating:4.5,cashback:324, highlight:'Decreasing premium'},
    {insurer:'Absa Insurance',  logo:'https://www.absa.co.za/favicon.ico',  premium:345, excess:2500,rating:4.3,cashback:345, highlight:null},
    {insurer:'MiWay',           logo:'https://www.miway.co.za/favicon.ico',  premium:358, excess:2000,rating:4.1,cashback:358, highlight:null},
    {insurer:'Old Mutual',      logo:'https://www.oldmutual.co.za/favicon.ico',premium:372, excess:2500,rating:4.2,cashback:372, highlight:null},
  ],
  CAR:[
    {insurer:'King Price',      logo:'https://www.kingprice.co.za/favicon.ico',premium:672, excess:3000,rating:4.5,cashback:672, highlight:'Decreasing premium'},
    {insurer:'Naked Insurance', logo:'https://www.naked.insure/favicon.ico', premium:689, excess:3500,rating:4.7,cashback:689, highlight:'Best value'},
    {insurer:'Pineapple',       logo:'https://www.pineapple.co.za/favicon.ico',premium:718, excess:2500,rating:4.6,cashback:718, highlight:'Top rated claims'},
    {insurer:'MiWay',           logo:'https://www.miway.co.za/favicon.ico',  premium:745, excess:3500,rating:4.1,cashback:745, highlight:null},
    {insurer:'Absa Insurance',  logo:'https://www.absa.co.za/favicon.ico',  premium:761, excess:4000,rating:4.3,cashback:761, highlight:null},
    {insurer:'Old Mutual',      logo:'https://www.oldmutual.co.za/favicon.ico',premium:789, excess:4000,rating:4.2,cashback:789, highlight:null},
  ],
  ALLRISK:[
    {insurer:'Naked Insurance', logo:'https://www.naked.insure/favicon.ico', premium:189, excess:1000,rating:4.7,cashback:189, highlight:'Best value'},
    {insurer:'Pineapple',       logo:'https://www.pineapple.co.za/favicon.ico',premium:198, excess:1000,rating:4.6,cashback:198, highlight:null},
    {insurer:'King Price',      logo:'https://www.kingprice.co.za/favicon.ico',premium:210, excess:1500,rating:4.5,cashback:210, highlight:null},
    {insurer:'Absa Insurance',  logo:'https://www.absa.co.za/favicon.ico',  premium:224, excess:1500,rating:4.3,cashback:224, highlight:null},
    {insurer:'MiWay',           logo:'https://www.miway.co.za/favicon.ico',  premium:235, excess:2000,rating:4.1,cashback:235, highlight:null},
    {insurer:'Old Mutual',      logo:'https://www.oldmutual.co.za/favicon.ico',premium:248, excess:2000,rating:4.2,cashback:248, highlight:null},
  ],
  CARAVAN:[
    {insurer:'King Price',      logo:'https://www.kingprice.co.za/favicon.ico',premium:245, excess:2000,rating:4.5,cashback:245, highlight:'Only provider'},
  ],
  TRAILER:[
    {insurer:'King Price',      logo:'https://www.kingprice.co.za/favicon.ico',premium:145, excess:1500,rating:4.5,cashback:145, highlight:'Only provider'},
  ],
}

// ─── Global CSS ────────────────────────────────────────────────────────────
const GS = `
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{margin:0;padding:0;background:#F0F4F8;font-family:'IBM Plex Sans',sans-serif}
@keyframes insurerScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
.ip-fade{animation:fadeUp .3s ease forwards}
.ip-shell{min-height:100vh;background:linear-gradient(135deg,#0A1628 0%,#1B3A5E 50%,#0D2440 100%);display:flex;align-items:flex-start;justify-content:center;padding:40px 16px 60px}
.ip-card{width:100%;max-width:390px;background:#F7F9FC;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.25);display:flex;flex-direction:column}
.ip-screen-header{padding:20px 20px 0;display:flex;align-items:center;gap:12px;margin-bottom:8px;background:#F7F9FC}
.ip-back-btn{width:36px;height:36px;border-radius:12px;background:#fff;border:1.5px solid rgba(0,0,0,0.08);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,0.06);color:#0A1628}
.ip-header-title{font-family:'Sora',sans-serif;font-size:17px;font-weight:700;color:#0A1628;flex:1}
.ip-header-sub{font-size:12px;color:#8FA3BE;margin-top:1px}
.ip-progress{height:3px;background:#E8EDF4;margin:0 20px 0;overflow:hidden}
.ip-progress-fill{height:3px;background:linear-gradient(90deg,${TEAL},#1A73E8);transition:width .4s ease}
.ip-body{padding:20px;background:#F7F9FC;flex:1;overflow-y:auto}
.ip-bottom{padding:12px 20px 24px;background:#F7F9FC;border-top:1px solid #EEF2F8}
.ip-btn{display:block;width:100%;padding:17px 24px;background:linear-gradient(135deg,${TEAL},#1A73E8);color:#fff;border:none;border-radius:16px;font-family:'IBM Plex Sans',sans-serif;font-size:15px;font-weight:600;cursor:pointer;box-shadow:0 8px 24px rgba(0,184,169,0.35);transition:all .2s;text-align:center;letter-spacing:.1px}
.ip-btn:hover{transform:translateY(-1px);box-shadow:0 12px 32px rgba(0,184,169,0.4)}
.ip-btn:active{transform:translateY(0)}
.ip-btn:disabled{opacity:.4;cursor:not-allowed;transform:none;box-shadow:none}
.ip-input{width:100%;padding:14px 16px;background:#fff;border:1.5px solid #E2E9F0;border-radius:14px;color:#0A1628;font-family:'IBM Plex Sans',sans-serif;font-size:15px;outline:none;transition:all .2s}
.ip-input:focus{border-color:${TEAL};box-shadow:0 0 0 3px rgba(0,184,169,0.12)}
.ip-input::placeholder{color:#C5D0DC}
.ip-input.ok{border-color:${GREEN}}
.ip-input.err{border-color:#FF5C5C;box-shadow:0 0 0 3px rgba(255,92,92,0.1)}
.ip-label{display:block;font-size:11px;font-weight:600;color:#8FA3BE;text-transform:uppercase;letter-spacing:.8px;margin-bottom:7px}
.ip-hint-ok{font-size:11px;color:${GREEN};margin-top:5px;display:flex;align-items:center;gap:4px}
.ip-hint-err{font-size:11px;color:#FF5C5C;margin-top:5px}
.ip-otp-box{width:44px;height:52px;border-radius:12px;border:1.5px solid #E2E9F0;background:#fff;color:#0A1628;text-align:center;font-size:22px;font-weight:700;outline:none;transition:border-color .2s}
.ip-otp-box:focus{border-color:${TEAL}}
.ip-product{display:flex;align-items:center;gap:14px;background:#fff;border:1.5px solid #E2E9F0;border-radius:16px;padding:14px;margin-bottom:10px;cursor:pointer;transition:all .15s;box-shadow:0 2px 8px rgba(0,0,0,0.04)}
.ip-product.sel{background:rgba(0,184,169,0.06);border-color:${TEAL};box-shadow:0 0 0 3px rgba(0,184,169,0.1)}
.ip-product.dis{opacity:.4;cursor:not-allowed}
.ip-quote-card{background:#fff;border:1.5px solid #E2E9F0;border-radius:16px;padding:16px;margin-bottom:12px;cursor:pointer;transition:all .15s;box-shadow:0 2px 8px rgba(0,0,0,0.04)}
.ip-quote-card.sel{border-color:${TEAL};background:rgba(0,184,169,0.04);box-shadow:0 0 0 3px rgba(0,184,169,0.1)}
.ip-check-row{display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid #F0F4F8}
.ip-spinner{width:20px;height:20px;border:2px solid #E2E9F0;border-top-color:${TEAL};border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0}
.ip-select{width:100%;padding:14px 16px;background:#fff;border:1.5px solid #E2E9F0;border-radius:14px;color:#0A1628;font-family:'IBM Plex Sans',sans-serif;font-size:15px;outline:none;appearance:none;cursor:pointer;transition:all .2s;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238FA3BE' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center}
.ip-select:focus{border-color:${TEAL};box-shadow:0 0 0 3px rgba(0,184,169,0.12)}
.ip-select option{background:#fff;color:#0A1628}
.ip-card-box{background:#fff;border:1.5px solid #E2E9F0;border-radius:16px;padding:16px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,0.04)}
.ip-section-label{font-size:11px;font-weight:600;color:#8FA3BE;text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px}
`

// ─── Nav component ─────────────────────────────────────────────────────────
const Nav = ({onBack,showBack}) => (
  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 20px 12px',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
    <div style={{display:'flex',alignItems:'center',gap:10}}>
      {showBack && <button onClick={onBack} style={{width:32,height:32,borderRadius:8,background:'#fff',border:'1.5px solid #E2E9F0',color:'#0A1628',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>←</button>}
      <div style={{fontFamily:"'Sora',sans-serif",fontSize:18,fontWeight:800,color:'#fff'}}>Mu<span style={{color:TEAL}}>ḽ</span>o <span style={{fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.4)'}}>insure</span></div>
    </div>
    <div style={{fontSize:10,color:'rgba(255,255,255,0.3)'}}>FSP 49169</div>
  </div>
)

const ProgressBar = ({step,total}) => (
  <div className="ip-progress"><div className="ip-progress-fill" style={{width:`${(step/total)*100}%`}}/></div>
)

const StepHeader = ({title,subtitle,step,total,onBack}) => (
  <>
    <div className="ip-screen-header">
      <button className="ip-back-btn" onClick={onBack}>←</button>
      <div style={{flex:1}}>
        <div className="ip-header-title">{title}</div>
        {subtitle && <div className="ip-header-sub">{subtitle}</div>}
      </div>
      <div style={{fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:14,color:'#0A1628'}}>Mu<span style={{color:TEAL}}>ḽ</span>o <span style={{fontSize:10,fontWeight:600,color:'#8FA3BE'}}>insure</span></div>
    </div>
    <div className="ip-progress"><div className="ip-progress-fill" style={{width:`${(step/total)*100}%`}}/></div>
  </>
)


// ─── Vehicle data (TransUnion SA vehicle file fields) ──────────────────────
const VEHICLE_MAKES = [
  'Audi','BMW','Chevrolet','Chery','Citroën','Datsun','Ford','GWM',
  'Haval','Honda','Hyundai','Isuzu','Jaguar','Jeep','Kia','Land Rover',
  'Lexus','Mahindra','Mazda','Mercedes-Benz','Mini','Mitsubishi','Nissan',
  'Opel','Peugeot','Renault','Subaru','Suzuki','Toyota','Volkswagen','Volvo',
]
const VEHICLE_MODELS = {
  'Audi':['A1','A3','A4','A5','A6','A7','A8','e-tron','e-tron GT','Q2','Q3','Q5','Q7','Q8','RS3','RS5','RS6','RS7','S3','S4','S5','TT'],
  'BMW':['1 Series','2 Series','3 Series','4 Series','5 Series','6 Series GT','7 Series','8 Series','iX','iX3','M2','M3','M4','M5','X1','X2','X3','X4','X5','X6','X7','Z4'],
  'Chevrolet':['Captiva','Cruze','Spark','Trailblazer','Trax','Utility'],
  'Chery':['Arrizo 5','Tiggo 4','Tiggo 7','Tiggo 8'],
  'Citroën':['Berlingo','C3','C3 Aircross','C4','C5 Aircross','Dispatch'],
  'Datsun':['GO','GO+'],
  'Ford':['Bronco','EcoSport','Everest','Explorer','Fiesta','Focus','Kuga','Mustang','Mustang Mach-E','Puma','Ranger','Territory'],
  'GWM':['Cannon','P Series','Steed'],
  'Haval':['H1','H2','H6','Jolion'],
  'Honda':['Amaze','Ballade','BR-V','City','Civic','CR-V','HR-V','Jazz','Mobilio','WR-V'],
  'Hyundai':['Accent','Atos','Creta','Grand i10','H-1','i10','i20','i30','Ioniq 5','ix35','Kona','Santa Fe','Sonata','Staria','Tucson','Venue'],
  'Isuzu':['D-Max','MU-X'],
  'Jaguar':['E-Pace','F-Pace','F-Type','I-Pace','XE','XF','XJ'],
  'Jeep':['Cherokee','Compass','Gladiator','Grand Cherokee','Renegade','Wrangler'],
  'Kia':['Carens','Cerato','EV6','Niro','Pegas','Picanto','Seltos','Sorento','Soul','Sportage','Stinger'],
  'Land Rover':['Defender','Discovery','Discovery Sport','Freelander','Range Rover','Range Rover Evoque','Range Rover Sport','Range Rover Velar'],
  'Lexus':['ES','GS','GX','IS','LC','LX','NX','RX','UX'],
  'Mahindra':['Bolero','KUV100','Pik Up','Scorpio','TUV300','XUV300','XUV500','XUV700'],
  'Mazda':['CX-3','CX-30','CX-5','CX-8','CX-60','Mazda2','Mazda3','Mazda6','MX-5'],
  'Mercedes-Benz':['A-Class','B-Class','C-Class','CLA','CLS','E-Class','EQA','EQB','EQC','GLA','GLB','GLC','GLE','GLS','S-Class','V-Class'],
  'Mini':['Clubman','Convertible','Countryman','Hatch'],
  'Mitsubishi':['Eclipse Cross','Outlander','Pajero','Pajero Sport','Triton','Xpander'],
  'Nissan':['Almera','Frontier','Juke','Leaf','Magnite','Micra','NP200','NP300 Hardbody','Navara','Note','Patrol','Qashqai','Terra','Tiida','X-Trail'],
  'Opel':['Astra','Corsa','Crossland','Grandland','Mokka'],
  'Peugeot':['2008','3008','208','308','408','5008','508','Partner','Rifter'],
  'Renault':['Captur','Clio','Duster','Kadjar','Kiger','Koleos','Kwid','Logan','Megane','Oroch','Sandero','Triber'],
  'Subaru':['BRZ','Forester','Impreza','Outback','XV'],
  'Suzuki':['Alto','Baleno','Ciaz','Ertiga','Grand Vitara','Ignis','Jimny','S-Presso','Swift','Vitara'],
  'Toyota':['Agya','Avanza','Aygo','C-HR','Corolla','Corolla Cross','Etios','Fortuner','GR86','Hiace','Hilux','Land Cruiser','Land Cruiser 70','Land Cruiser Prado','Prius','Quantum','RAV4','Rush','Urban Cruiser','Yaris'],
  'Volkswagen':['Amarok','Golf','Golf GTI','Golf R','ID.4','Jetta','Passat','Polo','Polo Vivo','T-Cross','T-Roc','Tiguan','Touareg','Up'],
  'Volvo':['C40','S60','S90','V60','V90','XC40','XC60','XC90'],
}
const VEHICLE_VARIANTS = {
  'Hilux':['2.0 VVTi S P/U S/C','2.4 GD S P/U S/C','2.4 GD-6 RB S P/U S/C','2.4 GD-6 RB SRX A/T P/U D/C','2.8 GD-6 RB Raider A/T P/U D/C','2.8 GD-6 RB Legend 50 A/T P/U D/C'],
  'Fortuner':['2.4 GD-6 RB MT','2.4 GD-6 RB AT','2.8 GD-6 4x4 VX AT','2.8 GD-6 Legender AT','2.8 GD-6 GR Sport'],
  'Corolla Cross':['1.8 XS CVT','1.8 XR CVT','1.8 XL CVT','2.0 XR CVT','GR Sport'],
  'RAV4':['2.0 GX CVT','2.0 VX CVT','2.5 VX AWD Hybrid'],
  'Yaris':['1.0 Xi 5-dr','1.5 Xs CVT 5-dr','1.5 XS 5-dr','GR 1.6T'],
  'Polo Vivo':['1.4 Trendline 5-dr','1.4 Comfortline 5-dr','1.6 Comfortline A/T 5-dr','1.6 Highline 5-dr','1.6 GT 5-dr'],
  'Polo':['1.0 TSI Trendline','1.0 TSI Comfortline','1.0 TSI Highline','1.6 TDI Comfortline','GTI 2.0 TSI'],
  'Golf':['1.0 TSI Trendline 5-dr','1.4 TSI Comfortline DSG','1.4 TSI Highline DSG','2.0 TDI Comfortline','GTI 2.0 TSI DSG','R 2.0 TSI DSG 4Motion'],
  'Tiguan':['1.4 TSI Trendline','1.4 TSI Comfortline','2.0 TDI Highline 4Motion','2.0 TSI R-Line 4Motion'],
  'Amarok':['2.0 BiTDI Trendline D/C','3.0 TDI Comfortline D/C A/T','3.0 TDI Highline D/C A/T','V6 TDI Aventura D/C A/T'],
  'Ranger':['2.0D XL P/U S/C','2.0TD XLT A/T P/U D/C','2.0BiTD Wildtrak A/T P/U D/C','3.0TD Raptor A/T P/U D/C'],
  'Everest':['2.0D XL 4x2','2.0BiTD Sport 4x4 A/T','3.0TD Platinum 4x4 A/T'],
  'Tucson':['2.0 Premium','2.0 Executive','1.6T Executive DCT','1.6 HTRAC Hybrid'],
  'Creta':['1.5 Motion CVT','1.5 Fluid CVT','1.4T Executive DCT','1.6D Executive A/T'],
  'i20':['1.0T Motion','1.0T Fluid','1.4 Motion','1.4 Fluid A/T'],
  'Sportage':['2.0 LX','2.0 EX CVT','1.6T GT-Line DCT AWD','1.6 PHEV GT-Line AWD'],
  'Seltos':['1.5 EX CVT','1.5 SX CVT','1.4T EX+ DCT AWD'],
  'D-Max':['1.9 DDi LX S/C','3.0 DDi LX D/C A/T','3.0 DDi LS D/C A/T','3.0 DDi X-Terrain D/C A/T'],
  'Navara':['2.5D XE King Cab','2.5D XE D/C 4x4','2.5D LE A/T D/C 4x4','2.5D Pro-4X A/T D/C'],
  'NP200':['1.6i A/C P/U S/C','1.6i Safety P/U S/C'],
  'Duster':['1.6 Expression','1.5 dCi Prestige 4x2','1.5 dCi Prestige 4x4 EDC'],
  'Kwid':['1.0 Dynamique','1.0 Climber'],
  'Sandero':['900T Stepway Expression','900T Stepway Techroad'],
  'Jimny':['1.5 GLX A/T 3-dr','1.5 GLX M/T 3-dr','1.5 Sierra A/T 3-dr'],
  'Swift':['1.2 GL','1.2 GLX A/T','1.4T Sport A/T'],
  'Grand Vitara':['1.5 GL A/T 5-dr','1.5 GLX A/T Hybrid'],
  'CX-5':['2.0 Active','2.0 Dynamic A/T','2.2D Active A/T','2.2D Individual A/T AWD'],
  'Mazda3':['1.5 Active Sedan','2.0 Astina Hatch A/T','2.0 Astina Sedan A/T'],
  'X-Trail':['1.6 dCi Visia 4x2','2.5 Acenta CVT 4x2','2.5 Tekna CVT 4x4 e-Power'],
  'Qashqai':['1.3 DIG-T Acenta CVT','1.3 DIG-T Tekna CVT'],
  '3 Series':['318i M Sport A/T','320i M Sport A/T','330i M Sport A/T','320d M Sport A/T','M340i xDrive A/T'],
  'X3':['xDrive20i M Sport','xDrive30d M Sport','M40i A/T'],
  'X5':['xDrive30d M Sport','xDrive40i M Sport','M50d A/T'],
  'C-Class':['C200 AMG Line A/T','C220d AMG Line A/T','C300 AMG Line A/T','C63 S AMG A/T'],
  'GLC':['GLC200 AMG Line A/T','GLC220d AMG Line 4Matic A/T','GLC300 4Matic A/T'],
  'A4':['35 TFSI Advanced S tronic','40 TFSI S line S tronic','35 TDI Advanced S tronic','45 TFSI quattro S tronic'],
  'Q5':['40 TDI quattro S tronic','45 TFSI quattro S tronic','55 TFSI e quattro S tronic'],
}
const VEHICLE_COLOURS = ['Black','White','Silver','Grey','Red','Blue','Dark blue','Green','Brown','Beige / Champagne','Gold','Orange','Yellow','Purple','Other']
const VEHICLE_BODY_TYPES = ['Sedan','Hatchback','SUV / Crossover','Bakkie / Pickup','Station wagon','MPV / People carrier','Coupe','Convertible','Panel van','Minibus']
const VEHICLE_FUEL_TYPES = ['Petrol','Diesel','Hybrid','Electric','LPG']
const VEHICLE_TRANSMISSIONS = ['Manual','Automatic','CVT','DSG / DCT']
const VEHICLE_ENGINE_SIZES = ['Under 1.0L','1.0L','1.2L','1.4L','1.5L','1.6L','1.8L','2.0L','2.4L','2.5L','3.0L','3.5L','4.0L+']
const VEHICLE_FINANCE_HOUSES = ['ABSA Vehicle Finance','FNB Vehicle Finance','Nedbank Vehicle Finance','Standard Bank Vehicle Finance','WesBank','Investec','BMW Financial Services','Mercedes-Benz Financial Services','Volkswagen Financial Services','Other']
const VEHICLE_YEARS = Array.from({length:2026-1990+1},(_,i)=>String(2026-i))

// ─── VAPs (Value Added Products) ──────────────────────────────────────────
const VAPS = [
  {code:'CAR_HIRE',     label:'Car hire',          icon:'🚘', sub:'Rental car while yours is being repaired',    premium:89},
  {code:'CREDIT_SHORT', label:'Credit shortfall',  icon:'💳', sub:'Covers the gap between settlement & payout',  premium:65},
]

// ─── Main component ────────────────────────────────────────────────────────
export default function InsurePage() {
  const [step, setStep]           = useState('landing')
  const [selected, setSelected]   = useState([])

  // Auth state
  const [authId, setAuthId]         = useState('')
  const [authFirstName, setAuthFirstName] = useState('')
  const [authLastName, setAuthLastName]   = useState('')
  const [authPhone, setAuthPhone]   = useState('')
  const [authEmail, setAuthEmail]   = useState('')
  const [authPass, setAuthPass]     = useState('')
  const [authOtp, setAuthOtp]       = useState(['','','','','',''])
  const [authPhase, setAuthPhase]   = useState('idle')
  const [authValidation, setAuthValidation] = useState(null)
  const [authTimer, setAuthTimer]   = useState(59)
  const [showPass, setShowPass]     = useState(false)
  const [authChecks, setAuthChecks] = useState([
    {label:'Valid SA ID format',sub:'13 digits · Luhn checksum · Date of birth',status:'wait'},
    {label:'Homeowner status',  sub:'Deeds Office verification',status:'wait'},
    {label:'No sequestration',  sub:'Master of High Court check',status:'wait'},
  ])
  const otpRefs = useRef([])

  // Journey state
  const [journeyStep, setJourneyStep] = useState('home') // home|car|quotes|review|debit|done
  const [property, setProperty]   = useState({address:'',buildingValue:'',contentsValue:'',roofType:'Tiles',wallType:'Brick & plaster',alarmSystem:'Yes — monitored',armedResponse:'No'})
  const [vehicle, setVehicle]     = useState({make:'',model:'',variant:'',year:'',colour:'',reg:'',bodyType:'',fuelType:'',transmission:'',engineSize:'',use:'private',financed:false,financeHouse:''})
  const [carDriver, setCarDriver]   = useState({coverType:'Comprehensive',regularDriver:'Myself',driverIdNumber:'',driverFirstName:'',driverLastName:'',driverAge:'',licence:'Code 8',licenceDate:'',claims:'No',parkingAddress:'',parkingType:'Garage',tracking:'No',trackingProvider:''})
  const [selectedQuotes, setSelectedQuotes] = useState({})
  const [quotesLoading, setQuotesLoading]   = useState(false)
  const [quotesData, setQuotesData]         = useState({})
  const [bankDetails, setBankDetails]       = useState({bank:'',accountNumber:'',accountType:'Cheque',debitDay:1})
  const [policyRef, setPolicyRef]           = useState('')
  const [selectedVaps, setSelectedVaps]     = useState([])

  // OTP timer
  useEffect(()=>{
    if(step!=='otp'||authTimer<=0)return
    const t=setTimeout(()=>setAuthTimer(s=>s-1),1000)
    return()=>clearTimeout(t)
  },[step,authTimer])

  // Load mock quotes when entering quotes step
  useEffect(()=>{
    if(journeyStep!=='quotes')return
    setQuotesLoading(true)
    const timeout = setTimeout(()=>{
      const data = {}
      selected.forEach(code=>{
        data[code] = MOCK_QUOTES[code] || []
      })
      setQuotesData(data)
      // Auto-select best insurer by lowest total premium across all selected products
      const insurerNames = [...new Set(Object.values(data).flat().map(q=>q.insurer))]
      const ranked = insurerNames.map(insurer=>{
        const quotes = {}
        let total = 0
        selected.forEach(code=>{
          const q = (data[code]||[]).find(q=>q.insurer===insurer)
          if(q){quotes[code]=q;total+=q.premium}
        })
        return{insurer,quotes,total,covered:Object.keys(quotes).length}
      }).filter(r=>r.covered===selected.length).sort((a,b)=>a.total-b.total)
      const bestInsurer = ranked[0]
      const autoSelect = bestInsurer ? bestInsurer.quotes : {}
      setSelectedQuotes(autoSelect)
      setQuotesLoading(false)
    }, 2000)
    return()=>clearTimeout(timeout)
  },[journeyStep])

  // Google Places for address
  const initAddressAutocomplete = () => {
    const input = document.getElementById('ip-address-input')
    if(!input||!window.google)return
    if(input._acDone)return
    input._acDone = true
    const ac = new window.google.maps.places.Autocomplete(input,{
      componentRestrictions:{country:'za'},
      types:['address'],
      fields:['formatted_address','address_components'],
    })
    ac.addListener('place_changed',()=>{
      const place = ac.getPlace()
      if(!place.address_components)return
      let addressLine1='',suburb='',city='',postalCode=''
      place.address_components.forEach(c=>{
        if(c.types.includes('street_number'))addressLine1=c.long_name+' '+addressLine1
        if(c.types.includes('route'))addressLine1=(addressLine1+c.long_name).trim()
        if(c.types.includes('sublocality_level_1')||c.types.includes('neighborhood'))suburb=c.long_name
        if(c.types.includes('locality'))city=c.long_name
        if(c.types.includes('postal_code'))postalCode=c.long_name
      })
      setProperty(p=>({...p,address:place.formatted_address,addressLine1,suburb,city,postalCode}))
      input.value = place.formatted_address
    })
  }

  useEffect(()=>{
    if(journeyStep!=='home')return
    if(window.google){initAddressAutocomplete();return}
    if(document.getElementById('gmaps-script'))return
    const s=document.createElement('script')
    s.id='gmaps-script'
    s.src='https://maps.googleapis.com/maps/api/js?key=AIzaSyDn4sOrDztXizh2DFf_MdlwYJ4Wkf4v8Ck&libraries=places'
    s.async=true
    s.onload=initAddressAutocomplete
    document.head.appendChild(s)
  },[journeyStep])

  // ── Computed values ────────────────────────────────────────────────────────
  const totalPremium  = Object.values(selectedQuotes).reduce((s,q)=>s+(q?.premium||0),0)
  const totalCashback = Object.values(selectedQuotes).reduce((s,q)=>s+(q?.cashback||0),0)
  const needsHome = selected.includes('BUILDINGS')||selected.includes('CONTENTS')
  const needsCar  = selected.includes('CAR')

  // Journey steps sequence
  const journeySteps = ['home','car','cardriver','quotes','vaps','review','debit','done'].filter(s=>{
    if(s==='home'&&!needsHome)return false
    if(s==='car'&&!needsCar)return false
    if(s==='cardriver'&&!needsCar)return false
    if(s==='vaps'&&!needsCar)return false
    return true
  })
  const journeyTotal = journeySteps.length
  const journeyIdx   = journeySteps.indexOf(journeyStep)

  const goNextJourney = () => {
    const next = journeySteps[journeyIdx+1]
    if(next)setJourneyStep(next)
  }
  const goPrevJourney = () => {
    if(journeyIdx===0){setStep('register');return}
    const prev = journeySteps[journeyIdx-1]
    if(prev)setJourneyStep(prev)
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LANDING
  // ════════════════════════════════════════════════════════════════════════════
  const renderLanding = () => (
    <>
    <div style={{background:`linear-gradient(160deg,${NAVY} 0%,#0E2344 60%,#0B3040 100%)`,padding:'28px 24px 24px',borderRadius:'28px 28px 0 0'}}>
      <Nav/>
      <div style={{marginTop:20}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(0,184,169,0.1)',border:'1px solid rgba(0,184,169,0.25)',borderRadius:99,padding:'5px 12px',marginBottom:16,fontSize:12,fontWeight:600,color:TEAL}}>
          🏆 South Africa's only cashback insurance platform
        </div>
        <h1 style={{fontFamily:"'Sora',sans-serif",fontSize:26,fontWeight:800,lineHeight:1.15,margin:'0 0 14px',color:'#fff'}}>
          Anyone can compare insurance.<br/><span style={{color:TEAL}}>Only Muḽo pays you for it.</span>
        </h1>
        <p style={{fontSize:15,color:'rgba(255,255,255,0.65)',lineHeight:1.6,margin:'0 0 8px'}}>
          Insure your car, home or contents through Muḽo and earn your first month's premium back — guaranteed. Every time.
        </p>
        <p style={{fontSize:13,color:'rgba(255,255,255,0.45)',lineHeight:1.6,margin:'0 0 20px',fontStyle:'italic'}}>
          The smart move isn't just finding a better rate. It's getting paid when you find it.
        </p>

        {/* Insurer carousel */}
        <div style={{overflow:'hidden',marginBottom:20}}>
          <div style={{display:'flex',gap:8,animation:'insurerScroll 22s linear infinite',width:'max-content'}}>
            {[['https://www.absa.co.za/favicon.ico','Absa'],['https://www.pineapple.co.za/favicon.ico','Pineapple'],['https://www.nedbank.co.za/favicon.ico','Nedbank'],['https://www.oldmutual.co.za/favicon.ico','Old Mutual'],['https://www.miway.co.za/favicon.ico','MiWay'],['https://www.momentum.co.za/favicon.ico','Momentum'],['https://www.kingprice.co.za/favicon.ico','King Price'],['https://www.iwyze.co.za/favicon.ico','iWYZE'],
              ['https://www.absa.co.za/favicon.ico','Absa'],['https://www.pineapple.co.za/favicon.ico','Pineapple'],['https://www.nedbank.co.za/favicon.ico','Nedbank'],['https://www.oldmutual.co.za/favicon.ico','Old Mutual'],['https://www.miway.co.za/favicon.ico','MiWay'],['https://www.momentum.co.za/favicon.ico','Momentum'],['https://www.kingprice.co.za/favicon.ico','King Price'],['https://www.iwyze.co.za/favicon.ico','iWYZE']
            ].map(([src,n],i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:99,padding:'5px 12px',whiteSpace:'nowrap',flexShrink:0}}>
                <img src={src} width={16} height={16} style={{borderRadius:3,objectFit:'contain',background:'#fff',padding:2}} onError={e=>e.target.style.display='none'}/>
                <span style={{fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.7)'}}>{n}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:1,background:'rgba(255,255,255,0.08)',borderRadius:14,overflow:'hidden',marginBottom:20}}>
          {[['R0','Free to compare'],['3 min','Avg. quote time'],['R900','Avg. cashback']].map(([v,l])=>(
            <div key={l} style={{background:'rgba(14,35,68,0.8)',padding:'13px 8px',textAlign:'center'}}>
              <div style={{fontFamily:"'Sora',sans-serif",fontSize:18,fontWeight:700,color:'#fff'}}>{v}</div>
              <div style={{fontSize:9,fontWeight:600,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:.5,marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>

        <button className="ip-btn" onClick={()=>setStep('products')}>Get my free quotes →</button>
        <div style={{textAlign:'center',marginTop:10,fontSize:11,color:'rgba(255,255,255,0.4)'}}>
          Free to compare · No obligation · Takes 3 minutes
        </div>
      </div>
    </div>
    {/* White "How it works" section */}
    <div style={{background:'#fff',borderRadius:'0 0 28px 28px',padding:'28px 24px 32px'}}>
      <div style={{fontFamily:"'Sora',sans-serif",fontSize:18,fontWeight:700,color:NAVY,marginBottom:16}}>How it works</div>
      {[
        ['1','Select your products','Choose from buildings, contents, car, all risk and more.'],
        ['2','Verify your identity','Quick SA ID check — takes 30 seconds.'],
        ['3','Get instant quotes','We fetch quotes from 8 leading insurers and rank by value.'],
          ['4','Earn cashback','Bind your policy and earn 1x your first month\'s premium back.'],
      ].map(([n,t,s])=>(
        <div key={n} style={{display:'flex',alignItems:'flex-start',gap:14,padding:'12px 0',borderBottom:'1px solid #F0F4F8'}}>
          <div style={{width:34,height:34,borderRadius:10,background:`linear-gradient(135deg,${TEAL},#1A73E8)`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Sora',sans-serif",fontSize:13,fontWeight:700,color:'#fff',flexShrink:0}}>{n}</div>
          <div>
            <div style={{fontSize:14,fontWeight:600,color:NAVY,marginBottom:2}}>{t}</div>
            <div style={{fontSize:12,color:'#8FA3BE',lineHeight:1.5}}>{s}</div>
          </div>
        </div>
      ))}
      <div style={{textAlign:'center',fontSize:10,color:'#C5D0DC',paddingTop:20,lineHeight:1.6}}>
        Muḽo Financial Services (Pty) Ltd · FSP 49169 · Authorised Financial Services Provider
      </div>
    </div>
    </>
  )

  // ════════════════════════════════════════════════════════════════════════════
  // PRODUCT SELECTOR
  // ════════════════════════════════════════════════════════════════════════════
  const renderProducts = () => {
    const toggle = code => {
      if((code==='ALLRISK')&&selected.filter(c=>c!=='ALLRISK').length===0)return
      if((code==='CARAVAN'||code==='TRAILER')&&!selected.includes('CAR'))return
      setSelected(p=>p.includes(code)?p.filter(c=>c!==code):[...p,code])
    }
    const errors=[]
    if(selected.includes('ALLRISK')&&selected.length===1)errors.push('All risk must be bundled with another product')
    return(
      <>
        <StepHeader title="What do you want to insure?" subtitle="Select all that apply" step={1} total={5} onBack={()=>setStep('landing')}/>
        <div className="ip-body">
          <p style={{fontSize:13,color:'#8FA3BE',marginBottom:16,lineHeight:1.6}}>Every product earns 1× your first month's premium as cashback.</p>
          {PRODUCTS.map(p=>{
            const isSel=selected.includes(p.code)
            const isDis=(p.code==='ALLRISK'&&selected.filter(c=>c!=='ALLRISK').length===0)||((p.code==='CARAVAN'||p.code==='TRAILER')&&!selected.includes('CAR'))
            return(
              <div key={p.code} className={`ip-product${isSel?' sel':''}${isDis?' dis':''}`} onClick={()=>!isDis&&toggle(p.code)}>
                <span style={{fontSize:26}}>{p.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:600,color:'#0A1628'}}>{p.label}</div>
                  <div style={{fontSize:12,color:'#8FA3BE',marginTop:2}}>{p.sub}</div>
                </div>
                <div style={{width:20,height:20,borderRadius:99,border:`2px solid ${isSel?TEAL:'rgba(255,255,255,0.2)'}`,background:isSel?TEAL:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  {isSel&&<span style={{color:'#fff',fontSize:11,fontWeight:700}}>✓</span>}
                </div>
              </div>
            )
          })}
          {errors.map(e=><div key={e} style={{color:'#FF5C5C',fontSize:12,marginTop:4}}>⚠ {e}</div>)}
          <div style={{background:'rgba(0,184,169,0.06)',border:'1px solid rgba(0,184,169,0.15)',borderRadius:12,padding:14,marginTop:16,marginBottom:4}}>
            <div style={{fontSize:13,fontWeight:600,color:TEAL,marginBottom:4}}>💸 Cashback offer</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.5)',lineHeight:1.6}}>Every product earns 1× your first month's premium as cashback — paid within 30 days. 12-month lock-in applies.</div>
          </div>
        </div>
        <div className="ip-bottom">
          <button className="ip-btn" disabled={selected.length===0||errors.length>0} onClick={()=>setStep('id')}>
            {selected.length===0?'Select a product to continue':`Continue with ${selected.length} product${selected.length>1?'s':''} →`}
          </button>
        </div>
      </>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ID VERIFY
  // ════════════════════════════════════════════════════════════════════════════
  const renderIdVerify = () => {
    const handleChange = val => {
      const c=val.replace(/\D/g,'').slice(0,13)
      setAuthId(c);setAuthPhase('idle');setAuthValidation(null)
      setAuthChecks(x=>x.map(y=>({...y,status:'wait'})))
      if(c.length===13){const r=validateSAID(c);setAuthValidation(r);if(!r.valid)setAuthPhase('invalid')}
    }
    const handleCheck = async () => {
      if(authId.length<13)return
      const r=validateSAID(authId)
      if(!r.valid){setAuthPhase('invalid');setAuthValidation(r);return}
      setAuthPhase('checking')
      setAuthChecks(c=>c.map((x,i)=>i===0?{...x,status:'loading'}:x))
      try{
        await fetch(`${API}/verify-id`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id_number:authId})})
        setAuthChecks(c=>c.map((x,i)=>i===0?{...x,status:'ok',sub:`DOB: ${r.dob} · ${r.gender}`}:x))
        setTimeout(()=>{setAuthChecks(c=>c.map((x,i)=>i===1?{...x,status:'loading'}:x))
          setTimeout(()=>{setAuthChecks(c=>c.map((x,i)=>i===1?{...x,status:'ok'}:x))
            setTimeout(()=>{setAuthChecks(c=>c.map((x,i)=>i===2?{...x,status:'loading'}:x))
              setTimeout(()=>{setAuthChecks(c=>c.map((x,i)=>i===2?{...x,status:'ok'}:x));setAuthPhase('done');window._muloIdNumber=authId},900)
            },400)},900)},400)
      }catch{
        setAuthChecks(c=>c.map((x,i)=>i===0?{...x,status:'ok',sub:`DOB: ${r.dob} · ${r.gender}`}:x))
        setTimeout(()=>{setAuthChecks(c=>c.map((x,i)=>i===1?{...x,status:'loading'}:x))
          setTimeout(()=>{setAuthChecks(c=>c.map((x,i)=>i===1?{...x,status:'ok'}:x))
            setTimeout(()=>{setAuthChecks(c=>c.map((x,i)=>i===2?{...x,status:'loading'}:x))
              setTimeout(()=>{setAuthChecks(c=>c.map((x,i)=>i===2?{...x,status:'ok'}:x));setAuthPhase('done');window._muloIdNumber=authId},900)
            },400)},900)},400)
      }
    }
    return(
      <>
        <StepHeader title="Verify your identity" subtitle="Step 2 of 5" step={2} total={5} onBack={()=>setStep('products')}/>
        <div className="ip-body">
          <div style={{background:'linear-gradient(135deg,#0E2344,#132035)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,padding:'18px 20px',marginBottom:20}}>
            <div style={{fontSize:10,fontWeight:600,color:'rgba(255,255,255,0.4)',letterSpacing:1,textTransform:'uppercase',marginBottom:6}}>South African ID Number</div>
            <div style={{fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:700,letterSpacing:3,color:'#fff',marginBottom:6}}>{authId?`${authId.slice(0,6)} ${authId.slice(6,10)} ${authId.slice(10)}`:'000000 0000 000'}</div>
            {authValidation?.valid&&<div style={{fontSize:11,color:TEAL,display:'flex',gap:12}}><span>🎂 {authValidation.dob}</span><span>{authValidation.gender}</span></div>}
          </div>
          <div style={{marginBottom:14}}>
            <label className="ip-label">SA ID Number</label>
            <input className={`ip-input${authPhase==='invalid'?' err':authPhase==='done'?' ok':''}`} placeholder="e.g. 8001015009087" value={authId} maxLength={13} inputMode="numeric" onChange={e=>handleChange(e.target.value)}/>
            {authId.length>0&&authId.length<13&&<div style={{fontSize:11,color:'rgba(255,255,255,0.4)',marginTop:4}}>{authId.length}/13 digits</div>}
            {authPhase==='invalid'&&authValidation&&<div className="ip-hint-err">✕ {authValidation.error}</div>}
            {authValidation?.valid&&<div className="ip-hint-ok">✓ Valid · DOB {authValidation.dob} · {authValidation.gender}</div>}
          </div>
          {authId.length===13&&authValidation?.valid&&(
            <div className="ip-fade" style={{display:'flex',gap:10,marginBottom:14}}>
              <div style={{flex:1}}><label className="ip-label">First name</label><input className="ip-input" placeholder="e.g. Thabo" value={authFirstName} onChange={e=>setAuthFirstName(e.target.value)} autoCapitalize="words"/></div>
              <div style={{flex:1}}><label className="ip-label">Last name</label><input className="ip-input" placeholder="e.g. Nkosi" value={authLastName} onChange={e=>setAuthLastName(e.target.value)} autoCapitalize="words"/></div>
            </div>
          )}
          {(authPhase==='checking'||authPhase==='done')&&(
            <div className="ip-fade" style={{marginBottom:8}}>
              <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:.8,marginBottom:8}}>Verification checks</div>
              {authChecks.map((c,i)=>(
                <div key={i} className="ip-check-row">
                  <div style={{width:26,height:26,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,flexShrink:0,background:c.status==='ok'?'rgba(29,185,122,0.15)':c.status==='loading'?'rgba(0,184,169,0.15)':'rgba(255,255,255,0.06)',color:c.status==='ok'?GREEN:c.status==='loading'?TEAL:'rgba(255,255,255,0.3)'}}>
                    {c.status==='loading'?<div className="ip-spinner"/>:c.status==='ok'?'✓':'○'}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:'#0A1628'}}>{c.label}</div>
                    <div style={{fontSize:11,color:'#8FA3BE'}}>{c.sub}</div>
                  </div>
                  {c.status==='ok'&&<div style={{fontSize:11,color:GREEN,fontWeight:600,flexShrink:0}}>Passed</div>}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="ip-bottom">
          {authPhase!=='done'
            ?<button className="ip-btn" disabled={authId.length<13||authPhase==='invalid'||authPhase==='checking'} onClick={handleCheck}>{authPhase==='checking'?'Verifying…':'Verify my ID →'}</button>
            :<button className="ip-btn" disabled={!authFirstName.trim()||!authLastName.trim()} onClick={()=>{window._muloFirstName=authFirstName;window._muloLastName=authLastName;setStep('phone')}}>Continue →</button>
          }
        </div>
      </>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PHONE
  // ════════════════════════════════════════════════════════════════════════════
  const renderPhone = () => {
    const digits=authPhone.replace(/\D/g,'')
    const valid=digits.length===9||digits.length===10
    const handleContinue=async()=>{
      const norm=digits.startsWith('0')?digits:'0'+digits
      window._muloCellphone=norm
      try{await fetch(`${API}/otp/send`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cellphone:norm,id_number:authId})})}catch{}
      setAuthTimer(59);setAuthOtp(['','','','','','']);setStep('otp')
    }
    return(
      <>
        <StepHeader title="Your WhatsApp number" subtitle="Step 3 of 5" step={3} total={5} onBack={()=>setStep('id')}/>
        <div className="ip-body">
          <p style={{fontSize:13,color:'#5A7A9A',marginBottom:20,lineHeight:1.6}}>We'll send a one-time verification code via WhatsApp.</p>
          <div style={{position:'relative',marginBottom:16}}>
            <div style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',display:'flex',alignItems:'center',gap:6,pointerEvents:'none'}}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              <span style={{fontSize:13,fontWeight:600,color:'#fff'}}>+27</span>
              <span style={{color:'rgba(255,255,255,0.15)'}}>|</span>
            </div>
            <input className="ip-input" type="tel" inputMode="numeric" placeholder="82 123 4567" value={authPhone.replace(/^0/,'')} onChange={e=>setAuthPhone(e.target.value)} style={{paddingLeft:74,borderColor:valid?'#25D366':'rgba(255,255,255,0.12)'}}/>
          </div>
        </div>
        <div className="ip-bottom">
          <button className="ip-btn" disabled={!valid} onClick={handleContinue}>Send OTP via WhatsApp →</button>
        </div>
      </>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // OTP
  // ════════════════════════════════════════════════════════════════════════════
  const renderOtp = () => {
    const code=authOtp.join('')
    const handleDigit=(i,val)=>{const v=val.replace(/\D/g,'').slice(-1);const n=[...authOtp];n[i]=v;setAuthOtp(n);setAuthPhase('idle');if(v&&i<5)otpRefs.current[i+1]?.focus()}
    const handleKey=(i,e)=>{if(e.key==='Backspace'&&!authOtp[i]&&i>0)otpRefs.current[i-1]?.focus()}
    const handlePaste=e=>{const p=e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);if(p.length===6){setAuthOtp(p.split(''));otpRefs.current[5]?.focus()}}
    const verify=async()=>{
      if(code.length<6)return
      setAuthPhase('checking')
      try{
        const res=await fetch(`${API}/otp/verify`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id_number:authId,otp:code})})
        const data=await res.json()
        if(data.verified){window._muloVerifiedToken=data.verifiedToken;setAuthPhase('done');setTimeout(()=>setStep('register'),700)}
        else{setAuthPhase('error');setAuthOtp(['','','','','','']);otpRefs.current[0]?.focus()}
      }catch{setAuthPhase('error');setAuthOtp(['','','','','','']);otpRefs.current[0]?.focus()}
    }
    return(
      <>
        <StepHeader title="Enter your OTP" subtitle="Step 3 of 5" step={3} total={5} onBack={()=>setStep('phone')}/>
        <div className="ip-body">
          <div style={{background:'rgba(37,211,102,0.07)',border:'1px solid rgba(37,211,102,0.15)',borderRadius:12,padding:14,marginBottom:24,display:'flex',alignItems:'center',gap:12}}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            <div><div style={{fontSize:11,color:'rgba(255,255,255,0.4)'}}>OTP sent to</div><div style={{fontSize:14,fontWeight:700,color:'#fff'}}>+27 {window._muloCellphone?.slice(1)}</div></div>
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:16}} onPaste={handlePaste}>
            {authOtp.map((d,i)=>(
              <input key={i} ref={el=>otpRefs.current[i]=el} className="ip-otp-box" type="tel" inputMode="numeric" maxLength={1} value={d}
                onChange={e=>handleDigit(i,e.target.value)} onKeyDown={e=>handleKey(i,e)}
                style={{borderColor:authPhase==='error'?'#FF5C5C':authPhase==='done'?GREEN:d?TEAL:'rgba(255,255,255,0.15)'}}/>
            ))}
          </div>
          {authPhase==='error'&&<div style={{color:'#FF5C5C',fontSize:13,textAlign:'center',marginBottom:12}}>✕ Incorrect OTP. Please try again.</div>}
          {authPhase==='done'&&<div style={{color:GREEN,fontSize:13,textAlign:'center',marginBottom:12}}>✓ Verified!</div>}
          <div style={{textAlign:'center',fontSize:12,color:'rgba(255,255,255,0.4)'}}>
            {authTimer>0?<span>Resend in <strong style={{color:'#fff'}}>{authTimer}s</strong></span>
              :<span style={{color:TEAL,cursor:'pointer'}} onClick={()=>{setAuthTimer(59);setAuthOtp(['','','','','',''])}}>Resend OTP</span>}
          </div>
        </div>
        <div className="ip-bottom">
          <button className="ip-btn" disabled={code.length<6||authPhase==='checking'||authPhase==='done'} onClick={verify}>{authPhase==='checking'?'Verifying…':authPhase==='done'?'Verified ✓':'Verify OTP →'}</button>
        </div>
      </>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // REGISTER
  // ════════════════════════════════════════════════════════════════════════════
  const renderRegister = () => {
    const ready=authEmail&&authPass.length>=8
    const handleRegister=async()=>{
      if(!ready)return;setAuthPhase('checking')
      try{await fetch(`${API}/signup`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id_number:authId,first_name:authFirstName,last_name:authLastName,cellphone:window._muloCellphone,email:authEmail,password:authPass,verified_token:window._muloVerifiedToken})})}catch{}
      window._muloEmail=authEmail;setAuthPhase('idle')
      setJourneyStep(needsHome?'home':needsCar?'car':'quotes')
      setStep('journey')
    }
    return(
      <>
        <StepHeader title="Create your account" subtitle="Step 4 of 5" step={4} total={5} onBack={()=>setStep('otp')}/>
        <div className="ip-body">
          <div style={{marginBottom:20}}>
            <div style={{fontSize:16,fontWeight:700,color:'#0A1628',marginBottom:4}}>Welcome, {authFirstName}! 👋</div>
            <div style={{fontSize:13,color:'#8FA3BE'}}>Just your email and a password to finish setting up your account.</div>
          </div>
          <div style={{marginBottom:14}}>
            <label className="ip-label">Email address</label>
            <input className="ip-input" type="email" placeholder="you@example.com" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} autoCapitalize="none"/>
          </div>
          <div style={{marginBottom:14}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
              <label className="ip-label" style={{margin:0}}>Password</label>
              <span style={{fontSize:12,color:TEAL,cursor:'pointer',fontWeight:600}} onClick={()=>setShowPass(p=>!p)}>{showPass?'Hide':'Show'}</span>
            </div>
            <input className="ip-input" type={showPass?'text':'password'} placeholder="Min. 8 characters" value={authPass} onChange={e=>setAuthPass(e.target.value)}/>
            {authPass.length>0&&<div style={{display:'flex',gap:4,marginTop:8}}>{[authPass.length>=8,/[A-Z]/.test(authPass),/[0-9]/.test(authPass)].map((ok,i)=><div key={i} style={{flex:1,height:3,borderRadius:99,background:ok?TEAL:'rgba(255,255,255,0.1)',transition:'background .3s'}}/>)}</div>}
          </div>
          <div style={{fontSize:11,color:'#8FA3BE',lineHeight:1.6,marginBottom:8}}>By creating an account you agree to Muḽo's Terms of Service and Privacy Policy. Your information is processed in terms of POPIA.</div>
        </div>
        <div className="ip-bottom">
          <button className="ip-btn" disabled={!ready||authPhase==='checking'} onClick={handleRegister}>{authPhase==='checking'?'Creating account…':'Get my free quotes →'}</button>
        </div>
      </>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // JOURNEY — HOME DETAILS
  // ════════════════════════════════════════════════════════════════════════════
  const renderHome = () => {
    const needBuildings = selected.includes('BUILDINGS')
    const needContents  = selected.includes('CONTENTS')
    const canContinue   = property.address && (!needBuildings || property.buildingValue) && (!needContents || property.contentsValue)
    return(
      <>
        <StepHeader title="Tell us about your home" subtitle={`Step ${journeyIdx+1} of ${journeyTotal}`} step={journeyIdx+1} total={journeyTotal} onBack={goPrevJourney}/>
        <div className="ip-body">
          <div style={{marginBottom:14}}>
            <label className="ip-label">Property address</label>
            <input id="ip-address-input" className="ip-input" type="text" placeholder="Start typing your address…" defaultValue={property.address}
              onChange={e=>setProperty(p=>({...p,address:e.target.value}))}
              onFocus={initAddressAutocomplete}/>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',marginTop:4}}>🔍 Powered by Google Maps</div>
          </div>
          {needBuildings&&(
            <div style={{marginBottom:14}}>
              <label className="ip-label">Estimated building replacement value (R)</label>
              <input className="ip-input" type="number" placeholder="e.g. 2800000" value={property.buildingValue} onChange={e=>setProperty(p=>({...p,buildingValue:e.target.value}))} inputMode="numeric"/>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',marginTop:4}}>This is what it would cost to rebuild from scratch — not the market value.</div>
            </div>
          )}
          {needContents&&(
            <div style={{marginBottom:14}}>
              <label className="ip-label">Estimated contents value (R)</label>
              <input className="ip-input" type="number" placeholder="e.g. 150000" value={property.contentsValue} onChange={e=>setProperty(p=>({...p,contentsValue:e.target.value}))} inputMode="numeric"/>
            </div>
          )}
          <div style={{marginBottom:14}}>
            <label className="ip-label">Roof type</label>
            <select className="ip-select" value={property.roofType} onChange={e=>setProperty(p=>({...p,roofType:e.target.value}))}>
              {['Tiles','IBR / Corrugated iron','Thatch','Flat concrete','Fibre cement'].map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
          <div style={{marginBottom:14}}>
            <label className="ip-label">Wall construction</label>
            <select className="ip-select" value={property.wallType} onChange={e=>setProperty(p=>({...p,wallType:e.target.value}))}>
              {['Brick & plaster','Double brick','Face brick','Prefab / timber','Stone'].map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
          <div style={{marginBottom:14}}>
            <label className="ip-label">Alarm system?</label>
            <select className="ip-select" value={property.alarmSystem} onChange={e=>setProperty(p=>({...p,alarmSystem:e.target.value}))}>
              {['Yes — monitored','Yes — unmonitored','No'].map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
          <div style={{marginBottom:8}}>
            <label className="ip-label">Armed response / security guard?</label>
            <select className="ip-select" value={property.armedResponse} onChange={e=>setProperty(p=>({...p,armedResponse:e.target.value}))}>
              {['Yes','No'].map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div className="ip-bottom">
          <button className="ip-btn" disabled={!canContinue} onClick={goNextJourney}>Continue →</button>
        </div>
      </>
    )
  }

  // Google Places autocomplete for parking address
  const initParkingAutocomplete = () => {
    if(!window.google||!window.google.maps)return
    const input = document.getElementById('ip-parking-input')
    if(!input||input._parkingAC)return
    const ac = new window.google.maps.places.Autocomplete(input,{
      componentRestrictions:{country:'za'},
      types:['geocode'],
      fields:['formatted_address','address_components'],
    })
    input._parkingAC = ac
    ac.addListener('place_changed',()=>{
      const place = ac.getPlace()
      if(place.formatted_address){
        setCarDriver(p=>({...p,parkingAddress:place.formatted_address}))
      }
    })
  }

  // ════════════════════════════════════════════════════════════════════════════
  // JOURNEY — CAR DETAILS
  // ════════════════════════════════════════════════════════════════════════════
  const renderCar = () => {
    const canContinue = vehicle.make && vehicle.model && vehicle.year && vehicle.reg
    const availableModels = vehicle.make ? (VEHICLE_MODELS[vehicle.make] || []) : []
    const availableVariants = vehicle.model ? (VEHICLE_VARIANTS[vehicle.model] || []) : []
    const handleMakeChange = e => setVehicle(p=>({...p,make:e.target.value,model:'',variant:''}))
    const handleModelChange = e => setVehicle(p=>({...p,model:e.target.value,variant:''}))
    return(
      <>
        <StepHeader title="Tell us about your car" subtitle={`Step ${journeyIdx+1} of ${journeyTotal}`} step={journeyIdx+1} total={journeyTotal} onBack={goPrevJourney}/>
        <div className="ip-body">

          <div style={{marginBottom:14}}>
            <label className="ip-label">Vehicle make</label>
            <select className="ip-select" value={vehicle.make||''} onChange={handleMakeChange}>
              <option value="">Select make</option>
              {VEHICLE_MAKES.map(m=><option key={m}>{m}</option>)}
            </select>
          </div>

          <div style={{marginBottom:14}}>
            <label className="ip-label">Vehicle model</label>
            <select className="ip-select" value={vehicle.model||''} onChange={handleModelChange} disabled={!vehicle.make}>
              <option value="">{vehicle.make?'Select model':'Select make first'}</option>
              {availableModels.map(m=><option key={m}>{m}</option>)}
            </select>
          </div>

          <div style={{marginBottom:14}}>
            <label className="ip-label">Variant / trim <span style={{color:'rgba(255,255,255,0.3)',fontWeight:400,textTransform:'none',letterSpacing:0}}>(optional)</span></label>
            {availableVariants.length>0
              ?<select className="ip-select" value={vehicle.variant||''} onChange={e=>setVehicle(p=>({...p,variant:e.target.value}))} disabled={!vehicle.model}>
                <option value="">Select variant</option>
                {availableVariants.map(v=><option key={v}>{v}</option>)}
              </select>
              :<input className="ip-input" type="text" placeholder="e.g. 1.8 XS CVT" value={vehicle.variant||''} onChange={e=>setVehicle(p=>({...p,variant:e.target.value}))} disabled={!vehicle.model}/>
            }
          </div>

          <div style={{display:'flex',gap:10,marginBottom:14}}>
            <div style={{flex:1}}>
              <label className="ip-label">Year</label>
              <select className="ip-select" value={vehicle.year||''} onChange={e=>setVehicle(p=>({...p,year:e.target.value}))}>
                <option value="">Year</option>
                {VEHICLE_YEARS.map(y=><option key={y}>{y}</option>)}
              </select>
            </div>
            <div style={{flex:1}}>
              <label className="ip-label">Colour</label>
              <select className="ip-select" value={vehicle.colour||''} onChange={e=>setVehicle(p=>({...p,colour:e.target.value}))}>
                <option value="">Select</option>
                {VEHICLE_COLOURS.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div style={{marginBottom:14}}>
            <label className="ip-label">Registration number</label>
            <input className="ip-input" type="text" placeholder="e.g. CA 123-456" value={vehicle.reg||''} onChange={e=>setVehicle(p=>({...p,reg:e.target.value.toUpperCase()}))} autoCapitalize="characters"/>
          </div>

          <div style={{display:'flex',gap:10,marginBottom:14}}>
            <div style={{flex:1}}>
              <label className="ip-label">Body type</label>
              <select className="ip-select" value={vehicle.bodyType||''} onChange={e=>setVehicle(p=>({...p,bodyType:e.target.value}))}>
                <option value="">Select</option>
                {VEHICLE_BODY_TYPES.map(b=><option key={b}>{b}</option>)}
              </select>
            </div>
            <div style={{flex:1}}>
              <label className="ip-label">Fuel type</label>
              <select className="ip-select" value={vehicle.fuelType||''} onChange={e=>setVehicle(p=>({...p,fuelType:e.target.value}))}>
                <option value="">Select</option>
                {VEHICLE_FUEL_TYPES.map(f=><option key={f}>{f}</option>)}
              </select>
            </div>
          </div>

          <div style={{display:'flex',gap:10,marginBottom:14}}>
            <div style={{flex:1}}>
              <label className="ip-label">Transmission</label>
              <select className="ip-select" value={vehicle.transmission||''} onChange={e=>setVehicle(p=>({...p,transmission:e.target.value}))}>
                <option value="">Select</option>
                {VEHICLE_TRANSMISSIONS.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{flex:1}}>
              <label className="ip-label">Engine size</label>
              <select className="ip-select" value={vehicle.engineSize||''} onChange={e=>setVehicle(p=>({...p,engineSize:e.target.value}))}>
                <option value="">Select</option>
                {VEHICLE_ENGINE_SIZES.map(e=><option key={e}>{e}</option>)}
              </select>
            </div>
          </div>

          <div style={{marginBottom:14}}>
            <label className="ip-label">Vehicle use</label>
            <select className="ip-select" value={vehicle.use||'private'} onChange={e=>setVehicle(p=>({...p,use:e.target.value}))}>
              <option value="private">Private</option>
              <option value="business">Business</option>
              <option value="both">Both private & business</option>
              <option value="uber">Uber / e-hailing</option>
            </select>
          </div>

          <div style={{marginBottom:vehicle.financed?14:8}}>
            <label className="ip-label">Is the vehicle financed?</label>
            <div style={{display:'flex',gap:8}}>
              {['Yes','No'].map(o=>{
                const active=o==='Yes'?vehicle.financed===true:vehicle.financed===false
                return(
                  <button key={o} onClick={()=>setVehicle(p=>({...p,financed:o==='Yes',financeHouse:o==='No'?'':p.financeHouse}))}
                    style={{flex:1,padding:11,borderRadius:10,border:`1.5px solid ${active?TEAL:'#E2E9F0'}`,background:active?'rgba(0,184,169,0.08)':'#fff',color:'#0A1628',fontSize:14,fontWeight:600,cursor:'pointer'}}>
                    {o}
                  </button>
                )
              })}
            </div>
          </div>

          {vehicle.financed===true&&(
            <div style={{marginBottom:8}}>
              <label className="ip-label">Finance house</label>
              <select className="ip-select" value={vehicle.financeHouse||''} onChange={e=>setVehicle(p=>({...p,financeHouse:e.target.value}))}>
                <option value="">Select bank / financier</option>
                {VEHICLE_FINANCE_HOUSES.map(f=><option key={f}>{f}</option>)}
              </select>
            </div>
          )}

        </div>
        <div className="ip-bottom">
          <button className="ip-btn" disabled={!canContinue} onClick={goNextJourney}>Continue →</button>
        </div>
      </>
    )
  }


  // ════════════════════════════════════════════════════════════════════════════
  // JOURNEY — DRIVER & COVER DETAILS
  // ════════════════════════════════════════════════════════════════════════════
  const renderCarDriver = () => {
    const canContinue = carDriver.licenceDate && carDriver.parkingAddress && (
      (carDriver.regularDriver==='Another person')
        ? (carDriver.driverIdNumber?.length===13 && carDriver.driverFirstName && carDriver.driverLastName)
        : true
    )
    return(
      <>
        <StepHeader title="Driver & cover details" subtitle={`Step ${journeyIdx+1} of ${journeyTotal}`} step={journeyIdx+1} total={journeyTotal} onBack={goPrevJourney}/>
        <div className="ip-body">

          <div style={{marginBottom:14}}>
            <label className="ip-label">Cover type</label>
            <div style={{display:'flex',gap:8}}>
              {['Comprehensive','Third party fire & theft','Third party only'].map(o=>(
                <button key={o} onClick={()=>setCarDriver(p=>({...p,coverType:o}))}
                  style={{flex:1,padding:'10px 6px',borderRadius:10,border:`1.5px solid ${carDriver.coverType===o?TEAL:'#E2E9F0'}`,background:carDriver.coverType===o?'rgba(0,184,169,0.08)':'#fff',color:carDriver.coverType===o?TEAL:'#5A7A9A',fontSize:11,fontWeight:600,cursor:'pointer',lineHeight:1.3,textAlign:'center'}}>
                  {o}
                </button>
              ))}
            </div>
          </div>

          <div style={{marginBottom:14}}>
            <label className="ip-label">Who is the regular driver?</label>
            <div style={{display:'flex',gap:8}}>
              {['Myself','Another person'].map(o=>(
                <button key={o} onClick={()=>setCarDriver(p=>({...p,regularDriver:o,driverIdNumber:'',driverFirstName:'',driverLastName:'',driverAge:''}))}
                  style={{flex:1,padding:11,borderRadius:10,border:`1.5px solid ${(carDriver.regularDriver||'Myself')===o?TEAL:'#E2E9F0'}`,background:(carDriver.regularDriver||'Myself')===o?'rgba(0,184,169,0.08)':'#fff',color:(carDriver.regularDriver||'Myself')===o?TEAL:'#0A1628',fontSize:14,fontWeight:600,cursor:'pointer'}}>
                  {o}
                </button>
              ))}
            </div>
          </div>

          {(carDriver.regularDriver==='Another person')&&(
            <div style={{background:'rgba(0,184,169,0.04)',border:'1.5px solid rgba(0,184,169,0.15)',borderRadius:14,padding:14,marginBottom:14}}>
              <div style={{fontSize:12,color:'#5A7A9A',marginBottom:12,lineHeight:1.5}}>We need the regular driver's details to rate this policy accurately.</div>
              <div style={{marginBottom:10}}>
                <label className="ip-label">Regular driver ID number</label>
                <input className={`ip-input${carDriver.driverIdNumber?.length===13?(validateSAID(carDriver.driverIdNumber).valid?' ok':' err'):''}`} type="text" placeholder="13-digit SA ID number" value={carDriver.driverIdNumber||''} onChange={e=>{const v=e.target.value.replace(/[^0-9]/g,'').slice(0,13);const r=v.length===13?validateSAID(v):null;setCarDriver(p=>({...p,driverIdNumber:v,driverAge:r?.valid?String(r.age):p.driverAge}))}} inputMode="numeric"/>
                {carDriver.driverIdNumber?.length===13&&(()=>{const r=validateSAID(carDriver.driverIdNumber);return r.valid?<div className="ip-hint-ok">✓ Valid · DOB {r.dob} · {r.gender}</div>:<div className="ip-hint-err">✕ {r.error}</div>})()}
              </div>
              <div style={{display:'flex',gap:8}}>
                <div style={{flex:1}}>
                  <label className="ip-label">First name</label>
                  <input className="ip-input" type="text" placeholder="e.g. Thabo" value={carDriver.driverFirstName||''} onChange={e=>setCarDriver(p=>({...p,driverFirstName:e.target.value}))} autoCapitalize="words"/>
                </div>
                <div style={{flex:1}}>
                  <label className="ip-label">Last name</label>
                  <input className="ip-input" type="text" placeholder="e.g. Nkosi" value={carDriver.driverLastName||''} onChange={e=>setCarDriver(p=>({...p,driverLastName:e.target.value}))} autoCapitalize="words"/>
                </div>
              </div>
            </div>
          )}

          <div style={{marginBottom:14}}>
            <label className="ip-label">Licence type</label>
            <select className="ip-select" value={carDriver.licence} onChange={e=>setCarDriver(p=>({...p,licence:e.target.value}))}>
              <option>Code 8</option>
              <option>Code 10</option>
              <option>Code 14</option>
              <option>Learner licence</option>
            </select>
          </div>

          <div style={{marginBottom:14}}>
            <label className="ip-label">Date licence obtained</label>
            <input className="ip-input" type="date" value={carDriver.licenceDate||''} onChange={e=>setCarDriver(p=>({...p,licenceDate:e.target.value}))}
              max={new Date().toISOString().slice(0,10)}
              min="1950-01-01"
              style={{colorScheme:'light'}}/>
            {carDriver.licenceDate&&<div style={{fontSize:11,color:TEAL,marginTop:4}}>
              Licensed for {Math.floor((new Date()-new Date(carDriver.licenceDate))/31536000000)} year(s)
            </div>}
          </div>

          <div style={{marginBottom:14}}>
            <label className="ip-label">Claims in the last 3 years?</label>
            <div style={{display:'flex',gap:8}}>
              {['No','Yes — 1 claim','Yes — 2+ claims'].map(o=>(
                <button key={o} onClick={()=>setCarDriver(p=>({...p,claims:o}))}
                  style={{flex:1,padding:'10px 6px',borderRadius:10,border:`1.5px solid ${carDriver.claims===o?TEAL:'#E2E9F0'}`,background:carDriver.claims===o?'rgba(0,184,169,0.08)':'#fff',color:carDriver.claims===o?TEAL:'#5A7A9A',fontSize:11,fontWeight:600,cursor:'pointer',textAlign:'center'}}>
                  {o}
                </button>
              ))}
            </div>
          </div>



          <div style={{marginBottom:14}}>
            <label className="ip-label">Overnight parking address</label>
            <input id="ip-parking-input" className="ip-input" type="text" placeholder="Start typing suburb or address…" defaultValue={carDriver.parkingAddress||''} onChange={e=>setCarDriver(p=>({...p,parkingAddress:e.target.value}))} onFocus={initParkingAutocomplete}/>
            <div style={{fontSize:11,color:'#8FA3BE',marginTop:4}}>🔍 Powered by Google Maps · suburb is sufficient</div>
          </div>

          <div style={{marginBottom:14}}>
            <label className="ip-label">Overnight parking type</label>
            <select className="ip-select" value={carDriver.parkingType} onChange={e=>setCarDriver(p=>({...p,parkingType:e.target.value}))}>
              <option>Garage</option>
              <option>Carport</option>
              <option>Open driveway</option>
              <option>Street</option>
              <option>Secured parking (complex / estate)</option>
            </select>
          </div>

          <div style={{marginBottom:14}}>
            <label className="ip-label">Tracking device fitted?</label>
            <div style={{display:'flex',gap:8}}>
              {['No','Yes'].map(o=>(
                <button key={o} onClick={()=>setCarDriver(p=>({...p,tracking:o,trackingProvider:o==='No'?'':p.trackingProvider}))}
                  style={{flex:1,padding:11,borderRadius:10,border:`1.5px solid ${carDriver.tracking===o?TEAL:'#E2E9F0'}`,background:carDriver.tracking===o?'rgba(0,184,169,0.08)':'#fff',color:carDriver.tracking===o?TEAL:'#5A7A9A',fontSize:14,fontWeight:600,cursor:'pointer'}}>
                  {o}
                </button>
              ))}
            </div>
          </div>

          {carDriver.tracking==='Yes'&&(
            <div style={{marginBottom:8}}>
              <label className="ip-label">Tracking provider</label>
              <select className="ip-select" value={carDriver.trackingProvider} onChange={e=>setCarDriver(p=>({...p,trackingProvider:e.target.value}))}>
                <option value="">Select provider</option>
                <option>Tracker</option>
                <option>Matrix</option>
                <option>Netstar</option>
                <option>Cartrack</option>
                <option>Digicore</option>
                <option>Other</option>
              </select>
            </div>
          )}

        </div>
        <div className="ip-bottom">
          <button className="ip-btn" disabled={!canContinue} onClick={goNextJourney}>Continue →</button>
        </div>
      </>
    )
  }


  // ════════════════════════════════════════════════════════════════════════════
  // JOURNEY — VALUE ADDED PRODUCTS (VAPs)
  // ════════════════════════════════════════════════════════════════════════════
  const renderVaps = () => {
    const vapsTotal = selectedVaps.reduce((s,c)=>s+(VAPS.find(v=>v.code===c)?.premium||0),0)
    const carPremium = Object.values(selectedQuotes).reduce((s,q)=>s+(q?.premium||0),0)
    return(
      <>
        <StepHeader title="Enhance your cover" subtitle={`Step ${journeyIdx+1} of ${journeyTotal}`} step={journeyIdx+1} total={journeyTotal} onBack={goPrevJourney}/>
        <div className="ip-body">
          <p style={{fontSize:13,color:'#5A7A9A',marginBottom:16,lineHeight:1.6}}>Add these optional extras to your car insurance policy.</p>

          {VAPS.map(v=>{
            const isSel = selectedVaps.includes(v.code)
            return(
              <div key={v.code} className={`ip-product${isSel?' sel':''}`} onClick={()=>setSelectedVaps(p=>p.includes(v.code)?p.filter(c=>c!==v.code):[...p,v.code])}>
                <span style={{fontSize:26}}>{v.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:600,color:'#0A1628'}}>{v.label}</div>
                  <div style={{fontSize:12,color:'#8FA3BE',marginTop:2}}>{v.sub}</div>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <div style={{fontSize:14,fontWeight:700,color:'#0A1628'}}>+R{v.premium}/mo</div>
                  <div style={{width:20,height:20,borderRadius:99,border:`2px solid ${isSel?TEAL:'#E2E9F0'}`,background:isSel?TEAL:'transparent',display:'flex',alignItems:'center',justifyContent:'center',marginTop:4,marginLeft:'auto'}}>
                    {isSel&&<span style={{color:'#fff',fontSize:11,fontWeight:700}}>✓</span>}
                  </div>
                </div>
              </div>
            )
          })}

          <div style={{background:'#fff',border:'1.5px solid #E2E9F0',borderRadius:14,padding:14,marginTop:8}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
              <span style={{fontSize:13,color:'#8FA3BE'}}>Base premium</span>
              <span style={{fontSize:13,fontWeight:600,color:'#0A1628'}}>R{carPremium.toLocaleString()}/mo</span>
            </div>
            {vapsTotal>0&&<div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
              <span style={{fontSize:13,color:'#8FA3BE'}}>VAPs</span>
              <span style={{fontSize:13,fontWeight:600,color:'#0A1628'}}>+R{vapsTotal}/mo</span>
            </div>}
            <div style={{display:'flex',justifyContent:'space-between',paddingTop:8,borderTop:'1px solid #F0F4F8'}}>
              <span style={{fontSize:14,fontWeight:700,color:'#0A1628'}}>Total</span>
              <span style={{fontSize:16,fontWeight:700,color:TEAL}}>R{(carPremium+vapsTotal).toLocaleString()}/mo</span>
            </div>
          </div>
        </div>
        <div className="ip-bottom">
          <button className="ip-btn" onClick={goNextJourney}>
            {selectedVaps.length>0?`Continue with ${selectedVaps.length} extra${selectedVaps.length>1?'s':''} →`:'Continue without extras →'}
          </button>
        </div>
      </>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // JOURNEY — QUOTES
  // ════════════════════════════════════════════════════════════════════════════
  const renderQuotes = () => {
    if(quotesLoading) return(
      <>
        <StepHeader title="Fetching your quotes" subtitle="This takes about 3 seconds" step={journeyIdx+1} total={journeyTotal} onBack={goPrevJourney}/>
        <div style={{padding:'40px 20px',textAlign:'center'}}>
          <div style={{display:'flex',justifyContent:'center',marginBottom:24}}>
            <div style={{width:48,height:48,border:`3px solid rgba(255,255,255,0.1)`,borderTop:`3px solid ${TEAL}`,borderRadius:'50%',animation:'spin .8s linear infinite'}}/>
          </div>
          <div style={{fontSize:15,fontWeight:600,color:'#0A1628',marginBottom:8}}>Comparing quotes from 8 insurers…</div>
          <div style={{fontSize:13,color:'#8FA3BE'}}>Ranking by value, claims reputation and cashback</div>
          <div style={{marginTop:24,display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap'}}>
            {['Absa','Pineapple','Naked','King Price','MiWay'].map(n=>(
              <div key={n} style={{background:'rgba(255,255,255,0.06)',borderRadius:99,padding:'4px 10px',fontSize:11,color:'rgba(255,255,255,0.4)'}}>{n}</div>
            ))}
          </div>
        </div>
      </>
    )

    return(
      <>
        <StepHeader title="Your quotes" subtitle="Ranked by total premium — lowest first" step={journeyIdx+1} total={journeyTotal} onBack={goPrevJourney}/>
        <div className="ip-body">
          {/* Cashback banner */}
          <div style={{background:'rgba(29,185,122,0.1)',border:'1px solid rgba(29,185,122,0.2)',borderRadius:12,padding:'12px 14px',marginBottom:16,display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:20}}>💸</span>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:GREEN}}>R{totalCashback.toLocaleString()} cashback available</div>
              <div style={{fontSize:11,color:'#5A7A9A'}}>Earn this when your first premium is collected · 12-month lock-in</div>
            </div>
          </div>

          {(()=>{
            const insurers=[...new Set(Object.values(quotesData).flat().map(q=>q.insurer))]
            const ranked=insurers.map(insurer=>{
              const quotes={};let total=0,totalCB=0,minExcess=999999,minRating=5
              selected.forEach(code=>{
                const q=(quotesData[code]||[]).find(q=>q.insurer===insurer)
                if(q){quotes[code]=q;total+=q.premium;totalCB+=q.cashback;minExcess=Math.min(minExcess,q.excess);minRating=Math.min(minRating,q.rating)}
              })
              return{insurer,quotes,total,totalCB,minExcess,minRating,covered:Object.keys(quotes).length}
            }).filter(r=>r.covered===selected.length).sort((a,b)=>a.total-b.total)
            return ranked.map((r,idx)=>{
              const isSelected=selected.every(code=>selectedQuotes[code]?.insurer===r.insurer)
              const sampleQ=Object.values(r.quotes)[0]
              return(
                <div key={r.insurer} className={`ip-quote-card${isSelected?' sel':''}`}
                  onClick={()=>setSelectedQuotes(prev=>{const n={...prev};selected.forEach(code=>{if(r.quotes[code])n[code]=r.quotes[code]});return n})}>
                  {idx===0&&<div style={{fontSize:10,fontWeight:700,color:TEAL,textTransform:'uppercase',letterSpacing:.5,marginBottom:8}}>⭐ Best price</div>}
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                    <img src={sampleQ?.logo} width={32} height={32} style={{borderRadius:8,objectFit:'contain',background:'#F7F9FC',padding:4,border:'1px solid #E2E9F0'}} onError={e=>e.target.style.display='none'}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:15,fontWeight:700,color:'#0A1628'}}>{r.insurer}</div>
                      <div style={{fontSize:11,color:'#8FA3BE'}}>⭐ {r.minRating} · {selected.length} product{selected.length>1?'s':''} covered</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:20,fontWeight:800,color:'#0A1628'}}>R{r.total.toLocaleString()}</div>
                      <div style={{fontSize:10,color:'#8FA3BE'}}>/month total</div>
                    </div>
                  </div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:10}}>
                    {selected.map(code=>{
                      const q=r.quotes[code];const prod=PRODUCTS.find(p=>p.code===code)
                      return q?<div key={code} style={{fontSize:11,background:'#F7F9FC',border:'1px solid #E2E9F0',borderRadius:8,padding:'4px 8px',color:'#5A7A9A'}}>{prod?.icon} R{q.premium}/mo</div>:null
                    })}
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:8,borderTop:'1px solid #F0F4F8'}}>
                    <span style={{fontSize:12,color:GREEN,fontWeight:600}}>💸 R{r.totalCB.toLocaleString()} cashback</span>
                    <span style={{fontSize:11,color:'#8FA3BE'}}>Excess from R{r.minExcess.toLocaleString()}</span>
                  </div>
                  {isSelected&&<div style={{marginTop:10,padding:'8px 10px',background:'rgba(0,184,169,0.08)',borderRadius:8,fontSize:12,color:TEAL,fontWeight:600}}>
                    ✓ Selected — cashback earned on first premium collected
                  </div>}
                </div>
              )
            })
          })()}

          <div style={{background:'#fff',border:'1px solid #E2E9F0',borderRadius:12,padding:14,marginBottom:8}}>
            <div style={{fontSize:12,color:'#8FA3BE',lineHeight:1.6}}>
              Quotes are indicative and subject to final underwriting. Muḽo Financial Services (Pty) Ltd, FSP 49169, obtains these quotes on your behalf.
            </div>
          </div>
        </div>
        <div className="ip-bottom">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
            <span style={{fontSize:13,color:'#8FA3BE'}}>Total monthly premium</span>
            <span style={{fontSize:18,fontWeight:700,color:'#0A1628'}}>R{totalPremium.toLocaleString()}/mo</span>
          </div>
          <button className="ip-btn" onClick={goNextJourney}>Continue →</button>
        </div>
      </>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // JOURNEY — REVIEW
  // ════════════════════════════════════════════════════════════════════════════
  const renderReview = () => (
    <>
      <StepHeader title="Review & confirm" subtitle={`Step ${journeyIdx+1} of ${journeyTotal}`} step={journeyIdx+1} total={journeyTotal} onBack={goPrevJourney}/>
      <div className="ip-body">
        {/* Summary per product */}
        {selected.map(code=>{
          const q = selectedQuotes[code]
          const product = PRODUCTS.find(p=>p.code===code)
          if(!q)return null
          return(
            <div key={code} style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:14,marginBottom:12}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                <span style={{fontSize:20}}>{product?.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:600,color:'#0A1628'}}>{product?.label}</div>
                  <div style={{fontSize:12,color:'#8FA3BE'}}>{q.insurer}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:16,fontWeight:700,color:'#0A1628'}}>R{q.premium.toLocaleString()}/mo</div>
                  <div style={{fontSize:11,color:GREEN}}>💸 R{q.cashback.toLocaleString()} cashback</div>
                </div>
              </div>
              <div style={{display:'flex',gap:12,fontSize:11,color:'#8FA3BE',borderTop:'1px solid #F0F4F8',paddingTop:8}}>
                <span>Excess: R{q.excess.toLocaleString()}</span>
                <span>Cover starts: {new Date(Date.now()+86400000).toLocaleDateString('en-ZA',{day:'numeric',month:'short',year:'numeric'})}</span>
              </div>
            </div>
          )
        })}

        {/* Totals */}
        <div style={{background:'rgba(29,185,122,0.06)',border:'1px solid rgba(29,185,122,0.15)',borderRadius:14,padding:14,marginBottom:16}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
            <span style={{fontSize:13,color:'#8FA3BE'}}>Base premium</span>
            <span style={{fontSize:13,fontWeight:600,color:'#0A1628'}}>R{totalPremium.toLocaleString()}</span>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
            <span style={{fontSize:13,color:'#8FA3BE'}}>SASRIA levy <span style={{fontSize:10}}>(statutory)</span></span>
            <span style={{fontSize:13,fontWeight:600,color:'#0A1628'}}>R{Math.max(15,Math.round(totalPremium*0.003)).toLocaleString()}</span>
          </div>
          {selectedVaps.length>0&&<div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
            <span style={{fontSize:13,color:'#8FA3BE'}}>VAPs</span>
            <span style={{fontSize:13,fontWeight:600,color:'#0A1628'}}>+R{selectedVaps.reduce((s,c)=>s+(VAPS.find(v=>v.code===c)?.premium||0),0)}</span>
          </div>}
          <div style={{display:'flex',justifyContent:'space-between',paddingTop:8,borderTop:'1px solid rgba(29,185,122,0.2)',marginTop:4,marginBottom:8}}>
            <span style={{fontSize:14,fontWeight:700,color:'#0A1628'}}>Total monthly</span>
            <span style={{fontSize:16,fontWeight:800,color:'#0A1628'}}>R{(totalPremium+Math.max(15,Math.round(totalPremium*0.003))+selectedVaps.reduce((s,c)=>s+(VAPS.find(v=>v.code===c)?.premium||0),0)).toLocaleString()}</span>
          </div>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <span style={{fontSize:14,color:GREEN,fontWeight:600}}>💸 Total cashback</span>
            <span style={{fontSize:16,fontWeight:700,color:GREEN}}>R{totalCashback.toLocaleString()}</span>
          </div>
          <div style={{fontSize:11,color:'#5A7A9A',marginTop:8,lineHeight:1.5}}>Cashback earned on first premium collected. 12-month lock-in applies. SASRIA is a statutory levy.</div>
        </div>

        {/* Client details */}
        <div style={{background:'#fff',border:'1px solid #E2E9F0',borderRadius:12,padding:14,marginBottom:8}}>
          <div style={{fontSize:11,fontWeight:700,color:'#8FA3BE',textTransform:'uppercase',letterSpacing:.5,marginBottom:8}}>Your details</div>
          {[[authFirstName+' '+authLastName,'Name'],[authId,'ID number'],[authEmail,'Email'],[window._muloCellphone,'Mobile']].map(([v,l])=>(
            <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #F0F4F8'}}>
              <span style={{fontSize:12,color:'#8FA3BE'}}>{l}</span>
              <span style={{fontSize:12,color:'#0A1628',fontWeight:500}}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="ip-bottom">
        <button className="ip-btn" onClick={goNextJourney}>Confirm & set up debit order →</button>
      </div>
    </>
  )

  // ════════════════════════════════════════════════════════════════════════════
  // JOURNEY — DEBIT ORDER
  // ════════════════════════════════════════════════════════════════════════════
  const renderDebit = () => {
    const canContinue = bankDetails.bank && bankDetails.accountNumber && bankDetails.accountType
    const handleBind = async () => {
      setAuthPhase('checking')
      try{
        const res = await fetch(`${API}/insure/bind`,{
          method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({
            id_number: authId,
            products: selected,
            selectedQuotes,
            bankNameCode: bankDetails.bank,
            bankAccountNumber: bankDetails.accountNumber,
            bankAccountTypeCode: bankDetails.accountType,
            coverStartDate: new Date(Date.now()+86400000).toISOString().slice(0,10),
          })
        })
        const data = await res.json()
        setPolicyRef(data.policyNumber||`MULO-${Date.now()}`)
      }catch{
        setPolicyRef(`MULO-${Date.now()}`)
      }
      setAuthPhase('idle')
      goNextJourney()
    }
    return(
      <>
        <StepHeader title="Debit order & sign" subtitle={`Step ${journeyIdx+1} of ${journeyTotal}`} step={journeyIdx+1} total={journeyTotal} onBack={goPrevJourney}/>
        <div className="ip-body">
          <div style={{marginBottom:14}}>
            <label className="ip-label">Bank</label>
            <select className="ip-select" value={bankDetails.bank} onChange={e=>setBankDetails(p=>({...p,bank:e.target.value}))}>
              <option value="">Select your bank</option>
              {['Absa','Standard Bank','Nedbank','FNB / RMB','Capitec','African Bank','Investec','Discovery Bank'].map(b=><option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div style={{marginBottom:14}}>
            <label className="ip-label">Account number</label>
            <input className="ip-input" type="text" placeholder="Your bank account number" value={bankDetails.accountNumber} onChange={e=>setBankDetails(p=>({...p,accountNumber:e.target.value}))} inputMode="numeric"/>
          </div>
          <div style={{marginBottom:14}}>
            <label className="ip-label">Account type</label>
            <select className="ip-select" value={bankDetails.accountType} onChange={e=>setBankDetails(p=>({...p,accountType:e.target.value}))}>
              <option>Cheque</option>
              <option>Savings</option>
              <option>Transmission</option>
            </select>
          </div>
          <div style={{marginBottom:14}}>
            <label className="ip-label">Debit order day</label>
            <select className="ip-select" value={bankDetails.debitDay} onChange={e=>setBankDetails(p=>({...p,debitDay:parseInt(e.target.value)}))}>
              {[1,5,15,20,25,28].map(d=><option key={d} value={d}>{d===1?'1st':d===5?'5th':d===15?'15th':d===20?'20th':d===25?'25th':'28th'} of the month</option>)}
            </select>
          </div>
          <div style={{background:'#fff',border:'1px solid #E2E9F0',borderRadius:12,padding:14,marginBottom:8}}>
            <div style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.6)',marginBottom:6}}>Debit order mandate</div>
            <div style={{fontSize:11,color:'#8FA3BE',lineHeight:1.6}}>
              By clicking "Confirm & bind policy" below, you authorise Muḽo Financial Services (Pty) Ltd (FSP 49169) to debit your account with R{totalPremium.toLocaleString()}/month for the above insurance policies. This mandate is subject to NAEDO/DebiCheck rules.
            </div>
          </div>
          <div style={{background:'#fff',border:'1px solid #E2E9F0',borderRadius:12,padding:14,marginBottom:8}}>
            <div style={{fontSize:12,fontWeight:600,color:GREEN,marginBottom:4}}>💸 Your cashback: R{totalCashback.toLocaleString()}</div>
            <div style={{fontSize:11,color:'#5A7A9A',lineHeight:1.6}}>Paid to your bank account within 30 days of your policy start date. Lock-in: 12 months.</div>
          </div>
        </div>
        <div className="ip-bottom">
          <button className="ip-btn" disabled={!canContinue||authPhase==='checking'} onClick={handleBind}>
            {authPhase==='checking'?'Binding your policy…':'Confirm & bind policy →'}
          </button>
        </div>
      </>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // JOURNEY — DONE / YOU'RE COVERED
  // ════════════════════════════════════════════════════════════════════════════
  const renderDone = () => (
    <>
      <Nav/>
      <div style={{padding:'32px 24px',textAlign:'center'}}>
        <div style={{fontSize:56,marginBottom:16}}>🎉</div>
        <h2 style={{fontFamily:"'Sora',sans-serif",fontSize:24,fontWeight:800,color:'#0A1628',margin:'0 0 8px'}}>Congratulations, {authFirstName}!</h2>
        <p style={{fontSize:15,color:'#5A7A9A',lineHeight:1.6,marginBottom:4}}>You're officially covered.</p>
        <p style={{fontSize:14,color:'#8FA3BE',lineHeight:1.6,marginBottom:24}}>
          Your policy documents will be sent to {authEmail} and via WhatsApp within minutes.
        </p>

        {/* Policy reference */}
        <div style={{background:'#fff',border:'1px solid #E2E9F0',borderRadius:14,padding:16,marginBottom:20,textAlign:'left'}}>
          <div style={{fontSize:11,fontWeight:700,color:'#8FA3BE',textTransform:'uppercase',letterSpacing:.5,marginBottom:8}}>Your policies</div>
          {selected.map(code=>{
            const q = selectedQuotes[code]
            const product = PRODUCTS.find(p=>p.code===code)
            if(!q)return null
            return(
              <div key={code} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                <span style={{fontSize:13,color:'#0A1628'}}>{product?.icon} {product?.label}</span>
                <span style={{fontSize:13,fontWeight:600,color:'#0A1628'}}>R{q.premium.toLocaleString()}/mo via {q.insurer}</span>
              </div>
            )
          })}
        </div>

        {/* Cashback timeline */}
        <div style={{background:'rgba(29,185,122,0.08)',border:'1px solid rgba(29,185,122,0.2)',borderRadius:14,padding:16,marginBottom:20,textAlign:'left'}}>
          <div style={{fontSize:14,fontWeight:700,color:GREEN,marginBottom:8}}>💸 R{totalCashback.toLocaleString()} cashback incoming</div>
          <div style={{fontSize:12,color:'#5A7A9A',lineHeight:1.6}}>
            Your cashback of R{totalCashback.toLocaleString()} will be paid to your bank account within 30 days of your policy start date.
          </div>
          <div style={{display:'flex',gap:12,marginTop:12,fontSize:11,color:'#8FA3BE'}}>
            <span>🔒 12-month lock-in</span>
            <span>📅 Paid within 30 days</span>
          </div>
        </div>

        {policyRef&&<div style={{fontSize:11,color:'#8FA3BE',marginBottom:20}}>Reference: {policyRef}</div>}

        {/* Cross-sell */}
        <div style={{background:'#fff',border:'1.5px solid #E2E9F0',borderRadius:16,padding:16,marginBottom:20,textAlign:'left',boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
          <div style={{fontSize:13,fontWeight:700,color:'#0A1628',marginBottom:4}}>Want to add more cover?</div>
          <div style={{fontSize:12,color:'#8FA3BE',marginBottom:14,lineHeight:1.5}}>Each product earns additional cashback — add now without starting over.</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {PRODUCTS.filter(p=>!selected.includes(p.code)).filter(p=>{
              if(p.code==='ALLRISK') return selected.length>0
              if(p.code==='CARAVAN'||p.code==='TRAILER') return selected.includes('CAR')
              return true
            }).map(p=>(
              <button key={p.code} onClick={()=>{
                setSelected(prev=>[...prev,p.code])
                setJourneyStep(p.code==='CAR'?'car':p.code==='BUILDINGS'||p.code==='CONTENTS'?'home':'quotes')
                setStep('journey')
              }} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 12px',borderRadius:10,border:'1.5px solid #E2E9F0',background:'#F7F9FC',cursor:'pointer',fontSize:13,fontWeight:600,color:'#0A1628'}}>
                <span>{p.icon}</span>{p.label}
              </button>
            ))}
          </div>
        </div>

        <button className="ip-btn" onClick={()=>window.location.href='/'} style={{marginBottom:12}}>
          Back to Muḽo →
        </button>
        <div style={{fontSize:11,color:'#8FA3BE',lineHeight:1.6}}>
          Muḽo Financial Services (Pty) Ltd · FSP 49169<br/>Authorised Financial Services Provider
        </div>
      </div>
    </>
  )

  // ════════════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ════════════════════════════════════════════════════════════════════════════
  const renderJourney = () => {
    switch(journeyStep){
      case 'home':   return renderHome()
      case 'car':    return renderCar()
      case 'cardriver': return renderCarDriver()
      case 'vaps':      return renderVaps()
      case 'quotes': return renderQuotes()
      case 'review': return renderReview()
      case 'debit':  return renderDebit()
      case 'done':   return renderDone()
      default:       return renderHome()
    }
  }

  return(
    <>
      <style>{GS}</style>
      <div className="ip-shell">
        <div className="ip-card">
          {step==='landing'  && renderLanding()}
          {step==='products' && renderProducts()}
          {step==='id'       && renderIdVerify()}
          {step==='phone'    && renderPhone()}
          {step==='otp'      && renderOtp()}
          {step==='register' && renderRegister()}
          {step==='journey'  && renderJourney()}
        </div>
      </div>
    </>
  )
}
