"""
AuditSmart v3.1 — Payment Routes

Plans:
  Free       → $0  | 10 audits | Groq only (8 agents)
  Pro        → $29 | 15 audits | Groq + Claude Haiku (fix suggestions + verdict)
  Enterprise → $49 | 20 audits | Groq + Claude Sonnet (exploit + fix code + verdict)
  Deep Audit → $20 per audit   | Claude Opus + Extended Thinking (any plan)
"""

import hashlib
import hmac
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.utils.auth import get_current_user
from app.database import get_db
from app.config import settings
from datetime import datetime

router = APIRouter()


class RazorpayOrderRequest(BaseModel):
    plan: str  # "pro" or "enterprise"


class RazorpayVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan: str


# ── PLAN CONFIG ────────────────────────────────────────────────────────────────
PLAN_PRICES_PAISE = {
    "pro":        290000,   # ₹2900 (~$29 USD)
    "enterprise": 490000,   # ₹4900 (~$49 USD)
}

PLAN_LIMITS = {
    "pro":        15,
    "enterprise": 20,
}

PLAN_FEATURES = {
    "free": {
        "price_usd":       0,
        "price_inr":       0,
        "audits":          10,
        "ai_engine":       "Groq LLaMA 3.3 70B (8 Specialist Agents)",
        "pdf_report":      True,
        "fix_suggestions": False,
        "fix_code":        False,
        "exploit_scenarios": False,
        "thinking_chain":  False,
        "deployment_verdict": False,
        "support":         "Community",
    },
    "pro": {
        "price_usd":       29,
        "price_inr":       2900,
        "audits":          15,
        "ai_engine":       "Groq + Claude Haiku (Anthropic)",
        "pdf_report":      True,
        "fix_suggestions": True,
        "fix_code":        True,
        "exploit_scenarios": False,
        "thinking_chain":  False,
        "deployment_verdict": True,
        "support":         "Email",
        "powered_by_claude": True,
    },
    "enterprise": {
        "price_usd":       49,
        "price_inr":       4900,
        "audits":          20,
        "ai_engine":       "Groq + Claude Sonnet (Anthropic)",
        "pdf_report":      True,
        "fix_suggestions": True,
        "fix_code":        True,
        "exploit_scenarios": True,
        "thinking_chain":  False,
        "deployment_verdict": True,
        "api_access":      True,
        "support":         "Priority",
        "powered_by_claude": True,
    },
    "deep_audit": {
        "price_usd":       20,
        "price_inr":       1650,
        "audits":          1,
        "ai_engine":       "Claude Opus + Extended Thinking",
        "pdf_report":      True,
        "fix_suggestions": True,
        "fix_code":        True,
        "exploit_scenarios": True,
        "thinking_chain":  True,
        "deployment_verdict": True,
        "support":         "Priority",
        "powered_by_claude": True,
        "is_addon":        True,
    }
}


def get_razorpay_client():
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        return None
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


# ── SUBSCRIPTION PLANS ─────────────────────────────────────────────────────────
@router.post("/razorpay/create-order")
async def create_razorpay_order(
    req: RazorpayOrderRequest,
    current_user: dict = Depends(get_current_user)
):
    if req.plan not in PLAN_PRICES_PAISE:
        raise HTTPException(400, "Invalid plan. Choose 'pro' or 'enterprise'.")

    client = get_razorpay_client()
    if not client:
        raise HTTPException(500, "Payment gateway not configured")

    try:
        order = client.order.create({
            "amount":   PLAN_PRICES_PAISE[req.plan],
            "currency": "INR",
            "notes": {
                "user_id": str(current_user["_id"]),
                "plan":    req.plan,
                "email":   current_user.get("email", "")
            }
        })
        return {
            "order_id":  order["id"],
            "amount":    PLAN_PRICES_PAISE[req.plan],
            "currency":  "INR",
            "key_id":    settings.RAZORPAY_KEY_ID,
            "plan":      req.plan,
            "features":  PLAN_FEATURES.get(req.plan, {})
        }
    except Exception as e:
        print(f"❌ Payment error: {e}")
        raise HTTPException(500, "Payment processing failed. Please try again.")


@router.post("/razorpay/verify")
async def verify_razorpay_payment(
    req: RazorpayVerifyRequest,
    current_user: dict = Depends(get_current_user)
):
    if req.plan not in PLAN_PRICES_PAISE:
        raise HTTPException(400, "Invalid plan")

    # Verify signature
    body = f"{req.razorpay_order_id}|{req.razorpay_payment_id}"
    expected = hmac.HMAC(
        settings.RAZORPAY_KEY_SECRET.encode(),
        body.encode(),
        hashlib.sha256
    ).hexdigest()

    if expected != req.razorpay_signature:
        raise HTTPException(400, "Invalid payment signature")

    db = get_db()
    limit = PLAN_LIMITS.get(req.plan, 0)

    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {
            "plan":                  req.plan,
            "free_audits_remaining": limit,
            "updated_at":            datetime.utcnow()
        }}
    )

    await db.payments.insert_one({
        "user_id":              current_user["_id"],
        "plan":                 req.plan,
        "razorpay_order_id":    req.razorpay_order_id,
        "razorpay_payment_id":  req.razorpay_payment_id,
        "amount":               PLAN_PRICES_PAISE.get(req.plan, 0),
        "currency":             "INR",
        "status":               "verified",
        "created_at":           datetime.utcnow()
    })

    return {
        "status":   "success",
        "plan":     req.plan,
        "features": PLAN_FEATURES.get(req.plan, {})
    }


# ── PLANS INFO (public) ────────────────────────────────────────────────────────
@router.get("/plans")
async def get_plans():
    """Public endpoint — returns all plan details including Deep Audit add-on."""
    return {
        "plans":      {k: v for k, v in PLAN_FEATURES.items() if not v.get("is_addon")},
        "addons": {
            "deep_audit": {
                **PLAN_FEATURES["deep_audit"],
                "tagline": "Available on any plan — Claude Opus + See AI Thinking",
                "best_for": "Pre-mainnet deployment, high-value DeFi contracts"
            }
        }
    }
