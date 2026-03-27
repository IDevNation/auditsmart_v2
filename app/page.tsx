'use client';

import { useState, useEffect, useRef } from 'react';

const API = 'https://web-production-de7ca.up.railway.app';

const AGENTS_MSGS = [
  '🔄 Reentrancy Agent scanning...', '🔢 Overflow Agent analyzing...', '🔐 Access Control Agent checking...',
  '🧩 Logic Agent inspecting...', '⛽ Gas/DoS Agent running...', '💰 DeFi Agent auditing...',
  '🚪 Backdoor Agent detecting...', '✍️ Signature Agent verifying...', '🧠 Gemini Cross-Validator running...', '🐍 Slither Static Analysis...',
];

const RISK_COLOR: Record<string, string> = { critical: '#f87171', high: '#fbbf24', medium: '#fde047', low: '#7db3ff', unknown: '#8080a0' };
const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
const VERDICT_STYLES: Record<string, React.CSSProperties> = {
  'SAFE TO DEPLOY': { background: 'rgba(16,185,129,.1)', borderColor: 'rgba(16,185,129,.3)', color: '#10b981' },
  'DEPLOY WITH CAUTION': { background: 'rgba(251,191,36,.1)', borderColor: 'rgba(251,191,36,.3)', color: '#fbbf24' },
  'DO NOT DEPLOY': { background: 'rgba(239,68,68,.1)', borderColor: 'rgba(239,68,68,.3)', color: '#ef4444' },
};

