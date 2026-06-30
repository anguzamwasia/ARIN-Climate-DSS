import json
import re

transcript_path = r"C:\Users\PC\.gemini\antigravity\brain\0e9c43d2-cfa7-4d41-9693-7c8eb51fd9ed\.system_generated\logs\transcript_full.jsonl"
reports = []

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        if 'Africa (Global)' in line and 'title' in line:
            # Try to extract the JSON objects from the Scrapy debug logs
            # Scrapy debug logs look like: {'title': '...', 'url': '...', ...}
            matches = re.findall(r"(\{'title': '.*?', 'url': '.*?', 'pdf_url': '.*?', 'type': '.*?', 'county': None, 'country': 'Africa \(Global\)', 'source': 'UNFCCC', 'scraped_at': '.*?'\})", line)
            
            for match in matches:
                # Convert the single-quoted python dict string back to JSON
                try:
                    s = match.replace("None", "null")
                    s = re.sub(r"'([^']*)':", r'"\1":', s)
                    s = re.sub(r": '([^']*)'", r': "\1"', s)
                    obj = json.loads(s)
                    reports.append(obj)
                except Exception as e:
                    pass

print(f"Recovered {len(reports)} reports from transcript!")
if reports:
    with open(r"C:\Users\PC\Documents\ARIN\ARIN-Climate-DSS\scraper\output\unfccc_recovered.json", "w", encoding="utf-8") as out:
        json.dump(reports, out, indent=2)
