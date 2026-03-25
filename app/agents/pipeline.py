"""
AuditSmart v3.0 — Audit Pipeline

Plan Routing:
  free       → 8 Groq agents + Gemini orchestrator
  pro        → 8 Groq agents + Claude Haiku (fix suggestions included)
  enterprise → 8 Groq agents + Claude Sonnet (exploit scenarios + fix code)
  deep_audit → 8 Groq agents + Claude Opus + Extended Thinking (superior)
"""

import asyncio
import time
from app.agents.groq_agent import run_groq_analysis
from app.agents.gemini_agent import run_gemini_analysis
from app.agents.claude_agent import run_claude_analysis
from app.agents.slither_agent import run_slither_analysis
from app.services.dedup_engine import deduplicate_and_validate
from app.services.pdf_generator import generate_audit_pdf, pdf_to_base64, REPORTLAB_AVAILABLE
from app.config import settings

AGENT_CONFIGS = [
    {
        "name": "reentrancy_agent",
        "focus": (
            "REENTRANCY — check EVERY function with external calls (call, send, transfer, transferFrom).\n"
            "PATTERN 1: Classic — state updated AFTER external call (CEI violation). Is balance/shares zeroed BEFORE or AFTER .call{value}()?\n"
            "PATTERN 2: Cross-function — function A calls external, function B reads state that A hasn't updated yet.\n"
            "PATTERN 3: Read-only reentrancy — view function returns stale state during callback.\n"
            "PATTERN 4: Missing nonReentrant — does withdraw/emergencyWithdraw have reentrancy guard? If not, CRITICAL.\n"
            "PATTERN 5: Emergency withdraw without reentrancy guard is CRITICAL even if main withdraw has it.\n"
            "DO NOT report reentrancy if nonReentrant modifier IS applied to that function.\n"
            "ONLY report if you find a SPECIFIC function with the issue. State the exact function name."
        )
    },
    {
        "name": "overflow_agent",
        "focus": (
            "INTEGER/MATH VULNERABILITIES — check ALL arithmetic.\n"
            "PATTERN 1: 'unchecked { }' blocks — Solidity 0.8+ has overflow protection BUT unchecked blocks BYPASS it. "
            "If any library (SafeMath or custom) uses 'unchecked { return a + b; }' that is HIGH severity.\n"
            "PATTERN 2: Division by zero — any a/b where b could be 0 (e.g., totalShares, totalDeposited).\n"
            "PATTERN 3: Share rounding — shares = amount * totalShares / totalDeposited can round to 0 for small deposits. "
            "First depositor can manipulate: deposit 1 wei, donate large ETH, next depositor gets 0 shares.\n"
            "PATTERN 4: Precision loss — integer division truncates. reward = total * share / totalShares loses dust.\n"
            "PATTERN 5: Fee calculation overflow — amount.mul(fee).div(10000) can overflow if fee > 10000.\n"
            "CHECK: Look for ANY 'unchecked' keyword in the contract or its libraries. Report each one."
        )
    },
    {
        "name": "access_control_agent",
        "focus": (
            "ACCESS CONTROL — check EVERY public/external function for missing restrictions.\n"
            "PATTERN 1: Missing onlyOwner — can anyone call pause(), unpause(), setPaused(), destroy(), migrate()?\n"
            "PATTERN 2: Initialize without guard — can initialize() be called by anyone? Can it be called twice? "
            "Does it use 'if (initialized) return;' (silent return = HIGH) instead of 'require(!initialized)'?\n"
            "PATTERN 3: Single-step ownership — transferOwnership() directly sets owner without pending/accept pattern. "
            "If pendingOwner variable EXISTS but is UNUSED in transferOwnership, report it.\n"
            "PATTERN 4: Guardian/role set to address(0) — if guardian is declared but never assigned, any function with "
            "onlyGuardian is permanently locked (no one can call it).\n"
            "PATTERN 5: Fee validation — can setPerformanceFee() set fee above 10000 bps (100%)? No max cap = HIGH.\n"
            "PATTERN 6: Delay manipulation — can setWithdrawalDelay() set delay to 0 (bypass) or max uint (lock forever)?\n"
            "PATTERN 7: Anyone can execute governance proposals without being the proposer or owner.\n"
            "Report EACH function separately with its specific issue."
        )
    },
    {
        "name": "logic_agent",
        "focus": (
            "BUSINESS LOGIC — check deposit/withdraw/emergency paths for accounting errors.\n"
            "PATTERN 1: Emergency withdraw doesn't decrement totalDeposited — accounting mismatch, share price inflated.\n"
            "PATTERN 2: Emergency withdraw bypasses withdrawal delay — user can skip timelock.\n"
            "PATTERN 3: Withdrawal delay is 0 — timelock exists but default is 0, making it useless.\n"
            "PATTERN 4: First depositor share manipulation — deposit 1 wei, donate ETH via selfdestruct, "
            "next depositor's shares round to 0.\n"
            "PATTERN 5: Flash loan repayment check — does it check balance >= balanceBefore + fee? "
            "Can ETH sent via selfdestruct() bypass the repayment check?\n"
            "PATTERN 6: Deposit while paused — does deposit() check paused state? If not, users deposit into frozen vault.\n"
            "PATTERN 7: Strategy deposit without balance check — owner calls depositToStrategy(amount) but "
            "doesn't verify amount <= available balance.\n"
            "PATTERN 8: Strategy withdrawal doesn't verify returned amount — trusts external contract.\n"
            "PATTERN 9: Token deposits don't mint shares — users can deposit tokens but can't withdraw proportionally.\n"
            "PATTERN 10: Only owner can withdraw user tokens — users' ERC20 deposits are permanently locked.\n"
            "Report EACH pattern found as a SEPARATE finding."
        )
    },
    {
        "name": "gas_dos_agent",
        "focus": (
            "GAS GRIEFING & DENIAL OF SERVICE — check loops, arrays, and external calls.\n"
            "PATTERN 1: Unbounded array — depositors[] grows forever. Any loop over it will hit gas limit.\n"
            "PATTERN 2: Duplicate entries — push(msg.sender) without checking if already in array.\n"
            "PATTERN 3: Reward distribution loop — iterates ALL depositors with external calls. "
            "Single revert blocks all rewards. Report as HIGH.\n"
            "PATTERN 4: External call in loop — for(i) { addr.call{value}() } — one failure blocks everything.\n"
            "PATTERN 5: Silent transfer failure — (bool success,) = addr.call{value}(); without require(success). "
            "Failed ETH transfers are silently ignored = funds lost.\n"
            "PATTERN 6: Fee recipient could be address(0) — ETH sent to zero address is burned.\n"
            "PATTERN 7: Block.timestamp dependence for timing — miners can manipulate by ~15 seconds.\n"
            "Report each with the specific function and array/loop involved."
        )
    },
    {
        "name": "defi_agent",
        "focus": (
            "DEFI PROTOCOL VULNERABILITIES — oracle, ERC20, flash loans, MEV.\n"
            "PATTERN 1: Oracle manipulation — external price oracle with no staleness check, no bounds validation. "
            "Price could return 0 or max uint256. Report as HIGH.\n"
            "PATTERN 2: Unsafe ERC20 transferFrom — no return value check. USDT doesn't return bool. Use SafeERC20.\n"
            "PATTERN 3: Fee-on-transfer tokens — contract records _amount but actually receives less. "
            "Should check balanceOf before/after transfer.\n"
            "PATTERN 4: receive()/fallback() accepts ETH without accounting — donated ETH inflates share price "
            "but isn't tracked in totalDeposited.\n"
            "PATTERN 5: Flash loan return value — EIP-3156 requires checking keccak256('ERC3156FlashBorrower.onFlashLoan') "
            "but return value is ignored.\n"
            "PATTERN 6: Flash loan borrower not validated — no check that borrower is a contract (could be EOA).\n"
            "PATTERN 7: Voting power based on current shares not snapshot — vote, transfer shares, vote again.\n"
            "PATTERN 8: No quorum requirement — 1 vote can pass a governance proposal.\n"
            "PATTERN 9: No minimum shares to create proposal — spam attack vector.\n"
            "Report EACH as separate finding."
        )
    },
    {
        "name": "backdoor_agent",
        "focus": (
            "BACKDOOR & RUG PULL DETECTION — ALL findings here are CRITICAL.\n"
            "PATTERN 1: selfdestruct() — sends ALL ETH to owner. Irreversible. Always CRITICAL.\n"
            "PATTERN 2: delegatecall to arbitrary address — can overwrite any storage slot including owner.\n"
            "PATTERN 3: Governance arbitrary execution — proposal.target.call(proposal.callData) with no restrictions. "
            "Combined with no quorum, attacker creates proposal + votes + executes = drains vault.\n"
            "PATTERN 4: Migration function — migrateVault() or similar that moves all funds to arbitrary address.\n"
            "PATTERN 5: Owner can withdraw ALL user funds — withdrawAll(), withdrawToken() with no user consent.\n"
            "PATTERN 6: Owner can set fee to 100% — drains profits completely.\n"
            "PATTERN 7: Owner can set withdrawal delay to max uint — permanently locks all withdrawals.\n"
            "IMPORTANT: ONLY report if the pattern ACTUALLY EXISTS in the code. "
            "Do NOT report 'quorum = 1 vote' if there is no governance system. "
            "Do NOT report 'migration function' if there is no migration function. "
            "If you search and find the pattern is NOT in the code, DO NOT report it."
        )
    },
    {
        "name": "signature_agent",
        "focus": (
            "SIGNATURE & CRYPTOGRAPHY VULNERABILITIES.\n"
            "PATTERN 1: ecrecover returns address(0) for invalid signatures — if code does "
            "'require(signer == _depositor)' and signer is 0x0, any address(0) check passes. Report as HIGH.\n"
            "PATTERN 2: No nonce — same signature can be replayed unlimited times. Report as HIGH.\n"
            "PATTERN 3: No chainId — signature valid on Ethereum also valid on BSC/Polygon. Cross-chain replay. HIGH.\n"
            "PATTERN 4: abi.encodePacked with multiple variable-length types — hash collision possible. "
            "encodePacked('ab','c') == encodePacked('a','bc'). Use abi.encode instead.\n"
            "PATTERN 5: No EIP-712 — typed structured data hashing not used. Phishing risk.\n"
            "PATTERN 6: Delegation access control — can anyone call undelegateShares() for someone else? "
            "Should check msg.sender == delegator. If anyone can undelegate = CRITICAL.\n"
            "PATTERN 7: Delegation without locking — shares are 'delegated' but delegator can still withdraw them. "
            "Double-spending of voting power.\n"
            "PATTERN 8: Missing function logic — function accepts payment (payable) but deposit logic is incomplete/missing.\n"
            "Report EACH pattern found separately. If a pattern is NOT in the code, do NOT report it."
        )
    },
]

