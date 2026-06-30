from app.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
res = db.execute(text("SELECT title, source, country FROM documents WHERE source IN ('KNBS', 'KMD')")).fetchall()
print('Count:', len(res))
for r in res[:5]:
    print(r)
