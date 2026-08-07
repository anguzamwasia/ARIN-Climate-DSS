import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.document import Document
from app.models.blog import Blog

db = SessionLocal()

print("ALL DOCUMENTS IN DB:")
for d in db.query(Document).all():
    print(f"ID={d.id}, Title={d.title}")

print("\nALL BLOGS IN DB:")
for b in db.query(Blog).all():
    print(f"ID={b.id}, Title={b.title}, Author={b.author_name}, Status={b.status}")

db.close()
