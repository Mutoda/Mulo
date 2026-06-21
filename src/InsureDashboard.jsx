import React, { useState, useEffect } from 'react'

const API = 'https://z30zl849k8.execute-api.af-south-1.amazonaws.com/prod'
const NAVY = '#0A1628'
const TEAL = '#00B8A9'
const GREEN = '#1DB97A'

const PRODUCT_LABELS = {
  BUILDINGS: 'Buildings', CONTENTS: 'Home contents', CAR: 'Car insurance',
  ALLRISK: 'All risk', CARAVAN: 'Caravan', TRAILER: 'Trailer'
}
const PRODUCT_ICONS = {
  BUILDINGS: 'ti-home', CONTENTS: 'ti-sofa', CAR: 'ti-car',
  ALLRISK: 'ti-device-mobile', CARAVAN: 'ti-caravan', TRAILER: 'ti-tir'
}

export default function InsureDashboard() {
  const [phase, setPhase] = useState('loading') // loading|auth|otp|dashboard
  const [idNumber, setIdNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [maskedCell, setMaskedCell] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [client, setClient] = useState(null)
  const [policies, setPolicies] = useState([])
  const [selectedPolicy, setSelectedPolicy] = useState(null)

  // Check stored session
  useEffect(() => {
    const token = localStorage.getItem('mulo_insure_token')
    const idNum = localStorage.getItem('mulo_insure_id')
    if (token && idNum) {
      loadDashboard(idNum, token)
    } else {
      setPhase('auth')
    }
  }, [])

  const loadDashboard = async (idNum, token) => {
    try {
      const res = await fetch(`${API}/insure/client-policies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_number: idNum, token })
      })
      const data = await res.json()
      if (data.error) {
        localStorage.removeItem('mulo_insure_token')
        localStorage.removeItem('mulo_insure_id')
        setPhase('auth')
        return
      }
      setClient(data.client)
      setPolicies(data.policies || [])
      setPhase('dashboard')
    } catch {
      setPhase('auth')
    }
  }

  const handleIdSubmit = async () => {
    if (idNumber.length !== 13) return
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API}/insure/client-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_number: idNumber })
      })
      const data = await res.json()
      if (data.otpSent) {
        setMaskedCell(data.maskedCell)
        setPhase('otp')
      } else {
        setError(data.error || 'No account found for this ID number')
      }
    } catch { setError('Connection error') }
    setLoading(false)
  }

  const handleOtpVerify = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API}/insure/client-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_number: idNumber, otp })
      })
      const data = await res.json()
      if (data.token) {
        localStorage.setItem('mulo_insure_token', data.token)
        localStorage.setItem('mulo_insure_id', idNumber)
        setClient(data.client)
        setPolicies(data.policies || [])
        setPhase('dashboard')
      } else {
        setError(data.error || 'Invalid OTP')
      }
    } catch { setError('Connection error') }
    setLoading(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('mulo_insure_token')
    localStorage.removeItem('mulo_insure_id')
    setPhase('auth')
    setIdNumber(''); setOtp(''); setClient(null); setPolicies([])
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (phase === 'loading') return (
    <div style={{minHeight:'100vh',background:`linear-gradient(135deg,${NAVY},#1B3A5E)`,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'rgba(255,255,255,0.5)',fontSize:14}}>Loading…</div>
    </div>
  )

  // ── Auth screens ──────────────────────────────────────────────────────────
  if (phase === 'auth' || phase === 'otp') return (
    <div style={{minHeight:'100vh',background:`linear-gradient(135deg,${NAVY},#1B3A5E)`,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={{background:'#F7F9FC',borderRadius:24,padding:32,width:'100%',maxWidth:380,boxShadow:'0 8px 40px rgba(0,0,0,0.25)'}}>
        <div style={{fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:22,color:NAVY,marginBottom:4}}>
          Mu<span style={{color:TEAL}}>ḽ</span>o <span style={{fontSize:14,fontWeight:600,color:'#8FA3BE'}}>Insure</span>
        </div>
        <div style={{fontSize:13,color:'#8FA3BE',marginBottom:28}}>View your policies & coverage</div>

        {phase === 'auth' && <>
          <div style={{fontSize:11,fontWeight:600,color:'#8FA3BE',textTransform:'uppercase',letterSpacing:.8,marginBottom:6}}>SA ID number</div>
          <input type="tel" inputMode="numeric" maxLength={13} placeholder="13-digit ID number"
            value={idNumber} onChange={e=>{ setIdNumber(e.target.value.replace(/\D/g,'')); setError('') }}
            onKeyDown={e=>e.key==='Enter'&&idNumber.length===13&&handleIdSubmit()}
            style={{width:'100%',padding:'13px 16px',border:`1.5px solid ${error?'#FF5C5C':'#E2E9F0'}`,borderRadius:14,fontSize:16,outline:'none',background:'#fff',color:NAVY,marginBottom:16,boxSizing:'border-box',letterSpacing:2}}/>
          {error&&<div style={{fontSize:12,color:'#FF5C5C',marginBottom:10}}>{error}</div>}
          <button onClick={handleIdSubmit} disabled={idNumber.length!==13||loading}
            style={{width:'100%',padding:'15px',background:`linear-gradient(135deg,${TEAL},#1A73E8)`,border:'none',borderRadius:14,color:'#fff',fontSize:15,fontWeight:600,cursor:'pointer',opacity:idNumber.length!==13?0.5:1}}>
            {loading?'Sending OTP…':'Continue →'}
          </button>
          <div style={{textAlign:'center',marginTop:16}}>
            <a href="/insure" style={{fontSize:13,color:TEAL,textDecoration:'none'}}>Get new quotes →</a>
          </div>
        </>}

        {phase === 'otp' && <>
          <div style={{textAlign:'center',marginBottom:20}}>
            <div style={{fontSize:32,marginBottom:8}}>💬</div>
            <div style={{fontSize:15,fontWeight:700,color:NAVY,marginBottom:4}}>Check WhatsApp</div>
            <div style={{fontSize:13,color:'#8FA3BE'}}>We sent a code to {maskedCell}</div>
          </div>
          <input type="tel" inputMode="numeric" maxLength={6} placeholder="000000"
            value={otp} onChange={e=>{ setOtp(e.target.value.replace(/\D/g,'')); setError('') }}
            onKeyDown={e=>e.key==='Enter'&&otp.length===6&&handleOtpVerify()}
            style={{width:'100%',padding:'14px 16px',border:`1.5px solid ${error?'#FF5C5C':'#E2E9F0'}`,borderRadius:14,fontSize:22,letterSpacing:8,outline:'none',background:'#fff',color:NAVY,marginBottom:8,boxSizing:'border-box',textAlign:'center'}}/>
          {error&&<div style={{fontSize:12,color:'#FF5C5C',marginBottom:8}}>{error}</div>}
          <button onClick={handleOtpVerify} disabled={otp.length<6||loading}
            style={{width:'100%',padding:'15px',background:`linear-gradient(135deg,${TEAL},#1A73E8)`,border:'none',borderRadius:14,color:'#fff',fontSize:15,fontWeight:600,cursor:'pointer',opacity:otp.length<6?0.5:1}}>
            {loading?'Verifying…':'Sign in →'}
          </button>
          <div style={{textAlign:'center',marginTop:12}}>
            <span onClick={()=>{setPhase('auth');setOtp('');setError('')}} style={{fontSize:12,color:TEAL,cursor:'pointer'}}>← Back</span>
          </div>
        </>}

        <div style={{fontSize:11,color:'#C5D0DC',textAlign:'center',marginTop:20}}>Muḽo Financial Services (Pty) Ltd · FSP 49169</div>
      </div>
    </div>
  )

  // ── Policy detail ─────────────────────────────────────────────────────────
  if (selectedPolicy) {
    const p = selectedPolicy
    const daysToAnniversary = p.cover_start_date ? Math.ceil((new Date(p.cover_start_date).setFullYear(new Date(p.cover_start_date).getFullYear()+1) - Date.now()) / 86400000) : null
    const renewalSoon = daysToAnniversary && daysToAnniversary <= 60
    return (
      <div style={{minHeight:'100vh',background:'#F0F4F8',fontFamily:"'IBM Plex Sans',sans-serif"}}>
        <div style={{background:NAVY,padding:'16px 24px',display:'flex',alignItems:'center',gap:12}}>
          <button onClick={()=>setSelectedPolicy(null)} style={{background:'rgba(255,255,255,0.1)',border:'none',color:'#fff',borderRadius:10,padding:'8px 14px',cursor:'pointer',fontSize:13}}>← Back</button>
          <div style={{fontFamily:"'Sora',sans-serif",fontWeight:700,fontSize:16,color:'#fff',flex:1}}>{p.insurer}</div>
          <div style={{fontSize:11,padding:'4px 10px',borderRadius:99,background:GREEN+'22',color:GREEN,fontWeight:700}}>ACTIVE</div>
        </div>
        <div style={{maxWidth:600,margin:'0 auto',padding:24}}>
          {renewalSoon && (
            <div style={{background:'#FFF8E7',border:'1.5px solid #F4B942',borderRadius:16,padding:20,marginBottom:16}}>
              <div style={{fontSize:15,fontWeight:700,color:'#854F0B',marginBottom:6}}>⏰ Renewal in {daysToAnniversary} days</div>
              <div style={{fontSize:13,color:'#854F0B',marginBottom:12}}>Your policy renews soon. We'll find you the best rates automatically.</div>
              <button onClick={()=>window.location.href='/insure?start=1'}
                style={{padding:'10px 20px',background:'#F4B942',border:'none',borderRadius:12,color:'#fff',fontWeight:600,fontSize:13,cursor:'pointer'}}>
                Compare quotes now →
              </button>
            </div>
          )}
          <div style={{background:'#fff',borderRadius:16,padding:20,marginBottom:16,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
            <div style={{fontSize:11,fontWeight:700,color:'#8FA3BE',textTransform:'uppercase',letterSpacing:.8,marginBottom:12}}>Your cover</div>
            {(p.products||[]).map(code=>(
              <div key={code} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid #F0F4F8'}}>
                <div style={{width:40,height:40,borderRadius:12,background:NAVY,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <i className={`ti ${PRODUCT_ICONS[code]||'ti-shield'}`} style={{fontSize:18,color:TEAL}}/>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:600,color:NAVY}}>{PRODUCT_LABELS[code]||code}</div>
                  <div style={{fontSize:12,color:'#8FA3BE'}}>{p.insurer}</div>
                </div>
                <div style={{fontSize:14,fontWeight:700,color:NAVY}}>R{Math.round(Number(p.base_premium)/(p.products?.length||1)).toLocaleString()}/mo</div>
              </div>
            ))}
          </div>
          <div style={{background:'#fff',borderRadius:16,padding:20,marginBottom:16,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
            <div style={{fontSize:11,fontWeight:700,color:'#8FA3BE',textTransform:'uppercase',letterSpacing:.8,marginBottom:12}}>Premium</div>
            {[['Base premium',`R${Number(p.base_premium||0).toLocaleString()}/mo`],
              ['SASRIA levy',`R${Number(p.sasria_levy||0).toLocaleString()}/mo`],
              p.vaps_premium>0&&['VAPs',`R${Number(p.vaps_premium||0).toLocaleString()}/mo`],
              ['Total',`R${Number(p.total_premium||0).toLocaleString()}/mo`]].filter(Boolean).map(([l,v],i,arr)=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:i<arr.length-1?'1px solid #F0F4F8':'none'}}>
                <span style={{fontSize:13,color:i===arr.length-1?NAVY:'#8FA3BE',fontWeight:i===arr.length-1?700:400}}>{l}</span>
                <span style={{fontSize:13,fontWeight:700,color:NAVY}}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{background:'rgba(29,185,122,0.08)',border:'1px solid rgba(29,185,122,0.2)',borderRadius:16,padding:20,marginBottom:16}}>
            <div style={{fontSize:14,fontWeight:700,color:GREEN,marginBottom:4}}>💸 Cashback</div>
            <div style={{fontSize:24,fontWeight:800,color:GREEN,fontFamily:"'Sora',sans-serif"}}>R{Number(p.cashback_amount||p.base_premium||0).toLocaleString()}</div>
            <div style={{fontSize:12,color:'#5A7A9A',marginTop:4}}>Status: <span style={{fontWeight:600,color:p.cashback_status==='paid'?GREEN:'#F4B942'}}>{(p.cashback_status||'pending').toUpperCase()}</span></div>
          </div>
          <div style={{background:'#fff',borderRadius:16,padding:20,marginBottom:16,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
            <div style={{fontSize:11,fontWeight:700,color:'#8FA3BE',textTransform:'uppercase',letterSpacing:.8,marginBottom:12}}>Debit order</div>
            {[['Bank',p.bank_name||'—'],['Account',p.bank_account||'—'],['Type',p.bank_account_type||'—'],['Debit day',p.debit_day?`${p.debit_day}${[1,21,31].includes(p.debit_day)?'st':[2,22].includes(p.debit_day)?'nd':[3,23].includes(p.debit_day)?'rd':'th'} of month`:'—']].map(([l,v])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid #F0F4F8'}}>
                <span style={{fontSize:12,color:'#8FA3BE'}}>{l}</span>
                <span style={{fontSize:13,fontWeight:500,color:NAVY}}>{v}</span>
              </div>
            ))}
          </div>
          <button onClick={()=>window.location.href='/insure?start=1'}
            style={{width:'100%',padding:'15px',background:`linear-gradient(135deg,${TEAL},#1A73E8)`,border:'none',borderRadius:14,color:'#fff',fontSize:15,fontWeight:600,cursor:'pointer',boxShadow:'0 8px 24px rgba(0,184,169,0.35)'}}>
            Get comparative quotes →
          </button>
        </div>
      </div>
    )
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  const totalPremium = policies.reduce((s,p)=>s+Number(p.total_premium||0),0)
  const totalCashback = policies.reduce((s,p)=>s+Number(p.cashback_amount||p.base_premium||0),0)
  const firstName = client?.first_name || 'there'

  return (
    <div style={{minHeight:'100vh',background:'#F0F4F8',fontFamily:"'IBM Plex Sans',sans-serif"}}>
      {/* Header */}
      <div style={{background:`linear-gradient(135deg,${NAVY},#1B3A5E)`,padding:'24px 24px 40px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div style={{fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:20,color:'#fff'}}>
            Mu<span style={{color:TEAL}}>ḽ</span>o <span style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.5)'}}>insure</span>
          </div>
          <button onClick={handleLogout} style={{background:'rgba(255,255,255,0.1)',border:'none',color:'rgba(255,255,255,0.6)',borderRadius:10,padding:'7px 14px',cursor:'pointer',fontSize:12}}>Sign out</button>
        </div>
        <div style={{fontSize:14,color:'rgba(255,255,255,0.6)',marginBottom:4}}>Welcome back</div>
        <div style={{fontFamily:"'Sora',sans-serif",fontSize:24,fontWeight:800,color:'#fff',marginBottom:20}}>{firstName} 👋</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div style={{background:'rgba(255,255,255,0.08)',borderRadius:14,padding:16}}>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.5)',marginBottom:4}}>MONTHLY PREMIUM</div>
            <div style={{fontFamily:"'Sora',sans-serif",fontSize:22,fontWeight:800,color:'#fff'}}>R{totalPremium.toLocaleString()}</div>
          </div>
          <div style={{background:'rgba(255,255,255,0.08)',borderRadius:14,padding:16}}>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.5)',marginBottom:4}}>CASHBACK</div>
            <div style={{fontFamily:"'Sora',sans-serif",fontSize:22,fontWeight:800,color:GREEN}}>R{totalCashback.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div style={{maxWidth:600,margin:'-20px auto 0',padding:'0 16px 32px',position:'relative'}}>
        {/* Policies */}
        <div style={{fontSize:13,fontWeight:700,color:'#8FA3BE',textTransform:'uppercase',letterSpacing:.8,marginBottom:12,marginTop:8}}>Your policies</div>
        {policies.length===0 && (
          <div style={{background:'#fff',borderRadius:16,padding:32,textAlign:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
            <div style={{fontSize:32,marginBottom:12}}>🛡️</div>
            <div style={{fontSize:15,fontWeight:600,color:NAVY,marginBottom:8}}>No active policies</div>
            <div style={{fontSize:13,color:'#8FA3BE',marginBottom:20}}>Get covered today and earn cashback on your first premium.</div>
            <button onClick={()=>window.location.href='/insure?start=1'}
              style={{padding:'12px 24px',background:`linear-gradient(135deg,${TEAL},#1A73E8)`,border:'none',borderRadius:14,color:'#fff',fontWeight:600,fontSize:14,cursor:'pointer'}}>
              Get quotes →
            </button>
          </div>
        )}
        {policies.map(p=>(
          <div key={p.id} onClick={()=>setSelectedPolicy(p)}
            style={{background:'#fff',borderRadius:16,padding:20,marginBottom:12,boxShadow:'0 2px 8px rgba(0,0,0,0.06)',cursor:'pointer'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
              <div>
                <div style={{fontFamily:"'Sora',sans-serif",fontSize:16,fontWeight:700,color:NAVY}}>{p.insurer}</div>
                <div style={{fontSize:12,color:'#8FA3BE',marginTop:2}}>{p.reference}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:18,fontWeight:800,color:NAVY,fontFamily:"'Sora',sans-serif"}}>R{Number(p.total_premium||0).toLocaleString()}<span style={{fontSize:12,fontWeight:400,color:'#8FA3BE'}}>/mo</span></div>
                <div style={{fontSize:11,padding:'3px 8px',borderRadius:99,background:GREEN+'22',color:GREEN,fontWeight:700,marginTop:4,display:'inline-block'}}>{(p.status||'active').toUpperCase()}</div>
              </div>
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {(p.products||[]).map(code=>(
                <div key={code} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 10px',background:'#F7F9FC',borderRadius:10,border:'1px solid #E2E9F0'}}>
                  <div style={{width:24,height:24,borderRadius:6,background:NAVY,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <i className={`ti ${PRODUCT_ICONS[code]||'ti-shield'}`} style={{fontSize:12,color:TEAL}}/>
                  </div>
                  <span style={{fontSize:12,color:NAVY,fontWeight:500}}>{PRODUCT_LABELS[code]||code}</span>
                </div>
              ))}
            </div>
            {p.cashback_amount && (
              <div style={{marginTop:12,padding:'8px 12px',background:'rgba(29,185,122,0.06)',borderRadius:10,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:12,color:'#5A7A9A'}}>💸 Cashback</span>
                <span style={{fontSize:13,fontWeight:700,color:GREEN}}>R{Number(p.cashback_amount).toLocaleString()} · {(p.cashback_status||'pending').toUpperCase()}</span>
              </div>
            )}
          </div>
        ))}

        {/* CTA */}
        <button onClick={()=>window.location.href='/insure?start=1'}
          style={{width:'100%',padding:'16px',background:`linear-gradient(135deg,${TEAL},#1A73E8)`,border:'none',borderRadius:16,color:'#fff',fontSize:15,fontWeight:600,cursor:'pointer',boxShadow:'0 8px 24px rgba(0,184,169,0.35)',marginTop:8}}>
          Get comparative quotes →
        </button>
        <div style={{fontSize:11,color:'#C5D0DC',textAlign:'center',marginTop:16}}>Muḽo Financial Services (Pty) Ltd · FSP 49169</div>
      </div>
    </div>
  )
}
