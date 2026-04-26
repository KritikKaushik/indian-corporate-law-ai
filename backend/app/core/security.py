
from datetime import datetime, timedelta, timezone
import jwt
from fastapi import HTTPException, status
from backend.app.core.config import load_config


def create_access_token(data: dict) -> str:
    """Mint a JWT with expiry."""
    config = load_config()
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(
        hours=config["jwt_expire_hours"]
    )
    return jwt.encode(payload, config["jwt_secret"], algorithm=config["jwt_algorithm"])


def verify_token(token: str) -> dict:
    """Decode & verify JWT; raises 401 on failure."""
    config = load_config()
    try:
        return jwt.decode(
            token, config["jwt_secret"], algorithms=[config["jwt_algorithm"]]
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")


def extract_user_from_token(token: str) -> str:
    """Return user_id (sub) from token."""
    payload = verify_token(token)
    uid = payload.get("sub")
    if not uid:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token missing subject")
    return uid
