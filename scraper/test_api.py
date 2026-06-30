import requests
import urllib.parse

target_url = "https://unfccc.int/documents?f%5B0%5D=region%3AAfrica"
payload = {
    'api_key': 'e72e2927075e7279512257aacb9568eb',
    'url': target_url,
    'render': 'true'
}
scraperapi_url = "http://api.scraperapi.com/?" + urllib.parse.urlencode(payload)

response = requests.get(scraperapi_url)
print(response.status_code)
with open("test.html", "w", encoding="utf-8") as f:
    f.write(response.text)
