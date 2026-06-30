import requests as base_requests
from curl_cffi import requests

def test_proxies():
    print("Fetching proxies...")
    proxy_list = base_requests.get('https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all').text.split('\r\n')
    proxy_list = [p for p in proxy_list if p]
    print(f"Found {len(proxy_list)} proxies. Testing...")
    
    for p in proxy_list[:20]:
        print(f"Testing proxy {p}...")
        try:
            r = requests.get(
                "https://unfccc.int/reports",
                impersonate="chrome124",
                proxies={"http": f"http://{p}", "https": f"http://{p}"},
                timeout=10
            )
            if "_Incapsula_Resource" not in r.text and "view-content" in r.text:
                print(f"SUCCESS with proxy {p}!!")
                return p
            else:
                print("Failed: Hit WAF or proxy issue")
        except Exception as e:
            print(f"Failed: {e}")
            
test_proxies()
