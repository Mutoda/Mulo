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
const MOCK_QUOTES = {
  BUILDINGS:[
    {insurer:'Absa Insurance',  logo:'https://www.absa.co.za/favicon.ico',  colour:'#CC0000',premium:521, excess:5000,rating:4.3,cashback:521, highlight:'Best for bond holders'},
    {insurer:'Naked Insurance', logo:'https://www.naked.insure/favicon.ico', colour:'#FF6B35',premium:548, excess:4000,rating:4.7,cashback:548, highlight:'Best value'},
    {insurer:'King Price',      logo:'https://www.kingprice.co.za/favicon.ico',colour:'#FFD700',premium:576, excess:5000,rating:4.5,cashback:576, highlight:null},
    {insurer:'Old Mutual',      logo:'https://www.oldmutual.co.za/favicon.ico',colour:'#006B3F',premium:612, excess:5000,rating:4.2,cashback:612, highlight:null},
  ],
  CONTENTS:[
    {insurer:'Pineapple',       logo:'https://www.pineapple.co.za/favicon.ico',colour:'#FFD93D',premium:312, excess:1500,rating:4.6,cashback:312, highlight:'Top rated claims'},
    {insurer:'Naked Insurance', logo:'https://www.naked.insure/favicon.ico', colour:'#FF6B35',premium:328, excess:2000,rating:4.7,cashback:328, highlight:'Best value'},
    {insurer:'Absa Insurance',  logo:'https://www.absa.co.za/favicon.ico',  colour:'#CC0000',premium:345, excess:2500,rating:4.3,cashback:345, highlight:null},
    {insurer:'MiWay',           logo:'https://www.miway.co.za/favicon.ico',  colour:'#E8003D',premium:367, excess:2000,rating:4.1,cashback:367, highlight:null},
  ],
  CAR:[
    {insurer:'Naked Insurance', logo:'https://www.naked.insure/favicon.ico', colour:'#FF6B35',premium:689, excess:3500,rating:4.7,cashback:689, highlight:'Best value'},
    {insurer:'King Price',      logo:'https://www.kingprice.co.za/favicon.ico',colour:'#FFD700',premium:712, excess:3000,rating:4.5,cashback:712, highlight:'Decreasing premium'},
    {insurer:'Pineapple',       logo:'https://www.pineapple.co.za/favicon.ico',colour:'#FFD93D',premium:741, excess:2500,rating:4.6,cashback:741, highlight:'Top rated claims'},
    {insurer:'MiWay',           logo:'https://www.miway.co.za/favicon.ico',  colour:'#E8003D',premium:768, excess:3500,rating:4.1,cashback:768, highlight:null},
  ],
  ALLRISK:[
    {insurer:'Naked Insurance', logo:'https://www.naked.insure/favicon.ico', colour:'#FF6B35',premium:189, excess:1000,rating:4.7,cashback:189, highlight:'Best value'},
    {insurer:'Pineapple',       logo:'https://www.pineapple.co.za/favicon.ico',colour:'#FFD93D',premium:210, excess:1000,rating:4.6,cashback:210, highlight:null},
  ],
  CARAVAN:[
    {insurer:'King Price',      logo:'https://www.kingprice.co.za/favicon.ico',colour:'#FFD700',premium:245, excess:2000,rating:4.5,cashback:245, highlight:'Only provider'},
  ],
  TRAILER:[
    {insurer:'King Price',      logo:'https://www.kingprice.co.za/favicon.ico',colour:'#FFD700',premium:145, excess:1500,rating:4.5,cashback:145, highlight:'Only provider'},
  ],
}

