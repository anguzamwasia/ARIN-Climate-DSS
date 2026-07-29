import requests
headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"}
try:
    r = requests.get("https://unfccc.int/reports", headers=headers, timeout=10)
    print("Status:", r.status_code)
    print("Length:", len(r.text))
    if "Incapsula" in r.text or "iframe" in r.text.lower():
        print("Blocked by Incapsula")
    else:
        print("Success! Not blocked.")
except Exception as e:
    print("Error:", e)
