from sqlalchemy import create_engine, text

engine = create_engine('postgresql://postgres:password@localhost:5432/arin_dss')
with engine.connect() as conn:
    res = conn.execute(text("DELETE FROM documents WHERE title ILIKE '%health%' AND source = 'World Bank' RETURNING id"))
    deleted_count = res.rowcount
    conn.commit()
    print(f"Deleted {deleted_count} unrelated health reports from the database.")
