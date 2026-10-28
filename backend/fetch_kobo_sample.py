import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/arin_dss')
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    rows = conn.execute(text("SELECT content_text FROM documents WHERE source='KOBO' LIMIT 2")).fetchall()
    for i, row in enumerate(rows):
        print(f"\n=== SUBMISSION {i+1} ===")
        print(row[0][:3000])