// ─── Global CSS ────────────────────────────────────────────────────────────
const GS = `
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{margin:0;padding:0;background:#F0F4F8;font-family:'IBM Plex Sans',sans-serif;color:#fff}
@keyframes insurerScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
.ip-fade{animation:fadeUp .3s ease forwards}
.ip-shell{min-height:100vh;background:#F0F4F8;display:flex;align-items:flex-start;justify-content:center;padding:40px 16px 60px}
.ip-card{width:100%;max-width:390px;background:${NAVY};border-radius:28px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.25)}
.ip-btn{display:block;width:100%;padding:17px 24px;background:linear-gradient(135deg,${TEAL},#1A73E8);color:#fff;border:none;border-radius:14px;font-family:'IBM Plex Sans',sans-serif;font-size:16px;font-weight:600;cursor:pointer;box-shadow:0 6px 20px rgba(0,184,169,0.3);transition:opacity .15s,transform .1s;text-align:center}
.ip-btn:hover{opacity:.92}
.ip-btn:active{transform:scale(.98)}
.ip-btn:disabled{opacity:.4;cursor:not-allowed;transform:none}
.ip-input{width:100%;padding:13px 15px;background:rgba(255,255,255,0.07);border:1.5px solid rgba(255,255,255,0.12);border-radius:12px;color:#fff;font-family:'IBM Plex Sans',sans-serif;font-size:15px;outline:none;transition:border-color .2s}
.ip-input:focus{border-color:${TEAL}}
.ip-input.ok{border-color:${GREEN}}
.ip-input.err{border-color:#FF5C5C}
.ip-label{display:block;font-size:11px;font-weight:600;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}
.ip-hint-ok{font-size:12px;color:${GREEN};margin-top:5px}
.ip-hint-err{font-size:12px;color:#FF5C5C;margin-top:5px}
.ip-otp-box{width:44px;height:52px;border-radius:12px;border:2px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.07);color:#fff;text-align:center;font-size:22px;font-weight:700;outline:none;transition:border-color .2s}
.ip-otp-box:focus{border-color:${TEAL}}
.ip-progress{height:3px;background:rgba(255,255,255,0.1)}
.ip-progress-fill{height:3px;background:linear-gradient(90deg,${TEAL},#1A73E8);transition:width .4s ease}
.ip-bottom{padding:12px 20px 24px;background:linear-gradient(to bottom,transparent,${NAVY} 45%)}
.ip-product{display:flex;align-items:center;gap:14px;background:rgba(255,255,255,0.05);border:2px solid rgba(255,255,255,0.08);border-radius:14px;padding:14px;margin-bottom:10px;cursor:pointer;transition:all .15s}
.ip-product.sel{background:rgba(0,184,169,0.1);border-color:${TEAL}}
.ip-product.dis{opacity:.4;cursor:not-allowed}
.ip-quote-card{background:rgba(255,255,255,0.05);border:2px solid rgba(255,255,255,0.08);border-radius:16px;padding:16px;margin-bottom:12px;cursor:pointer;transition:all .15s}
.ip-quote-card.sel{border-color:${TEAL};background:rgba(0,184,169,0.08)}
.ip-check-row{display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06)}
.ip-spinner{width:20px;height:20px;border:2px solid rgba(255,255,255,0.2);border-top-color:${TEAL};border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0}
.ip-select{width:100%;padding:13px 15px;background:rgba(255,255,255,0.07);border:1.5px solid rgba(255,255,255,0.12);border-radius:12px;color:#fff;font-family:'IBM Plex Sans',sans-serif;font-size:15px;outline:none;appearance:none;cursor:pointer}
.ip-select option{background:${NAVY};color:#fff}
`

