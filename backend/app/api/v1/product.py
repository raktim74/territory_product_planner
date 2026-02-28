from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.api.dependencies import get_current_user, TokenData, RoleChecker
from app.domain.product.schemas import ProductCreate, ProductResponse, RegionalPricingCreate, RegionalPricingResponse, ProductWithPrices
from app.services.product_service import ProductService

router = APIRouter()

@router.get("/", response_model=List[ProductResponse])
async def list_products(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    service = ProductService(db)
    return await service.get_all_products(current_user.tenant_id, skip, limit)

@router.get("/analytics/dashboard")
async def get_dashboard_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    service = ProductService(db)
    return await service.get_dashboard_analytics(current_user.tenant_id, current_user.username, current_user.role)

@router.get("/{product_id}", response_model=ProductWithPrices)
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    service = ProductService(db)
    return await service.get_product(current_user.tenant_id, product_id)

@router.post("/", response_model=ProductResponse)
async def create_product(
    product_in: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(RoleChecker(["ADMIN"]))
):
    service = ProductService(db)
    return await service.create_product(current_user.tenant_id, product_in)

@router.post("/prices", response_model=RegionalPricingResponse)
async def create_regional_pricing(
    pricing_in: RegionalPricingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    """
    Plan/Set regional pricing for a product.
    Service layer handles assignment-based permissions.
    """
    service = ProductService(db)
    return await service.plan_regional_pricing(
        tenant_id=current_user.tenant_id,
        user_email=current_user.username,
        user_role=current_user.role,
        obj_in=pricing_in
    )

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_in: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(RoleChecker(["ADMIN"]))
):
    service = ProductService(db)
    return await service.update_product(current_user.tenant_id, product_id, product_in)

@router.delete("/{product_id}")
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(RoleChecker(["ADMIN"]))
):
    service = ProductService(db)
    return await service.delete_product(current_user.tenant_id, product_id)
