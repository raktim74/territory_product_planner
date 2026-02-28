from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt, JWTError

from app.core.config import settings
from app.core.database import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

class TokenData:
    def __init__(self, username: str, tenant_id: int, role: str, user_id: int):
        self.username = username
        self.tenant_id = tenant_id
        self.role = role
        self.user_id = user_id

def get_current_user(token: str = Depends(oauth2_scheme)) -> TokenData:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        tenant_id: int = payload.get("tenant_id")
        role: str = payload.get("role")
        user_id: int = payload.get("user_id")
        
        if username is None or tenant_id is None or user_id is None:
            raise credentials_exception
            
        print(f"DEBUG: Token validated for {username}. Role: {role}, Tenant: {tenant_id}, ID: {user_id}")
        token_data = TokenData(username=username, tenant_id=tenant_id, role=role, user_id=user_id)
    except JWTError:
        raise credentials_exception
        
    return token_data

class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        # Store allowed roles as uppercase for consistent comparison
        self.allowed_roles = [r.upper() for r in allowed_roles]

    def __call__(self, current_user: TokenData = Depends(get_current_user)):
        user_role = current_user.role.upper()
        if user_role not in self.allowed_roles and "ADMIN" != user_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted for your role"
            )
        return current_user
