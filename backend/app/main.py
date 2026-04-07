from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db, engine
from app.api.routes import api_router
from app.services.auth import (
    create_admin_if_not_exists,
    create_default_judge_if_not_exists,
    create_default_team_if_not_exists,
)
from app.database import AsyncSessionLocal


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
        await create_default_judge_if_not_exists(db)
        await create_default_team_if_not_exists(db)

    yield

    # Shutdown: Close engine
    await engine.dispose()


app = FastAPI(
    title="Hackathon API",
    description="Backend API for Hackathon 2026",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
# Allow any origin in dev/LAN so the PWA on phones (e.g. http://192.168.x.x:3000)
# can call this API. allow_credentials must be False when using wildcard origin.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=False,
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
