import os
import ast

tasks_dir = r"C:\Users\PC\.gemini\antigravity\brain\0e9c43d2-cfa7-4d41-9693-7c8eb51fd9ed\.system_generated\tasks"
output_file = r"C:\Users\PC\Documents\ARIN\ARIN-Climate-DSS\scraper\output\unfccc_reports.json"

reports = []

for filename in os.listdir(tasks_dir):
    if filename.endswith(".log"):
        filepath = os.path.join(tasks_dir, filename)
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                for line in f:
                    if "{'country':" in line and "'title':" in line:
                        # Extract dictionary string
                        idx = line.find("{'country':")
                        if idx == -1:
                            idx = line.find("{'title':")
                        if idx != -1:
                            dict_str = line[idx:].strip()
                            if dict_str.endswith("}"):
                                try:
                                    obj = ast.literal_eval(dict_str)
                                    reports.append(obj)
                                except Exception:
                                    pass
        except Exception:
            pass

print(f"Recovered {len(reports)} raw reports from task logs!")

if reports:
    # Deduplicate
    unique = {r.get('url', str(i)): r for i, r in enumerate(reports)}
    final_reports = list(unique.values())
    print(f"After deduplication: {len(final_reports)} unique reports!")
    
    import json
    with open(output_file, "w", encoding="utf-8") as out:
        json.dump(final_reports, out, indent=2)
