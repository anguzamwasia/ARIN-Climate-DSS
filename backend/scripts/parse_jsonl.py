import json
import ast

transcript_path = r"C:\Users\PC\.gemini\antigravity\brain\0e9c43d2-cfa7-4d41-9693-7c8eb51fd9ed\.system_generated\logs\transcript_full.jsonl"

reports = []
count = 0

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            step = json.loads(line)
        except:
            continue
            
        # check tool responses
        if step.get('type') == 'PLANNER_RESPONSE':
            pass
        elif step.get('type') == 'TOOL_RESPONSE':
            content = step.get('content', '')
            if 'DEBUG: Scraped from <200' in content or 'Africa (Global)' in content:
                # Find python dictionary strings
                lines = content.split('\n')
                for l in lines:
                    if l.startswith("{'title':") or l.startswith("{'country':"):
                        try:
                            # Safely evaluate python dict string
                            obj = ast.literal_eval(l.strip())
                            reports.append(obj)
                        except Exception as e:
                            pass

print(f"Recovered {len(reports)} unique reports from JSONL!")

if reports:
    # Deduplicate
    unique = {r['url']: r for r in reports}
    final_reports = list(unique.values())
    print(f"After deduplication: {len(final_reports)}")
    with open(r"C:\Users\PC\Documents\ARIN\ARIN-Climate-DSS\scraper\output\unfccc_reports.json", "w", encoding="utf-8") as out:
        json.dump(final_reports, out, indent=2)
