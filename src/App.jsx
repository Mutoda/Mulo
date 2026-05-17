import React, { useState, useEffect, useRef } from "react";

const API = "https://z30zl849k8.execute-api.af-south-1.amazonaws.com/prod";

/* ─────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────── */
const T = {
  ink:       "#0A1628",
  inkMid:    "#1B2F4E",
  inkSoft:   "#2D4A6E",
  teal:      "#00B8A9",
  tealLight: "#00D4C4",
  tealFaint: "rgba(0,184,169,0.10)",
  tealGlow:  "rgba(0,184,169,0.25)",
  blue:      "#1A73E8",
  blueLight: "#4A9EFF",
  sky:       "#E8F4FD",
  white:     "#FFFFFF",
  offWhite:  "#F7F9FC",
  muted:     "#8FA3BE",
  border:    "rgba(0,0,0,0.07)",
  green:     "#12C26B",
  orange:    "#FF7043",
  gold:      "#F4B942",
};

/* ─────────────────────────────────────────────
   GLOBAL STYLES
───────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');

*{box-sizing:border-box;margin:0;padding:0;-webkit-font-smoothing:antialiased}
body{font-family:'IBM Plex Sans',sans-serif;background:#F0F4F8;min-height:100vh}

/* ── SHELL ── */
.shell{display:flex;align-items:flex-start;justify-content:center;min-height:100vh;background:linear-gradient(135deg,#0A1628 0%,#1B3A5E 50%,#0D2440 100%);padding:32px 16px}
.phone{width:390px;height:min(780px,92vh);min-height:600px;background:#F7F9FC;border-radius:0;overflow:hidden;box-shadow:none;position:relative;display:flex;flex-direction:column}
.phone-notch{display:none}

/* ── SCREENS ── */
.screen{flex:1;display:flex;flex-direction:column;overflow:hidden;position:relative}
.screen-scroll{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch}
.screen-scroll::-webkit-scrollbar{display:none}

/* ── LANDING ── */
.landing-hero{background:linear-gradient(160deg,#0A1628 0%,#0E2344 60%,#0B3040 100%);padding:28px 24px 0;position:relative;overflow:hidden}
.landing-hero::before{content:'';position:absolute;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(0,184,169,0.18) 0%,transparent 70%);top:-80px;right:-80px;pointer-events:none}
.landing-hero::after{content:'';position:absolute;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(26,115,232,0.15) 0%,transparent 70%);bottom:40px;left:-60px;pointer-events:none}

.logo-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:40px}
.mulo-logo{font-family:'Sora',sans-serif;font-weight:800;font-size:22px;color:#fff;letter-spacing:-0.5px}
.mulo-logo span{color:#00B8A9}
.login-link{font-size:13px;color:rgba(255,255,255,0.6);cursor:pointer;transition:color .2s}
.login-link:hover{color:#00B8A9}

.hero-eyebrow{display:inline-flex;align-items:center;gap:6px;background:rgba(0,184,169,0.15);border:1px solid rgba(0,184,169,0.3);border-radius:99px;padding:5px 12px;font-size:11px;color:#00B8A9;font-weight:600;letter-spacing:0.5px;margin-bottom:20px}
.hero-title{font-family:'Sora',sans-serif;font-size:30px;font-weight:800;color:#fff;line-height:1.15;letter-spacing:-0.5px;margin-bottom:14px}
.hero-title em{font-style:normal;color:#00B8A9}
.hero-sub{font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;margin-bottom:32px;max-width:300px}

.hero-stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:1px;background:rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;margin-bottom:28px}
.hero-stat{background:rgba(255,255,255,0.04);padding:16px 12px;text-align:center;backdrop-filter:blur(8px)}
.hero-stat-val{font-family:'Sora',sans-serif;font-size:18px;font-weight:700;color:#fff}
.hero-stat-lbl{font-size:10px;color:rgba(255,255,255,0.45);margin-top:3px;text-transform:uppercase;letter-spacing:0.5px}

.trust-strip{display:flex;align-items:center;justify-content:center;gap:16px;padding:16px 0;border-top:1px solid rgba(255,255,255,0.06)}
.trust-item{display:flex;align-items:center;gap:5px;font-size:10px;color:rgba(255,255,255,0.4);font-weight:500}
.trust-icon{font-size:12px}

.landing-body{padding:24px;background:#F7F9FC;flex:1}
.section-title{font-family:'Sora',sans-serif;font-size:16px;font-weight:700;color:#0A1628;margin-bottom:16px}

.step-card{display:flex;align-items:flex-start;gap:14px;padding:16px;background:#fff;border-radius:16px;margin-bottom:10px;box-shadow:0 2px 12px rgba(0,0,0,0.05)}
.step-num{width:36px;height:36px;border-radius:12px;background:linear-gradient(135deg,#00B8A9,#1A73E8);display:flex;align-items:center;justify-content:center;font-family:'Sora',sans-serif;font-size:14px;font-weight:700;color:#fff;flex-shrink:0}
.step-content-title{font-size:14px;font-weight:600;color:#0A1628;margin-bottom:2px}
.step-content-sub{font-size:12px;color:#8FA3BE;line-height:1.5}

/* ── BUTTONS ── */
.btn{display:flex;align-items:center;justify-content:center;gap:8px;border:none;cursor:pointer;font-family:'IBM Plex Sans',sans-serif;font-weight:600;transition:all .2s;outline:none}
.btn-primary{background:linear-gradient(135deg,#00B8A9,#1A73E8);color:#fff;border-radius:16px;padding:17px 24px;font-size:15px;width:100%;letter-spacing:0.1px;box-shadow:0 8px 24px rgba(0,184,169,0.35)}
.btn-primary:hover{transform:translateY(-1px);box-shadow:0 12px 32px rgba(0,184,169,0.4)}
.btn-primary:active{transform:translateY(0)}
.btn-secondary{background:#fff;color:#0A1628;border:1.5px solid rgba(0,0,0,0.1);border-radius:14px;padding:14px 20px;font-size:14px;width:100%}
.btn-ghost{background:transparent;color:#00B8A9;border:none;font-size:14px;font-weight:500;cursor:pointer;padding:8px 0}
.btn-sm{padding:10px 18px;font-size:13px;border-radius:12px;width:auto}

/* ── SCREEN HEADER ── */
.screen-header{padding:20px 24px 0;display:flex;align-items:center;gap:12px;margin-bottom:8px}
.back-btn{width:36px;height:36px;border-radius:12px;background:#fff;border:1.5px solid rgba(0,0,0,0.08);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,0.06);transition:all .15s}
.back-btn:hover{background:#f0f4f8}
.screen-header-text{flex:1}
.screen-header-title{font-family:'Sora',sans-serif;font-size:17px;font-weight:700;color:#0A1628}
.screen-header-sub{font-size:12px;color:#8FA3BE;margin-top:1px}
.screen-logo{font-family:'Sora',sans-serif;font-weight:800;font-size:17px;color:#0A1628}
.screen-logo span{color:#00B8A9}

/* ── PROGRESS BAR ── */
.progress-track{height:3px;background:#E8EDF4;border-radius:99px;margin:0 24px 20px;overflow:hidden}
.progress-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#00B8A9,#1A73E8);transition:width .5s cubic-bezier(.4,0,.2,1)}

/* ── FORM ── */
.form-pad{padding:0 24px}
.input-group{margin-bottom:18px}
.input-label{font-size:11px;font-weight:600;color:#8FA3BE;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:7px;display:block}
.input-field{width:100%;background:#fff;border:1.5px solid #E2E9F0;border-radius:14px;padding:14px 16px;font-family:'IBM Plex Sans',sans-serif;font-size:15px;color:#0A1628;outline:none;transition:all .2s}
.input-field:focus{border-color:#00B8A9;box-shadow:0 0 0 3px rgba(0,184,169,0.12)}
.input-field.error{border-color:#FF7043;box-shadow:0 0 0 3px rgba(255,112,67,0.1)}
.input-field.success{border-color:#12C26B;box-shadow:0 0 0 3px rgba(18,194,107,0.1)}
.input-field::placeholder{color:#C5D0DC}
.input-hint{font-size:11px;color:#8FA3BE;margin-top:5px;display:flex;align-items:center;gap:4px}
.input-hint.ok{color:#12C26B}
.input-hint.err{color:#FF7043}

/* ── ID VERIFY ── */
.id-graphic{margin:20px 24px;padding:20px;background:linear-gradient(135deg,#0A1628,#1B3A5E);border-radius:20px;position:relative;overflow:hidden}
.id-graphic::after{content:'';position:absolute;right:-20px;top:-20px;width:100px;height:100px;border-radius:50%;background:rgba(0,184,169,0.15)}
.id-card-label{font-size:9px;color:rgba(255,255,255,0.4);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px}
.id-card-number{font-family:'Sora',sans-serif;font-size:20px;font-weight:700;color:#fff;letter-spacing:4px}
.id-card-flag{font-size:24px;position:absolute;right:20px;bottom:16px}

.check-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #F0F4F8}
.check-icon{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0}
.check-icon.ok{background:rgba(18,194,107,0.1);color:#12C26B}
.check-icon.loading{background:rgba(0,184,169,0.1);color:#00B8A9}
.check-icon.pending{background:#F0F4F8;color:#C5D0DC}
.check-text{font-size:13px;font-weight:500;color:#0A1628;flex:1}
.check-sub{font-size:11px;color:#8FA3BE;margin-top:1px}

.pre-qual-banner{margin:20px 24px 0;padding:20px;background:linear-gradient(135deg,rgba(18,194,107,0.1),rgba(0,184,169,0.08));border:1px solid rgba(18,194,107,0.25);border-radius:20px;text-align:center}
.pre-qual-icon{font-size:32px;margin-bottom:8px}
.pre-qual-title{font-family:'Sora',sans-serif;font-size:16px;font-weight:700;color:#0A1628;margin-bottom:4px}
.pre-qual-sub{font-size:12px;color:#8FA3BE;line-height:1.6}

/* ── OTP / WHATSAPP ── */
.wa-card{margin:0 24px 20px;background:linear-gradient(135deg,#075E54,#128C7E);border-radius:20px;padding:18px 20px;display:flex;align-items:center;gap:14px;position:relative;overflow:hidden}
.wa-card::after{content:'';position:absolute;right:-20px;top:-20px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,0.07)}
.wa-icon-wrap{width:46px;height:46px;border-radius:14px;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0}
.wa-sent-label{font-size:10px;color:rgba(255,255,255,0.6);margin-bottom:3px;text-transform:uppercase;letter-spacing:0.5px}
.wa-phone-num{font-family:'Sora',sans-serif;font-size:15px;font-weight:700;color:#fff;letter-spacing:1px}
.wa-tick{font-size:10px;color:#4FC3F7;margin-top:3px;display:flex;align-items:center;gap:4px}

.wa-preview{margin:0 24px 16px;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1)}
.wa-preview-header{background:#075E54;padding:10px 14px;display:flex;align-items:center;gap:8px}
.wa-preview-avatar{width:28px;height:28px;border-radius:50%;background:#25D366;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0}
.wa-preview-name{font-size:12px;font-weight:700;color:#fff}
.wa-preview-sub{font-size:10px;color:rgba(255,255,255,0.6);margin-top:1px}
.wa-preview-body{background:#ECE5DD;padding:14px}
.wa-bubble{background:#fff;border-radius:0 12px 12px 12px;padding:12px 14px;max-width:85%;box-shadow:0 1px 3px rgba(0,0,0,0.1)}
.wa-bubble-greeting{font-size:12px;color:#0A1628;line-height:1.6;margin-bottom:8px}
.wa-bubble-otp{font-family:'Sora',sans-serif;font-size:28px;font-weight:800;color:#075E54;letter-spacing:8px;text-align:center;padding:8px 0;background:rgba(7,94,84,0.05);border-radius:8px;margin-bottom:8px}
.wa-bubble-footer{font-size:11px;color:#8FA3BE;line-height:1.5}
.wa-bubble-meta{font-size:10px;color:#8FA3BE;text-align:right;margin-top:6px;display:flex;align-items:center;justify-content:flex-end;gap:4px}

.otp-boxes{display:flex;gap:8px;justify-content:center;margin:20px 0 8px}
.otp-resend-row{display:flex;align-items:center;justify-content:center;gap:6px;font-size:13px;color:#8FA3BE;margin-top:8px}
.otp-resend-link{color:#25D366;font-weight:600;cursor:pointer}
.otp-timer{font-variant-numeric:tabular-nums;color:#0A1628;font-weight:600}

.security-badge{display:flex;align-items:center;gap:10px;background:#F7F9FC;border:1px solid #E2E9F0;border-radius:14px;padding:13px 16px;margin:0 24px 16px;font-size:12px;color:#8FA3BE;line-height:1.5}
.security-badge-icon{font-size:18px;flex-shrink:0}

/* ── DOC UPLOAD ── */
.doc-section-title{font-size:11px;font-weight:700;color:#8FA3BE;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px;display:flex;align-items:center;gap:6px}
.doc-section-title span{width:6px;height:6px;border-radius:50%;background:#00B8A9;display:inline-block}
.doc-upload-zone{border:2px dashed rgba(0,184,169,0.3);border-radius:16px;padding:22px;text-align:center;cursor:pointer;transition:all .2s;background:rgba(0,184,169,0.02)}
.doc-upload-zone:hover{border-color:#00B8A9;background:rgba(0,184,169,0.05)}
.doc-upload-zone.uploaded{border-color:#12C26B;border-style:solid;background:rgba(18,194,107,0.04)}
.doc-upload-icon{font-size:26px;margin-bottom:8px}
.doc-upload-label{font-size:13px;font-weight:600;color:#0A1628;margin-bottom:3px}
.doc-upload-hint{font-size:11px;color:#8FA3BE}
.doc-uploaded-pill{display:flex;align-items:center;gap:10px;background:#fff;border:1.5px solid rgba(18,194,107,0.3);border-radius:12px;padding:11px 14px}
.doc-uploaded-icon{width:32px;height:32px;background:rgba(18,194,107,0.1);border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0}
.doc-uploaded-name{flex:1;font-size:13px;font-weight:500;color:#0A1628}
.doc-uploaded-size{font-size:10px;color:#8FA3BE;margin-top:1px}
.doc-uploaded-check{color:#12C26B;font-size:15px;font-weight:700}
.doc-rule-box{background:#FFF8F0;border:1px solid rgba(244,185,66,0.3);border-radius:12px;padding:12px 14px;margin-bottom:8px}
.doc-rule-item{font-size:11px;color:#8FA3BE;display:flex;align-items:flex-start;gap:6px;margin-bottom:4px;line-height:1.5}
.doc-rule-item:last-child{margin-bottom:0}

/* ── E-SIGN ── */
.esign-doc-wrap{border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);margin-bottom:14px}
.esign-doc-header{background:linear-gradient(135deg,#0A1628,#1B3A5E);padding:16px 18px;display:flex;align-items:center;gap:10px}
.esign-doc-icon{width:36px;height:36px;background:rgba(0,184,169,0.15);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.esign-doc-title{font-family:'Sora',sans-serif;font-size:14px;font-weight:700;color:#fff}
.esign-doc-sub{font-size:11px;color:rgba(255,255,255,0.5);margin-top:1px}
.esign-doc-body{background:#fff;padding:18px}
.esign-clause{font-size:12px;color:#4A5568;line-height:1.8;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #F0F4F8}
.esign-clause:last-of-type{border-bottom:none;margin-bottom:0}
.esign-clause strong{color:#0A1628;font-weight:600}
.esign-highlight{background:rgba(0,184,169,0.05);border-left:3px solid #00B8A9;border-radius:0 8px 8px 0;padding:10px 12px;margin:10px 0;font-size:12px;color:#0A1628;line-height:1.7}
.esign-field-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #F7F9FC}
.esign-field-label{font-size:11px;color:#8FA3BE}
.esign-field-val{font-size:12px;font-weight:700;color:#0A1628;font-family:'Sora',sans-serif}

.sig-section{padding:16px 18px;background:#FAFCFF;border-top:1px solid #F0F4F8}
.sig-section-label{font-size:11px;font-weight:700;color:#8FA3BE;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px}
.signature-pad{border:2px dashed rgba(0,184,169,0.3);border-radius:14px;height:90px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;background:#FAFCFF}
.signature-pad:hover{border-color:#00B8A9;background:rgba(0,184,169,0.03)}
.signature-pad.signed{border-color:#12C26B;border-style:solid;background:rgba(18,194,107,0.02)}
.sig-placeholder{font-size:12px;color:#C5D0DC;text-align:center;display:flex;flex-direction:column;align-items:center;gap:4px}
.sig-rendered{font-family:'Sora',sans-serif;font-size:26px;font-weight:300;color:#0A1628;letter-spacing:2px;transform:rotate(-3deg);display:block}
.sig-date-stamp{position:absolute;bottom:6px;right:10px;font-size:9px;color:#8FA3BE}
.sig-verified-badge{position:absolute;top:6px;right:8px;background:rgba(18,194,107,0.1);color:#12C26B;font-size:9px;font-weight:700;padding:2px 8px;border-radius:99px;border:1px solid rgba(18,194,107,0.2)}

/* ── DISBURSEMENT ── */
.disb-hero{background:linear-gradient(160deg,#0A1628,#0E2A44);padding:24px;position:relative;overflow:hidden}
.disb-hero::before{content:'';position:absolute;right:-40px;top:-40px;width:160px;height:160px;border-radius:50%;background:radial-gradient(circle,rgba(0,184,169,0.15),transparent 70%)}
.disb-total-label{font-size:10px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}
.disb-total-amt{font-family:'Sora',sans-serif;font-size:32px;font-weight:800;color:#fff;letter-spacing:-1px;margin-bottom:16px}

.disb-progress-ring-wrap{position:relative;width:72px;height:72px;flex-shrink:0}
.disb-ring-svg{width:72px;height:72px;transform:rotate(-90deg)}
.disb-ring-track{fill:none;stroke:rgba(255,255,255,0.1);stroke-width:5}
.disb-ring-fill{fill:none;stroke-width:5;stroke-linecap:round;transition:stroke-dashoffset 1s ease}
.disb-ring-num{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.disb-ring-pct{font-family:'Sora',sans-serif;font-size:16px;font-weight:800;color:#fff;line-height:1}
.disb-ring-sub{font-size:9px;color:rgba(255,255,255,0.4);margin-top:2px}

.disb-pills{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:16px}
.disb-pill{background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:12px 10px;text-align:center}
.disb-pill-val{font-family:'Sora',sans-serif;font-size:15px;font-weight:700;color:#fff;margin-bottom:2px}
.disb-pill-label{font-size:9px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.5px}

.tranche-card{background:#fff;border-radius:18px;margin-bottom:12px;box-shadow:0 2px 14px rgba(0,0,0,0.06);overflow:hidden;border:1.5px solid transparent;transition:border-color .2s}
.tranche-card.active{border-color:rgba(0,184,169,0.4)}
.tranche-card.done{border-color:rgba(18,194,107,0.3)}
.tranche-card.locked{opacity:.55}

.tranche-header{display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer}
.tranche-num{width:36px;height:36px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-family:'Sora',sans-serif;font-size:13px;font-weight:800;flex-shrink:0}
.tranche-num.done{background:rgba(18,194,107,0.12);color:#12C26B}
.tranche-num.active{background:rgba(0,184,169,0.12);color:#00B8A9}
.tranche-num.locked{background:#F0F4F8;color:#C5D0DC}
.tranche-meta{flex:1}
.tranche-creditor{font-size:13px;font-weight:700;color:#0A1628;margin-bottom:1px}
.tranche-type{font-size:11px;color:#8FA3BE}
.tranche-right{text-align:right}
.tranche-amount{font-family:'Sora',sans-serif;font-size:15px;font-weight:800;color:#0A1628}
.tranche-status-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:99px;font-size:10px;font-weight:700;margin-top:3px}
.tranche-status-badge.done{background:rgba(18,194,107,0.1);color:#12C26B}
.tranche-status-badge.active{background:rgba(0,184,169,0.1);color:#00B8A9;animation:subtlePulse 2s ease infinite}
.tranche-status-badge.locked{background:#F0F4F8;color:#C5D0DC}
@keyframes subtlePulse{0%,100%{opacity:1}50%{opacity:.6}}

.tranche-body{border-top:1px solid #F0F4F8;padding:14px 16px;background:#FAFCFF}

.tranche-step-row{display:flex;align-items:flex-start;gap:10px;margin-bottom:12px}
.tranche-step-icon{width:28px;height:28px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0}
.tranche-step-icon.done{background:rgba(18,194,107,0.1)}
.tranche-step-icon.active{background:rgba(0,184,169,0.1)}
.tranche-step-icon.wait{background:#F0F4F8}
.tranche-step-text{flex:1}
.tranche-step-label{font-size:12px;font-weight:600;color:#0A1628;margin-bottom:1px}
.tranche-step-sub{font-size:11px;color:#8FA3BE;line-height:1.5}
.tranche-step-date{font-size:10px;color:#8FA3BE;margin-top:2px}

.bureau-check{display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(0,184,169,0.05);border:1px solid rgba(0,184,169,0.15);border-radius:10px;margin:8px 0;font-size:12px;color:#0A1628}
.bureau-check-icon{font-size:15px;flex-shrink:0}
.bureau-spinner{display:inline-block;animation:spin 1s linear infinite;font-size:13px}

.proof-upload-mini{display:flex;align-items:center;gap:10px;border:1.5px dashed rgba(0,184,169,0.35);border-radius:12px;padding:11px 14px;cursor:pointer;transition:all .2s;margin-top:8px}
.proof-upload-mini:hover{border-color:#00B8A9;background:rgba(0,184,169,0.03)}
.proof-upload-mini.uploaded{border-color:#12C26B;border-style:solid;background:rgba(18,194,107,0.03)}
.proof-upload-mini-icon{font-size:18px;flex-shrink:0}
.proof-upload-mini-text{flex:1;font-size:12px;font-weight:500;color:#0A1628}
.proof-upload-mini-hint{font-size:10px;color:#8FA3BE;margin-top:1px}

.wa-notify-chip{display:flex;align-items:center;gap:8px;background:rgba(37,211,102,0.06);border:1px solid rgba(37,211,102,0.2);border-radius:10px;padding:10px 12px;margin-top:10px;font-size:11px;color:#0A1628;line-height:1.5}

/* ── DISBURSEMENT ── */
.convey-hero{background:linear-gradient(160deg,#0A1628,#0E2A44);padding:24px;position:relative;overflow:hidden}
.convey-hero::after{content:'';position:absolute;right:-30px;top:-30px;width:140px;height:140px;border-radius:50%;background:rgba(0,184,169,0.1)}
.convey-step-wrap{display:flex;flex-direction:column;gap:0}
.convey-step{display:flex;gap:14px;padding-bottom:18px;position:relative}
.convey-step:not(:last-child)::before{content:'';position:absolute;left:17px;top:38px;bottom:0;width:2px;background:linear-gradient(to bottom,rgba(0,184,169,0.25),transparent)}
.convey-dot{width:36px;height:36px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;z-index:1}
.convey-dot.done{background:rgba(18,194,107,0.1);border:1.5px solid rgba(18,194,107,0.3)}
.convey-dot.active{background:rgba(0,184,169,0.1);border:1.5px solid rgba(0,184,169,0.4)}
.convey-dot.future{background:#F7F9FC;border:1.5px solid #E2E9F0}
.convey-content{flex:1;padding-top:4px}
.convey-title{font-size:13px;font-weight:700;color:#0A1628;margin-bottom:2px}
.convey-title.muted{color:#C5D0DC}
.convey-sub{font-size:11px;color:#8FA3BE;line-height:1.5}
.convey-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:99px;font-size:10px;font-weight:700;margin-top:5px}
.convey-badge.done{background:rgba(18,194,107,0.1);color:#12C26B;border:1px solid rgba(18,194,107,0.2)}
.convey-badge.active{background:rgba(0,184,169,0.1);color:#00B8A9;border:1px solid rgba(0,184,169,0.2)}
.convey-badge.future{background:#F0F4F8;color:#C5D0DC;border:1px solid #E2E9F0}

/* ── LIVENESS ── */
.camera-viewport{margin:16px 24px;border-radius:24px;overflow:hidden;position:relative;background:#0A1628;aspect-ratio:3/4}
.camera-face-ring{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
.face-oval{width:180px;height:220px;border-radius:50%;border:2px solid rgba(0,184,169,0.7);position:relative}
.face-oval.scanning{border-color:#00B8A9;box-shadow:0 0 0 4px rgba(0,184,169,0.15),0 0 32px rgba(0,184,169,0.2);animation:ovalPulse 1.8s ease-in-out infinite}
.face-oval.done{border-color:#12C26B;box-shadow:0 0 0 4px rgba(18,194,107,0.15)}
@keyframes ovalPulse{0%,100%{box-shadow:0 0 0 4px rgba(0,184,169,0.15)}50%{box-shadow:0 0 0 8px rgba(0,184,169,0.08),0 0 40px rgba(0,184,169,0.25)}}

.scan-line{position:absolute;left:10%;right:10%;height:2px;background:linear-gradient(90deg,transparent,#00B8A9,transparent);top:0;animation:scanMove 2s ease-in-out infinite}
@keyframes scanMove{0%{top:0%;opacity:0}10%{opacity:1}90%{opacity:1}100%{top:100%;opacity:0}}

.camera-corner{position:absolute;width:20px;height:20px;border-color:#00B8A9;border-style:solid}
.camera-corner.tl{top:12px;left:12px;border-width:2px 0 0 2px;border-radius:4px 0 0 0}
.camera-corner.tr{top:12px;right:12px;border-width:2px 2px 0 0;border-radius:0 4px 0 0}
.camera-corner.bl{bottom:12px;left:12px;border-width:0 0 2px 2px;border-radius:0 0 0 4px}
.camera-corner.br{bottom:12px;right:12px;border-width:0 2px 2px 0;border-radius:0 0 4px 0}

.camera-face-emoji{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:72px;opacity:0.15}
.camera-overlay-text{position:absolute;bottom:0;left:0;right:0;padding:16px;background:linear-gradient(transparent,rgba(0,0,0,0.7));text-align:center}
.camera-instruction{font-size:13px;font-weight:600;color:#fff;margin-bottom:4px}
.camera-sub-instruction{font-size:11px;color:rgba(255,255,255,0.6)}

.liveness-checks{padding:0 24px;display:flex;flex-direction:column;gap:8px}
.liveness-check{display:flex;align-items:center;gap:10px;padding:11px 14px;background:#fff;border-radius:12px;border:1px solid #F0F4F8}
.liveness-check-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.liveness-check-dot.done{background:#12C26B}
.liveness-check-dot.active{background:#00B8A9;animation:pulse 1.2s ease infinite}
.liveness-check-dot.wait{background:#E2E9F0}
.liveness-check-label{font-size:12px;font-weight:500;color:#0A1628;flex:1}
.liveness-check-icon{font-size:13px}

.verified-overlay{position:absolute;inset:0;background:rgba(18,194,107,0.12);backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;border-radius:24px}
.verified-checkmark{width:72px;height:72px;border-radius:50%;background:#12C26B;display:flex;align-items:center;justify-content:center;font-size:36px;box-shadow:0 8px 32px rgba(18,194,107,0.4)}
.verified-label{font-family:'Sora',sans-serif;font-size:16px;font-weight:700;color:#fff}

.attempt-counter{display:flex;align-items:center;justify-content:center;gap:6px;padding:10px;background:rgba(255,112,67,0.06);border:1px solid rgba(255,112,67,0.15);border-radius:10px;margin:0 24px 12px;font-size:12px;color:#FF7043;font-weight:500}

/* ── CONSENT ── */
.consent-card{background:#fff;border-radius:18px;padding:18px;margin-bottom:12px;box-shadow:0 2px 12px rgba(0,0,0,0.05)}
.consent-header{display:flex;align-items:center;gap:12px;margin-bottom:10px}
.consent-logo{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.consent-name{font-size:14px;font-weight:600;color:#0A1628}
.consent-desc{font-size:11px;color:#8FA3BE;margin-top:1px;line-height:1.4}
.consent-body{font-size:12px;color:#8FA3BE;line-height:1.6;margin-bottom:12px}
.toggle-row{display:flex;align-items:center;justify-content:space-between}
.toggle-label{font-size:12px;font-weight:500;color:#0A1628}

.toggle{width:44px;height:26px;border-radius:99px;background:#E2E9F0;position:relative;cursor:pointer;transition:background .25s;flex-shrink:0}
.toggle.on{background:linear-gradient(90deg,#00B8A9,#1A73E8)}
.toggle-thumb{width:20px;height:20px;border-radius:50%;background:#fff;position:absolute;top:3px;left:3px;transition:transform .25s;box-shadow:0 2px 6px rgba(0,0,0,0.15)}
.toggle.on .toggle-thumb{transform:translateX(18px)}

/* ── LOADING ── */
.loading-screen{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;padding:40px 24px}
.spinner-ring{width:80px;height:80px;position:relative;margin-bottom:32px}
.ring-outer{width:80px;height:80px;border-radius:50%;border:2px solid #E2E9F0;position:absolute;top:0;left:0}
.ring-inner{width:80px;height:80px;border-radius:50%;border:2px solid transparent;border-top:2px solid #00B8A9;border-right:2px solid #1A73E8;position:absolute;top:0;left:0;animation:spin 1.2s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.ring-dot{width:10px;height:10px;border-radius:50%;background:#00B8A9;position:absolute;top:0;left:50%;transform:translateX(-50%) translateY(-1px);animation:spin 1.2s linear infinite}

.loading-title{font-family:'Sora',sans-serif;font-size:20px;font-weight:700;color:#0A1628;text-align:center;margin-bottom:8px}
.loading-sub{font-size:13px;color:#8FA3BE;text-align:center;line-height:1.6;max-width:260px;margin-bottom:32px}

.data-checks{width:100%;display:flex;flex-direction:column;gap:10px}
.data-check-item{display:flex;align-items:center;gap:12px;padding:13px 16px;background:#fff;border-radius:14px;box-shadow:0 1px 8px rgba(0,0,0,0.05)}
.data-check-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.data-check-dot.active{background:#00B8A9;box-shadow:0 0 0 3px rgba(0,184,169,0.2);animation:pulse 1.4s ease infinite}
.data-check-dot.done{background:#12C26B}
.data-check-dot.wait{background:#E2E9F0}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.data-check-label{font-size:13px;font-weight:500;color:#0A1628;flex:1}
.data-check-status{font-size:11px;font-weight:600}
.data-check-status.done{color:#12C26B}
.data-check-status.active{color:#00B8A9}
.data-check-status.wait{color:#C5D0DC}

/* ── OFFER ── */
.offer-hero{background:linear-gradient(160deg,#0A1628 0%,#0E2A44 100%);padding:28px 24px 32px;position:relative;overflow:hidden}
.offer-hero::before{content:'';position:absolute;width:250px;height:250px;border-radius:50%;background:radial-gradient(circle,rgba(0,184,169,0.2) 0%,transparent 70%);top:-80px;right:-60px}
.offer-eyebrow{font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px}
.offer-name{font-family:'Sora',sans-serif;font-size:15px;font-weight:600;color:#fff;margin-bottom:24px}

.mulo-score{display:flex;align-items:center;gap:14px;background:rgba(255,255,255,0.07);border-radius:16px;padding:16px;margin-bottom:24px;border:1px solid rgba(255,255,255,0.06)}
.score-ring-wrap{position:relative;width:56px;height:56px;flex-shrink:0}
.score-svg{width:56px;height:56px;transform:rotate(-90deg)}
.score-track{fill:none;stroke:rgba(255,255,255,0.1);stroke-width:4}
.score-fill{fill:none;stroke:url(#scoreGrad);stroke-width:4;stroke-linecap:round;stroke-dasharray:138;stroke-dashoffset:28;transition:stroke-dashoffset 1s ease}
.score-num{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Sora',sans-serif;font-size:15px;font-weight:700;color:#fff}
.score-label{font-size:13px;font-weight:600;color:#fff;margin-bottom:2px}
.score-sub{font-size:11px;color:rgba(255,255,255,0.5)}

.offer-amount-label{font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px}
.offer-amount{font-family:'Sora',sans-serif;font-size:42px;font-weight:800;color:#fff;letter-spacing:-1px;margin-bottom:4px}
.offer-amount span{font-size:22px;font-weight:600;opacity:.7}
.offer-rate-line{font-size:13px;color:rgba(255,255,255,0.55);margin-bottom:24px}

.offer-pills{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.offer-pill{background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:14px}
.offer-pill-label{font-size:10px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px}
.offer-pill-val{font-family:'Sora',sans-serif;font-size:18px;font-weight:700;color:#fff}
.offer-pill-sub{font-size:10px;color:rgba(255,255,255,0.4);margin-top:2px}
.offer-pill.highlight{background:linear-gradient(135deg,rgba(0,184,169,0.2),rgba(26,115,232,0.15));border-color:rgba(0,184,169,0.3)}
.offer-pill.highlight .offer-pill-val{color:#00D4C4}

.offer-body{padding:20px 24px;background:#F7F9FC;flex:1}
.savings-card{background:#fff;border-radius:18px;padding:18px;margin-bottom:16px;box-shadow:0 2px 12px rgba(0,0,0,0.05)}
.savings-title{font-size:12px;font-weight:600;color:#8FA3BE;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:14px}
.savings-bar-wrap{margin-bottom:10px}
.savings-bar-label{display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px}
.savings-bar-key{color:#8FA3BE;display:flex;align-items:center;gap:5px}
.savings-bar-key::before{content:'';width:8px;height:8px;border-radius:2px;background:var(--c)}
.savings-bar-key.current{--c:#FF7043}
.savings-bar-key.new{--c:#00B8A9}
.savings-bar-val{font-weight:600;color:#0A1628}
.bar-track{height:8px;background:#F0F4F8;border-radius:99px;overflow:hidden;margin-bottom:4px}
.bar-fill{height:100%;border-radius:99px;background:var(--c)}
.savings-delta{display:flex;align-items:center;justify-content:center;gap:6px;padding:10px;background:rgba(18,194,107,0.06);border:1px solid rgba(18,194,107,0.15);border-radius:10px;margin-top:12px;font-size:13px;font-weight:600;color:#12C26B}

/* ── SETTLEMENT ── */
.settlement-hero{background:linear-gradient(135deg,#0A1628,#0B3040);padding:24px;position:relative;overflow:hidden}
.settlement-hero::after{content:'';position:absolute;right:-40px;bottom:-40px;width:150px;height:150px;border-radius:50%;background:rgba(0,184,169,0.12)}
.settle-amount{font-family:'Sora',sans-serif;font-size:36px;font-weight:800;color:#fff;letter-spacing:-1px}
.settle-sub{font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px}

.creditor-card{background:#fff;border-radius:16px;padding:16px;margin-bottom:10px;box-shadow:0 2px 10px rgba(0,0,0,0.05);display:flex;align-items:center;gap:12px}
.creditor-icon{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.creditor-name{font-size:13px;font-weight:600;color:#0A1628;margin-bottom:2px}
.creditor-type{font-size:11px;color:#8FA3BE}
.creditor-amount{font-family:'Sora',sans-serif;font-size:15px;font-weight:700;color:#0A1628;margin-left:auto}
.creditor-status{font-size:10px;font-weight:600;color:#12C26B;text-align:right;margin-top:2px}

.timeline-steps{padding:8px 0}
.t-step{display:flex;align-items:flex-start;gap:12px;padding-bottom:20px;position:relative}
.t-step:not(:last-child)::before{content:'';position:absolute;left:15px;top:32px;width:2px;bottom:0;background:#E2E9F0}
.t-dot{width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;z-index:1}
.t-dot.done{background:rgba(18,194,107,0.1);color:#12C26B}
.t-dot.active{background:rgba(0,184,169,0.1);color:#00B8A9}
.t-dot.future{background:#F0F4F8;color:#C5D0DC}
.t-label{font-size:13px;font-weight:600;color:#0A1628;margin-bottom:2px}
.t-date{font-size:11px;color:#8FA3BE}

/* ── DASHBOARD ── */
.dash-header{background:linear-gradient(160deg,#0A1628,#0E2A44);padding:24px;padding-bottom:40px}
.dash-greeting{font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:4px}
.dash-name{font-family:'Sora',sans-serif;font-size:20px;font-weight:700;color:#fff;margin-bottom:20px}

.status-card{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:16px;margin-bottom:16px;backdrop-filter:blur(8px)}
.status-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.status-badge{display:inline-flex;align-items:center;gap:5px;padding:5px 10px;background:rgba(18,194,107,0.15);border:1px solid rgba(18,194,107,0.3);border-radius:99px;font-size:11px;font-weight:600;color:#12C26B}
.status-badge-dot{width:6px;height:6px;border-radius:50%;background:#12C26B;animation:pulse 1.4s ease infinite}
.status-progress-track{height:6px;background:rgba(255,255,255,0.1);border-radius:99px;overflow:hidden;margin-bottom:8px}
.status-progress-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#00B8A9,#1A73E8)}
.status-step-labels{display:flex;justify-content:space-between;font-size:9px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.5px}

.repayment-card{background:rgba(255,255,255,0.07);border-radius:16px;padding:16px}
.repay-label{font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px}
.repay-amount{font-family:'Sora',sans-serif;font-size:26px;font-weight:700;color:#fff}
.repay-meta{font-size:11px;color:rgba(255,255,255,0.4);margin-top:2px}

.dash-body{padding:0 16px;margin-top:-24px;position:relative;z-index:2;flex:1;overflow-y:auto}
.dash-body::-webkit-scrollbar{display:none}

.insight-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}
.insight-card{background:#fff;border-radius:16px;padding:16px;box-shadow:0 2px 12px rgba(0,0,0,0.05)}
.insight-icon{font-size:20px;margin-bottom:8px}
.insight-val{font-family:'Sora',sans-serif;font-size:20px;font-weight:700;color:#0A1628;margin-bottom:2px}
.insight-val.green{color:#12C26B}
.insight-val.blue{color:#1A73E8}
.insight-label{font-size:11px;color:#8FA3BE}

.activity-item{display:flex;align-items:center;gap:12px;padding:13px 0;border-bottom:1px solid #F0F4F8}
.activity-icon{width:36px;height:36px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0}
.activity-label{font-size:13px;font-weight:500;color:#0A1628;flex:1;margin-bottom:2px}
.activity-date{font-size:11px;color:#8FA3BE}
.activity-amount{font-family:'Sora',sans-serif;font-size:14px;font-weight:700}
.activity-amount.credit{color:#12C26B}
.activity-amount.debit{color:#0A1628}

/* ── BOTTOM CTA ── */
.bottom-cta{padding:16px 24px 24px;background:#F7F9FC;border-top:1px solid #EEF2F8}
.bottom-cta.dark{background:#0A1628;border-color:rgba(255,255,255,0.06)}

/* ── MINI NAV ── */
.mini-nav{display:flex;background:#fff;border-top:1px solid #EEF2F8;padding:8px 0 4px}
.nav-tab{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;padding:4px 0;transition:all .2s}
.nav-tab-icon{font-size:20px}
.nav-tab-label{font-size:9px;font-weight:600;letter-spacing:0.3px;color:#C5D0DC;text-transform:uppercase}
.nav-tab.active .nav-tab-label{color:#00B8A9}

/* ── ACCOUNT CREATION ── */
.name-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.social-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px}
.social-btn{display:flex;align-items:center;justify-content:center;gap:8px;padding:13px;background:#fff;border:1.5px solid #E2E9F0;border-radius:14px;font-size:13px;font-weight:500;color:#0A1628;cursor:pointer;transition:all .2s}
.social-btn:hover{border-color:#00B8A9}
.or-divider{display:flex;align-items:center;gap:10px;margin-bottom:16px}
.or-line{flex:1;height:1px;background:#E2E9F0}
.or-text{font-size:12px;color:#C5D0DC;font-weight:500}

/* ── FADE-IN ANIMATION ── */
.fade-in{animation:fadeIn .4s ease both}
.fade-up{animation:fadeUp .4s ease both}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}

/* ── DESKTOP WRAPPER ── */
.desktop-shell{display:none}
@media(min-width:900px){
  .desktop-shell{display:flex;position:fixed;top:0;left:0;right:0;bottom:0;background:linear-gradient(135deg,#071122 0%,#0E2440 100%)}
  .shell{background:transparent;min-height:0;height:100vh;overflow:hidden;padding:0;align-items:center;position:relative;z-index:1}
  .phone{margin:0 auto}
  .desktop-info{position:absolute;left:50%;margin-left:260px;top:50%;transform:translateY(-50%);max-width:360px;padding:40px}
  .desktop-title{font-family:'Sora',sans-serif;font-size:36px;font-weight:800;color:#fff;letter-spacing:-1px;line-height:1.2;margin-bottom:16px}
  .desktop-sub{font-size:15px;color:rgba(255,255,255,0.5);line-height:1.7;margin-bottom:32px}
  .desktop-feature{display:flex;align-items:center;gap:12px;margin-bottom:16px}
  .desktop-feature-icon{width:40px;height:40px;border-radius:12px;background:rgba(0,184,169,0.1);border:1px solid rgba(0,184,169,0.2);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
  .desktop-feature-text{font-size:14px;color:rgba(255,255,255,0.6)}
  .desktop-feature-text strong{color:#fff;display:block;font-size:14px;margin-bottom:1px}
}
`;

/* ─────────────────────────────────────────────
   SCREEN 1 — LANDING
───────────────────────────────────────────── */

function FaqItem({ q, a }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{borderBottom:"1px solid rgba(0,0,0,0.06)",paddingBottom:0}}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 0",cursor:"pointer",gap:12}}
      >
        <div style={{fontSize:14,fontWeight:600,color:"#0A1628",lineHeight:1.4}}>{q}</div>
        <div style={{fontSize:18,color:"#00B8A9",flexShrink:0,transition:"transform 0.2s",transform:open?"rotate(45deg)":"rotate(0deg)"}}>+</div>
      </div>
      {open && (
        <div style={{fontSize:13,color:"#4A6080",lineHeight:1.7,paddingBottom:16}}>
          {a}
        </div>
      )}
    </div>
  );
}

function Landing({ go }) {
  const [faqOpen, setFaqOpen] = React.useState(false);
  return (
    <div className="screen fade-in">
      {faqOpen && <FaqModal onClose={() => setFaqOpen(false)} />}
      <div className="screen-scroll">
        <div className="landing-hero">
          <div className="logo-row">
            <div className="mulo-logo">Mu<span>ḽ</span>o</div>
            <div className="login-link" onClick={() => go("dashboard")}>Sign in →</div>
          </div>
          <div className="hero-eyebrow">🇿🇦 South Africa's #1 Refinance Platform</div>
          <h1 className="hero-title">
            The smart way to<br />
            <em>refinance and settle expensive debt.</em>
          </h1>
          <p className="hero-sub">Use your home's equity to pay off expensive debt at a lower interest rate — fully digital.</p>
          <div className="hero-stats">
            {[["R2.8B+","Refinanced"],["5 min","Avg. approval"],["98%","Satisfaction"]].map(([v,l]) => (
              <div className="hero-stat" key={l}><div className="hero-stat-val">{v}</div><div className="hero-stat-lbl">{l}</div></div>
            ))}
          </div>
          <div className="trust-strip">
            {[["🔒","NCR Compliant"],["🏦","FSCA Registered"],["⚡","256-bit SSL"]].map(([i,l]) => (
              <div className="trust-item" key={l}><span className="trust-icon">{i}</span>{l}</div>
            ))}
          </div>
        </div>
        <div className="landing-body">
          <div className="section-title">How it works</div>
          {[
            ["1","Verify your identity","Enter your SA ID — we check homeowner status instantly"],
            ["2","Connect your data","TruID · TransUnion · Lightstone — secure & read-only"],
            ["3","Get your offer","See your equity loan offer in under 5 minutes"],
            ["4","Settle your debt","Funds paid directly to creditors. One simple repayment."],
          ].map(([n,t,s]) => (
            <div className="step-card" key={n}>
              <div className="step-num">{n}</div>
              <div><div className="step-content-title">{t}</div><div className="step-content-sub">{s}</div></div>
            </div>
          ))}
        </div>
      </div>

      <div className="bottom-cta">
        <button className="btn btn-primary" onClick={() => go("id-verify")}>Check if you qualify →</button>
        <div style={{textAlign:"center",marginTop:10,fontSize:11,color:"#8FA3BE"}}>No credit check · Takes 5 minutes · Free to apply</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SA ID VALIDATION UTILITIES
───────────────────────────────────────────── */
function validateSAID(id) {
  if (!/^\d{13}$/.test(id)) return { valid: false, error: "Must be exactly 13 digits" };

  // Extract components
  const yy    = parseInt(id.slice(0, 2));
  const mm    = parseInt(id.slice(2, 4));
  const dd    = parseInt(id.slice(4, 6));
  const gender = parseInt(id.slice(6, 10));
  const citizen = parseInt(id.slice(10, 11));

  // 1. Validate date of birth
  const year  = yy <= new Date().getFullYear() % 100 ? 2000 + yy : 1900 + yy;
  const dob   = new Date(year, mm - 1, dd);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31 || dob.getMonth() !== mm - 1 || dob.getDate() !== dd) {
    return { valid: false, error: "Invalid date of birth in ID number" };
  }

  // 2. Validate age (must be 18+)
  const today = new Date();
  const age   = today.getFullYear() - dob.getFullYear() - (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
  if (age < 18) return { valid: false, error: "Applicant must be 18 or older" };
  if (age > 100) return { valid: false, error: "Date of birth appears invalid" };

  // 3. Validate citizenship digit (0 = SA citizen, 1 = permanent resident)
  if (citizen !== 0 && citizen !== 1) {
    return { valid: false, error: "Invalid citizenship digit — must be 0 or 1" };
  }

  // 4. Luhn algorithm checksum
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    let digit = parseInt(id[i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  if (checkDigit !== parseInt(id[12])) {
    return { valid: false, error: "Checksum failed — please check your ID number" };
  }

  // Extract readable info
  const genderStr   = gender >= 5000 ? "Male" : "Female";
  const citizenStr  = citizen === 0 ? "SA Citizen" : "Permanent Resident";
  const dobFormatted = dob.toLocaleDateString("en-ZA", { day:"numeric", month:"long", year:"numeric" });

  return { valid: true, dob: dobFormatted, age, gender: genderStr, citizen: citizenStr };
}

/* ─────────────────────────────────────────────
   SCREEN 2 — ID VERIFICATION
───────────────────────────────────────────── */
function FaqModal({ onClose }) {
  const faqs = [
    { q: "What exactly is Muḽo?", a: "Muḽo is a digital platform that lets South African homeowners access the equity in their home to pay off expensive unsecured debt — personal loans, credit cards and vehicle finance. Instead of paying 20–28% interest on those debts, you consolidate them into your existing home loan at your current home loan interest rate. You apply in under 5 minutes, entirely online." },
    { q: "What interest rate will I pay?", a: "You pay your current home loan interest rate — not a new rate. Because this is a further advance on your existing bond, it is added to your current facility at the same rate your bank already approved for you. This means no new credit committee approval is needed, and you benefit from a much lower rate than any unsecured loan." },
    { q: "How long is the repayment term?", a: "Your repayment term is the number of years remaining on your current home loan. For example, if you have 10 years left on your bond, the further advance is repaid over those same 10 years. This keeps your monthly payment much lower than a typical 5-year personal loan for the same amount. We require a minimum of 5 years remaining on your home loan to qualify." },
    { q: "Do I qualify?", a: "You may qualify if you: (1) own a home in South Africa with a registered bond, (2) have at least 5 years remaining on your home loan, (3) have unsecured debt such as personal loans, credit cards or vehicle finance to consolidate, and (4) have sufficient equity — we lend up to 75% of your property's current market value, less your outstanding bond balance." },
    { q: "Why only up to 75% of my property value?", a: "The 75% limit is a responsible lending rule that protects you. It ensures you retain at least 25% equity in your home even after the further advance. This protects you if property values dip, and gives the bank adequate security. It is the standard limit applied by South African banks for further advances under the National Credit Act." },
    { q: "How is my money paid out?", a: "Funds are released one debt at a time, directly into your verified bank account. You settle each creditor yourself and upload proof of payment. Once Muḽo confirms with the credit bureau that the account is closed, the next payment is released into your account. This step-by-step approach ensures every rand goes exactly where it should — no money is sent directly to creditors without your involvement." },
    { q: "Is my personal data safe?", a: "Yes — your data is protected by multiple layers of security. Your SA ID number is never stored as-is; we store only a one-way SHA-256 cryptographic hash that cannot be reversed. All data is stored on AWS servers in South Africa (Cape Town) in compliance with POPIA. Your information is never sold or shared with third parties." },
    { q: "How does Muḽo access my financial information?", a: "With your explicit consent, Muḽo retrieves your property valuation and bond details from Lightstone, your income and bank statements from TruID (read-only access — no transactions are possible), and your credit profile from TransUnion. This data is used solely to calculate your personalised offer and is never stored beyond what is necessary." },
    { q: "Will applying affect my credit score?", a: "Checking your eligibility on Muḽo does not affect your credit score. A credit enquiry is only recorded when you formally accept an offer and the further advance is processed by your bank — which is standard practice for any credit application in South Africa." },
    { q: "How long does the process take?", a: "The application takes under 5 minutes. Your documents are reviewed within 30 minutes during business hours. Funds are typically released within 24–48 hours of signing your agreement." },
  ];
  const [openIdx, setOpenIdx] = React.useState(null);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(10,22,40,0.85)",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:"24px 24px 0 0",width:"100%",maxWidth:430,maxHeight:"85vh",overflow:"hidden",display:"flex",flexDirection:"column"}} onClick={e => e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 24px 16px",borderBottom:"1px solid rgba(0,0,0,0.06)"}}>
          <div style={{fontFamily:"'Sora',sans-serif",fontSize:17,fontWeight:800,color:"#0A1628"}}>Frequently asked questions</div>
          <div style={{width:32,height:32,borderRadius:"50%",background:"#F7F9FC",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:16,color:"#8FA3BE"}} onClick={onClose}>✕</div>
        </div>
        <div style={{overflowY:"auto",flex:1,padding:"0 24px 32px"}}>
          {faqs.map((item, idx) => (
            <div key={idx} style={{borderBottom:"1px solid rgba(0,0,0,0.06)"}}>
              <div onClick={() => setOpenIdx(openIdx === idx ? null : idx)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 0",cursor:"pointer",gap:12}}>
                <div style={{fontSize:14,fontWeight:600,color:"#0A1628",lineHeight:1.4}}>{item.q}</div>
                <div style={{fontSize:20,color:"#00B8A9",flexShrink:0,transition:"transform 0.2s",transform:openIdx===idx?"rotate(45deg)":"rotate(0deg)"}}>+</div>
              </div>
              {openIdx === idx && (
                <div style={{fontSize:13,color:"#4A6080",lineHeight:1.7,paddingBottom:16}}>{item.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function IdVerify({ go }) {
  const [idNum, setIdNum]   = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [phase, setPhase]   = useState("idle"); // idle | validating | invalid | checking | done
  const [validation, setValidation] = useState(null);
  const [checks, setChecks] = useState([
    { label:"Valid SA ID format",    sub:"13 digits · Luhn checksum · Date of birth", status:"wait" },
    { label:"Homeowner status",      sub:"Deeds Office verification", status:"wait" },
    { label:"No sequestration",      sub:"Master of High Court check", status:"wait" },
  ]);

  const fmt = v => v.replace(/\D/g,"").slice(0,13);

  const handleChange = (val) => {
    const cleaned = fmt(val);
    setIdNum(cleaned);
    setPhase("idle");
    setValidation(null);
    setChecks(c => c.map(x => ({ ...x, status:"wait" })));

    // Live validate as soon as 13 digits entered
    if (cleaned.length === 13) {
      const result = validateSAID(cleaned);
      setValidation(result);
      if (!result.valid) setPhase("invalid");
    }
  };

  const handleCheck = async () => {
    if (idNum.length < 13) return;
    const result = validateSAID(idNum);
    if (!result.valid) { setPhase("invalid"); setValidation(result); return; }

setPhase("checking");
    setChecks(c => c.map((x,i) => i===0 ? {...x,status:"loading"} : x));
    try {
      const res = await fetch(`${API}/verify-id`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_number: idNum })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      setChecks(c => c.map((x,i) => i===0 ? {...x,status:"ok",sub:`DOB: ${result.dob} · ${result.gender} · ${result.citizen}`} : x));
      setTimeout(() => {
        setChecks(c => c.map((x,i) => i===1 ? {...x,status:"loading"} : x));
        setTimeout(() => {
          setChecks(c => c.map((x,i) => i===1 ? {...x,status:"ok"} : x));
          setTimeout(() => {
            setChecks(c => c.map((x,i) => i===2 ? {...x,status:"loading"} : x));
            setTimeout(() => {
              setChecks(c => c.map((x,i) => i===2 ? {...x,status:"ok"} : x));
              setPhase("done");
            }, 900);
          }, 400);
        }, 900);
      }, 400);
    } catch(err) {
      setPhase("invalid");
      setValidation({ valid: false, error: err.message });
      setChecks(c => c.map(x => ({ ...x, status:"wait" })));
    }
  };

  // Colour the input border based on state
  const inputClass = phase==="invalid" ? "input-field error"
                   : phase==="done"    ? "input-field success"
                   : "input-field";

  // Live format hint shown below input
  const renderHint = () => {
    if (idNum.length === 0) return null;
    if (idNum.length < 13) return <div className="input-hint">{idNum.length}/13 digits</div>;
    if (phase === "invalid" && validation) return <div className="input-hint err">✕ {validation.error}</div>;
    if (validation?.valid) return (
      <div className="input-hint ok">
        ✓ Valid · DOB {validation.dob} · {validation.gender} · {validation.citizen}
      </div>
    );
    return null;
  };

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <div className="back-btn" onClick={() => go("landing")}>←</div>
        <div className="screen-header-text">
          <div className="screen-header-title">Verify your identity</div>
          <div className="screen-header-sub">Step 1 of 6</div>
        </div>
      </div>
      <div className="progress-track"><div className="progress-fill" style={{width:"16%"}} /></div>

      <div className="screen-scroll">
        <div className="id-graphic">
          <div className="id-card-label">South African ID Number</div>
          <div className="id-card-number" style={{letterSpacing: idNum ? 3 : 1}}>
            {idNum
              ? `${idNum.slice(0,6)} ${idNum.slice(6,10)} ${idNum.slice(10)}`
              : "000000 0000 000"}
          </div>
          {validation?.valid && (
            <div style={{fontSize:11,color:"rgba(255,255,255,0.6)",marginTop:8,display:"flex",gap:12}}>
              <span>🎂 {validation.dob}</span>
              <span>{validation.gender}</span>
            </div>
          )}
          <div className="id-card-flag">🇿🇦</div>
        </div>

        <div className="form-pad">
          <div className="input-group">
            <label className="input-label">SA ID Number</label>
            <input
              className={inputClass}
              placeholder="e.g. 8001015009087"
              value={idNum}
              maxLength={13}
              inputMode="numeric"
              onChange={e => handleChange(e.target.value)}
            />
            {renderHint()}
          </div>
          {idNum.length === 13 && validation?.valid && (
            <div className="fade-up" style={{display:"flex",gap:10,marginBottom:4}}>
              <div className="input-group" style={{flex:1,marginBottom:0}}>
                <label className="input-label">First name <span style={{color:"#8FA3BE",fontWeight:400}}>(as per ID)</span></label>
                <input
                  className="input-field"
                  placeholder="e.g. Thabo"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  autoCapitalize="words"
                />
              </div>
              <div className="input-group" style={{flex:1,marginBottom:0}}>
                <label className="input-label">Last name <span style={{color:"#8FA3BE",fontWeight:400}}>(as per ID)</span></label>
                <input
                  className="input-field"
                  placeholder="e.g. Nkosi"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  autoCapitalize="words"
                />
              </div>
            </div>
          )}

          {/* Validation breakdown — shown as soon as 13 digits entered */}
          {idNum.length === 13 && (
            <div style={{marginBottom:16}} className="fade-up">
              <div style={{fontSize:11,fontWeight:700,color:"#8FA3BE",textTransform:"uppercase",letterSpacing:0.8,marginBottom:10}}>Format validation</div>
              {[
                {
                  label:"13 digits",
                  ok: idNum.length === 13,
                  detail:"Correct length"
                },
                {
                  label:"Valid date of birth",
                  ok: validation?.valid || (validation?.error !== "Invalid date of birth in ID number" && validation?.error !== "Applicant must be 18 or older" && validation?.error !== "Date of birth appears invalid"),
                  detail: validation?.valid ? `${validation.dob} · Age ${validation.age}` : (["Invalid date of birth in ID number","Applicant must be 18 or older","Date of birth appears invalid"].includes(validation?.error) ? validation.error : "Checking...")
                },
                {
                  label:"Citizenship digit",
                  ok: validation?.valid || validation?.error !== "Invalid citizenship digit — must be 0 or 1",
                  detail: validation?.valid ? validation.citizen : validation?.error === "Invalid citizenship digit — must be 0 or 1" ? "Invalid — must be 0 or 1" : "SA Citizen or Permanent Resident"
                },
                {
                  label:"Luhn checksum",
                  ok: validation?.valid,
                  detail: validation?.valid ? "Mathematically valid" : validation?.error === "Checksum failed — please check your ID number" ? "Checksum failed — typo?" : "Verifying..."
                },
              ].map((row, i) => (
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"9px 0",borderBottom:"1px solid #F7F9FC"}}>
                  <div style={{
                    width:24,height:24,borderRadius:8,flexShrink:0,
                    background: row.ok ? "rgba(18,194,107,0.1)" : "rgba(255,112,67,0.1)",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:12,color: row.ok ? "#12C26B" : "#FF7043"
                  }}>{row.ok ? "✓" : "✕"}</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:"#0A1628"}}>{row.label}</div>
                    <div style={{fontSize:11,color: row.ok ? "#8FA3BE" : "#FF7043",marginTop:1}}>{row.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bureau checks — shown after clicking Verify */}
          {(phase === "checking" || phase === "done") && (
            <div style={{padding:"4px 0 20px"}} className="fade-up">
              <div style={{fontSize:11,fontWeight:700,color:"#8FA3BE",textTransform:"uppercase",letterSpacing:0.8,marginBottom:10}}>Database checks</div>
              {checks.map((c,i) => (
                <div className="check-row" key={i}>
                  <div className={`check-icon ${c.status==="wait"?"pending":c.status}`}>
                    {c.status==="ok"?"✓":c.status==="loading"?"⟳":"○"}
                  </div>
                  <div style={{flex:1}}>
                    <div className="check-text">{c.label}</div>
                    <div className="check-sub">{c.sub}</div>
                  </div>
                  {c.status==="ok" && <div style={{fontSize:11,color:"#12C26B",fontWeight:600,flexShrink:0}}>Passed</div>}
                  {c.status==="loading" && <div style={{fontSize:11,color:"#00B8A9",fontWeight:600,flexShrink:0}}>Checking…</div>}
                </div>
              ))}
            </div>
          )}

          {phase==="done" && (
            <div className="pre-qual-banner fade-up">
              <div className="pre-qual-icon">🏡</div>
              <div className="pre-qual-title">Homeowner confirmed</div>
              <div className="pre-qual-sub">{(window._muloFirstName && window._muloLastName ? window._muloFirstName + ' ' + window._muloLastName : 'Thabo Nkosi')} · Kempton Park, Gauteng<br/>Next: verify it's really you</div>
            </div>
          )}

          {phase==="invalid" && validation && (
            <div style={{background:"rgba(255,112,67,0.06)",border:"1px solid rgba(255,112,67,0.25)",borderRadius:14,padding:16,marginBottom:16}} className="fade-up">
              <div style={{fontSize:14,fontWeight:700,color:"#FF7043",marginBottom:6}}>✕ Invalid ID number</div>
              <div style={{fontSize:13,color:"#0A1628",lineHeight:1.6}}>{validation.error}</div>
              <div style={{fontSize:11,color:"#8FA3BE",marginTop:8,lineHeight:1.6}}>
                Please double-check your 13-digit SA ID number and try again.
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bottom-cta">
        {phase !== "done"
          ? <button className="btn btn-primary"
              disabled={idNum.length < 13 || phase === "invalid" || phase === "checking"}
              style={{opacity: idNum.length < 13 || phase === "invalid" ? 0.4 : 1}}
              onClick={handleCheck}>
              {phase === "checking" ? "Verifying…" : "Verify my ID →"}
            </button>
          : <button className="btn btn-primary" onClick={() => { window._muloIdNumber = idNum; window._muloFirstName = firstName; window._muloLastName = lastName; go("otp"); }} disabled={!firstName.trim() || !lastName.trim()} style={{opacity: !firstName.trim() || !lastName.trim() ? 0.4 : 1}}>
              Send WhatsApp OTP →
            </button>
        }
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 2B — WHATSAPP OTP
───────────────────────────────────────────── */
function OtpVerify({ go }) {
  const [digits, setDigits] = useState(["","","","","",""]);
  const [phase, setPhase] = useState("idle");
  const [timer, setTimer] = useState(59);
  const [attempts, setAttempts] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if(timer <= 0) return;
    const t = setTimeout(() => setTimer(s => s-1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const handleDigit = (i, val) => {
    const v = val.replace(/\D/g,"").slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    setPhase("idle");
    if(v && i < 5) inputRefs.current[i+1]?.focus();
  };

  const handleKey = (i, e) => {
    if(e.key === "Backspace" && !digits[i] && i > 0) inputRefs.current[i-1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g,"").slice(0,6);
    if(pasted.length === 6) { setDigits(pasted.split("")); inputRefs.current[5]?.focus(); }
  };

const verify = async () => {
    const code = digits.join("");
    if(code.length < 6) return;
    setPhase("checking");
    try {
      const res = await fetch(`${API}/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_number: window._muloIdNumber || "demo", otp: code })
      });
      const data = await res.json();
      if(data.verified) {
        setPhase("done");
        setTimeout(() => go("liveness"), 900);
      } else {
        setAttempts(a => a+1);
        setPhase("error");
        setDigits(["","","","","",""]);
        inputRefs.current[0]?.focus();
      }
    } catch(err) {
      setAttempts(a => a+1);
      setPhase("error");
      setDigits(["","","","","",""]);
      inputRefs.current[0]?.focus();
    }
  };

  const resend = () => { setTimer(59); setDigits(["","","","","",""]); setPhase("idle"); };
  const allFilled = digits.every(Boolean);

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <div className="back-btn" onClick={() => go("id-verify")}>←</div>
        <div className="screen-header-text">
          <div className="screen-header-title">WhatsApp verification</div>
          <div className="screen-header-sub">Step 2 of 6</div>
        </div>
      </div>
      <div className="progress-track"><div className="progress-fill" style={{width:"33%"}} /></div>

      <div className="screen-scroll">
        {/* WhatsApp sent card */}
        <div className="wa-card">
          <div className="wa-icon-wrap">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </div>
          <div>
            <div className="wa-sent-label">OTP sent via WhatsApp to</div>
            <div className="wa-phone-num">+27 *** *** 284</div>
            <div className="wa-tick">✓✓ Delivered to your WhatsApp</div>
          </div>
        </div>

        {/* WhatsApp message preview */}
        <div className="wa-preview">
          <div className="wa-preview-header">
            <div className="wa-preview-avatar">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </div>
            <div>
              <div className="wa-preview-name">Muḽo · Official</div>
              <div className="wa-preview-sub">🔒 Verified Business</div>
            </div>
          </div>
          <div className="wa-preview-body">
            <div className="wa-bubble">
              <div className="wa-bubble-greeting">Hi {window._muloFirstName || 'Thabo'} 👋 Your Muḽo verification code is:</div>
              <div className="wa-bubble-otp">123456</div>
              <div className="wa-bubble-footer">Valid for <strong>10 minutes</strong>. Never share this code with anyone — Muḽo will never ask for it.<br/>🔒 DHA-linked number verified.</div>
              <div className="wa-bubble-meta">
                <span>11:42 AM</span>
                <span style={{color:"#4FC3F7"}}>✓✓</span>
              </div>
            </div>
          </div>
        </div>

        <div className="form-pad">
          <div style={{textAlign:"center",marginBottom:4,fontSize:13,color:"#0A1628",fontWeight:500}}>Enter the 6-digit code from WhatsApp</div>

          <div className="otp-boxes" onPaste={handlePaste}>
            {digits.map((d,i) => (
              <input key={i} ref={el => inputRefs.current[i] = el}
                style={{
                  width:46,height:56,borderRadius:13,border:"none",outline:"none",textAlign:"center",
                  border: phase==="error" ? "1.5px solid #FF7043" : phase==="done" ? "1.5px solid #12C26B" : d ? "1.5px solid #25D366" : "1.5px solid #E2E9F0",
                  background: phase==="done" ? "rgba(18,194,107,0.05)" : d ? "rgba(37,211,102,0.04)" : "#fff",
                  fontFamily:"'Sora',sans-serif",fontSize:22,fontWeight:700,
                  color: phase==="done" ? "#12C26B" : "#0A1628",
                  transition:"all .2s",boxSizing:"border-box",
                  animation: phase==="error" ? "shake .4s ease" : "none",
                }}
                maxLength={1} value={phase==="done"?"✓":d} inputMode="numeric"
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => handleKey(i,e)}
              />
            ))}
          </div>

          {phase==="error" && <div style={{textAlign:"center",fontSize:13,color:"#FF7043",fontWeight:600,marginBottom:10}} className="fade-up">✕ Incorrect code — try again</div>}
          {phase==="done"  && <div style={{textAlign:"center",fontSize:13,color:"#12C26B",fontWeight:600,marginBottom:10}} className="fade-up">✓ Verified — redirecting…</div>}

          {attempts >= 2 && (
            <div className="attempt-counter">⚠️ {3-attempts} attempt{3-attempts!==1?"s":""} left before lockout</div>
          )}

          <div className="otp-resend-row">
            {timer > 0
              ? <>Resend in <span className="otp-timer">0:{String(timer).padStart(2,"0")}</span></>
              : <>Didn't get it? <span className="otp-resend-link" onClick={resend}>↗ Resend via WhatsApp</span></>
            }
          </div>

          <div style={{height:14}}/>
          <div className="security-badge">
            <span className="security-badge-icon">💬</span>
            <span>OTP sent only to the number registered with <strong style={{color:"#0A1628"}}>Home Affairs (DHA)</strong> for this ID. We use WhatsApp so we can support you through your entire application journey.</span>
          </div>
          <div style={{background:"#F7F9FC",border:"1px solid #E8EDF4",borderRadius:14,padding:14,fontSize:12,color:"#8FA3BE",lineHeight:1.6,marginBottom:16}}>
            <strong style={{color:"#0A1628",display:"block",marginBottom:3}}>💡 Demo hint</strong>
            Enter <strong style={{color:"#25D366",fontFamily:"'Sora',sans-serif"}}>123456</strong> to proceed.
          </div>
        </div>
      </div>

      <div className="bottom-cta">
        <button className="btn btn-primary"
          style={{opacity: allFilled && phase!=="checking" && phase!=="done" ? 1 : 0.4, background:"linear-gradient(135deg,#25D366,#128C7E)"}}
          disabled={!allFilled || phase==="checking" || phase==="done"}
          onClick={verify}>
          {phase==="checking" ? "Verifying…" : phase==="done" ? "Verified ✓" : "Verify WhatsApp OTP →"}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 2C — LIVENESS CHECK
───────────────────────────────────────────── */
function LivenessCheck({ go }) {
  const [phase, setPhase] = useState("idle"); // idle | scanning | verified
  const [livenessStep, setLivenessStep] = useState(0);

  const steps = [
    { label:"Face detected in oval", icon:"😊" },
    { label:"Look left", icon:"👈" },
    { label:"Look right", icon:"👉" },
    { label:"Blink twice", icon:"😉" },
    { label:"Matching DHA photo", icon:"🏛️" },
  ];

  const startScan = () => {
    setPhase("scanning");
    setLivenessStep(0);
    let i = 0;
    const tick = () => {
      if(i >= steps.length) { setPhase("verified"); return; }
      setLivenessStep(i);
      i++;
      setTimeout(tick, i === steps.length ? 1400 : 900);
    };
    tick();
  };

  return (
    <div className="screen fade-in" style={{background:"#F7F9FC"}}>
      <div className="screen-header">
        <div className="back-btn" onClick={() => go("otp")}>←</div>
        <div className="screen-header-text">
          <div className="screen-header-title">Face verification</div>
          <div className="screen-header-sub">Step 3 of 6</div>
        </div>
      </div>
      <div className="progress-track"><div className="progress-fill" style={{width:"50%"}} /></div>

      <div className="screen-scroll">
        <div style={{padding:"0 24px 12px",fontSize:13,color:"#8FA3BE",lineHeight:1.6}}>
          We'll match your face to your Department of Home Affairs photo to confirm <strong style={{color:"#0A1628"}}>you</strong> are the ID holder.
        </div>

        <div className="camera-viewport">
          <div style={{position:"absolute",inset:0,background:phase==="verified"?"linear-gradient(160deg,#0d2e1a,#0a2010)":"linear-gradient(160deg,#0d1a2e,#0a1020)"}}/>
          <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(0,184,169,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,184,169,0.04) 1px,transparent 1px)",backgroundSize:"32px 32px"}}/>
          <div className="camera-corner tl"/><div className="camera-corner tr"/>
          <div className="camera-corner bl"/><div className="camera-corner br"/>
          <div className="camera-face-ring">
            <div className={`face-oval ${phase==="scanning"?"scanning":phase==="verified"?"done":""}`}>
              {phase==="scanning" && <div className="scan-line"/>}
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:phase==="scanning"?64:72,transition:"font-size .3s",opacity:phase==="verified"?0.6:0.2}}>
                {phase==="scanning"?(steps[livenessStep]?.icon||"😊"):phase==="verified"?"😊":"👤"}
              </div>
            </div>
          </div>
          {phase==="verified" && (
            <div className="verified-overlay fade-in">
              <div className="verified-checkmark">✓</div>
              <div className="verified-label">Identity Verified</div>
            </div>
          )}
          <div className="camera-overlay-text">
            <div className="camera-instruction">
              {phase==="idle"&&"Position face in oval"}
              {phase==="scanning"&&(steps[livenessStep]?.label||"Hold still…")}
              {phase==="verified"&&`✓ Match confirmed — ${(window._muloFirstName && window._muloLastName ? window._muloFirstName + ' ' + window._muloLastName : 'Thabo Nkosi')}`}
            </div>
            <div className="camera-sub-instruction">
              {phase==="idle"&&"Tap 'Start verification' below"}
              {phase==="scanning"&&`Check ${livenessStep+1} of ${steps.length}`}
              {phase==="verified"&&"Your face matches DHA records"}
            </div>
          </div>
        </div>

        <div className="liveness-checks">
          {steps.map((s,i) => (
            <div className="liveness-check" key={i}>
              <div className={`liveness-check-dot ${phase==="verified"?"done":phase==="scanning"&&i<livenessStep?"done":phase==="scanning"&&i===livenessStep?"active":"wait"}`}/>
              <div className="liveness-check-label">{s.icon} &nbsp;{s.label}</div>
              <div className="liveness-check-icon">
                {(phase==="verified"||(phase==="scanning"&&i<livenessStep))?"✓":phase==="scanning"&&i===livenessStep?"⟳":""}
              </div>
            </div>
          ))}
        </div>
        <div style={{height:8}}/>
        <div className="security-badge" style={{margin:"12px 24px"}}>
          <span className="security-badge-icon">🛡️</span>
          <span>Liveness detection prevents photo spoofing. Video is processed in real-time and <strong style={{color:"#0A1628"}}>never stored</strong>. Powered by Smile Identity.</span>
        </div>
        <div style={{height:8}}/>
      </div>

      <div className="bottom-cta">
        {phase==="idle"&&<button className="btn btn-primary" onClick={startScan}>Start face verification →</button>}
        {phase==="scanning"&&<button className="btn btn-primary" style={{opacity:.5}} disabled><span style={{display:"inline-block",animation:"spin 1s linear infinite",marginRight:6}}>⟳</span>Scanning…</button>}
        {phase==="verified"&&<button className="btn btn-primary" onClick={()=>go("signup")}>Continue to create account →</button>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 3 — ACCOUNT CREATION
───────────────────────────────────────────── */
function Signup({ go }) {
  const [form, setForm] = useState({ email:"", phone:"", pass:"", confirm:"" });
  const s = (k,v) => setForm(f=>({...f,[k]:v}));
  const passwordsMatch = form.pass.length >= 8 && form.confirm === form.pass;
  const ready = form.email && form.phone && passwordsMatch;

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <div className="back-btn" onClick={() => go("liveness")}>←</div>
        <div className="screen-header-text">
          <div className="screen-header-title">Create your account</div>
          <div className="screen-header-sub">Step 4 of 6</div>
        </div>
      </div>
      <div className="progress-track"><div className="progress-fill" style={{width:"66%"}} /></div>
      <div className="screen-scroll">
        <div className="form-pad" style={{paddingTop:8}}>
          <div style={{background:"rgba(18,194,107,0.06)",border:"1px solid rgba(18,194,107,0.2)",borderRadius:14,padding:"12px 14px",marginBottom:20,fontSize:12,color:"#12C26B",display:"flex",gap:8,alignItems:"center"}}>
            ✓  ID · OTP · Face verified — {(window._muloFirstName && window._muloLastName ? window._muloFirstName + ' ' + window._muloLastName : 'Thabo Nkosi')} · Homeowner
          </div>

          {/* Name locked from DHA */}
          <div style={{background:"#F7F9FC",border:"1px solid #E2E9F0",borderRadius:14,padding:"14px 16px",marginBottom:18}}>
            <div style={{fontSize:11,fontWeight:700,color:"#8FA3BE",textTransform:"uppercase",letterSpacing:0.8,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:13}}>🏛️</span> Name confirmed by Home Affairs
            </div>
            <div className="name-row">
              <div>
                <div style={{fontSize:10,color:"#8FA3BE",textTransform:"uppercase",letterSpacing:0.8,marginBottom:5}}>First name</div>
                <div style={{fontSize:15,fontWeight:700,color:"#0A1628"}}>{window._muloFirstName || 'Thabo'}</div>
              </div>
              <div>
                <div style={{fontSize:10,color:"#8FA3BE",textTransform:"uppercase",letterSpacing:0.8,marginBottom:5}}>Last name</div>
                <div style={{fontSize:15,fontWeight:700,color:"#0A1628"}}>{window._muloLastName || 'Nkosi'}</div>
              </div>
            </div>
            <div style={{fontSize:11,color:"#8FA3BE",marginTop:10,display:"flex",alignItems:"center",gap:5}}>
              🔒 Your legal name cannot be changed — it is sourced directly from the Department of Home Affairs.
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Email address</label>
            <input className="input-field" type="email" placeholder="thabo@email.co.za" value={form.email} onChange={e=>s("email",e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">Cell number</label>
            <input className="input-field" placeholder="+27 82 000 0000" value={form.phone} onChange={e=>s("phone",e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <input className="input-field" type="password" placeholder="Min. 8 characters" value={form.pass} onChange={e=>s("pass",e.target.value)} />
            {form.pass.length > 0 && (
              <div style={{display:"flex",gap:4,marginTop:8}}>
                {[form.pass.length>=8, /[A-Z]/.test(form.pass), /[0-9]/.test(form.pass)].map((ok,i) => (
                  <div key={i} style={{flex:1,height:3,borderRadius:99,background:ok?"#00B8A9":"#E2E9F0",transition:"background .3s"}} />
                ))}
              </div>
            )}
          </div>
          <div className="input-group">
            <label className="input-label">Confirm Password</label>
            <input
              className={`input-field ${form.confirm.length > 0 ? (passwordsMatch ? "success" : "error") : ""}`}
              type="password"
              placeholder="Re-enter your password"
              value={form.confirm}
              onChange={e=>s("confirm",e.target.value)}
            />
            {form.confirm.length > 0 && (
              <div className={`input-hint ${passwordsMatch ? "ok" : "err"}`}>
                {passwordsMatch ? "✓ Passwords match" : "✕ Passwords do not match"}
              </div>
            )}
          </div>
          <div style={{fontSize:11,color:"#8FA3BE",lineHeight:1.6,marginBottom:16}}>
            By creating an account you agree to Muḽo's <span style={{color:"#00B8A9"}}>Terms of Service</span> and <span style={{color:"#00B8A9"}}>Privacy Policy</span>.
          </div>
        </div>
      </div>
      <div className="bottom-cta">
        <button className="btn btn-primary" style={{opacity:ready?1:.45}} disabled={!ready} onClick={() => go("consent")}>
          Create account →
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 4 — CONSENT & DATA ACCESS
───────────────────────────────────────────── */
function Consent({ go }) {
  const [toggles, setToggles] = useState({ truId: true, transunion: true, lightstone: true });
  const tog = k => setToggles(t=>({...t,[k]:!t[k]}));
  const allOn = Object.values(toggles).every(Boolean);

  const providers = [
    { key:"truId", icon:"🏦", bg:"#EBF5FF", name:"TruID — Bank Data", desc:"Nedbank · FNB · Absa · Standard Bank", body:"Read-only access to 3 months of bank statements to verify income and assess affordability.", what:"Income · Expenses · Salary deposits" },
    { key:"transunion", icon:"📊", bg:"#FFF5EB", name:"TransUnion — Credit Bureau", desc:"Credit profile & payment history", body:"We access your credit score and repayment history to calculate your personalised rate.", what:"Credit score · Active accounts · Judgements" },
    { key:"lightstone", icon:"🏡", bg:"#EBFFF5", name:"Lightstone — Property Data", desc:"Title deed & valuation", body:"Confirms property ownership, title deed details, and current market valuation for equity calculation.", what:"Property value · Bond balance · Ownership" },
  ];

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <div className="back-btn" onClick={() => go("signup")}>←</div>
        <div className="screen-header-text">
          <div className="screen-header-title">Authorise data access</div>
          <div className="screen-header-sub">Step 3 of 4</div>
        </div>
      </div>
      <div className="progress-track"><div className="progress-fill" style={{width:"75%"}} /></div>
      <div className="screen-scroll">
        <div style={{padding:"0 24px 16px"}}>
          <p style={{fontSize:13,color:"#8FA3BE",lineHeight:1.7,marginBottom:20}}>
            To build your personalised offer, we need read-only access to the following data sources. All data is encrypted and never sold.
          </p>
          {providers.map(p => (
            <div className="consent-card" key={p.key}>
              <div className="consent-header">
                <div className="consent-logo" style={{background:p.bg}}>{p.icon}</div>
                <div style={{flex:1}}>
                  <div className="consent-name">{p.name}</div>
                  <div className="consent-desc">{p.desc}</div>
                </div>
              </div>
              <div className="consent-body">{p.body}<br/><span style={{color:"#0A1628",fontWeight:500}}>Accesses: {p.what}</span></div>
              <div className="toggle-row">
                <div className="toggle-label">{toggles[p.key] ? "Access granted" : "Access denied"}</div>
                <div className={`toggle ${toggles[p.key]?"on":""}`} onClick={() => tog(p.key)}>
                  <div className="toggle-thumb" />
                </div>
              </div>
            </div>
          ))}
          <div style={{fontSize:11,color:"#8FA3BE",lineHeight:1.6,textAlign:"center",padding:"8px 0 16px"}}>
            🔒 &nbsp;Access is revocable at any time from your profile settings
          </div>
        </div>
      </div>
      <div className="bottom-cta">
        <button className="btn btn-primary" onClick={async () => {
            if (!allOn) return;
            const sources = Object.keys(toggles).filter(k => toggles[k]);
            try {
              await fetch(`${API}/consent`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id_number: window._muloIdNumber || "demo", sources })
              });
            } catch(e) { console.error("Consent save failed", e); }
            go("loading");
          }} style={{opacity:allOn?1:.5}}>
          {allOn ? "Authorise & continue →" : "Please enable all sources"}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 5 — LOADING / ANALYSIS
───────────────────────────────────────────── */
function Loading({ go }) {
  const items = [
    { label:"Connecting to TruID", src:"Bank data" },
    { label:"Fetching credit profile", src:"TransUnion" },
    { label:"Valuing your property", src:"Lightstone" },
    { label:"Calculating equity", src:"Muḽo engine" },
    { label:"Building your offer", src:"Muḽo engine" },
  ];
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if(step < items.length) {
      const t = setTimeout(() => setStep(s => s+1), 700);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setDone(true), 400);
      return () => clearTimeout(t);
    }
  }, [step]);

  useEffect(() => {
    if(done) { const t = setTimeout(() => go("bond-confirm"), 800); return () => clearTimeout(t); }
  }, [done]);

  return (
    <div className="screen fade-in" style={{background:"#F7F9FC"}}>
      <div className="loading-screen">
        <div className="spinner-ring">
          <div className="ring-outer"/>
          <div className={done?"":"ring-inner"} style={done?{width:80,height:80,borderRadius:"50%",background:"rgba(18,194,107,0.1)",border:"2px solid #12C26B",position:"absolute"}:{}} />
          {done && <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>✅</div>}
        </div>
        <div className="loading-title">{done ? "Analysis complete!" : "Analysing your profile"}</div>
        <div className="loading-sub">{done ? "Please confirm your bond details." : "Securely connecting to your financial data sources…"}</div>
        <div className="data-checks">
          {items.map((item, i) => (
            <div className="data-check-item" key={i} style={{opacity: i > step ? 0.4 : 1, transition:"opacity .3s"}}>
              <div className={`data-check-dot ${i < step ? "done" : i === step ? "active" : "wait"}`}/>
              <div className="data-check-label">{item.label}<div style={{fontSize:10,color:"#8FA3BE"}}>{item.src}</div></div>
              <div className={`data-check-status ${i < step ? "done" : i === step ? "active" : "wait"}`}>
                {i < step ? "Done" : i === step ? "Live" : "—"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 5B — BOND CONFIRMATION
   Shows bureau-retrieved bond data and asks
   client to confirm accuracy before offer
───────────────────────────────────────────── */
function BondConfirm({ go }) {
  const [confirmed, setConfirmed] = useState(false);
  const [disputed, setDisputed]   = useState(false);
  const [disputeText, setDisputeText] = useState("");
  const [disputeSubmitted, setDisputeSubmitted] = useState(false);

  const fmt = n => "R " + n.toLocaleString("en-ZA");
  const [bureauData, setBureauData] = useState(null);
  const [bureauLoading, setBureauLoading] = useState(true);

  useEffect(() => {
    fetch(API + '/bureau', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_number: window._muloIdNumber || '8301012322099' })
    })
      .then(r => r.json())
      .then(data => { setBureauData(data); setBureauLoading(false); })
      .catch(() => setBureauLoading(false));
  }, []);

  const ls = bureauData?.lightstone;
  const BOND = ls ? {
    property:    ls.address,
    erf:         ls.erf_number,
    titleDeed:   ls.title_deed,
    bondholder:  ls.bond_holder,
    accountNo:   "••• ••• ••••",
    originalAmt: Math.round(ls.bond_balance * 1.3),
    outstanding: ls.bond_balance,
    monthlyRepay: Math.round(ls.bond_balance * 0.013),
    interestRate: "prime + 0.5% (12.25% p.a.)",
    startDate:   ls.bond_start_date ? new Date(ls.bond_start_date).toLocaleDateString("en-ZA", {month:"long",year:"numeric"}) : "2019",
    term:        "240 months (20 years)",
    remaining:   "~156 months remaining",
    sources:     ["Lightstone AVM", "TransUnion", "Deeds Office"],
  } : {
    property:    "34 Jacaranda Avenue, Kempton Park Ext 2, Gauteng",
    erf:         "Erf 4821",
    titleDeed:   "T 48291/2019",
    bondholder:  "Nedbank Home Loans",
    accountNo:   "••• ••• 2847",
    originalAmt: 1_400_000,
    outstanding: 1_070_000,
    monthlyRepay: 13_850,
    interestRate: "prime + 0.5% (12.25% p.a.)",
    startDate:   "March 2019",
    term:        "240 months (20 years)",
    remaining:   "~156 months remaining",
    sources:     ["Lightstone AVM", "TransUnion", "Deeds Office"],
  };

  if (disputeSubmitted) return (
    <div className="screen fade-in">
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flex:1,padding:"40px 24px",textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:20}}>📋</div>
        <div style={{fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:800,color:"#0A1628",marginBottom:10}}>Dispute logged</div>
        <div style={{fontSize:13,color:"#8FA3BE",lineHeight:1.7,marginBottom:24,maxWidth:300}}>
          Thank you for flagging this. A Muḽo compliance officer will review your dispute within <strong style={{color:"#0A1628"}}>1 business day</strong> and contact you on WhatsApp.
        </div>
        <div style={{background:"rgba(0,184,169,0.06)",border:"1px solid rgba(0,184,169,0.18)",borderRadius:14,padding:"14px 16px",fontSize:12,color:"#0A1628",lineHeight:1.7,textAlign:"left",width:"100%",marginBottom:24}}>
          <div style={{fontWeight:700,marginBottom:6}}>Reference: DISP-2026-00481</div>
          <div style={{color:"#8FA3BE"}}>Your application is paused until the dispute is resolved. No credit decisions will be made on incorrect data.</div>
        </div>
        <button className="btn btn-outline" style={{width:"100%"}} onClick={() => go("dashboard")}>Go to my dashboard</button>
      </div>
    </div>
  );

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <div className="back-btn" onClick={() => go("loading")}>←</div>
        <div className="screen-header-text">
          <div className="screen-header-title">Confirm your bond</div>
          <div className="screen-header-sub">Please verify this is correct</div>
        </div>
      </div>
      <div className="progress-track"><div className="progress-fill" style={{width:"70%"}} /></div>

      <div className="screen-scroll">
        <div style={{padding:"8px 16px 24px"}}>

          {/* Intro */}
          <div style={{background:"rgba(0,184,169,0.06)",border:"1px solid rgba(0,184,169,0.18)",borderRadius:14,padding:"13px 15px",marginBottom:16,fontSize:12,color:"#0A1628",lineHeight:1.7,display:"flex",gap:10}}>
            <span style={{fontSize:16,flexShrink:0}}>🔍</span>
            <div>We retrieved the following bond information from <strong>Lightstone</strong>, <strong>TransUnion</strong> and the <strong>Deeds Office</strong>. Please confirm it is accurate before we calculate your offer.</div>
          </div>

          {/* Property card */}
          <div style={{background:"linear-gradient(135deg,#0A1628,#1B3A5E)",borderRadius:18,padding:20,marginBottom:12,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",right:-20,top:-20,width:100,height:100,borderRadius:"50%",background:"rgba(0,184,169,0.1)"}}/>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Property · Lightstone AVM</div>
            <div style={{fontFamily:"'Sora',sans-serif",fontSize:15,fontWeight:700,color:"#fff",marginBottom:4,lineHeight:1.4}}>{BOND.property}</div>
            <div style={{display:"flex",gap:16,marginTop:10}}>
              {[["Title Deed", BOND.titleDeed],["Erf",BOND.erf]].map(([l,v])=>(
                <div key={l}>
                  <div style={{fontSize:9,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:0.5,marginBottom:2}}>{l}</div>
                  <div style={{fontSize:12,fontWeight:600,color:"#fff"}}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bond details card */}
          <div style={{background:"#fff",borderRadius:18,padding:18,boxShadow:"0 2px 14px rgba(0,0,0,0.06)",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
              <div style={{width:36,height:36,borderRadius:12,background:"#EBF0FF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🏦</div>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:"#0A1628"}}>{BOND.bondholder}</div>
                <div style={{fontSize:11,color:"#8FA3BE"}}>Account {BOND.accountNo}</div>
              </div>
              <div style={{marginLeft:"auto"}}>
                <div style={{fontSize:9,color:"#8FA3BE",textTransform:"uppercase",letterSpacing:0.5,marginBottom:2}}>Source</div>
                <div style={{fontSize:10,fontWeight:600,color:"#00B8A9"}}>TransUnion</div>
              </div>
            </div>

            {[
              ["Original bond amount",  fmt(BOND.originalAmt)],
              ["Outstanding balance",   fmt(BOND.outstanding)],
              ["Monthly repayment",     fmt(BOND.monthlyRepay)],
              ["Interest rate",         BOND.interestRate],
              ["Bond start date",       BOND.startDate],
              ["Original term",         BOND.term],
              ["Remaining term",        BOND.remaining],
            ].map(([label, val]) => (
              <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #F7F9FC"}}>
                <span style={{fontSize:12,color:"#8FA3BE"}}>{label}</span>
                <span style={{fontSize:13,fontWeight:700,color:"#0A1628",fontFamily:"'Sora',sans-serif",textAlign:"right",maxWidth:"55%"}}>{val}</span>
              </div>
            ))}
          </div>

          {/* Data sources */}
          <div style={{display:"flex",gap:8,marginBottom:16}}>
            {BOND.sources.map(s => (
              <div key={s} style={{flex:1,background:"#F7F9FC",border:"1px solid #E2E9F0",borderRadius:10,padding:"8px 10px",textAlign:"center"}}>
                <div style={{fontSize:10,fontWeight:600,color:"#00B8A9"}}>✓</div>
                <div style={{fontSize:9,color:"#8FA3BE",marginTop:2,lineHeight:1.4}}>{s}</div>
              </div>
            ))}
          </div>

          {/* Dispute section */}
          {!disputed ? (
            <div style={{marginBottom:8}}>
              <div style={{fontSize:12,color:"#8FA3BE",textAlign:"center",marginBottom:12,lineHeight:1.6}}>
                Is the above information correct?
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <button className="btn btn-outline" style={{justifyContent:"center",fontSize:13,borderColor:"rgba(255,112,67,0.3)",color:"#FF7043"}} onClick={() => setDisputed(true)}>
                  ✕ Dispute data
                </button>
                <button className="btn btn-primary" style={{justifyContent:"center",fontSize:13}} onClick={() => setConfirmed(true)}>
                  ✓ Confirm correct
                </button>
              </div>
            </div>
          ) : (
            <div style={{background:"rgba(255,112,67,0.04)",border:"1px solid rgba(255,112,67,0.2)",borderRadius:16,padding:16,marginBottom:8}} className="fade-up">
              <div style={{fontSize:13,fontWeight:700,color:"#FF7043",marginBottom:8}}>What's incorrect?</div>
              <div style={{fontSize:12,color:"#8FA3BE",marginBottom:12,lineHeight:1.6}}>Please describe what information is wrong. A compliance officer will review and contact you on WhatsApp within 1 business day.</div>
              <textarea
                style={{width:"100%",background:"#fff",border:"1.5px solid rgba(255,112,67,0.3)",borderRadius:12,padding:"12px 14px",fontFamily:"'IBM Plex Sans',sans-serif",fontSize:13,color:"#0A1628",outline:"none",resize:"none",minHeight:90,lineHeight:1.6,boxSizing:"border-box"}}
                placeholder="e.g. The outstanding balance is incorrect, or this is not my property..."
                value={disputeText}
                onChange={e => setDisputeText(e.target.value)}
              />
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:12}}>
                <button className="btn btn-ghost" style={{justifyContent:"center",fontSize:13}} onClick={() => setDisputed(false)}>
                  ← Back
                </button>
                <button className="btn btn-primary"
                  style={{justifyContent:"center",fontSize:13,background:"linear-gradient(135deg,#FF7043,#FF8A65)",opacity:disputeText.length > 10 ? 1 : 0.4}}
                  disabled={disputeText.length <= 10}
                  onClick={() => setDisputeSubmitted(true)}>
                  Submit dispute
                </button>
              </div>
            </div>
          )}

          {confirmed && !disputed && (
            <div style={{background:"rgba(18,194,107,0.06)",border:"1px solid rgba(18,194,107,0.2)",borderRadius:12,padding:"12px 16px",marginTop:8,fontSize:12,color:"#12C26B",display:"flex",gap:8,alignItems:"center"}} className="fade-up">
              ✓ Bond details confirmed · Next: confirm your bank account
            </div>
          )}
        </div>
      </div>

      <div className="bottom-cta">
        <button className="btn btn-primary"
          style={{opacity: confirmed && !disputed ? 1 : 0.35}}
          disabled={!confirmed || disputed}
          onClick={() => go("bank-account")}>
          Confirm bank account →
        </button>
        {!confirmed && !disputed && (
          <div style={{textAlign:"center",marginTop:10,fontSize:11,color:"#8FA3BE"}}>
            Please confirm or dispute the data above to continue
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 5C — BANK ACCOUNT CONFIRMATION
   Account retrieved from TruID — read only.
   Client confirms. No alternative allowed.
───────────────────────────────────────────── */
function BankAccountConfirm({ go }) {
  const [confirmed, setConfirmed] = useState(false);

  const ACCOUNT = {
    bank:        "Nedbank",
    logo:        "🏦",
    type:        "Cheque Account",
    holder: (window._muloFirstName && window._muloLastName ? window._muloFirstName + ' ' + window._muloLastName : 'Thabo Nkosi'),
    number:      "••• ••• 2847",
    branch:      "198765",
    source:      "TruID — verified 11 Apr 2026",
    nameMatch:   true,
  };

  const fmt = (label, value, highlight) => (
    <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 0",borderBottom:"1px solid #F7F9FC"}}>
      <span style={{fontSize:12,color:"#8FA3BE"}}>{label}</span>
      <span style={{fontSize:13,fontWeight:700,color: highlight ? "#12C26B" : "#0A1628",fontFamily:"'Sora',sans-serif"}}>{value}</span>
    </div>
  );

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <div className="back-btn" onClick={() => go("bond-confirm")}>←</div>
        <div className="screen-header-text">
          <div className="screen-header-title">Confirm bank account</div>
          <div className="screen-header-sub">Disbursement account</div>
        </div>
      </div>
      <div className="progress-track"><div className="progress-fill" style={{width:"75%"}} /></div>

      <div className="screen-scroll">
        <div style={{padding:"8px 16px 24px"}}>

          {/* Intro */}
          <div style={{background:"rgba(0,184,169,0.06)",border:"1px solid rgba(0,184,169,0.18)",borderRadius:14,padding:"13px 15px",marginBottom:16,fontSize:12,color:"#0A1628",lineHeight:1.7,display:"flex",gap:10}}>
            <span style={{fontSize:16,flexShrink:0}}>💳</span>
            <div>We retrieved the following bank account from <strong>TruID</strong> during your affordability assessment. Loan tranches will be disbursed into this account only.</div>
          </div>

          {/* Bank card */}
          <div style={{background:"linear-gradient(135deg,#0A1628,#1B3A5E)",borderRadius:18,padding:20,marginBottom:12,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",right:-20,top:-20,width:100,height:100,borderRadius:"50%",background:"rgba(0,184,169,0.1)"}}/>
            <div style={{position:"absolute",right:-10,bottom:-30,width:140,height:140,borderRadius:"50%",background:"rgba(26,115,232,0.08)"}}/>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:1,marginBottom:16,position:"relative",zIndex:1}}>Disbursement Account · TruID Verified</div>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,position:"relative",zIndex:1}}>
              <div style={{width:48,height:48,borderRadius:14,background:"rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{ACCOUNT.logo}</div>
              <div>
                <div style={{fontFamily:"'Sora',sans-serif",fontSize:18,fontWeight:800,color:"#fff"}}>{ACCOUNT.bank}</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",marginTop:2}}>{ACCOUNT.type}</div>
              </div>
            </div>
            <div style={{fontFamily:"'Sora',sans-serif",fontSize:22,fontWeight:700,color:"#fff",letterSpacing:4,marginBottom:16,position:"relative",zIndex:1}}>{ACCOUNT.number}</div>
            <div style={{display:"flex",justifyContent:"space-between",position:"relative",zIndex:1}}>
              <div>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:0.5,marginBottom:3}}>Account holder</div>
                <div style={{fontSize:13,fontWeight:600,color:"#fff"}}>{ACCOUNT.holder}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:0.5,marginBottom:3}}>Branch code</div>
                <div style={{fontSize:13,fontWeight:600,color:"#fff"}}>{ACCOUNT.branch}</div>
              </div>
            </div>
          </div>

          {/* Verification details */}
          <div style={{background:"#fff",borderRadius:18,padding:18,boxShadow:"0 2px 14px rgba(0,0,0,0.06)",marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:700,color:"#8FA3BE",textTransform:"uppercase",letterSpacing:0.8,marginBottom:4}}>Verification details</div>
            {fmt("Bank", ACCOUNT.bank)}
            {fmt("Account type", ACCOUNT.type)}
            {fmt("Account number", ACCOUNT.number)}
            {fmt("Branch code", ACCOUNT.branch)}
            {fmt("Account holder", ACCOUNT.holder)}
            {fmt("Name match", "✓ Matches DHA records", true)}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 0"}}>
              <span style={{fontSize:12,color:"#8FA3BE"}}>Verified by</span>
              <span style={{fontSize:11,fontWeight:600,color:"#00B8A9"}}>{ACCOUNT.source}</span>
            </div>
          </div>

          {/* Lock notice */}
          <div style={{background:"#F7F9FC",border:"1px solid #E2E9F0",borderRadius:14,padding:"13px 15px",marginBottom:16,fontSize:12,color:"#8FA3BE",lineHeight:1.7,display:"flex",gap:10}}>
            <span style={{fontSize:15,flexShrink:0}}>🔒</span>
            <div>For your protection, funds can <strong style={{color:"#0A1628"}}>only</strong> be disbursed into this verified account. This cannot be changed as it is linked to your verified identity via TruID.</div>
          </div>

          {/* Confirmed state */}
          {confirmed && (
            <div style={{background:"rgba(18,194,107,0.06)",border:"1px solid rgba(18,194,107,0.2)",borderRadius:12,padding:"12px 16px",fontSize:12,color:"#12C26B",display:"flex",gap:8,alignItems:"center"}} className="fade-up">
              ✓ Bank account confirmed · Proceeding to your offer
            </div>
          )}
        </div>
      </div>

      <div className="bottom-cta">
        {!confirmed
          ? <button className="btn btn-primary" onClick={() => setConfirmed(true)}>
              ✓ Confirm this account →
            </button>
          : <button className="btn btn-primary" onClick={() => go("offer")}>
              View my offer →
            </button>
        }
        <div style={{textAlign:"center",marginTop:10,fontSize:11,color:"#8FA3BE"}}>
          Disbursement account: Nedbank ••• ••• 2847
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 6 — OFFER
   Equity logic:
     homeValue        = R 1,850,000  (Lightstone AVM)
     bondOutstanding  = R 1,070,000  (current mortgage)
     equity           = homeValue − bondOutstanding
     maxLoan          = equity × 75%
   Eligible debts settled in priority order:
     1. Personal loans
     2. Credit cards
     3. Vehicle finance
   Only debts that fit within maxLoan are included.
───────────────────────────────────────────── */
function Offer({ go }) {
  const MULO_API = 'https://z30zl849k8.execute-api.af-south-1.amazonaws.com/prod/engine';
  const [engineResult, setEngineResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    fetch(MULO_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
      .then(r => r.json())
      .then(data => { setEngineResult(data); setLoading(false); })
      .catch(err => { setApiError(err.message); setLoading(false); });
  }, []);

  const loanAmount = engineResult?.offer?.loan_amount || 517500;
  const monthlyRepayment = engineResult?.offer?.monthly_repayment || 11316;
  const muloScore = engineResult?.offer?.mulo_score || 82;
  const rateAnnual = engineResult?.offer?.rate_annual || 11.25;
  const rateLabel = engineResult?.offer?.rate_label || 'Prime − 0.5%';
  const termMonths = engineResult?.offer?.term_months || 60;
  if (engineResult) {
    window._muloLoanAmount = engineResult?.offer?.loan_amount || 517500;
    window._muloRateAnnual = engineResult?.offer?.interest_rate || 11.25;
    window._muloRateLabel = engineResult?.offer?.rate_label || 'Prime';
    window._muloTermMonths = engineResult?.offer?.term_months || 60;
  }
  const monthlySaving = engineResult?.offer?.monthly_saving || 5987;
  const pdScore = engineResult?.gates?.gate4?.scores?.pd_score || 3.2;
  const HOME_VALUE      = 1_850_000;
  const BOND_BALANCE    = 1_070_000;
  const EQUITY          = HOME_VALUE - BOND_BALANCE;          // 780 000
  const MAX_LOAN        = Math.floor(EQUITY * 0.75);          // 585 000

  // Debts in settlement priority: personal loans → credit cards → vehicle finance
  // (store credit / other excluded per product rules)
  const ALL_DEBTS = [
    { name:"African Bank Personal Loan", type:"Personal loan",    cat:"personal", icon:"🏦", bg:"#EBF0FF", monthly:3_800, balance:125_000 },
    { name:"Nedbank Personal Loan",      type:"Personal loan",    cat:"personal", icon:"🏦", bg:"#EBF0FF", monthly:2_100, balance:68_000  },
    { name:"Capitec Credit Card",        type:"Credit card",      cat:"credit",   icon:"💳", bg:"#FFF0EB", monthly:1_450, balance:48_000  },
    { name:"FNB Credit Card",            type:"Credit card",      cat:"credit",   icon:"💳", bg:"#FFF0EB", monthly:980,   balance:31_500  },
    { name:"Wesbank Vehicle Finance",    type:"Vehicle finance",  cat:"vehicle",  icon:"🚗", bg:"#EBFFF5", monthly:5_200, balance:245_000 },
  ];
if (loading) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:16,padding:32}}>
      <div style={{fontSize:40}}>⚙️</div>
      <div style={{fontFamily:'Sora,sans-serif',fontWeight:700,fontSize:18,color:'#0A1628'}}>Calculating your offer...</div>
      <div style={{fontSize:13,color:'#8FA3BE',marginTop:4}}>Running Muḽo Engine</div>
    </div>
  );
  // Greedily include debts in priority order up to MAX_LOAN
  let running = 0;
  const settled = [];
  const excluded = [];
  for (const d of ALL_DEBTS) {
    if (running + d.balance <= MAX_LOAN) {
      running += d.balance;
      settled.push({ ...d, included: true });
    } else {
      excluded.push({ ...d, included: false, reason: "Exceeds available equity" });
    }
  }
  const LOAN_AMOUNT     = running;                            // 517 500
  const CURRENT_MONTHLY = settled.reduce((s,d) => s + d.monthly, 0);

  // Repayment: simple annuity at 11.25% p.a. over 60 months
  const r = 0.1125 / 12;
  const n = 60;
  const NEW_MONTHLY = Math.round(LOAN_AMOUNT * r * Math.pow(1+r,n) / (Math.pow(1+r,n)-1));
  const MONTHLY_SAVING  = CURRENT_MONTHLY - NEW_MONTHLY;
  const LTV_AFTER       = Math.round(((BOND_BALANCE + LOAN_AMOUNT) / HOME_VALUE) * 100);
  const EQUITY_USED_PCT = Math.round((LOAN_AMOUNT / EQUITY) * 100);

  const fmt = n => "R " + n.toLocaleString("en-ZA");

  // Equity bar segments (bond | loan | unused)
  const bondPct  = Math.round((BOND_BALANCE / HOME_VALUE) * 100);
  const loanPct  = Math.round((LOAN_AMOUNT  / HOME_VALUE) * 100);
  const freePct  = 100 - bondPct - loanPct;

  return (
    <div className="screen fade-in">
      <div className="screen-scroll">

        {/* ── HERO ── */}
        <div className="offer-hero">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
            <div className="mulo-logo" style={{color:"#fff"}}>Mu<span style={{color:"#00B8A9"}}>ḽ</span>o</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>Offer valid 48 hrs</div>
          </div>
          <div className="offer-eyebrow">PERSONALISED EQUITY OFFER</div>
          <div className="offer-name">{(window._muloFirstName && window._muloLastName ? window._muloFirstName + ' ' + window._muloLastName : 'Thabo Nkosi')} · 34 Jacaranda Ave, Kempton Park</div>

          {/* ── ML ENGINE SCORES ── */}
          {(() => {
            // ML Engine inputs (simulated from bureau data)
            const MULO_SCORE = 82;
            const PD = 3.2; // Probability of Default %
            const PD_BAND = PD < 5 ? "Very Low" : PD < 10 ? "Low" : PD < 15 ? "Medium" : "High";
            const PD_COLOR = PD < 5 ? "#12C26B" : PD < 10 ? "#00B8A9" : PD < 15 ? "#F4B942" : "#FF7043";

            // SHAP feature contributions (sum to 100%)
            const SHAP = [
              { label:"Credit score (TransUnion)", pct:34, direction:"positive", val:"Score 724" },
              { label:"LTV ratio post-loan",        pct:22, direction:"positive", val:"56% LTV" },
              { label:"Salary consistency",         pct:18, direction:"positive", val:"Regular deposits" },
              { label:"Affordability surplus",      pct:15, direction:"positive", val:"R4,200/mo" },
              { label:"Cash withdrawal ratio",      pct:7,  direction:"negative", val:"28% of income" },
              { label:"Months since last missed",   pct:4,  direction:"positive", val:"18 months" },
            ];

            return (
              <>
                {/* Dual score row */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>

                  {/* Muḽo Score */}
                  <div style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:16}}>
                    <div style={{fontSize:9,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:0.8,marginBottom:10}}>Muḽo Score</div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div className="score-ring-wrap">
                        <svg className="score-svg" viewBox="0 0 56 56">
                          <defs>
                            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#00B8A9"/>
                              <stop offset="100%" stopColor="#1A73E8"/>
                            </linearGradient>
                          </defs>
                          <circle className="score-track" cx="28" cy="28" r="22"/>
                          <circle className="score-fill" cx="28" cy="28" r="22"/>
                        </svg>
                        <div className="score-num">{MULO_SCORE}</div>
                      </div>
                      <div>
                        <div style={{fontSize:12,fontWeight:700,color:"#fff"}}>Excellent</div>
                        <div style={{fontSize:10,color:"rgba(255,255,255,0.45)",marginTop:2,lineHeight:1.4}}>Top 15%<br/>of applicants</div>
                      </div>
                    </div>
                  </div>

                  {/* PD Score */}
                  <div style={{background:"rgba(255,255,255,0.07)",border:`1px solid ${PD_COLOR}30`,borderRadius:16,padding:16}}>
                    <div style={{fontSize:9,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:0.8,marginBottom:10}}>Prob. of Default</div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      {/* PD gauge */}
                      <div style={{position:"relative",width:56,height:56,flexShrink:0}}>
                        <svg width="56" height="56" viewBox="0 0 56 56" style={{transform:"rotate(-90deg)"}}>
                          <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5"/>
                          <circle cx="28" cy="28" r="22" fill="none"
                            stroke={PD_COLOR} strokeWidth="5" strokeLinecap="round"
                            strokeDasharray={`${2*Math.PI*22}`}
                            strokeDashoffset={`${2*Math.PI*22 * (1 - PD/30)}`}
                          />
                        </svg>
                        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
                          <div style={{fontFamily:"'Sora',sans-serif",fontSize:13,fontWeight:800,color:PD_COLOR,lineHeight:1}}>{PD}%</div>
                        </div>
                      </div>
                      <div>
                        <div style={{fontSize:12,fontWeight:700,color:PD_COLOR}}>{PD_BAND} Risk</div>
                        <div style={{fontSize:10,color:"rgba(255,255,255,0.45)",marginTop:2,lineHeight:1.4}}>XGBoost ML<br/>model · v1.0</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SHAP Explainability */}
                <div style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:14,marginBottom:16}}>
                  <div style={{fontSize:9,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:0.8,marginBottom:12}}>
                    Why this decision — SHAP feature contributions
                  </div>
                  {SHAP.map((f,i) => (
                    <div key={i} style={{marginBottom:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                        <div style={{fontSize:10,color:"rgba(255,255,255,0.6)"}}>{f.label}</div>
                        <div style={{fontSize:10,fontWeight:600,color:f.direction==="positive"?"#12C26B":"#FF7043"}}>{f.direction==="positive"?"▲":"▼"} {f.val}</div>
                      </div>
                      <div style={{height:4,background:"rgba(255,255,255,0.06)",borderRadius:99,overflow:"hidden"}}>
                        <div style={{
                          height:"100%",
                          width:`${f.pct}%`,
                          background:f.direction==="positive"
                            ? "linear-gradient(90deg,#00B8A9,#12C26B)"
                            : "linear-gradient(90deg,#FF7043,#FF8A65)",
                          borderRadius:99,
                          transition:"width 1s ease",
                        }}/>
                      </div>
                    </div>
                  ))}
                  <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",marginTop:10,lineHeight:1.6}}>
                    Powered by Amazon SageMaker · XGBoost · SHAP explainability · NCA compliant
                  </div>
                </div>
              </>
            );
          })()}

          <div className="offer-amount-label">APPROVED EQUITY LOAN</div>
          <div className="offer-amount"><span>R</span> {LOAN_AMOUNT.toLocaleString("en-ZA")}</div>
          <div className="offer-rate-line">{rateLabel || "Prime"} · {rateAnnual}% p.a. · {termMonths} months</div>

          <div className="offer-pills">
            <div className="offer-pill highlight">
              <div className="offer-pill-label">New monthly repayment</div>
              <div className="offer-pill-val">{fmt(NEW_MONTHLY)}</div>
              <div className="offer-pill-sub">single consolidated payment</div>
            </div>
            <div className="offer-pill">
              <div className="offer-pill-label">Monthly saving</div>
              <div className="offer-pill-val" style={{color:"#12C26B"}}>{fmt(MONTHLY_SAVING)}</div>
              <div className="offer-pill-sub">{Math.round(MONTHLY_SAVING/CURRENT_MONTHLY*100)}% less per month</div>
            </div>
            <div className="offer-pill">
              <div className="offer-pill-label">Interest rate</div>
              <div className="offer-pill-val">11.25%</div>
              <div className="offer-pill-sub">p.a. fixed · 5 yrs</div>
            </div>
            <div className="offer-pill">
              <div className="offer-pill-label">LTV after loan</div>
              <div className="offer-pill-val">{LTV_AFTER}%</div>
              <div className="offer-pill-sub">within 75% equity cap</div>
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="offer-body">

          {/* ── PROPERTY & EQUITY BREAKDOWN ── */}
          <div style={{background:"#fff",borderRadius:18,padding:18,boxShadow:"0 2px 12px rgba(0,0,0,0.05)",marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
              <div style={{width:32,height:32,borderRadius:10,background:"#EBF8F5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🏡</div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:"#0A1628"}}>Property & equity breakdown</div>
                <div style={{fontSize:11,color:"#8FA3BE"}}>Source: Lightstone AVM · Apr 2026</div>
              </div>
            </div>

            {/* three key numbers */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
              {[
                { label:"Home value",     val:fmt(HOME_VALUE),   sub:"Lightstone AVM", color:"#0A1628", bg:"#F7F9FC" },
                { label:"Bond owed",      val:fmt(BOND_BALANCE), sub:"Current mortgage", color:"#FF7043", bg:"#FFF5F2" },
                { label:"Your equity",    val:fmt(EQUITY),       sub:"Value minus bond", color:"#12C26B", bg:"#F0FFF8" },
              ].map(c => (
                <div key={c.label} style={{background:c.bg,borderRadius:12,padding:"12px 10px",textAlign:"center"}}>
                  <div style={{fontFamily:"'Sora',sans-serif",fontSize:13,fontWeight:800,color:c.color,lineHeight:1.2,marginBottom:4}}>
                    {c.val}
                  </div>
                  <div style={{fontSize:10,fontWeight:700,color:"#0A1628",marginBottom:2}}>{c.label}</div>
                  <div style={{fontSize:9,color:"#8FA3BE"}}>{c.sub}</div>
                </div>
              ))}
            </div>

            {/* stacked equity bar */}
            <div style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#8FA3BE",marginBottom:6}}>
                <span>Equity utilisation</span>
                <span style={{fontWeight:600,color:"#0A1628"}}>{EQUITY_USED_PCT}% of equity used</span>
              </div>
              <div style={{height:14,borderRadius:99,overflow:"hidden",display:"flex",background:"#F0F4F8"}}>
                <div style={{width:`${bondPct}%`,background:"#CBD5E0",transition:"width .8s"}} title="Bond balance"/>
                <div style={{width:`${loanPct}%`,background:"linear-gradient(90deg,#00B8A9,#1A73E8)",transition:"width .8s"}} title="Muḽo loan"/>
                <div style={{flex:1,background:"rgba(18,194,107,0.15)"}} title="Remaining equity"/>
              </div>
              <div style={{display:"flex",gap:16,marginTop:8,fontSize:10}}>
                {[
                  {c:"#CBD5E0", l:`Bond (${bondPct}%)`},
                  {c:"#00B8A9", l:`Muḽo loan (${loanPct}%)`},
                  {c:"rgba(18,194,107,0.4)", l:`Free equity (${freePct}%)`},
                ].map(x=>(
                  <div key={x.l} style={{display:"flex",alignItems:"center",gap:4,color:"#8FA3BE"}}>
                    <div style={{width:8,height:8,borderRadius:2,background:x.c,flexShrink:0}}/>
                    {x.l}
                  </div>
                ))}
              </div>
            </div>

            {/* 75% rule callout */}
            <div style={{background:"rgba(0,184,169,0.06)",border:"1px solid rgba(0,184,169,0.18)",borderRadius:12,padding:"10px 14px",fontSize:12,color:"#0A1628",display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{fontSize:16,flexShrink:0}}>📐</span>
              <div>
                <strong>75% equity rule applied</strong>
                <div style={{color:"#8FA3BE",marginTop:2,lineHeight:1.5}}>
                  Max loan = {fmt(EQUITY)} × 75% = <strong style={{color:"#00B8A9"}}>{fmt(MAX_LOAN)}</strong>. 
                  Your approved amount of <strong style={{color:"#0A1628"}}>{fmt(LOAN_AMOUNT)}</strong> is within this limit.
                </div>
              </div>
            </div>
          </div>

          {/* ── MONTHLY COMPARISON ── */}
          <div className="savings-card" style={{marginBottom:14}}>
            <div className="savings-title">Monthly payment comparison</div>
            {[
              { key:"current", label:"Current combined payments", val:fmt(CURRENT_MONTHLY), pct:100, color:"#FF7043" },
              { key:"new",     label:"New Muḽo repayment",         val:fmt(NEW_MONTHLY),     pct:Math.round(NEW_MONTHLY/CURRENT_MONTHLY*100), color:"#00B8A9" },
            ].map(r => (
              <div className="savings-bar-wrap" key={r.key}>
                <div className="savings-bar-label">
                  <span className={`savings-bar-key ${r.key}`}>{r.label}</span>
                  <span className="savings-bar-val">{r.val}</span>
                </div>
                <div className="bar-track"><div className="bar-fill" style={{"--c":r.color,width:`${r.pct}%`}}/></div>
              </div>
            ))}
            <div className="savings-delta">
              💚 &nbsp;Save {fmt(MONTHLY_SAVING)}/month · {fmt(MONTHLY_SAVING * 60)} over 5 years
            </div>
          </div>

          {/* ── DEBTS TO BE SETTLED ── */}
          <div style={{background:"#fff",borderRadius:18,padding:18,boxShadow:"0 2px 12px rgba(0,0,0,0.05)",marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
              <div style={{fontSize:12,fontWeight:700,color:"#8FA3BE",textTransform:"uppercase",letterSpacing:0.8}}>Debts to be settled</div>
              <div style={{fontSize:11,fontWeight:600,color:"#00B8A9"}}>{settled.length} accounts</div>
            </div>
            <div style={{fontSize:11,color:"#8FA3BE",marginBottom:14,lineHeight:1.5}}>
              Settled in priority order: personal loans → credit cards → vehicle finance
            </div>

            {/* priority group labels */}
            {["personal","credit","vehicle"].map(cat => {
              const group = settled.filter(d => d.cat === cat);
              if(!group.length) return null;
              const labels = {personal:"1. Personal Loans", credit:"2. Credit Cards", vehicle:"3. Vehicle Finance"};
              const icons  = {personal:"🏦", credit:"💳", vehicle:"🚗"};
              const colors = {personal:"#EBF0FF", credit:"#FFF0EB", vehicle:"#EBFFF5"};
              return (
                <div key={cat} style={{marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                    <div style={{width:6,height:6,borderRadius:50,background:"#00B8A9"}}/>
                    <div style={{fontSize:11,fontWeight:700,color:"#0A1628",textTransform:"uppercase",letterSpacing:0.5}}>{labels[cat]}</div>
                  </div>
                  {group.map(d => (
                    <div key={d.name} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid #F7F9FC"}}>
                      <div style={{width:34,height:34,borderRadius:10,background:d.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{d.icon}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:500,color:"#0A1628"}}>{d.name}</div>
                        <div style={{fontSize:11,color:"#8FA3BE",marginTop:1}}>{fmt(d.monthly)}/mo · Outstanding: {fmt(d.balance)}</div>
                      </div>
                      <div style={{textAlign:"right",flexShrink:0}}>
                        <div style={{fontFamily:"'Sora',sans-serif",fontSize:13,fontWeight:700,color:"#0A1628"}}>{fmt(d.balance)}</div>
                        <div style={{fontSize:10,color:"#12C26B",fontWeight:600,marginTop:2}}>✓ Settled</div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}

            {/* total row */}
            <div style={{display:"flex",justifyContent:"space-between",padding:"12px 0 0",borderTop:"2px solid #F0F4F8",marginTop:4}}>
              <div style={{fontSize:13,fontWeight:700,color:"#0A1628"}}>Total settled</div>
              <div style={{fontFamily:"'Sora',sans-serif",fontSize:15,fontWeight:800,color:"#0A1628"}}>{fmt(LOAN_AMOUNT)}</div>
            </div>
          </div>

          {/* ── EXCLUDED DEBTS (if any) ── */}
          {excluded.length > 0 && (
            <div style={{background:"#FFF8F5",border:"1px solid rgba(255,112,67,0.2)",borderRadius:16,padding:16,marginBottom:14}}>
              <div style={{fontSize:12,fontWeight:700,color:"#FF7043",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                <span>⚠️</span> Not included — equity cap reached
              </div>
              {excluded.map(d => (
                <div key={d.name} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid rgba(255,112,67,0.08)"}}>
                  <div style={{width:30,height:30,borderRadius:9,background:"rgba(255,112,67,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{d.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:500,color:"#0A1628"}}>{d.name}</div>
                    <div style={{fontSize:11,color:"#8FA3BE"}}>{fmt(d.balance)} · {d.reason}</div>
                  </div>
                </div>
              ))}
              <div style={{fontSize:11,color:"#8FA3BE",marginTop:10,lineHeight:1.6}}>
                These debts were not included as they would exceed your 75% equity limit of {fmt(MAX_LOAN)}.
              </div>
            </div>
          )}

        </div>
      </div>
      <div className="bottom-cta">
        <button className="btn btn-primary" onClick={() => go("doc-upload")}>Accept offer & upload documents →</button>
        <div style={{textAlign:"center",marginTop:10,fontSize:11,color:"#8FA3BE"}}>No obligation · Rate locked for 48 hours</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 7 — DOCUMENT UPLOAD
   Required before loan agreement
───────────────────────────────────────────── */
function DocUpload({ go }) {
  const [payslip, setPayslip] = useState(null);
  const [address, setAddress] = useState(null);
  const [submitting, setSubmitting] = useState(false);

const uploadFile = async (file, docType, setter) => {
    if (!file) return;
    try {
      const res = await fetch(API + '/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_number: window._muloIdNumber || 'demo', doc_type: docType, file_name: file.name, content_type: file.type })
      });
      const data = await res.json();
      await fetch(data.upload_url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      setter({ name: file.name, size: Math.round(file.size/1024) + ' KB' });
    } catch(err) { console.error('Upload failed', err); }
  };

  const ready = payslip && address;

  const submit = () => {
    setSubmitting(true);
    setTimeout(() => go("loan-sign"), 1200);
  };

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <div className="back-btn" onClick={() => go("offer")}>←</div>
        <div className="screen-header-text">
          <div className="screen-header-title">Supporting documents</div>
          <div className="screen-header-sub">Required before signing</div>
        </div>
      </div>
      <div className="progress-track"><div className="progress-fill" style={{width:"78%"}} /></div>

      <div className="screen-scroll">
        <div style={{padding:"4px 24px 20px"}}>

          <div style={{background:"rgba(0,184,169,0.06)",border:"1px solid rgba(0,184,169,0.18)",borderRadius:14,padding:"12px 14px",marginBottom:20,fontSize:12,color:"#0A1628",lineHeight:1.6,display:"flex",gap:10}}>
            <span style={{fontSize:16,flexShrink:0}}>📋</span>
            <div>We need to verify your income and address before we can prepare your loan agreement. Documents are reviewed within <strong>30 minutes</strong>.</div>
          </div>

          {/* Payslip */}
          <div style={{marginBottom:20}}>
            <div className="doc-section-title"><span/>Latest payslip</div>
            <div className="doc-rule-box" style={{marginBottom:10}}>
              {[
                "Must be your most recent payslip",
                "Must show your full name, employer name and net pay",
                "PDF, JPG or PNG · Max 10MB",
              ].map(r => <div className="doc-rule-item" key={r}><span style={{color:"#F4B942",flexShrink:0}}>•</span>{r}</div>)}
            </div>
            {!payslip ? (
              <div className="doc-upload-zone" onClick={() => { const i = document.createElement('input'); i.type='file'; i.accept='.pdf,.jpg,.jpeg,.png'; i.onchange=e=>uploadFile(e.target.files[0],'payslip',setPayslip); i.click(); }}>
                <div className="doc-upload-icon">📄</div>
                <div className="doc-upload-label">Tap to upload payslip</div>
                <div className="doc-upload-hint">or drag & drop · PDF, JPG, PNG</div>
              </div>
            ) : (
              <div className="doc-uploaded-pill fade-up">
                <div className="doc-uploaded-icon">📄</div>
                <div>
                  <div className="doc-uploaded-name">{payslip.name}</div>
                  <div className="doc-uploaded-size">{payslip.size} · Uploaded</div>
                </div>
                <div className="doc-uploaded-check">✓</div>
              </div>
            )}
          </div>

          {/* Proof of address */}
          <div style={{marginBottom:20}}>
            <div className="doc-section-title"><span/>Proof of address</div>
            <div className="doc-rule-box" style={{marginBottom:10}}>
              {[
                "Not older than 3 months",
                "Accepted: utility bill, bank statement, or lease agreement",
                "Must show your full name and physical address",
                "PDF, JPG or PNG · Max 10MB",
              ].map(r => <div className="doc-rule-item" key={r}><span style={{color:"#F4B942",flexShrink:0}}>•</span>{r}</div>)}
            </div>
            {!address ? (
              <div className="doc-upload-zone" onClick={() => { const i = document.createElement('input'); i.type='file'; i.accept='.pdf,.jpg,.jpeg,.png'; i.onchange=e=>uploadFile(e.target.files[0],'proof_of_address',setAddress); i.click(); }}>
                <div className="doc-upload-icon">🏠</div>
                <div className="doc-upload-label">Tap to upload proof of address</div>
                <div className="doc-upload-hint">Utility bill · Bank statement · Lease</div>
              </div>
            ) : (
              <div className="doc-uploaded-pill fade-up">
                <div className="doc-uploaded-icon">🏠</div>
                <div>
                  <div className="doc-uploaded-name">{address.name}</div>
                  <div className="doc-uploaded-size">{address.size} · Uploaded</div>
                </div>
                <div className="doc-uploaded-check">✓</div>
              </div>
            )}
          </div>

          <div style={{background:"#F7F9FC",border:"1px solid #E2E9F0",borderRadius:14,padding:13,fontSize:11,color:"#8FA3BE",lineHeight:1.7}}>
            🔒 Documents are encrypted end-to-end and reviewed only by authorised Muḽo compliance staff. They are never sold or shared.
          </div>
        </div>
      </div>

      <div className="bottom-cta">
        <button className="btn btn-primary"
          style={{opacity: ready ? 1 : 0.4}}
          disabled={!ready || submitting}
          onClick={submit}>
          {submitting ? "⟳  Uploading…" : ready ? "Submit & review loan agreement →" : "Upload both documents to continue"}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 8 — LOAN AGREEMENT E-SIGN
───────────────────────────────────────────── */
function LoanSign({ go }) {
  const loanAmount = window._muloLoanAmount || 517500;
  const rateAnnual = window._muloRateAnnual || 11.25;
  const rateLabel = window._muloRateLabel || 'Prime';
  const termMonths = window._muloTermMonths || 60;
  const [signed, setSigned] = useState(false);
  const [initialled, setInitialled] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const bodyRef = useRef(null);

  const handleScroll = (e) => {
    const el = e.target;
    if(el.scrollTop + el.clientHeight >= el.scrollHeight - 20) setScrolled(true);
  };

  const ready = scrolled && initialled && signed;

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <div className="back-btn" onClick={() => go("doc-upload")}>←</div>
        <div className="screen-header-text">
          <div className="screen-header-title">Loan agreement</div>
          <div className="screen-header-sub">Read, initial & sign</div>
        </div>
      </div>
      <div className="progress-track"><div className="progress-fill" style={{width:"86%"}} /></div>

      <div className="screen-scroll" onScroll={handleScroll} ref={bodyRef}>
        <div style={{padding:"8px 16px 20px"}}>

          {/* Document */}
          <div className="esign-doc-wrap">
            <div className="esign-doc-header">
              <div className="esign-doc-icon">📜</div>
              <div>
                <div className="esign-doc-title">Equity Loan Agreement</div>
                <div className="esign-doc-sub">Muḽo (Pty) Ltd · NCR Reg. NCRCP0000 · REF-2026-48291</div>
              </div>
            </div>
            <div className="esign-doc-body">
              <div className="esign-clause">
                <strong>1. Parties</strong><br/>
                This agreement is entered into between <strong>Muḽo (Pty) Ltd</strong> ("the Lender") and <strong>{(window._muloFirstName && window._muloLastName ? window._muloFirstName + ' ' + window._muloLastName : 'Thabo Nkosi')}</strong>, ID 800101 5009 087 ("the Borrower") on 11 April 2026.
              </div>
              <div className="esign-clause">
                <strong>2. Loan amount &amp; purpose</strong><br/>
                The Lender agrees to advance <strong>R517,500</strong> to the Borrower solely for the purpose of settling the listed unsecured debts as specified in Schedule A.
              </div>
              <div className="esign-highlight">
                <strong>Key terms at a glance</strong>
                {[
                  ["Loan amount",`R ${(loanAmount||517500).toLocaleString("en-ZA")}`],["Interest rate",`${rateAnnual||11.25}% p.a.`],["Term",`${termMonths||60} months`],
                  ["Monthly instalment","R 7,543"],["Total repayable","R 452,580"],["Initiation fee","R 1,207.50"],
                  ["Monthly service fee","R 69.00"],["First payment due","11 May 2026"],
                ].map(([l,v]) => (
                  <div className="esign-field-row" key={l}>
                    <span className="esign-field-label">{l}</span>
                    <span className="esign-field-val">{v}</span>
                  </div>
                ))}
              </div>
              <div className="esign-clause">
                <strong>3. Security</strong><br/>
                The loan is secured by a mortgage bond registered over the property at <strong>34 Jacaranda Avenue, Kempton Park, Gauteng (Erf 4821)</strong>. The Borrower consents to the registration of a second bond.
              </div>
              <div className="esign-clause">
                <strong>4. Repayment</strong><br/>
                The Borrower authorises a monthly debit order of <strong>R7,543</strong> against account held at <strong>Nedbank</strong> (acc. ending 2847) on the 1st of each month, commencing 11 May 2026.
              </div>
              <div className="esign-clause">
                <strong>5. NCA disclosure</strong><br/>
                This agreement is governed by the National Credit Act 34 of 2005. The Borrower has the right to request a pre-agreement statement, and to cancel within 5 business days without penalty.
              </div>
              <div className="esign-clause">
                <strong>6. Default</strong><br/>
                If the Borrower fails to make 2 consecutive payments, the Lender may call up the full outstanding balance and enforce the mortgage bond, subject to NCA debt enforcement procedures.
              </div>

              {/* Initials */}
              <div style={{marginBottom:14}}>
                <div className="sig-section-label" style={{fontSize:11,fontWeight:700,color:"#8FA3BE",textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>Borrower initials (page 1 of 2)</div>
                <div className={`signature-pad ${initialled?"signed":""}`} onClick={() => setInitialled(true)}>
                  {initialled
                    ? <><span className="sig-rendered">T.N.</span><span className="sig-verified-badge">✓ Initialled</span><span className="sig-date-stamp">11 Apr 2026 · 11:44</span></>
                    : <div className="sig-placeholder"><span style={{fontSize:20}}>✍️</span>Tap to initial here</div>
                  }
                </div>
              </div>
            </div>

            {/* Signature section */}
            <div className="sig-section">
              <div className="sig-section-label">Your signature</div>
              <div style={{fontSize:12,color:"#8FA3BE",marginBottom:10,lineHeight:1.6}}>
                By signing, you confirm you have read and understood this agreement and consent to be bound by its terms. This constitutes a valid electronic signature under ECTA 25 of 2002.
              </div>
              <div className={`signature-pad ${signed?"signed":""}`} onClick={() => signed ? null : setScrolled(true) && setSigned(true) || setSigned(true)}>
                {signed
                  ? <><span className="sig-rendered">{(window._muloFirstName && window._muloLastName ? window._muloFirstName + ' ' + window._muloLastName : 'Thabo Nkosi')}</span><span className="sig-verified-badge">✓ Signed</span><span className="sig-date-stamp">11 Apr 2026 · 11:45 · IP 41.13.xxx.xxx</span></>
                  : <div className="sig-placeholder"><span style={{fontSize:20}}>✍️</span><span>Tap to sign</span>{!scrolled&&<span style={{fontSize:10,color:"#FF7043"}}>Scroll to read full agreement first</span>}</div>
                }
              </div>
              {signed && (
                <div style={{background:"rgba(18,194,107,0.06)",border:"1px solid rgba(18,194,107,0.2)",borderRadius:10,padding:"10px 14px",marginTop:10,fontSize:12,color:"#12C26B",display:"flex",gap:8,alignItems:"center"}} className="fade-up">
                  ✓ Signature captured · ECTA compliant · Timestamped & hashed
                </div>
              )}
            </div>
          </div>

          <div style={{background:"#F7F9FC",border:"1px solid #E2E9F0",borderRadius:14,padding:13,fontSize:11,color:"#8FA3BE",lineHeight:1.7,marginBottom:8}}>
            📨 A signed copy will be sent to your WhatsApp and email immediately after signing.
          </div>
        </div>
      </div>

      <div className="bottom-cta">
        <button className="btn btn-primary"
          style={{opacity: ready ? 1 : 0.4}}
          disabled={!ready}
          onClick={() => go("conveyancing")}>
          {!scrolled ? "Scroll to read the agreement" : !initialled ? "Initial page 1 to continue" : !signed ? "Sign the agreement to continue" : "Proceed to conveyancing →"}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 9 — CONVEYANCING E-SIGN
───────────────────────────────────────────── */
function Conveyancing({ go }) {
  const [step, setStep] = useState(0); // 0=intro 1=read 2=sign 3=done
  const [signed, setSigned] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const conveySteps = [
    { icon:"✅", label:"Loan agreement signed", sub:"11 Apr 2026 · ECTA compliant", status:"done" },
    { icon:"⚖️", label:"Conveyancing mandate issued", sub:"Muḽo Attorneys — Reg. 2021/003847", status: step >= 1 ? "done" : "active" },
    { icon:"📝", label:"Bond registration consent", sub:"Sign consent for 2nd bond on Title Deed", status: step >= 2 ? (signed ? "done" : "active") : "future" },
    { icon:"🏛️", label:"Deeds Office submission", sub:"Est. 3–5 business days", status: signed ? "active" : "future" },
    { icon:"🎉", label:"Bond registered & funds released", sub:"Est. Apr 18, 2026", status:"future" },
  ];

  return (
    <div className="screen fade-in">
      <div className="screen-scroll">
        {/* Hero */}
        <div className="convey-hero">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,position:"relative",zIndex:1}}>
            <div className="mulo-logo" style={{color:"#fff"}}>Mu<span style={{color:"#00B8A9"}}>ḽ</span>o</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.45)"}}>Digital Conveyancing</div>
          </div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.45)",textTransform:"uppercase",letterSpacing:1,marginBottom:6,position:"relative",zIndex:1}}>e-Conveyancing · Fully remote</div>
          <div style={{fontFamily:"'Sora',sans-serif",fontSize:22,fontWeight:800,color:"#fff",letterSpacing:-.5,lineHeight:1.2,marginBottom:8,position:"relative",zIndex:1}}>
            No visit to a<br/>conveyancer needed
          </div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",lineHeight:1.7,position:"relative",zIndex:1}}>
            Muḽo Attorneys handle registration digitally. Your e-signature is legally valid under the Deeds Registries Act and ECTA 25 of 2002.
          </div>
        </div>

        <div style={{padding:"20px 16px"}}>

          {/* Progress */}
          <div style={{background:"#fff",borderRadius:18,padding:18,boxShadow:"0 2px 12px rgba(0,0,0,0.05)",marginBottom:14}}>
            <div style={{fontSize:12,fontWeight:700,color:"#8FA3BE",textTransform:"uppercase",letterSpacing:0.8,marginBottom:16}}>Conveyancing progress</div>
            <div className="convey-step-wrap">
              {conveySteps.map((s,i) => (
                <div className="convey-step" key={i}>
                  <div className={`convey-dot ${s.status}`}>{s.icon}</div>
                  <div className="convey-content">
                    <div className={`convey-title ${s.status==="future"?"muted":""}`}>{s.label}</div>
                    <div className="convey-sub">{s.sub}</div>
                    <div className={`convey-badge ${s.status}`}>
                      {s.status==="done"?"✓ Complete":s.status==="active"?"● In progress":"○ Pending"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bond consent e-sign */}
          {!signed ? (
            <div className="esign-doc-wrap" style={{marginBottom:14}}>
              <div className="esign-doc-header">
                <div className="esign-doc-icon">🏠</div>
                <div>
                  <div className="esign-doc-title">Bond Registration Consent</div>
                  <div className="esign-doc-sub">2nd Mortgage Bond · Erf 4821 Kempton Park</div>
                </div>
              </div>
              <div className="esign-doc-body">
                <div className="esign-clause">
                  <strong>Property:</strong> Erf 4821, 34 Jacaranda Avenue, Kempton Park Ext 2, Gauteng<br/>
                  <strong>Title Deed:</strong> T 48291/2019 · Registered owner: {(window._muloFirstName && window._muloLastName ? window._muloFirstName + ' ' + window._muloLastName : 'Thabo Nkosi')}
                </div>
                <div className="esign-clause">
                  <strong>Consent:</strong> I, <strong>{(window._muloFirstName && window._muloLastName ? window._muloFirstName + ' ' + window._muloLastName : 'Thabo Nkosi')}</strong>, hereby consent to the registration of a second mortgage bond over the above property in favour of <strong>Muḽo (Pty) Ltd</strong> for the sum of <strong>R517,500</strong>, as security for the equity loan advanced under agreement REF-2026-48291.
                </div>
                <div className="esign-highlight">
                  ⚖️ <strong>Your rights:</strong> You have 5 business days to cancel this consent without penalty. The bond will be registered at the Deeds Office and reflected on your title deed. You retain full ownership of the property.
                </div>
                <div className="esign-clause">
                  I confirm that I am the sole registered owner of this property, that no insolvency proceedings are pending against me, and that I have the legal capacity to encumber this property.
                </div>
                <div className="esign-clause" style={{borderBottom:"none",marginBottom:0,paddingBottom:0}}>
                  <strong>Witnessed by:</strong> Muḽo Attorneys, a firm of conveyancers registered with the Law Society of South Africa. This document is electronically witnessed and notarised in terms of ECTA.
                </div>
              </div>
              <div className="sig-section">
                <div className="sig-section-label">Sign bond consent</div>
                <div style={{fontSize:12,color:"#8FA3BE",marginBottom:10,lineHeight:1.6}}>
                  This e-signature is legally equivalent to a wet ink signature for conveyancing purposes under the Deeds Registries Act 47 of 1937 as amended.
                </div>
                <div className={`signature-pad ${signed?"signed":""}`} onClick={() => setSigned(true)}>
                  {signed
                    ? <><span className="sig-rendered">{(window._muloFirstName && window._muloLastName ? window._muloFirstName + ' ' + window._muloLastName : 'Thabo Nkosi')}</span><span className="sig-verified-badge">✓ Signed</span><span className="sig-date-stamp">11 Apr 2026 · 11:52</span></>
                    : <div className="sig-placeholder"><span style={{fontSize:20}}>✍️</span><span>Tap to sign conveyancing consent</span></div>
                  }
                </div>
              </div>
            </div>
          ) : (
            <div style={{background:"rgba(18,194,107,0.06)",border:"1px solid rgba(18,194,107,0.25)",borderRadius:16,padding:18,marginBottom:14}} className="fade-up">
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                <div style={{width:36,height:36,borderRadius:12,background:"rgba(18,194,107,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>✅</div>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:"#0A1628"}}>Conveyancing consent signed</div>
                  <div style={{fontSize:11,color:"#8FA3BE"}}>11 Apr 2026 · ECTA compliant · Timestamped</div>
                </div>
              </div>
              <div style={{fontSize:12,color:"#8FA3BE",lineHeight:1.7}}>
                Your signed consent has been submitted to <strong style={{color:"#0A1628"}}>Muḽo Attorneys</strong>. They will lodge the bond at the Deeds Office. You will receive a WhatsApp update at each stage.
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:14}}>
                {[
                  {i:"💬",t:"WhatsApp updates at every stage"},
                  {i:"📱",t:"Track progress in your dashboard"},
                  {i:"📬",t:"Title deed copy sent when registered"},
                ].map(x=>(
                  <div key={x.t} style={{display:"flex",alignItems:"center",gap:10,fontSize:12,color:"#0A1628"}}>
                    <span style={{fontSize:16}}>{x.i}</span>{x.t}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{background:"#F7F9FC",border:"1px solid #E2E9F0",borderRadius:14,padding:13,fontSize:11,color:"#8FA3BE",lineHeight:1.7,marginBottom:8}}>
            💡 <strong style={{color:"#0A1628"}}>No physical visit required.</strong> Muḽo's digital conveyancing process eliminates the need to visit a conveyancer's office. Everything is handled remotely and all documents are stored securely in your Muḽo account.
          </div>
        </div>
      </div>

      <div className="bottom-cta">
        {!signed
          ? <button className="btn btn-primary" style={{opacity:.4}} disabled>Sign consent above to continue</button>
          : <button className="btn btn-primary" onClick={() => go("settlement")}>View settlement plan →</button>
        }
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 10 — SETTLEMENT
───────────────────────────────────────────── */
function Settlement({ go }) {
  const [confirmed, setConfirmed] = useState(false);

  const creditors = [
    { name:"African Bank Personal Loan", type:"Personal loan",   icon:"🏦", bg:"#EBF0FF", amt:"R125,000" },
    { name:"Nedbank Personal Loan",      type:"Personal loan",   icon:"🏦", bg:"#EBF0FF", amt:"R68,000"  },
    { name:"Capitec Credit Card",        type:"Credit card",     icon:"💳", bg:"#FFF0EB", amt:"R48,000"  },
    { name:"FNB Credit Card",            type:"Credit card",     icon:"💳", bg:"#FFF0EB", amt:"R31,500"  },
    { name:"Wesbank Vehicle Finance",    type:"Vehicle finance",  icon:"🚗", bg:"#EBFFF5", amt:"R245,000" },
  ];
  const steps = [
    { icon:"✅", label:"Application approved",         date:"Apr 11, 2026", status:"done" },
    { icon:"📄", label:"Documents verified",           date:"Apr 11, 2026", status:"done" },
    { icon:"✍️", label:"Loan agreement e-signed",     date:"Apr 11, 2026", status:"done" },
    { icon:"⚖️", label:"Conveyancing e-signed",       date:"Apr 11, 2026", status:"done" },
    { icon:"🏛️", label:"Bond lodged at Deeds Office", date:"Est. Apr 12–14", status:"active" },
    { icon:"💸", label:"Funds disbursed to creditors", date:"Est. Apr 15–16", status:"future" },
    { icon:"📬", label:"Settlement letters issued",    date:"Est. Apr 17", status:"future" },
    { icon:"🎉", label:"All accounts settled",         date:"Est. Apr 18", status:"future" },
  ];

  return (
    <div className="screen fade-in">
      <div className="screen-scroll">
        <div className="settlement-hero">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
            <div className="mulo-logo" style={{color:"#fff"}}>Mu<span style={{color:"#00B8A9"}}>ḽ</span>o</div>
            <div style={{background:"rgba(18,194,107,0.15)",border:"1px solid rgba(18,194,107,0.3)",padding:"5px 10px",borderRadius:99,fontSize:11,fontWeight:600,color:"#12C26B",display:"flex",alignItems:"center",gap:5}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:"#12C26B"}}/>All signed
            </div>
          </div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.45)",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Total to be settled</div>
          <div className="settle-amount">R 517,500</div>
          <div className="settle-sub">Paid directly to 5 creditors · Est. 7 business days</div>
        </div>

        <div style={{padding:"20px 16px"}}>
          <div style={{fontSize:12,fontWeight:700,color:"#8FA3BE",textTransform:"uppercase",letterSpacing:0.8,marginBottom:12}}>Payment breakdown</div>
          {creditors.map(c => (
            <div className="creditor-card" key={c.name}>
              <div className="creditor-icon" style={{background:c.bg}}>{c.icon}</div>
              <div><div className="creditor-name">{c.name}</div><div className="creditor-type">{c.type}</div></div>
              <div style={{marginLeft:"auto",textAlign:"right"}}>
                <div className="creditor-amount">{c.amt}</div>
                <div className="creditor-status">Queued ✓</div>
              </div>
            </div>
          ))}

          <div style={{background:"#fff",borderRadius:18,padding:18,boxShadow:"0 2px 12px rgba(0,0,0,0.05)",marginTop:12}}>
            <div style={{fontSize:12,fontWeight:700,color:"#8FA3BE",textTransform:"uppercase",letterSpacing:0.8,marginBottom:16}}>Full process timeline</div>
            <div className="timeline-steps">
              {steps.map((s,i) => (
                <div className="t-step" key={i}>
                  <div className={`t-dot ${s.status}`}>{s.icon}</div>
                  <div><div className="t-label" style={{color:s.status==="future"?"#C5D0DC":"#0A1628"}}>{s.label}</div><div className="t-date">{s.date}</div></div>
                </div>
              ))}
            </div>
          </div>

          <div style={{background:"rgba(37,211,102,0.06)",border:"1px solid rgba(37,211,102,0.2)",borderRadius:16,padding:16,marginTop:12,fontSize:12,color:"#0A1628",lineHeight:1.7,display:"flex",gap:10}}>
            <span style={{fontSize:18,flexShrink:0}}>💬</span>
            <div>You will receive <strong>WhatsApp updates</strong> at every stage. Your single Muḽo repayment of <strong style={{color:"#00B8A9"}}>R7,543/month</strong> starts 1 month after funds are disbursed.</div>
          </div>
        </div>
      </div>
      <div className="bottom-cta">
        {!confirmed
          ? <button className="btn btn-primary" onClick={() => setConfirmed(true)}>Confirm settlement plan →</button>
          : <button className="btn btn-primary" onClick={() => go("disbursement")}>Manage tranche disbursement →</button>
        }
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 11 — TRANCHE DISBURSEMENT MANAGER
   Logic:
   - 5 debts settled in priority order
   - Each tranche: release funds → client settles
     → uploads proof → bureau check → unlock next
───────────────────────────────────────────── */
const TRANCHES = [
  { id:0, creditor:"African Bank",  type:"Personal loan",   icon:"🏦", bg:"#EBF0FF", amount:125_000, cat:"personal" },
  { id:1, creditor:"Nedbank",       type:"Personal loan",   icon:"🏦", bg:"#EBF0FF", amount:68_000,  cat:"personal" },
  { id:2, creditor:"Capitec",       type:"Credit card",     icon:"💳", bg:"#FFF0EB", amount:48_000,  cat:"credit"   },
  { id:3, creditor:"FNB",           type:"Credit card",     icon:"💳", bg:"#FFF0EB", amount:31_500,  cat:"credit"   },
  { id:4, creditor:"Wesbank",       type:"Vehicle finance", icon:"🚗", bg:"#EBFFF5", amount:245_000, cat:"vehicle"  },
];

// Tranche states: locked | released | proof_pending | bureau_checking | settled
const INITIAL_STATES = ["released","locked","locked","locked","locked"];

function Disbursement({ go }) {
  const [states, setStates] = useState(INITIAL_STATES);
  const [proofs, setProofs]   = useState({});    // trancheId → filename
  const [expanded, setExpanded] = useState(0);
  const [bureauChecking, setBureauChecking] = useState({});

  const fmt = n => "R " + n.toLocaleString("en-ZA");

  const totalAmt   = TRANCHES.reduce((s,t) => s + t.amount, 0);
  const settledAmt = TRANCHES.filter((_,i) => states[i] === "settled").reduce((s,t) => s + t.amount, 0);
  const settledCount = states.filter(s => s === "settled").length;
  const ringPct = Math.round((settledAmt / totalAmt) * 100);
  const circumference = 2 * Math.PI * 30;
  const offset = circumference - (circumference * ringPct / 100);

  const uploadProof = (id) => {
    const names = ["Settlement_Ltr_AfricanBank.pdf","Settlement_Ltr_Nedbank.pdf","Capitec_ZeroBalance.pdf","FNB_AccountClosed.pdf","Wesbank_Settlement.pdf"];
    setProofs(p => ({ ...p, [id]: names[id] }));
    setStates(s => { const n=[...s]; n[id]="proof_pending"; return n; });
  };

  const runBureauCheck = (id) => {
    setBureauChecking(b => ({ ...b, [id]: "checking" }));
    setStates(s => { const n=[...s]; n[id]="bureau_checking"; return n; });
    // Simulate 3s bureau response
    setTimeout(() => {
      setBureauChecking(b => ({ ...b, [id]: "confirmed" }));
      setStates(s => {
        const n = [...s];
        n[id] = "settled";
        if(id + 1 < n.length) n[id+1] = "released"; // unlock next
        return n;
      });
      setExpanded(id + 1 < TRANCHES.length ? id + 1 : id);
    }, 3000);
  };

  const stateLabel = { locked:"Locked", released:"Funds Released", proof_pending:"Proof Uploaded", bureau_checking:"Bureau Checking", settled:"Settled ✓" };
  const stateClass  = { locked:"locked", released:"active", proof_pending:"active", bureau_checking:"active", settled:"done" };

  return (
    <div className="screen fade-in" style={{background:"#F0F4F8"}}>
      <div className="screen-scroll">

        {/* Hero */}
        <div className="disb-hero">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,position:"relative",zIndex:1}}>
            <div className="mulo-logo" style={{color:"#fff"}}>Mu<span style={{color:"#00B8A9"}}>ḽ</span>o</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>Tranche Disbursement</div>
          </div>

          <div style={{display:"flex",alignItems:"center",gap:16,position:"relative",zIndex:1}}>
            {/* Progress ring */}
            <div className="disb-progress-ring-wrap">
              <svg className="disb-ring-svg" viewBox="0 0 72 72">
                <defs>
                  <linearGradient id="disbGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00B8A9"/>
                    <stop offset="100%" stopColor="#12C26B"/>
                  </linearGradient>
                </defs>
                <circle className="disb-ring-track" cx="36" cy="36" r="30"/>
                <circle className="disb-ring-fill" cx="36" cy="36" r="30"
                  stroke={ringPct > 0 ? "url(#disbGrad)" : "transparent"}
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                />
              </svg>
              <div className="disb-ring-num">
                <div className="disb-ring-pct">{ringPct}%</div>
                <div className="disb-ring-sub">done</div>
              </div>
            </div>

            <div style={{flex:1}}>
              <div className="disb-total-label">Total loan</div>
              <div className="disb-total-amt">{fmt(totalAmt)}</div>
              <div style={{height:6,background:"rgba(255,255,255,0.1)",borderRadius:99,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${ringPct}%`,background:"linear-gradient(90deg,#00B8A9,#12C26B)",borderRadius:99,transition:"width 1s ease"}}/>
              </div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.45)",marginTop:5}}>
                {settledCount} of {TRANCHES.length} debts settled · {fmt(settledAmt)} disbursed
              </div>
            </div>
          </div>

          <div className="disb-pills">
            {[
              { val: fmt(settledAmt),              label:"Settled" },
              { val: fmt(totalAmt - settledAmt),   label:"Remaining" },
              { val: `${TRANCHES.length - settledCount} debts`, label:"Pending" },
            ].map(p => (
              <div className="disb-pill" key={p.label}>
                <div className="disb-pill-val">{p.val}</div>
                <div className="disb-pill-label">{p.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* How it works — shown once */}
        <div style={{margin:"16px 16px 4px",background:"rgba(0,184,169,0.07)",border:"1px solid rgba(0,184,169,0.18)",borderRadius:14,padding:"12px 14px",fontSize:12,color:"#0A1628",lineHeight:1.7,display:"flex",gap:10}}>
          <span style={{fontSize:16,flexShrink:0}}>📐</span>
          <div>
            <strong>How tranche settlement works</strong>
            <div style={{color:"#8FA3BE",marginTop:2}}>
              Funds are released one debt at a time. Once Muḽo releases a tranche, you settle that creditor, upload proof, and we verify closure with the credit bureau before releasing the next amount.
            </div>
          </div>
        </div>

        {/* Tranche cards */}
        <div style={{padding:"12px 16px 24px"}}>
          {TRANCHES.map((t, i) => {
            const st      = states[i];
            const isOpen  = expanded === i;
            const proof   = proofs[i];
            const bureau  = bureauChecking[i];

            return (
              <div key={t.id} className={`tranche-card ${stateClass[st]}`}>
                {/* Header */}
                <div className="tranche-header" onClick={() => setExpanded(isOpen ? -1 : i)}>
                  <div className={`tranche-num ${stateClass[st]}`}>
                    {st === "settled" ? "✓" : `T${i+1}`}
                  </div>
                  <div style={{width:34,height:34,borderRadius:10,background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{t.icon}</div>
                  <div className="tranche-meta">
                    <div className="tranche-creditor">{t.creditor}</div>
                    <div className="tranche-type">{t.type}</div>
                  </div>
                  <div className="tranche-right">
                    <div className="tranche-amount">{fmt(t.amount)}</div>
                    <div className={`tranche-status-badge ${stateClass[st]}`}>
                      {stateLabel[st]}
                    </div>
                  </div>
                </div>

                {/* Expanded body */}
                {isOpen && (
                  <div className="tranche-body fade-in">

                    {/* Step 1: Funds released */}
                    <div className="tranche-step-row">
                      <div className={`tranche-step-icon ${st !== "locked" ? "done" : "wait"}`}>💸</div>
                      <div className="tranche-step-text">
                        <div className="tranche-step-label">Funds released to your account</div>
                        <div className="tranche-step-sub">
                          {st === "locked"
                            ? "Waiting for previous tranche to be confirmed"
                            : `${fmt(t.amount)} sent to Nedbank cheque acc. ••2847`}
                        </div>
                        {st !== "locked" && <div className="tranche-step-date">✓ {i === 0 ? "Apr 15" : i === 1 ? "Apr 17" : "Pending"} · Ref MUL{(2026048291 + i).toString()}</div>}
                      </div>
                    </div>

                    {/* Step 2: Client settles debt */}
                    <div className="tranche-step-row">
                      <div className={`tranche-step-icon ${["proof_pending","bureau_checking","settled"].includes(st) ? "done" : st === "released" ? "active" : "wait"}`}>🏦</div>
                      <div className="tranche-step-text">
                        <div className="tranche-step-label">You settle {t.creditor}</div>
                        <div className="tranche-step-sub">
                          {st === "locked" ? "Locked — complete previous tranche first"
                           : st === "released" ? `Transfer ${fmt(t.amount)} to ${t.creditor} and request a settlement letter`
                           : `${t.creditor} account settled`}
                        </div>
                      </div>
                    </div>

                    {/* Step 3: Upload proof */}
                    <div className="tranche-step-row">
                      <div className={`tranche-step-icon ${["bureau_checking","settled"].includes(st) ? "done" : st === "proof_pending" ? "done" : "wait"}`}>📄</div>
                      <div className="tranche-step-text">
                        <div className="tranche-step-label">Upload settlement proof</div>
                        <div className="tranche-step-sub">Settlement letter or zero-balance statement from {t.creditor}</div>
                        {st === "released" && (
                          <div className={`proof-upload-mini ${proof ? "uploaded" : ""}`} onClick={() => uploadProof(i)}>
                            <span className="proof-upload-mini-icon">{proof ? "✅" : "📎"}</span>
                            <div>
                              <div className="proof-upload-mini-text">{proof ? proof : "Tap to upload settlement proof"}</div>
                              <div className="proof-upload-mini-hint">{proof ? "Uploaded · Ready for bureau check" : "PDF, JPG or PNG · Max 5MB"}</div>
                            </div>
                          </div>
                        )}
                        {["proof_pending","bureau_checking","settled"].includes(st) && proof && (
                          <div style={{fontSize:11,color:"#12C26B",marginTop:4,display:"flex",alignItems:"center",gap:4}}>✓ {proof}</div>
                        )}
                      </div>
                    </div>

                    {/* Step 4: Bureau verification */}
                    <div className="tranche-step-row">
                      <div className={`tranche-step-icon ${st === "settled" ? "done" : st === "bureau_checking" ? "active" : "wait"}`}>
                        {st === "bureau_checking" ? <span className="bureau-spinner">⟳</span> : st === "settled" ? "✓" : "🔍"}
                      </div>
                      <div className="tranche-step-text">
                        <div className="tranche-step-label">TransUnion bureau verification</div>
                        <div className="tranche-step-sub">
                          {st === "settled" ? `${t.creditor} confirmed closed on credit bureau`
                           : st === "bureau_checking" ? "Checking with TransUnion — usually takes 30–60 seconds…"
                           : "We verify the account is closed before releasing the next tranche"}
                        </div>
                        {st === "bureau_checking" && (
                          <div className="bureau-check" style={{marginTop:8}}>
                            <span className="bureau-check-icon"><span className="bureau-spinner">⟳</span></span>
                            <div>Querying TransUnion for <strong>{t.creditor}</strong> account status…</div>
                          </div>
                        )}
                        {st === "settled" && (
                          <div style={{background:"rgba(18,194,107,0.06)",border:"1px solid rgba(18,194,107,0.2)",borderRadius:10,padding:"8px 12px",marginTop:6,fontSize:11,color:"#12C26B"}}>
                            ✓ TransUnion confirmed: Account closed · {i === 0 ? "Apr 15" : "Apr 17"} · Score impact: +12 pts
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Step 5: Next tranche unlocked */}
                    {i < TRANCHES.length - 1 && (
                      <div className="tranche-step-row" style={{marginBottom:0}}>
                        <div className={`tranche-step-icon ${st === "settled" ? "done" : "wait"}`}>🔓</div>
                        <div className="tranche-step-text">
                          <div className="tranche-step-label">Next tranche unlocked</div>
                          <div className="tranche-step-sub">{st === "settled" ? `T${i+2} (${TRANCHES[i+1]?.creditor}) · ${fmt(TRANCHES[i+1]?.amount)} released` : `T${i+2} unlocks after bureau confirms this settlement`}</div>
                        </div>
                      </div>
                    )}
                    {i === TRANCHES.length - 1 && st === "settled" && (
                      <div className="tranche-step-row" style={{marginBottom:0}}>
                        <div className="tranche-step-icon done">🎉</div>
                        <div className="tranche-step-text">
                          <div className="tranche-step-label">All debts settled!</div>
                          <div className="tranche-step-sub">Repayments of {fmt(7543)}/mo begin next month</div>
                        </div>
                      </div>
                    )}

                    {/* CTA for active tranche */}
                    {st === "proof_pending" && (
                      <button className="btn btn-primary" style={{marginTop:12,fontSize:13}} onClick={() => runBureauCheck(i)}>
                        Submit proof for bureau check →
                      </button>
                    )}
                    {st === "bureau_checking" && (
                      <button className="btn btn-primary" style={{marginTop:12,fontSize:13,opacity:.5}} disabled>
                        <span className="bureau-spinner" style={{marginRight:6}}>⟳</span> Verifying with TransUnion…
                      </button>
                    )}
                    {st === "settled" && i < TRANCHES.length - 1 && (
                      <div className="wa-notify-chip" style={{marginTop:12}}>
                        💬 <div>WhatsApp sent: <strong>"{TRANCHES[i+1]?.creditor} tranche of {fmt(TRANCHES[i+1]?.amount)} has been released to your account."</strong></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* All settled summary */}
          {settledCount === TRANCHES.length && (
            <div style={{background:"linear-gradient(135deg,rgba(18,194,107,0.08),rgba(0,184,169,0.05))",border:"1px solid rgba(18,194,107,0.25)",borderRadius:18,padding:20,textAlign:"center"}} className="fade-up">
              <div style={{fontSize:40,marginBottom:10}}>🎉</div>
              <div style={{fontFamily:"'Sora',sans-serif",fontSize:18,fontWeight:800,color:"#0A1628",marginBottom:6}}>All 5 debts settled!</div>
              <div style={{fontSize:13,color:"#8FA3BE",lineHeight:1.6,marginBottom:16}}>
                {fmt(517_500)} settled across 5 creditors.<br/>Your Muḽo repayment of <strong style={{color:"#00B8A9"}}>R7,543/month</strong> begins 11 May 2026.
              </div>
              <button className="btn btn-primary" style={{fontSize:13}} onClick={() => go("dashboard")}>Go to dashboard →</button>
            </div>
          )}
        </div>
      </div>

      {settledCount < TRANCHES.length && (
        <div className="bottom-cta">
          <div style={{fontSize:12,color:"#8FA3BE",textAlign:"center",lineHeight:1.6}}>
            💬 You will receive a <strong style={{color:"#25D366"}}>WhatsApp notification</strong> each time a tranche is released or a bureau check completes.
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 8 — DASHBOARD
───────────────────────────────────────────── */
function Dashboard({ go }) {
  const [tab, setTab] = useState("home");

  const activity = [
    { icon:"💸", bg:"#FFF0F0", label:"Wesbank settlement", date:"Apr 14 · Vehicle finance", amt:"-R128,500", type:"debit" },
    { icon:"🏦", bg:"#F0F4FF", label:"African Bank settled", date:"Apr 13 · Personal loan", amt:"-R125,000", type:"debit" },
    { icon:"💳", bg:"#FFF8F0", label:"Capitec CC closed", date:"Apr 12 · Credit card", amt:"-R48,000", type:"debit" },
    { icon:"✅", bg:"#F0FFF8", label:"Loan disbursed", date:"Apr 12 · Muḽo equity loan", amt:"+R320,000", type:"credit" },
  ];

  return (
    <div className="screen fade-in" style={{background:"#F0F4F8"}}>
      <div className="dash-header">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div className="dash-greeting">Good morning 👋</div>
            <div className="dash-name">{(window._muloFirstName && window._muloLastName ? window._muloFirstName + ' ' + window._muloLastName : 'Thabo Nkosi')}</div>
          </div>
          <div style={{width:40,height:40,borderRadius:14,background:"linear-gradient(135deg,#00B8A9,#1A73E8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:"#fff",fontFamily:"'Sora',sans-serif"}}>TN</div>
        </div>
        <div className="status-card">
          <div className="status-top">
            <div style={{fontSize:13,fontWeight:600,color:"#fff"}}>Settlement in progress</div>
            <div className="status-badge"><span className="status-badge-dot"/>Live</div>
          </div>
          <div className="status-progress-track"><div className="status-progress-fill" style={{width:"60%"}} /></div>
          <div className="status-step-labels">
            <span>Approved</span><span>Disbursed</span><span>Settling</span><span>Complete</span>
          </div>
        </div>
        <div className="repayment-card">
          <div className="repay-label">Next repayment</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:12,justifyContent:"space-between"}}>
            <div>
              <div className="repay-amount">R 6,940</div>
              <div className="repay-meta">Due 11 May 2026 · Month 1 of 60</div>
            </div>
            <button className="btn btn-sm" style={{background:"rgba(255,255,255,0.12)",color:"#fff",border:"1px solid rgba(255,255,255,0.15)",fontFamily:"'IBM Plex Sans',sans-serif",padding:"9px 16px",borderRadius:12,fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>Set up debit</button>
          </div>
        </div>
      </div>

      <div className="dash-body">
        <div style={{height:12}}/>
        <div className="insight-row">
          <div className="insight-card">
            <div className="insight-icon">💰</div>
            <div className="insight-val green">R4,260</div>
            <div className="insight-label">Monthly saving</div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">📉</div>
            <div className="insight-val blue">11.25%</div>
            <div className="insight-label">Avg. interest rate</div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">🏡</div>
            <div className="insight-val">R580k</div>
            <div className="insight-label">Property equity</div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">🎯</div>
            <div className="insight-val">Score 82</div>
            <div className="insight-label">Muḽo rating</div>
          </div>
        </div>

        <div style={{background:"#fff",borderRadius:18,padding:18,boxShadow:"0 2px 12px rgba(0,0,0,0.05)",marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:700,color:"#8FA3BE",textTransform:"uppercase",letterSpacing:0.8,marginBottom:4}}>5-year savings projection</div>
          <div style={{fontFamily:"'Sora',sans-serif",fontSize:28,fontWeight:800,color:"#12C26B",marginBottom:4}}>R 255,600</div>
          <div style={{fontSize:12,color:"#8FA3BE",marginBottom:16}}>Total saved over loan term vs current debt</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:4,height:60}}>
            {[18,32,45,60,75,90,100].map((h,i) => (
              <div key={i} style={{flex:1,height:`${h}%`,background:`rgba(0,184,169,${0.15+i*0.12})`,borderRadius:"4px 4px 0 0",transition:"height .5s"}} />
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:10,color:"#C5D0DC"}}>
            {["Y1","Y2","Y3","Y4","Y5","Y6","Y7"].map(y=><span key={y}>{y}</span>)}
          </div>
        </div>

        <div style={{background:"#fff",borderRadius:18,padding:18,boxShadow:"0 2px 12px rgba(0,0,0,0.05)",marginBottom:16}}>
          <div style={{fontSize:12,fontWeight:700,color:"#8FA3BE",textTransform:"uppercase",letterSpacing:0.8,marginBottom:12}}>Recent activity</div>
          {activity.map((a,i) => (
            <div className="activity-item" key={i}>
              <div className="activity-icon" style={{background:a.bg,fontSize:15}}>{a.icon}</div>
              <div style={{flex:1}}>
                <div className="activity-label">{a.label}</div>
                <div className="activity-date">{a.date}</div>
              </div>
              <div className={`activity-amount ${a.type}`}>{a.amt}</div>
            </div>
          ))}
        </div>
        <div style={{height:8}}/>
      </div>
      <div className="mini-nav">
        {[["🏠","Home"],["💸","Tranches"],["💬","Support"],["👤","Profile"]].map(([icon,label],i) => (
          <div key={label} className={`nav-tab ${i===0?"active":""}`} onClick={() => i===1 ? go("disbursement") : null}>
            <div className="nav-tab-icon">{icon}</div>
            <div className="nav-tab-label">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ROOT
───────────────────────────────────────────── */
const SCREENS = { landing:Landing, "id-verify":IdVerify, otp:OtpVerify, liveness:LivenessCheck, signup:Signup, consent:Consent, loading:Loading, "bond-confirm":BondConfirm, "bank-account":BankAccountConfirm, offer:Offer, "doc-upload":DocUpload, "loan-sign":LoanSign, conveyancing:Conveyancing, settlement:Settlement, disbursement:Disbursement, dashboard:Dashboard };

export default function App() {
  const [screen, setScreen] = useState("landing");
  const Screen = SCREENS[screen] || Landing;

  return (
    <>
      <style>{CSS}</style>
      <div className="shell">
        <div className="phone">
          
          <Screen go={setScreen} />
        </div>
      </div>
      <div className="desktop-info" style={{display:"none"}}>
        <div className="desktop-title">Muḽo<br/>Refinancing Platform</div>
        <div className="desktop-sub">South Africa's fastest debt consolidation using home equity. Navigate screens on the phone prototype.</div>
        {[["🏡","Property-backed lending","Use your equity to settle all debt"],["⚡","5-minute digital journey","From ID to offer without a branch visit"],["🔒","NCR & FSCA compliant","Fully regulated fintech platform"]].map(([i,t,s]) => (
          <div className="desktop-feature" key={t}>
            <div className="desktop-feature-icon">{i}</div>
            <div className="desktop-feature-text"><strong>{t}</strong>{s}</div>
          </div>
        ))}
      </div>
    </>
  );
}
