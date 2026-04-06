# AuditSmart v3.1
### AI-Powered Smart Contract Security

> **⚠️ Disclaimer:** AuditSmart is an AI-assisted security screening tool. Reports are NOT certified security audits. For production contracts handling significant value, a professional manual audit is strongly recommended alongside this tool.

---

## What It Does

AuditSmart runs 10 AI agents in parallel against your Solidity contract and returns a deduplicated, severity-ranked vulnerability report in under 60 seconds — with a downloadable PDF and shareable public link.

**Detection coverage:** Reentrancy · Integer overflow · Access control · Business logic · Gas/DoS · DeFi exploits · Backdoors · Signature replay · Oracle manipulation · Slither static analysis

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI + Uvicorn on Railway |
| Database | MongoDB Atlas (Motor async) |
| AI agents | Groq LLaMA 3.3 70B × 8 specialist agents |
| Orchestrator (Pro) | Claude Haiku (Anthropic) |
| Orchestrator (Enterprise) | Claude Sonnet (Anthropic) |
| Deep Audit | Claude Opus + Extended Thinking |
| Cross-validator | Gemini 1.5 Pro (Google) |
| Static analysis | Slither (Crytic) |
| Payments | Razorpay (INR/USD geo-pricing) |
| Frontend | Single `index.html` on Hostinger |
| PDF reports | ReportLab + pypdf (encrypted) |

---

## Project Structure

```
auditsmart/
├── app/
│   ├── agents/
│   │   ├── groq_agent.py        # 8 specialist Groq agents
│   │   ├── claude_agent.py      # Claude Haiku/Sonnet/Opus routing
│   │   ├── gemini_agent.py      # Gemini cross-validator
│   │   ├── slither_agent.py     # Static analysis
│   │   └── pipeline.py          # Main orchestration pipeline
│   ├── routes/
│   │   ├── audit.py             # Scan + PDF + Deep Audit endpoints
│   │   ├── auth.py              # Login / Register
│   │   ├── dashboard.py         # Stats
│   │   ├── payment.py           # Razorpay + Plans
│   │   └── public.py            # Public reports + badge system
│   ├── services/
│   │   ├── dedup_engine.py      # Dedup + false positive filter
│   │   └── pdf_generator.py     # PDF generation + encryption
│   ├── utils/
│   │   └── auth.py              # JWT + bcrypt
│   ├── config.py                # All settings (pydantic-settings)
│   ├── database.py              # MongoDB connection + indexes
│   └── main.py                  # FastAPI app + middleware
├── index.html                   # Full frontend (landing + app)
├── requirements.txt
├── Procfile
├── railway.toml
├── .env.example
└── README.md
```

---

## Setup & Deployment

