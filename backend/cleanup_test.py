import os
import sys

# Ensure backend directory is in python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.document import Document
from app.models.blog import Blog

db = SessionLocal()

print("Scanning for test data to delete...")

# Delete documents matching 'MST 8102'
docs = db.query(Document).filter(Document.title.ilike("%MST 8102%")).all()
for d in docs:
    print(f"Deleting document: ID={d.id}, Title={d.title}")
    db.delete(d)

# Delete blogs matching 'Responsible AI'
blogs = db.query(Blog).filter(Blog.title.ilike("%Responsible AI%")).all()
for b in blogs:
    print(f"Deleting blog: ID={b.id}, Title={b.title}")
    db.delete(b)

db.commit()
print("Cleanup completed successfully.")
db.close()
