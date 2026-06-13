/**
 * Muḽo Insure — Insure.jsx
 * Phase 1: Full 9-screen journey (screens 2–4 skipped when no relevant product selected)
 * Mock insurer responses for screens 6–9
 * Supports both Tier 1 (refinance) and Tier 2 (open market) clients
 */

import React, { useState, useEffect } from 'react'

// ─── Brand tokens ──────────────────────────────────────────────────────────────
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
}

// ─── Mock insurer data ─────────────────────────────────────────────────────────
const MOCK_QUOTES = {
  CAR: [
    { insurer: 'Naked Insurance',   logo: '🟠', premium: 689,  excess: 3500, rating: 4.7, cashback: 689,  highlight: 'Best value',      colour: '#FF6B35' },
    { insurer: 'King Price',        logo: '👑', premium: 712,  excess: 3000, rating: 4.5, cashback: 712,  highlight: 'Decreasing premium', colour: '#FFD700' },
    { insurer: 'Pineapple',         logo: '🍍', premium: 741,  excess: 2500, rating: 4.6, cashback: 741,  highlight: 'Top rated claims',  colour: '#FFD93D' },
    { insurer: 'iWYZE',             logo: '🔵', premium: 798,  excess: 3500, rating: 4.2, cashback: 798,  highlight: null,                colour: '#0066CC' },
    { insurer: 'Absa Insurance',    logo: '🔴', premium: 834,  excess: 4000, rating: 4.1, cashback: 834,  highlight: null,                colour: '#CC0000' },
  ],
  BUILDINGS: [
    { insurer: 'Absa Insurance',    logo: '🔴', premium: 521,  excess: 5000, rating: 4.3, cashback: 521,  highlight: 'Best for bond holders', colour: '#CC0000' },
    { insurer: 'Naked Insurance',   logo: '🟠', premium: 548,  excess: 4000, rating: 4.7, cashback: 548,  highlight: 'Best value',      colour: '#FF6B35' },
    { insurer: 'King Price',        logo: '👑', premium: 576,  excess: 5000, rating: 4.5, cashback: 576,  highlight: null,                colour: '#FFD700' },
    { insurer: 'iWYZE',             logo: '🔵', premium: 612,  excess: 5000, rating: 4.2, cashback: 612,  highlight: null,                colour: '#0066CC' },
  ],
  CONTENTS: [
    { insurer: 'Pineapple',         logo: '🍍', premium: 312,  excess: 1500, rating: 4.6, cashback: 312,  highlight: 'Top rated claims',  colour: '#FFD93D' },
    { insurer: 'Naked Insurance',   logo: '🟠', premium: 328,  excess: 2000, rating: 4.7, cashback: 328,  highlight: 'Best value',      colour: '#FF6B35' },
    { insurer: 'King Price',        logo: '👑', premium: 341,  excess: 2000, rating: 4.5, cashback: 341,  highlight: null,                colour: '#FFD700' },
  ],
  ALLRISK: [
    { insurer: 'Naked Insurance',   logo: '🟠', premium: 189,  excess: 1000, rating: 4.7, cashback: 189,  highlight: 'Best value',      colour: '#FF6B35' },
    { insurer: 'Pineapple',         logo: '🍍', premium: 210,  excess: 1000, rating: 4.6, cashback: 210,  highlight: null,                colour: '#FFD93D' },
    { insurer: 'King Price',        logo: '👑', premium: 225,  excess: 1000, rating: 4.5, cashback: 225,  highlight: null,                colour: '#FFD700' },
  ],
  CARAVAN: [
    { insurer: 'King Price',        logo: '👑', premium: 245,  excess: 2000, rating: 4.5, cashback: 245,  highlight: 'Only provider',   colour: '#FFD700' },
  ],
  TRAILER: [
    { insurer: 'King Price',        logo: '👑', premium: 145,  excess: 1500, rating: 4.5, cashback: 145,  highlight: 'Only provider',   colour: '#FFD700' },
  ],
}

// ─── Shared UI components ──────────────────────────────────────────────────────
const Screen = ({ children, style = {} }) => (
  <div style={{
    height: '100%', background: C.navy, color: C.white,
    fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column',
    maxWidth: 480, margin: '0 auto', position: 'relative', overflow: 'hidden',
    ...style,
  }}>
    {children}
  </div>
)

const TopBar = ({ title, step, totalSteps, onBack }) => (
  <div style={{
    display: 'flex', alignItems: 'center', padding: '16px 20px 12px',
    borderBottom: `1px solid ${C.border}`, gap: 12, flexShrink: 0,
  }}>
    {onBack && (
      <button onClick={onBack} style={{
        background: 'none', border: 'none', color: C.muted,
        fontSize: 22, cursor: 'pointer', padding: 0, lineHeight: 1,
      }}>←</button>
    )}
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
      {step && (
        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
          Step {step} of {totalSteps}
        </div>
      )}
    </div>
    <div style={{ fontSize: 12, color: C.teal, fontWeight: 600 }}>muḽo insure</div>
  </div>
)

const ProgressBar = ({ step, total }) => (
  <div style={{ height: 3, background: C.subtle, flexShrink: 0 }}>
    <div style={{
      height: '100%', background: C.teal,
      width: `${(step / total) * 100}%`,
      transition: 'width 0.3s ease',
    }} />
  </div>
)

const Btn = ({ children, onClick, variant = 'primary', disabled = false, style = {} }) => {
  const styles = {
    primary:   { background: 'linear-gradient(135deg,#00B8A9,#1A73E8)', color: '#fff', boxShadow: '0 8px 24px rgba(0,184,169,0.35)' },
    secondary: { background: C.subtle, color: C.white, border: `1px solid ${C.border}` },
    teal:      { background: C.teal,   color: C.navy },
    ghost:     { background: 'transparent', color: C.teal, border: `1.5px solid ${C.teal}` },
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles[variant],
        border: styles[variant].border || 'none',
        borderRadius: 16, padding: '17px 24px',
        fontSize: 15, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1, width: '100%',
        transition: 'opacity 0.15s', ...style,
      }}
    >{children}</button>
  )
}

