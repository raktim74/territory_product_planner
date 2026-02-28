from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.api.dependencies import get_current_user, TokenData, RoleChecker
from app.domain.territory.schemas import TerritoryCreate, TerritoryResponse, UserTerritoryAssign, UserTerritoryResponse, TerritoryWithAssignees
from app.services.territory_service import TerritoryService

router = APIRouter()

@router.get("/", response_model=List[TerritoryWithAssignees])
async def list_territories(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    """
    List all territories within the user's tenant, including who assigned to them.
    """
    service = TerritoryService(db)
    return await service.get_all_territories(current_user.tenant_id)

@router.get("/me/assigned", response_model=List[TerritoryResponse])
async def get_my_territories(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    """
    Get territories explicitly assigned to the logged-in user.
    """
    service = TerritoryService(db)
    return await service.get_user_territories(current_user.user_id, current_user.tenant_id)

@router.post("/", response_model=TerritoryResponse)
async def create_territory(
    territory_in: TerritoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(RoleChecker(["ADMIN", "REGIONAL_MANAGER"]))
):
    """
    Create a new territory. Only Admins and RegionalManagers can create boundaries.
    """
    service = TerritoryService(db)
    return await service.create_territory(obj_in=territory_in, tenant_id=current_user.tenant_id)


@router.post("/assign", response_model=UserTerritoryResponse)
async def assign_territory(
    assign_data: UserTerritoryAssign,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(RoleChecker(["ADMIN", "REGIONAL_MANAGER", "ZONAL_MANAGER"]))
):
    """
    Assign a territory to a specific user (Manager or Sales Rep).
    Validates overlap to prevent double assignment out of the box.
    """
    service = TerritoryService(db)
    return await service.assign_user(assign_data, current_user.tenant_id)

@router.delete("/assign/{territory_id}")
async def revoke_territory_assignment(
    territory_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(RoleChecker(["ADMIN", "REGIONAL_MANAGER", "ZONAL_MANAGER"]))
):
    """
    Revoke a territory assignment.
    """
    service = TerritoryService(db)
    return await service.revoke_assignment(territory_id, current_user.tenant_id)

@router.get("/{territory_id}", response_model=TerritoryResponse)
async def get_territory(
    territory_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    service = TerritoryService(db)
    return await service.get_territory(current_user.tenant_id, territory_id)

@router.put("/{territory_id}", response_model=TerritoryResponse)
async def update_territory(
    territory_id: int,
    territory_in: TerritoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(RoleChecker(["ADMIN", "REGIONAL_MANAGER"]))
):
    service = TerritoryService(db)
    return await service.update_territory(current_user.tenant_id, territory_id, territory_in)

@router.delete("/{territory_id}")
async def delete_territory(
    territory_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(RoleChecker(["ADMIN", "REGIONAL_MANAGER"]))
):
    service = TerritoryService(db)
    return await service.delete_territory(current_user.tenant_id, territory_id)
