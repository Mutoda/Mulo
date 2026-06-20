import React, { useState, useEffect } from 'react'

const NAVY = '#0A1628'
const TEAL = '#00B8A9'
const GREEN = '#1DB97A'

// ── Mock data mirroring real insure_policies + insure_clients schema ──────
const MOCK_POLICIES = [
  {id:'POL-001',ref:'MULO-1781591538566',status:'active',
   client:{name:'Thabo Nkosi',id_number:'8001015009087',email:'thabo@example.com',cell:'0821234567'},
   insurer:'King Price',products:['BUILDINGS','CONTENTS','CAR'],
   premium:1486,sasria:18,vaps:89,total:1593,
   cashback:1486,cashback_status:'pending',cashback_due:'2026-07-15',
   cover_start:'2026-06-16',debit_day:1,
   bank:{bank:'Absa',account:'4087654321',type:'Cheque'},
   payments:[
     {date:'2026-07-01',amount:1593,status:'paid'},
   ],
   risk:{property:{address:'12 Oak Avenue, Sandton, 2196',roof:'Tiles',walls:'Brick & plaster',alarm:'Yes — monitored',armed:'Yes',building_value:3200000,contents_value:180000},
         vehicle:{make:'Toyota',model:'Hilux',variant:'2.8 GD-6 RB Raider A/T',year:'2022',colour:'White',reg:'GP 12 ABC',financed:true,finance_house:'WesBank'},
         driver:{regular:'Myself',licence:'Code 8',licence_date:'2003-03-15',claims:'No',parking:'Garage',parking_address:'12 Oak Avenue, Sandton',tracking:'Yes',tracker:'Tracker'}}},
  {id:'POL-002',ref:'MULO-1781592000000',status:'active',
   client:{name:'Nomsa Dlamini',id_number:'8504120087083',email:'nomsa@example.com',cell:'0834567890'},
   insurer:'Naked Insurance',products:['CAR','ALLRISK'],
   premium:878,sasria:11,vaps:154,total:1043,
   cashback:878,cashback_status:'paid',cashback_due:'2026-06-20',cashback_paid:'2026-06-20',
   cover_start:'2026-05-20',debit_day:25,
   bank:{bank:'Capitec',account:'1234567890',type:'Savings'},
   payments:[
     {date:'2026-06-25',amount:1043,status:'paid'},
     {date:'2026-05-25',amount:1043,status:'paid'},
   ],
   risk:{vehicle:{make:'Volkswagen',model:'Polo Vivo',variant:'1.6 GT 5-dr',year:'2021',colour:'Silver',reg:'WC 45 DEF',financed:false},
         driver:{regular:'Myself',licence:'Code 8',licence_date:'2010-07-22',claims:'No',parking:'Carport',parking_address:'45 Beach Road, Sea Point',tracking:'No'}}},
  {id:'POL-003',ref:'MULO-1781593000000',status:'lapsed',
   client:{name:'Sipho Mahlangu',id_number:'7712085012083',email:'sipho@example.com',cell:'0761234567'},
   insurer:'Pineapple',products:['BUILDINGS','CONTENTS'],
   premium:1143,sasria:14,vaps:0,total:1157,
   cashback:1143,cashback_status:'clawback',cashback_due:'2026-06-01',
   cover_start:'2026-04-01',debit_day:5,
   bank:{bank:'FNB / RMB',account:'9876543210',type:'Cheque'},
   payments:[
     {date:'2026-05-05',amount:1157,status:'failed'},
     {date:'2026-04-05',amount:1157,status:'paid'},
   ],
   risk:{property:{address:'88 Pretoria Street, Hatfield, 0083',roof:'IBR / Corrugated iron',walls:'Brick & plaster',alarm:'No',armed:'No',building_value:1800000,contents_value:95000}}},
]

const STATUS_COLOUR = {active:GREEN, lapsed:'#FF5C5C', pending:'#F4B942', cancelled:'#8FA3BE'}
const CASHBACK_COLOUR = {paid:GREEN, pending:'#F4B942', clawback:'#FF5C5C'}

