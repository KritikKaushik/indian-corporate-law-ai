import logging
import bcrypt
from fastapi import HTTPException, status
from backend.app.db import mongo
from backend.app.core.security import create_access_token

logger = logging.getLogger(__name__)


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def _verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


async def signup(email: str, password: str) -> dict:
    if await mongo.find_user_by_email(email):
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")

    pw_hash = _hash_password(password)
    user    = await mongo.create_user(email, pw_hash)
    logger.info(f"[OK] New user registered: {email}")
    return {"user_id": str(user["_id"]), "email": email}


async def login(email: str, password: str) -> dict:
    user = await mongo.find_user_by_email(email)
    if not user or not _verify_password(password, user["password_hash"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")

    token = create_access_token({"sub": str(user["_id"]), "email": email})
    logger.info(f"[OK] Login: {email}")
    return {
        "access_token": token,
        "token_type":   "bearer",
        "user_id":      str(user["_id"]),
        "email":        email,
    }
