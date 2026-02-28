from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.domain.hierarchy.models import OrgHierarchy
from app.domain.auth.models import User, Role
from app.domain.hierarchy.schemas import HierarchyCreate
from typing import List, Optional

class HierarchyRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_user(self, user_id: int, tenant_id: int) -> Optional[OrgHierarchy]:
        stmt = select(OrgHierarchy).where(
            OrgHierarchy.user_id == user_id, 
            OrgHierarchy.tenant_id == tenant_id
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def set_manager(self, user_id: int, manager_id: int, tenant_id: int) -> OrgHierarchy:
        existing = await self.get_by_user(user_id, tenant_id)
        if existing:
            existing.manager_id = manager_id
            await self.session.commit()
            await self.session.refresh(existing)
            return existing
        else:
            new_node = OrgHierarchy(
                user_id=user_id,
                manager_id=manager_id,
                tenant_id=tenant_id
            )
            self.session.add(new_node)
            await self.session.commit()
            await self.session.refresh(new_node)
            return new_node

    async def get_full_tree_nodes(self, tenant_id: int):
        """
        Fetches all hierarchy nodes and joins User + Role in a single efficient query.
        """
        stmt = (
            select(OrgHierarchy, User, Role)
            .join(User, OrgHierarchy.user_id == User.id)
            .join(Role, User.role_id == Role.id)
            .where(OrgHierarchy.tenant_id == tenant_id)
        )
        result = await self.session.execute(stmt)
        return result.all()
