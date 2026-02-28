from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    
    name = Column(String, index=True, nullable=False)
    sku = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    base_price = Column(Float, nullable=False)
    category = Column(String, nullable=True)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # We enforce that a SKU is unique within a single SaaS tenant.
    __table_args__ = (UniqueConstraint('tenant_id', 'sku', name='uq_tenant_sku'),)
    
    regional_prices = relationship("RegionalPricing", back_populates="product", cascade="all, delete-orphan")


class RegionalPricing(Base):
    __tablename__ = "regional_prices"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    
    # Optional mapping: If territory_id is NULL, it's the global override for the tenant
    territory_id = Column(Integer, ForeignKey("territories.id"), nullable=True, index=True)
    
    override_price = Column(Float, nullable=False) # Master Planning Price
    sell_in_price = Column(Float, nullable=True)   # From Brand to Distributor
    sell_out_price = Column(Float, nullable=True)  # From Retailer to Consumer
    target_quantity = Column(Float, nullable=True) # Quantity Target (Sell-in)
    forecast_quantity = Column(Float, nullable=True) # Quantity Forecast (Sell-out)
    mtd_forecast = Column(Float, nullable=True) # Month-to-Date Forecast
    qtd_forecast = Column(Float, nullable=True) # Quarter-to-Date Forecast
    ytd_forecast = Column(Float, nullable=True) # Year-to-Date Forecast
    currency = Column(String, default="USD", nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # A single product can only have ONE price override per territory (per tenant)
    __table_args__ = (UniqueConstraint('tenant_id', 'product_id', 'territory_id', name='uq_product_territory_price'),)
    
    product = relationship("Product", back_populates="regional_prices")
