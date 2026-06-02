import asyncio
import json
from datetime import datetime
from playwright.async_api import async_playwright

REPORT_URLS = [
    ("State of the Climate Report, Kenya (2025)", "https://meteo.go.ke/our-products/state-of-the-climate-kenya-report/state-of-the-climate-report-kenya-2025/"),
    ("State of the Climate Report, Kenya (2024)", "https://meteo.go.ke/our-products/state-of-the-climate-kenya-report/state-of-the-climate-report-kenya-2024/"),
    ("State of the Climate Kenya Report (2023)", "https://meteo.go.ke/our-products/state-of-the-climate-kenya-report/state-of-the-climate-kenya-report-2023/"),
    ("State of the Climate Kenya Report (2022)", "https://meteo.go.ke/our-products/state-of-the-climate-kenya-report/state-of-the-climate-kenya-report-2022/"),
]

async def scrape_meteo():
    results = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(ignore_https_errors=True)

        for title, url in REPORT_URLS:
            print(f"Scraping: {title}")
            page = await context.new_page()
            try:
                await page.goto(url, timeout=60000, wait_until="domcontentloaded")
                await page.wait_for_timeout(3000)

                # Find PDF links
                links = await page.query_selector_all("a[href]")
                pdf_url = ""
                for link in links:
                    href = await link.get_attribute("href") or ""
                    if ".pdf" in href.lower():
                        pdf_url = href if href.startswith("http") else f"https://meteo.go.ke{href}"
                        print(f"  PDF found: {pdf_url}")
                        break

                if not pdf_url:
                    print(f"  No PDF found — saving page URL")

                results.append({
                    "title": title,
                    "url": url,
                    "pdf_url": pdf_url or url,
                    "type": "State of Climate Report",
                    "country": "Kenya",
                    "source": "KMD",
                    "scraped_at": datetime.utcnow().isoformat(),
                })

            except Exception as e:
                print(f"  ERROR: {e}")
            finally:
                await page.close()

        await browser.close()

    with open("output/meteo_reports.json", "w") as f:
        json.dump(results, f, indent=2)
    print(f"Done — {len(results)} reports saved")

asyncio.run(scrape_meteo())
