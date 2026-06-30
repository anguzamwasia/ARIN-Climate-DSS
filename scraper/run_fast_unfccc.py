import os
import urllib.parse

AFRICAN_COUNTRIES = [
    "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi",
    "Cabo Verde", "Cameroon", "Central African Republic", "Chad", "Comoros",
    "Congo", "Cote d Ivoire", "Democratic Republic of the Congo", "Djibouti", 
    "Egypt", "Equatorial Guinea", "Eritrea", "Eswatini", "Ethiopia", "Gabon", 
    "Gambia", "Ghana", "Guinea", "Guinea-Bissau", "Kenya", "Lesotho", "Liberia", 
    "Libya", "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius", "Morocco", 
    "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda", "Sao Tome and Principe", 
    "Senegal", "Seychelles", "Sierra Leone", "Somalia", "South Africa", "South Sudan", 
    "Sudan", "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe"
]

urls = []
for country in AFRICAN_COUNTRIES:
    urls.append(f"https://unfccc.int/documents?search_api_views_fulltext={urllib.parse.quote(country)}")

with open("unfccc_reports.py", "r") as f:
    content = f.read()

# Replace the start_urls block with our comprehensive explicit country list
import re
new_content = re.sub(
    r"start_urls = \[.*?\]", 
    f"start_urls = {urls}", 
    content, 
    flags=re.DOTALL
)

with open("unfccc_reports_fast.py", "w") as f:
    f.write(new_content)

print("Generated unfccc_reports_fast.py! Launching spider...")
os.system("..\\backend\\venv\\Scripts\\python.exe -m scrapy runspider unfccc_reports_fast.py -O output/unfccc_reports_new.json:json")
os.system("..\\backend\\venv\\Scripts\\python.exe ..\\backend\\seed.py")
