from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from backend.app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


class SignupRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(req: SignupRequest):
    """Register a new user account."""
    if len(req.password) < 8:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Password must be ≥ 8 chars")
    return await auth_service.signup(req.email, req.password)


@router.post("/login")
async def login(req: LoginRequest):
    """Authenticate and receive a JWT bearer token."""
    return await auth_service.login(req.email, req.password)
