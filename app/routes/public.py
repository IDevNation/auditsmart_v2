"""
AuditSmart v3.1 — Public Routes (No Auth Required)

Endpoints:
  GET /public/report/{report_id}       → Public HTML report page (shareable link)
  GET /public/report/{report_id}/json  → Public report data as JSON
  GET /public/report/{report_id}/pdf   → Public PDF download
  GET /public/badge/{report_id}        → Embeddable trust badge (HTML)
  GET /public/badge/{report_id}/svg    → Badge as SVG image
  GET /public/badge/{report_id}/js     → Badge as embeddable JS snippet
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse, Response
from app.database import get_db
from app.config import settings
from datetime import datetime

router = APIRouter()


# ── HELPER ────────────────────────────────────────────────────────────────────
async def _get_public_audit(report_id: str) -> dict:
    """Fetch audit by report_id. Returns safe public data only."""
    db = get_db()
    audit = await db.audits.find_one(
        {"report_id": report_id},
        {
            # Include public-safe fields only
            "report_id": 1, "contract_name": 1, "chain": 1,
            "contract_hash": 1, "contract_size_chars": 1,
            "risk_level": 1, "risk_score": 1,
            "total_findings": 1, "critical_count": 1,
            "high_count": 1, "medium_count": 1, "low_count": 1,
            "info_count": 1, "agents_used": 1, "scan_duration_ms": 1,
            "plan_used": 1, "deployment_verdict": 1,
            "findings": 1, "summary": 1,
            "is_verified": 1, "version": 1, "created_at": 1,
            "pdf_base64": 1, "pdf_available": 1,
            # NEVER expose: user_id, thinking_chain, contract code
        }
    )
    if not audit:
        raise HTTPException(404, "Report not found")
    return audit


def _sanitize_findings(findings: list) -> list:
    """Sanitize findings for public display — remove internal metadata."""
    safe = []
    for f in findings:
        safe.append({
            "title": f.get("title") or f.get("type") or f.get("vulnerability_type", "Finding"),
            "severity": (f.get("severity") or "info").upper(),
            "description": f.get("description") or f.get("explanation", ""),
            "recommendation": f.get("recommendation", ""),
            "function": f.get("function", ""),
            "line": f.get("line_number") or f.get("line", ""),
            "confidence": f.get("confidence", ""),
            "source": f.get("source") or f.get("agent", ""),
            # Pro/Enterprise: include fix code if available
            "auto_fix": f.get("auto_fix") if isinstance(f.get("auto_fix"), dict) else None,
            "exploit_scenario": f.get("exploit_scenario", ""),
        })
    return safe


def _risk_color(level: str) -> str:
    colors = {
        "critical": "#ef4444", "high": "#f59e0b",
        "medium": "#eab308", "low": "#4a9eff", "info": "#8080a0"
    }
    return colors.get(level.lower(), "#8080a0")


def _format_date(dt) -> str:
    if isinstance(dt, datetime):
        return dt.strftime("%B %d, %Y at %H:%M UTC")
    if isinstance(dt, str):
        try:
            d = datetime.fromisoformat(dt.replace("Z", "+00:00"))
            return d.strftime("%B %d, %Y at %H:%M UTC")
        except Exception:
            return dt
    return "N/A"


DISCLAIMER = (
    "This is an AI-generated security assessment by AuditSmart. "
    "It is NOT a certified security audit and does not guarantee "
    "the absence of vulnerabilities. For production contracts, "
    "a professional manual audit is strongly recommended."
)


# ══════════════════════════════════════════════════════════════════════════════
# FEATURE 1: PUBLIC REPORT PAGE
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/report/{report_id}", response_class=HTMLResponse)
async def public_report_page(report_id: str):
    """
    Public shareable report page. No auth needed.
    URL: auditsmart.org/report/AS-2026-00001
    """
    audit = await _get_public_audit(report_id)

    risk_level = (audit.get("risk_level") or "unknown").upper()
    risk_score = audit.get("risk_score", 0)
    risk_color = _risk_color(risk_level)
    contract_name = audit.get("contract_name", "Contract")
    chain = (audit.get("chain") or "ethereum").capitalize()
    contract_hash = audit.get("contract_hash", "")
    hash_display = f"{contract_hash[:16]}...{contract_hash[-8:]}" if len(contract_hash) > 24 else contract_hash
    created = _format_date(audit.get("created_at"))
    total = audit.get("total_findings", 0)
    critical = audit.get("critical_count", 0)
    high = audit.get("high_count", 0)
    medium = audit.get("medium_count", 0)
    low = audit.get("low_count", 0)
    info = audit.get("info_count", 0)
    verdict = audit.get("deployment_verdict", "")
    summary = audit.get("summary", "")
    agents = audit.get("agents_used", [])
    duration = audit.get("scan_duration_ms", 0)
    pdf_available = audit.get("pdf_available", False)

    findings = _sanitize_findings(audit.get("findings", []))
    # Sort by severity
    sev_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3, "INFO": 4}
    findings.sort(key=lambda f: sev_order.get(f["severity"], 5))

    # Build findings HTML
    findings_html = ""
    if not findings:
        findings_html = """
        <div style="text-align:center;padding:32px;background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.2);border-radius:8px;margin:16px 0">
            <div style="font-size:28px;margin-bottom:8px">✅</div>
            <div style="font-size:14px;color:#34d399;font-weight:700">No Vulnerabilities Found</div>
            <div style="font-size:11px;color:#6a6a90;margin-top:4px">Contract passed all agent checks</div>
        </div>"""
    else:
        for i, f in enumerate(findings, 1):
            sev = f["severity"]
            sev_col = _risk_color(sev)
            fix_html = ""
            if f.get("auto_fix") and f["auto_fix"].get("fixed_code"):
                code = f["auto_fix"]["fixed_code"].replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                fix_html = f"""
                <div style="margin-top:8px;padding:10px;background:rgba(16,185,129,.05);border:1px solid rgba(16,185,129,.15);border-radius:6px">
                    <div style="font-size:10px;color:#10b981;font-weight:700;margin-bottom:4px">✅ FIX CODE:</div>
                    <pre style="font-size:10px;color:#e0f0ff;background:#0a0a18;padding:10px;border-radius:4px;overflow-x:auto;white-space:pre-wrap">{code}</pre>
                </div>"""

            exploit_html = ""
            if f.get("exploit_scenario"):
                exploit_html = f"""
                <div style="margin-top:6px;font-size:10px;color:#fbbf24;background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.12);padding:8px;border-radius:4px">
                    ⚠️ <b>Exploit:</b> {f['exploit_scenario']}
                </div>"""

            rec_html = ""
            if f.get("recommendation"):
                rec_html = f'<div style="margin-top:6px;font-size:11px;color:#10b981">💡 {f["recommendation"]}</div>'

            meta_parts = []
            if f.get("source"):
                meta_parts.append(f'<span style="background:rgba(74,158,255,.08);border:1px solid rgba(74,158,255,.12);padding:2px 6px;border-radius:4px;font-size:9px;color:#6a6a90">{f["source"]}</span>')
            if f.get("function"):
                meta_parts.append(f'<span style="font-size:9px;color:#6a6a90">fn: {f["function"]}</span>')
            if f.get("line"):
                meta_parts.append(f'<span style="font-size:9px;color:#6a6a90">Line {f["line"]}</span>')
            meta_html = f'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">{"".join(meta_parts)}</div>' if meta_parts else ""

            findings_html += f"""
            <div style="background:rgba(15,15,25,.6);border:1px solid rgba(74,158,255,.08);border-radius:8px;padding:14px 18px;margin-bottom:10px">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:6px">
                    <div style="font-size:13px;color:#fff;font-weight:600">#{i} — {f['title']}</div>
                    <span style="font-size:9px;padding:3px 8px;border-radius:10px;font-weight:700;white-space:nowrap;background:rgba({','.join(str(int(sev_col.lstrip('#')[j:j+2], 16)) for j in (0,2,4))},.15);color:{sev_col};border:1px solid rgba({','.join(str(int(sev_col.lstrip('#')[j:j+2], 16)) for j in (0,2,4))},.3)">{sev}</span>
                </div>
                <div style="font-size:11px;color:#a0a0c0;line-height:1.7">{f['description']}</div>
                {meta_html}{rec_html}{fix_html}{exploit_html}
            </div>"""

    # Verdict HTML
    verdict_html = ""
    if verdict:
        vc = {"SAFE TO DEPLOY": "#10b981", "DEPLOY WITH CAUTION": "#f59e0b", "DO NOT DEPLOY": "#ef4444"}.get(verdict, "#6a6a90")
        verdict_html = f"""
        <div style="text-align:center;padding:14px;border:1.5px solid {vc};border-radius:8px;margin:16px 0;background:rgba({','.join(str(int(vc.lstrip('#')[j:j+2], 16)) for j in (0,2,4))},.06)">
            <div style="font-size:9px;color:#6a6a90;letter-spacing:2px;margin-bottom:4px">DEPLOYMENT VERDICT</div>
            <div style="font-size:18px;font-weight:800;color:{vc}">{verdict}</div>
        </div>"""

    # Severity badges
    badges_html = ""
    if critical: badges_html += f'<span style="font-size:10px;padding:4px 10px;border-radius:12px;background:rgba(239,68,68,.12);color:#f87171;border:1px solid rgba(239,68,68,.25)">CRITICAL: {critical}</span>'
    if high: badges_html += f'<span style="font-size:10px;padding:4px 10px;border-radius:12px;background:rgba(245,158,11,.12);color:#fbbf24;border:1px solid rgba(245,158,11,.25)">HIGH: {high}</span>'
    if medium: badges_html += f'<span style="font-size:10px;padding:4px 10px;border-radius:12px;background:rgba(234,179,8,.1);color:#fde047;border:1px solid rgba(234,179,8,.2)">MEDIUM: {medium}</span>'
    if low: badges_html += f'<span style="font-size:10px;padding:4px 10px;border-radius:12px;background:rgba(74,158,255,.12);color:#7db3ff;border:1px solid rgba(74,158,255,.2)">LOW: {low}</span>'

    # PDF download button
    pdf_btn = ""
    if pdf_available:
        pdf_btn = f'<a href="/public/report/{report_id}/pdf" style="display:inline-block;padding:8px 18px;background:rgba(168,85,247,.1);border:1px solid rgba(168,85,247,.2);border-radius:5px;color:#c084fc;font-size:11px;text-decoration:none;letter-spacing:1px;transition:.3s">📄 DOWNLOAD PDF</a>'

    # Badge embed snippet
    badge_snippet = f'&lt;iframe src="https://web-production-de7ca.up.railway.app/public/badge/{report_id}" width="280" height="80" frameborder="0"&gt;&lt;/iframe&gt;'

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>AuditSmart Report — {contract_name} | {report_id}</title>
<meta name="description" content="AI Security Assessment for {contract_name} — Risk: {risk_level} ({risk_score}/100) — {total} findings detected by 10 AI agents">
<meta property="og:title" content="AuditSmart Report — {contract_name}">
<meta property="og:description" content="Risk: {risk_level} ({risk_score}/100) — {total} findings — Powered by Claude, Groq, Gemini & Slither">
<meta property="og:type" content="website">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{font-family:'Segoe UI',system-ui,sans-serif;background:#050508;color:#e0e0f0;min-height:100vh}}
.wrap{{max-width:800px;margin:0 auto;padding:24px 20px 60px}}
a{{color:#4a9eff;text-decoration:none}}
.header{{display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid rgba(74,158,255,.08);margin-bottom:24px}}
.logo{{font-size:11px;font-weight:700;color:#4a9eff;letter-spacing:3px}}
.logo-sub{{font-size:7px;color:#6a6a90;letter-spacing:1.5px;display:block;margin-top:2px}}
.disclaimer{{background:rgba(245,158,11,.04);border:1px solid rgba(245,158,11,.15);border-radius:6px;padding:10px 14px;font-size:10px;color:#c0a060;margin-bottom:20px;line-height:1.6}}
.risk-card{{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:18px 22px;border-radius:10px;margin-bottom:16px;flex-wrap:wrap;
  background:linear-gradient(135deg,rgba({','.join(str(int(risk_color.lstrip('#')[j:j+2], 16)) for j in (0,2,4))},.1),rgba({','.join(str(int(risk_color.lstrip('#')[j:j+2], 16)) for j in (0,2,4))},.03));
  border:1px solid rgba({','.join(str(int(risk_color.lstrip('#')[j:j+2], 16)) for j in (0,2,4))},.25)}}
.badges{{display:flex;gap:8px;flex-wrap:wrap}}
.meta-row{{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px}}
.meta-item{{background:rgba(15,15,25,.6);border:1px solid rgba(74,158,255,.06);border-radius:6px;padding:10px 14px}}
.meta-label{{font-size:8px;color:#6a6a90;letter-spacing:1.5px;text-transform:uppercase}}
.meta-val{{font-size:13px;color:#fff;font-weight:600;margin-top:2px}}
.section-title{{font-size:14px;font-weight:700;color:#fff;margin:20px 0 10px}}
.powered{{display:flex;align-items:center;justify-content:center;gap:20px;flex-wrap:wrap;padding:14px;margin:20px 0;background:rgba(74,158,255,.03);border:1px solid rgba(74,158,255,.06);border-radius:6px}}
.pw-item{{font-size:11px;color:#fff}}.pw-item span{{font-size:8px;color:#6a6a90}}
.footer{{text-align:center;padding:20px 0;border-top:1px solid rgba(74,158,255,.06);margin-top:30px;font-size:9px;color:#6a6a90}}
.embed-box{{background:rgba(0,0,0,.3);border:1px solid rgba(74,158,255,.1);border-radius:6px;padding:12px;margin:10px 0;font-family:'JetBrains Mono',monospace;font-size:10px;color:#a0a0c0;word-break:break-all}}
@media(max-width:600px){{.meta-row{{grid-template-columns:1fr}}.risk-card{{flex-direction:column;text-align:center}}.badges{{justify-content:center}}}}
</style>
</head>
<body>
<div class="wrap">
    <div class="header">
        <div><span class="logo">AUDITSMART</span><span class="logo-sub">AI SECURITY PLATFORM</span></div>
        <a href="{settings.FRONTEND_URL}" style="font-size:10px;padding:6px 14px;border:1px solid rgba(74,158,255,.2);border-radius:4px;color:#4a9eff;letter-spacing:1px">RUN FREE AUDIT →</a>
    </div>

    <div class="disclaimer">⚠️ {DISCLAIMER}</div>

    <div style="font-size:10px;color:#6a6a90;margin-bottom:4px;letter-spacing:1.5px">REPORT {report_id}</div>
    <h1 style="font-size:22px;font-weight:800;color:#fff;margin-bottom:4px">{contract_name}</h1>
    <div style="font-size:11px;color:#6a6a90;margin-bottom:16px">{chain} · {created} · Hash: <code style="font-size:9px;color:#4a9eff">{hash_display}</code></div>

    <div class="risk-card">
        <div>
            <div style="font-size:9px;color:#6a6a90;letter-spacing:2px;margin-bottom:4px">RISK ASSESSMENT</div>
            <div style="font-size:26px;font-weight:800;color:{risk_color}">{risk_level}</div>
            <div style="font-size:10px;color:#6a6a90;margin-top:2px">Score: {risk_score}/100 · {total} findings · {duration}ms</div>
        </div>
        <div class="badges">{badges_html}</div>
    </div>

    {verdict_html}

    <div class="meta-row">
        <div class="meta-item"><div class="meta-label">Agents Used</div><div class="meta-val">{len(agents)}</div></div>
        <div class="meta-item"><div class="meta-label">Scan Duration</div><div class="meta-val">{duration}ms</div></div>
    </div>

    {"<div style='font-size:12px;color:#a0a0c0;line-height:1.7;margin-bottom:16px;padding:10px 14px;background:rgba(74,158,255,.03);border:1px solid rgba(74,158,255,.06);border-radius:6px'>" + summary + "</div>" if summary else ""}

    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
        <div class="section-title">Findings ({total})</div>
        {pdf_btn}
    </div>

    {findings_html}

    <div class="powered">
        <div style="font-size:8px;color:#6a6a90;letter-spacing:2px">POWERED BY</div>
        <div class="pw-item"><b>Claude</b> <span>by Anthropic</span></div>
        <div class="pw-item"><b>Groq</b> <span>LLaMA 3.3</span></div>
        <div class="pw-item"><b>Gemini</b> <span>by Google</span></div>
        <div class="pw-item"><b>Slither</b> <span>by Crytic</span></div>
    </div>

    <div class="section-title">Embed Trust Badge</div>
    <div style="font-size:10px;color:#6a6a90;margin-bottom:6px">Add this to your website to display your AuditSmart verification:</div>
    <div class="embed-box">{badge_snippet}</div>

    <div class="footer">
        <p>© 2026 AuditSmart · AI Security Assessment Tool · <a href="{settings.FRONTEND_URL}">{settings.FRONTEND_URL.replace('https://', '')}</a></p>
        <p style="margin-top:4px">Report ID: {report_id} · Verified: ✅</p>
    </div>
</div>
</body>
</html>"""

    return HTMLResponse(content=html)


