from app.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()

# Delete duplicate documents, keeping the one with the lowest ID
delete_query = """
DELETE FROM documents
WHERE id NOT IN (
    SELECT MIN(id)
    FROM documents
    GROUP BY title, source, country
);
"""

try:
    res = db.execute(text(delete_query))
    db.commit()
    print(f"Duplicates removed successfully. Deleted rows: {res.rowcount}")
except Exception as e:
    db.rollback()
    print(f"Error removing duplicates: {e}")
