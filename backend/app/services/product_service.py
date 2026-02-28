from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from typing import List, Optional
from app.domain.product.repository import ProductRepository, RegionalPricingRepository
from app.domain.auth.repository import UserRepository
from app.domain.territory.repository import TerritoryRepository
from app.domain.product.schemas import ProductCreate, ProductResponse, RegionalPricingCreate, RegionalPricingResponse, ProductWithPrices

class ProductService:
    def __init__(self, session: AsyncSession):
        self.repo = ProductRepository(session)
        self.price_repo = RegionalPricingRepository(session)
        self.user_repo = UserRepository(session)
        self.territory_repo = TerritoryRepository(session)

    async def get_all_products(self, tenant_id: int, skip: int = 0, limit: int = 100) -> List[ProductResponse]:
        results = await self.repo.get_multi(tenant_id, skip, limit)
        response = []
        for p, count in results:
            p_data = ProductResponse.model_validate(p)
            p_data.price_overrides_count = count
            response.append(p_data)
        return response

    async def get_product(self, tenant_id: int, product_id: int) -> ProductWithPrices:
        product = await self.repo.get_by_id(tenant_id, product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        prices = await self.price_repo.get_by_product(tenant_id, product_id)
        
        product_data = ProductWithPrices.model_validate(product)
        product_data.prices = [RegionalPricingResponse.model_validate(pr) for pr in prices]
        return product_data

    async def create_product(self, tenant_id: int, obj_in: ProductCreate) -> ProductResponse:
        existing = await self.repo.get_by_sku(tenant_id, obj_in.sku)
        if existing:
            raise HTTPException(status_code=400, detail="Product with this SKU already exists in tenant")
        
        product = await self.repo.create(tenant_id, obj_in)
        return ProductResponse.model_validate(product)

    async def plan_regional_pricing(self, tenant_id: int, user_email: str, user_role: str, obj_in: RegionalPricingCreate) -> RegionalPricingResponse:
        # 1. Validate product
        product = await self.repo.get_by_id(tenant_id, obj_in.product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        # 2. Check Authorization: ADMIN can do anything
        if user_role.upper() != "ADMIN":
            if not obj_in.territory_id:
                raise HTTPException(status_code=403, detail="Only admins can set global price overrides")
                
            # Check if user is assigned to this territory
            user = await self.user_repo.get_by_email(user_email)
            if not user:
                 raise HTTPException(status_code=404, detail="User not found")
            
            assignment = await self.territory_repo.get_assignment_by_user_and_territory(
                user.id, obj_in.territory_id, tenant_id
            )
            if not assignment:
                raise HTTPException(status_code=403, detail="You are not assigned to this area to plan prices")

        # 3. Upsert Logic: check if mapping exists
        existing_price = await self.price_repo.get_by_territory(tenant_id, obj_in.product_id, obj_in.territory_id)
        if existing_price:
            updated = await self.price_repo.update(existing_price, obj_in.model_dump(exclude_unset=True))
            return RegionalPricingResponse.model_validate(updated)
            
        pricing = await self.price_repo.create(tenant_id, obj_in)
        return RegionalPricingResponse.model_validate(pricing)

    async def update_product(self, tenant_id: int, product_id: int, obj_in: ProductCreate) -> ProductResponse:
        product = await self.repo.get_by_id(tenant_id, product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        updated_p = await self.repo.update(product, obj_in.model_dump(exclude_unset=True))
        return ProductResponse.model_validate(updated_p)

    async def delete_product(self, tenant_id: int, product_id: int):
        product = await self.repo.get_by_id(tenant_id, product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        await self.repo.delete(product)
        return {"status": "success", "message": "Product deleted"}

    async def get_dashboard_analytics(self, tenant_id: int, user_email: str, user_role: str):
        from sqlalchemy import select, func, cast, Float
        from app.domain.product.models import RegionalPricing
        
        session = self.repo.session
        
        if user_role.upper() == "ADMIN":
            stmt = select(
                func.sum(func.coalesce(RegionalPricing.target_quantity, 0) * func.coalesce(RegionalPricing.override_price, 0)).label("target"),
                func.sum(func.coalesce(RegionalPricing.ytd_forecast, 0) * func.coalesce(RegionalPricing.override_price, 0)).label("ytd"),
                func.sum(func.coalesce(RegionalPricing.sell_in_price, 0) * func.coalesce(RegionalPricing.target_quantity, 0)).label("sellin")
            ).where(RegionalPricing.tenant_id == tenant_id)
            result = await session.execute(stmt)
            row = result.first()
            
            target = float(row.target) if row and row.target is not None else 0.0
            ytd = float(row.ytd) if row and row.ytd is not None else 0.0
            sellin = float(row.sellin) if row and row.sellin is not None else 0.0
            
            max_val = max(target, ytd, sellin) or 1.0
            return [
                {"label": "Global Target Revenue", "value": target, "percentage": min(100, (target / max_val)*100) if target > 0 else 0},
                {"label": "Global YTD Pipeline", "value": ytd, "percentage": min(100, (ytd / max_val)*100) if target > 0 else 0},
                {"label": "Global Sell-In Channel", "value": sellin, "percentage": min(100, (sellin / max_val)*100) if target > 0 else 0}
            ]
        else:
            user = await self.user_repo.get_by_email(user_email)
            if not user:
                return []
            assignments = await self.territory_repo.get_assignment_by_user_id(user.id)
            terr_ids = [a.territory_id for a in assignments]
            
            if not terr_ids:
                return [
                   {"label": "Actual Revenue (YTD)", "value": 0, "percentage": 0 },
                   {"label": "Projected Target Forecast", "value": 0, "percentage": 0 },
                   {"label": "Channel Sell-In Value", "value": 0, "percentage": 0}
                ]
                
            stmt = select(
                func.sum(func.coalesce(RegionalPricing.ytd_forecast, 0) * func.coalesce(RegionalPricing.override_price, 0)).label("ytd"),
                func.sum(func.coalesce(RegionalPricing.target_quantity, 0) * func.coalesce(RegionalPricing.override_price, 0)).label("target"),
                func.sum(func.coalesce(RegionalPricing.sell_in_price, 0) * func.coalesce(RegionalPricing.target_quantity, 0)).label("sellin")
            ).where(RegionalPricing.tenant_id == tenant_id, RegionalPricing.territory_id.in_(terr_ids))
            
            result = await session.execute(stmt)
            row = result.first()
            
            ytd = float(row.ytd) if row and row.ytd is not None else 0.0
            target = float(row.target) if row and row.target is not None else 0.0
            sellin = float(row.sellin) if row and row.sellin is not None else 0.0
            
            max_val = max(target, ytd, sellin) or 1.0
            
            return [
                {"label": "My Target Forecast", "value": target, "percentage": 100 if target > 0 else 0},
                {"label": "My Actual YTD", "value": ytd, "percentage": min(100, (ytd / max_val)*100) if max_val > 0 and ytd > 0 else 0},
                {"label": "My Channel Sell-In", "value": sellin, "percentage": min(100, (sellin / max_val)*100) if max_val > 0 and sellin > 0 else 0}
            ]
