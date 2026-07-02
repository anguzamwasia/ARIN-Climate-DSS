import os
import json
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

def export_database():
    print("==========================================")
    print("      DATABASE EXPORT SCRIPT              ")
    print("==========================================")
    
    load_dotenv()
    db_url = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/arin_dss')
    
    try:
        engine = create_engine(db_url)
        with engine.connect() as conn:
            # Check if table exists
            result = conn.execute(text("SELECT * FROM documents")).fetchall()
            keys = ["id", "title", "url", "date", "type", "body", "file_url", "source", "country", "scraped_at", "content_text"]
            
            data = []
            for row in result:
                row_dict = {}
                for i, key in enumerate(keys):
                    # Handle datetime serialization
                    val = row[i]
                    if val is not None and not isinstance(val, (int, str, float, bool)):
                        val = str(val)
                    row_dict[key] = val
                data.append(row_dict)
                
            backup_path = os.path.join(os.path.dirname(__file__), '..', 'backup.json')
            with open(backup_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                
            print(f"[+] Successfully exported {len(data)} reports to backend/backup.json!")
            
    except Exception as e:
        print(f"[-] ERROR: Failed to connect to local database or export data: {e}")

if __name__ == "__main__":
    export_database()
