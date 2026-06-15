import scrapy
import re
from datetime import datetime

class KNBSSpider(scrapy.Spider):
    name = "knbs_reports"

    custom_settings = {
        "ROBOTSTXT_OBEY": False,
        "DOWNLOAD_DELAY": 2,
        "CONCURRENT_REQUESTS": 1,
        "DOWNLOADER_CLIENTCONTEXTFACTORY": "scrapy.core.downloader.contextfactory.BrowserLikeContextFactory",
        "FEEDS": {
            "output/knbs_reports.json": {
                "format": "json",
                "encoding": "utf8",
                "overwrite": True,
            }
        },
    }

    def start_requests(self):
        yield scrapy.Request(
            "https://www.knbs.or.ke/county-statistical-abstracts/",
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
            callback=self.parse,
        )

    def parse(self, response):
        # Pair each h4 title with the nearest PDF link
        titles = response.css("h4.usg_post_title_1")
        pdf_links = response.css("a[href*=wp-content\/uploads]")

        self.logger.info(f"Found {len(titles)} titles and {len(pdf_links)} PDF links")

        for i, h4 in enumerate(titles):
            title    = h4.css("a::text").get("").strip()
            page_url = h4.css("a::attr(href)").get("").strip()
            pdf_url  = pdf_links[i].attrib["href"] if i < len(pdf_links) else ""

            # Extract county name
            county = ""
            m = re.search(r"Abstract\s*[–\-]+\s*(.+?)(?:\s+County|$)", title, re.IGNORECASE)
            if m:
                county = m.group(1).strip() + " County"

            self.logger.info(f"KNBS: {title[:70]} | PDF: {bool(pdf_url)}")
            yield {
                "title":      title,
                "url":        page_url,
                "date":       "",
                "type":       "County Statistical Abstract",
                "county":     county,
                "pdf_url":    pdf_url,
                "source":     "KNBS",
                "scraped_at": datetime.utcnow().isoformat(),
            }

        # Pagination
        next_page = response.css("a.next::attr(href)").get()
        if next_page:
            self.logger.info(f"Next page: {next_page}")
            yield scrapy.Request(
                next_page,
                headers={"User-Agent": "Mozilla/5.0"},
                callback=self.parse,
            )
