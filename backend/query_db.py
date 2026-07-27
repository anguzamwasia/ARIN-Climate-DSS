# query_db.py
import sys
from app.database import SessionLocal
from app.models.document import Document

db = SessionLocal()
try:
    docs = db.query(Document).filter(Document.source == "WHISPER").all()
    print(f"--- WHISPER DOCS ({len(docs)}) ---")
    for d in docs:
        print(f"ID: {d.id} | Title: {d.title} | File URL: {d.file_url} | Type: {d.type} | Body: {d.body[:50] if d.body else None}")
finally:
    db.close()
