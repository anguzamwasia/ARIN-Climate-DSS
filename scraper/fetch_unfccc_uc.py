import undetected_chromedriver as uc
from bs4 import BeautifulSoup
import time
import json
from datetime import datetime
import urllib.parse

def main():
    options = uc.ChromeOptions()
    options.headless = False
    driver = uc.Chrome(options=options, version_main=149)
    
    AFRICAN_COUNTRIES = [
        "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cabo Verde", "Cameroon", "Central African Rep.", "Chad", "Comoros", "Congo", "Dem. Rep. Congo", "Djibouti", "Egypt", "Eq. Guinea", "Eritrea", "eSwatini", "Ethiopia", "Gabon", "Gambia", "Ghana", "Guinea", "Guinea-Bissau", "Côte d'Ivoire", "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda", "Sao Tome and Principe", "Senegal", "Seychelles", "Sierra Leone", "Somalia", "South Africa", "S. Sudan", "Sudan", "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe", "W. Sahara", "Somaliland"
    ]
    
    UNFCCC_TO_STD = {
        "Democratic Republic of the Congo": "Dem. Rep. Congo",
        "Central African Republic": "Central African Rep.",
        "Equatorial Guinea": "Eq. Guinea",
        "Eswatini": "eSwatini",
        "Cote d Ivoire": "Côte d'Ivoire",
        "Ivory Coast": "Côte d'Ivoire",
        "South Sudan": "S. Sudan",
        "Western Sahara": "W. Sahara"
    }
    
    urls = [
        "https://unfccc.int/reports"
    ]
    
    results = []
    
    for start_url in urls:
        current_url = start_url
        for page_num in range(250): # Deep crawl the safe reports directory
            if not current_url:
                break
                
            print(f"Scraping list: {current_url}")
            
            try:
                driver.get(current_url)
                # Wait for Incapsula to clear
                for _ in range(15):
                    time.sleep(4)
                    if "Incapsula" not in driver.page_source:
                        break
                        
                if "Incapsula" in driver.page_source:
                    print("Incapsula did not clear. Restarting browser...")
                    driver.quit()
                    time.sleep(2)
                    new_options = uc.ChromeOptions()
                    new_options.headless = False
                    driver = uc.Chrome(options=new_options, version_main=149)
                    driver.get(current_url)
                    time.sleep(10)
            except Exception as e:
                print("Failed to load list page", e)
                break
                
            soup = BeautifulSoup(driver.page_source, 'html.parser')
            links = set(a['href'] for a in soup.select("a[href]") if "/documents/" in a['href'])
            
            if not links:
                print("No links found! Saving debug.html")
                with open("debug.html", "w", encoding="utf-8") as df:
                    df.write(driver.page_source)
                    
            next_page = soup.select_one("a[rel=next], li.pager__item--next a")
            if next_page and 'href' in next_page.attrs:
                next_url_to_scrape = urllib.parse.urljoin("https://unfccc.int", next_page['href'])
            else:
                next_url_to_scrape = None
            
            # Find all document nodes on the list page
            articles = soup.select("article")
            if not articles:
                # fallback if articles are not explicitly wrapped
                articles = soup.select(".views-row")
                
            for article in articles:
                link_el = article.select_one("a[href*='/documents/']")
                if not link_el: continue
                
                doc_url = urllib.parse.urljoin("https://unfccc.int", link_el['href'])
                title = link_el.text.strip()
                title_lower = title.lower()
                
                date_el = article.select_one("time")
                date = date_el.text.strip() if date_el else ""
                
                assigned_country = "Africa (Global)"
                is_african = False
                
                for c in AFRICAN_COUNTRIES:
                    if f" {c.lower()} " in f" {title_lower} " or title_lower.startswith(c.lower() + " "):
                        is_african = True
                        assigned_country = c
                        break
                        
                if not is_african:
                    for old_name, new_name in UNFCCC_TO_STD.items():
                        if f" {old_name.lower()} " in f" {title_lower} " or title_lower.startswith(old_name.lower() + " "):
                            is_african = True
                            assigned_country = new_name
                            break
                            
                if not is_african and "africa" in title_lower:
                    is_african = True
                    assigned_country = "Africa (Global)"
                    
                if is_african:
                    results.append({
                        "title": title,
                        "url": doc_url,
                        "date": date,
                        "type": "Regional Report" if assigned_country == "Africa (Global)" else "National Assessment",
                        "body": "",
                        "file_url": doc_url,
                        "source": "UNFCCC",
                        "country": assigned_country,
                        "scraped_at": datetime.utcnow().isoformat(),
                    })
            
            # Correct Pagination
            current_url = f"https://unfccc.int/reports?page=%2C%2C{page_num+1}"
                
    with open('output/unfccc_reports.json', 'w', encoding='utf8') as f:
        json.dump(results, f)
    print(f"Scraped {len(results)} reports")
    
    # Immediately seed into database
    import os
    print("Seeding to DB...")
    os.system("..\\backend\\venv\\Scripts\\python.exe ..\\backend\\seed.py")
    print("Done seeding!")
    
    driver.quit()

if __name__ == '__main__':
    main()
