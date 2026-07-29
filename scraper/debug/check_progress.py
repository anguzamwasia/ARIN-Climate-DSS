import os

log_file = r"C:\Users\PC\.gemini\antigravity\brain\0e9c43d2-cfa7-4d41-9693-7c8eb51fd9ed\.system_generated\tasks\task-4826.log"

total_found = 0
current_page = 0

if not os.path.exists(log_file):
    print("Log file not found.")
else:
    with open(log_file, 'r', encoding='utf-8') as f:
        for line in f:
            if "Found" in line and "reports on page" in line:
                try:
                    parts = line.strip().split()
                    count = int(parts[1])
                    page = int(parts[5].replace('.', ''))
                    total_found += count
                    current_page = page
                except:
                    pass

    print(f"Crawler is currently on page: {current_page}")
    print(f"Total African reports found so far: {total_found}")
