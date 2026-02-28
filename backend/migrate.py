import asyncio
from sqlalchemy import text
from app.core.database import engine

async def migrate():
    try:
        async with engine.begin() as conn:
            # PostgreSQL logic - if it fails (e.g. SQLite), it will fall through
            print("Attempting column migration for regional_prices...")
            try:
                await conn.execute(text("ALTER TABLE regional_prices ADD COLUMN IF NOT EXISTS sell_in_price FLOAT"))
                await conn.execute(text("ALTER TABLE regional_prices ADD COLUMN IF NOT EXISTS sell_out_price FLOAT"))
                print("Columns added successfully.")
            except Exception as e:
                # If IF NOT EXISTS is not supported (like SQLite), try manual add
                print(f"Postgres-style migration failed ({e}), trying manual approach...")
                try:
                    await conn.execute(text("ALTER TABLE regional_prices ADD COLUMN sell_in_price FLOAT"))
                    await conn.execute(text("ALTER TABLE regional_prices ADD COLUMN sell_out_price FLOAT"))
                    print("Manual column addition successful.")
                except Exception as inner_e:
                    print(f"Columns might already exist or table missing: {inner_e}")
    except Exception as outer_e:
        print(f"Migration aborted: {outer_e}")

if __name__ == "__main__":
    asyncio.run(migrate())
