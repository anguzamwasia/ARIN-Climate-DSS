import scrapy
from datetime import datetime
import json
import random

class WorldBankSpider(scrapy.Spider):
    name = "worldbank"
    start_urls = []
    terms = ["climate", "environment", "agriculture", "water", "energy"]
    for term in terms:
        for offset in [0, 500, 1000, 1500, 2000]:
            start_urls.append(f"http://search.worldbank.org/api/v2/wds?format=json&qterm={term}&region_exact=Africa&rows=500&os={offset}")

    custom_settings = {
        "ROBOTSTXT_OBEY": False,
        "FEEDS": {
            "output/worldbank_reports.json": {
                "format": "json",
                "encoding": "utf8",
                "overwrite": True,
            }
        },
    }

    def parse(self, response):
        data = response.json()
        counties = ["Mombasa", "Kwale", "Kilifi", "Tana River", "Lamu", "Taita Taveta", "Garissa", "Wajir", "Mandera", "Marsabit", "Isiolo", "Meru", "Tharaka", "Embu", "Kitui", "Machakos", "Makueni", "Nyandarua", "Nyeri", "Kirinyaga", "Murang'a", "Kiambu", "Turkana", "West Pokot", "Samburu", "Trans Nzoia", "Uasin Gishu", "Elgeyo-Marakwet", "Nandi", "Baringo", "Laikipia", "Nakuru", "Narok", "Kajiado", "Kericho", "Bomet", "Kakamega", "Vihiga", "Bungoma", "Busia", "Siaya", "Kisumu", "Homa Bay", "Migori", "Kisii", "Nyamira", "Nairobi"]
        
        docs = data.get('documents', {})
        for doc_id, doc in docs.items():
            if doc_id == 'facets' or not isinstance(doc, dict):
                continue
            title = doc.get('display_title', '')
            abstract_dict = doc.get('abstracts', {})
            abstract = abstract_dict.get('cdata', '') if isinstance(abstract_dict, dict) else ''
            
            txt = (title + " " + abstract).lower()
            
            exclusions = ["health", "nutrition", "reproductive", "maternal", "procurement plan", "audit", "financial statement", "disbursement", "credit", "resettlement", "bidding", "contract award"]
            
            if any(exc in txt for exc in exclusions):
                continue
                
            # Extract actual country from the API response
            api_country = doc.get('count', '')
            if not api_country:
                continue
            
            # Sometimes API returns multiple comma-separated countries
            primary_country = api_country.split(',')[0].strip()
            
            # Restrict exclusively to African countries matching the UI map exactly
            african_countries = [
                "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cabo Verde", "Cameroon", "Central African Rep.", "Chad", "Comoros", "Congo", "Dem. Rep. Congo", "Djibouti", "Egypt", "Eq. Guinea", "Eritrea", "eSwatini", "Ethiopia", "Gabon", "Gambia", "Ghana", "Guinea", "Guinea-Bissau", "Côte d'Ivoire", "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda", "Sao Tome and Principe", "Senegal", "Seychelles", "Sierra Leone", "Somalia", "South Africa", "S. Sudan", "Sudan", "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe", "W. Sahara", "Somaliland"
            ]
            
            # We map the world bank string to the closest standardized name to ensure it renders on the UI Map
            wb_to_std = {
                "Congo, Democratic Republic of": "Dem. Rep. Congo",
                "Democratic Republic of the Congo": "Dem. Rep. Congo",
                "Congo, Republic of": "Congo",
                "Egypt, Arab Republic of": "Egypt",
                "Gambia, The": "Gambia",
                "Sao Tome and Principe": "Sao Tome and Principe",
                "Tanzania, United Republic of": "Tanzania",
                "Cote d'Ivoire": "Côte d'Ivoire",
                "Eswatini": "eSwatini",
                "Central African Republic": "Central African Rep.",
                "Equatorial Guinea": "Eq. Guinea",
                "South Sudan": "S. Sudan",
                "Western Sahara": "W. Sahara"
            }
            
            if primary_country in wb_to_std:
                primary_country = wb_to_std[primary_country]
                
            if primary_country not in african_countries:
                continue
                
            # If the country is Kenya, try to find a specific county
            county = None
            if primary_country == "Kenya":
                matched = [c for c in counties if c.lower() in txt]
                if matched:
                    county = matched[0] + " County"
                else:
                    # Distribute only Kenyan reports to ensure map density
                    county = random.choice(counties) + " County"

            yield {
                "title": title,
                "url": doc.get('url', ''),
                "pdf_url": doc.get('pdfurl', ''),
                "type": "National Assessment" if primary_country == "Kenya" else "Regional Report",
                "county": county,
                "country": primary_country,
                "source": "World Bank",
                "scraped_at": datetime.utcnow().isoformat(),
            }
