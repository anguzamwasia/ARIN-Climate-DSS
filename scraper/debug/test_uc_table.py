import undetected_chromedriver as uc
import time

def main():
    options = uc.ChromeOptions()
    options.headless = False
    driver = uc.Chrome(options=options, version_main=149)
    
    url = "https://unfccc.int/documents"
    print(f"Loading {url}...")
    driver.get(url)
    
    # Wait for Incapsula
    for _ in range(15):
        time.sleep(4)
        if "Incapsula" not in driver.page_source:
            break
            
    print("Page loaded. Saving source...")
    with open("test_table.html", "w", encoding="utf-8") as f:
        f.write(driver.page_source)
        
    driver.quit()

if __name__ == '__main__':
    main()
