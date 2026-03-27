export default function Home() {
  return (
    <>
      <style>{`
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
          --c1: #4a9eff; --c2: #06b6d4; --c3: #1a3a6e;
          --m1: #a855f7; --m2: #ec4899; --g1: #10b981; --g2: #f59e0b;
          --w2: #e0e0f0; --w3: #a0a0c0; --w4: #6a6a90;
          --bg: #060610; --glass: rgba(18,18,32,.82); --glass2: rgba(12,12,22,.9);
          --border: rgba(74,158,255,.14); --border2: rgba(74,158,255,.28);
          --fh: 'Orbitron', sans-serif; --fm: 'JetBrains Mono', monospace;
        }
        html { scroll-behavior: smooth; }
        body {
          font-family: 'Times New Roman', Times, Georgia, serif;
          background: #050508;
          background-image:
            radial-gradient(ellipse at top, rgba(74,158,255,.07), transparent 50%),
            radial-gradient(ellipse at bottom right, rgba(168,85,247,.05), transparent 50%);
          color: var(--w2);
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
          font-weight: 400;
          line-height: 1.7;
          font-size: 16px;
        }
        a { color: #4a9eff; text-decoration: none; transition: .3s; }
        button { cursor: pointer; border: none; outline: none; }
        ::selection { background: rgba(74,158,255,.1); color: #fff; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: #050508; }
        ::-webkit-scrollbar-thumb { background: var(--c3); border-radius: 3px; }

        /* NAV */
        nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 14px 36px;
          display: flex; align-items: center; justify-content: space-between;
          backdrop-filter: blur(24px) saturate(1.5);
          background: rgba(5,5,8,.4);
          border-bottom: 1px solid rgba(74,158,255,.03);
          transition: .4s;
        }
        .nlogo { display: flex; align-items: center; gap: 10px; }
        .nlogo svg { width: 28px; height: 28px; filter: drop-shadow(0 0 10px rgba(74,158,255,.35)); }
        .nlogo-t {
          font-family: 'Times New Roman', Times, Georgia, serif;
          font-size: 11px; font-weight: 700; color: #4a9eff; letter-spacing: 3px;
        }
        .nlogo-s {
          font-family: var(--fm); font-size: 5.5px; color: rgba(255,255,255,.55);
          letter-spacing: 1.5px; display: block; margin-top: 2px; white-space: nowrap;
        }
        .nlinks { display: flex; gap: 24px; align-items: center; }
        .nlinks a {
          font-family: var(--fm); font-size: 8px; letter-spacing: 1.5px;
          color: var(--w4); text-transform: uppercase; position: relative; padding: 4px 0;
        }
        .nlinks a::after {
          content: ''; position: absolute; bottom: -2px; left: 0; width: 0; height: 1px;
          background: linear-gradient(90deg, #4a9eff, var(--m1));
          box-shadow: 0 0 4px #4a9eff; transition: .3s;
        }
        .nlinks a:hover { color: #4a9eff; }
        .nlinks a:hover::after { width: 100%; }
        .ncta {
          font-family: 'Times New Roman', Times, Georgia, serif;
          font-size: 7px; letter-spacing: 2px; padding: 8px 18px;
          background: linear-gradient(135deg, rgba(74,158,255,.06), rgba(168,85,247,.03));
          border: 1px solid rgba(74,158,255,.15);
          color: #4a9eff; border-radius: 3px; transition: .4s;
        }
        .ncta:hover { border-color: #4a9eff; box-shadow: 0 0 20px rgba(74,158,255,.15); color: #fff; }

        /* HERO */
        .hero {
          min-height: 100vh; position: relative;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden; padding: 80px 36px 20px;
        }
        .orb { position: absolute; border-radius: 50%; will-change: transform; }
        .orb.o1 {
          width: 800px; height: 800px; top: -25%; right: -15%;
          background: radial-gradient(circle at 30% 40%, rgba(74,158,255,.06), rgba(168,85,247,.03) 50%, transparent 70%);
          filter: blur(80px);
          animation: orbD 20s ease-in-out infinite;
        }
        .orb.o2 {
          width: 600px; height: 600px; bottom: -20%; left: -12%;
          background: radial-gradient(circle at 60% 30%, rgba(236,72,153,.05), rgba(168,85,247,.02) 50%, transparent 70%);
          filter: blur(90px);
          animation: orbD 20s ease-in-out -7s infinite;
        }
        @keyframes orbD {
          0%, 100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(30px,-40px) scale(1.1); }
          66% { transform: translate(-20px,30px) scale(.9); }
        }
        .hgrid {
          position: absolute; bottom: 0; left: -10%; right: -10%; height: 28%;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(74,158,255,.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(74,158,255,.018) 1px, transparent 1px);
          background-size: 50px 50px;
          transform: perspective(600px) rotateX(55deg);
          transform-origin: bottom;
          mask-image: linear-gradient(to top, rgba(0,0,0,.2), transparent);
          animation: gA 5s linear infinite;
        }
        @keyframes gA { to { background-position: 0 50px; } }
        .hscan {
          position: absolute; left: 0; right: 0; height: 1px; z-index: 3;
          pointer-events: none;
          background: linear-gradient(90deg, transparent 5%, rgba(74,158,255,.2) 30%, rgba(168,85,247,.15) 70%, transparent 95%);
          box-shadow: 0 0 20px rgba(74,158,255,.1);
          animation: scanV 7s ease-in-out infinite;
        }
        @keyframes scanV {
          0%, 100% { top: -1px; opacity: 0; }
          8% { opacity: 1; }
          92% { opacity: 1; }
          100% { top: 100%; }
        }
        .hc { position: relative; z-index: 5; max-width: 780px; text-align: center; }

        /* VORTEX */
        .vortex-wrap {
          margin: 0 auto 14px; width: 220px; height: 220px; position: relative;
          opacity: 0; animation: fu .8s ease .15s forwards;
        }
        .v-ring {
          position: absolute; border-radius: 50%;
          border: 1px solid rgba(74,158,255,.04);
          animation: vRing 3s ease-in-out infinite;
        }
        .v-ring.r1 { inset: -10px; border-color: rgba(74,158,255,.07); animation-delay: 0s; }
        .v-ring.r2 { inset: -26px; border-color: rgba(168,85,247,.05); animation-delay: -1s; }
        .v-ring.r3 { inset: -44px; border-color: rgba(74,158,255,.03); animation-delay: -2s; }
        @keyframes vRing {
          0%, 100% { transform: scale(1); opacity: .5; }
          50% { transform: scale(1.04); opacity: 1; }
        }
        .v-as {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          z-index: 10; pointer-events: none;
        }
        .v-as-text {
          font-family: 'Times New Roman', Times, Georgia, serif;
          font-size: 42px; font-weight: 700; font-style: italic; position: relative;
          animation: asBreathe 3s ease-in-out infinite; letter-spacing: 3px;
        }
        .as-bg {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Times New Roman', Times, Georgia, serif;
          font-size: 42px; font-weight: 700; font-style: italic; letter-spacing: 3px;
          color: transparent; -webkit-text-stroke: 1px rgba(74,158,255,.12);
          filter: blur(5px);
          animation: asBreathe 3s ease-in-out -.5s infinite;
        }
        .as-main {
          position: relative;
          background: linear-gradient(180deg, #ffffff 0%, #e8f4ff 30%, #4a9eff 55%, #a855f7 80%, #ec4899 100%);
          background-size: 100% 200%;
          animation: asGrad 4s ease-in-out infinite;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          filter: drop-shadow(0 0 6px rgba(74,158,255,.4)) drop-shadow(0 0 16px rgba(74,158,255,.15));
        }
        @keyframes asGrad {
          0%, 100% { background-position: 0% 0%; }
          50% { background-position: 0% 100%; }
        }
        @keyframes asBreathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        .v-glow {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
          width: 80px; height: 80px; border-radius: 50%;
          background: radial-gradient(circle, rgba(74,158,255,.08), rgba(168,85,247,.03) 50%, transparent 70%);
          animation: vGlow 2.5s ease-in-out infinite;
          z-index: 5; pointer-events: none;
        }
        @keyframes vGlow {
          0%, 100% { opacity: .4; transform: translate(-50%,-50%) scale(1); }
          50% { opacity: .9; transform: translate(-50%,-50%) scale(1.3); }
        }

        /* BADGE */
        .hbadge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 5px 16px;
          border: 1px solid rgba(74,158,255,.15); border-radius: 100px;
          font-family: var(--fm); font-size: 8px; color: rgba(74,158,255,.4);
          letter-spacing: 1.5px; margin-bottom: 16px;
          backdrop-filter: blur(12px);
          background: linear-gradient(135deg, rgba(74,158,255,.02), rgba(168,85,247,.01));
          opacity: 0; animation: fu .6s ease .5s forwards;
        }
        .hbadge .dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--g1); box-shadow: 0 0 6px var(--g1);
          animation: pulse 2.5s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .3; transform: scale(.7); }
        }

        /* TITLE */
        .htitle {
          font-family: 'Times New Roman', Times, Georgia, serif;
          font-weight: 800; font-size: clamp(24px, 5vw, 50px);
          color: #fff; line-height: 1.08; margin-bottom: 4px;
        }
        .htitle .ln { display: block; overflow: hidden; }
        .htitle .ln span {
          display: inline-block; opacity: 0;
          animation: sUp .7s cubic-bezier(.16,1,.3,1) forwards;
        }
        .htitle .ln:nth-child(1) span { animation-delay: .65s; }
        .htitle .ln:nth-child(2) span { animation-delay: .8s; }
        .htitle .ln:nth-child(3) span { animation-delay: .95s; }
        @keyframes sUp {
          from { opacity: 0; transform: translateY(110%); }
          to { opacity: 1; transform: translateY(0); }
        }
        .htitle .grad {
          background: linear-gradient(135deg, #4a9eff 0%, #a855f7 40%, #ec4899 70%, #f59e0b 100%);
          background-size: 300% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          animation: gX 4s linear infinite;
        }
        @keyframes gX {
          0% { background-position: 0%; }
          100% { background-position: 300%; }
        }
        .hsub {
          font-family: 'Times New Roman', Times, Georgia, serif;
          font-size: clamp(13px, 1.5vw, 16px); color: var(--w3);
          max-width: 500px; margin: 12px auto 24px; line-height: 1.85;
          opacity: 0; animation: fu .6s ease 1.05s forwards;
        }
        @keyframes fu {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* BUTTONS */
        .hbtns {
          display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;
          opacity: 0; animation: fu .6s ease 1.15s forwards;
        }
        .btn-p {
          font-family: 'Times New Roman', Times, Georgia, serif;
          font-size: 9px; letter-spacing: 2px; padding: 12px 28px;
          background: linear-gradient(135deg, rgba(74,158,255,.12), rgba(6,182,212,.06));
          border: 1px solid rgba(74,158,255,.2); color: #fff; border-radius: 3px;
          transition: .4s; position: relative; overflow: hidden;
        }
        .btn-p:hover {
          border-color: rgba(74,158,255,.5);
          box-shadow: 0 0 30px rgba(74,158,255,.15);
          transform: translateY(-2px);
        }
        .btn-s {
          font-family: var(--fm); font-size: 8px; letter-spacing: 1.5px;
          padding: 12px 20px; background: transparent;
          border: 1px solid rgba(255,255,255,.06); color: var(--w3); border-radius: 3px;
          transition: .3s;
        }
        .btn-s:hover { border-color: rgba(255,255,255,.15); color: #fff; }

        /* RADAR */
        .radar-wrap {
          margin: 20px auto 0; width: 120px; height: 120px; position: relative;
          z-index: 5; opacity: 0; animation: fu .6s ease 1.4s forwards;
        }
        .radar {
          width: 100%; height: 100%; border-radius: 50%; position: relative;
          border: 1px solid rgba(74,158,255,.06);
          background: rgba(74,158,255,.008);
        }
        .radar::before {
          content: ''; position: absolute; inset: 30%;
          border-radius: 50%; border: 1px solid rgba(74,158,255,.04);
        }
        .radar-cross { position: absolute; inset: 0; }
        .radar-cross::before {
          content: ''; position: absolute; top: 50%; left: 0; right: 0;
          height: 1px; background: rgba(74,158,255,.03);
        }
        .radar-cross::after {
          content: ''; position: absolute; left: 50%; top: 0; bottom: 0;
          width: 1px; background: rgba(74,158,255,.03);
        }
        .radar-sweep {
          position: absolute; inset: 0; border-radius: 50%;
          animation: sweep 3s linear infinite;
        }
        .radar-sweep::before {
          content: ''; position: absolute; top: 0; left: 50%; width: 50%; height: 50%;
          transform-origin: bottom left;
          background: conic-gradient(from 0deg, transparent, rgba(74,158,255,.15) 30deg, rgba(6,182,212,.08) 50deg, transparent 60deg);
          border-radius: 0 100% 0 0;
        }
        @keyframes sweep { to { transform: rotate(360deg); } }
        .radar-blip {
          position: absolute; width: 3px; height: 3px; border-radius: 50%;
          background: #4a9eff; box-shadow: 0 0 4px #4a9eff;
          animation: blipP 2s ease-in-out infinite;
        }
        .radar-blip:nth-child(4) { top: 28%; left: 62%; }
        .radar-blip:nth-child(5) {
          top: 55%; left: 30%;
          background: #f59e0b; box-shadow: 0 0 4px #f59e0b; animation-delay: .7s;
        }
        .radar-blip:nth-child(6) {
          top: 70%; left: 65%;
          background: #ef4444; box-shadow: 0 0 4px #ef4444; animation-delay: 1.4s;
        }
        @keyframes blipP {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .3; transform: scale(.5); }
        }
        .radar-center {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
          width: 4px; height: 4px; border-radius: 50%;
          background: #4a9eff; box-shadow: 0 0 8px #4a9eff;
        }
        .radar-label {
          position: absolute; bottom: -18px; left: 50%; transform: translateX(-50%);
          font-family: var(--fm); font-size: 6px; color: var(--w4);
          letter-spacing: 2px; white-space: nowrap;
        }

        /* PROOF STATS */
        .proof { padding: 24px 36px 0; position: relative; z-index: 5; }
        .proof-in {
          max-width: 860px; margin: 0 auto;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(74,158,255,.05); border-radius: 6px;
          backdrop-filter: blur(20px);
          background: linear-gradient(135deg, var(--glass), var(--glass2));
          position: relative; overflow: hidden;
          box-shadow: 0 10px 40px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.02);
        }
        .proof-in::before {
          content: ''; position: absolute; top: 0; left: -60%; width: 50%; height: 1px;
          background: linear-gradient(90deg, transparent, #4a9eff, var(--m1), transparent);
          animation: shimA 4s linear infinite;
        }
        @keyframes shimA {
          0% { left: -50%; }
          100% { left: 150%; }
        }
        .ps { text-align: center; flex: 1; padding: 18px 0; position: relative; }
        .ps + .ps::before {
          content: ''; position: absolute; left: 0; top: 20%; height: 60%;
          width: 1px; background: rgba(74,158,255,.04);
        }
        .ps-n {
          font-family: 'Times New Roman', Times, Georgia, serif;
          font-size: 20px; font-weight: 700;
          background: linear-gradient(180deg, #fff, #4a9eff);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          line-height: 1;
        }
        .ps-l {
          font-family: var(--fm); font-size: 6px; letter-spacing: 2px;
          color: var(--w4); margin-top: 3px; text-transform: uppercase;
        }

        /* POWERED BY */
        .powered-strip { padding: 20px 36px 0; text-align: center; position: relative; z-index: 5; }
        .powered-label {
          font-family: var(--fm); font-size: 7px; letter-spacing: 3px;
          color: var(--w4); margin-bottom: 12px; text-transform: uppercase;
        }
        .powered-logos {
          display: flex; align-items: center; justify-content: center;
          gap: 20px; flex-wrap: wrap;
        }
        .powered-item {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 14px;
          border: 1px solid rgba(255,255,255,.04); border-radius: 8px;
          background: linear-gradient(135deg, rgba(255,255,255,.02), transparent);
          transition: .4s; cursor: default;
        }
        .pw-name {
          font-family: 'Times New Roman', Times, Georgia, serif;
          font-size: 12px; font-weight: 700; color: #fff; letter-spacing: 1px;
        }
        .pw-sub { font-family: var(--fm); font-size: 6.5px; color: var(--w4); letter-spacing: .5px; margin-left: 2px; }
        .powered-div { width: 1px; height: 20px; background: rgba(255,255,255,.06); }
      `}</style>

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
            10 AI AGENTS &nbsp;•&nbsp; GROQ + GEMINI + <span style={{color:'#d97757',fontWeight:600}}>CLAUDE</span> + SLITHER &nbsp;•&nbsp; &lt; 60 SECONDS
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
