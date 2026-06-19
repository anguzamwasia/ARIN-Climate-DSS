from sqlalchemy import create_engine, text
import datetime

engine = create_engine('postgresql://postgres:password@localhost:5432/arin_dss')
with engine.connect() as conn:
    docs = [
        {"title": "Kenya Updated NDC 2024", "url": "https://unfccc.int/documents/kenya-ndc", "type": "NDC", "country": "Kenya", "file_url": "https://unfccc.int/kenya.pdf", "source": "UNFCCC", "scraped_at": datetime.datetime.utcnow()},
        {"title": "Nigeria Climate Adaptation Strategy", "url": "https://unfccc.int/documents/nigeria", "type": "Adaptation", "country": "Nigeria", "file_url": "https://unfccc.int/nigeria.pdf", "source": "UNFCCC", "scraped_at": datetime.datetime.utcnow()},
        {"title": "South Africa Energy Policy", "url": "https://unfccc.int/documents/sa", "type": "Policy", "country": "South Africa", "file_url": "https://unfccc.int/sa.pdf", "source": "UNFCCC", "scraped_at": datetime.datetime.utcnow()}
    ]
    for d in docs:
        conn.execute(
            text("INSERT INTO documents (title, url, type, country, file_url, source, scraped_at) VALUES (:title, :url, :type, :country, :file_url, :source, :scraped_at)"),
            d
        )
    conn.commit()
print("Injected 3 UNFCCC reports!")
