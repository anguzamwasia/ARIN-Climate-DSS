from curl_cffi import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime
import time

urls = [
    "https://unfccc.int/reports",
    "https://unfccc.int/documents?f%5B0%5D=region%3AAfrica",
    "https://unfccc.int/documents?search_api_views_fulltext=Kenya",
    "https://unfccc.int/documents?search_api_views_fulltext=Africa%20Climate",
    "https://unfccc.int/documents?search_api_views_fulltext=East%20Africa",
]

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

results = []

def scrape_doc(link):
    url = "https://unfccc.int" + link if link.startswith("/") else link
    print(f"Scraping doc: {url}")
    try:
        r = requests.get(url, impersonate="chrome110")
        soup = BeautifulSoup(r.text, 'html.parser')
        
        title_el = soup.select_one("h1, .page-title, title")
        title = title_el.text.strip() if title_el else "No title"
        title_lower = title.lower()
        
        country_nodes = [a.text.strip() for a in soup.select(".field--name-field-country a")]
        assigned_country = "Africa (Global)"
        is_african = False
        
        if country_nodes:
            for c in country_nodes:
                if c in UNFCCC_TO_STD:
                    c = UNFCCC_TO_STD[c]
                if c in AFRICAN_COUNTRIES:
                    is_african = True
                    assigned_country = c
                    break
                    
        if not is_african:
            for c in AFRICAN_COUNTRIES:
                if f" {c.lower()} " in f" {title_lower} " or title_lower.startswith(c.lower() + " "):
                    is_african = True
                    assigned_country = c
                    break
            
            # Check old names in text just in case
            if not is_african:
                for old_name, new_name in UNFCCC_TO_STD.items():
                    if f" {old_name.lower()} " in f" {title_lower} " or title_lower.startswith(old_name.lower() + " "):
                        is_african = True
                        assigned_country = new_name
                        break
        
        # Always include it if we specifically searched for it
        date_el = soup.select_one("time")
        date = date_el.text.strip() if date_el else ""
        
        type_el = soup.select_one(".field--name-field-document-type a")
        doc_type = type_el.text.strip() if type_el else ""
        
        body_el = soup.select_one(".field--name-field-symbol a")
        body = body_el.text.strip() if body_el else ""
        
        file_el = soup.select_one("a[href*='/sites/default/files/resource/']")
        file_url = file_el['href'] if file_el else ""
        if file_url and file_url.startswith("/"):
            file_url = "https://unfccc.int" + file_url
            
        results.append({
            "title": title,
            "url": url,
            "date": date,
            "type": doc_type,
            "body": body,
            "file_url": file_url,
            "source": "UNFCCC",
            "country": assigned_country,
            "scraped_at": datetime.utcnow().isoformat(),
        })
    except Exception as e:
        print(f"Failed to scrape doc {url}: {e}")

visited_pages = set()

for start_url in urls:
    current_url = start_url
    for i in range(5):  # Max 5 pages per query to get more than 116 total
        if current_url in visited_pages:
            break
        visited_pages.add(current_url)
        print(f"Scraping list: {current_url}")
        
        try:
            r = requests.get(current_url, impersonate="chrome124")
            if i == 0:
                print(r.text[:500])
            soup = BeautifulSoup(r.text, 'html.parser')
            
            links = set(a['href'] for a in soup.select("a[href]") if "/documents/" in a['href'])
            
            for link in links:
                scrape_doc(link)
                time.sleep(0.5)
                
            next_page = soup.select_one("a[rel=next], li.pager__item--next a")
            if next_page and 'href' in next_page.attrs:
                current_url = "https://unfccc.int" + next_page['href'] if next_page['href'].startswith("/") else next_page['href']
            else:
                break
        except Exception as e:
            print(f"Failed list {current_url}: {e}")
            break

with open('output/unfccc_reports.json', 'w', encoding='utf8') as f:
    json.dump(results, f)
print(f"Scraped {len(results)} reports!")
