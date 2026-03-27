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
    </>
  );
}
