from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.domain.territory.models import Territory, UserTerritory
from app.domain.territory.schemas import TerritoryCreate, UserTerritoryAssign

class TerritoryRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, territory_id: int, tenant_id: int) -> Optional[Territory]:
        stmt = select(Territory).where(Territory.id == territory_id, Territory.tenant_id == tenant_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_by_user(self, user_id: int, tenant_id: int) -> List[Territory]:
        stmt = (
            select(Territory)
            .join(UserTerritory, Territory.id == UserTerritory.territory_id)
            .where(UserTerritory.user_id == user_id, Territory.tenant_id == tenant_id)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_all_by_tenant(self, tenant_id: int) -> List[Territory]:
        stmt = select(Territory).where(Territory.tenant_id == tenant_id).order_by(Territory.type, Territory.name)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def create(self, obj_in: TerritoryCreate, tenant_id: int) -> Territory:
        db_obj = Territory(
            tenant_id=tenant_id,
            name=obj_in.name,
            type=obj_in.type.value,
            parent_id=obj_in.parent_id,
            map_polygon=obj_in.map_polygon
        )
        self.session.add(db_obj)
        await self.session.commit()
        await self.session.refresh(db_obj)
        return db_obj

    async def get_assignments(self, tenant_id: int) -> List[UserTerritory]:
        stmt = select(UserTerritory).where(UserTerritory.tenant_id == tenant_id)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_assignment_by_territory(self, territory_id: int, tenant_id: int) -> Optional[UserTerritory]:
        stmt = select(UserTerritory).where(
            UserTerritory.territory_id == territory_id, 
            UserTerritory.tenant_id == tenant_id
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_assignment_by_user_and_territory(self, user_id: int, territory_id: int, tenant_id: int) -> Optional[UserTerritory]:
        stmt = select(UserTerritory).where(
            UserTerritory.user_id == user_id,
            UserTerritory.territory_id == territory_id,
            UserTerritory.tenant_id == tenant_id
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def create_assignment(self, obj_in: UserTerritoryAssign, tenant_id: int) -> UserTerritory:
        db_obj = UserTerritory(
            tenant_id=tenant_id,
            user_id=obj_in.user_id,
            territory_id=obj_in.territory_id
        )
        self.session.add(db_obj)
        await self.session.commit()
        await self.session.refresh(db_obj)
        return db_obj

    async def delete_assignment(self, territory_id: int, tenant_id: int):
        stmt = select(UserTerritory).where(
            UserTerritory.territory_id == territory_id, 
            UserTerritory.tenant_id == tenant_id
        )
        result = await self.session.execute(stmt)
        assignment = result.scalars().first()
        if assignment:
            await self.session.delete(assignment)
            await self.session.commit()

    async def update(self, db_obj: Territory, obj_in: dict) -> Territory:
        for field, value in obj_in.items():
            setattr(db_obj, field, value)
        self.session.add(db_obj)
        await self.session.commit()
        await self.session.refresh(db_obj)
        return db_obj

    async def delete(self, db_obj: Territory):
        await self.session.delete(db_obj)
        await self.session.commit()
