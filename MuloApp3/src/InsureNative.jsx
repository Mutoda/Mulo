/**
 * Muḽo Insure — InsureNative.jsx
 * Full faithful port of web Insure.jsx to React Native
 * Pre-journey: Landing → ID verify → Phone → OTP → Register
 * Journey: Screens 1–9 (identical flow to web app)
 */

import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const API = 'https://z30zl849k8.execute-api.af-south-1.amazonaws.com/prod'

const C = {
  navy:      '#0A1628',
  navyLight: '#132035',
  teal:      '#00B8A9',
  green:     '#1DB97A',
  white:     '#FFFFFF',
  muted:     'rgba(255,255,255,0.55)',
  subtle:    'rgba(255,255,255,0.08)',
  border:    'rgba(255,255,255,0.12)',
  danger:    '#FF5C5C',
  amber:     '#FFC000',
  wa:        '#25D366',
}

// ── SA ID validator ────────────────────────────────────────────────────────────
function validateSAID(id) {
  if (!/^\d{13}$/.test(id)) return { valid: false, error: 'Must be exactly 13 digits' }
  const yy = parseInt(id.slice(0,2)), mm = parseInt(id.slice(2,4)), dd = parseInt(id.slice(4,6))
  const citizen = parseInt(id.slice(10,11))
  const year = yy <= new Date().getFullYear() % 100 ? 2000+yy : 1900+yy
  const dob = new Date(year, mm-1, dd)
  if (mm<1||mm>12||dd<1||dd>31||dob.getMonth()!==mm-1)
    return { valid: false, error: 'Invalid date of birth in ID number' }
  const age = new Date().getFullYear() - dob.getFullYear()
  if (age < 18) return { valid: false, error: 'Must be 18 or older' }
  if (citizen!==0&&citizen!==1) return { valid: false, error: 'Invalid citizenship digit' }
  let sum = 0
  for (let i=0;i<12;i++) { let d=parseInt(id[i]); if(i%2===1){d*=2;if(d>9)d-=9} sum+=d }
  if ((10-(sum%10))%10 !== parseInt(id[12])) return { valid: false, error: 'Invalid ID number — checksum failed' }
  const gender = parseInt(id.slice(6,10))>=5000?'Male':'Female'
  const dobFormatted = dob.toLocaleDateString('en-ZA',{day:'numeric',month:'long',year:'numeric'})
  return { valid:true, dob:dobFormatted, age, gender, citizen:citizen===0?'SA Citizen':'Permanent Resident' }
}

// ── Products ───────────────────────────────────────────────────────────────────
const PRODUCTS = [
  { code:'CAR',       icon:'🚗', label:'Car insurance',      desc:'Comprehensive, third party & more' },
  { code:'BUILDINGS', icon:'🏠', label:'Buildings insurance', desc:'Structure, fixtures & fittings' },
  { code:'CONTENTS',  icon:'📦', label:'Home contents',       desc:'Furniture, appliances, valuables' },
  { code:'ALLRISK',   icon:'💎', label:'All risk / portable', desc:'Items outside your home' },
  { code:'CARAVAN',   icon:'🚐', label:'Caravan',             desc:'Requires car insurance' },
  { code:'TRAILER',   icon:'🔩', label:'Trailer',             desc:'Requires car insurance' },
]

const MOCK_QUOTES = {
  CAR: [
    { insurer:'Naked Insurance', logo:'🟠', premium:689,  excess:3500, rating:4.7, cashback:689,  highlight:'Best value' },
    { insurer:'King Price',      logo:'👑', premium:712,  excess:3000, rating:4.5, cashback:712,  highlight:'Decreasing premium' },
    { insurer:'Pineapple',       logo:'🍍', premium:741,  excess:2500, rating:4.6, cashback:741,  highlight:'Top rated claims' },
    { insurer:'iWYZE',           logo:'🔵', premium:798,  excess:3500, rating:4.2, cashback:798,  highlight:null },
    { insurer:'Absa Insurance',  logo:'🔴', premium:834,  excess:4000, rating:4.1, cashback:834,  highlight:null },
  ],
  BUILDINGS: [
    { insurer:'Absa Insurance',  logo:'🔴', premium:521, excess:5000, rating:4.3, cashback:521, highlight:'Best for bond holders' },
    { insurer:'Naked Insurance', logo:'🟠', premium:548, excess:4000, rating:4.7, cashback:548, highlight:'Best value' },
    { insurer:'King Price',      logo:'👑', premium:576, excess:5000, rating:4.5, cashback:576, highlight:null },
    { insurer:'iWYZE',           logo:'🔵', premium:612, excess:5000, rating:4.2, cashback:612, highlight:null },
  ],
  CONTENTS: [
    { insurer:'Pineapple',       logo:'🍍', premium:312, excess:1500, rating:4.6, cashback:312, highlight:'Top rated claims' },
    { insurer:'Naked Insurance', logo:'🟠', premium:328, excess:2000, rating:4.7, cashback:328, highlight:'Best value' },
    { insurer:'King Price',      logo:'👑', premium:341, excess:2000, rating:4.5, cashback:341, highlight:null },
  ],
  ALLRISK:  [
    { insurer:'Naked Insurance', logo:'🟠', premium:189, excess:1000, rating:4.7, cashback:189, highlight:'Best value' },
    { insurer:'Pineapple',       logo:'🍍', premium:210, excess:1000, rating:4.6, cashback:210, highlight:null },
    { insurer:'King Price',      logo:'👑', premium:225, excess:1000, rating:4.5, cashback:225, highlight:null },
  ],
  CARAVAN:  [{ insurer:'King Price', logo:'👑', premium:245, excess:2000, rating:4.5, cashback:245, highlight:'Only provider' }],
  TRAILER:  [{ insurer:'King Price', logo:'👑', premium:145, excess:1500, rating:4.5, cashback:145, highlight:'Only provider' }],
}

function buildScreenList(selected) {
  const list = [1]
  if (selected.includes('CAR')||selected.includes('CARAVAN')||selected.includes('TRAILER')) list.push(2)
  if (selected.includes('BUILDINGS')||selected.includes('CONTENTS')) list.push(3)
  if (selected.includes('ALLRISK')||selected.includes('CARAVAN')||selected.includes('TRAILER')) list.push(4)
  list.push(5,6,7,8,9)
  return list
}

// ── Shared UI ──────────────────────────────────────────────────────────────────
const NScreen = ({ children }) => (
  <SafeAreaView style={{ flex:1, backgroundColor:C.navy }} edges={['top']}>
    <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS==='ios'?'padding':undefined}>
      {children}
    </KeyboardAvoidingView>
  </SafeAreaView>
)

const TopBar = ({ title, step, total, onBack, brand=true }) => (
  <View style={s.topBar}>
    {onBack
      ? <TouchableOpacity onPress={onBack} style={s.backBtn}><Text style={s.backText}>←</Text></TouchableOpacity>
      : <View style={{ width:40 }} />
    }
    <View style={{ flex:1 }}>
      <Text style={s.topBarTitle}>{title}</Text>
      {step ? <Text style={s.topBarSub}>Step {step} of {total}</Text> : null}
    </View>
    {brand && <Text style={s.topBarBrand}>muḽo insure</Text>}
  </View>
)

const ProgressBar = ({ pct }) => (
  <View style={{ height:3, backgroundColor:C.subtle }}>
    <View style={{ height:3, backgroundColor:C.teal, width:`${pct}%` }} />
  </View>
)

const Btn = ({ label, onPress, disabled=false, variant='primary', style:extStyle }) => {
  const bg = { primary:C.green, teal:C.teal, ghost:'transparent', secondary:C.subtle }[variant] || C.green
  const color = variant==='ghost' ? C.teal : C.navy
  const border = variant==='ghost' ? { borderWidth:1.5, borderColor:C.teal } : {}
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled}
      style={[s.btn, { backgroundColor:bg, opacity:disabled?0.4:1 }, border, extStyle]}>
      <Text style={[s.btnText, { color }]}>{label}</Text>
    </TouchableOpacity>
  )
}

const BottomBar = ({ children }) => (
  <View style={s.bottomBar}>{children}</View>
)

const Field = ({ label, value, onChangeText, placeholder, keyboardType='default',
  secureTextEntry=false, readOnly=false, hint, maxLength, autoCapitalize='sentences' }) => (
  <View style={{ marginBottom:16 }}>
    <Text style={s.fieldLabel}>{label}</Text>
    <TextInput value={value} onChangeText={readOnly?undefined:onChangeText}
      placeholder={placeholder} placeholderTextColor={C.muted}
      keyboardType={keyboardType} secureTextEntry={secureTextEntry}
      editable={!readOnly} maxLength={maxLength} autoCapitalize={autoCapitalize}
      style={[s.input, readOnly&&{ opacity:0.6 }]} />
    {hint?<Text style={s.fieldHint}>{hint}</Text>:null}
  </View>
)

