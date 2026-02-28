from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ProductBase(BaseModel):
    name: str = Field(..., max_length=255)
    sku: str = Field(..., max_length=100)
    description: Optional[str] = None
    base_price: float = Field(..., gt=0)
    category: Optional[str] = None
    is_active: bool = True

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    tenant_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    price_overrides_count: int = 0
    
    class Config:
        orm_mode = True
        from_attributes = True

class RegionalPricingBase(BaseModel):
    territory_id: Optional[int] = None
    override_price: float = Field(..., gt=0)
    sell_in_price: Optional[float] = Field(None, ge=0)
    sell_out_price: Optional[float] = Field(None, ge=0)
    target_quantity: Optional[float] = Field(None, ge=0)
    forecast_quantity: Optional[float] = Field(None, ge=0)
    mtd_forecast: Optional[float] = Field(None, ge=0)
    qtd_forecast: Optional[float] = Field(None, ge=0)
    ytd_forecast: Optional[float] = Field(None, ge=0)
    currency: str = Field(default="USD", max_length=10)

class RegionalPricingCreate(RegionalPricingBase):
    product_id: int

class RegionalPricingResponse(RegionalPricingBase):
    id: int
    product_id: int
    tenant_id: int
    created_at: datetime
    
    class Config:
        orm_mode = True
        from_attributes = True

class ProductWithPrices(ProductResponse):
    prices: List[RegionalPricingResponse] = []
