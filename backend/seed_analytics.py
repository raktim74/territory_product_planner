import asyncio
from sqlalchemy import select, func
from app.core.database import engine
from app.domain.product.models import RegionalPricing, Product
from app.domain.territory.models import Territory

async def seed():
    async with engine.begin() as conn:
        print("Seeding test regional pricing analytics ...")
        # Ensure at least one product has a price so dashboard isn't all 0s
        await conn.execute(
            RegionalPricing.__table__.insert().values(
                tenant_id=1,
                product_id=1,  # Assuming product 1 exists
                override_price=10.0,
                target_quantity=50000,
                ytd_forecast=25000,
                sell_in_price=8.5,
                currency="USD"
            )
        )
        print("Done")

if __name__ == "__main__":
    asyncio.run(seed())
