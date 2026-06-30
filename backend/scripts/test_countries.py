from app.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
res = db.execute(text("SELECT DISTINCT country FROM documents WHERE source = 'World Bank'")).fetchall()
print("Countries:")
for r in res:
    print(r[0])
