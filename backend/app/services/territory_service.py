from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from typing import List

from app.domain.territory.repository import TerritoryRepository
from app.domain.auth.repository import UserRepository
from app.domain.territory.schemas import TerritoryCreate, TerritoryResponse, UserTerritoryAssign, UserTerritoryResponse, TerritoryWithAssignees

class TerritoryService:
    def __init__(self, session: AsyncSession):
        self.repo = TerritoryRepository(session)
        self.user_repo = UserRepository(session)

    async def get_all_territories(self, tenant_id: int) -> List[TerritoryWithAssignees]:
        territories = await self.repo.get_all_by_tenant(tenant_id)
        assignments = await self.repo.get_assignments(tenant_id)

        # Map logic to link users to territories in response
        assignment_map = {}
        for a in assignments:
            if a.territory_id not in assignment_map:
                assignment_map[a.territory_id] = []
            assignment_map[a.territory_id].append(a.user_id)
            
        result = []
        for t in territories:
            t_data = TerritoryWithAssignees.model_validate(t)
            t_data.assigned_users = assignment_map.get(t.id, [])
            result.append(t_data)
            
        return result

    async def create_territory(self, obj_in: TerritoryCreate, tenant_id: int) -> TerritoryResponse:
        # Validate parent if exists
        if obj_in.parent_id:
            parent = await self.repo.get_by_id(obj_in.parent_id, tenant_id)
            if not parent:
                raise HTTPException(status_code=400, detail="Parent territory does not exist or belongs to another tenant")

        new_t = await self.repo.create(obj_in, tenant_id)
        return TerritoryResponse.model_validate(new_t)

    async def assign_user(self, assign_data: UserTerritoryAssign, tenant_id: int) -> UserTerritoryResponse:
        # 1. Validate Territory exists in Tenant
        territory = await self.repo.get_by_id(assign_data.territory_id, tenant_id)
        if not territory:
            raise HTTPException(status_code=404, detail="Territory not found")
            
        # 2. Validate User exists in Tenant
        user = await self.user_repo.get_by_id(assign_data.user_id)
        if not user or user.tenant_id != tenant_id:
            raise HTTPException(status_code=404, detail="User not found in tenant")

        # 3. Check for overlaps or double assignments.
        # For this version: Prevent assigning a territory that already has an owner.
        existing_assignment = await self.repo.get_assignment_by_territory(assign_data.territory_id, tenant_id)
        if existing_assignment:
            # Overlap algorithm rule: if someone owns the territory, revoke explicitly first or fail.
            raise HTTPException(
                status_code=400, 
                detail=f"Territory {territory.name} is already assigned to user_id {existing_assignment.user_id}"
            )
            
        new_assignment = await self.repo.create_assignment(assign_data, tenant_id)
        return UserTerritoryResponse.model_validate(new_assignment)

    async def revoke_assignment(self, territory_id: int, tenant_id: int):
        await self.repo.delete_assignment(territory_id, tenant_id)
        return {"status": "success", "message": "Assignment revoked"}

    async def get_territory(self, tenant_id: int, territory_id: int) -> TerritoryResponse:
        territory = await self.repo.get_by_id(territory_id, tenant_id)
        if not territory:
            raise HTTPException(status_code=404, detail="Territory not found")
        return TerritoryResponse.model_validate(territory)

    async def update_territory(self, tenant_id: int, territory_id: int, obj_in: TerritoryCreate) -> TerritoryResponse:
        territory = await self.repo.get_by_id(territory_id, tenant_id)
        if not territory:
            raise HTTPException(status_code=404, detail="Territory not found")
        
        update_data = obj_in.model_dump(exclude_unset=True)
        if 'type' in update_data:
            update_data['type'] = update_data['type'].value if hasattr(update_data['type'], 'value') else update_data['type']
            
        updated_t = await self.repo.update(territory, update_data)
        return TerritoryResponse.model_validate(updated_t)

    async def delete_territory(self, tenant_id: int, territory_id: int):
        territory = await self.repo.get_by_id(territory_id, tenant_id)
        if not territory:
            raise HTTPException(status_code=404, detail="Territory not found")
        await self.repo.delete(territory)
        return {"status": "success", "message": "Territory deleted"}

    async def get_user_territories(self, user_id: int, tenant_id: int) -> List[TerritoryResponse]:
        territories = await self.repo.get_by_user(user_id, tenant_id)
        return [TerritoryResponse.model_validate(t) for t in territories]
