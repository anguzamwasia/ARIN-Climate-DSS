import secrets
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/arin_dss"
    JWT_SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    OPENAI_API_KEY: str = ""
    ALLOWED_EMAILS: str = "admin@arin-africa.org,researcher@arin-africa.org,test@example.com"
    ALLOWED_ORIGINS: str = "http://localhost:3000"
    RUN_SCHEDULER: bool = True

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

if not settings.JWT_SECRET_KEY:
    if settings.ENVIRONMENT == "production":
        raise RuntimeError(
            "JWT_SECRET_KEY must be set via environment variable in production. "
            "Refusing to start with no signing key."
        )
    # Dev-only: a random secret generated fresh per process. Never a hardcoded
    # value, so nothing shipped in source control can ever forge a token.
    settings.JWT_SECRET_KEY = secrets.token_hex(32)
    print(
        "WARNING: JWT_SECRET_KEY not set - using a random development-only secret. "
        "Existing sessions will not survive a restart. Set JWT_SECRET_KEY in .env "
        "for a stable local secret."
    )


def get_allowed_origins() -> list[str]:
    return [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]


def get_allowed_emails() -> list[str]:
    return [e.strip() for e in settings.ALLOWED_EMAILS.split(",") if e.strip()]