const Chips = ({ label, value, options, onChange }) => (
  <View style={{ marginBottom:16 }}>
    <Text style={s.fieldLabel}>{label}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop:6 }}>
      {options.map(o => (
        <TouchableOpacity key={o.value} onPress={() => onChange(o.value)}
          style={[s.chip, value===o.value && s.chipActive]}>
          <Text style={[s.chipText, value===o.value && { color:C.navy }]}>{o.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
)

const Badge = ({ label, color=C.teal }) => (
  <View style={{ backgroundColor:color+'22', borderRadius:20, paddingHorizontal:8, paddingVertical:2, borderWidth:1, borderColor:color+'44', alignSelf:'flex-start' }}>
    <Text style={{ fontSize:10, fontWeight:'700', color }}>{label}</Text>
  </View>
)

const InfoBanner = ({ icon, title, body, color=C.teal }) => (
  <View style={[s.infoBanner, { backgroundColor:color+'18', borderColor:color+'33' }]}>
    <Text style={{ fontSize:18 }}>{icon}</Text>
    <View style={{ flex:1 }}>
      {title?<Text style={[s.infoBannerTitle,{color}]}>{title}</Text>:null}
      {body?<Text style={s.infoBannerBody}>{body}</Text>:null}
    </View>
  </View>
)

const CheckRow = ({ label, sub, status }) => (
  <View style={s.checkRow}>
    <View style={[s.checkIcon,
      status==='ok'      && { backgroundColor:C.green+'22', borderColor:C.green },
      status==='loading' && { backgroundColor:C.teal+'22',  borderColor:C.teal },
    ]}>
      <Text style={{ fontSize:12, color: status==='ok'?C.green:status==='loading'?C.teal:C.muted }}>
        {status==='ok'?'✓':status==='loading'?'⟳':'○'}
      </Text>
    </View>
    <View style={{ flex:1 }}>
      <Text style={{ fontSize:13, color:C.white, fontWeight:'500' }}>{label}</Text>
      {sub?<Text style={{ fontSize:11, color:C.muted, marginTop:2 }}>{sub}</Text>:null}
    </View>
    {status==='ok'      && <Text style={{ fontSize:11, color:C.green,  fontWeight:'600' }}>Passed</Text>}
    {status==='loading' && <Text style={{ fontSize:11, color:C.teal,   fontWeight:'600' }}>Checking…</Text>}
  </View>
)

// ── Main component ─────────────────────────────────────────────────────────────
export default function InsureNative({ isRefinance=false, client=null, onBack }) {

  const [preStep, setPreStep]   = useState(isRefinance ? 'journey' : 'landing')

  // Auth state
  const [authId, setAuthId]               = useState('')
  const [authFirstName, setAuthFirstName] = useState('')
  const [authLastName, setAuthLastName]   = useState('')
  const [authPhone, setAuthPhone]         = useState('')
  const [authEmail, setAuthEmail]         = useState('')
  const [authPass, setAuthPass]           = useState('')
  const [showAuthPass, setShowAuthPass]   = useState(false)
  const [authOtp, setAuthOtp]             = useState(['','','','','',''])
  const [authPhase, setAuthPhase]         = useState('idle')
  const [authValidation, setAuthValidation] = useState(null)
  const [authTimer, setAuthTimer]         = useState(59)
  const [authChecks, setAuthChecks]       = useState([
    { label:'Valid SA ID format',  sub:'13 digits · Luhn checksum · Date of birth', status:'wait' },
    { label:'Homeowner status',    sub:'Deeds Office verification', status:'wait' },
    { label:'No sequestration',    sub:'Master of High Court check', status:'wait' },
  ])
  const [verifiedToken, setVerifiedToken] = useState(null)
  const otpRefs = useRef([])

  // Journey state
  const [screenIdx, setScreenIdx]   = useState(0)
  const [selected, setSelected]     = useState(isRefinance ? ['BUILDINGS'] : [])
  const [screenList, setScreenList] = useState(buildScreenList(isRefinance ? ['BUILDINGS'] : []))

  const [car, setCar] = useState({
    make:   isRefinance&&client?.vehicle?.make  ||'',
    model:  isRefinance&&client?.vehicle?.model ||'',
    year:   isRefinance&&client?.vehicle?.year  ?String(client.vehicle.year):'',
    colour: isRefinance&&client?.vehicle?.colour||'',
    reg:    isRefinance&&client?.vehicle?.reg   ||'',
    use:    'private', financed:'yes',
  })
  const [home, setHome] = useState({
    address:       isRefinance&&client?.property?.address      ||'',
    buildingValue: isRefinance&&client?.property?.buildingValue?String(client.property.buildingValue):'',
    contentsValue: '',
    roofType:'tile', wallType:'brick', securityAlarm:'yes', securityGuard:'no',
  })
  const [additional, setAdditional] = useState({ allRiskItems:'', caravanMake:'', caravanYear:'', trailerType:'' })
  const [about, setAbout] = useState({
    name:  isRefinance?client?.name||'':'',
    idNum: isRefinance?client?.idNumber||'':'',
    email: isRefinance?client?.email||'':'',
    phone: isRefinance?client?.phone||'':'',
  })
  const [selectedQuotes, setSelectedQuotes] = useState({})
  const [quotesLoading, setQuotesLoading]   = useState(false)
  const [driveScore, setDriveScore]         = useState(null)
  const [debit, setDebit] = useState({
    bank:          isRefinance?client?.bankAccount?.bank||'':'',
    accountNumber: isRefinance?client?.bankAccount?.accountNumber||'':'',
    accountType:   'Cheque', debitDay:'1', signed:false,
  })

  const currentScreen = screenList[screenIdx]
  const totalScreens  = screenList.length
  const totalPremium  = Object.values(selectedQuotes).reduce((s,q)=>s+(q?.premium||0),0)
  const totalCashback = Object.values(selectedQuotes).reduce((s,q)=>s+(q?.cashback||0),0)

  useEffect(() => { setScreenList(buildScreenList(selected)) }, [selected])

  // OTP timer
  useEffect(() => {
    if (preStep!=='otp'||authTimer<=0) return
    const t = setTimeout(()=>setAuthTimer(s=>s-1),1000)
    return ()=>clearTimeout(t)
  }, [preStep,authTimer])

  // Quotes loading — auto-select best value quote per product
  useEffect(() => {
    if (currentScreen===6&&quotesLoading===false&&Object.keys(selectedQuotes).length===0) {
      setQuotesLoading(true)
      setTimeout(()=>{
        // Auto-select first (best value) quote for each selected product
        const autoSelected = {}
        selected.forEach(code => {
          const quotes = MOCK_QUOTES[code]||[]
          if (quotes.length>0) autoSelected[code] = quotes[0]
        })
        setSelectedQuotes(autoSelected)
        setQuotesLoading(false)
      },2000)
    }
  }, [currentScreen])

  // Drive Score
  useEffect(() => {
    if (currentScreen!==6) return
    const vrn = car.reg?.toUpperCase().replace(/[\s\-]/g,'')||null
    if (!vrn||driveScore) return
    fetch(`${API}/telematics/score/vrn/${vrn}`,{headers:{'X-Mulo-API-Key':'MULO_INTERNAL'}})
      .then(r=>r.ok?r.json():null).then(d=>d&&setDriveScore(d)).catch(()=>{})
  }, [currentScreen,car.reg])

  const goNext = () => { if (screenIdx<screenList.length-1) setScreenIdx(i=>i+1) }
  const goPrev = () => { if (screenIdx===0) setPreStep('journey'); else setScreenIdx(i=>i-1) }

  // ════════════════════════════════════════════════════════════════════════════
  // PRE-JOURNEY SCREENS
  // ════════════════════════════════════════════════════════════════════════════

  // ── LANDING ────────────────────────────────────────────────────────────────
  if (preStep==='landing') return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.navy }}>
      <ScrollView contentContainerStyle={{ padding:24, paddingTop:32 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:32 }}>
          <View>
            <Text style={{ fontSize:28, fontWeight:'800', color:C.white }}>Mu<Text style={{ color:C.teal }}>ḽ</Text>o</Text>
            <Text style={{ fontSize:11, color:C.muted }}>insure</Text>
          </View>
          <Text style={{ fontSize:11, color:C.muted }}>FSP 49169</Text>
        </View>
        <View style={{ backgroundColor:C.teal+'22', borderRadius:20, paddingHorizontal:12, paddingVertical:6, alignSelf:'flex-start', marginBottom:16 }}>
          <Text style={{ fontSize:12, color:C.teal, fontWeight:'600' }}>🏆 South Africa's only cashback insurance</Text>
        </View>
        <Text style={{ fontSize:26, fontWeight:'800', color:C.white, lineHeight:34, marginBottom:12 }}>
          Anyone can compare.{'\n'}<Text style={{ fontStyle:'italic', color:C.teal }}>Only Muḽo pays you for it.</Text>
        </Text>
        <Text style={{ fontSize:14, color:C.muted, lineHeight:22, marginBottom:8 }}>
          Insure your car, home or contents through Muḽo and earn your first month's premium back — guaranteed. Every time.
        </Text>
        <Text style={{ fontSize:14, color:'rgba(255,255,255,0.65)', lineHeight:22, fontStyle:'italic', marginBottom:24 }}>
          The smart move isn't just finding a better rate. It's getting paid when you find it.
        </Text>
        <View style={{ flexDirection:'row', gap:10, marginBottom:32 }}>
          {[['R0','Free to compare'],['3 min','Avg. quote time'],['R900','Avg. cashback']].map(([v,l])=>(
            <View key={l} style={{ flex:1, backgroundColor:C.navyLight, borderRadius:12, padding:12, borderWidth:1, borderColor:C.border, alignItems:'center' }}>
              <Text style={{ fontSize:18, fontWeight:'800', color:C.teal }}>{v}</Text>
              <Text style={{ fontSize:10, color:C.muted, marginTop:4, textAlign:'center' }}>{l}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity onPress={()=>setPreStep('id')}
          style={{ backgroundColor:C.green, borderRadius:14, padding:18, alignItems:'center', marginBottom:12 }}>
          <Text style={{ fontSize:16, fontWeight:'700', color:C.navy }}>Get my free quotes →</Text>
        </TouchableOpacity>
        <Text style={{ textAlign:'center', fontSize:11, color:C.muted, marginBottom:32 }}>
          Free to compare · No obligation · Takes 3 minutes
        </Text>
        <View style={{ flexDirection:'row', justifyContent:'space-around', paddingTop:20, borderTopWidth:1, borderTopColor:C.border }}>
          {[['🛡️','FSP 49169'],['🔒','POPIA'],['⚡','8 insurers']].map(([i,l])=>(
            <View key={l} style={{ alignItems:'center', gap:4 }}>
              <Text style={{ fontSize:18 }}>{i}</Text>
              <Text style={{ fontSize:10, color:C.muted, fontWeight:'600' }}>{l}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )

  // ── ID VERIFY ──────────────────────────────────────────────────────────────
  if (preStep==='id') {
    const handleIdChange = val => {
      const cleaned = val.replace(/\D/g,'').slice(0,13)
      setAuthId(cleaned)
      setAuthPhase('idle')
      setAuthValidation(null)
      setAuthChecks(c=>c.map(x=>({...x,status:'wait'})))
      if (cleaned.length===13) {
        const result = validateSAID(cleaned)
        setAuthValidation(result)
        if (!result.valid) setAuthPhase('invalid')
      }
    }

    const handleCheck = async () => {
      if (authId.length<13) return
      const result = validateSAID(authId)
      if (!result.valid) { setAuthPhase('invalid'); setAuthValidation(result); return }
      setAuthPhase('checking')
      setAuthChecks(c=>c.map((x,i)=>i===0?{...x,status:'loading'}:x))
      try {
        await fetch(`${API}/verify-id`,{
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({id_number:authId})
        })
        setAuthChecks(c=>c.map((x,i)=>i===0?{...x,status:'ok',sub:`DOB: ${result.dob} · ${result.gender}`}:x))
        setTimeout(()=>{
          setAuthChecks(c=>c.map((x,i)=>i===1?{...x,status:'loading'}:x))
          setTimeout(()=>{
            setAuthChecks(c=>c.map((x,i)=>i===1?{...x,status:'ok'}:x))
            setTimeout(()=>{
              setAuthChecks(c=>c.map((x,i)=>i===2?{...x,status:'loading'}:x))
              setTimeout(()=>{
                setAuthChecks(c=>c.map((x,i)=>i===2?{...x,status:'ok'}:x))
                setAuthPhase('done')
              },900)
            },400)
          },900)
        },400)
      } catch(err) {
        setAuthPhase('invalid')
        setAuthValidation({valid:false,error:err.message})
        setAuthChecks(c=>c.map(x=>({...x,status:'wait'})))
      }
    }

    const formatted = authId
      ? `${authId.slice(0,6)} ${authId.slice(6,10)} ${authId.slice(10)}`
      : '000000 0000 000'

    return (
      <NScreen>
        <TopBar title="Verify your identity" step={1} total={4} onBack={()=>setPreStep('landing')} />
        <ProgressBar pct={25} />
        <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:20 }} showsVerticalScrollIndicator={false}>
          {/* ID card graphic */}
          <View style={s.idCard}>
            <Text style={s.idCardLabel}>South African ID Number</Text>
            <Text style={s.idCardNumber}>{formatted}</Text>
            {authValidation?.valid && (
              <Text style={s.idCardSub}>🎂 {authValidation.dob} · {authValidation.gender}</Text>
            )}
            <Text style={{ fontSize:24, marginTop:8 }}>🇿🇦</Text>
          </View>

          <Field label="SA ID Number" value={authId} onChangeText={handleIdChange}
            placeholder="e.g. 8001015009087" keyboardType="numeric" maxLength={13} autoCapitalize="none" />
          {authId.length>0&&authId.length<13&&
            <Text style={{ fontSize:11, color:C.muted, marginTop:-10, marginBottom:12 }}>{authId.length}/13 digits</Text>}
          {authPhase==='invalid'&&authValidation&&
            <Text style={{ fontSize:12, color:C.danger, marginTop:-10, marginBottom:12 }}>✕ {authValidation.error}</Text>}
          {authValidation?.valid&&
            <Text style={{ fontSize:12, color:C.green, marginTop:-10, marginBottom:12 }}>✓ Valid · DOB {authValidation.dob} · {authValidation.gender}</Text>}

          {authId.length===13&&authValidation?.valid&&(
            <View style={{ flexDirection:'row', gap:10 }}>
              <View style={{ flex:1 }}>
                <Field label="First name" value={authFirstName} onChangeText={setAuthFirstName}
                  placeholder="e.g. Thabo" autoCapitalize="words" />
              </View>
              <View style={{ flex:1 }}>
                <Field label="Last name" value={authLastName} onChangeText={setAuthLastName}
                  placeholder="e.g. Nkosi" autoCapitalize="words" />
              </View>
            </View>
          )}

          {(authPhase==='checking'||authPhase==='done')&&(
            <View style={{ marginTop:8 }}>
              <Text style={s.sectionTitle}>Verification checks</Text>
              {authChecks.map((c,i)=><CheckRow key={i} {...c} />)}
            </View>
          )}
        </ScrollView>
        <BottomBar>
          {authPhase!=='done'
            ? <Btn label={authPhase==='checking'?'Verifying…':'Verify my ID →'}
                onPress={handleCheck}
                disabled={authId.length<13||authPhase==='invalid'||authPhase==='checking'} />
            : <Btn label="Continue →"
                onPress={()=>{ setPreStep('phone') }}
                disabled={!authFirstName.trim()||!authLastName.trim()} />
          }
        </BottomBar>
      </NScreen>
    )
  }

  // ── PHONE ──────────────────────────────────────────────────────────────────
  if (preStep==='phone') {
    const digits = authPhone.replace(/\D/g,'')
    const valid = digits.length===9||digits.length===10

    const handleContinue = async () => {
      if (!valid) return
      const normalized = digits.startsWith('0') ? digits : '0'+digits
      setAuthPhone(normalized)
      try {
        await fetch(`${API}/otp/send`,{
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({cellphone:normalized,id_number:authId})
        })
      } catch(e) {}
      setAuthTimer(59)
      setAuthOtp(['','','','','',''])
      setPreStep('otp')
    }

    return (
      <NScreen>
        <TopBar title="Your WhatsApp number" step={2} total={4} onBack={()=>setPreStep('id')} />
        <ProgressBar pct={50} />
        <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:20 }} showsVerticalScrollIndicator={false}>
          <Text style={{ fontSize:15, fontWeight:'600', color:C.white, marginBottom:6 }}>Enter your WhatsApp number</Text>
          <Text style={{ fontSize:13, color:C.muted, marginBottom:24, lineHeight:20 }}>
            We'll send a one-time verification code to this number via WhatsApp.
          </Text>

          {/* Phone input with +27 prefix */}
          <View style={{ marginBottom:16 }}>
            <Text style={s.fieldLabel}>WhatsApp number</Text>
            <View style={{ flexDirection:'row', alignItems:'center', backgroundColor:C.navyLight, borderWidth:1, borderColor:valid?C.wa:C.border, borderRadius:10, overflow:'hidden' }}>
              <View style={{ paddingHorizontal:14, paddingVertical:14, borderRightWidth:1, borderRightColor:C.border }}>
                <Text style={{ fontSize:15, color:C.white, fontWeight:'600' }}>🇿🇦 +27</Text>
              </View>
              <TextInput
                value={authPhone.replace(/^0/,'')}
                onChangeText={setAuthPhone}
                placeholder="82 123 4567"
                placeholderTextColor={C.muted}
                keyboardType="phone-pad"
                style={{ flex:1, padding:14, color:C.white, fontSize:15 }}
              />
            </View>
          </View>

          <View style={{ backgroundColor:C.subtle, borderRadius:12, padding:14 }}>
            <Text style={{ fontSize:12, color:C.muted, lineHeight:20 }}>
              Your OTP will be sent to this WhatsApp number to confirm you own it.
            </Text>
          </View>
        </ScrollView>
        <BottomBar>
          <Btn label="Send OTP via WhatsApp →" onPress={handleContinue} disabled={!valid} />
        </BottomBar>
      </NScreen>
    )
  }

  // ── OTP VERIFY ─────────────────────────────────────────────────────────────
  if (preStep==='otp') {
    const code = authOtp.join('')

    const handleDigit = (i, val) => {
      const v = val.replace(/\D/g,'').slice(-1)
      const next = [...authOtp]; next[i]=v; setAuthOtp(next)
      setAuthPhase('idle')
      if (v&&i<5) otpRefs.current[i+1]?.focus()
    }

    const handleKey = (i, e) => {
      if (e.nativeEvent.key==='Backspace'&&!authOtp[i]&&i>0) otpRefs.current[i-1]?.focus()
    }

    const verify = async () => {
      if (code.length<6) return
      setAuthPhase('checking')
      try {
        const res = await fetch(`${API}/otp/verify`,{
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({id_number:authId,otp:code})
        })
        const data = await res.json()
        if (data.verified) {
          setVerifiedToken(data.verifiedToken)
          setAuthPhase('done')
          setTimeout(()=>setPreStep('register'),900)
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

    const phoneDisplay = authPhone ? '+27 '+authPhone.replace(/^0/,'') : ''

    return (
      <NScreen>
        <TopBar title="Enter your OTP" step={3} total={4} onBack={()=>setPreStep('phone')} />
        <ProgressBar pct={75} />
        <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:20 }} showsVerticalScrollIndicator={false}>
          {/* WhatsApp card */}
          <View style={[s.waCard, { marginBottom:24 }]}>
            <View style={s.waIcon}>
              <Text style={{ fontSize:24 }}>💬</Text>
            </View>
            <View>
              <Text style={{ fontSize:12, color:C.muted }}>OTP sent via WhatsApp to</Text>
              <Text style={{ fontSize:16, fontWeight:'700', color:C.white }}>{phoneDisplay}</Text>
            </View>
          </View>

          {/* OTP boxes */}
          <View style={{ flexDirection:'row', justifyContent:'center', gap:10, marginBottom:16 }}>
            {authOtp.map((d,i) => (
              <TextInput
                key={i}
                ref={el=>otpRefs.current[i]=el}
                value={d}
                onChangeText={val=>handleDigit(i,val)}
                onKeyPress={e=>handleKey(i,e)}
                keyboardType="numeric"
                maxLength={1}
                style={[s.otpBox, {
                  borderColor: authPhase==='error'?C.danger:authPhase==='done'?C.green:d?C.teal:C.border
                }]}
              />
            ))}
          </View>

          {authPhase==='error'&&
            <Text style={{ color:C.danger, fontSize:13, textAlign:'center', marginBottom:12 }}>✕ Incorrect OTP. Please try again.</Text>}
          {authPhase==='done'&&
            <Text style={{ color:C.green, fontSize:13, textAlign:'center', marginBottom:12 }}>✓ Verified!</Text>}
          {authPhase==='checking'&&
            <ActivityIndicator color={C.teal} style={{ marginBottom:12 }} />}

          <View style={{ alignItems:'center', marginTop:8 }}>
            {authTimer>0
              ? <Text style={{ fontSize:13, color:C.muted }}>Resend in <Text style={{ color:C.teal, fontWeight:'700' }}>{authTimer}s</Text></Text>
              : <TouchableOpacity onPress={()=>{ setAuthTimer(59); setAuthOtp(['','','','','','']) }}>
                  <Text style={{ fontSize:13, color:C.teal, fontWeight:'600' }}>Resend OTP</Text>
                </TouchableOpacity>
            }
          </View>
        </ScrollView>
        <BottomBar>
          <Btn label={authPhase==='checking'?'Verifying…':authPhase==='done'?'Verified ✓':'Verify OTP →'}
            onPress={verify}
            disabled={code.length<6||authPhase==='checking'||authPhase==='done'} />
        </BottomBar>
      </NScreen>
    )
  }

  // ── REGISTER ───────────────────────────────────────────────────────────────
  if (preStep==='register') {
    const ready = authEmail&&authPass.length>=8

    const handleRegister = async () => {
      if (!ready) return
      setAuthPhase('checking')
      try {
        await fetch(`${API}/signup`,{
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({
            id_number:authId, first_name:authFirstName, last_name:authLastName,
            cellphone:authPhone, email:authEmail, password:authPass,
            verified_token:verifiedToken,
          })
        })
      } catch(e) {}
      setAuthPhase('idle')
      setPreStep('journey')
    }

    const strength = [authPass.length>=8, /[A-Z]/.test(authPass), /[0-9]/.test(authPass)]

    return (
      <NScreen>
        <TopBar title="Create your account" step={4} total={4} onBack={()=>setPreStep('otp')} />
        <ProgressBar pct={100} />
        <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:20 }} showsVerticalScrollIndicator={false}>
          <Text style={{ fontSize:16, fontWeight:'700', color:C.white, marginBottom:4 }}>
            Welcome, {authFirstName}! 👋
          </Text>
          <Text style={{ fontSize:13, color:C.muted, marginBottom:24, lineHeight:20 }}>
            Just your email and a password to finish setting up your account.
          </Text>

          <Field label="Email address" value={authEmail} onChangeText={setAuthEmail}
            placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />

          <View style={{ marginBottom:16 }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:6 }}>
              <Text style={s.fieldLabel}>Password</Text>
              <TouchableOpacity onPress={()=>setShowAuthPass(p=>!p)}>
                <Text style={{ fontSize:12, color:C.teal, fontWeight:'600' }}>{showAuthPass?'Hide':'Show'}</Text>
              </TouchableOpacity>
            </View>
            <TextInput value={authPass} onChangeText={setAuthPass}
              placeholder="Min. 8 characters" placeholderTextColor={C.muted}
              secureTextEntry={!showAuthPass}
              style={s.input} />
            {authPass.length>0&&(
              <View style={{ flexDirection:'row', gap:4, marginTop:8 }}>
                {strength.map((ok,i)=>(
                  <View key={i} style={{ flex:1, height:3, borderRadius:99, backgroundColor:ok?C.teal:C.subtle }} />
                ))}
              </View>
            )}
          </View>

          <Text style={{ fontSize:11, color:C.muted, lineHeight:18, marginBottom:16 }}>
            By creating an account you agree to Muḽo's Terms of Service and Privacy Policy. Your information is processed in terms of POPIA.
          </Text>
        </ScrollView>
        <BottomBar>
          <Btn label={authPhase==='checking'?'Creating account…':'Get my free quotes →'}
            onPress={handleRegister} disabled={!ready||authPhase==='checking'} />
        </BottomBar>
      </NScreen>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // QUOTE JOURNEY SCREENS
  // ════════════════════════════════════════════════════════════════════════════

  // ── SCREEN 1 — Product selector ────────────────────────────────────────────
  if (currentScreen===1) {
    const errors = []
    if (selected.includes('ALLRISK')&&selected.length===1) errors.push('All risk must bundle with another product')
    if (selected.includes('CARAVAN')&&!selected.includes('CAR')) errors.push('Caravan requires car insurance')
    if (selected.includes('TRAILER')&&!selected.includes('CAR')) errors.push('Trailer requires car insurance')
    const toggle = code => setSelected(prev=>prev.includes(code)?prev.filter(c=>c!==code):[...prev,code])
    const orderedProducts = isRefinance
      ? [...PRODUCTS].sort((a,b)=>a.code==='BUILDINGS'?-1:b.code==='BUILDINGS'?1:0)
      : PRODUCTS

    return (
      <NScreen>
        <TopBar title="What do you want to insure?" step={1} total={totalScreens} onBack={()=>setPreStep('journey')} />
        <ProgressBar pct={(1/totalScreens)*100} />
        <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:20 }} showsVerticalScrollIndicator={false}>
          {isRefinance&&(
            <InfoBanner icon="⚡" title="Refinance client"
              body="We've pre-loaded your property and vehicle data. You'll only need to answer a few quick questions." />
          )}
          <Text style={{ fontSize:14, color:C.muted, marginBottom:20, lineHeight:21 }}>
            Select everything you'd like to cover. All products earn cashback equal to your first month's premium.
          </Text>
          {orderedProducts.map(p=>{
            const isSel = selected.includes(p.code)
            const isMandatory = isRefinance&&p.code==='BUILDINGS'
            const isDisabled = !selected.includes('CAR')&&(p.code==='CARAVAN'||p.code==='TRAILER')
            return (
              <TouchableOpacity key={p.code}
                onPress={()=>!isMandatory&&!isDisabled&&toggle(p.code)}
                style={[s.productCard, isSel&&{ borderColor:C.teal, backgroundColor:C.teal+'18' }, isDisabled&&{ opacity:0.4 }]}
                activeOpacity={0.8}>
                <Text style={{ fontSize:26 }}>{p.icon}</Text>
                <View style={{ flex:1 }}>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <Text style={s.productCardTitle}>{p.label}</Text>
                    {isMandatory&&<Badge label="Required for bond" />}
                  </View>
                  <Text style={s.productCardDesc}>{p.desc}</Text>
                </View>
                <View style={[s.checkCircle, isSel&&{ backgroundColor:C.teal, borderColor:C.teal }]}>
                  {isSel&&<Text style={{ color:C.navy, fontSize:13, fontWeight:'700' }}>✓</Text>}
                </View>
              </TouchableOpacity>
            )
          })}
          {errors.map((e,i)=><Text key={i} style={{ color:C.danger, fontSize:12, marginTop:4 }}>⚠ {e}</Text>)}
          <InfoBanner icon="💸" title="Cashback offer" color={C.green}
            body="Every product earns 1× your first month's premium back. 12-month lock-in applies." />
        </ScrollView>
        <BottomBar>
          <Btn label={selected.length===0?'Select a product to continue':`Continue with ${selected.length} product${selected.length>1?'s':''} →`}
            onPress={goNext} disabled={selected.length===0||errors.length>0} />
        </BottomBar>
      </NScreen>
    )
  }

  // ── SCREEN 2 — Car ─────────────────────────────────────────────────────────
  if (currentScreen===2) return (
    <NScreen>
      <TopBar title="Tell us about your car" step={screenList.indexOf(2)+1} total={totalScreens} onBack={goPrev} />
      <ProgressBar pct={((screenList.indexOf(2)+1)/totalScreens)*100} />
      <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:20 }} showsVerticalScrollIndicator={false}>
        {isRefinance&&car.make&&<InfoBanner icon="⚡" title="Pre-filled from your TruID data." body="Check the details are correct." />}
        <Field label="Make" value={car.make} onChangeText={v=>setCar(p=>({...p,make:v}))} placeholder="e.g. Toyota" readOnly={isRefinance&&!!car.make} />
        <Field label="Model" value={car.model} onChangeText={v=>setCar(p=>({...p,model:v}))} placeholder="e.g. Hilux" readOnly={isRefinance&&!!car.model} />
        <Field label="Year" value={car.year} onChangeText={v=>setCar(p=>({...p,year:v}))} placeholder="e.g. 2021" keyboardType="numeric" readOnly={isRefinance&&!!car.year} />
        <Field label="Colour" value={car.colour} onChangeText={v=>setCar(p=>({...p,colour:v}))} placeholder="e.g. White" />
        <Field label="Registration number" value={car.reg} onChangeText={v=>setCar(p=>({...p,reg:v}))} placeholder="e.g. GP 42 TH" autoCapitalize="characters" />
        <Chips label="Primary use" value={car.use} onChange={v=>setCar(p=>({...p,use:v}))}
          options={[{value:'private',label:'Private'},{value:'commute',label:'Commute to work'},{value:'business',label:'Business use'}]} />
        <Chips label="Is the vehicle financed?" value={car.financed} onChange={v=>setCar(p=>({...p,financed:v}))}
          options={[{value:'yes',label:'Yes'},{value:'no',label:'No'}]} />
        {/* Finance house shown if financed */}
        {car.financed==='yes'&&(
          <Chips label="Finance house" value={car.financeHouse||''} onChange={v=>setCar(p=>({...p,financeHouse:v}))}
            options={[{value:'absa',label:'Absa'},{value:'wesbank',label:'WesBank'},{value:'std',label:'Standard Bank'},{value:'fnb',label:'FNB'},{value:'nedbank',label:'Nedbank'},{value:'other',label:'Other'}]} />
        )}
      </ScrollView>
      <BottomBar><Btn label="Continue →" onPress={goNext} disabled={!car.make||!car.model||!car.year} /></BottomBar>
    </NScreen>
  )

  // ── SCREEN 3 — Home ────────────────────────────────────────────────────────
  if (currentScreen===3) return (
    <NScreen>
      <TopBar title="Tell us about your home" step={screenList.indexOf(3)+1} total={totalScreens} onBack={goPrev} />
      <ProgressBar pct={((screenList.indexOf(3)+1)/totalScreens)*100} />
      <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:20 }} showsVerticalScrollIndicator={false}>
        {isRefinance&&home.address&&<InfoBanner icon="⚡" title="Pre-filled from Lightstone data." body="Verify the values below." />}
        {isRefinance&&client?.property?.riskScore&&(
          <View style={[s.quoteCard,{marginBottom:16}]}>
            <Text style={[s.sectionTitle,{marginBottom:8}]}>Property risk profile</Text>
            <View style={{ flexDirection:'row', gap:8 }}>
              {Object.entries(client.property.riskScore).map(([k,v])=>(
                <View key={k} style={{ flex:1, alignItems:'center', padding:8,
                  backgroundColor:v==='low'?C.green+'18':v==='medium'?'#FF980018':'#FF5C5C18',
                  borderRadius:8, borderWidth:1,
                  borderColor:v==='low'?C.green+'44':v==='medium'?'#FF980044':C.danger+'44' }}>
                  <Text style={{ fontSize:10, color:C.muted, textTransform:'capitalize' }}>{k}</Text>
                  <Text style={{ fontSize:11, fontWeight:'700', marginTop:2,
                    color:v==='low'?C.green:v==='medium'?'#FF9800':C.danger, textTransform:'capitalize' }}>{v}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        <Field label="Property address" value={home.address} onChangeText={v=>setHome(p=>({...p,address:v}))}
          placeholder="Street, suburb, city, postal code" readOnly={isRefinance&&!!home.address} />
        {selected.includes('BUILDINGS')&&(
          <Field label="Building replacement value (R)" value={home.buildingValue} onChangeText={v=>setHome(p=>({...p,buildingValue:v}))}
            placeholder="e.g. 2800000" keyboardType="numeric"
            hint="Cost to rebuild from scratch — not market value" readOnly={isRefinance&&!!home.buildingValue} />
        )}
        {selected.includes('CONTENTS')&&(
          <Field label="Contents value (R)" value={home.contentsValue} onChangeText={v=>setHome(p=>({...p,contentsValue:v}))}
            placeholder="e.g. 450000" keyboardType="numeric"
            hint="Total value of furniture, appliances, valuables" />
        )}
        <Chips label="Roof type" value={home.roofType} onChange={v=>setHome(p=>({...p,roofType:v}))}
          options={[{value:'tile',label:'Tiles'},{value:'slate',label:'Slate'},{value:'tin',label:'Tin/IBR'},{value:'thatch',label:'Thatch'}]} />
        <Chips label="Wall construction" value={home.wallType} onChange={v=>setHome(p=>({...p,wallType:v}))}
          options={[{value:'brick',label:'Brick & plaster'},{value:'double_brick',label:'Double brick'},{value:'wood',label:'Wood/Nutec'},{value:'other',label:'Other'}]} />
        <Chips label="Alarm system?" value={home.securityAlarm} onChange={v=>setHome(p=>({...p,securityAlarm:v}))}
          options={[{value:'yes',label:'Monitored'},{value:'yes_self',label:'Self-monitored'},{value:'no',label:'No alarm'}]} />
        <Chips label="Armed response?" value={home.securityGuard} onChange={v=>setHome(p=>({...p,securityGuard:v}))}
          options={[{value:'yes',label:'Yes'},{value:'no',label:'No'}]} />
      </ScrollView>
      <BottomBar><Btn label="Continue →" onPress={goNext} disabled={!home.address} /></BottomBar>
    </NScreen>
  )

  // ── SCREEN 4 — Additional ──────────────────────────────────────────────────
  if (currentScreen===4) return (
    <NScreen>
      <TopBar title="Additional items" step={screenList.indexOf(4)+1} total={totalScreens} onBack={goPrev} />
      <ProgressBar pct={((screenList.indexOf(4)+1)/totalScreens)*100} />
      <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:20 }} showsVerticalScrollIndicator={false}>
        {selected.includes('ALLRISK')&&(
          <View style={{ marginBottom:20 }}>
            <Text style={s.sectionTitle}>All risk items</Text>
            <Text style={{ fontSize:13, color:C.muted, marginBottom:12, lineHeight:20 }}>
              List the items you want all-risk cover for (e.g. "iPhone 15 — R18 000, Engagement ring — R45 000").
            </Text>
            <TextInput value={additional.allRiskItems} onChangeText={v=>setAdditional(p=>({...p,allRiskItems:v}))}
              placeholder="List your items and estimated values..."
              placeholderTextColor={C.muted} multiline numberOfLines={4}
              style={[s.input,{minHeight:100,textAlignVertical:'top'}]} />
          </View>
        )}
        {selected.includes('CARAVAN')&&(
          <View style={{ marginBottom:20 }}>
            <Text style={s.sectionTitle}>Caravan details</Text>
            <Field label="Make & model" value={additional.caravanMake} onChangeText={v=>setAdditional(p=>({...p,caravanMake:v}))} placeholder="e.g. Jurgens Classique" />
            <Field label="Year" value={additional.caravanYear} onChangeText={v=>setAdditional(p=>({...p,caravanYear:v}))} placeholder="e.g. 2019" keyboardType="numeric" />
          </View>
        )}
        {selected.includes('TRAILER')&&(
          <View style={{ marginBottom:20 }}>
            <Text style={s.sectionTitle}>Trailer details</Text>
            <Chips label="Trailer type" value={additional.trailerType} onChange={v=>setAdditional(p=>({...p,trailerType:v}))}
              options={[{value:'boat',label:'Boat trailer'},{value:'enclosed',label:'Enclosed'},{value:'flatbed',label:'Flatbed/Utility'},{value:'other',label:'Other'}]} />
          </View>
        )}
      </ScrollView>
      <BottomBar><Btn label="Continue →" onPress={goNext} /></BottomBar>
    </NScreen>
  )

  // ── SCREEN 5 — About you ───────────────────────────────────────────────────
  if (currentScreen===5) {
    const canContinue = about.name&&about.idNum&&about.email&&about.phone
    return (
      <NScreen>
        <TopBar title="About you" step={screenList.indexOf(5)+1} total={totalScreens} onBack={goPrev} />
        <ProgressBar pct={((screenList.indexOf(5)+1)/totalScreens)*100} />
        <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:20 }} showsVerticalScrollIndicator={false}>
          {isRefinance
            ? <InfoBanner icon="⚡" title="Your details are pre-filled." body="As a Muḽo refinance client, we already have your information on file." />
            : (
              <View style={{ marginBottom:20 }}>
                <Text style={{ fontSize:14, color:C.muted, marginBottom:12, lineHeight:20 }}>
                  We need a few details to generate your quotes. Already have a Muḽo account?
                </Text>
                <View style={{ flexDirection:'row', gap:8, marginBottom:4 }}>
                  <Btn label="Sign in" variant="teal" onPress={()=>{}} style={{ flex:1 }} />
                  <Btn label="Register" variant="ghost" onPress={()=>{}} style={{ flex:1 }} />
                </View>
                <Text style={{ textAlign:'center', fontSize:12, color:C.muted, marginTop:8 }}>or continue as guest</Text>
                <View style={{ height:1, backgroundColor:C.border, marginVertical:16 }} />
              </View>
            )
          }
          <Field label="Full name" value={about.name} onChangeText={v=>setAbout(p=>({...p,name:v}))}
            placeholder="As it appears on your ID" readOnly={isRefinance&&!!about.name} autoCapitalize="words" />
          <Field label="SA ID number" value={about.idNum} onChangeText={v=>setAbout(p=>({...p,idNum:v}))}
            placeholder="13-digit ID number" keyboardType="numeric" readOnly={isRefinance&&!!about.idNum} />
          <Field label="Email address" value={about.email} onChangeText={v=>setAbout(p=>({...p,email:v}))}
            placeholder="for your policy documents" keyboardType="email-address" readOnly={isRefinance&&!!about.email} autoCapitalize="none" />
          <Field label="Mobile number" value={about.phone} onChangeText={v=>setAbout(p=>({...p,phone:v}))}
            placeholder="e.g. 0821234567" keyboardType="phone-pad" readOnly={isRefinance&&!!about.phone} />
          <View style={{ backgroundColor:C.subtle, borderRadius:10, padding:12, marginTop:8 }}>
            <Text style={{ fontSize:11, color:C.muted, lineHeight:18 }}>
              By continuing, you authorise Muḽo Financial Services (Pty) Ltd (FSP 49169) to obtain quotes from our panel insurers on your behalf in terms of FAIS. Your information is processed in line with POPIA.
            </Text>
          </View>
        </ScrollView>
        <BottomBar><Btn label="Get my quotes →" onPress={goNext} disabled={!canContinue} /></BottomBar>
      </NScreen>
    )
  }

  // ── SCREEN 6 — Quotes ──────────────────────────────────────────────────────
  if (currentScreen===6) {
    if (quotesLoading) return (
      <NScreen>
        <TopBar title="Your quotes" step={screenList.indexOf(6)+1} total={totalScreens} onBack={goPrev} />
        <ProgressBar pct={((screenList.indexOf(6)+1)/totalScreens)*100} />
        <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding:32, gap:16 }}>
          <Text style={{ fontSize:40 }}>⚡</Text>
          <Text style={{ fontSize:17, fontWeight:'700', color:C.white, textAlign:'center' }}>Fetching quotes from all insurers…</Text>
          <Text style={{ fontSize:13, color:C.muted, textAlign:'center' }}>
            Checking {selected.length} product{selected.length>1?'s':''} across our full panel
          </Text>
          <View style={{ width:'80%', height:4, backgroundColor:C.subtle, borderRadius:2, overflow:'hidden', marginTop:8 }}>
            <View style={{ height:4, backgroundColor:C.teal, borderRadius:2, width:'100%' }} />
          </View>
        </View>
      </NScreen>
    )

    return (
      <NScreen>
        <TopBar title="Your quotes" step={screenList.indexOf(6)+1} total={totalScreens} onBack={goPrev} />
        <ProgressBar pct={((screenList.indexOf(6)+1)/totalScreens)*100} />
        <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:20 }} showsVerticalScrollIndicator={false}>

          {/* Cashback tag */}
          <View style={{ backgroundColor:C.green+'18', borderRadius:12, padding:14, marginBottom:20, borderWidth:1, borderColor:C.green+'33' }}>
            <Text style={{ fontSize:14, fontWeight:'700', color:C.green }}>💸 Total cashback: R{totalCashback.toLocaleString()}</Text>
            <Text style={{ fontSize:12, color:C.muted, marginTop:4 }}>Your first month's premium back on every product selected</Text>
          </View>

          {/* Drive Score banner */}
          {driveScore&&selected.includes('CAR')&&(
            <View style={{ backgroundColor:C.teal+'18', borderRadius:12, padding:14, marginBottom:20, borderWidth:1, borderColor:C.teal+'33' }}>
              <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                <Text style={{ fontSize:13, fontWeight:'700', color:C.white }}>🚗 Your Muḽo Drive Score</Text>
                <Text style={{ fontSize:22, fontWeight:'800', color:C.teal }}>{driveScore.drive_score}/100</Text>
              </View>
              <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:6 }}>
                <View style={{ backgroundColor:C.teal, borderRadius:20, paddingHorizontal:10, paddingVertical:2 }}>
                  <Text style={{ fontSize:11, fontWeight:'700', color:C.navy }}>{driveScore.score_band}</Text>
                </View>
                <Text style={{ fontSize:12, color:C.muted }}>{driveScore.trip_count} trips · {driveScore.total_km?.toLocaleString()} km</Text>
              </View>
              {driveScore.premium_adjustment<0&&(
                <Text style={{ fontSize:13, color:C.green, fontWeight:'600' }}>
                  ✓ Your driving score reduced your car quotes by {Math.abs(Math.round(driveScore.premium_adjustment*100))}%
                </Text>
              )}
              <Text style={{ fontSize:11, color:C.muted, marginTop:6 }}>Powered by Muḽo Telematics · Tracker: {driveScore.tracker_source}</Text>
            </View>
          )}

          {/* Quotes per product */}
          {selected.map(code=>{
            const rawQuotes = MOCK_QUOTES[code]||[]
            const quotes = (driveScore&&code==='CAR'&&driveScore.premium_adjustment!==null)
              ? rawQuotes.map(q=>({...q,
                  premium:  Math.round(q.premium*(1+driveScore.premium_adjustment)),
                  cashback: Math.round(q.cashback*(1+driveScore.premium_adjustment)),
                  highlight: driveScore.premium_adjustment<0?(q.highlight?`${q.highlight} · Drive Score applied`:'Drive Score applied'):q.highlight,
                }))
              : rawQuotes
            const product  = PRODUCTS.find(p=>p.code===code)
            const selQuote = selectedQuotes[code]

            const aiExplainer = (insurer) => {
              if (insurer==='Naked Insurance') return 'Fully digital claims — average pay-out in 48 hours. No-call-centre policy management.'
              if (insurer==='King Price')      return 'Premium decreases monthly as your car depreciates — unique in the market.'
              if (insurer==='Pineapple')       return 'Peer-to-peer model. Unused premium goes back to you at year-end.'
              if (insurer==='Absa Insurance')  return 'Bundled with your Absa home loan for simplified debit order management.'
              return 'Established insurer with a national branch network for in-person claims support.'
            }

            return (
              <View key={code} style={{ marginBottom:28 }}>
                <Text style={s.sectionTitle}>{product?.icon} {product?.label}</Text>
                {quotes.map((q,i)=>{
                  const isChosen = selQuote?.insurer===q.insurer
                  return (
                    <TouchableOpacity key={i} onPress={()=>setSelectedQuotes(prev=>({...prev,[code]:q}))}
                      style={[s.quoteCard, isChosen&&{ borderColor:C.teal, backgroundColor:C.teal+'18' }]}
                      activeOpacity={0.8}>
                      {q.highlight&&(
                        <View style={{ marginBottom:8 }}>
                          <Badge label={q.highlight} color={i===0?C.green:C.teal} />
                        </View>
                      )}
                      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
                        <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
                          <Text style={{ fontSize:22 }}>{q.logo}</Text>
                          <View>
                            <Text style={{ fontSize:14, fontWeight:'600', color:C.white }}>{q.insurer}</Text>
                            <Text style={{ fontSize:11, color:C.muted }}>★ {q.rating} · Excess R{q.excess.toLocaleString()}</Text>
                          </View>
                        </View>
                        <View style={{ alignItems:'flex-end' }}>
                          <Text style={{ fontSize:18, fontWeight:'700', color:C.white }}>R{q.premium}/mo</Text>
                          <Text style={{ fontSize:11, color:C.green }}>+R{q.cashback} back</Text>
                        </View>
                      </View>
                      {/* AI explainer */}
                      <View style={{ marginTop:10, backgroundColor:'rgba(255,255,255,0.04)', borderRadius:8, padding:10 }}>
                        <Text style={{ fontSize:12, color:C.muted, lineHeight:18 }}>💡 {aiExplainer(q.insurer)}</Text>
                      </View>
                    </TouchableOpacity>
                  )
                })}
              </View>
            )
          })}
        </ScrollView>
        <BottomBar>
          <Text style={{ fontSize:13, color:C.muted, textAlign:'center', marginBottom:10 }}>
            Total: <Text style={{ color:C.white, fontWeight:'700' }}>R{totalPremium}/mo</Text> · Cashback: <Text style={{ color:C.green, fontWeight:'700' }}>R{totalCashback}</Text>
          </Text>
          <Btn label="Review my selection →" onPress={goNext} disabled={Object.keys(selectedQuotes).length===0} />
        </BottomBar>
      </NScreen>
    )
  }

  // ── SCREEN 7 — Review & confirm ────────────────────────────────────────────
  if (currentScreen===7) return (
    <NScreen>
      <TopBar title="Review & confirm" step={screenList.indexOf(7)+1} total={totalScreens} onBack={goPrev} />
      <ProgressBar pct={((screenList.indexOf(7)+1)/totalScreens)*100} />
      <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:20 }} showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor:C.green+'18', borderRadius:12, padding:14, marginBottom:20, borderWidth:1, borderColor:C.green+'33' }}>
          <Text style={{ fontSize:13, fontWeight:'600', color:C.green, marginBottom:4 }}>Cashback optimiser</Text>
          <Text style={{ fontSize:13, color:C.muted, lineHeight:20 }}>
            Your selections qualify for <Text style={{ color:C.green, fontWeight:'700' }}>R{totalCashback.toLocaleString()}</Text> cashback — that's your full first month's premium back, paid within 30 days of your policy start date.
          </Text>
        </View>

        {selected.map(code=>{
          const product = PRODUCTS.find(p=>p.code===code)
          const q = selectedQuotes[code]
          if (!q) return null
          return (
            <View key={code} style={[s.quoteCard,{marginBottom:10}]}>
              <Text style={{ fontSize:12, color:C.muted, marginBottom:2 }}>{product?.icon} {product?.label}</Text>
              <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
                <View>
                  <Text style={{ fontSize:15, fontWeight:'600', color:C.white }}>{q.insurer}</Text>
                  <Text style={{ fontSize:12, color:C.muted }}>Excess R{q.excess.toLocaleString()} · ★ {q.rating}</Text>
                </View>
                <View style={{ alignItems:'flex-end' }}>
                  <Text style={{ fontSize:16, fontWeight:'700', color:C.white }}>R{q.premium}/mo</Text>
                  <Text style={{ fontSize:11, color:C.green }}>+R{q.cashback} back</Text>
                </View>
              </View>
            </View>
          )
        })}

        <View style={[s.quoteCard,{marginTop:4}]}>
          <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:8 }}>
            <Text style={{ fontSize:14, color:C.muted }}>Total monthly premium</Text>
            <Text style={{ fontSize:15, fontWeight:'700', color:C.white }}>R{totalPremium}/mo</Text>
          </View>
          <View style={{ flexDirection:'row', justifyContent:'space-between', paddingTop:8, borderTopWidth:1, borderTopColor:C.border }}>
            <Text style={{ fontSize:14, color:C.green, fontWeight:'600' }}>Your cashback</Text>
            <Text style={{ fontSize:15, fontWeight:'700', color:C.green }}>R{totalCashback}</Text>
          </View>
        </View>

        <View style={{ marginTop:16, backgroundColor:C.subtle, borderRadius:10, padding:12 }}>
          <Text style={{ fontSize:12, color:C.muted, lineHeight:22 }}>
            📅 Cover start date: <Text style={{ color:C.white }}>1st of next month</Text>{'\n'}
            🔒 12-month lock-in applies. Pro-rata cashback clawback on early cancellation.{'\n'}
            📄 Policy documents delivered by email + WhatsApp on sign-up.
          </Text>
        </View>
      </ScrollView>
      <BottomBar><Btn label="Set up debit order →" onPress={goNext} /></BottomBar>
    </NScreen>
  )

  // ── SCREEN 8 — Debit order & sign ─────────────────────────────────────────
  if (currentScreen===8) {
    const canSign = debit.bank&&debit.accountNumber&&debit.signed
    return (
      <NScreen>
        <TopBar title="Debit order & sign" step={screenList.indexOf(8)+1} total={totalScreens} onBack={goPrev} />
        <ProgressBar pct={((screenList.indexOf(8)+1)/totalScreens)*100} />
        <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:20 }} showsVerticalScrollIndicator={false}>
          {isRefinance&&debit.bank&&<InfoBanner icon="⚡" title="Bank details pre-filled from TruID." />}

          <Text style={s.sectionTitle}>Debit order details</Text>
          <Chips label="Bank" value={debit.bank} onChange={v=>setDebit(p=>({...p,bank:v}))}
            options={[{value:'FNB',label:'FNB'},{value:'Absa',label:'Absa'},{value:'Standard Bank',label:'Std Bank'},{value:'Nedbank',label:'Nedbank'},{value:'Capitec',label:'Capitec'},{value:'Investec',label:'Investec'},{value:'TymeBank',label:'TymeBank'}]} />
          <Field label="Account number" value={debit.accountNumber} onChangeText={v=>setDebit(p=>({...p,accountNumber:v}))}
            placeholder="Your account number" keyboardType="numeric" readOnly={isRefinance&&!!debit.accountNumber} />
          <Chips label="Account type" value={debit.accountType} onChange={v=>setDebit(p=>({...p,accountType:v}))}
            options={[{value:'Cheque',label:'Cheque/Current'},{value:'Savings',label:'Savings'}]} />
          <Chips label="Debit date" value={debit.debitDay} onChange={v=>setDebit(p=>({...p,debitDay:v}))}
            options={['1','5','10','15','20','25','30'].map(d=>({value:d,label:`${d}${d==='1'?'st':d==='5'?'th':d==='10'?'th':d==='15'?'th':d==='20'?'th':d==='25'?'th':'th'} of month`}))} />

          <View style={{ height:1, backgroundColor:C.border, marginVertical:20 }} />

          <Text style={s.sectionTitle}>Policy acceptance</Text>
          <View style={[s.quoteCard,{marginBottom:16}]}>
            <Text style={{ fontSize:12, color:C.muted, lineHeight:20 }}>
              I, <Text style={{ color:C.white }}>{about.name||'the client'}</Text>, hereby authorise Muḽo Financial Services (Pty) Ltd (FSP 49169) to debit my account with <Text style={{ color:C.white }}>R{totalPremium}/month</Text> for the selected insurance products, commencing on the <Text style={{ color:C.white }}>{debit.debitDay}</Text> of next month. I confirm I have read and understood the policy terms and conditions. This constitutes a valid electronic mandate in terms of the National Payment System Act.
            </Text>
          </View>

          <TouchableOpacity onPress={()=>setDebit(p=>({...p,signed:!p.signed}))}
            style={[s.signBox, debit.signed&&{ backgroundColor:C.green+'18', borderColor:C.green }]}>
            <View style={[s.checkbox, debit.signed&&{ backgroundColor:C.green, borderColor:C.green }]}>
              {debit.signed&&<Text style={{ color:C.navy, fontWeight:'700', fontSize:14 }}>✓</Text>}
            </View>
            <Text style={{ fontSize:13, color:C.muted, flex:1, lineHeight:20 }}>
              I sign this mandate electronically via SigniFlow and agree to the terms above. I understand this is a legally binding digital signature.
            </Text>
          </TouchableOpacity>

          <Text style={{ fontSize:11, color:C.muted, marginTop:12 }}>
            Muḽo Financial Services (Pty) Ltd · FSP 49169 · Authorised Financial Services Provider
          </Text>
        </ScrollView>
        <BottomBar><Btn label="Bind my policies →" onPress={goNext} disabled={!canSign} /></BottomBar>
      </NScreen>
    )
  }

  // ── SCREEN 9 — You're covered ──────────────────────────────────────────────
  if (currentScreen===9) {
    const policyRef = `MFS-${Date.now().toString(36).toUpperCase().slice(-6)}`
    return (
      <NScreen>
        <TopBar title="You're covered" onBack={null} />
        <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:20 }} showsVerticalScrollIndicator={false}>
          <View style={{ alignItems:'center', paddingVertical:32 }}>
            <Text style={{ fontSize:64, marginBottom:16 }}>🎉</Text>
            <Text style={{ fontSize:24, fontWeight:'700', color:C.white, marginBottom:8 }}>Welcome aboard!</Text>
            <Text style={{ fontSize:14, color:C.muted, textAlign:'center', lineHeight:22, marginBottom:24 }}>
              Your {selected.length} polic{selected.length>1?'ies are':'y is'} now active.
              Policy documents are on their way to {about.email||'your email'}.
            </Text>
          </View>

          <View style={{ backgroundColor:C.green+'18', borderRadius:14, padding:18, marginBottom:20, borderWidth:1, borderColor:C.green+'33' }}>
            <Text style={{ fontSize:13, color:C.green, fontWeight:'600', marginBottom:6 }}>💸 Your cashback</Text>
            <Text style={{ fontSize:32, fontWeight:'700', color:C.white }}>R{totalCashback.toLocaleString()}</Text>
            <Text style={{ fontSize:13, color:C.muted, marginTop:4 }}>
              Paid to your debit order account within 30 days of your policy start date.
            </Text>
          </View>

          <Text style={s.sectionTitle}>Your policies</Text>
          {selected.map(code=>{
            const product = PRODUCTS.find(p=>p.code===code)
            const q = selectedQuotes[code]
            if (!q) return null
            return (
              <View key={code} style={[s.quoteCard,{marginBottom:8}]}>
                <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
                  <View>
                    <Text style={{ fontSize:13, fontWeight:'600', color:C.white }}>{product?.icon} {product?.label}</Text>
                    <Text style={{ fontSize:12, color:C.muted }}>{q.insurer}</Text>
                  </View>
                  <View style={{ alignItems:'flex-end' }}>
                    <Text style={{ fontSize:14, fontWeight:'600', color:C.white }}>R{q.premium}/mo</Text>
                    <Badge label="Active" color={C.green} />
                  </View>
                </View>
              </View>
            )
          })}

          <View style={[s.quoteCard,{marginTop:8,marginBottom:20}]}>
            <Text style={{ fontSize:13, fontWeight:'600', color:C.white, marginBottom:10 }}>What happens next</Text>
            {[
              ['📧',`Policy documents emailed to ${about.email||'you'}`],
              ['📱','Policy schedule sent via WhatsApp'],
              ['💳',`First debit on ${debit.debitDay}${debit.debitDay==='1'?'st':'th'} of next month: R${totalPremium}`],
              ['💸',`Cashback R${totalCashback} paid within 30 days`],
              ['🔄',"We'll re-quote all insurers at 12 months"],
            ].map(([icon,text],i)=>(
              <View key={i} style={{ flexDirection:'row', gap:10, alignItems:'flex-start', marginBottom:8 }}>
                <Text style={{ fontSize:16 }}>{icon}</Text>
                <Text style={{ fontSize:13, color:C.muted, flex:1, lineHeight:20 }}>{text}</Text>
              </View>
            ))}
          </View>

          {isRefinance&&(
            <View style={{ backgroundColor:C.teal+'18', borderRadius:12, padding:14, marginBottom:20, borderWidth:1, borderColor:C.teal+'33' }}>
              <Text style={{ fontSize:13, fontWeight:'600', color:C.teal, marginBottom:6 }}>Also on Muḽo</Text>
              <Text style={{ fontSize:13, color:C.muted, marginBottom:12, lineHeight:20 }}>
                Based on your property equity and income profile, you may qualify for a refinance of up to R{((client?.property?.buildingValue||2800000)*0.25).toLocaleString()}.
              </Text>
              <Btn label="Explore refinancing →" variant="ghost" onPress={onBack} />
            </View>
          )}

          <View style={{ alignItems:'center', paddingBottom:24 }}>
            <Text style={{ fontSize:11, color:C.muted }}>Policy ref: {policyRef}</Text>
            <Text style={{ fontSize:11, color:C.muted, marginTop:2 }}>Muḽo Financial Services (Pty) Ltd · FSP 49169</Text>
          </View>
        </ScrollView>
      </NScreen>
    )
  }

  return null
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  topBar:          { flexDirection:'row', alignItems:'center', padding:16, paddingTop:8, borderBottomWidth:1, borderBottomColor:C.border, gap:12 },
  backBtn:         { width:40, height:40, alignItems:'center', justifyContent:'center' },
  backText:        { fontSize:22, color:C.muted },
  topBarTitle:     { fontSize:16, fontWeight:'600', color:C.white },
  topBarSub:       { fontSize:11, color:C.muted, marginTop:2 },
  topBarBrand:     { fontSize:12, color:C.teal, fontWeight:'600' },
  btn:             { borderRadius:14, padding:18, alignItems:'center', width:'100%' },
  btnText:         { fontSize:15, fontWeight:'700' },
  bottomBar:       { padding:20, paddingBottom:32, borderTopWidth:1, borderTopColor:C.border, backgroundColor:C.navy },
  fieldLabel:      { fontSize:12, color:C.muted, fontWeight:'500', marginBottom:6, letterSpacing:0.3 },
  fieldHint:       { fontSize:11, color:C.muted, marginTop:4 },
  input:           { backgroundColor:C.navyLight, borderWidth:1, borderColor:C.border, borderRadius:10, padding:14, color:C.white, fontSize:15 },
  chip:            { backgroundColor:C.navyLight, borderWidth:1, borderColor:C.border, borderRadius:20, paddingHorizontal:16, paddingVertical:8, marginRight:8 },
  chipActive:      { backgroundColor:C.teal, borderColor:C.teal },
  chipText:        { fontSize:13, color:C.white, fontWeight:'500' },
  productCard:     { backgroundColor:C.navyLight, borderWidth:1.5, borderColor:C.border, borderRadius:12, padding:14, marginBottom:10, flexDirection:'row', alignItems:'center', gap:14 },
  productCardTitle:{ fontSize:15, fontWeight:'600', color:C.white },
  productCardDesc: { fontSize:12, color:C.muted, marginTop:2 },
  checkCircle:     { width:22, height:22, borderRadius:11, borderWidth:2, borderColor:C.border, alignItems:'center', justifyContent:'center' },
  quoteCard:       { backgroundColor:C.navyLight, borderWidth:1, borderColor:C.border, borderRadius:12, padding:14, marginBottom:8 },
  sectionTitle:    { fontSize:13, fontWeight:'700', color:C.muted, textTransform:'uppercase', letterSpacing:1, marginBottom:12 },
  infoBanner:      { borderWidth:1, borderRadius:12, padding:12, marginBottom:16, flexDirection:'row', gap:10, alignItems:'flex-start' },
  infoBannerTitle: { fontSize:13, fontWeight:'600', marginBottom:2 },
  infoBannerBody:  { fontSize:12, color:C.muted, lineHeight:18 },
  signBox:         { flexDirection:'row', gap:12, backgroundColor:C.subtle, borderWidth:1.5, borderColor:C.border, borderRadius:10, padding:14, alignItems:'flex-start' },
  checkbox:        { width:22, height:22, borderRadius:4, borderWidth:2, borderColor:C.border, alignItems:'center', justifyContent:'center', flexShrink:0 },
  idCard:          { backgroundColor:C.navyLight, borderRadius:14, padding:20, marginBottom:24, borderWidth:1, borderColor:C.border, alignItems:'center' },
  idCardLabel:     { fontSize:11, color:C.muted, marginBottom:8, textTransform:'uppercase', letterSpacing:1 },
  idCardNumber:    { fontSize:22, fontWeight:'800', color:C.white, letterSpacing:3 },
  idCardSub:       { fontSize:11, color:C.muted, marginTop:6 },
  waCard:          { backgroundColor:C.wa+'18', borderRadius:12, padding:14, borderWidth:1, borderColor:C.wa+'33', flexDirection:'row', alignItems:'center', gap:12 },
  waIcon:          { width:44, height:44, borderRadius:22, backgroundColor:C.wa, alignItems:'center', justifyContent:'center' },
  otpBox:          { width:44, height:56, borderRadius:12, borderWidth:2, textAlign:'center', fontSize:22, fontWeight:'700', color:C.white, backgroundColor:C.navyLight },
  checkRow:        { flexDirection:'row', alignItems:'center', gap:12, paddingVertical:10, borderBottomWidth:1, borderBottomColor:C.border },
  checkIcon:       { width:28, height:28, borderRadius:14, borderWidth:1.5, borderColor:C.border, alignItems:'center', justifyContent:'center' },
})
