import os
import urllib.request
import json
from datetime import datetime
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/arin_dss')
engine = create_engine(DATABASE_URL)
TOKEN = "62aa64263eb80725ee50b3b36b9010b2c1f48f07"
BASE_URL = "https://kf.kobotoolbox.org/api/v2/assets/"

KENYA_COUNTIES = [
    "Mombasa", "Kwale", "Kilifi", "Tana River", "Lamu", "Taita Taveta", "Garissa", "Wajir", "Mandera", "Marsabit", "Isiolo", "Meru", "Tharaka Nithi", "Embu", "Kitui", "Machakos", "Makueni", "Nyandarua", "Nyeri", "Kirinyaga", "Murang'a", "Kiambu", "Turkana", "West Pokot", "Samburu", "Trans Nzoia", "Uasin Gishu", "Elgeyo Marakwet", "Nandi", "Baringo", "Laikipia", "Nakuru", "Narok", "Kajiado", "Kericho", "Bomet", "Kakamega", "Vihiga", "Bungoma", "Busia", "Siaya", "Kisumu", "Homa Bay", "Migori", "Kisii", "Nyamira", "Nairobi"
]

def extract_county(text):
    text_lower = text.lower()
    for county in KENYA_COUNTIES:
        if county.lower() in text_lower:
            return f"{county} County"
    return "Kenya"

def fetch_json(url):
    req = urllib.request.Request(url, headers={'Authorization': f'Token {TOKEN}'})
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"Failed to fetch {url}: {e}")
        return None

def sync_kobo():
    print("Fetching assets...")
    assets_data = fetch_json(BASE_URL)
    if not assets_data or "results" not in assets_data:
        print("Failed to load assets")
        return

    forms = assets_data["results"]
    print(f"Found {len(forms)} forms. Syncing submissions...")

    with engine.connect() as conn:
        # Delete only KOBO to avoid wiping out KMD
        conn.execute(text("DELETE FROM documents WHERE source IN ('KOBO')"))

        for form in forms:
            uid = form.get("uid")
            title = form.get("name", "Unknown Form")
            
            data_url = f"{BASE_URL}{uid}/data/"
            submissions = fetch_json(data_url)
            
            if not submissions or "results" not in submissions:
                continue
                
            results = submissions["results"]
            print(f"Form '{title}' has {len(results)} submissions.")
            
            for sub in results:
                # Compile content text from all keys
                content_chunks = []
                for k, v in sub.items():
                    if not k.startswith("_") and v:
                        content_chunks.append(f"{k}: {v}")
                
                content_text = "\n".join(content_chunks)
                scraped_at = sub.get("_submission_time")
                
                detected_county = extract_county(content_text)
                
                conn.execute(
                    text('''
                        INSERT INTO documents (title, url, type, country, source, scraped_at, content_text)
                        VALUES (:title, :url, :type, :country, :source, :scraped_at, :content_text)
                    '''),
                    {
                        "title": f"{title} (Field Submission)",
                        "url": f"https://kf.kobotoolbox.org/#/forms/{uid}/data",
                        "type": "Field Submission",
                        "country": detected_county,
                        "source": "KOBO",
                        "scraped_at": scraped_at if scraped_at else datetime.utcnow().isoformat(),
                        "content_text": content_text
                    }
                )
                
        conn.commit()
    print("Done syncing KoboToolbox data!")

if __name__ == "__main__":
    sync_kobo()
