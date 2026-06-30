from app.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()

print("--- OVERNIGHT SCRAPING RESULTS ---")
res = db.execute(text("SELECT source, count(*) FROM documents GROUP BY source ORDER BY count DESC"))
for row in res:
    print(f"{row[0]}: {row[1]} reports")
