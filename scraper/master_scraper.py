import os
import time
from datetime import datetime

print("Starting Overnight Master Scraper Cycle...")

while True:
    print(f"\n[{datetime.now().isoformat()}] Starting full scraping sweep...")
    
    # 1. KNBS
    print("\n--- Running KNBS Spider ---")
    os.system("..\\backend\\venv\\Scripts\\python.exe -m scrapy runspider knbs_spider.py -O output/knbs_reports_new.json:json")
    
    # 2. Meteo
    print("\n--- Running Meteo Spider ---")
    os.system("..\\backend\\venv\\Scripts\\python.exe -m scrapy runspider meteo_spider.py -O output/meteo_reports_new.json:json")
    
    # 3. World Bank
    print("\n--- Running World Bank Spider ---")
    os.system("..\\backend\\venv\\Scripts\\python.exe -m scrapy runspider worldbank_spider.py -O output/worldbank_reports_new.json:json")
    
    # Replace old files with new ones to prevent scrapy from appending endlessly
    for f in ["knbs_reports", "meteo_reports", "worldbank_reports"]:
        if os.path.exists(f"output/{f}_new.json"):
            if os.path.exists(f"output/{f}.json"):
                os.remove(f"output/{f}.json")
            os.rename(f"output/{f}_new.json", f"output/{f}.json")
    
    # 4. UNFCCC (Deep Crawl - it natively replaces its own JSON)
    print("\n--- Running UNFCCC Deep Crawl ---")
    os.system("..\\backend\\venv\\Scripts\\python.exe fetch_unfccc_uc.py")
    
    # UNFCCC script already triggers seed.py at the end, but we trigger it here explicitly just in case
    print("\n--- Seeding All Database Changes ---")
    os.system("..\\backend\\venv\\Scripts\\python.exe ..\\backend\\seed.py")
    
    print("\nSweep complete. Sleeping for 2 hours before the next sweep...")
    time.sleep(7200) # Sleep 2 hours
