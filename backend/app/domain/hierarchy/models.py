from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class OrgHierarchy(Base):
    __tablename__ = "org_hierarchy"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    
    # The subordinate employee
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    
    # The reporting manager (nullable for top-level admin)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # We define relationships in a way that doesn't strictly require bi-directional 
    # to avoid circular import issues, but typically User will back-populate here if needed.
    # A cleaner approach is joining in the service layer for the tree generation.
