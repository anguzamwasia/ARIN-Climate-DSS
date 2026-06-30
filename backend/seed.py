import json
import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/arin_dss')
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # First ensure the documents table exists just in case
    conn.execute(text('''
        CREATE TABLE IF NOT EXISTS documents (
            id SERIAL PRIMARY KEY,
            title TEXT,
            url TEXT,
            date TEXT,
            type TEXT,
            body TEXT,
            file_url TEXT,
            source TEXT,
            country TEXT,
            scraped_at TIMESTAMP,
            content_text TEXT
        )
    '''))
    
    # We will no longer delete existing reports. We will just append them.
    
    # Iterate over all JSON files in the output directory
    for filename in os.listdir('../scraper/output'):
        if not filename.endswith('.json'):
            continue
            
        file_path = os.path.join('../scraper/output', filename)
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        for item in data:
            source = item.get("source", "")
                
            try:
                # Check if document already exists
                exists = conn.execute(
                    text("SELECT id FROM documents WHERE title = :title AND source = :source LIMIT 1"),
                    {"title": item.get("title"), "source": source}
                ).fetchone()
                
                if exists:
                    continue
                    
                conn.execute(
                    text('''
                        INSERT INTO documents (title, url, type, country, file_url, source, scraped_at)
                        VALUES (:title, :url, :type, :county, :pdf_url, :source, :scraped_at)
                    '''),
                    {
                        "title": item.get("title"),
                        "url": item.get("url"),
                        "type": item.get("type"),
                        "county": item.get("county") or item.get("country"),
                        "pdf_url": item.get("pdf_url") or item.get("file_url"),
                        "source": source,
                        "scraped_at": item.get("scraped_at")
                    }
                )
            except Exception as e:
                # Ignore duplicate entries or errors for now
                pass
        print(f"Successfully seeded {len(data)} documents from {filename}!")
    conn.commit()
