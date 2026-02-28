from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.security import OAuth2PasswordRequestForm
from app.core.database import get_db
from app.domain.auth.schemas import UserCreate, UserLogin, Token, UserResponse, TenantCreate, TenantResponse
from app.services.auth_service import AuthService
from app.api.dependencies import get_current_user, TokenData

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    auth_service = AuthService(db)
    user_login = UserLogin(email=form_data.username, password=form_data.password)
    access_token = await auth_service.authenticate_user(user_login)
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=UserResponse)
async def register_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user inside a tenant.
    """
    auth_service = AuthService(db)
    user = await auth_service.register_user(user_in)
    return user

@router.post("/tenant", response_model=TenantResponse)
async def register_tenant(
    tenant_in: TenantCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new tenant organization.
    """
    auth_service = AuthService(db)
    tenant = await auth_service.register_tenant(tenant_in)
    return tenant

@router.get("/me", response_model=UserResponse)
async def read_users_me(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    """
    Get current user profile (decoded from JWT and verified with DB).
    """
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_id(current_user.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/users", response_model=List[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    """
    List all users in the tenant.
    """
    print(f"DEBUG: list_users called by {current_user.username} for tenant {current_user.tenant_id}")
    auth_service = AuthService(db)
    users = await auth_service.get_all_users(current_user.tenant_id)
    return users
