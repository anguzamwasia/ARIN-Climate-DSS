import os
import json
from sqlalchemy import create_engine, text

def import_database():
    print("==========================================")
    print("      DATABASE IMPORT SCRIPT              ")
    print("==========================================")
    
    db_url = os.getenv('DATABASE_URL', 'postgresql://arin:arin_secure_2026@postgres:5432/arin_dss')
    
    try:
        engine = create_engine(db_url)
        with engine.connect() as conn:
            # Recreate table if it doesn't exist
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
            
            # Read backup file
            backup_path = os.path.join(os.path.dirname(__file__), '..', 'backup.json')
            if not os.path.exists(backup_path):
                print("[-] ERROR: backup.json not found!")
                return
                
            with open(backup_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            print(f"[*] Found {len(data)} reports in backup.json. Injecting into production PostgreSQL...")
            
            for item in data:
                # Use insert ignore logic by catching exceptions for duplicate IDs if any
                try:
                    conn.execute(
                        text('''
                            INSERT INTO documents (id, title, url, date, type, body, file_url, source, country, scraped_at, content_text)
                            VALUES (:id, :title, :url, :date, :type, :body, :file_url, :source, :country, :scraped_at, :content_text)
                            ON CONFLICT (id) DO NOTHING
                        '''),
                        item
                    )
                except Exception as e:
                    # Ignore unique constraint errors or just pass
                    pass
                    
            # Reset the sequence so new inserts don't collide with imported IDs
            conn.execute(text("SELECT setval('documents_id_seq', (SELECT MAX(id) FROM documents));"))
            conn.commit()
            
            print(f"[+] Successfully restored {len(data)} reports into the production database!")
            
    except Exception as e:
        print(f"[-] ERROR: Failed to import data: {e}")

if __name__ == "__main__":
    import_database()
