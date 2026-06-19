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

    scrapers = ["knbs_scraper.py", "meteo_scraper.py", "unfccc_reports.py"]

    for scraper in scrapers:
        print(f"Running {scraper}...")
        try:
            subprocess.run([python_exe, scraper], cwd=scraper_dir, check=True)
            print(f"Finished {scraper}")
        except Exception as e:
            print(f"Error running {scraper}: {e}")

    print("Running database seeder...")
    try:
        subprocess.run([python_exe, "seed.py"], cwd=backend_dir, check=True)
        print("Database seeded successfully.")
    except Exception as e:
        print(f"Error running seed.py: {e}")
