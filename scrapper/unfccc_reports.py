import scrapy
from datetime import datetime
from scrapy_playwright.page import PageMethod

class UnfcccReportsSpider(scrapy.Spider):
    name = "unfccc_reports"
    start_urls = [
        "https://unfccc.int/reports",
        "https://unfccc.int/documents?f%5B0%5D=region%3AAfrica",
    ]

    AFRICAN_COUNTRIES = {
        "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi",
        "Cabo Verde", "Cameroon", "Central African Republic", "Chad", "Comoros",
        "Congo", "Cote d Ivoire", "Ivory Coast", "Democratic Republic of the Congo",
        "Djibouti", "Egypt", "Equatorial Guinea", "Eritrea", "Eswatini",
        "Ethiopia", "Gabon", "Gambia", "Ghana", "Guinea", "Guinea-Bissau",
        "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi",
        "Mali", "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia",
        "Niger", "Nigeria", "Rwanda", "Sao Tome and Principe", "Senegal",
        "Seychelles", "Sierra Leone", "Somalia", "South Africa", "South Sudan",
        "Sudan", "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe",
    }

    custom_settings = {
        "ROBOTSTXT_OBEY": False,
        "DOWNLOAD_DELAY": 2,
        "CONCURRENT_REQUESTS": 1,
        "DOWNLOAD_HANDLERS": {
            "http":  "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
            "https": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
        },
        "TWISTED_REACTOR": "twisted.internet.asyncioreactor.AsyncioSelectorReactor",
        "PLAYWRIGHT_BROWSER_TYPE": "chromium",
        "PLAYWRIGHT_LAUNCH_OPTIONS": {"headless": True},
        "PLAYWRIGHT_DEFAULT_NAVIGATION_TIMEOUT": 60000,
        "FEEDS": {
            "output/unfccc_reports.json": {
                "format": "json",
                "encoding": "utf8",
                "overwrite": True,
            }
        },
    }

    def _pw_meta(self, wait="domcontentloaded"):
        return {
            "playwright": True,
            "playwright_page_methods": [
                PageMethod("wait_for_load_state", wait),
            ],
        }

    def start_requests(self):
        for url in self.start_urls:
            yield scrapy.Request(url, meta=self._pw_meta("networkidle"), callback=self.parse)

    def parse(self, response):
        doc_links = list({
            l for l in response.css("a::attr(href)").getall()
            if l and "/documents/" in l
        })
        for link in doc_links:
            yield scrapy.Request(
                response.urljoin(link),
                meta=self._pw_meta("domcontentloaded"),
                callback=self.parse_document,
            )
        next_page = response.css("a[rel=next]::attr(href), li.pager__item--next a::attr(href)").get()
        if next_page:
            yield scrapy.Request(
                response.urljoin(next_page),
                meta=self._pw_meta("networkidle"),
                callback=self.parse,
            )

    def parse_document(self, response):
        title = (
            response.css("h1::text").get()
            or response.css(".page-title::text").get()
            or response.css("title::text").get()
            or "No title"
        ).strip()

        title_lower = title.lower()
        is_african = not any(x in title.lower() for x in ["new guinea", "papua"]) and any(
            (" " + c.lower() + " ") in (" " + title_lower + " ") or
            title_lower.startswith(c.lower() + " ") or
            title_lower.startswith(c.lower() + ".")
            for c in self.AFRICAN_COUNTRIES
        )
        if not is_african:
            return

        date     = (response.css("time::attr(datetime)").get() or response.css("time::text").get() or "").strip()
        doc_type = response.css(".field--name-field-document-type a::text").get("").strip()
        body     = response.css(".field--name-field-symbol a::text").get("").strip()
        file_url = response.css("a[href*='/sites/default/files/resource/']::attr(href)").get("")
        if file_url:
            file_url = response.urljoin(file_url)

        self.logger.info(f"AFRICA: {title[:80]} | FILE: {bool(file_url)}")
        yield {
            "title":      title,
            "url":        response.url,
            "date":       date,
            "type":       doc_type,
            "body":       body,
            "file_url":   file_url,
            "source":     "UNFCCC",
            "scraped_at": datetime.utcnow().isoformat(),
        }
