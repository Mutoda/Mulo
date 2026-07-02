/**
 * Muḽo Refinance — RefinanceNative.jsx
 * Full 14-screen home loan refinance journey for React Native
 * Faithful port of web App.jsx refinance flow
 *
 * Screens:
 * 0.  Landing
 * 1.  ID Verify (SA ID + Luhn + DHA check + fraud warning)
 * 2.  Phone (WhatsApp number)
 * 3.  OTP (6-box WhatsApp OTP)
 * 4.  Signup (email + password)
 * 5.  Consent (TruID · TransUnion · Lightstone)
 * 6.  Loading (bureau orchestration)
 * 7.  Bond Confirm (Lightstone property data)
 * 8.  Bank Account (TruID-verified account)
 * 9.  Offer (Muḽo Score + SHAP + debt breakdown)
 * 10. Doc Upload (payslip + proof of address)
 * 11. Face Liveness (Smile ID)
 * 12. Loan Sign (e-signature)
 * 13. Conveyancing
 * 14. Dashboard (settlement tracker + tranches)
 */

import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Switch, Alert,
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
  lightBg:   '#F0F4F8',
  cardBg:    '#FFFFFF',
  textDark:  '#0A1628',
  textMid:   '#8FA3BE',
  textLight: '#C5D0DC',
  wa:        '#25D366',
}

// Demo data
const DEMO = {
  firstName:     'Thabo',
  lastName:      'Nkosi',
  idNumber:      '8301015009087',
  phone:         '0821234567',
  property:      '34 Jacaranda Avenue, Kempton Park Ext 2',
  bondHolder:    'Absa Home Loans',
  propertyValue: 1850000,
  bondBalance:   1070000,
  loanAmount:    517500,
  rate:          '11.25% p.a. (Prime − 0.5%)',
  term:          60,
  monthly:       7543,
  saving:        4260,
  muloScore:     82,
  bank:          'Absa',
  accountNum:    '••• ••• 2847',
  debts: [
    { label:'Wesbank vehicle finance',    balance:128500, rate:18.5, monthly:3200 },
    { label:'African Bank personal loan', balance:125000, rate:24.0, monthly:3100 },
    { label:'Capitec credit card',        balance:48000,  rate:22.5, monthly:1400 },
    { label:'FNB personal loan',          balance:62000,  rate:20.0, monthly:1800 },
  ]
}

// SA ID validator
function validateSAID(id) {
  if (!/^\d{13}$/.test(id)) return { valid:false, error:'Must be exactly 13 digits' }
  const yy=parseInt(id.slice(0,2)), mm=parseInt(id.slice(2,4)), dd=parseInt(id.slice(4,6))
  const citizen=parseInt(id.slice(10,11))
  const year = yy<=new Date().getFullYear()%100 ? 2000+yy : 1900+yy
  const dob = new Date(year,mm-1,dd)
  if (mm<1||mm>12||dd<1||dd>31||dob.getMonth()!==mm-1)
    return { valid:false, error:'Invalid date of birth in ID number' }
  const age = new Date().getFullYear()-dob.getFullYear()
  if (age<18) return { valid:false, error:'Applicant must be 18 or older' }
  if (citizen!==0&&citizen!==1) return { valid:false, error:'Invalid citizenship digit' }
  let sum=0
  for(let i=0;i<12;i++){let d=parseInt(id[i]);if(i%2===1){d*=2;if(d>9)d-=9}sum+=d}
  if((10-(sum%10))%10!==parseInt(id[12])) return { valid:false, error:'Checksum failed — check your ID number' }
  const gender=parseInt(id.slice(6,10))>=5000?'Male':'Female'
  const dobFmt=dob.toLocaleDateString('en-ZA',{day:'numeric',month:'long',year:'numeric'})
  return { valid:true, dob:dobFmt, age, gender, citizen:citizen===0?'SA Citizen':'Permanent Resident' }
}

// Shared components
const NScreen = ({ children, bg=C.navy }) => (
  <SafeAreaView style={{ flex:1, backgroundColor:bg }} edges={['top']}>
    <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS==='ios'?'padding':undefined}>
      {children}
    </KeyboardAvoidingView>
  </SafeAreaView>
)

const TopBar = ({ title, step, total, onBack }) => (
  <View style={s.topBar}>
    {onBack
      ? <TouchableOpacity onPress={onBack} style={s.backBtn}><Text style={s.backText}>←</Text></TouchableOpacity>
      : <View style={{ width:40 }} />
    }
    <View style={{ flex:1 }}>
      <Text style={s.topTitle}>{title}</Text>
      {step ? <Text style={s.topSub}>Step {step} of {total}</Text> : null}
    </View>
  </View>
)

const Progress = ({ pct }) => (
  <View style={{ height:3, backgroundColor:C.subtle }}>
    <View style={{ height:3, backgroundColor:C.teal, width:pct+'%' }} />
  </View>
)

const Btn = ({ label, onPress, disabled=false, color=C.green }) => (
  <TouchableOpacity onPress={onPress} disabled={disabled}
    style={[s.btn, { backgroundColor:color, opacity:disabled?0.4:1 }]}>
    <Text style={[s.btnText, { color:color===C.green?C.navy:C.white }]}>{label}</Text>
  </TouchableOpacity>
)

const BtnGhost = ({ label, onPress }) => (
  <TouchableOpacity onPress={onPress} style={s.btnGhost}>
    <Text style={s.btnGhostText}>{label}</Text>
  </TouchableOpacity>
)

const BottomBar = ({ children }) => (
  <View style={s.bottomBar}>{children}</View>
)

const Field = ({ label, value, onChangeText, placeholder, keyboardType='default',
  secureTextEntry=false, readOnly=false, maxLength, autoCapitalize='sentences', hint, error }) => (
  <View style={{ marginBottom:16 }}>
    <Text style={s.fieldLabel}>{label}</Text>
    <TextInput value={value} onChangeText={readOnly?undefined:onChangeText}
      placeholder={placeholder} placeholderTextColor={C.muted}
      keyboardType={keyboardType} secureTextEntry={secureTextEntry}
      editable={!readOnly} maxLength={maxLength} autoCapitalize={autoCapitalize}
      style={[s.input, error&&{ borderColor:C.danger }, readOnly&&{ opacity:0.6 }]} />
    {hint&&<Text style={s.fieldHint}>{hint}</Text>}
    {error&&<Text style={[s.fieldHint,{ color:C.danger }]}>{error}</Text>}
  </View>
)

const Card = ({ children, style }) => (
  <View style={[s.card, style]}>{children}</View>
)

