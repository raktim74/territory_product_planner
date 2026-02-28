from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from typing import List, Dict, Optional
from app.domain.hierarchy.repository import HierarchyRepository
from app.domain.auth.repository import UserRepository
from app.domain.territory.repository import TerritoryRepository
from app.domain.hierarchy.schemas import OrgTreeNode, OrgNodeUser, OrgNodeTerritory

class HierarchyService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = HierarchyRepository(session)
        self.user_repo = UserRepository(session)
        self.territory_repo = TerritoryRepository(session)

    async def assign_manager(self, user_id: int, manager_id: int, tenant_id: int):
        # Validate that user & manager exist in same tenant
        user = await self.user_repo.get_by_id(user_id)
        if not user or user.tenant_id != tenant_id:
            raise HTTPException(status_code=404, detail="User not found in tenant")
            
        manager = await self.user_repo.get_by_id(manager_id)
        if not manager or manager.tenant_id != tenant_id:
            raise HTTPException(status_code=404, detail="Manager not found in tenant")
            
        # Optional: Add checks here to prevent circular dependency (e.g., setting a manager to report to their subordinate)
        
        return await self.repo.set_manager(user_id, manager_id, tenant_id)

    async def get_org_tree(self, tenant_id: int) -> List[OrgTreeNode]:
        """
        Builds the complete hierarchical Org Tree in-memory for the given tenant.
        Now includes mapped territories (areas) for each user.
        """
        raw_nodes = await self.repo.get_full_tree_nodes(tenant_id)
        
        # Fetch territory assignments
        all_territories = await self.territory_repo.get_all_by_tenant(tenant_id)
        assignments = await self.territory_repo.get_assignments(tenant_id)
        
        territory_dict = {t.id: t for t in all_territories}
        user_territory_map: Dict[int, List[OrgNodeTerritory]] = {}
        
        for assignment in assignments:
            if assignment.user_id not in user_territory_map:
                user_territory_map[assignment.user_id] = []
            if assignment.territory_id in territory_dict:
                t = territory_dict[assignment.territory_id]
                user_territory_map[assignment.user_id].append(
                    OrgNodeTerritory(id=t.id, name=t.name, type=t.type.value if hasattr(t.type, 'value') else str(t.type))
                )

        # We need to construct nested JSON
        node_map: Dict[int, OrgTreeNode] = {}
        roots: List[OrgTreeNode] = []
        
        # 1. First pass: Create dict of all node objects
        for hierarchy, user, role in raw_nodes:
            tree_node = OrgTreeNode(
                hierarchy_id=hierarchy.id,
                user=OrgNodeUser(
                    id=user.id,
                    email=user.email,
                    role=role.name.value,
                    territories=user_territory_map.get(user.id, [])
                ),
                children=[]
            )
            node_map[user.id] = tree_node
            
        # 2. Second pass: Construct tree by linking children to managers
        for hierarchy, user, role in raw_nodes:
            current_node = node_map[user.id]
            manager_id = hierarchy.manager_id
            
            # If the manager exists and is in our map, string them together
            if manager_id and manager_id in node_map:
                node_map[manager_id].children.append(current_node)
            else:
                # No valid manager, this is a root node (Global Admin / CEO)
                roots.append(current_node)
                
        return roots
