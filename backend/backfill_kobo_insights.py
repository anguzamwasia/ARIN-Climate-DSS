"""
One-shot script: regenerate topic + body for all existing KOBO docs
using the new rule-based generate_kobo_insights() — no OpenAI needed.
"""
import sys, os
sys.path.insert(0, '/app')

from kobo_sync import generate_kobo_insights
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/arin_dss')
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    rows = conn.execute(text("SELECT id, content_text FROM documents WHERE source='KOBO'")).fetchall()
    print(f"Regenerating insights for {len(rows)} KOBO submissions...")
    for row in rows:
        doc_id, content_text = row[0], row[1]
        topic, insights = generate_kobo_insights(content_text or "")
        conn.execute(
            text("UPDATE documents SET type=:type, body=:body WHERE id=:id"),
            {"type": topic, "body": insights, "id": doc_id}
        )
    conn.commit()
    print("Done! All KOBO submissions updated with rule-based insights.")
