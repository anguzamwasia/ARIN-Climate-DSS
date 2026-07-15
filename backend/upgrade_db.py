from sqlalchemy import create_engine, text
from app.database import engine

def upgrade():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE blogs ADD COLUMN background TEXT"))
            print("Added background column.")
        except Exception as e:
            print("Could not add background column (might already exist):", e)
            
        try:
            conn.execute(text("ALTER TABLE blogs ADD COLUMN implications TEXT"))
            print("Added implications column.")
        except Exception as e:
            print("Could not add implications column (might already exist):", e)
            
        conn.commit()

if __name__ == "__main__":
    upgrade()
