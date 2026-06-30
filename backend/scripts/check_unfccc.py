from app.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
res = db.execute(text("SELECT COUNT(*) FROM documents WHERE source = 'UNFCCC'")).fetchone()
print("UNFCCC count:", res[0])
