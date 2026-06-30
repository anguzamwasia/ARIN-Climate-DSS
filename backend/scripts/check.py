from app.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
res = db.execute(text("SELECT COUNT(*) FROM documents WHERE source = 'WHISPER'")).fetchone()
print('WHISPER Count:', res[0])

# Let's also check if they exist under a different source or type
all_types = db.execute(text("SELECT source, COUNT(*) FROM documents GROUP BY source")).fetchall()
print("All sources:", all_types)
