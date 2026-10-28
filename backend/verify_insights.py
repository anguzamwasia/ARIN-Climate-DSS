import sys
sys.path.insert(0, '/app')
from kobo_sync import generate_kobo_insights
from sqlalchemy import create_engine, text
import os

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/arin_dss')
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    rows = conn.execute(text("SELECT type, body FROM documents WHERE source='KOBO' LIMIT 5")).fetchall()
    for i, row in enumerate(rows):
        print(f"\n--- Submission {i+1} ---")
        print(f"TOPIC: {row[0]}")
        print(f"INSIGHT: {row[1]}")
