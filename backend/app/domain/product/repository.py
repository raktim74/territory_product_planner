from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from app.domain.product.models import Product, RegionalPricing
from app.domain.product.schemas import ProductCreate, RegionalPricingCreate

class ProductRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_multi(self, tenant_id: int, skip: int = 0, limit: int = 100) -> List[tuple[Product, int]]:
        from sqlalchemy import func
        stmt = (
            select(Product, func.count(RegionalPricing.id).label("price_overrides_count"))
            .outerjoin(RegionalPricing, Product.id == RegionalPricing.product_id)
            .where(Product.tenant_id == tenant_id)
            .group_by(Product.id)
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.all()

    async def get_by_id(self, tenant_id: int, product_id: int) -> Optional[Product]:
        stmt = select(Product).where(Product.tenant_id == tenant_id, Product.id == product_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_by_sku(self, tenant_id: int, sku: str) -> Optional[Product]:
        stmt = select(Product).where(Product.tenant_id == tenant_id, Product.sku == sku)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def create(self, tenant_id: int, obj_in: ProductCreate) -> Product:
        db_obj = Product(
            tenant_id=tenant_id,
            name=obj_in.name,
            sku=obj_in.sku,
            description=obj_in.description,
            base_price=obj_in.base_price,
            category=obj_in.category,
            is_active=obj_in.is_active
        )
        self.session.add(db_obj)
        await self.session.commit()
        await self.session.refresh(db_obj)
        return db_obj

    async def update(self, db_obj: Product, obj_in: dict) -> Product:
        for field, value in obj_in.items():
            setattr(db_obj, field, value)
        self.session.add(db_obj)
        await self.session.commit()
        await self.session.refresh(db_obj)
        return db_obj

    async def delete(self, db_obj: Product):
        await self.session.delete(db_obj)
        await self.session.commit()

class RegionalPricingRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_product(self, tenant_id: int, product_id: int) -> List[RegionalPricing]:
        stmt = select(RegionalPricing).where(
            RegionalPricing.tenant_id == tenant_id, 
            RegionalPricing.product_id == product_id
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def create(self, tenant_id: int, obj_in: RegionalPricingCreate) -> RegionalPricing:
        db_obj = RegionalPricing(
            tenant_id=tenant_id,
            product_id=obj_in.product_id,
            territory_id=obj_in.territory_id,
            override_price=obj_in.override_price,
            sell_in_price=obj_in.sell_in_price,
            sell_out_price=obj_in.sell_out_price,
            target_quantity=obj_in.target_quantity,
            forecast_quantity=obj_in.forecast_quantity,
            mtd_forecast=obj_in.mtd_forecast,
            qtd_forecast=obj_in.qtd_forecast,
            ytd_forecast=obj_in.ytd_forecast,
            currency=obj_in.currency
        )
        self.session.add(db_obj)
        await self.session.commit()
        await self.session.refresh(db_obj)
        return db_obj

    async def get_by_territory(self, tenant_id: int, product_id: int, territory_id: Optional[int]) -> Optional[RegionalPricing]:
        stmt = select(RegionalPricing).where(
            RegionalPricing.tenant_id == tenant_id,
            RegionalPricing.product_id == product_id,
            RegionalPricing.territory_id == territory_id
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def update(self, db_obj: RegionalPricing, obj_in: dict) -> RegionalPricing:
        for field, value in obj_in.items():
            setattr(db_obj, field, value)
        self.session.add(db_obj)
        await self.session.commit()
        await self.session.refresh(db_obj)
        return db_obj

    async def delete(self, db_obj: RegionalPricing):
        await self.session.delete(db_obj)
        await self.session.commit()
