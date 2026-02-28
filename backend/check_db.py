import asyncio
from sqlalchemy import inspect
from app.core.database import engine
from app.domain.product.models import RegionalPricing

async def check():
    async with engine.connect() as conn:
        def get_cols(connection):
            from sqlalchemy import inspect
            return inspect(connection).get_columns('regional_prices')
        columns = await conn.run_sync(get_cols)
        print([c['name'] for c in columns])

if __name__ == "__main__":
    asyncio.run(check())
