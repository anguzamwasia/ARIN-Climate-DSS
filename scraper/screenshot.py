import undetected_chromedriver as uc
import time

def main():
    options = uc.ChromeOptions()
    options.headless = False
    driver = uc.Chrome(options=options, version_main=149)
    
    url = "https://unfccc.int/NDCREG"
    print(f"Loading {url}...")
    driver.get(url)
    
    time.sleep(10)
    driver.save_screenshot("screenshot.png")
    print("Screenshot saved to screenshot.png")
        
    driver.quit()

if __name__ == '__main__':
    main()
