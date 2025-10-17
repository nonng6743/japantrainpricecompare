from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
import time

# Configure Chrome options for headless mode
chrome_options = Options()
chrome_options.add_argument('--headless')  # Headless mode
chrome_options.add_argument('--disable-gpu')  # Disable GPU
chrome_options.add_argument('--no-sandbox')  # Disable sandbox (useful in Docker or server)
chrome_options.add_argument('--disable-dev-shm-usage')  # Fix /dev/shm usage limit in containers
chrome_options.add_argument('--disable-blink-features=AutomationControlled')  # Avoid automation detection
chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])  # Disable automation flags
chrome_options.add_experimental_option('useAutomationExtension', False)  # Disable extension usage
chrome_options.add_argument('--disable-extensions')  # Disable Chrome extensions
chrome_options.add_argument('--disable-plugins')  # Disable plugins
chrome_options.add_argument('--disable-images')  # Disable images for faster loading
chrome_options.add_argument('--window-size=1920,1080')  # Set browser window size
chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.7390.107 Safari/537.36')

# Specify the path to the Chrome binary (Google Chrome for Testing)
chrome_options.binary_location = "/usr/local/bin/chrome"

# Specify the path to the Chromedriver binary
chromedriver_path = "/usr/local/bin/chromedriver"

# Initialize the WebDriver with Chrome options and Chromedriver path
service = Service(executable_path=chromedriver_path)
driver = webdriver.Chrome(service=service, options=chrome_options)

try:
    # Navigate to the product page
    url = "https://www.kkday.com/th/product/158964?qs=JR+TOKYO+Wide+Pass"
    driver.get(url)

    # Wait for the booking bar to load (wait for the price element by XPath)
    WebDriverWait(driver, 20).until(
        EC.presence_of_element_located((By.XPATH, "//*[@id='booking-bar']/div[1]/div[1]/div[1]/div/div/div/div/div[2]"))
    )

    # Extract the price from the XPath
    price_element = driver.find_element(By.XPATH, "//*[@id='booking-bar']/div[1]/div[1]/div[1]/div/div/div/div/div[2]")
    price_text = price_element.text.strip()  # Extract and clean the price text

    # Output the extracted price
    print(f"Extracted Price: {price_text}")

except Exception as e:
    print(f"An error occurred: {str(e)}")

finally:
    # Close the browser after scraping
    driver.quit()
