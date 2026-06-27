import os
import subprocess
import time
from datetime import datetime
from apscheduler.schedulers.blocking import BlockingScheduler

def sync_kobo():
    print(f"[{datetime.now()}] Running KoboToolbox Sync...")
    try:
        subprocess.run([r".\venv\Scripts\python.exe", "kobo_sync.py"], cwd=os.getcwd())
    except Exception as e:
        print(f"Failed to run kobo_sync: {e}")

def sync_scrapers():
    print(f"[{datetime.now()}] Running Web Scrapers (Twice a week)...")
    try:
        scraper_dir = os.path.abspath(os.path.join(os.getcwd(), "..", "scraper"))
        
        # Run UNFCCC and KNBS scrapers
        print("Running UNFCCC Scraper...")
        subprocess.run([r"..\backend\venv\Scripts\scrapy.exe", "runspider", "unfccc_reports.py"], cwd=scraper_dir)
        
        print("Running KNBS Scraper...")
        subprocess.run([r"..\backend\venv\Scripts\scrapy.exe", "runspider", "knbs_spider.py"], cwd=scraper_dir)
        
        print("Running KMD Meteo Scraper...")
        subprocess.run([r"..\backend\venv\Scripts\scrapy.exe", "runspider", "meteo_spider.py"], cwd=scraper_dir)
        
        print("Running World Bank Scraper...")
        subprocess.run([r"..\backend\venv\Scripts\scrapy.exe", "runspider", "worldbank_spider.py"], cwd=scraper_dir)
        
        # Run DB seed to update documents
        print("Injecting new scraped data into DB...")
        subprocess.run([r".\venv\Scripts\python.exe", "seed.py"], cwd=os.getcwd())
        
        print("Scraping pipeline completed.")
    except Exception as e:
        print(f"Failed to run scrapers: {e}")

def sync_media():
    print(f"[{datetime.now()}] Scanning for new raw media...")
    try:
        subprocess.run([r".\venv\Scripts\python.exe", "auto_transcribe.py"], cwd=os.getcwd())
    except Exception as e:
        print(f"Failed to run auto_transcribe: {e}")

if __name__ == "__main__":
    scheduler = BlockingScheduler()
    
    # Run syncs immediately on startup
    sync_kobo()
    sync_media()
    
    # Schedule Media Scanner every 10 minutes
    scheduler.add_job(sync_media, 'interval', minutes=10)
    
    # Schedule Kobo every 20 minutes
    scheduler.add_job(sync_kobo, 'interval', minutes=20)
    
    # Schedule Scrapers twice a week (Mon, Thu at 2 AM)
    scheduler.add_job(sync_scrapers, 'cron', day_of_week='mon,thu', hour=2, minute=0)
    
    print("Started Ingestion Worker!")
    print(" - Polling KoboToolbox every 20 minutes")
    print(" - Scanning Media Uploads every 10 minutes")
    print(" - Polling Web Scrapers twice a week (Mon, Thu)")
    
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        print("Worker stopped.")
