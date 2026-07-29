from curl_cffi import requests

for imp in ["chrome110", "chrome124", "safari15_3", "safari17_0", "edge99", "edge101"]:
    try:
        r = requests.get("https://unfccc.int/reports", impersonate=imp, timeout=10)
        print(f"{imp} - {r.status_code}")
        if "Incapsula" in r.text or "iframe" in r.text.lower():
            print(f"  Blocked by Incapsula")
        else:
            print(f"  Success! Not blocked.")
            break
    except Exception as e:
        print(f"{imp} - Error: {e}")
