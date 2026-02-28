from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.core.database import get_db
from app.domain.hierarchy.schemas import HierarchyCreate, HierarchyResponse, OrgTreeNode
from app.api.dependencies import get_current_user, TokenData, RoleChecker
from app.services.hierarchy_service import HierarchyService

router = APIRouter()

@router.post("/assign", response_model=HierarchyResponse)
async def assign_manager(
    assignment: HierarchyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(RoleChecker(["Admin", "RegionalManager"]))
):
    """
    Assign a manager (manager_id) to a subordinate employee (user_id).
    Strictly bounded within the tenant namespace.
    """
    service = HierarchyService(db)
    result = await service.assign_manager(
        user_id=assignment.user_id,
        manager_id=assignment.manager_id,
        tenant_id=current_user.tenant_id
    )
    return result

@router.get("/tree", response_model=List[OrgTreeNode])
async def build_org_tree(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    """
    Build and return the complete multi-level nested Organization Tree for the
    User's active tenant. Any authenticated user can view the tree.
    """
    service = HierarchyService(db)
    return await service.get_org_tree(tenant_id=current_user.tenant_id)
