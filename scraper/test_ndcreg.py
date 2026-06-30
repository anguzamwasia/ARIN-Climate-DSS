import undetected_chromedriver as uc
import time
from bs4 import BeautifulSoup

def main():
    options = uc.ChromeOptions()
    options.headless = False
    driver = uc.Chrome(options=options, version_main=149)
    
    url = "https://unfccc.int/NDCREG"
    print(f"Loading {url}...")
    driver.get(url)
    
    # Wait for Incapsula or slow loads
    for _ in range(15):
        time.sleep(4)
        if "Incapsula" not in driver.page_source:
            break
            
    print("Page loaded. Looking for tables...")
    soup = BeautifulSoup(driver.page_source, 'html.parser')
    tables = soup.find_all('table')
    for table in tables:
        headers = [th.text.strip() for th in table.find_all('th')]
        print(f"Table headers: {headers}")
        
    driver.quit()

if __name__ == '__main__':
    main()
