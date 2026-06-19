import scrapy
import re
from datetime import datetime

class KnbsSpider(scrapy.Spider):
    name = "knbs_spider"
    start_urls = ["https://www.knbs.or.ke/county-statistical-abstracts/"]

    custom_settings = {
        "ROBOTSTXT_OBEY": False,
        "DOWNLOAD_DELAY": 1,
        "CONCURRENT_REQUESTS": 2,
        "FEEDS": {
            "output/knbs_reports.json": {
                "format": "json",
                "encoding": "utf8",
                "overwrite": True,
            }
        },
    }

    def parse(self, response):
        titles = response.css("h4.usg_post_title_1")
        pdfs = [a for a in response.css("a::attr(href)").getall() if "wp-content/uploads" in a and ".pdf" in a.lower()]

        for i, h4 in enumerate(titles):
            a_tag = h4.css("a")
            title = a_tag.css("::text").get("").strip()
            item_url = a_tag.attrib.get("href", "")
            
            pdf_url = pdfs[i] if i < len(pdfs) else ""

            county = ""
            m = re.search(r"Abstract\s*[\u2013\-]+\s*(.+?)(?:\s+County|$)", title, re.IGNORECASE)
            if m:
                county = m.group(1).strip() + " County"

            yield {
                "title": title,
                "url": item_url,
                "type": "County Statistical Abstract",
                "county": county,
                "pdf_url": pdf_url,
                "source": "KNBS",
                "scraped_at": datetime.utcnow().isoformat(),
            }

        next_page = response.css("a.next::attr(href)").get()
        if next_page:
            yield response.follow(next_page, self.parse)