const CheckRow = ({ label, sub, status }) => (
  <View style={s.checkRow}>
    <View style={[s.checkIcon,
      status==='ok'&&{ backgroundColor:C.green+'22', borderColor:C.green },
      status==='loading'&&{ backgroundColor:C.teal+'22', borderColor:C.teal },
    ]}>
      <Text style={{ fontSize:12, color:status==='ok'?C.green:status==='loading'?C.teal:C.muted }}>
        {status==='ok'?'✓':status==='loading'?'⟳':'○'}
      </Text>
    </View>
    <View style={{ flex:1 }}>
      <Text style={{ fontSize:13, color:C.white, fontWeight:'500' }}>{label}</Text>
      {sub?<Text style={{ fontSize:11, color:C.muted, marginTop:2 }}>{sub}</Text>:null}
    </View>
    {status==='ok'&&<Text style={{ fontSize:11, color:C.green, fontWeight:'600' }}>Passed</Text>}
    {status==='loading'&&<Text style={{ fontSize:11, color:C.teal, fontWeight:'600' }}>Checking…</Text>}
  </View>
)

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function RefinanceNative() {
  const [screen, setScreen] = useState('landing')
  const go = (s) => setScreen(s)

  // Auth state
  const [idNum, setIdNum]           = useState('')
  const [firstName, setFirstName]   = useState('')
  const [lastName, setLastName]     = useState('')
  const [phone, setPhone]           = useState('')
  const [email, setEmail]           = useState('')
  const [pass, setPass]             = useState('')
  const [passConfirm, setPassConfirm] = useState('')
  const [showPass, setShowPass]     = useState(false)
  const [otp, setOtp]               = useState(['','','','','',''])
  const [idPhase, setIdPhase]       = useState('idle')
  const [idValidation, setIdValidation] = useState(null)
  const [otpPhase, setOtpPhase]     = useState('idle')
  const [otpTimer, setOtpTimer]     = useState(59)
  const [showFraud, setShowFraud]   = useState(false)
  const [idChecks, setIdChecks]     = useState([
    { label:'Valid SA ID format',  sub:'13 digits · Luhn checksum · Date of birth', status:'wait' },
    { label:'Homeowner status',    sub:'Deeds Office verification', status:'wait' },
    { label:'No sequestration',    sub:'Master of High Court check', status:'wait' },
  ])
  const otpRefs = useRef([])

  // Consent toggles
  const [consentTruId, setConsentTruId]     = useState(false)
  const [consentTransUnion, setConsentTransUnion] = useState(false)
  const [consentLightstone, setConsentLightstone] = useState(false)
  const [consentPopia, setConsentPopia]     = useState(false)
  const allConsented = consentTruId&&consentTransUnion&&consentLightstone&&consentPopia

  // Loading phase
  const [loadStep, setLoadStep]     = useState(0)
  const [loadDone, setLoadDone]     = useState(false)

  // OTP timer
  useEffect(() => {
    if (screen!=='otp'||otpTimer<=0) return
    const t = setTimeout(()=>setOtpTimer(s=>s-1),1000)
    return ()=>clearTimeout(t)
  }, [screen,otpTimer])

  // Loading automation
  useEffect(() => {
    if (screen!=='loading') return
    setLoadStep(0); setLoadDone(false)
    const steps = [1200,2200,3000,3800,4500,5200]
    const timers = steps.map((ms,i)=>setTimeout(()=>setLoadStep(i+1),ms))
    setTimeout(()=>{ setLoadDone(true) },6000)
    return ()=>timers.forEach(clearTimeout)
  }, [screen])

  // ── LANDING ────────────────────────────────────────────────────────────────
  if (screen==='landing') return (
    <NScreen>
      <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:24 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:32, marginTop:8 }}>
          <View>
            <Text style={{ fontSize:28, fontWeight:'800', color:C.white }}>Mu<Text style={{ color:C.teal }}>ḽ</Text>o</Text>
            <Text style={{ fontSize:11, color:C.muted }}>refinance</Text>
          </View>
          <TouchableOpacity onPress={()=>go('id-verify')}>
            <Text style={{ fontSize:13, color:C.teal, fontWeight:'600' }}>Sign in →</Text>
          </TouchableOpacity>
        </View>

        <View style={{ backgroundColor:C.teal+'18', borderRadius:20, paddingHorizontal:12, paddingVertical:6, alignSelf:'flex-start', marginBottom:16 }}>
          <Text style={{ fontSize:12, color:C.teal, fontWeight:'600' }}>🇿🇦 South Africa's #1 Refinance Platform</Text>
        </View>

        <Text style={{ fontSize:26, fontWeight:'800', color:C.white, lineHeight:34, marginBottom:12 }}>
          The smart way to{'\n'}<Text style={{ fontStyle:'italic', color:C.teal }}>refinance and settle expensive debt.</Text>
        </Text>
        <Text style={{ fontSize:14, color:C.muted, lineHeight:22, marginBottom:32 }}>
          Use your home's equity to pay off expensive debt at a lower interest rate — fully digital, in under 5 minutes.
        </Text>

        <View style={{ flexDirection:'row', gap:10, marginBottom:32 }}>
          {[['R2.8B+','Refinanced'],['5 min','Avg. approval'],['98%','Satisfaction']].map(([v,l])=>(
            <View key={l} style={{ flex:1, backgroundColor:C.navyLight, borderRadius:12, padding:12, borderWidth:1, borderColor:C.border, alignItems:'center' }}>
              <Text style={{ fontSize:17, fontWeight:'800', color:C.teal }}>{v}</Text>
              <Text style={{ fontSize:10, color:C.muted, marginTop:4, textAlign:'center' }}>{l}</Text>
            </View>
          ))}
        </View>

        <Text style={{ fontSize:14, fontWeight:'700', color:C.white, marginBottom:16 }}>How it works</Text>
        {[
          ['1','Verify your identity','Enter your SA ID — we check homeowner status instantly'],
          ['2','Connect your data','TruID · TransUnion · Lightstone — secure & read-only'],
          ['3','Get your offer','See your equity loan offer in under 5 minutes'],
          ['4','Settle your debt','Funds disbursed to your account. One simple repayment.'],
        ].map(([n,t,sub])=>(
          <View key={n} style={{ flexDirection:'row', gap:14, marginBottom:16, alignItems:'flex-start' }}>
            <View style={{ width:32, height:32, borderRadius:10, backgroundColor:C.teal+'22', borderWidth:1, borderColor:C.teal+'44', alignItems:'center', justifyContent:'center' }}>
              <Text style={{ fontSize:14, fontWeight:'700', color:C.teal }}>{n}</Text>
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ fontSize:14, fontWeight:'600', color:C.white, marginBottom:4 }}>{t}</Text>
              <Text style={{ fontSize:12, color:C.muted, lineHeight:18 }}>{sub}</Text>
            </View>
          </View>
        ))}

        <View style={{ flexDirection:'row', justifyContent:'space-around', marginTop:8, paddingTop:20, borderTopWidth:1, borderTopColor:C.border, marginBottom:24 }}>
          {[['🔒','NCR Compliant'],['🏦','FSCA Registered'],['⚡','256-bit SSL']].map(([i,l])=>(
            <View key={l} style={{ alignItems:'center', gap:4 }}>
              <Text style={{ fontSize:18 }}>{i}</Text>
              <Text style={{ fontSize:10, color:C.muted, fontWeight:'600' }}>{l}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <BottomBar>
        <Btn label="Check if you qualify →" onPress={()=>go('id-verify')} />
        <Text style={{ textAlign:'center', fontSize:11, color:C.muted, marginTop:10 }}>No credit check · Takes 5 minutes · Free to apply</Text>
      </BottomBar>
    </NScreen>
  )

  // ── ID VERIFY ──────────────────────────────────────────────────────────────
  if (screen==='id-verify') {
    const handleIdChange = val => {
      const cleaned = val.replace(/\D/g,'').slice(0,13)
      setIdNum(cleaned)
      setIdPhase('idle'); setIdValidation(null)
      setIdChecks(c=>c.map(x=>({...x,status:'wait'})))
      if (cleaned.length===13) {
        const r = validateSAID(cleaned)
        setIdValidation(r)
        if (!r.valid) setIdPhase('invalid')
      }
    }

    const handleCheck = async () => {
      const r = validateSAID(idNum)
      if (!r.valid) { setIdPhase('invalid'); setIdValidation(r); return }
      setIdPhase('checking')
      setIdChecks(c=>c.map((x,i)=>i===0?{...x,status:'loading'}:x))
      try {
        await fetch(`${API}/verify-id`,{
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({id_number:idNum})
        })
        setIdChecks(c=>c.map((x,i)=>i===0?{...x,status:'ok',sub:`DOB: ${r.dob} · ${r.gender}`}:x))
        setTimeout(()=>{
          setIdChecks(c=>c.map((x,i)=>i===1?{...x,status:'loading'}:x))
          setTimeout(()=>{
            setIdChecks(c=>c.map((x,i)=>i===1?{...x,status:'ok'}:x))
            setTimeout(()=>{
              setIdChecks(c=>c.map((x,i)=>i===2?{...x,status:'loading'}:x))
              setTimeout(()=>{
                setIdChecks(c=>c.map((x,i)=>i===2?{...x,status:'ok'}:x))
                setIdPhase('done')
              },900)
            },400)
          },900)
        },400)
      } catch(err) {
        setIdPhase('invalid')
        setIdValidation({ valid:false, error:err.message })
        setIdChecks(c=>c.map(x=>({...x,status:'wait'})))
      }
    }

    const formatted = idNum ? `${idNum.slice(0,6)} ${idNum.slice(6,10)} ${idNum.slice(10)}` : '000000 0000 000'

    if (showFraud) return (
      <NScreen>
        <ScrollView contentContainerStyle={{ padding:24, paddingTop:60 }}>
          <View style={{ width:56, height:56, borderRadius:16, backgroundColor:'#FFF3F0', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
            <Text style={{ fontSize:28 }}>⚠️</Text>
          </View>
          <Text style={{ fontSize:18, fontWeight:'700', color:C.white, marginBottom:12 }}>Important notice</Text>
          <Text style={{ fontSize:14, color:C.muted, lineHeight:22, marginBottom:12 }}>
            By continuing, you confirm that you are applying using <Text style={{ color:C.white, fontWeight:'600' }}>your own South African ID number</Text>.
          </Text>
          <View style={{ backgroundColor:C.navyLight, borderRadius:12, padding:16, marginBottom:12, alignItems:'center' }}>
            <Text style={{ fontSize:18, fontWeight:'700', color:C.white, letterSpacing:3 }}>{idNum}</Text>
          </View>
          <Text style={{ fontSize:13, color:C.muted, lineHeight:22, marginBottom:24 }}>
            Entering another person's ID number constitutes <Text style={{ color:C.danger, fontWeight:'600' }}>identity fraud</Text> and is a criminal offence under the Cybercrimes Act 19 of 2020. Muḽo reports all suspected fraud to the SAPS.
          </Text>
          <Btn label="I confirm this is my ID — continue →" onPress={()=>{ setShowFraud(false); go('phone') }} />
          <View style={{ height:12 }} />
          <BtnGhost label="← Go back and re-enter ID" onPress={()=>setShowFraud(false)} />
        </ScrollView>
      </NScreen>
    )

    return (
      <NScreen>
        <TopBar title="Verify your identity" step={1} total={6} onBack={()=>go('landing')} />
        <Progress pct={16} />
        <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:20 }} showsVerticalScrollIndicator={false}>
          {/* ID card graphic */}
          <View style={s.idCard}>
            <Text style={s.idCardLabel}>South African ID Number</Text>
            <Text style={s.idCardNumber}>{formatted}</Text>
            {idValidation?.valid&&(
              <Text style={s.idCardSub}>🎂 {idValidation.dob} · {idValidation.gender}</Text>
            )}
            <Text style={{ fontSize:24, marginTop:8 }}>🇿🇦</Text>
          </View>

          <Field label="SA ID Number" value={idNum} onChangeText={handleIdChange}
            placeholder="e.g. 8001015009087" keyboardType="numeric" maxLength={13} autoCapitalize="none"
            error={idPhase==='invalid'&&idValidation?'✕ '+idValidation.error:null}
            hint={idNum.length>0&&idNum.length<13?idNum.length+'/13 digits':idValidation?.valid?'✓ Valid · DOB '+idValidation.dob+' · '+idValidation.gender:null} />

          {idNum.length===13&&idValidation?.valid&&(
            <View style={{ flexDirection:'row', gap:10 }}>
              <View style={{ flex:1 }}>
                <Field label="First name" value={firstName} onChangeText={setFirstName}
                  placeholder="e.g. Thabo" autoCapitalize="words" />
              </View>
              <View style={{ flex:1 }}>
                <Field label="Last name" value={lastName} onChangeText={setLastName}
                  placeholder="e.g. Nkosi" autoCapitalize="words" />
              </View>
            </View>
          )}

          {(idPhase==='checking'||idPhase==='done')&&(
            <View style={{ marginTop:8 }}>
              <Text style={s.sectionTitle}>Database checks</Text>
              {idChecks.map((c,i)=><CheckRow key={i} {...c} />)}
            </View>
          )}

          {idPhase==='done'&&(
            <View style={{ backgroundColor:C.green+'18', borderRadius:14, padding:16, marginTop:16, borderWidth:1, borderColor:C.green+'33' }}>
              <Text style={{ fontSize:18, marginBottom:8 }}>🏡</Text>
              <Text style={{ fontSize:14, fontWeight:'700', color:C.white, marginBottom:4 }}>Homeowner confirmed</Text>
              <Text style={{ fontSize:12, color:C.muted }}>
                {firstName||'Thabo'} {lastName||'Nkosi'} · Kempton Park, Gauteng{'\n'}Next: verify it's really you
              </Text>
            </View>
          )}
        </ScrollView>
        <BottomBar>
          {idPhase!=='done'
            ? <Btn label={idPhase==='checking'?'Verifying…':'Verify my ID →'}
                onPress={handleCheck}
                disabled={idNum.length<13||idPhase==='invalid'||idPhase==='checking'} />
            : <Btn label="Continue to authentication →"
                onPress={()=>setShowFraud(true)}
                disabled={!firstName.trim()||!lastName.trim()} />
          }
        </BottomBar>
      </NScreen>
    )
  }

  // ── PHONE ──────────────────────────────────────────────────────────────────
  if (screen==='phone') {
    const digits = phone.replace(/\D/g,'')
    const valid = digits.length===9||digits.length===10

    const handleContinue = async () => {
      if (!valid) return
      const normalized = digits.startsWith('0') ? digits : '0'+digits
      setPhone(normalized)
      try {
        await fetch(`${API}/otp/send`,{
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({cellphone:normalized, id_number:idNum})
        })
      } catch(e) {}
      setOtpTimer(59)
      setOtp(['','','','','',''])
      go('otp')
    }

    return (
      <NScreen>
        <TopBar title="Your WhatsApp number" step={2} total={6} onBack={()=>go('id-verify')} />
        <Progress pct={33} />
        <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:20 }} showsVerticalScrollIndicator={false}>
          <Text style={{ fontSize:15, fontWeight:'600', color:C.white, marginBottom:6 }}>Enter your WhatsApp number</Text>
          <Text style={{ fontSize:13, color:C.muted, marginBottom:24, lineHeight:20 }}>
            We'll send a one-time verification code to this number via WhatsApp.
          </Text>
          <View style={{ marginBottom:16 }}>
            <Text style={s.fieldLabel}>WhatsApp number</Text>
            <View style={{ flexDirection:'row', alignItems:'center', backgroundColor:C.navyLight, borderWidth:1, borderColor:valid?C.wa:C.border, borderRadius:10, overflow:'hidden' }}>
              <View style={{ paddingHorizontal:14, paddingVertical:14, borderRightWidth:1, borderRightColor:C.border }}>
                <Text style={{ fontSize:15, color:C.white, fontWeight:'600' }}>🇿🇦 +27</Text>
              </View>
              <TextInput value={phone.replace(/^0/,'')} onChangeText={setPhone}
                placeholder="82 123 4567" placeholderTextColor={C.muted}
                keyboardType="phone-pad"
                style={{ flex:1, padding:14, color:C.white, fontSize:15 }} />
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

  // ── OTP ────────────────────────────────────────────────────────────────────
  if (screen==='otp') {
    const code = otp.join('')
    const allFilled = otp.every(Boolean)

    const handleDigit = (i,val) => {
      const v = val.replace(/\D/g,'').slice(-1)
      const next=[...otp]; next[i]=v; setOtp(next)
      setOtpPhase('idle')
      if (v&&i<5) otpRefs.current[i+1]?.focus()
    }
    const handleKey = (i,e) => {
      if (e.nativeEvent.key==='Backspace'&&!otp[i]&&i>0) otpRefs.current[i-1]?.focus()
    }

    const verify = async () => {
      if (code.length<6) return
      setOtpPhase('checking')
      try {
        const res = await fetch(`${API}/otp/verify`,{
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({id_number:idNum, otp:code})
        })
        const data = await res.json()
        if (data.verified) {
          setOtpPhase('done')
          setTimeout(()=>go('signup'),900)
        } else {
          setOtpPhase('error')
          setOtp(['','','','','',''])
          otpRefs.current[0]?.focus()
        }
      } catch {
        setOtpPhase('error')
        setOtp(['','','','','',''])
        otpRefs.current[0]?.focus()
      }
    }

    const phoneDisplay = phone ? '+27 '+phone.replace(/^0/,'') : ''

    return (
      <NScreen>
        <TopBar title="WhatsApp verification" step={2} total={6} onBack={()=>go('phone')} />
        <Progress pct={33} />
        <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:20 }} showsVerticalScrollIndicator={false}>
          {/* WhatsApp card */}
          <View style={{ backgroundColor:C.wa+'18', borderRadius:12, padding:14, borderWidth:1, borderColor:C.wa+'33', flexDirection:'row', alignItems:'center', gap:12, marginBottom:24 }}>
            <View style={{ width:44, height:44, borderRadius:22, backgroundColor:C.wa, alignItems:'center', justifyContent:'center' }}>
              <Text style={{ fontSize:20 }}>💬</Text>
            </View>
            <View>
              <Text style={{ fontSize:12, color:C.muted }}>OTP sent via WhatsApp to</Text>
              <Text style={{ fontSize:16, fontWeight:'700', color:C.white }}>{phoneDisplay}</Text>
              <Text style={{ fontSize:11, color:C.wa }}>✓✓ Delivered to your WhatsApp</Text>
            </View>
          </View>

          <Text style={{ textAlign:'center', fontSize:13, color:C.white, fontWeight:'500', marginBottom:16 }}>
            Enter the 6-digit code from WhatsApp
          </Text>

          <View style={{ flexDirection:'row', justifyContent:'center', gap:10, marginBottom:16 }}>
            {otp.map((d,i)=>(
              <TextInput key={i} ref={el=>otpRefs.current[i]=el}
                value={d} onChangeText={val=>handleDigit(i,val)}
                onKeyPress={e=>handleKey(i,e)}
                keyboardType="numeric" maxLength={1}
                style={[s.otpBox, {
                  borderColor:otpPhase==='error'?C.danger:otpPhase==='done'?C.green:d?C.teal:C.border
                }]} />
            ))}
          </View>

          {otpPhase==='error'&&<Text style={{ color:C.danger, fontSize:13, textAlign:'center', marginBottom:12 }}>✕ Incorrect code — try again</Text>}
          {otpPhase==='done'&&<Text style={{ color:C.green, fontSize:13, textAlign:'center', marginBottom:12 }}>✓ Verified — redirecting…</Text>}
          {otpPhase==='checking'&&<ActivityIndicator color={C.teal} style={{ marginBottom:12 }} />}

          <View style={{ alignItems:'center', marginTop:8 }}>
            {otpTimer>0
              ? <Text style={{ fontSize:13, color:C.muted }}>Resend in <Text style={{ color:C.teal, fontWeight:'700' }}>0:{String(otpTimer).padStart(2,'0')}</Text></Text>
              : <TouchableOpacity onPress={()=>{ setOtpTimer(59); setOtp(['','','','','','']) }}>
                  <Text style={{ fontSize:13, color:C.teal, fontWeight:'600' }}>↗ Resend via WhatsApp</Text>
                </TouchableOpacity>
            }
          </View>
        </ScrollView>
        <BottomBar>
          <Btn label={otpPhase==='checking'?'Verifying…':otpPhase==='done'?'Verified ✓':'Verify WhatsApp OTP →'}
            onPress={verify} color={C.wa}
            disabled={!allFilled||otpPhase==='checking'||otpPhase==='done'} />
        </BottomBar>
      </NScreen>
    )
  }

  // ── SIGNUP ─────────────────────────────────────────────────────────────────
  if (screen==='signup') {
    const passwordsMatch = pass.length>=8&&passConfirm===pass
    const ready = email&&passwordsMatch
    const strength = [pass.length>=8,/[A-Z]/.test(pass),/[0-9]/.test(pass)]

    const handleCreate = async () => {
      if (!ready) return
      try {
        await fetch(`${API}/save-account`,{
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({ id_number:idNum, email, password:pass })
        })
      } catch(e) {}
      go('consent')
    }

    return (
      <NScreen>
        <TopBar title="Create your account" step={3} total={6} onBack={()=>go('otp')} />
        <Progress pct={50} />
        <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:20 }} showsVerticalScrollIndicator={false}>
          {/* Verified badge */}
          <View style={{ backgroundColor:C.green+'18', borderRadius:12, padding:12, marginBottom:20, borderWidth:1, borderColor:C.green+'33' }}>
            <Text style={{ fontSize:13, color:C.green, fontWeight:'600' }}>
              ✓ ID · OTP verified — {firstName||'Thabo'} {lastName||'Nkosi'} · Homeowner
            </Text>
          </View>

          {/* Name locked from DHA */}
          <View style={{ backgroundColor:C.navyLight, borderRadius:14, padding:16, marginBottom:20, borderWidth:1, borderColor:C.border }}>
            <Text style={{ fontSize:11, fontWeight:'700', color:C.muted, textTransform:'uppercase', letterSpacing:0.8, marginBottom:12 }}>
              🏛️ Name confirmed by Home Affairs
            </Text>
            <View style={{ flexDirection:'row', gap:24 }}>
              <View>
                <Text style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:0.5, marginBottom:4 }}>First name</Text>
                <Text style={{ fontSize:15, fontWeight:'700', color:C.white }}>{firstName||'Thabo'}</Text>
              </View>
              <View>
                <Text style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:0.5, marginBottom:4 }}>Last name</Text>
                <Text style={{ fontSize:15, fontWeight:'700', color:C.white }}>{lastName||'Nkosi'}</Text>
              </View>
            </View>
            <Text style={{ fontSize:11, color:C.muted, marginTop:10, lineHeight:18 }}>
              🔒 Your legal name is sourced from the Department of Home Affairs and cannot be changed.
            </Text>
          </View>

          <Field label="Email address" value={email} onChangeText={setEmail}
            placeholder="thabo@email.co.za" keyboardType="email-address" autoCapitalize="none" />

          <View style={{ marginBottom:16 }}>
            <Text style={s.fieldLabel}>Cell number</Text>
            <TextInput value={phone?'+27 '+phone.replace(/^0/,''):''} editable={false}
              style={[s.input,{ opacity:0.6 }]} />
          </View>

          <View style={{ marginBottom:16 }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:6 }}>
              <Text style={s.fieldLabel}>Password</Text>
              <TouchableOpacity onPress={()=>setShowPass(p=>!p)}>
                <Text style={{ fontSize:12, color:C.teal, fontWeight:'600' }}>{showPass?'Hide':'Show'}</Text>
              </TouchableOpacity>
            </View>
            <TextInput value={pass} onChangeText={setPass}
              placeholder="Min. 8 characters" placeholderTextColor={C.muted}
              secureTextEntry={!showPass} style={s.input} />
            {pass.length>0&&(
              <View style={{ flexDirection:'row', gap:4, marginTop:8 }}>
                {strength.map((ok,i)=>(
                  <View key={i} style={{ flex:1, height:3, borderRadius:99, backgroundColor:ok?C.teal:C.subtle }} />
                ))}
              </View>
            )}
          </View>

          <Field label="Confirm password" value={passConfirm} onChangeText={setPassConfirm}
            placeholder="Re-enter your password" secureTextEntry={!showPass}
            hint={passConfirm.length>0?(passwordsMatch?'✓ Passwords match':'✕ Passwords do not match'):null} />

          <Text style={{ fontSize:11, color:C.muted, lineHeight:18, marginBottom:16 }}>
            By creating an account you agree to Muḽo's Terms of Service and Privacy Policy. Your information is processed in terms of POPIA.
          </Text>
        </ScrollView>
        <BottomBar>
          <Btn label="Create account →" onPress={handleCreate} disabled={!ready} />
        </BottomBar>
      </NScreen>
    )
  }

  // ── CONSENT ────────────────────────────────────────────────────────────────
  if (screen==='consent') {
    const providers = [
      { key:'truId',      label:'TruID', emoji:'🏦', desc:'Bank statements, income & expenditure analysis', toggle:consentTruId, set:setConsentTruId },
      { key:'transUnion', label:'TransUnion', emoji:'📊', desc:'Credit bureau report and credit score', toggle:consentTransUnion, set:setConsentTransUnion },
      { key:'lightstone', label:'Lightstone', emoji:'🏡', desc:'Property valuation and bond details', toggle:consentLightstone, set:setConsentLightstone },
      { key:'popia',      label:'POPIA consent', emoji:'🔒', desc:'Processing of personal information in terms of POPIA', toggle:consentPopia, set:setConsentPopia },
    ]

    return (
      <NScreen>
        <TopBar title="Data consent" step={4} total={6} onBack={()=>go('signup')} />
        <Progress pct={66} />
        <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:20 }} showsVerticalScrollIndicator={false}>
          <Text style={{ fontSize:15, fontWeight:'600', color:C.white, marginBottom:6 }}>Authorise data access</Text>
          <Text style={{ fontSize:13, color:C.muted, marginBottom:24, lineHeight:20 }}>
            To calculate your personalised offer, we need read-only access to your financial data from these providers. Toggle each one to grant consent.
          </Text>

          {providers.map(p=>(
            <View key={p.key} style={[s.card, { marginBottom:12, flexDirection:'row', alignItems:'center', gap:14 }]}>
              <Text style={{ fontSize:24 }}>{p.emoji}</Text>
              <View style={{ flex:1 }}>
                <Text style={{ fontSize:14, fontWeight:'600', color:C.textDark, marginBottom:2 }}>{p.label}</Text>
                <Text style={{ fontSize:12, color:C.textMid, lineHeight:18 }}>{p.desc}</Text>
              </View>
              <Switch value={p.toggle} onValueChange={p.set}
                trackColor={{ false:C.textLight, true:C.teal }}
                thumbColor={C.white} />
            </View>
          ))}

          <View style={{ backgroundColor:'#F7F9FC', borderRadius:12, padding:14, marginTop:8 }}>
            <Text style={{ fontSize:12, color:C.textMid, lineHeight:20 }}>
              🔒 All data is accessed read-only. We never execute transactions or store data beyond what is required for your application. Data is protected under POPIA and stored on AWS Cape Town servers.
            </Text>
          </View>
        </ScrollView>
        <BottomBar>
          <Btn label="Authorise & continue →" onPress={()=>go('loading')} disabled={!allConsented} />
        </BottomBar>
      </NScreen>
    )
  }

  // ── LOADING (bureau orchestration) ─────────────────────────────────────────
  if (screen==='loading') {
    const steps = [
      { label:'Connecting to TruID', sub:'Fetching bank statements and income data…' },
      { label:'TransUnion bureau check', sub:'Pulling your credit profile…' },
      { label:'Lightstone property valuation', sub:'Checking deeds office and AVM data…' },
      { label:'Affordability assessment', sub:'Calculating debt-to-income ratio…' },
      { label:'Muḽo Score computation', sub:'Running our proprietary credit model…' },
      { label:'Generating your offer', sub:'Preparing your personalised refinance offer…' },
    ]

    return (
      <NScreen>
        <View style={{ flex:1, padding:24, justifyContent:'center' }}>
          <Text style={{ fontSize:22, fontWeight:'800', color:C.white, marginBottom:8, textAlign:'center' }}>
            ⚡ Processing your application
          </Text>
          <Text style={{ fontSize:13, color:C.muted, marginBottom:40, textAlign:'center', lineHeight:20 }}>
            Connecting to your data providers. This takes about 8 seconds.
          </Text>

          {steps.map((step,i)=>{
            const done = loadStep>i
            const active = loadStep===i
            return (
              <View key={i} style={{ flexDirection:'row', alignItems:'center', gap:14, marginBottom:18 }}>
                <View style={[{
                  width:32, height:32, borderRadius:16, borderWidth:1.5,
                  alignItems:'center', justifyContent:'center',
                  backgroundColor:done?C.green+'22':active?C.teal+'22':C.subtle,
                  borderColor:done?C.green:active?C.teal:C.border,
                }]}>
                  <Text style={{ fontSize:12, color:done?C.green:active?C.teal:C.muted }}>
                    {done?'✓':active?'⟳':String(i+1)}
                  </Text>
                </View>
                <View style={{ flex:1 }}>
                  <Text style={{ fontSize:13, fontWeight:'600', color:done?C.white:active?C.white:C.muted }}>
                    {step.label}
                  </Text>
                  <Text style={{ fontSize:11, color:C.muted, marginTop:2 }}>{step.sub}</Text>
                </View>
                {done&&<Text style={{ fontSize:11, color:C.green, fontWeight:'600' }}>Done</Text>}
                {active&&<ActivityIndicator color={C.teal} size="small" />}
              </View>
            )
          })}
        </View>
        {loadDone&&(
          <BottomBar>
            <Btn label="View your offer →" onPress={()=>go('bond-confirm')} />
          </BottomBar>
        )}
      </NScreen>
    )
  }

  // ── BOND CONFIRM ───────────────────────────────────────────────────────────
  if (screen==='bond-confirm') return (
    <NScreen bg={C.lightBg}>
      <TopBar title="Your property" step={5} total={6} onBack={()=>go('loading')} />
      <Progress pct={75} />
      <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:16 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize:11, color:C.textMid, textTransform:'uppercase', letterSpacing:1, marginBottom:6, marginTop:4 }}>
          Property · Lightstone AVM
        </Text>
        <Card style={{ marginBottom:12 }}>
          <Text style={{ fontSize:16, fontWeight:'700', color:C.textDark, marginBottom:4 }}>{DEMO.property}</Text>
          <Text style={{ fontSize:13, color:C.textMid, marginBottom:16 }}>{DEMO.bondHolder}</Text>
          {[
            ['Property value (AVM)', `R ${DEMO.propertyValue.toLocaleString()}`],
            ['Outstanding bond balance', `R ${DEMO.bondBalance.toLocaleString()}`],
            ['Available equity (75% LTV)', `R ${(DEMO.propertyValue*0.75-DEMO.bondBalance).toLocaleString()}`],
          ].map(([l,v])=>(
            <View key={l} style={[s.detailRow]}>
              <Text style={s.detailLabel}>{l}</Text>
              <Text style={s.detailValue}>{v}</Text>
            </View>
          ))}
        </Card>

        <Text style={{ fontSize:11, color:C.textMid, textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>
          Verification details
        </Text>
        <Card style={{ marginBottom:12 }}>
          {[
            ['Registered owner', `${firstName||'Thabo'} ${lastName||'Nkosi'}`],
            ['Title deed', 'T•••• / 20••'],
            ['DHA match', '✓ Confirmed'],
            ['Source', 'Lightstone Deeds Office · ' + new Date().toLocaleDateString('en-ZA')],
          ].map(([l,v])=>(
            <View key={l} style={s.detailRow}>
              <Text style={s.detailLabel}>{l}</Text>
              <Text style={s.detailValue}>{v}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>
      <BottomBar>
        <Btn label="Yes, this is my property →" onPress={()=>go('bank-account')} />
        <BtnGhost label="This is not my property" onPress={()=>Alert.alert('Contact us','Please contact support@mulo.co.za')} />
      </BottomBar>
    </NScreen>
  )

  // ── BANK ACCOUNT ───────────────────────────────────────────────────────────
  if (screen==='bank-account') return (
    <NScreen bg={C.lightBg}>
      <TopBar title="Disbursement account" step={5} total={6} onBack={()=>go('bond-confirm')} />
      <Progress pct={75} />
      <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:16 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize:11, color:C.textMid, textTransform:'uppercase', letterSpacing:1, marginBottom:6, marginTop:4 }}>
          Disbursement Account · TruID Verified
        </Text>
        <Card style={{ marginBottom:12 }}>
          {[
            ['Account holder', `${firstName||'Thabo'} ${lastName||'Nkosi'}`],
            ['Bank', DEMO.bank],
            ['Account number', DEMO.accountNum],
            ['Branch code', '632005'],
            ['Account type', 'Cheque / Current'],
          ].map(([l,v])=>(
            <View key={l} style={s.detailRow}>
              <Text style={s.detailLabel}>{l}</Text>
              <Text style={s.detailValue}>{v}</Text>
            </View>
          ))}
        </Card>

        <Card>
          <Text style={{ fontSize:13, fontWeight:'700', color:C.textDark, marginBottom:8 }}>Verification details</Text>
          <Text style={{ fontSize:12, color:C.textMid, lineHeight:20 }}>
            This account was verified via TruID during your bank statement retrieval. Loan tranches will be disbursed into this account only.{'\n\n'}
            ✓ Account name matches DHA record{'\n'}
            ✓ Account active and in good standing{'\n'}
            ✓ Income verified — R{(DEMO.saving+7000).toLocaleString()}/month net
          </Text>
        </Card>
      </ScrollView>
      <BottomBar>
        <Btn label="Confirm disbursement account →" onPress={()=>go('offer')} />
        <BtnGhost label="Use a different account" onPress={()=>Alert.alert('Contact us','Please contact support@mulo.co.za')} />
      </BottomBar>
    </NScreen>
  )

  // ── OFFER ──────────────────────────────────────────────────────────────────
  if (screen==='offer') {
    const totalDebt = DEMO.debts.reduce((s,d)=>s+d.balance,0)
    const totalMonthly = DEMO.debts.reduce((s,d)=>s+d.monthly,0)

    return (
      <NScreen bg={C.lightBg}>
        <TopBar title="Your offer" step={5} total={6} onBack={()=>go('bank-account')} />
        <Progress pct={75} />
        <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:16 }} showsVerticalScrollIndicator={false}>

          {/* Muḽo Score */}
          <Card style={{ marginBottom:12, backgroundColor:C.navy, borderWidth:0 }}>
            <Text style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Muḽo Score</Text>
            <View style={{ flexDirection:'row', alignItems:'center', gap:16, marginBottom:16 }}>
              <View style={{ width:72, height:72, borderRadius:36, borderWidth:4, borderColor:C.teal, alignItems:'center', justifyContent:'center' }}>
                <Text style={{ fontSize:22, fontWeight:'800', color:C.teal }}>{DEMO.muloScore}</Text>
                <Text style={{ fontSize:9, color:C.muted }}>/ 100</Text>
              </View>
              <View style={{ flex:1 }}>
                <Text style={{ fontSize:22, fontWeight:'800', color:C.white }}>Pre-qualified</Text>
                <Text style={{ fontSize:13, color:C.muted, marginTop:2 }}>Strong applicant profile</Text>
              </View>
            </View>
            {/* SHAP bars */}
            {[
              ['Payment history',    82, C.green],
              ['Income stability',   78, C.teal],
              ['Property equity',    91, C.green],
              ['Debt-to-income',     69, C.amber],
              ['Credit utilisation', 74, C.teal],
            ].map(([l,v,c])=>(
              <View key={l} style={{ marginBottom:8 }}>
                <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:4 }}>
                  <Text style={{ fontSize:11, color:C.muted }}>{l}</Text>
                  <Text style={{ fontSize:11, color:c, fontWeight:'600' }}>{v}/100</Text>
                </View>
                <View style={{ height:3, backgroundColor:C.subtle, borderRadius:2 }}>
                  <View style={{ height:3, width:v+'%', backgroundColor:c, borderRadius:2 }} />
                </View>
              </View>
            ))}
          </Card>

          {/* Loan offer */}
          <Card style={{ marginBottom:12 }}>
            <Text style={{ fontSize:11, color:C.textMid, textTransform:'uppercase', letterSpacing:0.8, marginBottom:12 }}>Your loan offer</Text>
            <Text style={{ fontSize:36, fontWeight:'800', color:C.textDark, marginBottom:4 }}>
              R {DEMO.loanAmount.toLocaleString()}
            </Text>
            <Text style={{ fontSize:13, color:C.textMid, marginBottom:16 }}>Equity loan · Further advance on existing bond</Text>
            {[
              ['Interest rate', DEMO.rate],
              ['Term', DEMO.term+' months'],
              ['Monthly repayment', 'R '+DEMO.monthly.toLocaleString()],
              ['Monthly saving', 'R '+DEMO.saving.toLocaleString()],
            ].map(([l,v])=>(
              <View key={l} style={s.detailRow}>
                <Text style={s.detailLabel}>{l}</Text>
                <Text style={[s.detailValue, l==='Monthly saving'&&{ color:C.green }]}>{v}</Text>
              </View>
            ))}
          </Card>

          {/* Debt breakdown */}
          <Card style={{ marginBottom:12 }}>
            <Text style={{ fontSize:11, color:C.textMid, textTransform:'uppercase', letterSpacing:0.8, marginBottom:12 }}>Debts to be settled</Text>
            {DEMO.debts.map((d,i)=>(
              <View key={i} style={[s.detailRow, i===DEMO.debts.length-1&&{ borderBottomWidth:0, marginBottom:0, paddingBottom:0 }]}>
                <View style={{ flex:1 }}>
                  <Text style={{ fontSize:13, color:C.textDark, fontWeight:'500' }}>{d.label}</Text>
                  <Text style={{ fontSize:11, color:C.textMid }}>{d.rate}% p.a. · R{d.monthly}/mo</Text>
                </View>
                <Text style={{ fontSize:13, fontWeight:'600', color:C.textDark }}>R{d.balance.toLocaleString()}</Text>
              </View>
            ))}
            <View style={{ marginTop:12, paddingTop:12, borderTopWidth:1, borderTopColor:'#F0F4F8', flexDirection:'row', justifyContent:'space-between' }}>
              <Text style={{ fontSize:13, color:C.textMid }}>Total debt to settle</Text>
              <Text style={{ fontSize:14, fontWeight:'700', color:C.textDark }}>R{totalDebt.toLocaleString()}</Text>
            </View>
          </Card>

          {/* Savings summary */}
          <Card style={{ marginBottom:16, backgroundColor:C.green+'12', borderWidth:1, borderColor:C.green+'33' }}>
            <Text style={{ fontSize:13, fontWeight:'600', color:C.green, marginBottom:8 }}>5-year savings projection</Text>
            <Text style={{ fontSize:28, fontWeight:'800', color:C.textDark, marginBottom:4 }}>R 255,600</Text>
            <Text style={{ fontSize:12, color:C.textMid }}>Total saved vs current debt repayments</Text>
          </Card>
        </ScrollView>
        <BottomBar>
          <Btn label="Accept offer & continue →" onPress={()=>go('doc-upload')} />
        </BottomBar>
      </NScreen>
    )
  }

  // ── DOC UPLOAD ─────────────────────────────────────────────────────────────
  if (screen==='doc-upload') {
    const [payslipDone, setPayslipDone]   = useState(false)
    const [addressDone, setAddressDone]   = useState(false)

    return (
      <NScreen bg={C.lightBg}>
        <TopBar title="Document upload" step={5} total={6} onBack={()=>go('offer')} />
        <Progress pct={80} />
        <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:16 }} showsVerticalScrollIndicator={false}>
          <Text style={{ fontSize:15, fontWeight:'600', color:C.textDark, marginBottom:6 }}>Upload your documents</Text>
          <Text style={{ fontSize:13, color:C.textMid, marginBottom:24, lineHeight:20 }}>
            We need to verify your income and address to finalise your application.
          </Text>

          {[
            { label:'Latest payslip', sub:'Last 3 months · PDF or image', done:payslipDone, set:setPayslipDone, emoji:'📄' },
            { label:'Proof of address', sub:'Utility bill or bank statement · Not older than 3 months', done:addressDone, set:setAddressDone, emoji:'📮' },
          ].map(p=>(
            <Card key={p.label} style={{ marginBottom:12 }}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:12, marginBottom:12 }}>
                <Text style={{ fontSize:24 }}>{p.emoji}</Text>
                <View style={{ flex:1 }}>
                  <Text style={{ fontSize:14, fontWeight:'600', color:C.textDark }}>{p.label}</Text>
                  <Text style={{ fontSize:12, color:C.textMid, marginTop:2 }}>{p.sub}</Text>
                </View>
                {p.done&&<View style={{ backgroundColor:C.green+'22', borderRadius:20, paddingHorizontal:10, paddingVertical:4 }}>
                  <Text style={{ fontSize:11, color:C.green, fontWeight:'700' }}>✓ Uploaded</Text>
                </View>}
              </View>
              {!p.done
                ? <TouchableOpacity onPress={()=>p.set(true)}
                    style={{ borderWidth:2, borderColor:C.teal, borderStyle:'dashed', borderRadius:12, padding:20, alignItems:'center' }}>
                    <Text style={{ fontSize:24, marginBottom:8 }}>📎</Text>
                    <Text style={{ fontSize:13, color:C.teal, fontWeight:'600' }}>Tap to upload</Text>
                    <Text style={{ fontSize:11, color:C.textMid, marginTop:4 }}>PDF · JPG · PNG</Text>
                  </TouchableOpacity>
                : <View style={{ backgroundColor:C.green+'12', borderRadius:10, padding:12, flexDirection:'row', alignItems:'center', gap:10 }}>
                    <Text style={{ fontSize:20 }}>✅</Text>
                    <Text style={{ fontSize:13, color:C.green, fontWeight:'500' }}>{p.label} uploaded successfully</Text>
                  </View>
              }
            </Card>
          ))}
        </ScrollView>
        <BottomBar>
          <Btn label="Continue to face verification →" onPress={()=>go('liveness')} disabled={!payslipDone||!addressDone} />
        </BottomBar>
      </NScreen>
    )
  }

  // ── LIVENESS ───────────────────────────────────────────────────────────────
  if (screen==='liveness') {
    const [livenessPhase, setLivenessPhase] = useState('idle')
    const [livenessStep, setLivenessStep]   = useState(0)
    const checks = ['Detecting face…','Checking liveness…','Matching to Home Affairs…','Confirming identity…']

    const startScan = () => {
      setLivenessPhase('scanning')
      setTimeout(()=>{
        setLivenessPhase('checks')
        let step=0
        const t = setInterval(()=>{
          step++; setLivenessStep(step)
          if (step>=checks.length) {
            clearInterval(t)
            setTimeout(()=>{ setLivenessPhase('verified') },600)
          }
        },900)
      },2500)
    }

    return (
      <NScreen bg={C.lightBg}>
        <TopBar title="Face verification" step={5} total={6} onBack={()=>go('doc-upload')} />
        <Progress pct={85} />
        <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:16 }} showsVerticalScrollIndicator={false}>
          <Text style={{ fontSize:13, color:C.textMid, marginBottom:16, lineHeight:20 }}>
            We'll match your face to your Home Affairs photo to confirm you are the ID holder.
          </Text>

          {livenessPhase==='verified'
            ? (
              <View style={{ alignItems:'center', padding:32 }}>
                <View style={{ width:88, height:88, borderRadius:44, backgroundColor:C.green, alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                  <Text style={{ fontSize:40, color:C.white }}>✓</Text>
                </View>
                <Text style={{ fontSize:20, fontWeight:'700', color:C.textDark, marginBottom:8 }}>Identity verified!</Text>
                <Text style={{ fontSize:13, color:C.textMid }}>Redirecting to your loan agreement…</Text>
              </View>
            )
            : (
              <>
                {/* Camera frame */}
                <View style={{ backgroundColor:'#1a1a2e', borderRadius:20, height:280, alignItems:'center', justifyContent:'center', marginBottom:16, overflow:'hidden' }}>
                  <View style={{ width:140, height:180, borderRadius:70, borderWidth:3,
                    borderColor:livenessPhase==='scanning'?C.teal:'rgba(255,255,255,0.3)' }} />
                  <Text style={{ position:'absolute', bottom:20, fontSize:12, color:livenessPhase==='scanning'?C.teal:'rgba(255,255,255,0.5)', fontWeight:livenessPhase==='scanning'?'600':'400' }}>
                    {livenessPhase==='scanning'?'Hold still…':'Position your face in the oval'}
                  </Text>
                </View>

                {livenessPhase==='checks'&&(
                  <Card>
                    {checks.map((l,i)=>(
                      <View key={i} style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:i<checks.length-1?12:0 }}>
                        <View style={{ width:10, height:10, borderRadius:5, backgroundColor:i<livenessStep?C.green:i===livenessStep?C.teal:C.textLight }} />
                        <Text style={{ fontSize:13, color:i<livenessStep?C.textDark:i===livenessStep?C.textDark:C.textMid, flex:1 }}>{l}</Text>
                        {i<livenessStep&&<Text style={{ fontSize:11, color:C.green, fontWeight:'600' }}>✓</Text>}
                      </View>
                    ))}
                  </Card>
                )}

                {livenessPhase==='idle'&&(
                  <Card>
                    <Text style={{ fontSize:13, fontWeight:'600', color:C.textDark, marginBottom:8 }}>Before you start</Text>
                    <Text style={{ fontSize:12, color:C.textMid, lineHeight:20 }}>
                      • Good lighting on your face{'\n'}
                      • Remove glasses if possible{'\n'}
                      • Look directly at the camera
                    </Text>
                  </Card>
                )}
              </>
            )
          }
        </ScrollView>
        {livenessPhase==='idle'&&(
          <BottomBar><Btn label="Start face scan →" onPress={startScan} /></BottomBar>
        )}
        {livenessPhase==='verified'&&(
          <BottomBar><Btn label="Continue to sign agreement →" onPress={()=>go('loan-sign')} /></BottomBar>
        )}
      </NScreen>
    )
  }

  // ── LOAN SIGN ──────────────────────────────────────────────────────────────
  if (screen==='loan-sign') {
    const [initialed, setInitialed]   = useState(false)
    const [signed, setSigned]         = useState(false)

    return (
      <NScreen bg={C.lightBg}>
        <TopBar title="Loan agreement" step={6} total={6} onBack={()=>go('liveness')} />
        <Progress pct={95} />
        <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:16 }} showsVerticalScrollIndicator={false}>
          <Text style={{ fontSize:15, fontWeight:'600', color:C.textDark, marginBottom:6 }}>Sign your loan agreement</Text>
          <Text style={{ fontSize:13, color:C.textMid, marginBottom:20, lineHeight:20 }}>
            Review and sign your Muḽo Further Advance Agreement below. This is a legally binding document.
          </Text>

          {/* Agreement summary */}
          <Card style={{ marginBottom:12 }}>
            <Text style={{ fontSize:12, fontWeight:'700', color:C.textMid, textTransform:'uppercase', letterSpacing:0.8, marginBottom:12 }}>Agreement summary</Text>
            {[
              ['Borrower', `${firstName||'Thabo'} ${lastName||'Nkosi'}`],
              ['ID number', idNum||DEMO.idNumber],
              ['Lender', DEMO.bondHolder],
              ['Loan amount', `R ${DEMO.loanAmount.toLocaleString()}`],
              ['Interest rate', DEMO.rate],
              ['Term', `${DEMO.term} months`],
              ['Monthly repayment', `R ${DEMO.monthly.toLocaleString()}`],
              ['Disbursement account', `${DEMO.bank} ${DEMO.accountNum}`],
            ].map(([l,v])=>(
              <View key={l} style={s.detailRow}>
                <Text style={s.detailLabel}>{l}</Text>
                <Text style={s.detailValue}>{v}</Text>
              </View>
            ))}
          </Card>

          {/* Page 1 initials */}
          <Card style={{ marginBottom:12 }}>
            <Text style={{ fontSize:12, fontWeight:'700', color:C.textMid, textTransform:'uppercase', letterSpacing:0.8, marginBottom:10 }}>
              Borrower initials (page 1 of 2)
            </Text>
            <Text style={{ fontSize:12, color:C.textMid, lineHeight:20, marginBottom:16 }}>
              By initialling, you confirm you have read and understood the terms of this agreement including the interest rate, repayment obligations, and NCA disclosure.
            </Text>
            <TouchableOpacity onPress={()=>setInitialed(p=>!p)}
              style={{ flexDirection:'row', alignItems:'center', gap:12, backgroundColor:initialed?C.green+'12':'#F7F9FC',
                borderRadius:10, padding:14, borderWidth:1, borderColor:initialed?C.green+'33':'#E8EDF4' }}>
              <View style={{ width:22, height:22, borderRadius:4, borderWidth:2,
                borderColor:initialed?C.green:C.textLight, backgroundColor:initialed?C.green:'transparent',
                alignItems:'center', justifyContent:'center' }}>
                {initialed&&<Text style={{ color:C.white, fontWeight:'700', fontSize:14 }}>✓</Text>}
              </View>
              <Text style={{ fontSize:13, color:initialed?C.green:C.textDark, fontWeight:'500', flex:1 }}>
                {initialed?`Initialled — ${firstName||'T'} ${lastName?lastName[0]:'N'}` : 'Tap to initial page 1 of 2'}
              </Text>
            </TouchableOpacity>
          </Card>

          {/* Full signature */}
          <Card style={{ marginBottom:16 }}>
            <Text style={{ fontSize:12, fontWeight:'700', color:C.textMid, textTransform:'uppercase', letterSpacing:0.8, marginBottom:10 }}>
              Full signature (page 2 of 2)
            </Text>
            <Text style={{ fontSize:12, color:C.textMid, lineHeight:20, marginBottom:16 }}>
              By signing, you accept all terms and authorise Muḽo to process the further advance on your Absa Home Loan account.
            </Text>
            <TouchableOpacity onPress={()=>setSigned(p=>!p)}
              style={{ flexDirection:'row', alignItems:'center', gap:12, backgroundColor:signed?C.green+'12':'#F7F9FC',
                borderRadius:10, padding:14, borderWidth:1, borderColor:signed?C.green+'33':'#E8EDF4' }}>
              <View style={{ width:22, height:22, borderRadius:4, borderWidth:2,
                borderColor:signed?C.green:C.textLight, backgroundColor:signed?C.green:'transparent',
                alignItems:'center', justifyContent:'center' }}>
                {signed&&<Text style={{ color:C.white, fontWeight:'700', fontSize:14 }}>✓</Text>}
              </View>
              <Text style={{ fontSize:13, color:signed?C.green:C.textDark, fontWeight:'500', flex:1 }}>
                {signed?`Signed — ${firstName||'Thabo'} ${lastName||'Nkosi'}` : 'Tap to sign electronically'}
              </Text>
            </TouchableOpacity>
          </Card>

          <Text style={{ fontSize:11, color:C.textMid, lineHeight:18, marginBottom:8 }}>
            This electronic signature is legally valid under the Electronic Communications and Transactions Act (ECTA) 25 of 2002 and constitutes a binding agreement.
          </Text>
        </ScrollView>
        <BottomBar>
          <Btn label="Submit signed agreement →" onPress={()=>go('conveyancing')} disabled={!initialed||!signed} />
        </BottomBar>
      </NScreen>
    )
  }

  // ── CONVEYANCING ───────────────────────────────────────────────────────────
  if (screen==='conveyancing') return (
    <NScreen bg={C.lightBg}>
      <TopBar title="Conveyancing" onBack={()=>go('loan-sign')} />
      <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:16 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize:11, color:C.textMid, textTransform:'uppercase', letterSpacing:1, marginBottom:6, marginTop:4 }}>
          e-Conveyancing · Fully remote
        </Text>
        <Text style={{ fontSize:15, fontWeight:'600', color:C.textDark, marginBottom:16 }}>
          Your application is with our conveyancing attorneys
        </Text>

        <Card style={{ marginBottom:12 }}>
          <Text style={{ fontSize:12, fontWeight:'700', color:C.textMid, textTransform:'uppercase', letterSpacing:0.8, marginBottom:12 }}>
            Conveyancing progress
          </Text>
          {[
            { step:'Agreement signed',        status:'done',   note:'Signed electronically via Muḽo' },
            { step:'Lender approval',         status:'active', note:'Absa Home Loans · Under review' },
            { step:'Bond registration',       status:'wait',   note:'Deeds Office · Est. 3–5 days' },
            { step:'Funds disbursement',      status:'wait',   note:'To your Absa account' },
            { step:'Creditor settlement',     status:'wait',   note:'Sequential tranche release' },
          ].map((item,i)=>{
            const color = item.status==='done'?C.green:item.status==='active'?C.teal:C.textLight
            const icon  = item.status==='done'?'✓':item.status==='active'?'⟳':'○'
            return (
              <View key={i} style={{ flexDirection:'row', alignItems:'flex-start', gap:12, marginBottom:i<4?16:0 }}>
                <View style={{ width:28, height:28, borderRadius:14, borderWidth:1.5, borderColor:color,
                  backgroundColor:item.status==='done'?C.green+'18':item.status==='active'?C.teal+'18':'transparent',
                  alignItems:'center', justifyContent:'center', marginTop:2 }}>
                  <Text style={{ fontSize:12, color }}>{icon}</Text>
                </View>
                <View style={{ flex:1 }}>
                  <Text style={{ fontSize:13, fontWeight:'600', color:C.textDark }}>{item.step}</Text>
                  <Text style={{ fontSize:12, color:C.textMid, marginTop:2 }}>{item.note}</Text>
                </View>
                {item.status==='done'&&<Text style={{ fontSize:11, color:C.green, fontWeight:'600' }}>Done</Text>}
                {item.status==='active'&&<ActivityIndicator color={C.teal} size="small" />}
              </View>
            )
          })}
        </Card>

        <Card style={{ marginBottom:16 }}>
          <Text style={{ fontSize:13, fontWeight:'600', color:C.textDark, marginBottom:8 }}>What happens next</Text>
          {[
            ['📱','Track progress in your dashboard'],
            ['📧','Updates sent to '+email||'your email'],
            ['💸','Funds released within 24–48 hours of bond registration'],
            ['🔄','Creditors settled one at a time — you\'ll be notified each time'],
          ].map(([icon,text],i)=>(
            <View key={i} style={{ flexDirection:'row', gap:10, alignItems:'flex-start', marginBottom:8 }}>
              <Text style={{ fontSize:16 }}>{icon}</Text>
              <Text style={{ fontSize:13, color:C.textMid, flex:1, lineHeight:20 }}>{text}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>
      <BottomBar>
        <Btn label="Go to my dashboard →" onPress={()=>go('dashboard')} />
      </BottomBar>
    </NScreen>
  )

  // ── DASHBOARD ──────────────────────────────────────────────────────────────
  if (screen==='dashboard') {
    const activity = [
      { icon:'💸', label:'Wesbank settlement',     date:'Apr 14 · Vehicle finance',  amt:'-R128,500', type:'debit'  },
      { icon:'🏦', label:'African Bank settled',   date:'Apr 13 · Personal loan',    amt:'-R125,000', type:'debit'  },
      { icon:'💳', label:'Capitec CC closed',      date:'Apr 12 · Credit card',      amt:'-R48,000',  type:'debit'  },
      { icon:'✅', label:'Loan disbursed',         date:'Apr 12 · Muḽo equity loan', amt:'+R320,000', type:'credit' },
    ]

    return (
      <NScreen bg={C.navy}>
        {/* Header */}
        <View style={{ padding:20, paddingTop:8 }}>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <Text style={{ fontSize:22, fontWeight:'800', color:C.white }}>Mu<Text style={{ color:C.teal }}>ḽ</Text>o</Text>
            <View style={{ width:40, height:40, borderRadius:14, backgroundColor:'rgba(255,255,255,0.15)', alignItems:'center', justifyContent:'center' }}>
              <Text style={{ fontSize:15, fontWeight:'700', color:C.white }}>{(firstName||'T')[0]+(lastName||'N')[0]}</Text>
            </View>
          </View>
          <Text style={{ fontSize:13, color:C.muted }}>Good morning 👋</Text>
          <Text style={{ fontSize:22, fontWeight:'800', color:C.white, marginBottom:14 }}>{firstName||'Thabo'} {lastName||'Nkosi'}</Text>

          {/* Status card */}
          <View style={{ backgroundColor:C.subtle, borderRadius:14, padding:14, marginBottom:10 }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <Text style={{ fontSize:13, fontWeight:'600', color:C.white }}>Settlement in progress</Text>
              <View style={{ flexDirection:'row', alignItems:'center', gap:5, backgroundColor:C.green+'20', borderRadius:20, paddingHorizontal:10, paddingVertical:4 }}>
                <View style={{ width:5, height:5, borderRadius:3, backgroundColor:C.green }} />
                <Text style={{ fontSize:10, color:C.green, fontWeight:'700' }}>Live</Text>
              </View>
            </View>
            <View style={{ height:4, backgroundColor:'rgba(255,255,255,0.15)', borderRadius:2, marginBottom:6 }}>
              <View style={{ height:4, width:'60%', backgroundColor:C.teal, borderRadius:2 }} />
            </View>
            <View style={{ flexDirection:'row', justifyContent:'space-between' }}>
              {['Approved','Disbursed','Settling','Complete'].map(l=>(
                <Text key={l} style={{ fontSize:9, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:0.3 }}>{l}</Text>
              ))}
            </View>
          </View>

          {/* Next repayment */}
          <View style={{ backgroundColor:C.subtle, borderRadius:14, padding:14 }}>
            <Text style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:0.5, marginBottom:4 }}>Next repayment</Text>
            <Text style={{ fontSize:28, fontWeight:'800', color:C.white }}>R 6,940</Text>
            <Text style={{ fontSize:12, color:C.muted }}>Due 11 May 2026 · Month 1 of 60</Text>
          </View>
        </View>

        <ScrollView style={{ flex:1, backgroundColor:C.lightBg }} contentContainerStyle={{ padding:16, paddingBottom:32 }}>
          {/* Insight cards */}
          <View style={{ flexDirection:'row', gap:8, marginBottom:12 }}>
            {[
              { icon:'💰', val:'R4,260', label:'Monthly saving', color:C.green },
              { icon:'📉', val:'11.25%', label:'Avg. rate', color:'#1A73E8' },
              { icon:'🏡', val:'R580k',  label:'Property equity', color:C.navy },
              { icon:'🎯', val:'Score 82', label:'Muḽo rating', color:C.teal },
            ].map((item,i)=>(
              <View key={i} style={{ flex:1, backgroundColor:C.cardBg, borderRadius:12, padding:10, alignItems:'center', shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:8, elevation:2 }}>
                <Text style={{ fontSize:18, marginBottom:4 }}>{item.icon}</Text>
                <Text style={{ fontSize:13, fontWeight:'800', color:item.color, marginBottom:2 }}>{item.val}</Text>
                <Text style={{ fontSize:9, color:C.textMid, textAlign:'center' }}>{item.label}</Text>
              </View>
            ))}
          </View>

          {/* Recent activity */}
          <View style={{ backgroundColor:C.cardBg, borderRadius:18, padding:18, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:12, elevation:2 }}>
            <Text style={{ fontSize:12, fontWeight:'700', color:C.textMid, textTransform:'uppercase', letterSpacing:0.8, marginBottom:12 }}>Recent activity</Text>
            {activity.map((a,i)=>(
              <View key={i} style={{ flexDirection:'row', alignItems:'center', gap:12,
                paddingBottom:i<activity.length-1?12:0, marginBottom:i<activity.length-1?12:0,
                borderBottomWidth:i<activity.length-1?1:0, borderBottomColor:'#F0F4F8' }}>
                <View style={{ width:38, height:38, borderRadius:10, alignItems:'center', justifyContent:'center', backgroundColor:'#F0F4F8' }}>
                  <Text style={{ fontSize:15 }}>{a.icon}</Text>
                </View>
                <View style={{ flex:1 }}>
                  <Text style={{ fontSize:13, fontWeight:'600', color:C.textDark }}>{a.label}</Text>
                  <Text style={{ fontSize:11, color:C.textMid }}>{a.date}</Text>
                </View>
                <Text style={{ fontSize:13, fontWeight:'700', color:a.type==='credit'?C.green:C.danger }}>{a.amt}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </NScreen>
    )
  }

  return null
}

// Styles
const s = StyleSheet.create({
  topBar:       { flexDirection:'row', alignItems:'center', padding:16, paddingTop:8, borderBottomWidth:1, borderBottomColor:C.border, gap:12 },
  backBtn:      { width:40, height:40, alignItems:'center', justifyContent:'center' },
  backText:     { fontSize:22, color:C.muted },
  topTitle:     { fontSize:16, fontWeight:'600', color:C.white },
  topSub:       { fontSize:11, color:C.muted, marginTop:2 },
  btn:          { borderRadius:14, padding:18, alignItems:'center', width:'100%' },
  btnText:      { fontSize:15, fontWeight:'700' },
  btnGhost:     { borderRadius:14, padding:14, alignItems:'center', width:'100%', marginTop:8, borderWidth:1.5, borderColor:C.border },
  btnGhostText: { fontSize:14, fontWeight:'600', color:C.muted },
  bottomBar:    { padding:20, paddingBottom:32, borderTopWidth:1, borderTopColor:C.border, backgroundColor:C.navy },
  fieldLabel:   { fontSize:12, color:C.muted, fontWeight:'500', marginBottom:6, letterSpacing:0.3 },
  fieldHint:    { fontSize:11, color:C.muted, marginTop:4 },
  input:        { backgroundColor:C.navyLight, borderWidth:1, borderColor:C.border, borderRadius:10, padding:14, color:C.white, fontSize:15 },
  sectionTitle: { fontSize:12, fontWeight:'700', color:C.muted, textTransform:'uppercase', letterSpacing:0.8, marginBottom:12 },
  idCard:       { backgroundColor:C.navyLight, borderRadius:14, padding:20, marginBottom:24, borderWidth:1, borderColor:C.border, alignItems:'center' },
  idCardLabel:  { fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:1.5, marginBottom:8 },
  idCardNumber: { fontSize:22, fontWeight:'800', color:C.white, letterSpacing:3 },
  idCardSub:    { fontSize:11, color:C.muted, marginTop:6 },
  checkRow:     { flexDirection:'row', alignItems:'center', gap:12, paddingVertical:10, borderBottomWidth:1, borderBottomColor:C.border },
  checkIcon:    { width:28, height:28, borderRadius:14, borderWidth:1.5, borderColor:C.border, alignItems:'center', justifyContent:'center' },
  otpBox:       { width:44, height:56, borderRadius:12, borderWidth:2, textAlign:'center', fontSize:22, fontWeight:'700', color:C.white, backgroundColor:C.navyLight },
  card:         { backgroundColor:C.cardBg, borderRadius:14, padding:16, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:8, elevation:2 },
  detailRow:    { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingBottom:10, marginBottom:10, borderBottomWidth:1, borderBottomColor:'#F0F4F8' },
  detailLabel:  { fontSize:13, color:C.textMid },
  detailValue:  { fontSize:13, fontWeight:'600', color:C.textDark, flex:1, textAlign:'right' },
})
