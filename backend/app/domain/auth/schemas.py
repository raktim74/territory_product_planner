from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.domain.auth.models import RoleEnum

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class TenantCreate(BaseModel):
    name: str

class TenantResponse(BaseModel):
    id: int
    name: str
    is_active: bool
    created_at: datetime
    
    class Config:
        orm_mode = True
        from_attributes = True

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    tenant_id: int
    role_id: int

class RoleResponse(BaseModel):
    id: int
    name: str # RoleEnum name
    permissions: List[str]
    
    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    tenant_id: int
    role_id: int
    is_active: bool
    role: Optional[RoleResponse] = None
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str
