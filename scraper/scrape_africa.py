import undetected_chromedriver as uc
import time
from bs4 import BeautifulSoup
import urllib.parse
import json
from datetime import datetime
import random

AFRICAN_COUNTRIES = {
    "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi",
    "Cabo Verde", "Cameroon", "Central African Republic", "Chad", "Comoros",
    "Congo", "Cote d Ivoire", "Ivory Coast", "Democratic Republic of the Congo", "DRC",
    "Djibouti", "Republic of Djibouti", "Egypt", "Equatorial Guinea", "Eritrea", "Eswatini",
    "Ethiopia", "Gabon", "Gambia", "Ghana", "Guinea", "Guinea-Bissau",
    "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi",
    "Mali", "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia",
    "Niger", "Nigeria", "Rwanda", "Sao Tome and Principe", "Senegal",
    "Seychelles", "Sierra Leone", "Somalia", "South Africa", "South Sudan",
    "Sudan", "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe",
}

def main():
    options = uc.ChromeOptions()
    options.headless = False
    driver = uc.Chrome(options=options, version_main=149)
    
    results = []
    seen_reports = set() # (title, doc_type) to avoid deduplication
    
    print("Starting targeted country search crawl...")
    for country in AFRICAN_COUNTRIES:
        print(f"\n--- Searching for {country} ---")
        for page in range(3): # Usually countries don't have more than 3 pages of reports
            url = f"https://unfccc.int/reports?search3={urllib.parse.quote(country)}&page={page}"
            print(f"Loading {url}...")
            driver.get(url)
            
            # Wait for CAPTCHA to clear
            wait_time = 0
            while "Incapsula" in driver.title or "Security" in driver.title or "Just a moment" in driver.title or "Challenge" in driver.title:
                print("Waiting for Incapsula CAPTCHA to clear... If you see a challenge, please solve it.")
                time.sleep(3)
                wait_time += 2
                    
            soup = BeautifulSoup(driver.page_source, 'html.parser')
            
            # UNFCCC dynamically changes layout based on filters
            rows = soup.select("tr")
            if not rows or len(rows) <= 1:
                rows = soup.select("article")
            if not rows:
                rows = soup.select(".views-row")
                
            found_in_page = 0
            for row in rows:
                # Extract dynamically by class instead of hardcoded index
                title_el = row.select_one(".views-field-title")
                title = title_el.text.strip() if title_el else ""
                if not title:
                    # fallback to first or second td
                    tds = row.select("td")
                    if len(tds) > 1:
                        title = tds[1].text.strip()
                    elif len(tds) > 0:
                        title = tds[0].text.strip()

                doc_type_el = row.select_one(".views-field-field-document-type-1, .views-field-type")
                doc_type = doc_type_el.text.strip() if doc_type_el else "Document"

                row_text = row.get_text(" ", strip=True).lower()
                assigned_country = None
                
                c_lower = country.lower()
                if (" " + c_lower + " ") in (" " + row_text + " ") or row_text.startswith(c_lower + " ") or row_text.endswith(" " + c_lower):
                    assigned_country = country
                            
                if not assigned_country or not title:
                    continue
                    
                # Deduplication check using first two columns
                dedup_key = (title, doc_type)
                if dedup_key in seen_reports:
                    continue
                seen_reports.add(dedup_key)
                
                doc_url = ""
                link_el = row.select_one("a[href*='/documents/']")
                if not link_el:
                    links = row.select("a[href]")
                    for l in links:
                        if len(l.text.strip()) > 5:
                            link_el = l
                            break
                if link_el:
                    doc_url = urllib.parse.urljoin("https://unfccc.int", link_el['href'])
                else:
                    continue
                    
                try:
                    date_el = row.select_one(".views-field-field-document-publication-date, .date-display-single, time")
                    if date_el:
                        date_str = date_el.text.strip()
                    else:
                        tds = row.select("td")
                        date_str = tds[-2].text.strip() if len(tds) > 2 else ""
                    
                    date_obj = datetime.strptime(date_str, "%d %b %Y")
                    published_date = date_obj.strftime("%Y-%m-%d")
                except Exception:
                    published_date = "2024-01-01"

                # Find download link if available
                dl_el = row.select_one("a[href*='/sites/default/files/']")
                file_url = urllib.parse.urljoin("https://unfccc.int", dl_el['href']) if dl_el else doc_url

                results.append({
                    "title": title,
                    "url": doc_url,
                    "published_date": published_date,
                    "type": doc_type,
                    "file_url": file_url,
                    "country": assigned_country,
                    "source": "UNFCCC",
                    "scraped_at": datetime.now().isoformat(),
                })
                found_in_page += 1
                
            print(f"Found {found_in_page} reports on page {page} for {country}.")
            
            # Save progress at the end of each page to prevent data loss
            with open('output/unfccc_reports.json', 'w', encoding='utf8') as f:
                json.dump(results, f, indent=4)
                
            # Random delay to prevent triggering Incapsula's rate limiting firewall (Error 15)
            delay = random.uniform(3.5, 6.5)
            print(f"Waiting {delay:.1f}s before next page...")
            time.sleep(delay)
            
            # If no reports were found on this page, there are no more pages for this country
            if found_in_page == 0:
                break
            
    print(f"Total African reports scraped: {len(results)}")
    
    driver.quit()
    
    import os
    print("Seeding...")
    os.system("..\\backend\\venv\\Scripts\\python.exe ..\\backend\\seed.py")

if __name__ == '__main__':
    main()
