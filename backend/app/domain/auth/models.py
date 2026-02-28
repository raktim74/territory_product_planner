import enum
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Tenant(Base):
    __tablename__ = "tenants"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")

class RoleEnum(str, enum.Enum):
    ADMIN = "ADMIN"
    REGIONAL_MANAGER = "REGIONAL_MANAGER"
    ZONAL_MANAGER = "ZONAL_MANAGER"
    TERRITORY_MANAGER = "TERRITORY_MANAGER"
    SALES_REP = "SALES_REP"

class Role(Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(Enum(RoleEnum, native_enum=False), unique=True, index=True, nullable=False)
    permissions = Column(JSON, default=list) # e.g., ["read:territory", "write:users"]
    
    users = relationship("User", back_populates="role")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    tenant = relationship("Tenant", back_populates="users")
    role = relationship("Role", back_populates="users")
