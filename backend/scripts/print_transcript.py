import re

transcript_path = r"C:\Users\PC\.gemini\antigravity\brain\0e9c43d2-cfa7-4d41-9693-7c8eb51fd9ed\.system_generated\logs\transcript_full.jsonl"

print("Searching transcript for scrapy debug logs...")
count = 0
with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        if 'DEBUG: Scraped from' in line and 'Africa (Global)' in line:
            # Print the entire line to see the JSON structure of the log
            print(line[:300])
            count += 1
            if count >= 3:
                break