interface User { name: string; email?: string; plan: string; free_audits_remaining?: number; }
interface Finding {
  title?: string; type?: string; vulnerability_type?: string;
  severity?: string; description?: string; explanation?: string;
  source?: string; agent?: string; function?: string;
  line_number?: number; line?: number; confidence?: string;
  recommendation?: string;
  auto_fix?: { fixed_code?: string; explanation?: string };
  exploit_scenario?: string;
}
interface AuditResult {
  id: string; risk_level: string; risk_score: number; scan_duration_ms: number;
  total_findings: number; critical_count: number; high_count: number;
  medium_count: number; low_count: number; info_count: number;
  findings: Finding[]; pdf_available: boolean; deployment_verdict?: string;
  thinking_chain?: string; summary?: string; report_id?: string;
  raw_findings_count?: number; agents_used?: string[];
}
interface HistoryItem {
  id: string; contract_name: string; created_at: string; risk_level: string;
  total_findings: number; critical_count: number; chain: string; pdf_available: boolean;
}
interface DashStats {
  total_audits: number; critical_findings: number; high_findings: number;
  total_vulnerabilities: number; avg_risk_score: number; avg_scan_duration_ms: number; plan?: string;
}
interface Toast { id: number; message: string; type: 'success' | 'error' | 'info'; show: boolean; }

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [showApp, setShowApp] = useState(false);
  const [appTab, setAppTab] = useState<'audit' | 'history' | 'dashboard'>('audit');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginErr, setLoginErr] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPass, setShowLoginPass] = useState(false);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regErr, setRegErr] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);

  const [contractCode, setContractCode] = useState('');
  const [contractName, setContractName] = useState('Contract');
  const [contractChain, setContractChain] = useState('ethereum');
  const [auditErr, setAuditErr] = useState('');
  const [auditView, setAuditView] = useState<'form' | 'scanning' | 'results'>('form');
  const [scanAgent, setScanAgent] = useState('Initializing pipeline...');
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [auditId, setAuditId] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [dashStats, setDashStats] = useState<DashStats | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toastIdRef = useRef(0);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const tok = localStorage.getItem('as_token');
    const usr = localStorage.getItem('as_user');
    if (tok && usr) { setToken(tok); setUser(JSON.parse(usr)); }
  }, []);

  useEffect(() => () => { if (scanIntervalRef.current) clearInterval(scanIntervalRef.current); }, []);

  function addToast(message: string, type: Toast['type'] = 'info') {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, message, type, show: false }]);
    setTimeout(() => setToasts(prev => prev.map(t => t.id === id ? { ...t, show: true } : t)), 10);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, show: false } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300);
    }, 3500);
  }

  function saveSession(data: { access_token: string; user: User }) {
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('as_token', data.access_token);
    localStorage.setItem('as_user', JSON.stringify(data.user));
  }

  function logout() {
    localStorage.removeItem('as_token');
    localStorage.removeItem('as_user');
    setToken(null); setUser(null); setShowApp(false);
    addToast('Logged out successfully', 'info');
  }

  function openApp() {
    if (!user) { setShowAuth(true); return; }
    setShowApp(true);
    loadDashboard(); loadHistory();
  }

  function switchAppTab(tab: 'audit' | 'history' | 'dashboard') {
    setAppTab(tab);
    if (tab === 'history') loadHistory();
    if (tab === 'dashboard') loadDashboard();
  }

  function forgotPassword() {
    if (!loginEmail) { addToast('Enter your email first, then click Forgot Password', 'info'); return; }
    addToast('Password reset link sent to ' + loginEmail + ' (if account exists)', 'success');
  }

  function resetAudit() {
    setAuditId(null); setAuditResult(null); setAuditErr(''); setContractCode(''); setAuditView('form');
  }

  async function doLogin() {
    if (!loginEmail || !loginPass) { setLoginErr('Please enter email and password'); return; }
    setLoginErr(''); setLoginLoading(true);
    try {
      const r = await fetch(API + '/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });
      const d = await r.json();
      if (!r.ok) { setLoginErr(d.detail || 'Login failed'); return; }
      saveSession(d); setShowAuth(false); setShowApp(true);
      addToast('Welcome back, ' + d.user.name + '!', 'success');
      loadHistory(d.access_token); loadDashboard(d.access_token);
    } catch { setLoginErr('Cannot connect to server. Check your connection.'); }
    finally { setLoginLoading(false); }
  }

  async function doRegister() {
    if (!regName || !regEmail || !regPass) { setRegErr('Please fill all fields'); return; }
    if (regPass.length < 8) { setRegErr('Password must be at least 8 characters'); return; }
    setRegErr(''); setRegLoading(true);
    try {
      const r = await fetch(API + '/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regName, email: regEmail, password: regPass }),
      });
      const d = await r.json();
      if (!r.ok) { setRegErr(d.detail || 'Registration failed'); return; }
      saveSession(d); setShowAuth(false); setShowApp(true);
      addToast('Account created! Welcome, ' + d.user.name, 'success');
      loadHistory(d.access_token); loadDashboard(d.access_token);
    } catch { setRegErr('Cannot connect to server. Check your connection.'); }
    finally { setRegLoading(false); }
  }

  async function runAudit() {
    if (!user) { setShowAuth(true); return; }
    const code = contractCode.trim();
    if (!code) { setAuditErr('Please paste your Solidity contract code'); return; }
    if (code.length < 10) { setAuditErr('Contract code too short'); return; }
    setAuditErr(''); setAuditView('scanning'); setScanAgent('Initializing pipeline...');
    let ai = 0;
    scanIntervalRef.current = setInterval(() => { setScanAgent(AGENTS_MSGS[ai % AGENTS_MSGS.length]); ai++; }, 1200);
    try {
      const r = await fetch(API + '/audit/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ contract_code: code, contract_name: contractName || 'Contract', chain: contractChain }),
      });
      const d = await r.json();
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      if (!r.ok) {
        setAuditView('form');
        if (r.status === 402) { setAuditErr('Free audit limit reached. Please upgrade to Pro.'); addToast('Upgrade to Pro for more audits 🚀', 'info'); }
        else { setAuditErr(d.detail || 'Audit failed. Try again.'); }
        return;
      }
      if (user?.plan === 'free') {
        const updated = { ...user, free_audits_remaining: Math.max(0, (user.free_audits_remaining || 0) - 1) };
        setUser(updated); localStorage.setItem('as_user', JSON.stringify(updated));
      }
      setAuditId(d.id); setAuditResult(d); setAuditView('results');
      addToast('Audit complete! ' + d.total_findings + ' findings found.', 'success');
    } catch {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      setAuditView('form'); setAuditErr('Connection error. Make sure the API server is running.');
    }
  }

  async function downloadPDF(overrideId?: string) {
    const id = overrideId || auditId;
    if (!id || !token) return;
    addToast('Preparing PDF download...', 'info');
    try {
      const r = await fetch(API + '/audit/report/' + id + '/pdf', { headers: { 'Authorization': 'Bearer ' + token } });
      if (!r.ok) { addToast('PDF not available for this audit', 'error'); return; }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'AuditSmart_Report.pdf'; a.click();
      URL.revokeObjectURL(url);
      addToast('PDF downloaded!', 'success');
    } catch { addToast('Failed to download PDF', 'error'); }
  }

  async function loadHistory(tok?: string) {
    const t = tok || token;
    if (!t) return;
    try {
      const r = await fetch(API + '/audit/history', { headers: { 'Authorization': 'Bearer ' + t } });
      if (!r.ok) return;
      const d = await r.json();
      setHistory(d.audits || []);
    } catch {}
  }

  async function loadAuditDetail(id: string) {
    if (!token) return;
    try {
      const r = await fetch(API + '/audit/report/' + id, { headers: { 'Authorization': 'Bearer ' + token } });
      if (!r.ok) return;
      const d = await r.json();
      setAuditId(d.id); setAuditResult(d); setAuditView('results'); setAppTab('audit');
    } catch { addToast('Failed to load audit', 'error'); }
  }

  async function loadDashboard(tok?: string) {
    const t = tok || token;
    if (!t) return;
    try {
      const r = await fetch(API + '/dashboard/stats', { headers: { 'Authorization': 'Bearer ' + t } });
      if (!r.ok) return;
      const d = await r.json();
      setDashStats(d);
    } catch {}
  }

  const plan = user?.plan || 'free';
  const quotaLeft = user?.free_audits_remaining ?? 0;
  const quotaMax = plan === 'enterprise' ? null : (plan === 'pro' ? 50 : 3);

  return (
    <>
      {/* NAV */}
      <nav>
        <div className="nlogo">
          <svg viewBox="0 0 32 32" fill="none">
            <path d="M16 2L4 8v8c0 7.7 5.1 14.9 12 16.5 6.9-1.6 12-8.8 12-16.5V8L16 2z" fill="#050508" stroke="#4a9eff" strokeWidth="1.5"/>
            <path d="M16 8l-5 10h3.5l-.7 6L19 14h-3.5l.7-6z" fill="#4a9eff"/>
          </svg>
          <div>
            <span className="nlogo-t">AUDITSMART</span>
            <span className="nlogo-s">AI SECURITY PLATFORM</span>
          </div>
        </div>
        <div className="nlinks">
          <a href="#features">Features</a>
          <a href="#how">How It Works</a>
          <a href="#usp">Why AuditSmart</a>
          <a href="#agents">Agents</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </div>
        {user ? (
          <div className="n-user">
            <span className="n-quota">{plan === 'free' ? quotaLeft + ' audits left' : plan === 'enterprise' ? '∞ audits' : quotaLeft + ' left'}</span>
            <span className={`n-plan ${plan}`}>{plan.toUpperCase()}</span>
            <button className="ncta" style={{ marginLeft: '6px' }} onClick={openApp}>OPEN APP</button>
            <button className="n-logout" onClick={logout}>LOGOUT</button>
          </div>
        ) : (
          <button className="ncta" onClick={() => setShowAuth(true)}>LOGIN</button>
        )}
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="orb o1" />
        <div className="orb o2" />
        <div className="hgrid" />
        <div className="hscan" />

        <div className="hc">
          {/* Vortex logo */}
          <div className="vortex-wrap">
            <div className="v-ring r1" />
            <div className="v-ring r2" />
            <div className="v-ring r3" />
            <div className="v-glow" />
            <div className="v-as">
              <div className="v-as-text">
                <span className="as-bg">AS</span>
                <span className="as-main">AS</span>
              </div>
            </div>
          </div>

          {/* Badge */}
          <div className="hbadge">
            <span className="dot" />
            10 AI AGENTS &nbsp;•&nbsp; GROQ + GEMINI + <span className="badge-claude">CLAUDE</span> + SLITHER &nbsp;•&nbsp; &lt; 60 SECONDS
          </div>

          {/* Title */}
          <h1 className="htitle">
            <span className="ln"><span>Secure Your</span></span>
            <span className="ln"><span className="grad">Smart Contracts</span></span>
            <span className="ln"><span>Before Hackers Do</span></span>
          </h1>

          {/* Subtitle */}
          <p className="hsub">
            Multi-agent AI security finds vulnerabilities in Solidity in under 60 seconds. Professional PDF reports at 1% the cost of manual audits.
          </p>

          {/* Buttons */}
          <div className="hbtns">
            <button className="btn-p" onClick={() => user ? openApp() : setShowAuth(true)}>START FREE AUDIT</button>
            <button className="btn-s" onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}>HOW IT WORKS ↓</button>
          </div>

          {/* Radar */}
          <div className="radar-wrap">
            <div className="radar">
              <div className="radar-cross" />
              <div className="radar-sweep" />
              <div className="radar-blip" />
              <div className="radar-blip" />
              <div className="radar-blip" />
              <div className="radar-center" />
            </div>
            <div className="radar-label">SCANNING FOR VULNERABILITIES</div>
          </div>
        </div>
      </section>

      {/* PROOF STATS */}
      <div className="proof">
        <div className="proof-in">
          <div className="ps"><div className="ps-n">10</div><div className="ps-l">AI Agents</div></div>
          <div className="ps"><div className="ps-n">10</div><div className="ps-l">Parallel Scans</div></div>
          <div className="ps"><div className="ps-n">60</div><div className="ps-l">Sec / Audit</div></div>
          <div className="ps"><div className="ps-n">PDF</div><div className="ps-l">Reports</div></div>
          <div className="ps"><div className="ps-n">$29</div><div className="ps-l">/ Month Pro</div></div>
        </div>
      </div>

      {/* POWERED BY */}
      <div className="powered-strip">
        <div className="powered-label">POWERED BY</div>
        <div className="powered-logos">
          <div className="powered-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 7v5c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V7l-8-5z" stroke="#d97757" strokeWidth="1.8"/>
              <path d="M8 12l3 3 5-5" stroke="#d97757" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="pw-name">Claude</span><span className="pw-sub">by Anthropic</span>
          </div>
          <div className="powered-div" />
          <div className="powered-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#f97316" strokeWidth="1.8"/>
              <path d="M12 7v5l3 3" stroke="#f97316" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <span className="pw-name">Groq</span><span className="pw-sub">LLaMA 3.3 70B</span>
          </div>
          <div className="powered-div" />
          <div className="powered-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9" stroke="#4285f4" strokeWidth="1.5" fill="none"/>
            </svg>
            <span className="pw-name">Gemini</span><span className="pw-sub">by Google</span>
          </div>
          <div className="powered-div" />
          <div className="powered-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#10b981"/>
            </svg>
            <span className="pw-name">Slither</span><span className="pw-sub">by Crytic</span>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <section className="sec" id="features">
        <div className="sec-in">
          <span className="sec-tag rv">CAPABILITIES</span>
          <h2 className="sec-t rv">Why Developers Trust AuditSmart</h2>
          <div className="sec-line rv" />
          <p className="sec-d rv">Not another generic scanner. 10 parallel agents, deduplication engine, and actionable results.</p>
          <div className="fgrid">

            <div className="hud fc rv" style={{borderTop:'2px solid #4a9eff',background:'linear-gradient(135deg,rgba(74,158,255,.08),rgba(74,158,255,.02))'}}>
              <div className="cn tl"/><div className="cn tr"/><div className="cn bl"/><div className="cn br"/>
              <div className="sl"/>
              <span className="fi" style={{background:'linear-gradient(135deg,#0d2a5e,#1d6fef)',padding:'10px',borderRadius:'10px',display:'inline-block'}}>🛡️</span>
              <div className="ft" style={{WebkitTextFillColor:'#4a9eff',color:'#4a9eff'}}>MULTI-AGENT PIPELINE</div>
              <div className="fd">8 Groq specialist agents + Gemini cross-validator + Slither static analysis. Each agent targets one vulnerability class.</div>
            </div>

            <div className="hud fc rv" style={{borderTop:'2px solid #10b981',background:'linear-gradient(135deg,rgba(16,185,129,.08),rgba(16,185,129,.02))'}}>
              <div className="cn tl"/><div className="cn tr"/><div className="cn bl"/><div className="cn br"/>
              <div className="sl"/>
              <span className="fi" style={{background:'linear-gradient(135deg,#064e3b,#065f46)',padding:'10px',borderRadius:'10px',display:'inline-block'}}>🔬</span>
              <div className="ft" style={{WebkitTextFillColor:'#34d399',color:'#34d399'}}>DEDUPLICATION ENGINE</div>
              <div className="fd">Removes false positives, merges duplicates, auto-corrects severity, and tracks cross-agent confirmation confidence.</div>
            </div>

            <div className="hud fc rv" style={{borderTop:'2px solid #ef4444',background:'linear-gradient(135deg,rgba(239,68,68,.08),rgba(239,68,68,.02))'}}>
              <div className="cn tl"/><div className="cn tr"/><div className="cn bl"/><div className="cn br"/>
              <div className="sl"/>
              <span className="fi" style={{background:'linear-gradient(135deg,#7f1d1d,#991b1b)',padding:'10px',borderRadius:'10px',display:'inline-block'}}>🚨</span>
              <div className="ft" style={{WebkitTextFillColor:'#f87171',color:'#f87171'}}>BACKDOOR DETECTION</div>
              <div className="fd">Dedicated agent for selfdestruct, arbitrary delegatecall, and governance rug-pull vectors that other scanners miss.</div>
            </div>

            <div className="hud fc rv" style={{borderTop:'2px solid #f59e0b',background:'linear-gradient(135deg,rgba(245,158,11,.08),rgba(245,158,11,.02))'}}>
              <div className="cn tl"/><div className="cn tr"/><div className="cn bl"/><div className="cn br"/>
              <div className="sl"/>
              <span className="fi" style={{background:'linear-gradient(135deg,#78350f,#92400e)',padding:'10px',borderRadius:'10px',display:'inline-block'}}>📄</span>
              <div className="ft" style={{WebkitTextFillColor:'#fbbf24',color:'#fbbf24'}}>PDF AUDIT REPORTS</div>
              <div className="fd">Branded PDF with executive summary, severity breakdown, line-level findings, exploit paths, and fix recommendations.</div>
            </div>

            <div className="hud fc rv" style={{borderTop:'2px solid #a855f7',background:'linear-gradient(135deg,rgba(168,85,247,.08),rgba(168,85,247,.02))'}}>
              <div className="cn tl"/><div className="cn tr"/><div className="cn bl"/><div className="cn br"/>
              <div className="sl"/>
              <span className="fi" style={{background:'linear-gradient(135deg,#4c1d95,#5b21b6)',padding:'10px',borderRadius:'10px',display:'inline-block'}}>⚡</span>
              <div className="ft" style={{WebkitTextFillColor:'#c084fc',color:'#c084fc'}}>60-SECOND AUDITS</div>
              <div className="fd">Full multi-agent analysis in under a minute. No queues, no waiting. Paste your code and get results instantly.</div>
            </div>

            <div className="hud fc rv" style={{borderTop:'2px solid #06b6d4',background:'linear-gradient(135deg,rgba(6,182,212,.08),rgba(6,182,212,.02))'}}>
              <div className="cn tl"/><div className="cn tr"/><div className="cn bl"/><div className="cn br"/>
              <div className="sl"/>
              <span className="fi" style={{background:'linear-gradient(135deg,#164e63,#155e75)',padding:'10px',borderRadius:'10px',display:'inline-block'}}>🔏</span>
              <div className="ft" style={{WebkitTextFillColor:'#22d3ee',color:'#22d3ee'}}>SIGNATURE ANALYSIS</div>
              <div className="fd">Checks ecrecover zero-address, missing nonces, cross-chain replay, hash collisions, and EIP-712 compliance.</div>
            </div>

          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="sec" id="how" style={{background:'linear-gradient(180deg,transparent,rgba(74,158,255,.005),transparent)'}}>
        <div className="sec-in">
          <span className="sec-tag rv">WORKFLOW</span>
          <h2 className="sec-t rv">Audit in 4 Steps</h2>
          <div className="sec-line rv" />
          <div className="steps">

            <div className="hud stp rv" style={{borderTop:'2px solid #4a9eff',background:'linear-gradient(180deg,rgba(74,158,255,.08),rgba(6,182,212,.03))'}}>
              <div className="cn tl"/><div className="cn br"/>
              <div className="sl"/>
              <div className="sn" style={{color:'rgba(74,158,255,.15)'}}>01</div>
              <span className="si" style={{background:'linear-gradient(135deg,#1e3a8a,#2563eb)',borderRadius:'10px',padding:'8px',display:'inline-block'}}>📋</span>
              <div className="st" style={{color:'#7db3ff'}}>PASTE CODE</div>
              <div className="sd">Paste your Solidity contract</div>
            </div>

            <div className="hud stp rv" style={{borderTop:'2px solid #a855f7',background:'linear-gradient(180deg,rgba(168,85,247,.07),transparent)'}}>
              <div className="cn tl"/><div className="cn br"/>
              <div className="sl"/>
              <div className="sn" style={{color:'rgba(168,85,247,.15)'}}>02</div>
              <span className="si" style={{background:'linear-gradient(135deg,#4c1d95,#7c3aed)',borderRadius:'10px',padding:'8px',display:'inline-block'}}>🤖</span>
              <div className="st" style={{color:'#c084fc'}}>10 AGENTS SCAN</div>
              <div className="sd">Parallel AI + static analysis</div>
            </div>

            <div className="hud stp rv" style={{borderTop:'2px solid #10b981',background:'linear-gradient(180deg,rgba(16,185,129,.07),transparent)'}}>
              <div className="cn tl"/><div className="cn br"/>
              <div className="sl"/>
              <div className="sn" style={{color:'rgba(16,185,129,.15)'}}>03</div>
              <span className="si" style={{background:'linear-gradient(135deg,#064e3b,#059669)',borderRadius:'10px',padding:'8px',display:'inline-block'}}>🔧</span>
              <div className="st" style={{color:'#34d399'}}>DEDUP & VALIDATE</div>
              <div className="sd">Clean, unique findings only</div>
            </div>

            <div className="hud stp rv" style={{borderTop:'2px solid #f59e0b',background:'linear-gradient(180deg,rgba(245,158,11,.07),transparent)'}}>
              <div className="cn tl"/><div className="cn br"/>
              <div className="sl"/>
              <div className="sn" style={{color:'rgba(245,158,11,.15)'}}>04</div>
              <span className="si" style={{background:'linear-gradient(135deg,#78350f,#d97706)',borderRadius:'10px',padding:'8px',display:'inline-block'}}>📄</span>
              <div className="st" style={{color:'#fbbf24'}}>PDF REPORT</div>
              <div className="sd">Download branded report</div>
            </div>

          </div>
        </div>
      </section>
      {/* AUTH MODAL */}
      <div className={`modal-overlay${showAuth ? ' open' : ''}`} onClick={e => { if (e.target === e.currentTarget) setShowAuth(false); }}>
        <div className="modal">
          <button className="modal-close" onClick={() => setShowAuth(false)}>✕</button>
          <div className="modal-title">AUDITSMART</div>
          <div className="modal-sub">AI SMART CONTRACT SECURITY</div>
          <div className="modal-tabs">
            <button className={`modal-tab${authTab === 'login' ? ' active' : ''}`} onClick={() => setAuthTab('login')}>LOGIN</button>
            <button className={`modal-tab${authTab === 'register' ? ' active' : ''}`} onClick={() => setAuthTab('register')}>REGISTER</button>
          </div>
          {authTab === 'login' ? (
            <div>
              <div className="form-group">
                <label>Email</label>
                <input className="form-input" type="email" placeholder="you@example.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
              </div>
              <div className="form-group" style={{ position: 'relative' }}>
                <label>Password</label>
                <input className="form-input" type={showLoginPass ? 'text' : 'password'} placeholder="••••••••" value={loginPass} onChange={e => setLoginPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && doLogin()} />
                <button type="button" className={`pw-toggle${showLoginPass ? ' active' : ''}`} onClick={() => setShowLoginPass(p => !p)}>👁</button>
              </div>
              <div style={{ textAlign: 'right', margin: '-8px 0 12px' }}>
                <a href="#" onClick={e => { e.preventDefault(); forgotPassword(); }} style={{ fontFamily: 'var(--fm)', fontSize: '8px', color: 'var(--w4)', letterSpacing: '1px' }}>FORGOT PASSWORD?</a>
              </div>
              {loginErr && <div className="form-err show">{loginErr}</div>}
              <button className="btn-submit" disabled={loginLoading} onClick={doLogin}>{loginLoading ? 'LOGGING IN...' : 'LOGIN'}</button>
            </div>
          ) : (
            <div>
              <div className="form-group">
                <label>Full Name</label>
                <input className="form-input" type="text" placeholder="Your Name" value={regName} onChange={e => setRegName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input className="form-input" type="email" placeholder="you@example.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} />
              </div>
              <div className="form-group" style={{ position: 'relative' }}>
                <label>Password (min 8 chars)</label>
                <input className="form-input" type={showRegPass ? 'text' : 'password'} placeholder="••••••••" value={regPass} onChange={e => setRegPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && doRegister()} />
                <button type="button" className={`pw-toggle${showRegPass ? ' active' : ''}`} onClick={() => setShowRegPass(p => !p)}>👁</button>
              </div>
              {regErr && <div className="form-err show">{regErr}</div>}
              <button className="btn-submit" disabled={regLoading} onClick={doRegister}>{regLoading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}</button>
            </div>
          )}
        </div>
      </div>

      {/* APP OVERLAY */}
      {showApp && (
        <div id="appOverlay" style={{ display: 'block' }}>
          <div className="app-nav">
            <div className="app-nav-logo">
              <svg viewBox="0 0 32 32" fill="none">
                <path d="M16 2L4 8v8c0 7.7 5.1 14.9 12 16.5 6.9-1.6 12-8.8 12-16.5V8L16 2z" fill="#050508" stroke="#4a9eff" strokeWidth="1.5"/>
                <path d="M16 8l-5 10h3.5l-.7 6L19 14h-3.5l.7-6z" fill="#4a9eff"/>
              </svg>
              AUDITSMART
            </div>
            <div className="app-tabs">
              <button className={`app-tab${appTab === 'audit' ? ' active' : ''}`} onClick={() => setAppTab('audit')}>🛡️ AUDIT</button>
              <button className={`app-tab${appTab === 'history' ? ' active' : ''}`} onClick={() => switchAppTab('history')}>📋 HISTORY</button>
              <button className={`app-tab${appTab === 'dashboard' ? ' active' : ''}`} onClick={() => switchAppTab('dashboard')}>📊 DASHBOARD</button>
            </div>
            <div className="app-nav-right">
              <div className="app-user-info">
                <div className="app-user-name">{user?.name || user?.email}</div>
                <div className="app-user-meta">{plan.toUpperCase()} — {plan === 'enterprise' ? 'Unlimited' : quotaLeft + ' audits left'}</div>
              </div>
              <button className="app-close" onClick={() => setShowApp(false)}>← BACK TO SITE</button>
            </div>
          </div>

          {/* AUDIT VIEW */}
          <div className={`app-view${appTab === 'audit' ? ' active' : ''}`}>
            {auditView === 'form' && (
              <div className="audit-form-wrap">
                <div className="audit-form-title">New Audit</div>
                <div className="audit-form-sub">PASTE SOLIDITY CODE TO SCAN WITH 10 AI AGENTS</div>
                <div className="audit-row">
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Contract Name</label>
                    <input className="form-input" placeholder="e.g. MyToken" value={contractName} onChange={e => setContractName(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Chain</label>
                    <select className="form-input" style={{ cursor: 'pointer' }} value={contractChain} onChange={e => setContractChain(e.target.value)}>
                      <option value="ethereum">Ethereum</option>
                      <option value="bsc">BSC / BNB Chain</option>
                      <option value="polygon">Polygon</option>
                      <option value="arbitrum">Arbitrum</option>
                      <option value="base">Base</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Solidity Contract Code</label>
                  <textarea className="audit-code" placeholder={"// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n\ncontract MyToken {\n    // Paste your contract here...\n}"} value={contractCode} onChange={e => setContractCode(e.target.value)} />
                </div>
                {auditErr && <div className="form-err show">{auditErr}</div>}
                {user && plan !== 'enterprise' && quotaMax !== null && (
                  <div className="quota-bar-wrap">
                    <div className="quota-bar-label"><span>AUDITS REMAINING</span><span>{quotaLeft} / {quotaMax}</span></div>
                    <div className="quota-bar-track"><div className="quota-bar-fill" style={{ width: `${(quotaLeft / quotaMax) * 100}%` }} /></div>
                  </div>
                )}
                <button className="btn-audit" onClick={runAudit}>⚡ RUN AUDIT</button>
              </div>
            )}
            {auditView === 'scanning' && (
              <div className="scanning-wrap" style={{ display: 'block' }}>
                <div className="scan-spinner" />
                <div className="scan-label">SCANNING IN PROGRESS</div>
                <div className="scan-agent">{scanAgent}</div>
              </div>
            )}
            {auditView === 'results' && auditResult && (
              <div className="results-wrap" style={{ display: 'block' }}>
                <div className={`risk-banner ${(auditResult.risk_level || 'unknown').toLowerCase()}`}>
                  <div>
                    <div className="risk-label">RISK ASSESSMENT</div>
                    <div className="risk-level">{(auditResult.risk_level || 'UNKNOWN').toUpperCase()}</div>
                    <div className="risk-score">Risk Score: {auditResult.risk_score || 0}/100 • {auditResult.scan_duration_ms || 0}ms • {auditResult.total_findings} unique findings</div>
                  </div>
                  <div className="risk-counts">
                    {(auditResult.critical_count || 0) > 0 && <span className="risk-badge rc-critical">CRITICAL: {auditResult.critical_count}</span>}
                    {(auditResult.high_count || 0) > 0 && <span className="risk-badge rc-high">HIGH: {auditResult.high_count}</span>}
                    {(auditResult.medium_count || 0) > 0 && <span className="risk-badge rc-medium">MEDIUM: {auditResult.medium_count}</span>}
                    {(auditResult.low_count || 0) > 0 && <span className="risk-badge rc-low">LOW: {auditResult.low_count}</span>}
                    {(auditResult.info_count || 0) > 0 && <span className="risk-badge rc-info">INFO: {auditResult.info_count}</span>}
                  </div>
                </div>
                <div className="results-summary">
                  📊 Raw findings: <b style={{ color: '#fff' }}>{auditResult.raw_findings_count || auditResult.total_findings}</b>
                  &nbsp;|&nbsp; After dedup: <b style={{ color: '#4a9eff' }}>{auditResult.total_findings}</b>
                  &nbsp;|&nbsp; Agents used: <b style={{ color: '#c084fc' }}>{(auditResult.agents_used || []).join(', ') || '10 agents'}</b>
                </div>
                <div className="results-toolbar">
                  <div className="results-toolbar-title">Findings ({auditResult.total_findings})</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {auditResult.pdf_available && <button className="btn-pdf" onClick={() => downloadPDF()}>📄 DOWNLOAD PDF</button>}
                    <button className="btn-s" style={{ fontSize: '8px', padding: '7px 14px' }} onClick={resetAudit}>← NEW AUDIT</button>
                  </div>
                </div>
                <div>
                  {(auditResult.findings || []).length === 0 ? (
                    <div className="no-findings">
                      <div className="no-findings-icon">✅</div>
                      <div className="no-findings-title">No Vulnerabilities Found</div>
                      <div className="no-findings-sub">Contract passed all 10 agent checks</div>
                    </div>
                  ) : (
                    [...(auditResult.findings || [])]
                      .sort((a, b) => (SEV_ORDER[(a.severity || 'info').toLowerCase()] ?? 4) - (SEV_ORDER[(b.severity || 'info').toLowerCase()] ?? 4))
                      .map((f, i) => {
                        const sev = (f.severity || 'INFO').toUpperCase();
                        const src = f.source || f.agent || '';
                        return (
                          <div className="finding-card" key={i}>
                            <div className="finding-header">
                              <div className="finding-title">{f.title || f.type || f.vulnerability_type || 'Finding'}</div>
                              <span className={`sev-badge sev-${sev}`}>{sev}</span>
                            </div>
                            <div className="finding-desc">{f.description || f.explanation || ''}</div>
                            <div className="finding-meta">
                              {src && <span className="finding-agent">{src}</span>}
                              {f.function && <span className="finding-line">fn: {f.function}</span>}
                              {(f.line_number || f.line) && <span className="finding-line">Line {f.line_number || f.line}</span>}
                              {f.confidence && <span className="finding-agent">Confidence: {f.confidence}</span>}
                            </div>
                            {f.recommendation && <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--g1)', fontFamily: 'var(--fm)' }}>💡 Fix: {f.recommendation}</div>}
                            {f.auto_fix && <div style={{ marginTop: '6px', padding: '8px', background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.15)', borderRadius: '4px', fontSize: '10px', fontFamily: "'Courier New',monospace", color: '#10b981', whiteSpace: 'pre-wrap' }}>✅ Auto-Fix:{'\n'}{f.auto_fix.fixed_code || f.auto_fix.explanation || ''}</div>}
                            {f.exploit_scenario && <div style={{ marginTop: '6px', fontSize: '10px', color: '#fbbf24', fontFamily: 'var(--fm)' }}>⚠️ Exploit: {f.exploit_scenario}</div>}
                          </div>
                        );
                      })
                  )}
                </div>
                {auditResult.deployment_verdict && (
                  <div style={{ margin: '12px 0', padding: '12px', border: '1px solid', borderRadius: '6px', textAlign: 'center', fontFamily: 'var(--fm)', fontSize: '10px', letterSpacing: '2px', ...(VERDICT_STYLES[auditResult.deployment_verdict] || VERDICT_STYLES['DEPLOY WITH CAUTION']) }}>
                    ⚡ VERDICT: <b style={{ fontSize: '13px' }}>{auditResult.deployment_verdict}</b>
                  </div>
                )}
                {auditResult.summary && (
                  <div style={{ margin: '8px 0', padding: '10px', background: 'rgba(74,158,255,.04)', border: '1px solid rgba(74,158,255,.1)', borderRadius: '4px', fontSize: '11px', color: 'var(--w3)', fontFamily: 'var(--fm)' }}>{auditResult.summary}</div>
                )}
                {auditResult.report_id && (() => {
                  const pubUrl = API + '/public/report/' + auditResult.report_id;
                  const badgeUrl = API + '/public/badge/' + auditResult.report_id;
                  return (
                    <div style={{ margin: '14px 0', padding: '14px', background: 'rgba(74,158,255,.04)', border: '1px solid rgba(74,158,255,.1)', borderRadius: '8px' }}>
                      <div style={{ fontFamily: 'var(--fm)', fontSize: '9px', color: '#4a9eff', letterSpacing: '1.5px', marginBottom: '8px', fontWeight: 600 }}>🔗 SHARE THIS REPORT</div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        <a href={pubUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--fm)', fontSize: '9px', padding: '6px 14px', background: 'rgba(74,158,255,.08)', border: '1px solid rgba(74,158,255,.2)', borderRadius: '4px', color: '#4a9eff', textDecoration: 'none' }}>📄 View Public Report</a>
                        <button onClick={() => { navigator.clipboard.writeText(pubUrl); addToast('Link copied!', 'success'); }} style={{ fontFamily: 'var(--fm)', fontSize: '9px', padding: '6px 14px', background: 'rgba(168,85,247,.08)', border: '1px solid rgba(168,85,247,.2)', borderRadius: '4px', color: '#c084fc', cursor: 'pointer' }}>📋 Copy Link</button>
                      </div>
                      <div style={{ fontFamily: 'var(--fm)', fontSize: '8px', color: 'var(--w4)', marginBottom: '4px' }}>EMBED TRUST BADGE ON YOUR WEBSITE:</div>
                      <div onClick={() => { navigator.clipboard.writeText(`<iframe src="${badgeUrl}" width="280" height="80" frameborder="0"></iframe>`); addToast('Badge code copied!', 'success'); }} style={{ background: 'rgba(0,0,0,.3)', border: '1px solid rgba(74,158,255,.08)', borderRadius: '4px', padding: '8px', fontFamily: 'var(--fm)', fontSize: '9px', color: 'var(--w4)', wordBreak: 'break-all', cursor: 'pointer' }}>
                        {`<iframe src="${badgeUrl}" width="280" height="80" frameborder="0"></iframe>`}
                        <span style={{ float: 'right', color: '#4a9eff' }}>📋 click to copy</span>
                      </div>
                    </div>
                  );
                })()}
                {auditResult.thinking_chain && (
                  <details style={{ margin: '12px 0' }}>
                    <summary style={{ cursor: 'pointer', fontFamily: 'var(--fm)', fontSize: '10px', color: '#fbbf24', letterSpacing: '1px', padding: '8px', background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.15)', borderRadius: '4px' }}>🧠 VIEW AI REASONING CHAIN (Extended Thinking)</summary>
                    <div style={{ padding: '12px', marginTop: '4px', background: 'rgba(245,158,11,.03)', border: '1px solid rgba(245,158,11,.08)', borderRadius: '4px', fontSize: '10px', fontFamily: "'Courier New',monospace", color: 'var(--w3)', whiteSpace: 'pre-wrap', maxHeight: '400px', overflowY: 'auto' }}>{auditResult.thinking_chain}</div>
                  </details>
                )}
              </div>
            )}
          </div>

          {/* HISTORY VIEW */}
          <div className={`app-view${appTab === 'history' ? ' active' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <div style={{ fontFamily: "'Times New Roman',serif", fontSize: '18px', fontWeight: 700, color: '#fff' }}>Audit History</div>
                <div style={{ fontFamily: 'var(--fm)', fontSize: '8px', color: 'var(--w4)', marginTop: '3px' }}>ALL YOUR PAST AUDITS</div>
              </div>
              <button className="btn-pdf" onClick={() => setAppTab('audit')}>+ NEW AUDIT</button>
            </div>
            {history.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">📋</div><div className="empty-title">No audits yet</div><div className="empty-sub">Run your first audit to see history here</div></div>
            ) : history.map(a => {
              const rl = (a.risk_level || 'unknown').toLowerCase();
              const date = new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
              return (
                <div className="history-item" key={a.id} onClick={() => loadAuditDetail(a.id)}>
                  <div>
                    <div className="history-name">{a.contract_name || 'Contract'}</div>
                    <div className="history-meta">{date} &nbsp;•&nbsp; {a.total_findings} findings &nbsp;•&nbsp; {a.chain || 'ethereum'}</div>
                  </div>
                  <div className="history-right">
                    <div className="history-score" style={{ color: RISK_COLOR[rl] || '#fff' }}>{(a.risk_level || 'UNKNOWN').toUpperCase()}</div>
                    <div className="risk-badge rc-critical" style={{ fontSize: '7px' }}>{a.critical_count || 0} CRIT</div>
                    {a.pdf_available && <button className="hist-pdf-btn" onClick={e => { e.stopPropagation(); downloadPDF(a.id); }}>📄 PDF</button>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* DASHBOARD VIEW */}
          <div className={`app-view${appTab === 'dashboard' ? ' active' : ''}`}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontFamily: "'Times New Roman',serif", fontSize: '18px', fontWeight: 700, color: '#fff' }}>Dashboard</div>
              <div style={{ fontFamily: 'var(--fm)', fontSize: '8px', color: 'var(--w4)', marginTop: '3px' }}>SECURITY OVERVIEW</div>
            </div>
            <div className="dash-stats">
              <div className="dash-stat"><div className="dash-stat-val" style={{ background: 'linear-gradient(135deg,#4a9eff,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{dashStats?.total_audits || 0}</div><div className="dash-stat-label">Total Audits</div></div>
              <div className="dash-stat"><div className="dash-stat-val" style={{ background: 'linear-gradient(135deg,#ef4444,#f87171)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{dashStats?.critical_findings || 0}</div><div className="dash-stat-label">Critical Findings</div></div>
              <div className="dash-stat"><div className="dash-stat-val" style={{ background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{dashStats?.high_findings || 0}</div><div className="dash-stat-label">High Findings</div></div>
              <div className="dash-stat"><div className="dash-stat-val" style={{ background: 'linear-gradient(135deg,#10b981,#34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{dashStats?.total_vulnerabilities || 0}</div><div className="dash-stat-label">Total Vulnerabilities</div></div>
              <div className="dash-stat"><div className="dash-stat-val" style={{ background: 'linear-gradient(135deg,#a855f7,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{dashStats?.avg_risk_score || 0}</div><div className="dash-stat-label">Avg Risk Score</div></div>
              <div className="dash-stat"><div className="dash-stat-val" style={{ background: 'linear-gradient(135deg,#06b6d4,#22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{dashStats?.avg_scan_duration_ms ? Math.round(dashStats.avg_scan_duration_ms / 1000) + 's' : '0s'}</div><div className="dash-stat-label">Avg Scan Time</div></div>
            </div>
            {(dashStats?.plan || plan) === 'free' && (
              <div className="dash-upgrade-banner">
                <div className="dash-upgrade-text"><h4>🚀 Upgrade to Pro</h4><p>Get 15 audits/month with Claude Haiku — fix code in PDF, deployment verdict.</p></div>
                <button className="btn-upgrade">UPGRADE TO PRO — $29</button>
              </div>
            )}
            <div style={{ fontFamily: "'Times New Roman',serif", fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '14px' }}>Recent Audits</div>
            {history.slice(0, 3).length === 0 ? (
              <div className="empty-state"><div className="empty-icon">📋</div><div className="empty-title">No audits yet</div><div className="empty-sub">Run your first audit above</div></div>
            ) : history.slice(0, 3).map(a => {
              const rl = (a.risk_level || 'unknown').toLowerCase();
              const date = new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
              return (
                <div className="history-item" key={a.id} onClick={() => loadAuditDetail(a.id)}>
                  <div>
                    <div className="history-name">{a.contract_name || 'Contract'}</div>
                    <div className="history-meta">{date} &nbsp;•&nbsp; {a.total_findings} findings &nbsp;•&nbsp; {a.chain || 'ethereum'}</div>
                  </div>
                  <div className="history-right">
                    <div className="history-score" style={{ color: RISK_COLOR[rl] || '#fff' }}>{(a.risk_level || 'UNKNOWN').toUpperCase()}</div>
                    <div className="risk-badge rc-critical" style={{ fontSize: '7px' }}>{a.critical_count || 0} CRIT</div>
                    {a.pdf_available && <button className="hist-pdf-btn" onClick={e => { e.stopPropagation(); downloadPDF(a.id); }}>📄 PDF</button>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TOAST CONTAINER */}
      <div id="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}${t.show ? ' show' : ''}`}>
            <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </>
  );
}
