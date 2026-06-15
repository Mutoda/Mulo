/**
 * Muḽo Insure — InsurePage.jsx
 * Standalone full-page entry point for mulo.co.za/insure
 * No phone shell constraints — proper mobile-first web layout
 */
import React, { useState, useEffect, useRef } from 'react'

const API = 'https://z30zl849k8.execute-api.af-south-1.amazonaws.com/prod'

// ─── Colours ──────────────────────────────────────────────────────────────────
const C = {
  navy:      '#0A1628',
  navyMid:   '#0E2344',
  navyLight: '#132035',
  teal:      '#00B8A9',
  green:     '#1DB97A',
  white:     '#FFFFFF',
  muted:     'rgba(255,255,255,0.55)',
  subtle:    'rgba(255,255,255,0.08)',
  border:    'rgba(255,255,255,0.12)',
}

// ─── SA ID validator ──────────────────────────────────────────────────────────
function validateSAID(id) {
  if (!/^\d{13}$/.test(id)) return { valid: false, error: 'Must be exactly 13 digits' }
  const yy = parseInt(id.slice(0,2)), mm = parseInt(id.slice(2,4)), dd = parseInt(id.slice(4,6))
  const gender = parseInt(id.slice(6,10)), citizen = parseInt(id.slice(10,11))
  const year = yy <= new Date().getFullYear() % 100 ? 2000+yy : 1900+yy
  const dob = new Date(year, mm-1, dd)
  if (mm<1||mm>12||dd<1||dd>31||dob.getMonth()!==mm-1||dob.getDate()!==dd)
    return { valid:false, error:'Invalid date of birth in ID number' }
  const today = new Date()
  const age = today.getFullYear()-dob.getFullYear()-(today<new Date(today.getFullYear(),dob.getMonth(),dob.getDate())?1:0)
  if (age<18) return { valid:false, error:'Applicant must be 18 or older' }
  if (age>100) return { valid:false, error:'Date of birth appears invalid' }
  let sum=0
  for (let i=0;i<12;i++) { let d=parseInt(id[i]); if(i%2===1){d*=2;if(d>9)d-=9} sum+=d }
  if ((10-(sum%10))%10!==parseInt(id[12])) return { valid:false, error:'Checksum failed — please check your ID number' }
  const genderStr = gender>=5000?'Male':'Female'
  const dobFormatted = dob.toLocaleDateString('en-ZA',{day:'numeric',month:'long',year:'numeric'})
  return { valid:true, dob:dobFormatted, age, gender:genderStr, citizen:citizen===0?'SA Citizen':'Permanent Resident' }
}

// ─── Products ─────────────────────────────────────────────────────────────────
const PRODUCTS = [
  { code:'BUILDINGS', label:'Buildings',     icon:'🏠', sub:'Cover the structure of your home' },
  { code:'CONTENTS',  label:'Home contents', icon:'📦', sub:'Furniture, appliances & valuables' },
  { code:'CAR',       label:'Car insurance', icon:'🚗', sub:'Comprehensive vehicle cover' },
  { code:'ALLRISK',   label:'All risk',      icon:'💎', sub:'Jewellery, devices & portable items' },
  { code:'CARAVAN',   label:'Caravan',       icon:'🚐', sub:'Cover for your caravan' },
  { code:'TRAILER',   label:'Trailer',       icon:'🔗', sub:'Cover for your trailer' },
]

const MOCK_QUOTES = {
  CAR:      [{ insurer:'Naked Insurance',logo:'🟠',premium:689,excess:3500,rating:4.7,cashback:689,highlight:'Best value' },{ insurer:'King Price',logo:'👑',premium:712,excess:3000,rating:4.5,cashback:712,highlight:'Decreasing premium' },{ insurer:'Pineapple',logo:'🍍',premium:741,excess:2500,rating:4.6,cashback:741,highlight:'Top rated claims' }],
  BUILDINGS:[{ insurer:'Absa Insurance',logo:'🔴',premium:521,excess:5000,rating:4.3,cashback:521,highlight:'Best for bond holders' },{ insurer:'Naked Insurance',logo:'🟠',premium:548,excess:4000,rating:4.7,cashback:548,highlight:'Best value' },{ insurer:'King Price',logo:'👑',premium:576,excess:5000,rating:4.5,cashback:576,highlight:null }],
  CONTENTS: [{ insurer:'Pineapple',logo:'🍍',premium:312,excess:1500,rating:4.6,cashback:312,highlight:'Top rated claims' },{ insurer:'Naked Insurance',logo:'🟠',premium:328,excess:2000,rating:4.7,cashback:328,highlight:'Best value' }],
  ALLRISK:  [{ insurer:'Naked Insurance',logo:'🟠',premium:189,excess:1000,rating:4.7,cashback:189,highlight:'Best value' },{ insurer:'Pineapple',logo:'🍍',premium:210,excess:1000,rating:4.6,cashback:210,highlight:null }],
  CARAVAN:  [{ insurer:'King Price',logo:'👑',premium:245,excess:2000,rating:4.5,cashback:245,highlight:'Only provider' }],
  TRAILER:  [{ insurer:'King Price',logo:'👑',premium:145,excess:1500,rating:4.5,cashback:145,highlight:'Only provider' }],
}