RISK_THRESHOLDS = {"critical": 80, "high": 60, "medium": 35, "low": 10}


async def _empty_list():
    return []

# Large contracts get split so agents see full code without truncation
CHUNK_THRESHOLD = 6000  # chars — Groq context ~8K tokens ≈ ~6K chars of Solidity


def _split_contract(code: str) -> list:
    """Split large contracts into overlapping chunks for better coverage."""
    if len(code) <= CHUNK_THRESHOLD:
        return [code]

    # Find natural split points (function boundaries)
    lines = code.split("\n")
    chunks = []
    current_chunk = []
    current_size = 0
    # Always include pragma/imports/interfaces in every chunk
    header_lines = []
    in_header = True

    for line in lines:
        stripped = line.strip()
        if in_header:
            if stripped.startswith("contract ") or stripped.startswith("library "):
                in_header = False
            else:
                header_lines.append(line)
                continue

        current_chunk.append(line)
        current_size += len(line) + 1

        # Split at function boundaries when chunk is large enough
        if current_size > CHUNK_THRESHOLD * 0.7 and (
            stripped.startswith("function ") or
            stripped.startswith("// ---") or
            stripped == "}"
        ):
            header = "\n".join(header_lines)
            chunk_text = header + "\n" + "\n".join(current_chunk)
            chunks.append(chunk_text)
            current_chunk = []
            current_size = 0

    # Add remaining
    if current_chunk:
        header = "\n".join(header_lines)
        chunk_text = header + "\n" + "\n".join(current_chunk)
        chunks.append(chunk_text)

    # If splitting produced nothing useful, just use original
    if not chunks:
        return [code]

    print(f"   📦 Contract split into {len(chunks)} chunks: {[len(c) for c in chunks]}")
    return chunks


