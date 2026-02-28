import enum
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class TerritoryType(str, enum.Enum):
    COUNTRY = "COUNTRY"
    STATE = "STATE"
    DISTRICT = "DISTRICT"
    CITY = "CITY"
    ZIP = "ZIP"

class Territory(Base):
    __tablename__ = "territories"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    
    name = Column(String, index=True, nullable=False)
    type = Column(Enum(TerritoryType, native_enum=False), nullable=False)
    
    # Self-referencing foreign key for nested geographic structures
    parent_id = Column(Integer, ForeignKey("territories.id"), nullable=True)
    
    # Optional field to store GIS data (GeoJSON) for map boundary rendering
    map_polygon = Column(JSON, nullable=True) 
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    assignments = relationship("UserTerritory", back_populates="territory")


class UserTerritory(Base):
    __tablename__ = "user_territories"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    territory_id = Column(Integer, ForeignKey("territories.id"), nullable=False)
    
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    
    territory = relationship("Territory", back_populates="assignments")
