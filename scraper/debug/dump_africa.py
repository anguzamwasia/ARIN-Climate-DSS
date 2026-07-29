import undetected_chromedriver as uc
import time

def main():
    options = uc.ChromeOptions()
    options.headless = False
    driver = uc.Chrome(options=options, version_main=149)
    
    url = "https://unfccc.int/documents?f%5B0%5D=region%3AAfrica&page=%2C%2C0"
    print(f"Loading {url}...")
    driver.get(url)
    
    for _ in range(15):
        time.sleep(3)
        if "Incapsula" in driver.page_source:
            continue
        break
        
    time.sleep(5)
    with open("test_africa.html", "w", encoding="utf-8") as f:
        f.write(driver.page_source)
        
    driver.quit()

if __name__ == '__main__':
    main()
