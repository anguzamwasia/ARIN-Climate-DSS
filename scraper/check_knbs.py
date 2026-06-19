import json

with open('C:/Users/PC/Documents/ARIN/ARIN-Climate-DSS/scraper/output/knbs_reports.json', 'r', encoding='windows-1252', errors='ignore') as f:
    data = json.load(f)

for item in data[:5]:
    print(item.get('country'), item.get('title'))
