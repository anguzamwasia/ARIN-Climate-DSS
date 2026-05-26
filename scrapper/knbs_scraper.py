import requests
import re
import json
import warnings
from bs4 import BeautifulSoup
from datetime import datetime

warnings.filterwarnings("ignore")

def scrape_knbs():
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    page_url = "https://www.knbs.or.ke/county-statistical-abstracts/"
    results = []
    page = 1

    while page_url:
        print(f"Scraping page {page}: {page_url}")
        resp = requests.get(page_url, headers=headers, verify=False, timeout=15)
        soup = BeautifulSoup(resp.text, "html.parser")

        titles = soup.find_all("h4", class_="usg_post_title_1")
        pdfs = [a["href"] for a in soup.find_all("a", href=True)
                if "wp-content/uploads" in a["href"] and ".pdf" in a["href"].lower()]

        print(f"  Found {len(titles)} titles, {len(pdfs)} PDFs")

        for i, h4 in enumerate(titles):
            a_tag = h4.find("a")
            title = a_tag.get_text(strip=True) if a_tag else ""
            item_url = a_tag["href"] if a_tag else ""
            pdf_url = pdfs[i] if i < len(pdfs) else ""

            county = ""
            m = re.search(r"Abstract\s*[\u2013\-]+\s*(.+?)(?:\s+County|$)", title, re.IGNORECASE)
            if m:
                county = m.group(1).strip() + " County"

            print(f"  + {title[:60]} | PDF: {bool(pdf_url)}")
            results.append({
                "title": title,
                "url": item_url,
                "type": "County Statistical Abstract",
                "county": county,
                "pdf_url": pdf_url,
                "source": "KNBS",
                "scraped_at": datetime.utcnow().isoformat(),
            })

        next_a = soup.find("a", class_="next")
        page_url = next_a["href"] if next_a else None
        page += 1

    with open("output/knbs_reports.json", "w") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(f"\nDone — {len(results)} reports saved to output/knbs_reports.json")

scrape_knbs()
