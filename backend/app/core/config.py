"""
Phase 2: centralized environment/config loading + dependency injection.

Every route/service should depend on `SettingsDep` (a FastAPI `Depends`)
rather than importing `get_settings()` directly, so tests can override
settings per-test via `app.dependency_overrides` without touching env vars
or monkeypatching a module-level singleton.
"""
import os
from functools import lru_cache
from typing import Annotated

from dotenv import load_dotenv
from fastapi import Depends

load_dotenv()  # reads backend/.env into os.environ — must run before Settings() does


class Settings:
    def __init__(self) -> None:
        self.aws_region: str = os.getenv("AWS_REGION", "ap-south-1")
        self.s3_bucket: str = os.getenv("S3_BUCKET", "campus-workflow-ai-docs-dev-147885312034-ap-south-1")
        self.dynamodb_table: str = os.getenv("DYNAMODB_TABLE", "CampusWorkflowTable-dev")
        self.bedrock_model_id: str = os.getenv(
            "BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20241022-v2:0"
        )
        # Phase 7: Gemini (Google AI Studio, free tier) for the LangGraph fallback node.
        # "gemini-flash-latest" is Google's own alias for their current flash model —
        # deliberately not pinning a version number, since Gemini's model names have
        # already moved twice (2.x -> 3.6 -> 3.7/3.8) in the time this project's been built.
        self.google_api_key: str = os.getenv("GOOGLE_API_KEY", "")
        self.gemini_model_id: str = os.getenv("GEMINI_MODEL_ID", "gemini-flash-latest")
        # Comma-separated list of allowed origins for CORS.
        self.cors_origins: str = os.getenv("CORS_ORIGINS", "http://localhost:5173")
        # Supabase JWT secret — from Supabase Dashboard → Project Settings → API → JWT Settings.
        self.supabase_jwt_secret: str = os.getenv("SUPABASE_JWT_SECRET", "")

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    def __repr__(self) -> str:
        return (
            f"Settings(aws_region={self.aws_region!r}, s3_bucket={self.s3_bucket!r}, "
            f"dynamodb_table={self.dynamodb_table!r}, cors_origins={self.cors_origins_list!r})"
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()


# Typed dependency: `def handler(settings: SettingsDep): ...`
SettingsDep = Annotated[Settings, Depends(get_settings)]
