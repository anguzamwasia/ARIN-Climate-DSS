import scrapy
from datetime import datetime

class MeteoSpider(scrapy.Spider):
    name = "meteo_spider"
    start_urls = ["https://meteo.go.ke/our-products/state-of-the-climate-kenya-report"]

    custom_settings = {
        "ROBOTSTXT_OBEY": False,
        "FEEDS": {
            "output/meteo_reports.json": {
                "format": "json",
                "encoding": "utf8",
                "overwrite": True,
            }
        },
    }

    def parse(self, response):
        # Find all report links on the main directory page
        # Usually they are inside div elements or lists linking to sub-pages
        report_links = response.css("a::attr(href)").getall()
        report_pages = [link for link in report_links if "state-of-the-climate" in link and link != self.start_urls[0]]
        
        # Deduplicate
        report_pages = list(set(report_pages))
        
        for link in report_pages:
            yield response.follow(link, self.parse_report)
            
    def parse_report(self, response):
        title = response.css("h1::text").get() or response.css("title::text").get() or "State of Climate Report"
        title = title.strip()
        
        pdf_url = ""
        for link in response.css("a::attr(href)").getall():
            if ".pdf" in link.lower():
                pdf_url = response.urljoin(link)
                break
                
        yield {
            "title": title,
            "url": response.url,
            "pdf_url": pdf_url or response.url,
            "type": "State of Climate Report",
            "country": "Kenya",
            "source": "KMD",
            "scraped_at": datetime.utcnow().isoformat(),
        }
