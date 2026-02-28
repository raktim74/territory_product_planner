import asyncio
from sqlalchemy import text
from app.core.database import engine

async def migrate():
    try:
        async with engine.begin() as conn:
            print("Attempting MTD/QTD/YTD column migration for regional_prices...")
            try:
                await conn.execute(text("ALTER TABLE regional_prices ADD COLUMN IF NOT EXISTS mtd_forecast FLOAT"))
                await conn.execute(text("ALTER TABLE regional_prices ADD COLUMN IF NOT EXISTS qtd_forecast FLOAT"))
                await conn.execute(text("ALTER TABLE regional_prices ADD COLUMN IF NOT EXISTS ytd_forecast FLOAT"))
                print("Performance columns added successfully.")
            except Exception as e:
                print(f"Postgres-style migration failed ({e}), trying manual approach...")
                try:
                    await conn.execute(text("ALTER TABLE regional_prices ADD COLUMN mtd_forecast FLOAT"))
                    await conn.execute(text("ALTER TABLE regional_prices ADD COLUMN qtd_forecast FLOAT"))
                    await conn.execute(text("ALTER TABLE regional_prices ADD COLUMN ytd_forecast FLOAT"))
                    print("Manual performance column addition successful.")
                except Exception as inner_e:
                    print(f"Columns might already exist or table missing: {inner_e}")
    except Exception as outer_e:
        print(f"Migration aborted: {outer_e}")

if __name__ == "__main__":
    asyncio.run(migrate())
