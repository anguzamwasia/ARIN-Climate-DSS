from curl_cffi import requests

url = "https://unfccc.int/documents?page=0"
response = requests.get(url, impersonate="chrome110")
if "Incapsula" in response.text:
    print("BLOCKED")
else:
    print("SUCCESS")
    print("Length:", len(response.text))
