import scrapy
from datetime import datetime
import urllib.parse
import psycopg2

def get_scraperapi_url(url):
    payload = {'api_key': 'e72e2927075e7279512257aacb9568eb', 'url': url, 'render': 'true'}
    return 'http://api.scraperapi.com/?' + urllib.parse.urlencode(payload)

class PostgresPipeline:
    def __init__(self):
        self.conn = psycopg2.connect("postgresql://postgres:password@localhost:5432/arin_dss")
        self.cur = self.conn.cursor()

    def process_item(self, item, spider):
        try:
            self.cur.execute(
                "INSERT INTO documents (title, url, type, country, file_url, source, scraped_at) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s) "
                "ON CONFLICT DO NOTHING",
                (item.get("title"), item.get("url"), item.get("type"), item.get("country"), item.get("pdf_url") or item.get("file_url"), "UNFCCC", item.get("scraped_at"))
            )
            self.conn.commit()
        except Exception as e:
            self.conn.rollback()
        return item

    def close_spider(self, spider):
        self.cur.close()
        self.conn.close()

class UnfcccReportsSpider(scrapy.Spider):
    name = "unfccc_reports"
    
    # We will track the actual target URLs in meta
    start_urls = ['https://unfccc.int/documents?search_api_views_fulltext=Algeria', 'https://unfccc.int/documents?search_api_views_fulltext=Angola', 'https://unfccc.int/documents?search_api_views_fulltext=Benin', 'https://unfccc.int/documents?search_api_views_fulltext=Botswana', 'https://unfccc.int/documents?search_api_views_fulltext=Burkina%20Faso', 'https://unfccc.int/documents?search_api_views_fulltext=Burundi', 'https://unfccc.int/documents?search_api_views_fulltext=Cabo%20Verde', 'https://unfccc.int/documents?search_api_views_fulltext=Cameroon', 'https://unfccc.int/documents?search_api_views_fulltext=Central%20African%20Republic', 'https://unfccc.int/documents?search_api_views_fulltext=Chad', 'https://unfccc.int/documents?search_api_views_fulltext=Comoros', 'https://unfccc.int/documents?search_api_views_fulltext=Congo', 'https://unfccc.int/documents?search_api_views_fulltext=Cote%20d%20Ivoire', 'https://unfccc.int/documents?search_api_views_fulltext=Democratic%20Republic%20of%20the%20Congo', 'https://unfccc.int/documents?search_api_views_fulltext=Djibouti', 'https://unfccc.int/documents?search_api_views_fulltext=Egypt', 'https://unfccc.int/documents?search_api_views_fulltext=Equatorial%20Guinea', 'https://unfccc.int/documents?search_api_views_fulltext=Eritrea', 'https://unfccc.int/documents?search_api_views_fulltext=Eswatini', 'https://unfccc.int/documents?search_api_views_fulltext=Ethiopia', 'https://unfccc.int/documents?search_api_views_fulltext=Gabon', 'https://unfccc.int/documents?search_api_views_fulltext=Gambia', 'https://unfccc.int/documents?search_api_views_fulltext=Ghana', 'https://unfccc.int/documents?search_api_views_fulltext=Guinea', 'https://unfccc.int/documents?search_api_views_fulltext=Guinea-Bissau', 'https://unfccc.int/documents?search_api_views_fulltext=Kenya', 'https://unfccc.int/documents?search_api_views_fulltext=Lesotho', 'https://unfccc.int/documents?search_api_views_fulltext=Liberia', 'https://unfccc.int/documents?search_api_views_fulltext=Libya', 'https://unfccc.int/documents?search_api_views_fulltext=Madagascar', 'https://unfccc.int/documents?search_api_views_fulltext=Malawi', 'https://unfccc.int/documents?search_api_views_fulltext=Mali', 'https://unfccc.int/documents?search_api_views_fulltext=Mauritania', 'https://unfccc.int/documents?search_api_views_fulltext=Mauritius', 'https://unfccc.int/documents?search_api_views_fulltext=Morocco', 'https://unfccc.int/documents?search_api_views_fulltext=Mozambique', 'https://unfccc.int/documents?search_api_views_fulltext=Namibia', 'https://unfccc.int/documents?search_api_views_fulltext=Niger', 'https://unfccc.int/documents?search_api_views_fulltext=Nigeria', 'https://unfccc.int/documents?search_api_views_fulltext=Rwanda', 'https://unfccc.int/documents?search_api_views_fulltext=Sao%20Tome%20and%20Principe', 'https://unfccc.int/documents?search_api_views_fulltext=Senegal', 'https://unfccc.int/documents?search_api_views_fulltext=Seychelles', 'https://unfccc.int/documents?search_api_views_fulltext=Sierra%20Leone', 'https://unfccc.int/documents?search_api_views_fulltext=Somalia', 'https://unfccc.int/documents?search_api_views_fulltext=South%20Africa', 'https://unfccc.int/documents?search_api_views_fulltext=South%20Sudan', 'https://unfccc.int/documents?search_api_views_fulltext=Sudan', 'https://unfccc.int/documents?search_api_views_fulltext=Tanzania', 'https://unfccc.int/documents?search_api_views_fulltext=Togo', 'https://unfccc.int/documents?search_api_views_fulltext=Tunisia', 'https://unfccc.int/documents?search_api_views_fulltext=Uganda', 'https://unfccc.int/documents?search_api_views_fulltext=Zambia', 'https://unfccc.int/documents?search_api_views_fulltext=Zimbabwe']

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
        'CONCURRENT_REQUESTS': 1,
        'DOWNLOAD_DELAY': 2,
        'ROBOTSTXT_OBEY': False,
        'ITEM_PIPELINES': {
            'unfccc_reports.PostgresPipeline': 300,
        },
        "FEEDS": {
            "output/unfccc_reports.json": {
                "format": "json",
                "encoding": "utf8",
                "overwrite": True,
            }
        },
    }

    def start_requests(self):
        for url in self.start_urls:
            is_africa_search = "region%3AAfrica" in url
            yield scrapy.Request(
                get_scraperapi_url(url), 
                meta={'target_url': url, 'from_africa': is_africa_search}, 
                callback=self.parse
            )

    def parse(self, response):
        target_url = response.meta.get('target_url', response.url)
        from_africa = response.meta.get('from_africa', False)
        
        # doc_links are usually relative (e.g. /documents/12345)
        # but because we hit scraperAPI, response.url is api.scraperapi.com
        # so we must use urllib.parse.urljoin with the target_url!
        doc_links = list({
            l for l in response.css("a::attr(href)").getall()
            if l and "/documents/" in l
        })
        for link in doc_links:
            absolute_doc_url = urllib.parse.urljoin(target_url, link)
            yield scrapy.Request(
                get_scraperapi_url(absolute_doc_url),
                meta={'target_url': absolute_doc_url, 'from_africa': from_africa},
                callback=self.parse_document,
            )
        
        next_page = response.css("a[rel=next]::attr(href), li.pager__item--next a::attr(href)").get()
        if next_page:
            absolute_next_url = urllib.parse.urljoin(target_url, next_page)
            yield scrapy.Request(
                get_scraperapi_url(absolute_next_url),
                meta={'target_url': absolute_next_url, 'from_africa': from_africa},
                callback=self.parse,
            )

    def parse_document(self, response):
        target_url = response.meta.get('target_url', response.url)
        from_africa = response.meta.get('from_africa', False)
        
        title = (
            response.css("h1::text").get()
            or response.css(".page-title::text").get()
            or response.css("title::text").get()
            or "No title"
        ).strip()

        title_lower = title.lower()
        
        country_nodes = response.css(".field--name-field-country a::text").getall()
        countries_in_metadata = [c.strip() for c in country_nodes if c.strip()]
        
        assigned_country = "Africa (Global)"
        is_african = False

        if countries_in_metadata:
            for c in countries_in_metadata:
                if c in self.AFRICAN_COUNTRIES:
                    is_african = True
                    assigned_country = c
                    break
        
        if not is_african:
            for c in self.AFRICAN_COUNTRIES:
                if (" " + c.lower() + " ") in (" " + title_lower + " ") or title_lower.startswith(c.lower() + " ") or title_lower.startswith(c.lower() + "."):
                    is_african = True
                    assigned_country = c
                    break

        if not is_african:
            if from_africa:
                is_african = True
            else:
                return # Skip non-African countries completely!
        
        date     = (response.css("time::attr(datetime)").get() or response.css("time::text").get() or "").strip()
        doc_type = response.css(".field--name-field-document-type a::text").get("").strip()
        body     = response.css(".field--name-field-symbol a::text").get("").strip()
        file_url = response.css("a[href*='/sites/default/files/resource/']::attr(href)").get("")
        if file_url:
            file_url = urllib.parse.urljoin(target_url, file_url)

        self.logger.info(f"AFRICA: {title[:80]} | FILE: {bool(file_url)}")
        yield {
            "title":      title,
            "url":        target_url,
            "date":       date,
            "type":       doc_type,
            "body":       body,
            "file_url":   file_url,
            "source":     "UNFCCC",
            "country":    assigned_country,
            "scraped_at": datetime.utcnow().isoformat(),
        }
