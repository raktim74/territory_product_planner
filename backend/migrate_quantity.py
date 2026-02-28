import asyncio
from sqlalchemy import text
from app.core.database import engine

async def migrate():
    try:
        async with engine.begin() as conn:
            print("Attempting quantity column migration for regional_prices...")
            try:
                await conn.execute(text("ALTER TABLE regional_prices ADD COLUMN IF NOT EXISTS target_quantity FLOAT"))
                await conn.execute(text("ALTER TABLE regional_prices ADD COLUMN IF NOT EXISTS forecast_quantity FLOAT"))
                print("Quantity columns added successfully.")
            except Exception as e:
                print(f"Postgres-style migration failed ({e}), trying manual approach...")
                try:
                    await conn.execute(text("ALTER TABLE regional_prices ADD COLUMN target_quantity FLOAT"))
                    await conn.execute(text("ALTER TABLE regional_prices ADD COLUMN forecast_quantity FLOAT"))
                    print("Manual quantity column addition successful.")
                except Exception as inner_e:
                    print(f"Columns might already exist or table missing: {inner_e}")
    except Exception as outer_e:
        print(f"Migration aborted: {outer_e}")

if __name__ == "__main__":
    asyncio.run(migrate())