@router.get("/report/{report_id}/json")
async def public_report_json(report_id: str):
    """Public report data as JSON — for API integrations."""
    audit = await _get_public_audit(report_id)
    findings = _sanitize_findings(audit.get("findings", []))
    created = audit.get("created_at")
    if isinstance(created, datetime):
        created = created.isoformat() + "Z"

    return {
        "report_id": report_id,
        "contract_name": audit.get("contract_name", "Contract"),
        "chain": audit.get("chain", "ethereum"),
        "risk_level": (audit.get("risk_level") or "unknown").upper(),
        "risk_score": audit.get("risk_score", 0),
        "total_findings": audit.get("total_findings", 0),
        "critical": audit.get("critical_count", 0),
        "high": audit.get("high_count", 0),
        "medium": audit.get("medium_count", 0),
        "low": audit.get("low_count", 0),
        "deployment_verdict": audit.get("deployment_verdict", ""),
        "summary": audit.get("summary", ""),
        "findings": findings,
        "agents_count": len(audit.get("agents_used", [])),
        "scan_duration_ms": audit.get("scan_duration_ms", 0),
        "scanned_at": created,
        "disclaimer": DISCLAIMER,
        "report_url": f"{settings.FRONTEND_URL}/report/{report_id}",
        "badge_url": f"{settings.FRONTEND_URL}/badge/{report_id}",
    }