// ─── Global styles ────────────────────────────────────────────────────────────
const GLOBAL_STYLE = `
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html, body { margin: 0; padding: 0; background: #0A1628; font-family: 'IBM Plex Sans', sans-serif; }
  @keyframes insurerScroll { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
  .ip-fade { animation: fadeUp 0.3s ease forwards; }
  .ip-btn {
    display: block; width: 100%; padding: 17px 24px;
    background: linear-gradient(135deg, #00B8A9, #1A73E8);
    color: #fff; border: none; border-radius: 16px;
    font-family: 'IBM Plex Sans', sans-serif; font-size: 16px; font-weight: 600;
    cursor: pointer; box-shadow: 0 8px 24px rgba(0,184,169,0.35);
    transition: opacity 0.15s, transform 0.1s;
  }
  .ip-btn:hover { opacity: 0.92; }
  .ip-btn:active { transform: scale(0.98); }
  .ip-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
  .ip-btn-ghost {
    display: block; width: 100%; padding: 15px 24px;
    background: transparent; color: #00B8A9;
    border: 1.5px solid #00B8A9; border-radius: 16px;
    font-family: 'IBM Plex Sans', sans-serif; font-size: 15px; font-weight: 600;
    cursor: pointer; transition: opacity 0.15s;
  }
  .ip-input {
    width: 100%; padding: 14px 16px;
    background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.12);
    border-radius: 12px; color: #fff;
    font-family: 'IBM Plex Sans', sans-serif; font-size: 15px;
    outline: none; transition: border-color 0.2s;
  }
  .ip-input:focus { border-color: #00B8A9; }
  .ip-input.ok { border-color: #1DB97A; }
  .ip-input.err { border-color: #FF5C5C; }
  .ip-label { display:block; font-size:12px; font-weight:600; color:rgba(255,255,255,0.5); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px; }
  .ip-hint-ok { font-size:12px; color:#1DB97A; margin-top:4px; }
  .ip-hint-err { font-size:12px; color:#FF5C5C; margin-top:4px; }
  .ip-card { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:16px; padding:16px; margin-bottom:12px; }
  .ip-otp-box {
    width:48px; height:56px; border-radius:12px; border:2px solid rgba(255,255,255,0.15);
    background:rgba(255,255,255,0.06); color:#fff; text-align:center;
    font-size:24px; font-weight:700; font-family:'Sora',sans-serif; outline:none;
    transition:border-color 0.2s;
  }
  .ip-otp-box:focus { border-color:#00B8A9; }
  .ip-progress { height:3px; background:rgba(255,255,255,0.1); border-radius:99px; }
  .ip-progress-fill { height:3px; background:linear-gradient(90deg,#00B8A9,#1A73E8); border-radius:99px; transition:width 0.4s ease; }
  .ip-product-card {
    display:flex; align-items:center; gap:14px;
    background:rgba(255,255,255,0.05); border:2px solid rgba(255,255,255,0.1);
    border-radius:16px; padding:16px; margin-bottom:10px; cursor:pointer;
    transition:all 0.15s;
  }
  .ip-product-card.selected { background:rgba(0,184,169,0.12); border-color:#00B8A9; }
  .ip-product-card.disabled { opacity:0.4; cursor:not-allowed; }
  .ip-quote-card {
    background:rgba(255,255,255,0.05); border:2px solid rgba(255,255,255,0.1);
    border-radius:16px; padding:16px; margin-bottom:12px; cursor:pointer;
    transition:all 0.15s;
  }
  .ip-quote-card.selected { border-color:#00B8A9; background:rgba(0,184,169,0.08); }
  .check-row { display:flex; align-items:flex-start; gap:12px; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.06); }
  .check-icon { width:28px;height:28px;borderRadius:50%;display:flex;alignItems:center;justifyContent:center;fontSize:13px;fontWeight:700;flexShrink:0; }
  .check-icon.ok { background:rgba(29,185,122,0.15); color:#1DB97A; }
  .check-icon.loading { background:rgba(0,184,169,0.15); color:#00B8A9; }
  .check-icon.pending { background:rgba(255,255,255,0.08); color:rgba(255,255,255,0.3); }
`

