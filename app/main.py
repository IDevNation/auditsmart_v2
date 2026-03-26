from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.database import connect_db, disconnect_db
from app.routes import auth, audit, dashboard, payment
from app.config import settings


# ── Rate Limiter ──────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["30/minute"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await disconnect_db()


app = FastAPI(
    title="AuditSmart API v3.0",
    description="AI Smart Contract Security Platform — Powered by Claude (Anthropic)",
    version="3.0.0",
    lifespan=lifespan
)

# Rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# ── Security Headers Middleware ───────────────────────────────────────────────
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        return response

app.add_middleware(SecurityHeadersMiddleware)


# ── CORS (production only) ────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "https://auditsmart.org",
        "https://www.auditsmart.org",
        "https://zylithium.org",
        "https://www.zylithium.org",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth.router,      prefix="/auth",      tags=["Auth"])
app.include_router(audit.router,     prefix="/audit",     tags=["Audit"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(payment.router,   prefix="/payment",   tags=["Payment"])


@app.get("/")
async def root():
    return {
        "app":     "AuditSmart v3.0",
        "status":  "running",
        "powered_by": "Claude (Anthropic) + Groq + Gemini",
        "plans":   ["free", "pro", "enterprise", "deep_audit"],
        "docs":    "/docs"
    }


@app.get("/health")
async def health():
    return {"status": "ok", "version": "3.0.0"}
