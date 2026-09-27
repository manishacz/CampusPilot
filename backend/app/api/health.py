"""Liveness/readiness check — the one real endpoint Phase 0 needs."""
from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "healthy"}
