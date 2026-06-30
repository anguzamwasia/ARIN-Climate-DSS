from curl_cffi import requests

try:
    response = requests.get("https://unfccc.int/NDCREG", impersonate="chrome124", timeout=30)
    with open("ndcreg_curl.html", "w", encoding="utf-8") as f:
        f.write(response.text)
    print("Fetched successfully. Length:", len(response.text))
except Exception as e:
    print("Error:", e)
