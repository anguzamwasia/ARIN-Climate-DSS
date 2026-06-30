import subprocess
import os
import sys

def run_scrapers():
    print("Starting scheduled scrapers...")
    # Get absolute paths to directories
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    scraper_dir = os.path.join(base_dir, 'scraper')
    backend_dir = os.path.join(base_dir, 'backend')
    
    python_exe = sys.executable # Use the current venv's python

    spiders = ["knbs_spider.py", "meteo_spider.py", "worldbank_spider.py"]
    
    for spider in spiders:
        print(f"Running {spider}...")
        output_name = spider.replace('_spider.py', '_reports_new.json')
        final_name = spider.replace('_spider.py', '_reports.json')
        try:
            subprocess.run([python_exe, "-m", "scrapy", "runspider", spider, "-O", f"output/{output_name}:json"], cwd=scraper_dir, check=True)
            # Replace old file with new to prevent endless appending
            old_path = os.path.join(scraper_dir, 'output', final_name)
            new_path = os.path.join(scraper_dir, 'output', output_name)
            if os.path.exists(new_path):
                if os.path.exists(old_path):
                    os.remove(old_path)
                os.rename(new_path, old_path)
            print(f"Finished {spider}")
        except Exception as e:
            print(f"Error running {spider}: {e}")

    print("Running scrape_africa.py (Temporarily disabled for production)...")
    # try:
    #     subprocess.run([python_exe, "scrape_africa.py"], cwd=scraper_dir, check=True)
    #     print("Finished scrape_africa.py")
    # except Exception as e:
    #     print(f"Error running scrape_africa.py: {e}")

    print("Running database seeder...")
    try:
        subprocess.run([python_exe, "seed.py"], cwd=backend_dir, check=True)
        print("Database seeded successfully.")
    except Exception as e:
        print(f"Error running seed.py: {e}")