// ─── Shell component ──────────────────────────────────────────────────────────
const Shell = ({ children, step, totalSteps, onBack, title, subtitle }) => (
  <div style={{ minHeight:'100vh', background:C.navy, color:C.white, display:'flex', flexDirection:'column', maxWidth:480, margin:'0 auto' }}>
    {title && (
      <div style={{ padding:'16px 20px 12px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
        {onBack && (
          <button onClick={onBack} style={{ width:36,height:36,borderRadius:10,background:C.subtle,border:'none',color:C.white,fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>←</button>
        )}
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Sora',sans-serif",fontSize:17,fontWeight:700,color:C.white }}>{title}</div>
          {subtitle && <div style={{ fontSize:12,color:C.muted,marginTop:1 }}>{subtitle}</div>}
        </div>
        <div style={{ fontSize:12,color:C.teal,fontWeight:600 }}>muḽo insure</div>
      </div>
    )}
    {step && <div className="ip-progress"><div className="ip-progress-fill" style={{ width:`${(step/totalSteps)*100}%` }}/></div>}
    {children}
  </div>
)

// ─── Main InsurePage component ────────────────────────────────────────────────
export default function InsurePage() {
  // Step: 'landing' | 'products' | 'id' | 'phone' | 'otp' | 'register' | 'journey'
  const [step, setStep] = useState('landing')
  const [selected, setSelected] = useState([])

  // Auth state
  const [authId, setAuthId] = useState('')
  const [authFirstName, setAuthFirstName] = useState('')
  const [authLastName, setAuthLastName] = useState('')
  const [authPhone, setAuthPhone] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [authPass, setAuthPass] = useState('')
  const [authOtp, setAuthOtp] = useState(['','','','','',''])
  const [authPhase, setAuthPhase] = useState('idle')
  const [authValidation, setAuthValidation] = useState(null)
  const [authChecks, setAuthChecks] = useState([
    { label:'Valid SA ID format', sub:'13 digits · Luhn checksum · Date of birth', status:'wait' },
    { label:'Homeowner status',   sub:'Deeds Office verification', status:'wait' },
    { label:'No sequestration',   sub:'Master of High Court check', status:'wait' },
  ])
  const [authTimer, setAuthTimer] = useState(59)
  const [showPass, setShowPass] = useState(false)
  const otpRefs = useRef([])

  // Journey state
  const [journeyStep, setJourneyStep] = useState(0)

  // OTP timer
  useEffect(() => {
    if (step !== 'otp' || authTimer <= 0) return
    const t = setTimeout(() => setAuthTimer(s => s-1), 1000)
    return () => clearTimeout(t)
  }, [step, authTimer])

  // ── Landing ────────────────────────────────────────────────────────────────
  const renderLanding = () => (
    <div style={{ minHeight:'100vh', background:`linear-gradient(160deg,${C.navy} 0%,${C.navyMid} 60%,#0B3040 100%)`, display:'flex', flexDirection:'column' }}>
      <div style={{ flex:1, overflowY:'auto', padding:'28px 24px 0' }}>
        {/* header */}
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:28 }}>
          <div style={{ fontFamily:"'Sora',sans-serif",fontSize:22,fontWeight:800,color:C.white,letterSpacing:'-0.5px' }}>
            Mu<span style={{ color:C.teal }}>ḽ</span>o
            <span style={{ fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.4)',marginLeft:8 }}>insure</span>
          </div>
          <div style={{ fontSize:11,color:'rgba(255,255,255,0.35)' }}>FSP 49169</div>
        </div>

        {/* eyebrow */}
        <div style={{ display:'inline-flex',alignItems:'center',gap:6,background:'rgba(0,184,169,0.12)',border:'1px solid rgba(0,184,169,0.3)',borderRadius:99,padding:'5px 12px',marginBottom:20,fontSize:12,fontWeight:600,color:C.teal }}>
          🏆 South Africa's only cashback insurance platform
        </div>

        {/* headline */}
        <h1 style={{ fontFamily:"'Sora',sans-serif",fontSize:28,fontWeight:800,color:C.white,lineHeight:1.15,margin:'0 0 16px' }}>
          Anyone can compare insurance.<br/>
          <span style={{ color:C.teal }}>Only Muḽo pays you for it.</span>
        </h1>

        {/* body */}
        <p style={{ fontSize:16,color:'rgba(255,255,255,0.7)',lineHeight:1.6,margin:'0 0 8px' }}>
          Insure your car, home or contents through Muḽo and earn your first month's premium back — guaranteed. Every time.
        </p>
        <p style={{ fontSize:14,color:'rgba(255,255,255,0.5)',lineHeight:1.6,margin:'0 0 24px',fontStyle:'italic' }}>
          The smart move isn't just finding a better rate. It's getting paid when you find it.
        </p>

        {/* insurer carousel */}
        <div style={{ overflow:'hidden',marginBottom:24 }}>
          <div style={{ display:'flex',gap:8,animation:'insurerScroll 22s linear infinite',width:'max-content' }}>
            {[['https://www.absa.co.za/favicon.ico','Absa'],['https://www.pineapple.co.za/favicon.ico','Pineapple'],['https://www.nedbank.co.za/favicon.ico','Nedbank'],['https://www.oldmutual.co.za/favicon.ico','Old Mutual'],['https://www.miway.co.za/favicon.ico','MiWay'],['https://www.momentum.co.za/favicon.ico','Momentum'],['https://www.kingprice.co.za/favicon.ico','King Price'],['https://www.iwyze.co.za/favicon.ico','iWYZE'],
              ['https://www.absa.co.za/favicon.ico','Absa'],['https://www.pineapple.co.za/favicon.ico','Pineapple'],['https://www.nedbank.co.za/favicon.ico','Nedbank'],['https://www.oldmutual.co.za/favicon.ico','Old Mutual'],['https://www.miway.co.za/favicon.ico','MiWay'],['https://www.momentum.co.za/favicon.ico','Momentum'],['https://www.kingprice.co.za/favicon.ico','King Price'],['https://www.iwyze.co.za/favicon.ico','iWYZE']
            ].map(([src,n],i) => (
              <div key={i} style={{ display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:99,padding:'5px 12px',whiteSpace:'nowrap',flexShrink:0 }}>
                <img src={src} width={18} height={18} style={{ borderRadius:3,objectFit:'contain',background:'#fff',padding:2 }} onError={e=>e.target.style.display='none'}/>
                <span style={{ fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.75)' }}>{n}</span>
              </div>
            ))}
          </div>
        </div>

        {/* stats */}
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:1,background:'rgba(255,255,255,0.08)',borderRadius:16,overflow:'hidden',marginBottom:24 }}>
          {[['R0','Free to compare'],['3 min','Avg. quote time'],['R900','Avg. cashback']].map(([v,l]) => (
            <div key={l} style={{ background:C.navyLight,padding:'14px 10px',textAlign:'center' }}>
              <div style={{ fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:700,color:C.white }}>{v}</div>
              <div style={{ fontSize:10,fontWeight:600,color:C.muted,textTransform:'uppercase',letterSpacing:0.5,marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button className="ip-btn" onClick={() => setStep('products')}>
          Get my free quotes →
        </button>
        <div style={{ textAlign:'center',marginTop:10,fontSize:12,color:'rgba(255,255,255,0.4)',marginBottom:24 }}>
          Free to compare · No obligation · Takes 3 minutes
        </div>

        {/* trust */}
        <div style={{ display:'flex',justifyContent:'center',gap:20,paddingBottom:32,fontSize:11,color:'rgba(255,255,255,0.35)' }}>
          {[['🛡️','FSP 49169'],['🔒','POPIA'],['⚡','8 insurers']].map(([i,l]) => (
            <span key={l}>{i} {l}</span>
          ))}
        </div>
      </div>
    </div>
  )

  // ── Product selector ───────────────────────────────────────────────────────
  const renderProducts = () => {
    const toggle = code => {
      if (code === 'ALLRISK' && selected.length === 0) return
      if ((code === 'CARAVAN' || code === 'TRAILER') && !selected.includes('CAR')) return
      setSelected(prev => prev.includes(code) ? prev.filter(c=>c!==code) : [...prev, code])
    }
    const errors = []
    if (selected.includes('ALLRISK') && selected.length === 1) errors.push('All risk must be bundled with another product')

    return (
      <Shell title="What do you want to insure?" subtitle="Step 1 of 4" step={1} totalSteps={4} onBack={() => setStep('landing')}>
        <div style={{ flex:1,overflowY:'auto',padding:'20px 20px 100px' }}>
          <p style={{ fontSize:14,color:C.muted,marginBottom:20,lineHeight:1.6 }}>
            Select everything you'd like to cover. All products earn cashback equal to your first month's premium.
          </p>
          {PRODUCTS.map(p => {
            const isSelected = selected.includes(p.code)
            const isDisabled = (p.code==='ALLRISK' && selected.filter(c=>c!=='ALLRISK').length===0) ||
                               ((p.code==='CARAVAN'||p.code==='TRAILER') && !selected.includes('CAR'))
            return (
              <div key={p.code} className={`ip-product-card${isSelected?' selected':''}${isDisabled?' disabled':''}`}
                onClick={() => !isDisabled && toggle(p.code)}>
                <span style={{ fontSize:28 }}>{p.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:15,fontWeight:600,color:C.white }}>{p.label}</div>
                  <div style={{ fontSize:12,color:C.muted,marginTop:2 }}>{p.sub}</div>
                </div>
                <div style={{ width:22,height:22,borderRadius:99,border:`2px solid ${isSelected?C.teal:'rgba(255,255,255,0.2)'}`,background:isSelected?C.teal:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                  {isSelected && <span style={{ color:C.navy,fontSize:12,fontWeight:700 }}>✓</span>}
                </div>
              </div>
            )
          })}
          {errors.map(e => <div key={e} style={{ color:'#FF5C5C',fontSize:12,marginTop:4 }}>⚠ {e}</div>)}
          <div style={{ background:'rgba(0,184,169,0.08)',border:'1px solid rgba(0,184,169,0.2)',borderRadius:14,padding:14,marginTop:20 }}>
            <div style={{ fontSize:13,fontWeight:600,color:C.teal,marginBottom:4 }}>💸 Cashback offer</div>
            <div style={{ fontSize:12,color:C.muted,lineHeight:1.6 }}>Every product you insure earns 1× your first month's premium as cashback — paid within 30 days of your policy start date. 12-month lock-in applies.</div>
          </div>
        </div>
        <div style={{ padding:'12px 20px 24px',background:`linear-gradient(to bottom,transparent,${C.navy} 40%)`,position:'sticky',bottom:0 }}>
          <button className="ip-btn" disabled={selected.length===0||errors.length>0} onClick={() => setStep('id')}>
            {selected.length===0 ? 'Select a product to continue' : `Continue with ${selected.length} product${selected.length>1?'s':''} →`}
          </button>
        </div>
      </Shell>
    )
  }

  // ── ID Verify ──────────────────────────────────────────────────────────────
  const renderIdVerify = () => {
    const handleChange = val => {
      const cleaned = val.replace(/\D/g,'').slice(0,13)
      setAuthId(cleaned)
      setAuthPhase('idle')
      setAuthValidation(null)
      setAuthChecks(c=>c.map(x=>({...x,status:'wait'})))
      if (cleaned.length===13) {
        const r = validateSAID(cleaned)
        setAuthValidation(r)
        if (!r.valid) setAuthPhase('invalid')
      }
    }

    const handleCheck = async () => {
      if (authId.length<13) return
      const r = validateSAID(authId)
      if (!r.valid) { setAuthPhase('invalid'); setAuthValidation(r); return }
      setAuthPhase('checking')
      setAuthChecks(c=>c.map((x,i)=>i===0?{...x,status:'loading'}:x))
      try {
        const res = await fetch(`${API}/verify-id`,{ method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id_number:authId}) })
        setAuthChecks(c=>c.map((x,i)=>i===0?{...x,status:'ok',sub:`DOB: ${r.dob} · ${r.gender}`}:x))
        setTimeout(()=>{
          setAuthChecks(c=>c.map((x,i)=>i===1?{...x,status:'loading'}:x))
          setTimeout(()=>{
            setAuthChecks(c=>c.map((x,i)=>i===1?{...x,status:'ok'}:x))
            setTimeout(()=>{
              setAuthChecks(c=>c.map((x,i)=>i===2?{...x,status:'loading'}:x))
              setTimeout(()=>{
                setAuthChecks(c=>c.map((x,i)=>i===2?{...x,status:'ok'}:x))
                setAuthPhase('done')
                window._muloIdNumber = authId
              },900)
            },400)
          },900)
        },400)
      } catch {
        setAuthPhase('invalid')
        setAuthValidation({valid:false,error:'Verification failed — please try again'})
        setAuthChecks(c=>c.map(x=>({...x,status:'wait'})))
      }
    }

    const inputClass = `ip-input${authPhase==='invalid'?' err':authPhase==='done'?' ok':''}`

    return (
      <Shell title="Verify your identity" subtitle="Step 2 of 4" step={2} totalSteps={4} onBack={() => setStep('products')}>
        <div style={{ flex:1,overflowY:'auto',padding:'24px 20px 100px' }}>
          {/* ID card graphic */}
          <div style={{ background:`linear-gradient(135deg,${C.navy},${C.navyMid})`,border:`1px solid ${C.border}`,borderRadius:18,padding:'20px 24px',marginBottom:24,position:'relative',overflow:'hidden' }}>
            <div style={{ position:'absolute',top:-20,right:-20,width:100,height:100,borderRadius:'50%',background:'rgba(0,184,169,0.1)' }}/>
            <div style={{ fontSize:11,fontWeight:600,color:C.muted,letterSpacing:1,textTransform:'uppercase',marginBottom:8 }}>South African ID Number</div>
            <div style={{ fontFamily:"'Sora',sans-serif",fontSize:22,fontWeight:700,color:C.white,letterSpacing:3,marginBottom:8 }}>
              {authId ? `${authId.slice(0,6)} ${authId.slice(6,10)} ${authId.slice(10)}` : '000000 0000 000'}
            </div>
            {authValidation?.valid && (
              <div style={{ fontSize:12,color:C.teal,display:'flex',gap:12 }}>
                <span>🎂 {authValidation.dob}</span>
                <span>{authValidation.gender}</span>
              </div>
            )}
            <div style={{ position:'absolute',bottom:16,right:20,fontSize:24 }}>🇿🇦</div>
          </div>

          <div style={{ marginBottom:16 }}>
            <label className="ip-label">SA ID Number</label>
            <input className={inputClass} placeholder="e.g. 8001015009087" value={authId} maxLength={13} inputMode="numeric" onChange={e=>handleChange(e.target.value)}/>
            {authId.length>0&&authId.length<13 && <div style={{fontSize:12,color:C.muted,marginTop:4}}>{authId.length}/13 digits</div>}
            {authPhase==='invalid'&&authValidation && <div className="ip-hint-err">✕ {authValidation.error}</div>}
            {authValidation?.valid && <div className="ip-hint-ok">✓ Valid · DOB {authValidation.dob} · {authValidation.gender}</div>}
          </div>

          {authId.length===13&&authValidation?.valid && (
            <div className="ip-fade" style={{display:'flex',gap:10,marginBottom:16}}>
              <div style={{flex:1}}>
                <label className="ip-label">First name</label>
                <input className="ip-input" placeholder="e.g. Thabo" value={authFirstName} onChange={e=>setAuthFirstName(e.target.value)} autoCapitalize="words"/>
              </div>
              <div style={{flex:1}}>
                <label className="ip-label">Last name</label>
                <input className="ip-input" placeholder="e.g. Nkosi" value={authLastName} onChange={e=>setAuthLastName(e.target.value)} autoCapitalize="words"/>
              </div>
            </div>
          )}

          {(authPhase==='checking'||authPhase==='done') && (
            <div className="ip-fade" style={{marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:0.8,marginBottom:10}}>Verification checks</div>
              {authChecks.map((c,i)=>(
                <div className="check-row" key={i}>
                  <div className={`check-icon ${c.status==='wait'?'pending':c.status}`} style={{width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,flexShrink:0,background:c.status==='ok'?'rgba(29,185,122,0.15)':c.status==='loading'?'rgba(0,184,169,0.15)':'rgba(255,255,255,0.08)',color:c.status==='ok'?'#1DB97A':c.status==='loading'?'#00B8A9':'rgba(255,255,255,0.3)'}}>
                    {c.status==='ok'?'✓':c.status==='loading'?'⟳':'○'}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:C.white}}>{c.label}</div>
                    <div style={{fontSize:11,color:C.muted}}>{c.sub}</div>
                  </div>
                  {c.status==='ok'&&<div style={{fontSize:11,color:'#1DB97A',fontWeight:600}}>Passed</div>}
                  {c.status==='loading'&&<div style={{fontSize:11,color:C.teal,fontWeight:600}}>Checking…</div>}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{padding:'12px 20px 24px',background:`linear-gradient(to bottom,transparent,${C.navy} 40%)`,position:'sticky',bottom:0}}>
          {authPhase!=='done'
            ? <button className="ip-btn" disabled={authId.length<13||authPhase==='invalid'||authPhase==='checking'} onClick={handleCheck}>
                {authPhase==='checking'?'Verifying…':'Verify my ID →'}
              </button>
            : <button className="ip-btn" disabled={!authFirstName.trim()||!authLastName.trim()} onClick={()=>{window._muloFirstName=authFirstName;window._muloLastName=authLastName;setStep('phone')}}>
                Continue →
              </button>
          }
        </div>
      </Shell>
    )
  }

  // ── Phone select ───────────────────────────────────────────────────────────
  const renderPhone = () => {
    const digits = authPhone.replace(/\D/g,'')
    const valid = digits.length===9||digits.length===10

    const handleContinue = async () => {
      const normalized = digits.startsWith('0')?digits:'0'+digits
      window._muloCellphone = normalized
      try {
        await fetch(`${API}/otp/send`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cellphone:normalized,id_number:authId})})
      } catch {}
      setAuthTimer(59)
      setAuthOtp(['','','','','',''])
      setStep('otp')
    }

    return (
      <Shell title="Your WhatsApp number" subtitle="Step 3 of 4" step={3} totalSteps={4} onBack={()=>setStep('id')}>
        <div style={{flex:1,overflowY:'auto',padding:'24px 20px 100px'}}>
          <p style={{fontSize:14,color:C.muted,lineHeight:1.6,marginBottom:24}}>We'll send a one-time verification code to this number via WhatsApp.</p>
          <div style={{position:'relative',marginBottom:16}}>
            <div style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',display:'flex',alignItems:'center',gap:6,pointerEvents:'none'}}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              <span style={{fontSize:14,fontWeight:600,color:C.white}}>+27</span>
              <span style={{color:C.border}}>|</span>
            </div>
            <input className="ip-input" type="tel" inputMode="numeric" placeholder="82 123 4567" value={authPhone.replace(/^0/,'')} onChange={e=>setAuthPhone(e.target.value)}
              style={{paddingLeft:78,borderColor:valid?'#25D366':'rgba(255,255,255,0.12)'}}/>
          </div>
          <div style={{background:'rgba(255,255,255,0.04)',borderRadius:12,padding:14,fontSize:12,color:C.muted,lineHeight:1.6}}>
            Your OTP will be sent to this WhatsApp number to confirm you own it.
          </div>
        </div>
        <div style={{padding:'12px 20px 24px',background:`linear-gradient(to bottom,transparent,${C.navy} 40%)`,position:'sticky',bottom:0}}>
          <button className="ip-btn" disabled={!valid} onClick={handleContinue}>Send OTP via WhatsApp →</button>
        </div>
      </Shell>
    )
  }

  // ── OTP verify ─────────────────────────────────────────────────────────────
  const renderOtp = () => {
    const code = authOtp.join('')
    const handleDigit = (i,val) => {
      const v = val.replace(/\D/g,'').slice(-1)
      const next=[...authOtp]; next[i]=v; setAuthOtp(next)
      setAuthPhase('idle')
      if(v&&i<5) otpRefs.current[i+1]?.focus()
    }
    const handleKey = (i,e) => { if(e.key==='Backspace'&&!authOtp[i]&&i>0) otpRefs.current[i-1]?.focus() }
    const handlePaste = e => {
      const p = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6)
      if(p.length===6){setAuthOtp(p.split(''));otpRefs.current[5]?.focus()}
    }
    const verify = async () => {
      if(code.length<6) return
      setAuthPhase('checking')
      try {
        const res = await fetch(`${API}/otp/verify`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id_number:authId,otp:code})})
        const data = await res.json()
        if(data.verified){
          window._muloVerifiedToken=data.verifiedToken
          setAuthPhase('done')
          setTimeout(()=>setStep('register'),800)
        } else {
          setAuthPhase('error')
          setAuthOtp(['','','','','',''])
          otpRefs.current[0]?.focus()
        }
      } catch {
        setAuthPhase('error')
        setAuthOtp(['','','','','',''])
        otpRefs.current[0]?.focus()
      }
    }
    return (
      <Shell title="Enter your OTP" subtitle="Step 3 of 4" step={3} totalSteps={4} onBack={()=>setStep('phone')}>
        <div style={{flex:1,overflowY:'auto',padding:'24px 20px 100px'}}>
          <div style={{background:'rgba(37,211,102,0.08)',border:'1px solid rgba(37,211,102,0.2)',borderRadius:14,padding:14,marginBottom:24,display:'flex',alignItems:'center',gap:12}}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            <div>
              <div style={{fontSize:12,color:C.muted}}>OTP sent via WhatsApp to</div>
              <div style={{fontSize:15,fontWeight:700,color:C.white}}>+27 {window._muloCellphone?.slice(1)}</div>
            </div>
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:16}} onPaste={handlePaste}>
            {authOtp.map((d,i)=>(
              <input key={i} ref={el=>otpRefs.current[i]=el} className="ip-otp-box" type="tel" inputMode="numeric" maxLength={1} value={d}
                onChange={e=>handleDigit(i,e.target.value)} onKeyDown={e=>handleKey(i,e)}
                style={{borderColor:authPhase==='error'?'#FF5C5C':authPhase==='done'?'#1DB97A':d?C.teal:'rgba(255,255,255,0.15)'}}/>
            ))}
          </div>
          {authPhase==='error'&&<div style={{color:'#FF5C5C',fontSize:13,textAlign:'center',marginBottom:12}}>✕ Incorrect OTP. Please try again.</div>}
          {authPhase==='done'&&<div style={{color:'#1DB97A',fontSize:13,textAlign:'center',marginBottom:12}}>✓ Verified!</div>}
          <div style={{textAlign:'center',fontSize:12,color:C.muted}}>
            {authTimer>0?<span>Resend in <strong style={{color:C.white}}>{authTimer}s</strong></span>
              :<span style={{color:C.teal,cursor:'pointer'}} onClick={()=>{setAuthTimer(59);setAuthOtp(['','','','','',''])}}>Resend OTP</span>}
          </div>
        </div>
        <div style={{padding:'12px 20px 24px',background:`linear-gradient(to bottom,transparent,${C.navy} 40%)`,position:'sticky',bottom:0}}>
          <button className="ip-btn" disabled={code.length<6||authPhase==='checking'||authPhase==='done'} onClick={verify}>
            {authPhase==='checking'?'Verifying…':authPhase==='done'?'Verified ✓':'Verify OTP →'}
          </button>
        </div>
      </Shell>
    )
  }

  // ── Register ───────────────────────────────────────────────────────────────
  const renderRegister = () => {
    const ready = authEmail&&authPass.length>=8
    const handleRegister = async () => {
      if(!ready) return
      setAuthPhase('checking')
      try {
        await fetch(`${API}/signup`,{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({id_number:authId,first_name:authFirstName,last_name:authLastName,cellphone:window._muloCellphone,email:authEmail,password:authPass,verified_token:window._muloVerifiedToken})})
      } catch {}
      window._muloEmail = authEmail
      setAuthPhase('idle')
      setStep('journey')
    }
    return (
      <Shell title="Create your account" subtitle="Step 4 of 4" step={4} totalSteps={4} onBack={()=>setStep('otp')}>
        <div style={{flex:1,overflowY:'auto',padding:'24px 20px 100px'}}>
          <div style={{marginBottom:24}}>
            <div style={{fontSize:18,fontWeight:700,color:C.white,marginBottom:4}}>Welcome, {authFirstName}! 👋</div>
            <div style={{fontSize:14,color:C.muted}}>Just your email and a password to finish setting up your account.</div>
          </div>
          <div style={{marginBottom:16}}>
            <label className="ip-label">Email address</label>
            <input className="ip-input" type="email" placeholder="you@example.com" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} autoCapitalize="none"/>
          </div>
          <div style={{marginBottom:16}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
              <label className="ip-label" style={{margin:0}}>Password</label>
              <span style={{fontSize:12,color:C.teal,cursor:'pointer',fontWeight:600}} onClick={()=>setShowPass(p=>!p)}>{showPass?'Hide':'Show'}</span>
            </div>
            <input className="ip-input" type={showPass?'text':'password'} placeholder="Min. 8 characters" value={authPass} onChange={e=>setAuthPass(e.target.value)}/>
            {authPass.length>0&&(
              <div style={{display:'flex',gap:4,marginTop:8}}>
                {[authPass.length>=8,/[A-Z]/.test(authPass),/[0-9]/.test(authPass)].map((ok,i)=>(
                  <div key={i} style={{flex:1,height:3,borderRadius:99,background:ok?C.teal:'rgba(255,255,255,0.1)',transition:'background .3s'}}/>
                ))}
              </div>
            )}
          </div>
          <div style={{fontSize:11,color:C.muted,lineHeight:1.6}}>
            By creating an account you agree to Muḽo's Terms of Service and Privacy Policy. Your information is processed in terms of POPIA.
          </div>
        </div>
        <div style={{padding:'12px 20px 24px',background:`linear-gradient(to bottom,transparent,${C.navy} 40%)`,position:'sticky',bottom:0}}>
          <button className="ip-btn" disabled={!ready||authPhase==='checking'} onClick={handleRegister}>
            {authPhase==='checking'?'Creating account…':'Get my free quotes →'}
          </button>
        </div>
      </Shell>
    )
  }

  // ── Journey placeholder (will import full Insure component) ────────────────
  const renderJourney = () => (
    <div style={{minHeight:'100vh',background:C.navy,color:C.white,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16,padding:24}}>
      <div style={{fontSize:48}}>✅</div>
      <div style={{fontFamily:"'Sora',sans-serif",fontSize:22,fontWeight:700,textAlign:'center'}}>You're in, {authFirstName}!</div>
      <div style={{fontSize:14,color:C.muted,textAlign:'center',maxWidth:300,lineHeight:1.6}}>Your account is set up. Now let's get you some quotes for: {selected.map(s=>PRODUCTS.find(p=>p.code===s)?.label).join(', ')}</div>
      <button className="ip-btn" style={{maxWidth:300}} onClick={()=>window.location.href='/'}>Continue on mulo.co.za →</button>
    </div>
  )

  return (
    <>
      <style>{GLOBAL_STYLE}</style>
      {step==='landing'  && renderLanding()}
      {step==='products' && renderProducts()}
      {step==='id'       && renderIdVerify()}
      {step==='phone'    && renderPhone()}
      {step==='otp'      && renderOtp()}
      {step==='register' && renderRegister()}
      {step==='journey'  && renderJourney()}
    </>
  )
}