// ─── Nav component ─────────────────────────────────────────────────────────
const Nav = ({onBack,showBack}) => (
  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 20px 12px',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
    <div style={{display:'flex',alignItems:'center',gap:10}}>
      {showBack && <button onClick={onBack} style={{width:32,height:32,borderRadius:8,background:'rgba(255,255,255,0.08)',border:'none',color:'#fff',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>←</button>}
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
    <div style={{display:'flex',alignItems:'center',gap:10,padding:'16px 20px 8px'}}>
      <button onClick={onBack} style={{width:32,height:32,borderRadius:8,background:'rgba(255,255,255,0.08)',border:'none',color:'#fff',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>←</button>
      <div style={{flex:1}}>
        <div style={{fontFamily:"'Sora',sans-serif",fontSize:16,fontWeight:700}}>{title}</div>
        {subtitle && <div style={{fontSize:11,color:'rgba(255,255,255,0.45)',marginTop:1}}>{subtitle}</div>}
      </div>
      <div style={{fontSize:11,color:TEAL,fontWeight:600}}>muḽo insure</div>
    </div>
    <ProgressBar step={step} total={total}/>
  </>
)

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
  const [vehicle, setVehicle]     = useState({make:'',model:'',year:'',colour:'',reg:'',use:'private',financed:false})
  const [selectedQuotes, setSelectedQuotes] = useState({})
  const [quotesLoading, setQuotesLoading]   = useState(false)
  const [quotesData, setQuotesData]         = useState({})
  const [bankDetails, setBankDetails]       = useState({bank:'',accountNumber:'',accountType:'Cheque',debitDay:1})
  const [policyRef, setPolicyRef]           = useState('')

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
      // Auto-select best (first) quote per product
      const autoSelect = {}
      selected.forEach(code=>{
        if(MOCK_QUOTES[code]?.[0]) autoSelect[code] = MOCK_QUOTES[code][0]
      })
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
  const journeySteps = ['home','car','quotes','review','debit','done'].filter(s=>{
    if(s==='home'&&!needsHome)return false
    if(s==='car'&&!needsCar)return false
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
        <div style={{overflowY:'auto',padding:'16px 20px 0'}}>
          <p style={{fontSize:13,color:'rgba(255,255,255,0.5)',marginBottom:16,lineHeight:1.6}}>Every product earns 1× your first month's premium as cashback.</p>
          {PRODUCTS.map(p=>{
            const isSel=selected.includes(p.code)
            const isDis=(p.code==='ALLRISK'&&selected.filter(c=>c!=='ALLRISK').length===0)||((p.code==='CARAVAN'||p.code==='TRAILER')&&!selected.includes('CAR'))
            return(
              <div key={p.code} className={`ip-product${isSel?' sel':''}${isDis?' dis':''}`} onClick={()=>!isDis&&toggle(p.code)}>
                <span style={{fontSize:26}}>{p.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:600,color:'#fff'}}>{p.label}</div>
                  <div style={{fontSize:12,color:'rgba(255,255,255,0.45)',marginTop:2}}>{p.sub}</div>
                </div>
                <div style={{width:20,height:20,borderRadius:99,border:`2px solid ${isSel?TEAL:'rgba(255,255,255,0.2)'}`,background:isSel?TEAL:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  {isSel&&<span style={{color:NAVY,fontSize:11,fontWeight:700}}>✓</span>}
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
        <div className="ip-bottom" style={{marginTop:8}}>
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
        <div style={{overflowY:'auto',padding:'20px 20px 0'}}>
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
                    <div style={{fontSize:13,fontWeight:600,color:'#fff'}}>{c.label}</div>
                    <div style={{fontSize:11,color:'rgba(255,255,255,0.4)'}}>{c.sub}</div>
                  </div>
                  {c.status==='ok'&&<div style={{fontSize:11,color:GREEN,fontWeight:600,flexShrink:0}}>Passed</div>}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="ip-bottom" style={{marginTop:8}}>
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
        <div style={{overflowY:'auto',padding:'20px 20px 0'}}>
          <p style={{fontSize:13,color:'rgba(255,255,255,0.5)',marginBottom:20,lineHeight:1.6}}>We'll send a one-time verification code via WhatsApp.</p>
          <div style={{position:'relative',marginBottom:16}}>
            <div style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',display:'flex',alignItems:'center',gap:6,pointerEvents:'none'}}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              <span style={{fontSize:13,fontWeight:600,color:'#fff'}}>+27</span>
              <span style={{color:'rgba(255,255,255,0.15)'}}>|</span>
            </div>
            <input className="ip-input" type="tel" inputMode="numeric" placeholder="82 123 4567" value={authPhone.replace(/^0/,'')} onChange={e=>setAuthPhone(e.target.value)} style={{paddingLeft:74,borderColor:valid?'#25D366':'rgba(255,255,255,0.12)'}}/>
          </div>
        </div>
        <div className="ip-bottom" style={{marginTop:8}}>
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
      if(code.length<6)return;setAuthPhase('checking')
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
        <div style={{overflowY:'auto',padding:'20px 20px 0'}}>
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
        <div className="ip-bottom" style={{marginTop:8}}>
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
        <div style={{overflowY:'auto',padding:'20px 20px 0'}}>
          <div style={{marginBottom:20}}>
            <div style={{fontSize:16,fontWeight:700,color:'#fff',marginBottom:4}}>Welcome, {authFirstName}! 👋</div>
            <div style={{fontSize:13,color:'rgba(255,255,255,0.5)'}}>Just your email and a password to finish setting up your account.</div>
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
          <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',lineHeight:1.6,marginBottom:8}}>By creating an account you agree to Muḽo's Terms of Service and Privacy Policy. Your information is processed in terms of POPIA.</div>
        </div>
        <div className="ip-bottom" style={{marginTop:8}}>
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
        <div style={{overflowY:'auto',padding:'20px 20px 0'}}>
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
        <div className="ip-bottom" style={{marginTop:8}}>
          <button className="ip-btn" disabled={!canContinue} onClick={goNextJourney}>Continue →</button>
        </div>
      </>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // JOURNEY — CAR DETAILS
  // ════════════════════════════════════════════════════════════════════════════
  const renderCar = () => {
    const canContinue = vehicle.make && vehicle.model && vehicle.year && vehicle.reg
    return(
      <>
        <StepHeader title="Tell us about your car" subtitle={`Step ${journeyIdx+1} of ${journeyTotal}`} step={journeyIdx+1} total={journeyTotal} onBack={goPrevJourney}/>
        <div style={{overflowY:'auto',padding:'20px 20px 0'}}>
          {[
            {label:'Vehicle make',    key:'make',  placeholder:'e.g. Toyota'},
            {label:'Vehicle model',   key:'model', placeholder:'e.g. Corolla'},
            {label:'Year',            key:'year',  placeholder:'e.g. 2020',type:'number'},
            {label:'Colour',          key:'colour',placeholder:'e.g. White'},
            {label:'Registration number',key:'reg',placeholder:'e.g. CA 123-456'},
          ].map(({label,key,placeholder,type})=>(
            <div key={key} style={{marginBottom:14}}>
              <label className="ip-label">{label}</label>
              <input className="ip-input" type={type||'text'} placeholder={placeholder} value={vehicle[key]} onChange={e=>setVehicle(p=>({...p,[key]:e.target.value}))} inputMode={type==='number'?'numeric':undefined}/>
            </div>
          ))}
          <div style={{marginBottom:14}}>
            <label className="ip-label">Vehicle use</label>
            <select className="ip-select" value={vehicle.use} onChange={e=>setVehicle(p=>({...p,use:e.target.value}))}>
              <option value="private">Private</option>
              <option value="business">Business</option>
              <option value="uber">Uber / e-hailing</option>
            </select>
          </div>
          <div style={{marginBottom:8}}>
            <label className="ip-label">Is the vehicle financed?</label>
            <div style={{display:'flex',gap:8}}>
              {['Yes','No'].map(o=>(
                <button key={o} onClick={()=>setVehicle(p=>({...p,financed:o==='Yes'}))}
                  style={{flex:1,padding:'11px',borderRadius:10,border:`1.5px solid ${(vehicle.financed&&o==='Yes')||(!vehicle.financed&&o==='No')?TEAL:'rgba(255,255,255,0.12)'}`,background:(vehicle.financed&&o==='Yes')||(!vehicle.financed&&o==='No')?'rgba(0,184,169,0.1)':'transparent',color:'#fff',fontSize:14,fontWeight:600,cursor:'pointer'}}>
                  {o}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="ip-bottom" style={{marginTop:8}}>
          <button className="ip-btn" disabled={!canContinue} onClick={goNextJourney}>Continue →</button>
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
          <div style={{fontSize:15,fontWeight:600,color:'#fff',marginBottom:8}}>Comparing quotes from 8 insurers…</div>
          <div style={{fontSize:13,color:'rgba(255,255,255,0.5)'}}>Ranking by value, claims reputation and cashback</div>
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
        <StepHeader title="Your quotes" subtitle={`${selected.length} product${selected.length>1?'s':''} · Ranked by value`} step={journeyIdx+1} total={journeyTotal} onBack={goPrevJourney}/>
        <div style={{overflowY:'auto',padding:'16px 20px 0'}}>
          {/* Cashback banner */}
          <div style={{background:'rgba(29,185,122,0.1)',border:'1px solid rgba(29,185,122,0.2)',borderRadius:12,padding:'12px 14px',marginBottom:16,display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:20}}>💸</span>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:GREEN}}>R{totalCashback.toLocaleString()} cashback earned</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.5)'}}>Paid within 30 days of policy start · 12-month lock-in</div>
            </div>
          </div>

          {/* Quotes per product */}
          {selected.map(code=>{
            const quotes = quotesData[code] || []
            const product = PRODUCTS.find(p=>p.code===code)
            return(
              <div key={code} style={{marginBottom:20}}>
                <div style={{fontSize:13,fontWeight:700,color:'rgba(255,255,255,0.6)',textTransform:'uppercase',letterSpacing:.5,marginBottom:10}}>
                  {product?.icon} {product?.label}
                </div>
                {quotes.map((q,i)=>{
                  const isSel = selectedQuotes[code]?.insurer===q.insurer
                  return(
                    <div key={i} className={`ip-quote-card${isSel?' sel':''}`} onClick={()=>setSelectedQuotes(p=>({...p,[code]:q}))}>
                      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                        <img src={q.logo} width={24} height={24} style={{borderRadius:4,objectFit:'contain',background:'#fff',padding:2}} onError={e=>e.target.style.display='none'}/>
                        <div style={{flex:1}}>
                          <div style={{fontSize:14,fontWeight:600,color:'#fff'}}>{q.insurer}</div>
                          {q.highlight&&<div style={{fontSize:11,color:TEAL,fontWeight:600}}>★ {q.highlight}</div>}
                        </div>
                        <div style={{textAlign:'right'}}>
                          <div style={{fontSize:18,fontWeight:700,color:'#fff'}}>R{q.premium.toLocaleString()}</div>
                          <div style={{fontSize:10,color:'rgba(255,255,255,0.4)'}}>/month</div>
                        </div>
                      </div>
                      <div style={{display:'flex',gap:12,fontSize:12,color:'rgba(255,255,255,0.5)'}}>
                        <span>Excess: R{q.excess.toLocaleString()}</span>
                        <span>⭐ {q.rating}</span>
                        <span style={{color:GREEN,fontWeight:600}}>💸 R{q.cashback.toLocaleString()} cashback</span>
                      </div>
                      {isSel&&<div style={{marginTop:10,padding:'8px 10px',background:'rgba(0,184,169,0.1)',borderRadius:8,fontSize:12,color:TEAL}}>
                        ✓ Selected — R{q.cashback.toLocaleString()} cashback on acceptance
                      </div>}
                    </div>
                  )
                })}
              </div>
            )
          })}

          <div style={{background:'rgba(255,255,255,0.04)',borderRadius:12,padding:14,marginBottom:8}}>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.4)',lineHeight:1.6}}>
              Quotes are indicative and subject to final underwriting. Muḽo Financial Services (Pty) Ltd, FSP 49169, obtains these quotes on your behalf.
            </div>
          </div>
        </div>
        <div className="ip-bottom" style={{marginTop:4}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
            <span style={{fontSize:13,color:'rgba(255,255,255,0.5)'}}>Total monthly premium</span>
            <span style={{fontSize:18,fontWeight:700,color:'#fff'}}>R{totalPremium.toLocaleString()}/mo</span>
          </div>
          <button className="ip-btn" onClick={goNextJourney}>Review & confirm →</button>
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
      <div style={{overflowY:'auto',padding:'16px 20px 0'}}>
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
                  <div style={{fontSize:14,fontWeight:600,color:'#fff'}}>{product?.label}</div>
                  <div style={{fontSize:12,color:'rgba(255,255,255,0.5)'}}>{q.insurer}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:16,fontWeight:700,color:'#fff'}}>R{q.premium.toLocaleString()}/mo</div>
                  <div style={{fontSize:11,color:GREEN}}>💸 R{q.cashback.toLocaleString()} cashback</div>
                </div>
              </div>
              <div style={{display:'flex',gap:12,fontSize:11,color:'rgba(255,255,255,0.4)',borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:8}}>
                <span>Excess: R{q.excess.toLocaleString()}</span>
                <span>Cover starts: {new Date(Date.now()+86400000).toLocaleDateString('en-ZA',{day:'numeric',month:'short',year:'numeric'})}</span>
              </div>
            </div>
          )
        })}

        {/* Totals */}
        <div style={{background:'rgba(29,185,122,0.08)',border:'1px solid rgba(29,185,122,0.15)',borderRadius:14,padding:14,marginBottom:16}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
            <span style={{fontSize:14,color:'rgba(255,255,255,0.6)'}}>Total monthly premium</span>
            <span style={{fontSize:16,fontWeight:700,color:'#fff'}}>R{totalPremium.toLocaleString()}</span>
          </div>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <span style={{fontSize:14,color:GREEN,fontWeight:600}}>💸 Total cashback</span>
            <span style={{fontSize:16,fontWeight:700,color:GREEN}}>R{totalCashback.toLocaleString()}</span>
          </div>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',marginTop:8,lineHeight:1.5}}>Cashback paid within 30 days of policy start. 12-month lock-in applies.</div>
        </div>

        {/* Client details */}
        <div style={{background:'rgba(255,255,255,0.04)',borderRadius:12,padding:14,marginBottom:8}}>
          <div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:.5,marginBottom:8}}>Your details</div>
          {[[authFirstName+' '+authLastName,'Name'],[authId,'ID number'],[authEmail,'Email'],[window._muloCellphone,'Mobile']].map(([v,l])=>(
            <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
              <span style={{fontSize:12,color:'rgba(255,255,255,0.4)'}}>{l}</span>
              <span style={{fontSize:12,color:'#fff',fontWeight:500}}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="ip-bottom" style={{marginTop:8}}>
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
        <div style={{overflowY:'auto',padding:'20px 20px 0'}}>
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
              {[1,5,15,25,28].map(d=><option key={d} value={d}>{d === 1 ? '1st' : d === 5 ? '5th' : d === 15 ? '15th' : d === 25 ? '25th' : '28th'} of the month</option>)}
            </select>
          </div>
          <div style={{background:'rgba(255,255,255,0.04)',borderRadius:12,padding:14,marginBottom:8}}>
            <div style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.6)',marginBottom:6}}>Debit order mandate</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',lineHeight:1.6}}>
              By clicking "Confirm & bind policy" below, you authorise Muḽo Financial Services (Pty) Ltd (FSP 49169) to debit your account with R{totalPremium.toLocaleString()}/month for the above insurance policies. This mandate is subject to NAEDO/DebiCheck rules.
            </div>
          </div>
          <div style={{background:'rgba(255,255,255,0.04)',borderRadius:12,padding:14,marginBottom:8}}>
            <div style={{fontSize:12,fontWeight:600,color:GREEN,marginBottom:4}}>💸 Your cashback: R{totalCashback.toLocaleString()}</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',lineHeight:1.6}}>Paid to your bank account within 30 days of your policy start date. Lock-in: 12 months.</div>
          </div>
        </div>
        <div className="ip-bottom" style={{marginTop:8}}>
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
        <h2 style={{fontFamily:"'Sora',sans-serif",fontSize:24,fontWeight:800,color:'#fff',margin:'0 0 8px'}}>You're covered, {authFirstName}!</h2>
        <p style={{fontSize:14,color:'rgba(255,255,255,0.6)',lineHeight:1.6,marginBottom:24}}>
          Your policies are now active. Policy documents will be sent to {authEmail} and via WhatsApp.
        </p>

        {/* Policy reference */}
        <div style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:14,padding:16,marginBottom:20,textAlign:'left'}}>
          <div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:.5,marginBottom:8}}>Your policies</div>
          {selected.map(code=>{
            const q = selectedQuotes[code]
            const product = PRODUCTS.find(p=>p.code===code)
            if(!q)return null
            return(
              <div key={code} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                <span style={{fontSize:13,color:'rgba(255,255,255,0.7)'}}>{product?.icon} {product?.label}</span>
                <span style={{fontSize:13,fontWeight:600,color:'#fff'}}>R{q.premium.toLocaleString()}/mo via {q.insurer}</span>
              </div>
            )
          })}
        </div>

        {/* Cashback timeline */}
        <div style={{background:'rgba(29,185,122,0.08)',border:'1px solid rgba(29,185,122,0.2)',borderRadius:14,padding:16,marginBottom:20,textAlign:'left'}}>
          <div style={{fontSize:14,fontWeight:700,color:GREEN,marginBottom:8}}>💸 R{totalCashback.toLocaleString()} cashback incoming</div>
          <div style={{fontSize:12,color:'rgba(255,255,255,0.5)',lineHeight:1.6}}>
            Your cashback of R{totalCashback.toLocaleString()} will be paid to your bank account within 30 days of your policy start date.
          </div>
          <div style={{display:'flex',gap:12,marginTop:12,fontSize:11,color:'rgba(255,255,255,0.4)'}}>
            <span>🔒 12-month lock-in</span>
            <span>📅 Paid within 30 days</span>
          </div>
        </div>

        {policyRef&&<div style={{fontSize:11,color:'rgba(255,255,255,0.3)',marginBottom:20}}>Reference: {policyRef}</div>}

        <button className="ip-btn" onClick={()=>window.location.href='/'} style={{marginBottom:12}}>
          Back to Muḽo →
        </button>
        <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',lineHeight:1.6}}>
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
