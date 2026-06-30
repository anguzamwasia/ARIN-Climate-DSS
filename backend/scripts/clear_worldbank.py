from app.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
db.execute(text("DELETE FROM documents WHERE source = 'World Bank'"))
db.commit()
print("Deleted all World Bank records to fix invalid county mappings.")