async def run_audit_pipeline(
    contract_code: str,
    contract_name: str = "Contract",
    plan: str = "free"
) -> dict:
    start_time = time.time()
    all_findings = []
    agents_used = []

    print("\n" + "=" * 65)
    print(f"🚀 AuditSmart v3.0 | {contract_name} | Plan: {plan.upper()}")
    print(f"   Contract: {len(contract_code)} chars")
    print(f"   Groq: {'✅' if settings.GROQ_API_KEY else '❌'} | "
          f"Gemini: {'✅' if settings.GEMINI_API_KEY else '❌'} | "
          f"Claude: {'✅' if settings.ANTHROPIC_API_KEY else '❌'}")
    print("=" * 65)

    # ── PHASE 1: 8 Groq Agents + Slither (ALL plans) ─────────────────────────
    # For large contracts, split into chunks so agents see the full code
    contract_chunks = _split_contract(contract_code)
    print(f"\n📡 Phase 1: 8 Groq agents + Slither (parallel)... [{len(contract_chunks)} chunk(s)]")

    for chunk_idx, chunk in enumerate(contract_chunks):
        if len(contract_chunks) > 1:
            print(f"\n   --- Chunk {chunk_idx + 1}/{len(contract_chunks)} ({len(chunk)} chars) ---")

        groq_tasks = [
            run_groq_analysis(chunk, agent["focus"], agent["name"])
            for agent in AGENT_CONFIGS
        ]

        groq_results, slither_result = await asyncio.gather(
            asyncio.gather(*groq_tasks, return_exceptions=True),
            run_slither_analysis(contract_code) if chunk_idx == 0 else _empty_list(),
            return_exceptions=True
        )

        # Collect Groq
        if isinstance(groq_results, list):
            for i, res in enumerate(groq_results):
                if isinstance(res, Exception):
                    print(f"   ❌ {AGENT_CONFIGS[i]['name']}: {res}")
                    continue
                if res and isinstance(res, list):
                    all_findings.extend(res)
                    if AGENT_CONFIGS[i]["name"] not in agents_used:
                        agents_used.append(AGENT_CONFIGS[i]["name"])
                    print(f"   ✅ {AGENT_CONFIGS[i]['name']}: {len(res)} findings")

        # Collect Slither (only first chunk)
        if chunk_idx == 0 and not isinstance(slither_result, Exception) and isinstance(slither_result, list):
            all_findings.extend(slither_result)
            agents_used.append("slither_agent")
            print(f"   ✅ slither_agent: {len(slither_result)} findings")

    print(f"\n   Phase 1 total: {len(all_findings)} raw findings")

    # ── PHASE 2: AI Orchestrator (plan-based) ─────────────────────────────────
    thinking_chain = None

    if plan == "free":
        # Free → Gemini
        print("\n🤖 Phase 2: Gemini Orchestrator (Free plan)...")
        gemini_result = await run_gemini_analysis(contract_code)
        if isinstance(gemini_result, list) and gemini_result:
            all_findings.extend(gemini_result)
            agents_used.append("gemini_agent")
            print(f"   ✅ gemini_agent: {len(gemini_result)} findings")

    elif plan in ("pro", "enterprise", "deep_audit"):
        # Pro/Enterprise/Deep → Claude
        labels = {
            "pro":        "Claude Haiku",
            "enterprise": "Claude Sonnet",
            "deep_audit": "Claude Opus + Extended Thinking 🧠"
        }
        print(f"\n🤖 Phase 2: {labels[plan]} ({plan})...")
        claude_result = await run_claude_analysis(
            contract_code=contract_code,
            groq_findings=all_findings,
            plan=plan
        )

        claude_findings = claude_result.get("findings", [])
        if claude_findings:
            all_findings.extend(claude_findings)
            agents_used.append(f"claude_{plan}")
            print(f"   ✅ claude_{plan}: {len(claude_findings)} additional findings")

        thinking_chain = claude_result.get("thinking")
        claude_verdict = claude_result.get("verdict", "")
        claude_summary = claude_result.get("summary", "")
    else:
        claude_verdict = ""
        claude_summary = ""

    # ── DEDUPLICATION ─────────────────────────────────────────────────────────
    print(f"\n🔍 Deduplication: {len(all_findings)} raw → ", end="")
    unique_findings = deduplicate_and_validate(all_findings, contract_code)
    print(f"{len(unique_findings)} unique")

    # ── SCORING ───────────────────────────────────────────────────────────────
    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    for f in unique_findings:
        sev = f.get("severity", "info").lower()
        if sev in counts:
            counts[sev] += 1

    risk_score = min(100, (
        counts["critical"] * 25 +
        counts["high"] * 12 +
        counts["medium"] * 5 +
        counts["low"] * 2
    ))

    if risk_score >= RISK_THRESHOLDS["critical"]:   risk_level = "critical"
    elif risk_score >= RISK_THRESHOLDS["high"]:      risk_level = "high"
    elif risk_score >= RISK_THRESHOLDS["medium"]:    risk_level = "medium"
    elif risk_score >= RISK_THRESHOLDS["low"]:       risk_level = "low"
    else:                                            risk_level = "info"

    scan_duration = int((time.time() - start_time) * 1000)

    # ── SUMMARY ───────────────────────────────────────────────────────────────
    summary = (
        claude_summary if plan != "free" and claude_summary
        else (
            f"Analyzed {contract_name} using {len(agents_used)} agents. "
            f"Found {len(unique_findings)} unique issues: "
            f"{counts['critical']} critical, {counts['high']} high, "
            f"{counts['medium']} medium, {counts['low']} low."
        )
    )

    result = {
        "risk_level":          risk_level,
        "risk_score":          risk_score,
        "total_findings":      len(unique_findings),
        "raw_findings_count":  len(all_findings),
        "critical_count":      counts["critical"],
        "high_count":          counts["high"],
        "medium_count":        counts["medium"],
        "low_count":           counts["low"],
        "info_count":          counts["info"],
        "findings":            unique_findings,
        "summary":             summary,
        "agents_used":         agents_used,
        "scan_duration_ms":    scan_duration,
        "plan_used":           plan,
        # Pro/Enterprise/Deep Audit extras
        "has_fix_suggestions": any(f.get("auto_fix") for f in unique_findings),
        "deployment_verdict":  claude_verdict if plan != "free" else "",
        # Deep Audit exclusive
        "thinking_chain":      thinking_chain,
        "is_deep_audit":       plan == "deep_audit",
    }

    # ── PDF GENERATION ─────────────────────────────────────────────────────────
    if REPORTLAB_AVAILABLE and settings.PDF_ENABLED:
        try:
            print("📄 Generating PDF report...")
            pdf_bytes = generate_audit_pdf(result)
            if pdf_bytes:
                result["pdf_base64"] = pdf_to_base64(pdf_bytes)
                result["pdf_available"] = True
                print(f"   ✅ PDF: {len(pdf_bytes):,} bytes")
            else:
                result["pdf_available"] = False
        except Exception as e:
            print(f"   ❌ PDF error: {e}")
            result["pdf_available"] = False
    else:
        result["pdf_available"] = False

    print("\n" + "=" * 65)
    print(f"✅ AUDIT COMPLETE | Risk: {risk_level.upper()} ({risk_score}/100) | "
          f"Duration: {scan_duration}ms")
    print(f"   {counts['critical']}C | {counts['high']}H | {counts['medium']}M | {counts['low']}L | "
          f"Fixes: {'✅' if result['has_fix_suggestions'] else '❌'} | "
          f"Thinking: {'✅' if thinking_chain else '❌'}")
    print("=" * 65 + "\n")

    return result
