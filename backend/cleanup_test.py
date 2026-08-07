import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.blog import Blog

db = SessionLocal()

print("Deleting test blog...")
blog = db.query(Blog).filter(Blog.id == 13).first()
if blog:
    print(f"Deleting blog: ID={blog.id}, Title={blog.title}")
    db.delete(blog)
    db.commit()
    print("Deleted successfully.")
else:
    print("Blog ID 13 not found.")

db.close()
