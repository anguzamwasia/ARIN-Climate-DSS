from app.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
# Delete UNFCCC reports labeled Africa (Global)
res = db.execute(text("DELETE FROM documents WHERE source = 'UNFCCC' AND country = 'Africa (Global)'"))
db.commit()
print("Deleted rows:", res.rowcount)
