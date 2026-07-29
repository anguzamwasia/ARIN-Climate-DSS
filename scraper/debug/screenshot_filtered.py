import undetected_chromedriver as uc
import time
from bs4 import BeautifulSoup

def main():
    options = uc.ChromeOptions()
    options.headless = False
    driver = uc.Chrome(options=options, version_main=149)
    
    print("Clearing Incapsula on homepage...")
    driver.get("https://unfccc.int")
    time.sleep(10)
        
    url = "https://unfccc.int/documents?f%5B0%5D=region%3AAfrica"
    print(f"Loading {url}...")
    driver.get(url)
    
    time.sleep(15)
    driver.save_screenshot("screenshot_filtered.png")
    print("Screenshot saved to screenshot_filtered.png")
    
    with open("filtered_dump.html", "w", encoding="utf-8") as f:
        f.write(driver.page_source)
        
    driver.quit()

if __name__ == '__main__':
    main()
