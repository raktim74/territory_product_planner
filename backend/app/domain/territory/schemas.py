from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime
from app.domain.territory.models import TerritoryType

class TerritoryBase(BaseModel):
    name: str
    type: TerritoryType
    parent_id: Optional[int] = None
    map_polygon: Optional[Any] = None

class TerritoryCreate(TerritoryBase):
    pass

class TerritoryResponse(TerritoryBase):
    id: int
    tenant_id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        orm_mode = True
        from_attributes = True

class UserTerritoryAssign(BaseModel):
    user_id: int
    territory_id: int

class UserTerritoryResponse(BaseModel):
    id: int
    user_id: int
    territory_id: int
    assigned_at: datetime
    
    class Config:
        orm_mode = True
        from_attributes = True

class TerritoryWithAssignees(TerritoryResponse):
    assigned_users: List[int] = [] 