const Field = ({ label, value, onChange, type = 'text', placeholder = '', readOnly = false, hint }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: 'block', fontSize: 12, color: C.muted, fontWeight: 500, marginBottom: 6, letterSpacing: 0.3 }}>
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange ? e => onChange(e.target.value) : undefined}
      placeholder={placeholder}
      readOnly={readOnly}
      style={{
        width: '100%', boxSizing: 'border-box',
        background: readOnly ? 'rgba(255,255,255,0.04)' : C.navyLight,
        border: `1px solid ${readOnly ? C.subtle : C.border}`,
        borderRadius: 10, padding: '12px 14px',
        color: readOnly ? C.muted : C.white,
        fontSize: 15, outline: 'none',
      }}
    />
    {hint && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{hint}</div>}
  </div>
)

const Select = ({ label, value, onChange, options, readOnly = false }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: 'block', fontSize: 12, color: C.muted, fontWeight: 500, marginBottom: 6, letterSpacing: 0.3 }}>
      {label}
    </label>
    <select
      value={value}
      onChange={onChange ? e => onChange(e.target.value) : undefined}
      disabled={readOnly}
      style={{
        width: '100%', boxSizing: 'border-box',
        background: C.navyLight, border: `1px solid ${C.border}`,
        borderRadius: 10, padding: '12px 14px',
        color: C.white, fontSize: 15, outline: 'none',
        appearance: 'none',
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
)

const Badge = ({ children, color = C.teal }) => (
  <span style={{
    background: `${color}22`, color, border: `1px solid ${color}44`,
    borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600,
  }}>{children}</span>
)

const CashbackTag = ({ amount }) => (
  <div style={{
    background: `${C.green}18`, border: `1px solid ${C.green}44`,
    borderRadius: 8, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6,
  }}>
    <span style={{ fontSize: 16 }}>💸</span>
    <span style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>
      R{amount.toLocaleString()} cashback on sign-up
    </span>
  </div>
)

const ScrollBody = ({ children, style = {} }) => (
  <div style={{
    flex: 1, overflowY: 'auto', padding: '20px 20px 100px',
    ...style,
  }}>
    {children}
  </div>
)

const BottomBar = ({ children }) => (
  <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:200,background:"linear-gradient(to bottom,transparent,#0A1628 45%)",padding:"12px 20px 24px"}}>  
    {children}
  </div>
)

// ─── Product definitions ───────────────────────────────────────────────────────
const PRODUCTS = [
  { code: 'BUILDINGS', label: 'Buildings',       icon: '🏠', desc: 'Cover the structure of your home' },
  { code: 'CONTENTS',  label: 'Home contents',   icon: '📦', desc: 'Furniture, appliances & valuables' },
  { code: 'CAR',       label: 'Car insurance',   icon: '🚗', desc: 'Comprehensive vehicle cover' },
  { code: 'ALLRISK',   label: 'All risk',         icon: '💎', desc: 'Jewellery, devices & portable items' },
  { code: 'CARAVAN',   label: 'Caravan',          icon: '🚐', desc: 'Cover for your caravan' },
  { code: 'TRAILER',   label: 'Trailer',          icon: '🔗', desc: 'Cover for your trailer' },
]

