from app.database import SessionLocal
from sqlalchemy import text
db = SessionLocal()
res = db.execute(text("SELECT count(*) FROM documents WHERE source='UNFCCC'"))
print('UNFCCC Count:', res.scalar())
