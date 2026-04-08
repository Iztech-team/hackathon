import os
import secrets
import sys
from functools import lru_cache
from pydantic_settings import BaseSettings


def _require_secret_key() -> str:
    """Return a SECRET_KEY from env, or generate a strong dev default.

    In production (ENV=production) we refuse to start if SECRET_KEY is not set.
    In dev we fall back to a freshly-generated token — this changes per boot,
    invalidating old JWTs, which is a loud signal that you forgot to set it
    but isn't a silent security hole.
    """
    key = os.environ.get("SECRET_KEY")
    if key:
        return key
    env = os.environ.get("ENV", "development").lower()
    if env == "production":
        print(
            "FATAL: SECRET_KEY environment variable is required in production.",
            file=sys.stderr,
        )
        sys.exit(1)
    return secrets.token_urlsafe(32)


class Settings(BaseSettings):
    # Environment: "development" or "production".
    ENV: str = "development"

    DATABASE_URL: str = "sqlite+aiosqlite:///./hackathon.db"

    # SECRET_KEY is read via _require_secret_key() during field default resolution
    # so we can enforce "must be set in production" behavior.
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Default seed account credentials — overridable via env vars, REQUIRED in prod.
    ADMIN_PASSWORD: str = ""
    JUDGE_PASSWORD: str = ""
    TEAM_PASSWORD: str = ""

    # Comma-separated list of origins allowed through CORS, or "*" for wildcard (dev only).
    # Example: "https://hackathon.example.com,https://admin.hackathon.example.com"
    CORS_ORIGINS: str = "*"

    class Config:
        env_file = ".env"
        extra = "ignore"

    def model_post_init(self, __context) -> None:
        # Apply the SECRET_KEY safety net after pydantic loads .env
        if not self.SECRET_KEY:
            self.SECRET_KEY = _require_secret_key()

        is_prod = self.ENV.lower() == "production"
        if is_prod:
            missing = []
            if not self.ADMIN_PASSWORD:
                missing.append("ADMIN_PASSWORD")
            if not self.JUDGE_PASSWORD:
                missing.append("JUDGE_PASSWORD")
            if not self.TEAM_PASSWORD:
                missing.append("TEAM_PASSWORD")
            if self.CORS_ORIGINS.strip() == "*":
                missing.append("CORS_ORIGINS (wildcard not allowed in production)")
            if missing:
                print(
                    "FATAL: the following env vars must be set in production: "
                    + ", ".join(missing),
                    file=sys.stderr,
                )
                sys.exit(1)

        # Dev-only weak defaults for seed accounts
        if not self.ADMIN_PASSWORD:
            self.ADMIN_PASSWORD = "admin1232026"
        if not self.JUDGE_PASSWORD:
            self.JUDGE_PASSWORD = "judge2026"
        if not self.TEAM_PASSWORD:
            self.TEAM_PASSWORD = "team2026"

    @property
    def cors_origin_list(self) -> list[str]:
        raw = self.CORS_ORIGINS.strip()
        if raw == "*":
            return ["*"]
        return [o.strip() for o in raw.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.ENV.lower() == "production"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