### Prerequisites
- Python 3.11+
- MongoDB Atlas account (free tier works)
- Groq API key — [console.groq.com](https://console.groq.com) (~$5/mo Dev Tier)
- Anthropic API key — [console.anthropic.com](https://console.anthropic.com) ($10 credit)
- Gemini API key — [aistudio.google.com](https://aistudio.google.com) (free tier)
- Razorpay account — [razorpay.com](https://razorpay.com) (live keys)

### Local Development

```bash
# 1. Clone and install
git clone https://github.com/IDevNation/auditsmart_v2
cd auditsmart_v2
pip install -r requirements.txt

# 2. Create .env from example
cp .env.example .env
# Fill in all required keys

# 3. Run
uvicorn app.main:app --reload --port 8000

# 4. Test
curl http://localhost:8000/health
# → {"status":"ok","version":"3.1.0"}
```

### Production Deployment (Railway)

```bash
# Deploy via GitHub push (Railway auto-deploys on main branch)
git add -A
git commit -m "Deploy AuditSmart v3.1"
git push origin main

# Verify
curl https://web-production-de7ca.up.railway.app/health
```

### Required Environment Variables

```env
# Database
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/auditsmart

# Auth
JWT_SECRET=your-super-secret-key-min-32-chars

# AI APIs
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxx

# Payments
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# App
FRONTEND_URL=https://zylithium.org
PDF_ENABLED=true
```

---

## API Reference

### Authentication

```http
POST /auth/register
Content-Type: application/json

{ "name": "Rajat", "email": "rajat@example.com", "password": "password123" }

→ { "access_token": "...", "user": { "plan": "free", "free_audits_remaining": 3 } }
```

```http
POST /auth/login
Content-Type: application/json

{ "email": "rajat@example.com", "password": "password123" }

→ { "access_token": "...", "user": { ... } }
```

### Run an Audit

```http
POST /audit/scan
Authorization: Bearer {token}
Content-Type: application/json

{
  "contract_code": "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n...",
  "contract_name": "MyToken",
  "chain": "ethereum"
}
```

**Response:**
```json
{
  "id": "...",
  "report_id": "AS-2026-00001",
  "risk_level": "critical",
  "risk_score": 85,
  "total_findings": 12,
  "critical_count": 3,
  "high_count": 4,
  "medium_count": 3,
  "low_count": 2,
  "findings": [
    {
      "type": "Reentrancy in withdraw()",
      "severity": "critical",
      "function": "withdraw",
      "line": "145",
      "description": "State updated after external call...",
      "recommendation": "Apply CEI pattern...",
      "confidence": "high",
      "source": "reentrancy_agent"
    }
  ],
  "summary": "...",
  "pdf_available": true,
  "deployment_verdict": "DO NOT DEPLOY",
  "verify_url": "https://zylithium.org/verify/AS-2026-00001"
}
```

### Download PDF Report

```http
GET /audit/report/{audit_id}/pdf
Authorization: Bearer {token}

→ application/pdf (encrypted, branded)
```

### Public Report (No Auth)

```http
GET /public/report/{report_id}
→ HTML shareable report page

GET /public/report/{report_id}/json
→ JSON report data

GET /public/badge/{report_id}
→ HTML embeddable trust badge
```

### Verify a Report

```http
GET /audit/verify/{report_id}
→ { "verified": true, "report": { ... } }
```

---

## Plan Structure

| Plan | Price | Audits | AI Engine | Extra Features |
|------|-------|--------|-----------|---------------|
| Free | $0 | 3/mo | Groq (8 agents) | PDF report |
| Pro | $29/mo | 15/mo | + Claude Haiku | Fix code in PDF, deployment verdict |
| Enterprise | $49/mo | 20/mo | + Claude Sonnet | Exploit scenarios, patched code, API |
| Deep Audit | $20/audit | 1 | Claude Opus + Thinking | Full reasoning chain, maximum depth |

---

## Security Architecture

- **Zero code storage** — contract code is never persisted. Only SHA256 hash retained.
- **Report IDs** — every audit gets `AS-YYYY-XXXXX` for public verification.
- **PDF encryption** — owner-password protection via pypdf. Reports cannot be edited.
- **JWT auth** — 48h expiry, bcrypt passwords, HTTPS-only CORS.
- **Rate limiting** — SlowAPI: 3 scans/minute per IP.
- **Security headers** — X-Frame-Options, X-XSS-Protection, Referrer-Policy, etc.

---

## Known Limitations

- Detection rate: ~56% on complex contracts (vs 80%+ for manual audits)
- Slither requires local installation — not available on Railway free tier
- Extended Thinking (Deep Audit) adds ~90s scan time
- Gemini skipped on free plan to preserve quota

---

## Roadmap

- [ ] Phase 2 (Now): Activate Groq Dev Tier, recharge Anthropic, Razorpay live keys
- [ ] Phase 3 (Launch): PinkSale outreach, Twitter content, first 10 customers
- [ ] Phase 4: Stripe, NOWPayments (crypto), audit firm partnerships
- [ ] Phase 5: XOR token as subscription payment, API marketplace

---

## License

© 2026 Xorion Network LLC. All rights reserved.

This product is proprietary software. The audit reports generated are AI assessments only and do not constitute certified security audits. Xorion Network LLC accepts no liability for contract exploits or losses.

---

*Built with Claude (Anthropic) · Groq · Gemini · Slither*
