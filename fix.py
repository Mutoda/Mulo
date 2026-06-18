
content = open("/Users/manmahamba/Desktop/mulo/src/Insure.jsx").read()
start = content.find("  // ── Insure landing screen")
idx = content.find("  // Simulate quote fetching")
before = content[:start]
after = content[idx:]
landing = """  // ── Insure landing screen
  const renderLanding = () => (
    <div className={"screen fade-in"} style={{background:"#F7F9FC"}}>
      <div className={"screen-scroll"}>
        <div style={{background:"linear-gradient(160deg,#0A1628 0%,#0E2344 60%,#0B3040 100%)",padding:"28px 24px 0",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(0,184,169,0.18) 0%,transparent 70%)",top:-80,right:-80}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:32,position:"relative",zIndex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div className={"mulo-logo"}>Mu<span>ḽ</span>o</div>
              <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.4)",marginTop:2}}>insure</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>FSP 49169</div>
              <span style={{fontSize:18,color:"rgba(255,255,255,0.5)",cursor:"pointer",padding:"4px 8px"}} onClick={onBack}>←</span>
            </div>
          </div>
          <div className={"hero-eyebrow"} style={{position:"relative",zIndex:1}}>💸 Earn 1× your first month premium as cashback</div>
          <h1 className={"hero-title"} style={{position:"relative",zIndex:1}}>South Africa smartest<br/><em>insurance comparison.</em></h1>
          <p className={"hero-sub"} style={{position:"relative",zIndex:1}}>Compare quotes from 5 leading insurers in minutes. Get covered, earn cashback, pay less.</p>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:20,position:"relative",zIndex:1}}>
            {[["🟠","Naked"],["👑","King Price"],["🍍","Pineapple"],["🔵","iWYZE"],["🔴","Absa"]].map(([e,n]) => (
              <div key={n} style={{display:"flex",alignItems:"center",gap:5,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:99,padding:"4px 10px"}}>
                <span style={{fontSize:13}}>{e}</span>
                <span style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.6)"}}>{n}</span>
              </div>
            ))}
          </div>
          <div className={"hero-stats"} style={{position:"relative",zIndex:1}}>
            {[["R0","Free to compare"],["3 min","Avg. quote time"],["1 mo","Cashback earned"]].map(([v,l]) => (
              <div className={"hero-stat"} key={l}><div className={"hero-stat-val"}>{v}</div><div className={"hero-stat-lbl"}>{l}</div></div>
            ))}
          </div>
          <div className={"trust-strip"}>
            {[["🛡️","FSP 49169"],["🔒","POPIA Compliant"],["⚡","5 insurers"]].map(([i,l]) => (
              <div className={"trust-item"} key={l}><span className={"trust-icon"}>{i}</span>{l}</div>
            ))}
          </div>
        </div>
        <div className={"landing-body"}>
          <div className={"section-title"}>Why Muḽo Insure</div>
          {[
            ["💸","Earn your first month back","Every policy earns 1× your first month premium as cashback — paid within 30 days."],
            ["⚡","Quotes in under 3 minutes","Answer 3-5 questions. We pull quotes from all 5 insurers and rank by value."],
            ["🏆","Best price, not just cheapest","We rank by value, claims reputation and likelihood — not just the lowest number."],
            ["📱","Fully digital, start to finish","Compare, choose, sign. Policy documents on WhatsApp and email instantly."],
          ].map(([icon,title,body]) => (
            <div className={"step-card"} key={title}>
              <div className={"step-num"}>{icon}</div>
              <div><div className={"step-content-title"}>{title}</div><div className={"step-content-sub"}>{body}</div></div>
            </div>
          ))}
          <div className={"section-title"} style={{marginTop:24}}>What we cover</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
            {[["🚗","Car insurance"],["🏠","Buildings"],["📦","Home contents"],["💎","All risk"],["🚐","Caravan"],["🔗","Trailer"]].map(([icon,label]) => (
              <div key={label} style={{display:"flex",alignItems:"center",gap:10,background:"#fff",border:"1px solid #EEF2F8",borderRadius:14,padding:"12px 14px"}}>
                <span style={{fontSize:20}}>{icon}</span>
                <span style={{fontSize:13,fontWeight:600,color:"#0A1628"}}>{label}</span>
              </div>
            ))}
          </div>
          <div style={{background:"linear-gradient(135deg,rgba(18,194,107,0.08),rgba(0,184,169,0.06))",border:"1px solid rgba(18,194,107,0.2)",borderRadius:18,padding:18,marginBottom:16}}>
            <div style={{fontSize:14,fontWeight:700,color:"#12C26B",marginBottom:8}}>💸 How cashback works</div>
            <div style={{fontSize:13,color:"#8FA3BE",lineHeight:1.65}}>Take out any policy and the insurer pays back your <strong style={{color:"#0A1628"}}>full first month premium</strong> per product.</div>
            <div style={{display:"flex",gap:16,marginTop:12,fontSize:12,color:"#8FA3BE"}}><span>🔒 12-month lock-in</span><span>📅 Paid within 30 days</span></div>
          </div>
          <button className={"btn btn-primary"} onClick={goNext} style={{marginBottom:12}}>Get my free quotes</button>
          <div style={{textAlign:"center",fontSize:11,color:"#8FA3BE",marginBottom:8}}>Free to compare · No obligation · Takes 3 minutes</div>
          <div style={{textAlign:"center",fontSize:11,color:"#C5D0DC",lineHeight:1.6,paddingBottom:24}}>Muḽo Financial Services (Pty) Ltd · FSP 49169</div>
        </div>
      </div>
    </div>
  )

"""
open("/Users/manmahamba/Desktop/mulo/src/Insure.jsx", "w").write(before + landing + after)
print("done")
