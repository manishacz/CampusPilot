# app/core/auth.py
"""
Supabase JWT verification. Get the shared secret from Supabase Dashboard ->
Project Settings -> API -> JWT Settings -> "JWT Secret". (If that page shows
"JWT Signing Keys" with an asymmetric algorithm instead, your project uses
the newer JWKS-based scheme — check which one you have before using this.)
"""

from fastapi import Header, HTTPException
from jose import jwt, JWTError

from app.core.config import get_settings


def get_current_user_id(authorization: str = Header(...)) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.removeprefix("Bearer ").strip()

    try:
        payload = jwt.decode(
            token, get_settings().supabase_jwt_secret,
            algorithms=["HS256"], audience="authenticated",
        )
    except JWTError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}")

    return payload["sub"]  # Supabase's user.id