const PIN = '1234' // replace with env var later

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [tab, setTab] = useState('dashboard')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [refinanceData, setRefinanceData] = useState([])
  const [refinanceLoading, setRefinanceLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')

  // Load refinance applicants when tab selected
  useEffect(()=>{
    if(!authed||tab!=='refinance')return
    setRefinanceLoading(true)
    fetch('https://z30zl849k8.execute-api.af-south-1.amazonaws.com/prod/admin/applications')
      .then(r=>r.json())
      .then(d=>{ setRefinanceData(d.applicants||[]); setRefinanceLoading(false) })
      .catch(()=>setRefinanceLoading(false))
  },[tab,authed])

  // ── PIN screen ────────────────────────────────────────────────────────────
  if (!authed) return (
    <div style={{minHeight:'100vh',background:`linear-gradient(135deg,${NAVY},#1B3A5E)`,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={{background:'#F7F9FC',borderRadius:24,padding:32,width:'100%',maxWidth:360,boxShadow:'0 8px 40px rgba(0,0,0,0.25)'}}>
        <div style={{fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:22,color:NAVY,marginBottom:4}}>Mu<span style={{color:TEAL}}>ḽ</span>o <span style={{fontSize:14,fontWeight:600,color:'#8FA3BE'}}>Admin</span></div>
        <div style={{fontSize:13,color:'#8FA3BE',marginBottom:28}}>Policy Administration System</div>
        <div style={{fontSize:11,fontWeight:600,color:'#8FA3BE',textTransform:'uppercase',letterSpacing:.8,marginBottom:8}}>Access PIN</div>
        <input type="password" inputMode="numeric" maxLength={6} placeholder="Enter PIN"
          value={pin} onChange={e=>{setPin(e.target.value);setPinError(false)}}
          onKeyDown={e=>e.key==='Enter'&&(pin===PIN?setAuthed(true):setPinError(true))}
          style={{width:'100%',padding:'14px 16px',border:`1.5px solid ${pinError?'#FF5C5C':'#E2E9F0'}`,borderRadius:14,fontSize:18,letterSpacing:8,outline:'none',background:'#fff',color:NAVY,marginBottom:8,boxSizing:'border-box'}}/>
        {pinError&&<div style={{fontSize:12,color:'#FF5C5C',marginBottom:8}}>Incorrect PIN</div>}
        <button onClick={()=>pin===PIN?setAuthed(true):setPinError(true)}
          style={{width:'100%',padding:'15px',background:`linear-gradient(135deg,${TEAL},#1A73E8)`,border:'none',borderRadius:14,color:'#fff',fontSize:15,fontWeight:600,cursor:'pointer',boxShadow:'0 8px 24px rgba(0,184,169,0.35)'}}>
          Sign in →
        </button>
        <div style={{fontSize:11,color:'#C5D0DC',textAlign:'center',marginTop:16}}>Muḽo Financial Services (Pty) Ltd · FSP 49169</div>
      </div>
    </div>
  )

  // ── Policy detail ─────────────────────────────────────────────────────────
  if (selected) {
    const p = selected
    const sasriaAmt = p.sasria
    const vapsAmt = p.vaps
    return (
      <div style={{minHeight:'100vh',background:'#F0F4F8',fontFamily:"'IBM Plex Sans',sans-serif"}}>
        <div style={{background:NAVY,padding:'16px 24px',display:'flex',alignItems:'center',gap:12}}>
          <button onClick={()=>setSelected(null)} style={{background:'rgba(255,255,255,0.1)',border:'none',color:'#fff',borderRadius:10,padding:'8px 14px',cursor:'pointer',fontSize:13}}>← Back</button>
          <div style={{fontFamily:"'Sora',sans-serif",fontWeight:700,fontSize:16,color:'#fff',flex:1}}>{p.client.name}</div>
          <div style={{fontSize:11,padding:'4px 10px',borderRadius:99,background:STATUS_COLOUR[p.status]+'22',color:STATUS_COLOUR[p.status],fontWeight:700,textTransform:'uppercase'}}>{p.status}</div>
        </div>
        <div style={{maxWidth:800,margin:'0 auto',padding:24}}>

          {/* Policy summary */}
          <div style={{background:'#fff',borderRadius:16,padding:20,marginBottom:16,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
            <div style={{fontSize:11,fontWeight:700,color:'#8FA3BE',textTransform:'uppercase',letterSpacing:.8,marginBottom:12}}>Policy summary</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {[['Reference',p.ref],['Insurer',p.insurer],['Cover start',p.cover_start],['Debit day',`${p.debit_day}${p.debit_day===1?'st':p.debit_day===20?'th':'th'} of month`],
                ['Products',p.products.join(', ')],['Status',p.status.toUpperCase()]].map(([l,v])=>(
                <div key={l}><div style={{fontSize:11,color:'#8FA3BE',marginBottom:2}}>{l}</div><div style={{fontSize:14,fontWeight:600,color:NAVY}}>{v}</div></div>
              ))}
            </div>
          </div>

          {/* Premium breakdown */}
          <div style={{background:'#fff',borderRadius:16,padding:20,marginBottom:16,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
            <div style={{fontSize:11,fontWeight:700,color:'#8FA3BE',textTransform:'uppercase',letterSpacing:.8,marginBottom:12}}>Premium breakdown</div>
            {[['Base premium',`R${p.premium.toLocaleString()}/mo`],['SASRIA levy',`R${sasriaAmt}/mo`],vapsAmt>0&&['VAPs',`R${vapsAmt}/mo`],['Total collected',`R${p.total.toLocaleString()}/mo`]].filter(Boolean).map(([l,v],i,arr)=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:i<arr.length-1?'1px solid #F0F4F8':'none'}}>
                <span style={{fontSize:13,color:i===arr.length-1?NAVY:'#8FA3BE',fontWeight:i===arr.length-1?700:400}}>{l}</span>
                <span style={{fontSize:13,fontWeight:700,color:i===arr.length-1?NAVY:'#0A1628'}}>{v}</span>
              </div>
            ))}
          </div>

          {/* Cashback */}
          <div style={{background:'#fff',borderRadius:16,padding:20,marginBottom:16,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
            <div style={{fontSize:11,fontWeight:700,color:'#8FA3BE',textTransform:'uppercase',letterSpacing:.8,marginBottom:12}}>Cashback</div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <span style={{fontSize:13,color:'#8FA3BE'}}>Cashback amount</span>
              <span style={{fontSize:16,fontWeight:700,color:GREEN}}>R{p.cashback.toLocaleString()}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <span style={{fontSize:13,color:'#8FA3BE'}}>Status</span>
              <span style={{fontSize:12,fontWeight:700,padding:'3px 10px',borderRadius:99,background:CASHBACK_COLOUR[p.cashback_status]+'22',color:CASHBACK_COLOUR[p.cashback_status]}}>{p.cashback_status.toUpperCase()}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:13,color:'#8FA3BE'}}>{p.cashback_status==='paid'?'Paid on':'Due by'}</span>
              <span style={{fontSize:13,fontWeight:600,color:NAVY}}>{p.cashback_status==='paid'?p.cashback_paid:p.cashback_due}</span>
            </div>
          </div>

          {/* Payment history */}
          <div style={{background:'#fff',borderRadius:16,padding:20,marginBottom:16,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
            <div style={{fontSize:11,fontWeight:700,color:'#8FA3BE',textTransform:'uppercase',letterSpacing:.8,marginBottom:12}}>Payment history</div>
            {p.payments.map((pay,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:i<p.payments.length-1?'1px solid #F0F4F8':'none'}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:NAVY}}>{pay.date}</div>
                  <div style={{fontSize:11,color:'#8FA3BE'}}>Debit order</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:14,fontWeight:700,color:NAVY}}>R{pay.amount.toLocaleString()}</div>
                  <div style={{fontSize:11,fontWeight:700,color:pay.status==='paid'?GREEN:'#FF5C5C'}}>{pay.status.toUpperCase()}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Client details */}
          <div style={{background:'#fff',borderRadius:16,padding:20,marginBottom:16,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
            <div style={{fontSize:11,fontWeight:700,color:'#8FA3BE',textTransform:'uppercase',letterSpacing:.8,marginBottom:12}}>Policyholder</div>
            {[['Full name',p.client.name],['ID number',p.client.id_number],['Email',p.client.email],['Mobile',p.client.cell],
              ['Bank',p.bank.bank],['Account',p.bank.account],['Account type',p.bank.type]].map(([l,v])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid #F0F4F8'}}>
                <span style={{fontSize:12,color:'#8FA3BE'}}>{l}</span>
                <span style={{fontSize:13,fontWeight:500,color:NAVY}}>{v}</span>
              </div>
            ))}
          </div>

          {/* Risk details */}
          {p.risk.property&&<div style={{background:'#fff',borderRadius:16,padding:20,marginBottom:16,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
            <div style={{fontSize:11,fontWeight:700,color:'#8FA3BE',textTransform:'uppercase',letterSpacing:.8,marginBottom:12}}>Property risk</div>
            {[['Address',p.risk.property.address],['Roof',p.risk.property.roof],['Walls',p.risk.property.walls],
              ['Alarm',p.risk.property.alarm],['Armed response',p.risk.property.armed],
              ['Building value',`R${p.risk.property.building_value?.toLocaleString()}`],
              ['Contents value',`R${p.risk.property.contents_value?.toLocaleString()}`]].map(([l,v])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid #F0F4F8'}}>
                <span style={{fontSize:12,color:'#8FA3BE'}}>{l}</span>
                <span style={{fontSize:13,fontWeight:500,color:NAVY}}>{v}</span>
              </div>
            ))}
          </div>}

          {p.risk.vehicle&&<div style={{background:'#fff',borderRadius:16,padding:20,marginBottom:16,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
            <div style={{fontSize:11,fontWeight:700,color:'#8FA3BE',textTransform:'uppercase',letterSpacing:.8,marginBottom:12}}>Vehicle risk</div>
            {[['Vehicle',`${p.risk.vehicle.year} ${p.risk.vehicle.make} ${p.risk.vehicle.model}`],
              ['Variant',p.risk.vehicle.variant],['Colour',p.risk.vehicle.colour],['Reg',p.risk.vehicle.reg],
              ['Financed',p.risk.vehicle.financed?`Yes — ${p.risk.vehicle.finance_house}`:'No'],
              ['Regular driver',p.risk.driver?.regular],['Licence',p.risk.driver?.licence],
              ['Parking',p.risk.driver?.parking],['Tracking',p.risk.driver?.tracking==='Yes'?`Yes — ${p.risk.driver?.tracker}`:'No']].filter(([,v])=>v).map(([l,v])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid #F0F4F8'}}>
                <span style={{fontSize:12,color:'#8FA3BE'}}>{l}</span>
                <span style={{fontSize:13,fontWeight:500,color:NAVY}}>{v}</span>
              </div>
            ))}
          </div>}

        </div>
      </div>
    )
  }

  // ── Main admin shell ──────────────────────────────────────────────────────
  const filtered = MOCK_POLICIES.filter(p=>{
    const matchSearch = !search || p.client.name.toLowerCase().includes(search.toLowerCase()) || p.ref.includes(search) || p.insurer.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter==='all' || p.status===statusFilter
    return matchSearch && matchStatus
  })

  const totalPremium = MOCK_POLICIES.filter(p=>p.status==='active').reduce((s,p)=>s+p.total,0)
  const totalCashbackLiability = MOCK_POLICIES.filter(p=>p.cashback_status==='pending').reduce((s,p)=>s+p.cashback,0)
  const totalPolicies = MOCK_POLICIES.length
  const activePolicies = MOCK_POLICIES.filter(p=>p.status==='active').length

  return (
    <div style={{minHeight:'100vh',background:'#F0F4F8',fontFamily:"'IBM Plex Sans',sans-serif"}}>
      {/* Top nav */}
      <div style={{background:NAVY,padding:'0 24px',display:'flex',alignItems:'center',gap:24,height:56}}>
        <div style={{fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:18,color:'#fff'}}>Mu<span style={{color:TEAL}}>ḽ</span>o <span style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.4)'}}>admin</span></div>
        <div style={{flex:1,display:'flex',gap:4}}>
          {[['dashboard','Dashboard'],['policies','Policies'],['clients','Clients'],['payments','Payments'],['refinance','Refinance']].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)}
              style={{padding:'6px 14px',borderRadius:8,border:'none',background:tab===k?'rgba(255,255,255,0.12)':'transparent',color:tab===k?'#fff':'rgba(255,255,255,0.5)',fontSize:13,fontWeight:600,cursor:'pointer'}}>
              {l}
            </button>
          ))}
        </div>
        <div style={{fontSize:12,color:'rgba(255,255,255,0.4)'}}>FSP 49169</div>
      </div>

      <div style={{maxWidth:1100,margin:'0 auto',padding:24}}>

        {/* Dashboard tab */}
        {tab==='dashboard'&&<>
          <div style={{fontSize:20,fontWeight:700,color:NAVY,marginBottom:20,fontFamily:"'Sora',sans-serif"}}>Overview</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:28}}>
            {[['Total policies',totalPolicies,'📋',NAVY],['Active policies',activePolicies,'✅',GREEN],
              ['Monthly premium',`R${totalPremium.toLocaleString()}`,' 💰',TEAL],['Cashback liability',`R${totalCashbackLiability.toLocaleString()}`,'💸','#F4B942']].map(([l,v,icon,col])=>(
              <div key={l} style={{background:'#fff',borderRadius:16,padding:20,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
                <div style={{fontSize:22,marginBottom:8}}>{icon}</div>
                <div style={{fontSize:24,fontWeight:800,color:col,fontFamily:"'Sora',sans-serif"}}>{v}</div>
                <div style={{fontSize:12,color:'#8FA3BE',marginTop:4}}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:15,fontWeight:700,color:NAVY,marginBottom:12}}>Recent policies</div>
          <PolicyTable policies={MOCK_POLICIES.slice(0,5)} onSelect={setSelected}/>
        </>}

        {/* Policies tab */}
        {tab==='policies'&&<>
          <div style={{display:'flex',gap:12,marginBottom:20,alignItems:'center'}}>
            <div style={{fontSize:20,fontWeight:700,color:NAVY,fontFamily:"'Sora',sans-serif",flex:1}}>Policies</div>
            <input placeholder="Search name, ref, insurer…" value={search} onChange={e=>setSearch(e.target.value)}
              style={{padding:'10px 14px',border:'1.5px solid #E2E9F0',borderRadius:12,fontSize:13,outline:'none',width:260,background:'#fff',color:NAVY}}/>
            <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
              style={{padding:'10px 14px',border:'1.5px solid #E2E9F0',borderRadius:12,fontSize:13,outline:'none',background:'#fff',color:NAVY}}>
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="lapsed">Lapsed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <PolicyTable policies={filtered} onSelect={setSelected}/>
        </>}

        {/* Clients tab */}
        {tab==='clients'&&<>
          <div style={{fontSize:20,fontWeight:700,color:NAVY,marginBottom:20,fontFamily:"'Sora',sans-serif"}}>Clients</div>
          {(()=>{
            // Group policies by client ID number
            const clients = {}
            MOCK_POLICIES.forEach(p=>{
              const key = p.client.id_number
              if(!clients[key]) clients[key] = {client:p.client, policies:[]}
              clients[key].policies.push(p)
            })
            return Object.values(clients).map(({client,policies})=>{
              const totalPremium = policies.reduce((s,p)=>s+p.total,0)
              const totalCashback = policies.reduce((s,p)=>s+p.cashback,0)
              const allActive = policies.every(p=>p.status==='active')
              return(
                <div key={client.id_number} style={{background:'#fff',borderRadius:16,boxShadow:'0 2px 8px rgba(0,0,0,0.06)',marginBottom:16,overflow:'hidden'}}>
                  {/* Client header */}
                  <div style={{padding:'16px 20px',borderBottom:'1px solid #F0F4F8',display:'flex',alignItems:'center',gap:16}}>
                    <div style={{width:44,height:44,borderRadius:14,background:`linear-gradient(135deg,${TEAL},#1A73E8)`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Sora',sans-serif",fontSize:16,fontWeight:700,color:'#fff',flexShrink:0}}>
                      {client.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:16,fontWeight:700,color:NAVY}}>{client.name}</div>
                      <div style={{fontSize:12,color:'#8FA3BE',marginTop:2}}>{client.id_number} · {client.email} · {client.cell}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:16,fontWeight:800,color:NAVY}}>R{totalPremium.toLocaleString()}/mo</div>
                      <div style={{fontSize:11,color:GREEN,fontWeight:600}}>💸 R{totalCashback.toLocaleString()} cashback</div>
                    </div>
                  </div>
                  {/* Policies for this client */}
                  <div style={{padding:'8px 20px 16px'}}>
                    <div style={{fontSize:11,fontWeight:700,color:'#8FA3BE',textTransform:'uppercase',letterSpacing:.5,margin:'10px 0 8px'}}>{policies.length} polic{policies.length===1?'y':'ies'}</div>
                    {policies.map(p=>(
                      <div key={p.id} onClick={()=>setSelected(p)} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',borderRadius:12,border:'1.5px solid #E2E9F0',marginBottom:8,cursor:'pointer',transition:'all .15s'}}
                        onMouseEnter={e=>e.currentTarget.style.background='#F7F9FC'}
                        onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,fontWeight:600,color:NAVY}}>{p.insurer} · {p.products.join(', ')}</div>
                          <div style={{fontSize:11,color:'#8FA3BE',marginTop:2}}>{p.ref} · Start: {p.cover_start}</div>
                        </div>
                        <div style={{textAlign:'right',flexShrink:0}}>
                          <div style={{fontSize:14,fontWeight:700,color:NAVY}}>R{p.total.toLocaleString()}/mo</div>
                          <div style={{display:'flex',gap:6,justifyContent:'flex-end',marginTop:4}}>
                            <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:99,background:STATUS_COLOUR[p.status]+'22',color:STATUS_COLOUR[p.status]}}>{p.status.toUpperCase()}</span>
                            <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:99,background:CASHBACK_COLOUR[p.cashback_status]+'22',color:CASHBACK_COLOUR[p.cashback_status]}}>{p.cashback_status}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
          })()}
        </>}

        {/* Payments tab */}
        {tab==='payments'&&<>
          <div style={{fontSize:20,fontWeight:700,color:NAVY,marginBottom:20,fontFamily:"'Sora',sans-serif"}}>Payments</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:24}}>
            {[['Collected this month',`R${MOCK_POLICIES.filter(p=>p.status==='active').reduce((s,p)=>s+p.total,0).toLocaleString()}`,'💰',GREEN],
              ['Cashback paid',`R${MOCK_POLICIES.filter(p=>p.cashback_status==='paid').reduce((s,p)=>s+p.cashback,0).toLocaleString()}`,'💸',TEAL],
              ['Failed debits','1','⚠️','#FF5C5C']].map(([l,v,icon,col])=>(
              <div key={l} style={{background:'#fff',borderRadius:16,padding:20,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
                <div style={{fontSize:22,marginBottom:8}}>{icon}</div>
                <div style={{fontSize:24,fontWeight:800,color:col,fontFamily:"'Sora',sans-serif"}}>{v}</div>
                <div style={{fontSize:12,color:'#8FA3BE',marginTop:4}}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{background:'#fff',borderRadius:16,boxShadow:'0 2px 8px rgba(0,0,0,0.06)',overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:'#F7F9FC'}}>
                {['Client','Date','Amount','Type','Status'].map(h=>(
                  <th key={h} style={{padding:'12px 16px',textAlign:'left',fontSize:11,fontWeight:700,color:'#8FA3BE',textTransform:'uppercase',letterSpacing:.5}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {MOCK_POLICIES.flatMap(p=>p.payments.map(pay=>({...pay,client:p.client.name,ref:p.ref}))).sort((a,b)=>b.date.localeCompare(a.date)).map((pay,i)=>(
                  <tr key={i} style={{borderTop:'1px solid #F0F4F8'}}>
                    <td style={{padding:'12px 16px',fontSize:14,fontWeight:600,color:NAVY}}>{pay.client}</td>
                    <td style={{padding:'12px 16px',fontSize:13,color:'#5A7A9A'}}>{pay.date}</td>
                    <td style={{padding:'12px 16px',fontSize:14,fontWeight:700,color:NAVY}}>R{pay.amount.toLocaleString()}</td>
                    <td style={{padding:'12px 16px',fontSize:13,color:'#5A7A9A'}}>Debit order</td>
                    <td style={{padding:'12px 16px'}}>
                      <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:99,background:pay.status==='paid'?GREEN+'22':'#FF5C5C22',color:pay.status==='paid'?GREEN:'#FF5C5C'}}>{pay.status.toUpperCase()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>}

        {/* Refinance tab */}
        {tab==='refinance'&&<>
          <div style={{fontSize:20,fontWeight:700,color:NAVY,marginBottom:20,fontFamily:"'Sora',sans-serif"}}>Refinance applicants</div>
          {refinanceLoading&&<div style={{textAlign:'center',padding:40,color:'#8FA3BE'}}>Loading...</div>}
          {!refinanceLoading&&<div style={{background:'#fff',borderRadius:16,boxShadow:'0 2px 8px rgba(0,0,0,0.06)',overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:'#F7F9FC'}}>
                {['Applicant','DOB','Cell','Stage','Score','Loan amount','Monthly saving','Applied'].map(h=>(
                  <th key={h} style={{padding:'12px 16px',textAlign:'left',fontSize:11,fontWeight:700,color:'#8FA3BE',textTransform:'uppercase',letterSpacing:.5,whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {refinanceData.map((a,i)=>(
                  <tr key={a.id} style={{borderTop:'1px solid #F0F4F8'}}>
                    <td style={{padding:'12px 16px'}}>
                      <div style={{fontSize:13,fontWeight:600,color:NAVY}}>{a.email_plain||'—'}</div>
                      <div style={{fontSize:11,color:'#8FA3BE'}}>{a.cellphone||'—'}</div>
                    </td>
                    <td style={{padding:'12px 16px',fontSize:13,color:'#5A7A9A'}}>{a.date_of_birth||'—'}</td>
                    <td style={{padding:'12px 16px',fontSize:13,color:'#5A7A9A'}}>{a.cellphone||'—'}</td>
                    <td style={{padding:'12px 16px'}}>
                      <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:99,background:a.current_screen==='dashboard'?GREEN+'22':TEAL+'22',color:a.current_screen==='dashboard'?GREEN:TEAL}}>
                        {a.current_screen||'id-verify'}
                      </span>
                    </td>
                    <td style={{padding:'12px 16px',fontSize:13,fontWeight:700,color:a.mulo_score>=700?GREEN:a.mulo_score>=600?'#F4B942':'#FF5C5C'}}>{a.mulo_score||'—'}</td>
                    <td style={{padding:'12px 16px',fontSize:13,fontWeight:700,color:NAVY}}>{a.loan_amount?`R${Number(a.loan_amount).toLocaleString()}`:'—'}</td>
                    <td style={{padding:'12px 16px',fontSize:13,fontWeight:700,color:GREEN}}>{a.monthly_saving?`R${Number(a.monthly_saving).toLocaleString()}/mo`:'—'}</td>
                    <td style={{padding:'12px 16px',fontSize:11,color:'#8FA3BE'}}>{a.created_at?new Date(a.created_at).toLocaleDateString('en-ZA'):'—'}</td>
                  </tr>
                ))}
                {refinanceData.length===0&&<tr><td colSpan={8} style={{padding:32,textAlign:'center',color:'#8FA3BE'}}>No applicants found</td></tr>}
              </tbody>
            </table>
          </div>}
        </>}

      </div>
    </div>
  )
}

function PolicyTable({policies, onSelect}) {
  return(
    <div style={{background:'#fff',borderRadius:16,boxShadow:'0 2px 8px rgba(0,0,0,0.06)',overflow:'hidden'}}>
      <table style={{width:'100%',borderCollapse:'collapse'}}>
        <thead><tr style={{background:'#F7F9FC'}}>
          {['Client','Insurer','Products','Premium','Cashback','Status'].map(h=>(
            <th key={h} style={{padding:'12px 16px',textAlign:'left',fontSize:11,fontWeight:700,color:'#8FA3BE',textTransform:'uppercase',letterSpacing:.5}}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {policies.map(p=>(
            <tr key={p.id} onClick={()=>onSelect(p)} style={{borderTop:'1px solid #F0F4F8',cursor:'pointer'}} onMouseEnter={e=>e.currentTarget.style.background='#F7F9FC'} onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
              <td style={{padding:'12px 16px'}}>
                <div style={{fontSize:14,fontWeight:600,color:NAVY}}>{p.client.name}</div>
                <div style={{fontSize:11,color:'#8FA3BE'}}>{p.ref}</div>
              </td>
              <td style={{padding:'12px 16px',fontSize:13,color:'#5A7A9A'}}>{p.insurer}</td>
              <td style={{padding:'12px 16px',fontSize:13,color:'#5A7A9A'}}>{p.products.join(', ')}</td>
              <td style={{padding:'12px 16px',fontSize:14,fontWeight:700,color:NAVY}}>R{p.total.toLocaleString()}/mo</td>
              <td style={{padding:'12px 16px'}}>
                <div style={{fontSize:13,fontWeight:700,color:GREEN}}>R{p.cashback.toLocaleString()}</div>
                <div style={{fontSize:11,padding:'2px 8px',borderRadius:99,display:'inline-block',background:CASHBACK_COLOUR[p.cashback_status]+'22',color:CASHBACK_COLOUR[p.cashback_status],fontWeight:700}}>{p.cashback_status}</div>
              </td>
              <td style={{padding:'12px 16px'}}>
                <span style={{fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:99,background:STATUS_COLOUR[p.status]+'22',color:STATUS_COLOUR[p.status]}}>{p.status.toUpperCase()}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
