from pydantic import BaseModel, EmailStr
from typing import Optional, List

class OrgNodeTerritory(BaseModel):
    id: int
    name: str
    type: str

# Basic display schema for a user in the tree
class OrgNodeUser(BaseModel):
    id: int
    email: EmailStr
    role: str
    territories: List[OrgNodeTerritory] = []

    class Config:
        orm_mode = True
        from_attributes = True

class HierarchyCreate(BaseModel):
    user_id: int
    manager_id: Optional[int] = None

class HierarchyResponse(BaseModel):
    id: int
    user_id: int
    manager_id: Optional[int]
    tenant_id: int

    class Config:
        orm_mode = True
        from_attributes = True

# Recursive Definition for the nested Tree structure
class OrgTreeNode(BaseModel):
    hierarchy_id: int
    user: OrgNodeUser
    children: List['OrgTreeNode'] = []

# This enables the circular reference for the children list
OrgTreeNode.model_rebuild()