@router.get("/report/{report_id}/pdf")
async def public_report_pdf(report_id: str):
    """Public PDF download — no auth needed."""
    db = get_db()
    audit = await db.audits.find_one(
        {"report_id": report_id},
        {"pdf_base64": 1, "pdf_available": 1, "contract_name": 1}
    )
    if not audit:
        raise HTTPException(404, "Report not found")
    if not audit.get("pdf_available") or not audit.get("pdf_base64"):
        raise HTTPException(404, "PDF not available for this report")

    import base64
    pdf_bytes = base64.b64decode(audit["pdf_base64"])
    name = audit.get("contract_name", "Contract")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="AuditSmart_{name}_{report_id}.pdf"'}
    )


# ══════════════════════════════════════════════════════════════════════════════
# FEATURE 2: TRUST BADGE SYSTEM
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/badge/{report_id}", response_class=HTMLResponse)
async def badge_html(report_id: str):
    """
    Embeddable HTML badge — use in iframe.
    <iframe src="https://domain.com/public/badge/{report_id}" width="280" height="80" frameborder="0"></iframe>
    """
    audit = await _get_public_audit(report_id)
    risk_level = (audit.get("risk_level") or "unknown").upper()
    risk_score = audit.get("risk_score", 0)
    risk_color = _risk_color(risk_level)
    contract_name = audit.get("contract_name", "Contract")
    report_url = f"{settings.FRONTEND_URL}/report/{report_id}"

    # Risk label
    if risk_score <= 25:
        badge_text = "LOW RISK"
        bg = "rgba(16,185,129,.1)"
        border = "rgba(16,185,129,.3)"
    elif risk_score <= 50:
        badge_text = "MEDIUM RISK"
        bg = "rgba(234,179,8,.1)"
        border = "rgba(234,179,8,.3)"
    elif risk_score <= 75:
        badge_text = "HIGH RISK"
        bg = "rgba(245,158,11,.1)"
        border = "rgba(245,158,11,.3)"
    else:
        badge_text = "CRITICAL RISK"
        bg = "rgba(239,68,68,.1)"
        border = "rgba(239,68,68,.3)"

    html = f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{background:transparent;font-family:'Segoe UI',system-ui,sans-serif}}
