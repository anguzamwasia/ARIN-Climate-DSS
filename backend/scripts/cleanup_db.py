import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/arin_dss')
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # 1. Delete World Bank health/nutrition reports
    health_keywords = ['%health%', '%nutrition%', '%maternal%', '%reproductive%', '%audit%', '%financial statement%']
    for kw in health_keywords:
        conn.execute(
            text("DELETE FROM documents WHERE source = 'World Bank' AND title ILIKE :kw"),
            {"kw": kw}
        )
    
    # 2. Delete all UNFCCC reports because they were saved with the wrong titles (e.g., 'Type of document' instead of the actual title)
    conn.execute(text("DELETE FROM documents WHERE source = 'UNFCCC'"))
    
    conn.commit()

print("Database cleanup complete! Removed irrelevant World Bank datasets and purged malformed UNFCCC reports.")
