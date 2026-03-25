import json
import google.generativeai as genai
from app.config import settings

_configured = False


def configure():
    global _configured
    if not _configured and settings.GEMINI_API_KEY:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        _configured = True


# v3.0 — 30-point checklist covering all vulnerability classes
PROMPT = """\
You are a world-class smart contract security auditor. Analyze this contract methodically.

MANDATORY 30-POINT CHECKLIST — you MUST check EVERY item:

CRITICAL CLASS:
1. REENTRANCY: State updated AFTER external call? Missing nonReentrant on withdraw/emergencyWithdraw?
2. SELFDESTRUCT: Any selfdestruct() function? Reports as CRITICAL rug-pull vector.
3. DELEGATECALL: delegatecall to arbitrary/user-supplied address? Can overwrite storage slots.
4. INITIALIZATION: Can initialize() be called by anyone? Can it be called multiple times? Silent return vs revert?
5. GOVERNANCE EXECUTION: Can proposals execute arbitrary calldata on arbitrary targets? No quorum?
6. UNPROTECTED PAUSE: Can anyone call setPaused/pause/unpause without access control?
7. MIGRATION/DRAIN: Functions that move ALL funds to arbitrary address (migrateVault, emergencyDrain)?
8. UNDELEGATION: Can anyone undelegate/revoke someone else's delegated shares?

HIGH CLASS:
9. UNCHECKED MATH: Any 'unchecked { }' blocks in contract or libraries? Bypasses 0.8+ overflow protection.
10. SHARE MANIPULATION: First depositor attack — deposit 1 wei, donate ETH, next user gets 0 shares.
11. SHARE ROUNDING: shares = amount * totalShares / totalDeposited — can round to 0 for small deposits.
12. ORACLE NO VALIDATION: External price oracle with no staleness check, no bounds (price could be 0 or max).
13. SIGNATURE REPLAY: ecrecover without nonce, without chainId, without address(0) check on recovered signer.
14. ENCODEPACKED COLLISION: abi.encodePacked with multiple variable-length args — hash collision risk.
15. UNSAFE ERC20: transferFrom without checking return value. USDT doesn't return bool.
16. FEE-ON-TRANSFER: Records _amount but token has transfer fee — actual received is less.
17. EMERGENCY BYPASS: emergencyWithdraw skips withdrawal delay, or doesn't decrement totalDeposited.
18. STRATEGY TRUST: depositToStrategy/withdrawFromStrategy trusts external contract without verifying amounts.
19. VOTE MANIPULATION: Voting power based on current shares (not snapshot) — vote, transfer, vote again.
20. OWNER TOKEN LOCK: Only owner can withdraw deposited ERC20 tokens — users' funds permanently locked.
21. DELEGATION NO LOCK: Shares "delegated" but delegator can still withdraw/use them. Double-counting.
22. REWARD DOS: distributeRewards() loops over unbounded array with external calls — gas limit DoS.
23. NO FEE CAP: setPerformanceFee has no max — owner can set 100%+ fee.
24. FLASH LOAN RETURN: EIP-3156 return value not checked against expected hash.
25. INCOMPLETE FUNCTION: Function accepts payment (payable) but logic is missing/incomplete.

MEDIUM/LOW CLASS:
26. DIVISION BY ZERO: Any a/b where b could be 0 (totalShares = 0, etc).
27. UNBOUNDED ARRAY: depositors[] or similar array with no size limit — DoS via gas.
28. GUARDIAN ZERO: Guardian/role variable declared but never initialized — address(0) forever locked.
29. SINGLE-STEP OWNERSHIP: transferOwnership directly sets owner. pendingOwner exists but unused.
30. RECEIVE WITHOUT ACCOUNTING: receive()/fallback() accepts ETH but doesn't update totalDeposited.

RULES:
- Report ONLY vulnerabilities you ACTUALLY FIND in the code
- If a pattern is NOT in the code, do NOT report it
- Do NOT say "not found" or "not present" — just skip that check
- Each finding needs exact function name
- Do NOT repeat same finding twice
- Use severity: critical, high, medium, low, info

Return ONLY a JSON array. No text outside JSON. No markdown.

Each finding: {"type":"Name","severity":"critical|high|medium|low|info","line":"number","function":"name","description":"detailed","recommendation":"fix"}

Contract:
```solidity
CONTRACT_CODE
```"""


async def run_gemini_analysis(contract_code: str) -> list:
    if not settings.GEMINI_API_KEY:
        print("⚠️ GEMINI_API_KEY is empty — skipping Gemini agent")
        return []

    try:
        configure()

        model = genai.GenerativeModel(
            settings.GEMINI_MODEL,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.1,
                max_output_tokens=settings.GEMINI_MAX_TOKENS
            )
        )

        prompt = PROMPT.replace("CONTRACT_CODE",
                                contract_code[:50000])

        print("🔍 Gemini agent: sending request...")
        response = await model.generate_content_async(prompt)
        content = response.text.strip()
        print(f"🔍 Gemini agent: got response ({len(content)} chars)")

        try:
            parsed = json.loads(content)
            findings = []
            
            if isinstance(parsed, list):
                findings = parsed
            elif isinstance(parsed, dict):
                for key in ["findings", "vulnerabilities", "issues"]:
                    if key in parsed and isinstance(parsed[key], list):
                        findings = parsed[key]
                        break

            # v2.0 — Validate and tag findings
            validated = []
            for f in findings:
                if not isinstance(f, dict):
                    continue
                if not f.get("type") or not f.get("severity"):
                    continue
                sev = f.get("severity", "info").lower().strip()
                if sev not in ("critical", "high", "medium", "low", "info"):
                    sev = "info"
                f["severity"] = sev
                f["line"] = str(f.get("line", ""))
                f["source"] = "gemini_agent"
                validated.append(f)

            print(f"✅ Gemini agent: found {len(validated)} valid findings")
            return validated

        except json.JSONDecodeError:
            start = content.find('[')
            end = content.rfind(']') + 1
            if start >= 0 and end > start:
                result = json.loads(content[start:end])
                print(f"✅ Gemini agent: extracted {len(result)} findings from text")
                return result

        print("⚠️ Gemini agent: could not parse response as findings")
        return []

    except Exception as e:
        print(f"❌ Gemini agent error: {e}")
        return []
