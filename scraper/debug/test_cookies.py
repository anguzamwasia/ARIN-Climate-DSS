import undetected_chromedriver as uc
import time
from curl_cffi import requests

def main():
    options = uc.ChromeOptions()
    options.headless = False
    driver = uc.Chrome(options=options, version_main=149)
    
    print("Clearing Incapsula...")
    driver.get("https://unfccc.int")
    for _ in range(15):
        time.sleep(3)
        if "Incapsula" not in driver.page_source:
            break
            
    print("Extracting cookies...")
    cookies = driver.get_cookies()
    cookie_dict = {c['name']: c['value'] for c in cookies}
    driver.quit()
    
    print("Testing requests with cookies...")
    session = requests.Session()
    session.cookies.update(cookie_dict)
    
    resp = session.get("https://unfccc.int/documents?page=0", impersonate="chrome110")
    if "Incapsula" in resp.text:
        print("FAILED: Requests was blocked even with cookies.")
    else:
        print("SUCCESS! We can scrape with requests now!")
        print("Rows:", resp.text.count("<tr>"))

if __name__ == '__main__':
    main()