// ─── Determine which screens to show ──────────────────────────────────────────
function buildScreenList(selected) {
  const screens = [1] // product selector always first
  if (selected.includes('CAR'))                                  screens.push(2)
  if (selected.includes('BUILDINGS') || selected.includes('CONTENTS')) screens.push(3)
  if (['ALLRISK','CARAVAN','TRAILER'].some(p => selected.includes(p))) screens.push(4)
  screens.push(5, 6, 7, 8, 9)
  return screens
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function Insure({ client, onBack }) {
  const isRefinance = client?.isRefinance ?? false

  // Journey state — starts at -1 (Insure landing), 0+ = quote journey
  const [screenIdx, setScreenIdx]       = useState(-1)
  const [selected, setSelected]         = useState(isRefinance ? ['BUILDINGS'] : [])
  const [screenList, setScreenList]     = useState(buildScreenList(isRefinance ? ['BUILDINGS'] : []))

  // Form state — screen 2 (car)
  const [car, setCar] = useState({
    make:   isRefinance && client?.vehicle?.make  ? client.vehicle.make  : '',
    model:  isRefinance && client?.vehicle?.model ? client.vehicle.model : '',
    year:   isRefinance && client?.vehicle?.year  ? String(client.vehicle.year) : '',
    colour: isRefinance && client?.vehicle?.colour? client.vehicle.colour: '',
    reg:    isRefinance && client?.vehicle?.reg   ? client.vehicle.reg   : '',
    use:    'private',
    financed: 'yes',
  })

  // Form state — screen 3 (home)
  const [home, setHome] = useState({
    address:        isRefinance && client?.property?.address        ? client.property.address        : '',
    buildingValue:  isRefinance && client?.property?.buildingValue  ? String(client.property.buildingValue) : '',
    contentsValue:  isRefinance && client?.property?.contentsValue  ? String(client.property.contentsValue) : '',
    roofType:       'tile',
    wallType:       'brick',
    securityAlarm:  'yes',
    securityGuard:  'no',
  })

  // Form state — screen 4 (additional items)
  const [additional, setAdditional] = useState({
    allRiskItems: '',
    caravanMake: '',
    caravanYear: '',
    trailerType: '',
  })

  // Form state — screen 5 (about you)
  const [about, setAbout] = useState({
    name:    isRefinance ? client?.name    || '' : '',
    idNum:   isRefinance ? client?.idNumber || '' : '',
    email:   isRefinance ? client?.email   || '' : '',
    phone:   isRefinance ? client?.phone   || '' : '',
    address: isRefinance && client?.property?.address ? client.property.address : '',
  })

  // Quote selection state (screen 6)
  const [selectedQuotes, setSelectedQuotes]     = useState({})
  const [quotesLoading, setQuotesLoading]       = useState(false)
  const [quotesLoaded, setQuotesLoaded]         = useState(false)

  // Debit order state (screen 8)
  const [debit, setDebit] = useState({
    bank:          isRefinance ? client?.bankAccount?.bank || '' : '',
    accountNumber: isRefinance ? client?.bankAccount?.accountNumber || '' : '',
    accountType:   isRefinance ? client?.bankAccount?.accountType || 'Cheque' : 'Cheque',
    debitDay:      '1',
    signed:        false,
  })

  // Recompute screen list whenever selected changes
  useEffect(() => {
    const list = buildScreenList(selected)
    setScreenList(list)
  }, [selected])

  const currentScreen = screenIdx === -1 ? -1 : screenList[screenIdx]
  const totalScreens  = screenList.length

  const goNext = () => {
    if (currentScreen === 1) setQuotesLoaded(false)
    if (screenIdx === -1) { setScreenIdx(0); return }
    if (screenIdx < screenList.length - 1) setScreenIdx(i => i + 1)
  }
  const goPrev = () => {
    if (screenIdx === -1) { onBack?.(); return }
    if (screenIdx === 0)  { setScreenIdx(-1); return }
    setScreenIdx(i => i - 1)
  }

  // ── Insure landing screen ─────────────────────────────────────────────────────
  const renderLanding = () => (
    <div className="screen fade-in" style={{background:'#F7F9FC'}}>

      {/* single scrollable container — hero + body together */}
      <div className="screen-scroll">

        {/* ── Hero ── */}
        <div style={{background:'linear-gradient(160deg,#0A1628 0%,#0E2344 60%,#0B3040 100%)',padding:'28px 24px 0',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',width:300,height:300,borderRadius:'50%',background:'radial-gradient(circle,rgba(0,184,169,0.18) 0%,transparent 70%)',top:-80,right:-80,pointerEvents:'none'}}/>
          <div style={{position:'absolute',width:200,height:200,borderRadius:'50%',background:'radial-gradient(circle,rgba(26,115,232,0.15) 0%,transparent 70%)',bottom:40,left:-60,pointerEvents:'none'}}/>

          {/* logo row */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:32,position:'relative',zIndex:1}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <div className="mulo-logo">Mu<span>ḽ</span>o</div>
              <div style={{fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.4)',letterSpacing:0.5,marginTop:2}}>insure</div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.35)'}}>FSP 49169</div>
              <span style={{fontSize:18,color:'rgba(255,255,255,0.5)',cursor:'pointer',padding:'4px 8px'}} onClick={onBack}>←</span>
            </div>
          </div>

          <div className="hero-eyebrow" style={{position:'relative',zIndex:1}}>💸 Earn 1× your first month's premium as cashback</div>
          <h1 className="hero-title" style={{position:'relative',zIndex:1}}>South Africa's smartest<br/><em>insurance comparison.</em></h1>
          <p className="hero-sub" style={{position:'relative',zIndex:1}}>Compare quotes from 5 leading insurers in minutes. Get covered, earn cashback, pay less.</p>

          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:20,position:'relative',zIndex:1}}>
            {[['🟠','Naked'],['👑','King Price'],['🍍','Pineapple'],['🔵','iWYZE'],['🔴','Absa']].map(([e,n]) => (
              <div key={n} style={{display:'flex',alignItems:'center',gap:5,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:99,padding:'4px 10px'}}>
                <span style={{fontSize:13}}>{e}</span>
                <span style={{fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.6)'}}>{n}</span>
              </div>
            ))}
          </div>

          <div className="hero-stats" style={{position:'relative',zIndex:1}}>
            {[['R0','Free to compare'],['3 min','Avg. quote time'],['1 mo','Cashback earned']].map(([v,l]) => (
              <div className="hero-stat" key={l}><div className="hero-stat-val">{v}</div><div className="hero-stat-lbl">{l}</div></div>
            ))}
          </div>

          <div className="trust-strip">
            {[['🛡️','FSP 49169'],['🔒','POPIA Compliant'],['⚡','5 insurers']].map(([i,l]) => (
              <div className="trust-item" key={l}><span className="trust-icon">{i}</span>{l}</div>
            ))}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="landing-body">
          <div className="section-title">Why Muḽo Insure</div>
          {[
            ['💸','Earn your first month back',    'Every policy earns you 1× your first month\'s premium as cashback — paid within 30 days of cover starting.'],
            ['⚡','Quotes in under 3 minutes',      'Answer 3–5 questions. We pull quotes from all 5 insurers simultaneously and rank them by value.'],
            ['🏆','Best price, not just cheapest',  'We rank by value, claims reputation and acceptance likelihood — not just the lowest number.'],
            ['📱','Fully digital, start to finish', 'Compare, choose, sign. Policy documents on WhatsApp and email the moment you\'re covered.'],
          ].map(([icon,title,body]) => (
            <div className="step-card" key={title}>
              <div className="step-num">{icon}</div>
              <div><div className="step-content-title">{title}</div><div className="step-content-sub">{body}</div></div>
            </div>
          ))}

          <div className="section-title" style={{marginTop:24}}>What we cover</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:20}}>
            {[['🚗','Car insurance'],['🏠','Buildings'],['📦','Home contents'],['💎','All risk'],['🚐','Caravan'],['🔗','Trailer']].map(([icon,label]) => (
              <div key={label} style={{display:'flex',alignItems:'center',gap:10,background:'#fff',border:'1px solid #EEF2F8',borderRadius:14,padding:'12px 14px',boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
                <span style={{fontSize:20}}>{icon}</span>
                <span style={{fontSize:13,fontWeight:600,color:'#0A1628'}}>{label}</span>
              </div>
            ))}
          </div>

          <div style={{background:'linear-gradient(135deg,rgba(18,194,107,0.08),rgba(0,184,169,0.06))',border:'1px solid rgba(18,194,107,0.2)',borderRadius:18,padding:18,marginBottom:16}}>
            <div style={{fontFamily:"'Sora',sans-serif",fontSize:14,fontWeight:700,color:'#12C26B',marginBottom:8}}>💸 How cashback works</div>
            <div style={{fontSize:13,color:'#8FA3BE',lineHeight:1.65}}>Take out any policy through Muḽo Insure and the insurer pays back your <strong style={{color:'#0A1628'}}>full first month's premium</strong> — per product. Insure your car <em>and</em> your home, earn cashback on both.</div>
            <div style={{display:'flex',gap:16,marginTop:12,fontSize:12,color:'#8FA3BE'}}>
              <span>🔒 12-month lock-in</span><span>📅 Paid within 30 days</span>
            </div>
          </div>

          <button className="btn btn-primary" onClick={goNext} style={{marginBottom:12}}>Get my free quotes →</button>
          <div style={{textAlign:'center',fontSize:11,color:'#8FA3BE',marginBottom:8}}>Free to compare · No obligation · Takes 3 minutes</div>
          <div style={{textAlign:'center',fontSize:11,color:'#C5D0DC',lineHeight:1.6,paddingBottom:24}}>
            Muḽo Financial Services (Pty) Ltd · FSP 49169<br/>Authorised Financial Services Provider
          </div>
        </div>
      </div>
    </div>
  )

  // Simulate quote fetching when screen 6 appears
  useEffect(() => {
    if (currentScreen === 6 && !quotesLoaded) {
      setQuotesLoading(true)
      const timer = setTimeout(() => {
        // Auto-select best (first) quote per product
        const defaults = {}
        selected.forEach(code => {
          if (MOCK_QUOTES[code]?.[0]) defaults[code] = MOCK_QUOTES[code][0]
        })
        setSelectedQuotes(defaults)
        setQuotesLoading(false)
        setQuotesLoaded(true)
      }, 1800)
      return () => clearTimeout(timer)
    }
  }, [currentScreen, quotesLoaded, selected])

  // Totals
  const totalPremium  = Object.values(selectedQuotes).reduce((s, q) => s + (q?.premium || 0), 0)
  const totalCashback = Object.values(selectedQuotes).reduce((s, q) => s + (q?.cashback || 0), 0)

  // ── Screen renderers ──────────────────────────────────────────────────────────

  const renderScreen1 = () => {
    const canProceed = selected.length > 0

    // Validate bundle rules
    const errors = []
    if (selected.includes('ALLRISK') && selected.length === 1) errors.push('All risk must be bundled with another product')
    if (selected.includes('CARAVAN') && !selected.includes('CAR'))  errors.push('Caravan requires car insurance')
    if (selected.includes('TRAILER') && !selected.includes('CAR'))  errors.push('Trailer requires car insurance')

    const toggle = code => {
      setSelected(prev => {
        if (prev.includes(code)) return prev.filter(c => c !== code)
        return [...prev, code]
      })
    }

    // Sort products: BUILDINGS first for refinance
    const orderedProducts = isRefinance
      ? [...PRODUCTS].sort((a, b) => a.code === 'BUILDINGS' ? -1 : b.code === 'BUILDINGS' ? 1 : 0)
      : PRODUCTS

    return (
      <Screen>
        <TopBar title="What do you want to insure?" step={1} totalSteps={totalScreens} onBack={goPrev} />
        <ProgressBar step={1} total={totalScreens} />
        <ScrollBody>
          {isRefinance && (
            <div style={{
              background: `${C.teal}18`, border: `1px solid ${C.teal}33`,
              borderRadius: 12, padding: '12px 14px', marginBottom: 20,
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 18 }}>⚡</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.teal }}>Refinance client</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                  We've pre-loaded your property and vehicle data. You'll only need to answer a few quick questions.
                </div>
              </div>
            </div>
          )}

          <p style={{ fontSize: 14, color: C.muted, marginBottom: 20 }}>
            Select everything you'd like to cover. All products earn cashback equal to your first month's premium.
          </p>

          {orderedProducts.map(p => {
            const isSelected = selected.includes(p.code)
            const isMandatory = isRefinance && p.code === 'BUILDINGS'
            const isDisabled = !selected.includes('CAR') && (p.code === 'CARAVAN' || p.code === 'TRAILER')

            return (
              <div
                key={p.code}
                onClick={() => !isMandatory && !isDisabled && toggle(p.code)}
                style={{
                  background: isSelected ? `${C.teal}18` : C.navyLight,
                  border: `1.5px solid ${isSelected ? C.teal : C.border}`,
                  borderRadius: 12, padding: '14px 16px', marginBottom: 10,
                  cursor: isMandatory || isDisabled ? 'default' : 'pointer',
                  opacity: isDisabled ? 0.4 : 1,
                  display: 'flex', alignItems: 'center', gap: 14,
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 26 }}>{p.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {p.label}
                    {isMandatory && <Badge>Required for bond</Badge>}
                  </div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{p.desc}</div>
                </div>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: isSelected ? C.teal : 'transparent',
                  border: `2px solid ${isSelected ? C.teal : C.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {isSelected && <span style={{ color: C.navy, fontSize: 13, fontWeight: 700 }}>✓</span>}
                </div>
              </div>
            )
          })}

          {errors.map((e, i) => (
            <div key={i} style={{ color: C.danger, fontSize: 12, marginTop: 6, marginBottom: 4 }}>⚠ {e}</div>
          ))}

          <div style={{
            marginTop: 20, padding: '12px 14px',
            background: `${C.green}10`, border: `1px solid ${C.green}33`, borderRadius: 10,
          }}>
            <div style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>💸 Cashback offer</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
              Every product you insure earns you 1× your first month's premium as cashback — paid within 30 days of your policy start date.
              12-month lock-in applies.
            </div>
          </div>
        </ScrollBody>
        <BottomBar>
          <Btn onClick={goNext} disabled={!canProceed || errors.length > 0}>
            {selected.length === 0 ? 'Select a product to continue' : `Continue with ${selected.length} product${selected.length > 1 ? 's' : ''} →`}
          </Btn>
        </BottomBar>
      </Screen>
    )
  }

  const renderScreen2 = () => (
    <Screen>
      <TopBar title="Tell us about your car" step={screenList.indexOf(2) + 1} totalSteps={totalScreens} onBack={goPrev} />
      <ProgressBar step={screenList.indexOf(2) + 1} total={totalScreens} />
      <ScrollBody>
        {isRefinance && car.make && (
          <div style={{
            background: `${C.teal}18`, border: `1px solid ${C.teal}33`,
            borderRadius: 12, padding: '12px 14px', marginBottom: 20,
            fontSize: 13, color: C.muted,
          }}>
            <span style={{ color: C.teal, fontWeight: 600 }}>⚡ Pre-filled from your TruID data.</span>{' '}
            Check the details are correct.
          </div>
        )}

        <Field label="Make" value={car.make} onChange={v => setCar(p => ({...p, make: v}))}
          placeholder="e.g. Toyota" readOnly={isRefinance && !!car.make} />
        <Field label="Model" value={car.model} onChange={v => setCar(p => ({...p, model: v}))}
          placeholder="e.g. Hilux" readOnly={isRefinance && !!car.model} />
        <Field label="Year" value={car.year} onChange={v => setCar(p => ({...p, year: v}))}
          type="number" placeholder="e.g. 2021" readOnly={isRefinance && !!car.year} />
        <Field label="Colour" value={car.colour} onChange={v => setCar(p => ({...p, colour: v}))}
          placeholder="e.g. White" readOnly={isRefinance && !!car.colour} />
        <Field label="Registration number" value={car.reg} onChange={v => setCar(p => ({...p, reg: v}))}
          placeholder="e.g. GP 42 TH" readOnly={isRefinance && !!car.reg} />

        <Select label="Primary use" value={car.use} onChange={v => setCar(p => ({...p, use: v}))}
          options={[
            {value: 'private', label: 'Private'},
            {value: 'commute', label: 'Commute to work'},
            {value: 'business', label: 'Business use'},
          ]} />
        <Select label="Is the vehicle financed?" value={car.financed} onChange={v => setCar(p => ({...p, financed: v}))}
          options={[{value: 'yes', label: 'Yes'}, {value: 'no', label: 'No'}]} />
      </ScrollBody>
      <BottomBar>
        <Btn onClick={goNext} disabled={!car.make || !car.model || !car.year}>Continue →</Btn>
      </BottomBar>
    </Screen>
  )

  const renderScreen3 = () => (
    <Screen>
      <TopBar title="Tell us about your home" step={screenList.indexOf(3) + 1} totalSteps={totalScreens} onBack={goPrev} />
      <ProgressBar step={screenList.indexOf(3) + 1} total={totalScreens} />
      <ScrollBody>
        {isRefinance && home.address && (
          <div style={{
            background: `${C.teal}18`, border: `1px solid ${C.teal}33`,
            borderRadius: 12, padding: '12px 14px', marginBottom: 20,
            fontSize: 13, color: C.muted,
          }}>
            <span style={{ color: C.teal, fontWeight: 600 }}>⚡ Pre-filled from Lightstone data.</span>{' '}
            Verify the values below.
          </div>
        )}

        {isRefinance && client?.property?.riskScore && (
          <div style={{
            background: C.navyLight, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: '12px 14px', marginBottom: 20,
          }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 8, fontWeight: 600 }}>Property risk profile</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {Object.entries(client.property.riskScore).map(([k, v]) => (
                <div key={k} style={{
                  flex: 1, textAlign: 'center', padding: '8px 4px',
                  background: v === 'low' ? `${C.green}18` : v === 'medium' ? '#FF980018' : '#FF5C5C18',
                  border: `1px solid ${v === 'low' ? C.green : v === 'medium' ? '#FF9800' : C.danger}44`,
                  borderRadius: 8,
                }}>
                  <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{k}</div>
                  <div style={{
                    fontSize: 11, fontWeight: 700, marginTop: 2,
                    color: v === 'low' ? C.green : v === 'medium' ? '#FF9800' : C.danger,
                    textTransform: 'capitalize',
                  }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Field label="Property address" value={home.address}
          onChange={v => setHome(p => ({...p, address: v}))}
          placeholder="Street, suburb, city, postal code"
          readOnly={isRefinance && !!home.address} />

        {selected.includes('BUILDINGS') && (
          <Field label="Estimated building replacement value (R)"
            value={home.buildingValue} type="number"
            onChange={v => setHome(p => ({...p, buildingValue: v}))}
            placeholder="e.g. 2800000"
            readOnly={isRefinance && !!home.buildingValue}
            hint="This is what it would cost to rebuild from scratch — not the market value." />
        )}

        {selected.includes('CONTENTS') && (
          <Field label="Estimated contents value (R)"
            value={home.contentsValue} type="number"
            onChange={v => setHome(p => ({...p, contentsValue: v}))}
            placeholder="e.g. 450000"
            readOnly={isRefinance && !!home.contentsValue}
            hint="Total value of all furniture, appliances, and valuables." />
        )}

        <Select label="Roof type" value={home.roofType}
          onChange={v => setHome(p => ({...p, roofType: v}))}
          options={[
            {value: 'tile', label: 'Tiles'}, {value: 'slate', label: 'Slate'},
            {value: 'tin', label: 'Tin / IBR'}, {value: 'thatch', label: 'Thatch'},
          ]} />
        <Select label="Wall construction" value={home.wallType}
          onChange={v => setHome(p => ({...p, wallType: v}))}
          options={[
            {value: 'brick', label: 'Brick & plaster'}, {value: 'double_brick', label: 'Double brick'},
            {value: 'wood', label: 'Wood / nutec'}, {value: 'other', label: 'Other'},
          ]} />
        <Select label="Alarm system?" value={home.securityAlarm}
          onChange={v => setHome(p => ({...p, securityAlarm: v}))}
          options={[{value: 'yes', label: 'Yes — monitored'}, {value: 'yes_self', label: 'Yes — self-monitored'}, {value: 'no', label: 'No'}]} />
        <Select label="Armed response / security guard?" value={home.securityGuard}
          onChange={v => setHome(p => ({...p, securityGuard: v}))}
          options={[{value: 'yes', label: 'Yes'}, {value: 'no', label: 'No'}]} />
      </ScrollBody>
      <BottomBar>
        <Btn onClick={goNext} disabled={!home.address}>Continue →</Btn>
      </BottomBar>
    </Screen>
  )

  const renderScreen4 = () => (
    <Screen>
      <TopBar title="Additional items" step={screenList.indexOf(4) + 1} totalSteps={totalScreens} onBack={goPrev} />
      <ProgressBar step={screenList.indexOf(4) + 1} total={totalScreens} />
      <ScrollBody>
        {selected.includes('ALLRISK') && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>All risk items</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>
              List the items you want all-risk cover for (e.g. "iPhone 15 — R18 000, Engagement ring — R45 000").
            </div>
            <textarea
              value={additional.allRiskItems}
              onChange={e => setAdditional(p => ({...p, allRiskItems: e.target.value}))}
              placeholder="List your items and estimated values..."
              style={{
                width: '100%', boxSizing: 'border-box', background: C.navyLight,
                border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px',
                color: C.white, fontSize: 14, outline: 'none', minHeight: 100, resize: 'vertical',
              }}
            />
          </div>
        )}

        {selected.includes('CARAVAN') && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Caravan details</div>
            <Field label="Make & model" value={additional.caravanMake}
              onChange={v => setAdditional(p => ({...p, caravanMake: v}))}
              placeholder="e.g. Jurgens Classique" />
            <Field label="Year" value={additional.caravanYear} type="number"
              onChange={v => setAdditional(p => ({...p, caravanYear: v}))}
              placeholder="e.g. 2019" />
          </div>
        )}

        {selected.includes('TRAILER') && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Trailer details</div>
            <Select label="Trailer type" value={additional.trailerType}
              onChange={v => setAdditional(p => ({...p, trailerType: v}))}
              options={[
                {value: '', label: 'Select type…'},
                {value: 'boat', label: 'Boat trailer'},
                {value: 'enclosed', label: 'Enclosed trailer'},
                {value: 'flatbed', label: 'Flatbed / utility'},
                {value: 'other', label: 'Other'},
              ]} />
          </div>
        )}
      </ScrollBody>
      <BottomBar>
        <Btn onClick={goNext}>Continue →</Btn>
      </BottomBar>
    </Screen>
  )

  const renderScreen5 = () => {
    const canContinue = about.name && about.idNum && about.email && about.phone

    return (
      <Screen>
        <TopBar title="About you" step={screenList.indexOf(5) + 1} totalSteps={totalScreens} onBack={goPrev} />
        <ProgressBar step={screenList.indexOf(5) + 1} total={totalScreens} />
        <ScrollBody>
          {isRefinance ? (
            <div style={{
              background: `${C.teal}18`, border: `1px solid ${C.teal}33`,
              borderRadius: 12, padding: '12px 14px', marginBottom: 20,
              fontSize: 13, color: C.muted,
            }}>
              <span style={{ color: C.teal, fontWeight: 600 }}>⚡ Your details are pre-filled.</span>{' '}
              As a Muḽo refinance client, we already have your information on file.
            </div>
          ) : (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 14, color: C.muted }}>
                We need a few details to generate your quotes. Already have a Muḽo account?
              </p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                <Btn variant="teal" onClick={() => {}} style={{ flex: 1 }}>Sign in</Btn>
                <Btn variant="ghost" onClick={() => {}} style={{ flex: 1 }}>Register</Btn>
              </div>
              <div style={{ textAlign: 'center', fontSize: 12, color: C.muted, marginTop: 8 }}>or continue as guest</div>
              <div style={{ height: 1, background: C.border, margin: '16px 0' }} />
            </div>
          )}

          <Field label="Full name" value={about.name}
            onChange={v => setAbout(p => ({...p, name: v}))}
            placeholder="As it appears on your ID"
            readOnly={isRefinance && !!about.name} />
          <Field label="SA ID number" value={about.idNum} type="number"
            onChange={v => setAbout(p => ({...p, idNum: v}))}
            placeholder="13-digit ID number"
            readOnly={isRefinance && !!about.idNum} />
          <Field label="Email address" value={about.email} type="email"
            onChange={v => setAbout(p => ({...p, email: v}))}
            placeholder="for your policy documents"
            readOnly={isRefinance && !!about.email} />
          <Field label="Mobile number" value={about.phone} type="tel"
            onChange={v => setAbout(p => ({...p, phone: v}))}
            placeholder="e.g. 0821234567"
            readOnly={isRefinance && !!about.phone} />

          <div style={{
            marginTop: 16, padding: '10px 12px',
            background: C.subtle, borderRadius: 8, fontSize: 11, color: C.muted,
          }}>
            By continuing, you authorise Muḽo Financial Services (Pty) Ltd (FSP 49169) to obtain
            quotes from our panel insurers on your behalf in terms of FAIS. Your information is
            processed in line with POPIA.
          </div>
        </ScrollBody>
        <BottomBar>
          <Btn onClick={goNext} disabled={!canContinue}>Get my quotes →</Btn>
        </BottomBar>
      </Screen>
    )
  }

  const renderScreen6 = () => {
    if (quotesLoading) {
      return (
        <Screen>
          <TopBar title="Your quotes" step={screenList.indexOf(6) + 1} totalSteps={totalScreens} onBack={goPrev} />
          <ProgressBar step={screenList.indexOf(6) + 1} total={totalScreens} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
            <div style={{ fontSize: 36 }}>⚡</div>
            <div style={{ fontSize: 16, fontWeight: 600, textAlign: 'center' }}>Fetching quotes from all insurers…</div>
            <div style={{ fontSize: 13, color: C.muted, textAlign: 'center' }}>
              Checking {selected.length} product{selected.length > 1 ? 's' : ''} across our full panel
            </div>
            {/* Loading bar */}
            <div style={{ width: '80%', height: 4, background: C.subtle, borderRadius: 2, overflow: 'hidden', marginTop: 8 }}>
              <div style={{
                height: '100%', background: C.teal, borderRadius: 2,
                animation: 'loadbar 1.8s ease-out forwards',
              }} />
            </div>
            <style>{`@keyframes loadbar { from { width: 0% } to { width: 100% } }`}</style>
          </div>
        </Screen>
      )
    }

    return (
      <Screen>
        <TopBar title="Your quotes" step={screenList.indexOf(6) + 1} totalSteps={totalScreens} onBack={goPrev} />
        <ProgressBar step={screenList.indexOf(6) + 1} total={totalScreens} />
        <ScrollBody>
          <div style={{ marginBottom: 16 }}>
            <CashbackTag amount={totalCashback} />
          </div>

          {selected.map(code => {
            const quotes   = MOCK_QUOTES[code] || []
            const product  = PRODUCTS.find(p => p.code === code)
            const selQuote = selectedQuotes[code]

            return (
              <div key={code} style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                  {product?.icon} {product?.label}
                </div>
                {quotes.map((q, i) => {
                  const isChosen = selQuote?.insurer === q.insurer
                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedQuotes(prev => ({...prev, [code]: q}))}
                      style={{
                        background: isChosen ? `${C.teal}18` : C.navyLight,
                        border: `1.5px solid ${isChosen ? C.teal : C.border}`,
                        borderRadius: 12, padding: '14px 16px', marginBottom: 8, cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {q.highlight && (
                        <div style={{ marginBottom: 8 }}>
                          <Badge color={i === 0 ? C.green : C.teal}>{q.highlight}</Badge>
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 22 }}>{q.logo}</span>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{q.insurer}</div>
                            <div style={{ fontSize: 11, color: C.muted }}>★ {q.rating} · Excess R{q.excess.toLocaleString()}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 18, fontWeight: 700 }}>R{q.premium}/mo</div>
                          <div style={{ fontSize: 11, color: C.green }}>+R{q.cashback} back</div>
                        </div>
                      </div>
                      {/* AI explainer */}
                      <div style={{
                        marginTop: 10, padding: '8px 10px',
                        background: 'rgba(255,255,255,0.04)', borderRadius: 8,
                        fontSize: 12, color: C.muted, lineHeight: 1.5,
                      }}>
                        💡 {q.insurer === 'Naked Insurance'
                          ? 'Fully digital claims — average pay-out in 48 hours. No-call-centre policy management.'
                          : q.insurer === 'King Price'
                          ? 'Premium decreases monthly as your car depreciates — unique in the market.'
                          : q.insurer === 'Pineapple'
                          ? 'Peer-to-peer model. Unused premium goes back to you at year-end.'
                          : q.insurer === 'Absa Insurance'
                          ? 'Bundled with your Absa home loan for simplified debit order management.'
                          : 'Established insurer with a national branch network for in-person claims support.'}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </ScrollBody>
        <BottomBar>
          <div style={{ fontSize: 13, color: C.muted, textAlign: 'center', marginBottom: 10 }}>
            Total: <strong style={{ color: C.white }}>R{totalPremium}/mo</strong> · Cashback: <strong style={{ color: C.green }}>R{totalCashback}</strong>
          </div>
          <Btn onClick={goNext}>Review my selection →</Btn>
        </BottomBar>
      </Screen>
    )
  }

  const renderScreen7 = () => (
    <Screen>
      <TopBar title="Review & confirm" step={screenList.indexOf(7) + 1} totalSteps={totalScreens} onBack={goPrev} />
      <ProgressBar step={screenList.indexOf(7) + 1} total={totalScreens} />
      <ScrollBody>
        <div style={{
          background: `${C.green}18`, border: `1px solid ${C.green}33`,
          borderRadius: 12, padding: '14px 16px', marginBottom: 20,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.green, marginBottom: 4 }}>Cashback optimiser</div>
          <div style={{ fontSize: 13, color: C.muted }}>
            Your selections qualify for <strong style={{ color: C.green }}>R{totalCashback.toLocaleString()}</strong> cashback —
            that's your full first month's premium back, paid within 30 days of your policy start date.
          </div>
        </div>

        {/* Selected products summary */}
        {selected.map(code => {
          const product = PRODUCTS.find(p => p.code === code)
          const q = selectedQuotes[code]
          if (!q) return null
          return (
            <div key={code} style={{
              background: C.navyLight, border: `1px solid ${C.border}`,
              borderRadius: 12, padding: '14px 16px', marginBottom: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: 13, color: C.muted, marginBottom: 2 }}>{product?.icon} {product?.label}</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{q.insurer}</div>
                <div style={{ fontSize: 12, color: C.muted }}>Excess R{q.excess.toLocaleString()} · ★ {q.rating}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>R{q.premium}/mo</div>
                <div style={{ fontSize: 11, color: C.green }}>+R{q.cashback} back</div>
              </div>
            </div>
          )
        })}

        {/* Totals */}
        <div style={{
          background: C.navyLight, border: `1px solid ${C.border}`,
          borderRadius: 12, padding: '14px 16px', marginTop: 4,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: C.muted, fontSize: 14 }}>Total monthly premium</span>
            <span style={{ fontSize: 15, fontWeight: 700 }}>R{totalPremium}/mo</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
            <span style={{ color: C.green, fontSize: 14, fontWeight: 600 }}>Your cashback</span>
            <span style={{ color: C.green, fontSize: 15, fontWeight: 700 }}>R{totalCashback}</span>
          </div>
        </div>

        {/* Policy details */}
        <div style={{ marginTop: 16, padding: '12px 14px', background: C.subtle, borderRadius: 10 }}>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
            <div>📅 Cover start date: <strong style={{ color: C.white }}>1st of next month</strong></div>
            <div style={{ marginTop: 4 }}>🔒 12-month lock-in applies. Pro-rata cashback clawback on early cancellation.</div>
            <div style={{ marginTop: 4 }}>📄 Policy documents delivered by email + WhatsApp on sign-up.</div>
          </div>
        </div>
      </ScrollBody>
      <BottomBar>
        <Btn onClick={goNext}>Set up debit order →</Btn>
      </BottomBar>
    </Screen>
  )

  const renderScreen8 = () => {
    const canSign = debit.bank && debit.accountNumber && debit.signed

    return (
      <Screen>
        <TopBar title="Debit order & sign" step={screenList.indexOf(8) + 1} totalSteps={totalScreens} onBack={goPrev} />
        <ProgressBar step={screenList.indexOf(8) + 1} total={totalScreens} />
        <ScrollBody>
          {isRefinance && debit.bank && (
            <div style={{
              background: `${C.teal}18`, border: `1px solid ${C.teal}33`,
              borderRadius: 12, padding: '12px 14px', marginBottom: 20, fontSize: 13, color: C.muted,
            }}>
              <span style={{ color: C.teal, fontWeight: 600 }}>⚡ Bank details pre-filled from TruID.</span>
            </div>
          )}

          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Debit order details</div>
          <Select label="Bank" value={debit.bank}
            onChange={v => setDebit(p => ({...p, bank: v}))}
            options={[
              {value: '', label: 'Select bank…'}, {value: 'FNB', label: 'FNB'},
              {value: 'Absa', label: 'Absa'}, {value: 'Standard Bank', label: 'Standard Bank'},
              {value: 'Nedbank', label: 'Nedbank'}, {value: 'Capitec', label: 'Capitec'},
              {value: 'Investec', label: 'Investec'}, {value: 'TymeBank', label: 'TymeBank'},
            ]} />
          <Field label="Account number" value={debit.accountNumber}
            onChange={v => setDebit(p => ({...p, accountNumber: v}))}
            placeholder="Your account number"
            readOnly={isRefinance && !!debit.accountNumber} />
          <Select label="Account type" value={debit.accountType}
            onChange={v => setDebit(p => ({...p, accountType: v}))}
            options={[{value: 'Cheque', label: 'Cheque / Current'}, {value: 'Savings', label: 'Savings'}]} />
          <Select label="Debit date" value={debit.debitDay}
            onChange={v => setDebit(p => ({...p, debitDay: v}))}
            options={['1','5','10','15','20','25','30'].map(d => ({value: d, label: `${d}${d==='1'?'st':d==='5'?'th':d==='10'?'th':d==='15'?'th':d==='20'?'th':d==='25'?'th':'th'} of each month`}))} />

          <div style={{ height: 1, background: C.border, margin: '20px 0' }} />

          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Policy acceptance</div>
          <div style={{
            background: C.navyLight, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: '12px 14px', fontSize: 12, color: C.muted, lineHeight: 1.6, marginBottom: 16,
          }}>
            I, <strong style={{ color: C.white }}>{about.name || 'the client'}</strong>, hereby authorise
            Muḽo Financial Services (Pty) Ltd (FSP 49169) to debit my account with
            <strong style={{ color: C.white }}> R{totalPremium}/month</strong> for the selected insurance products,
            commencing on the <strong style={{ color: C.white }}>{debit.debitDay}</strong> of next month.
            I confirm I have read and understood the policy terms and conditions.
            This constitutes a valid electronic mandate in terms of the National Payment System Act.
          </div>

          <div
            onClick={() => setDebit(p => ({...p, signed: !p.signed}))}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer',
              background: debit.signed ? `${C.green}18` : C.subtle,
              border: `1.5px solid ${debit.signed ? C.green : C.border}`,
              borderRadius: 10, padding: '14px',
            }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: 4,
              background: debit.signed ? C.green : 'transparent',
              border: `2px solid ${debit.signed ? C.green : C.border}`,
              flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {debit.signed && <span style={{ color: C.navy, fontWeight: 700, fontSize: 14 }}>✓</span>}
            </div>
            <div style={{ fontSize: 13, color: C.muted }}>
              I sign this mandate electronically via SigniFlow and agree to the terms above.
              I understand this is a legally binding digital signature.
            </div>
          </div>

          <div style={{ marginTop: 12, fontSize: 11, color: C.muted }}>
            Muḽo Financial Services (Pty) Ltd · FSP 49169 · Authorised Financial Services Provider
          </div>
        </ScrollBody>
        <BottomBar>
          <Btn onClick={goNext} disabled={!canSign}>Bind my policies →</Btn>
        </BottomBar>
      </Screen>
    )
  }

  const renderScreen9 = () => {
    const policyRef = `MFS-${Date.now().toString(36).toUpperCase().slice(-6)}`

    return (
      <Screen>
        <TopBar title="You're covered" onBack={null} />
        <ScrollBody>
          <div style={{ textAlign: 'center', padding: '32px 0 24px' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>Welcome aboard!</h2>
            <p style={{ fontSize: 15, color: C.muted, margin: '0 0 24px', lineHeight: 1.6 }}>
              Your {selected.length} polic{selected.length > 1 ? 'ies are' : 'y is'} now active.
              Policy documents are on their way to {about.email || 'your email'}.
            </p>
            <div style={{
              background: `${C.green}18`, border: `1px solid ${C.green}33`,
              borderRadius: 14, padding: '18px', marginBottom: 20, textAlign: 'left',
            }}>
              <div style={{ fontSize: 13, color: C.green, fontWeight: 600, marginBottom: 6 }}>💸 Your cashback</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: C.white }}>R{totalCashback.toLocaleString()}</div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                Paid to your debit order account within 30 days of your policy start date.
              </div>
            </div>
          </div>

          {/* Policy summary */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Your policies
            </div>
            {selected.map(code => {
              const product = PRODUCTS.find(p => p.code === code)
              const q = selectedQuotes[code]
              if (!q) return null
              return (
                <div key={code} style={{
                  background: C.navyLight, border: `1px solid ${C.border}`,
                  borderRadius: 12, padding: '12px 14px', marginBottom: 8,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{product?.icon} {product?.label}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{q.insurer}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>R{q.premium}/mo</div>
                    <Badge color={C.green}>Active</Badge>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Next steps */}
          <div style={{
            background: C.navyLight, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: '14px 16px', marginBottom: 20,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>What happens next</div>
            {[
              { icon: '📧', text: `Policy documents emailed to ${about.email || 'you'}` },
              { icon: '📱', text: 'Policy schedule sent via WhatsApp' },
              { icon: `💳`, text: `First debit on ${debit.debitDay}${debit.debitDay==='1'?'st':'th'} of next month: R${totalPremium}` },
              { icon: '💸', text: `Cashback R${totalCashback} paid within 30 days` },
              { icon: '🔄', text: 'We\'ll re-quote all insurers at 12 months' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontSize: 16 }}>{s.icon}</span>
                <span style={{ fontSize: 13, color: C.muted }}>{s.text}</span>
              </div>
            ))}
          </div>

          {/* Cross-sell for refinance clients */}
          {isRefinance && (
            <div style={{
              background: `${C.teal}18`, border: `1px solid ${C.teal}33`,
              borderRadius: 12, padding: '14px 16px', marginBottom: 20,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.teal, marginBottom: 6 }}>Also on Muḽo</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>
                Based on your property equity and income profile, you may qualify for a refinance of up to R{((client?.property?.buildingValue || 2800000) * 0.25).toLocaleString()}.
              </div>
              <Btn variant="ghost" onClick={onBack}>Explore refinancing →</Btn>
            </div>
          )}

          <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
            <div style={{ fontSize: 11, color: C.muted }}>Policy ref: {policyRef}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
              Muḽo Financial Services (Pty) Ltd · FSP 49169
            </div>
          </div>
        </ScrollBody>
      </Screen>
    )
  }

  // ── Route to correct screen renderer ─────────────────────────────────────────
  switch (currentScreen) {
    case -1: return renderLanding()
    case 1: return renderScreen1()
    case 2: return renderScreen2()
    case 3: return renderScreen3()
    case 4: return renderScreen4()
    case 5: return renderScreen5()
    case 6: return renderScreen6()
    case 7: return renderScreen7()
    case 8: return renderScreen8()
    case 9: return renderScreen9()
    default: return null
  }
}
