# punctuate_existing_transcripts.py
import sys
import os
from app.database import SessionLocal
from app.models.document import Document
from app.routers.transcription import punctuate_transcript

db = SessionLocal()
try:
    docs = db.query(Document).filter(Document.source == "WHISPER").all()
    print(f"Found {len(docs)} WHISPER documents to punctuate.")
    for d in docs:
        if d.content_text:
            print(f"Punctuating doc ID {d.id}: {d.title}...")
            punctuated = punctuate_transcript(d.content_text)
            if punctuated and punctuated != d.content_text:
                d.content_text = punctuated
                print(f"-> Successfully punctuated doc ID {d.id}.")
            else:
                print(f"-> No changes or punctuation failed for doc ID {d.id}.")
    db.commit()
    print("Done punctuating all existing whisper transcripts.")
finally:
    db.close()
