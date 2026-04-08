import logging
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.config import get_settings
from app.database import init_db, engine
from app.api.routes import api_router
from app.discord import notify_unhandled_error
from app.exceptions import HackathonException
from app.rate_limit import limiter
from app.services.auth import create_admin_if_not_exists
from app.database import AsyncSessionLocal

# ---- Logging configuration ----
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-8s [%(name)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("hackathon")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database and create default accounts
    await init_db()

    # Enable WAL mode for better concurrent performance
    async with engine.begin() as conn:
        await conn.exec_driver_sql("PRAGMA journal_mode=WAL")
        await conn.exec_driver_sql("PRAGMA synchronous=NORMAL")

    # Seed default admin / judge / team accounts
    async with AsyncSessionLocal() as db:
        await create_admin_if_not_exists(db)

    yield

    # Shutdown: Close engine
    await engine.dispose()


app = FastAPI(
    title="Hackathon API",
    description="Backend API for Hackathon 2026",
    version="1.0.0",
    lifespan=lifespan,
)

# Attach rate limiter + its exception handler + its middleware.
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)


# ---------------------------------------------------------------------------
# Expected, controlled errors → turned into clean JSON responses.
# Raise HackathonException anywhere in the code and this handler formats it.
# ---------------------------------------------------------------------------
@app.exception_handler(HackathonException)
async def hackathon_exception_handler(request: Request, exc: HackathonException):
    # Not a bug — just a business rule. Log at INFO, not ERROR.
    logger.info(
        "HackathonException on %s %s → %d %s: %s",
        request.method,
        request.url.path,
        exc.status_code,
        exc.code,
        exc.message,
    )
    payload = {
        "detail": exc.message,
        "code": exc.code,
    }
    if exc.details:
        payload["details"] = exc.details
    return JSONResponse(status_code=exc.status_code, content=payload)


# ---------------------------------------------------------------------------
# Access log + unexpected-error fallback.
#
# Any exception that isn't:
#   - a HackathonException (handled above)
#   - a FastAPI HTTPException (handled by starlette)
#   - a RateLimitExceeded (handled by slowapi)
# ends up here. We log the full traceback and, if configured, fire a Discord
# notification so the on-call person knows something broke.
# ---------------------------------------------------------------------------
@app.middleware("http")
async def access_log_middleware(request: Request, call_next):
    start = time.monotonic()
    try:
        response = await call_next(request)
    except Exception as exc:
        logger.exception(
            "Unhandled error on %s %s", request.method, request.url.path
        )
        notify_unhandled_error(
            exc,
            request_method=request.method,
            request_path=str(request.url.path),
            client_ip=request.client.host if request.client else None,
        )
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Internal server error",
                "code": "INTERNAL_ERROR",
            },
        )
    duration_ms = (time.monotonic() - start) * 1000
    logger.info(
        "%s %s → %d (%.1fms)",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response

# CORS configuration — driven by the CORS_ORIGINS env var.
#   "*"                        → allow any origin (dev/LAN only, rejected in production)
#   "https://a.com,https://b.com" → exact allowlist
_settings = get_settings()
_origins = _settings.cors_origin_list
if _origins == ["*"]:
    # Wildcard mode (dev/LAN). allow_credentials must be False when using wildcard.
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=".*",
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include API routes
app.include_router(api_router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "Hackathon API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
