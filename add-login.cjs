const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Change Sign in to go to login screen
code = code.replace(
  `<div className="login-link" onClick={() => go("dashboard")}>Sign in →</div>`,
  `<div className="login-link" onClick={() => go("login")}>Sign in →</div>`
);

// 2. Add Login screen before Dashboard
const loginScreen = `function Login({ go }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phase, setPhase] = useState("idle");
  const [showPass, setShowPass] = useState(false);

  const handleSignIn = () => {
    if (!email || !password) return;
    setPhase("checking");
    setTimeout(() => {
      if (password.length >= 6) {
        const parts = email.split("@")[0].split(".");
        window._muloFirstName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : "User";
        window._muloLastName = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : "";
        go("dashboard");
      } else {
        setPhase("error");
      }
    }, 1200);
  };

  return (
    <div className="screen fade-in" style={{background:"#fff"}}>
      <div className="screen-header" style={{background:"#fff",borderBottom:"1px solid rgba(0,0,0,0.06)"}}>
        <div className="back-btn" onClick={() => go("landing")}>←</div>
        <div className="screen-header-text">
          <div className="screen-header-title">Sign in</div>
          <div className="screen-header-sub">Welcome back to Muḽo</div>
        </div>
      </div>
      <div className="screen-scroll">
        <div className="form-pad" style={{paddingTop:32}}>
          <div style={{textAlign:"center",marginBottom:32}}>
            <div style={{fontFamily:"'Sora',sans-serif",fontSize:28,fontWeight:800,color:"#0A1628",letterSpacing:-1}}>Mu<span style={{color:"#00B8A9"}}>ḽ</span>o</div>
            <div style={{fontSize:13,color:"#8FA3BE",marginTop:6}}>Sign in to your account</div>
          </div>
          <div className="input-group">
            <label className="input-label">Email address</label>
            <input className="input-field" type="email" placeholder="you@example.com" value={email} onChange={e => { setEmail(e.target.value); setPhase("idle"); }} autoCapitalize="none" />
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <div style={{position:"relative"}}>
              <input className={"input-field" + (phase==="error" ? " error" : "")} type={showPass ? "text" : "password"} placeholder="Enter your password" value={password} onChange={e => { setPassword(e.target.value); setPhase("idle"); }} />
              <div onClick={() => setShowPass(s=>!s)} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",fontSize:12,color:"#8FA3BE",cursor:"pointer"}}>{showPass ? "Hide" : "Show"}</div>
            </div>
            {phase==="error" && <div className="input-hint err">✕ Incorrect password. Please try again.</div>}
          </div>
          <div style={{textAlign:"right",marginTop:-8,marginBottom:20}}>
            <span style={{fontSize:12,color:"#00B8A9",cursor:"pointer"}}>Forgot password?</span>
          </div>
          <button className="btn btn-primary" onClick={handleSignIn} disabled={!email || !password || phase==="checking"} style={{opacity:!email||!password?0.4:1}}>
            {phase==="checking" ? "Signing in…" : "Sign in →"}
          </button>
          <div style={{textAlign:"center",marginTop:20,fontSize:13,color:"#8FA3BE"}}>
            Don't have an account? <span style={{color:"#00B8A9",cursor:"pointer"}} onClick={() => go("id-verify")}>Apply now →</span>
          </div>
        </div>
      </div>
    </div>
  );
}

`;

code = code.replace('function Dashboard({ go }) {', loginScreen + 'function Dashboard({ go }) {');

// 3. Add login to SCREENS
code = code.replace(
  `const SCREENS = { landing:Landing,`,
  `const SCREENS = { landing:Landing, login:Login,`
);

fs.writeFileSync('src/App.jsx', code);
console.log('Login screen:', code.includes('function Login') ? 'SUCCESS' : 'NOT FOUND');
console.log('SCREENS updated:', code.includes('login:Login') ? 'YES' : 'NO');