a{{text-decoration:none;display:block}}
.badge{{display:flex;align-items:center;gap:12px;padding:10px 16px;background:#060612;border:1px solid {border};border-radius:8px;width:270px;transition:.3s;cursor:pointer}}
.badge:hover{{border-color:#4a9eff;box-shadow:0 4px 15px rgba(74,158,255,.15)}}
.shield{{width:32px;height:32px;display:flex;align-items:center;justify-content:center}}
.info{{flex:1}}
.title{{font-size:9px;color:#4a9eff;font-weight:700;letter-spacing:1.5px}}
.contract{{font-size:11px;color:#fff;font-weight:600;margin:2px 0}}
.risk{{font-size:8px;color:{risk_color};font-weight:600;letter-spacing:1px}}
.score{{font-size:8px;color:#6a6a90;margin-top:1px}}
</style></head>
<body>
<a href="{report_url}" target="_blank" rel="noopener">
<div class="badge">
    <div class="shield">
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <path d="M16 2L4 8v8c0 7.7 5.1 14.9 12 16.5 6.9-1.6 12-8.8 12-16.5V8L16 2z" fill="#060612" stroke="#4a9eff" stroke-width="1.5"/>
            <path d="M16 8l-5 10h3.5l-.7 6L19 14h-3.5l.7-6z" fill="#4a9eff"/>
        </svg>
    </div>
    <div class="info">
        <div class="title">AUDITSMART VERIFIED</div>
        <div class="contract">{contract_name}</div>
        <div class="risk">{badge_text}</div>
        <div class="score">Score: {risk_score}/100 · {report_id}</div>
    </div>
</div>
</a>
</body></html>"""

    return HTMLResponse(content=html, headers={
        "X-Frame-Options": "ALLOWALL",
        "Content-Security-Policy": "frame-ancestors *",
    })


@router.get("/badge/{report_id}/svg")
async def badge_svg(report_id: str):
    """SVG badge — for embedding as image in READMEs, docs, websites."""
    audit = await _get_public_audit(report_id)
    risk_level = (audit.get("risk_level") or "unknown").upper()
    risk_score = audit.get("risk_score", 0)
    risk_color = _risk_color(risk_level)

    if risk_score <= 25:
        label = "Low Risk"
        label_bg = "#10b981"
    elif risk_score <= 50:
        label = "Medium Risk"
        label_bg = "#eab308"
    elif risk_score <= 75:
        label = "High Risk"
        label_bg = "#f59e0b"
    else:
        label = "Critical"
        label_bg = "#ef4444"

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="220" height="20" role="img" aria-label="AuditSmart: {label}">
  <title>AuditSmart: {label} ({risk_score}/100)</title>
  <linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
  <clipPath id="r"><rect width="220" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="130" height="20" fill="#060612"/>
    <rect x="130" width="90" height="20" fill="{label_bg}"/>
    <rect width="220" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,sans-serif" font-size="11">
    <text x="65" y="14" fill="#4a9eff" font-weight="bold">🛡️ AuditSmart</text>
    <text x="175" y="14" font-weight="bold">{label} · {risk_score}</text>
  </g>
</svg>"""

    return Response(content=svg, media_type="image/svg+xml", headers={
        "Cache-Control": "max-age=3600",
    })


@router.get("/badge/{report_id}/js")
async def badge_js(report_id: str):
    """
    JavaScript embed snippet — auto-renders badge.
    Usage: <script src="https://domain.com/public/badge/{report_id}/js"></script>
    """
    js = f"""(function(){{
  var d=document,f=d.createElement('iframe');
  f.src='https://web-production-de7ca.up.railway.app/public/badge/{report_id}';
  f.width='280';f.height='80';f.frameBorder='0';
  f.style.border='none';f.style.overflow='hidden';
  f.setAttribute('loading','lazy');
  f.setAttribute('title','AuditSmart Trust Badge');
  d.currentScript.parentNode.insertBefore(f,d.currentScript);
}})();"""

    return Response(content=js, media_type="application/javascript")
