import os

print("Fetching thousands of World Bank African reports...")
os.system("..\\backend\\venv\\Scripts\\python.exe -m scrapy runspider worldbank_spider.py")

print("Seeding to Database (without deleting existing records)...")
os.system("..\\backend\\venv\\Scripts\\python.exe ..\\backend\\seed.py")

print("Done!")
