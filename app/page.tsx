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
        <button className="ncta">LOGIN</button>
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
            <button className="btn-p">START FREE AUDIT</button>
            <button className="btn-s">HOW IT WORKS ↓</button>
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
    </>
  );
}
