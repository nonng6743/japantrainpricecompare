from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

# Configure Chrome options for normal browser mode (like a regular user)
chrome_options = Options()
chrome_options.add_argument('--start-maximized')  # Start with maximized window
chrome_options.add_argument('--disable-blink-features=AutomationControlled')  # Avoid automation detection
chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])  # Disable automation flags
chrome_options.add_experimental_option('useAutomationExtension', False)  # Disable extension usage
chrome_options.add_argument('--disable-extensions')  # Disable Chrome extensions
chrome_options.add_argument('--window-size=1920,1080')  # Set browser window size
chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.7390.107 Safari/537.36')
chrome_options.add_argument('--disable-web-security')  # Disable web security for better compatibility
chrome_options.add_argument('--allow-running-insecure-content')  # Allow insecure content
chrome_options.add_argument('--disable-features=VizDisplayCompositor')  # Disable compositor for better performance

# Add server environment options to prevent conflicts
chrome_options.add_argument('--no-sandbox')  # Disable sandbox for server environments
chrome_options.add_argument('--disable-dev-shm-usage')  # Fix /dev/shm usage limit
chrome_options.add_argument('--disable-gpu')  # Disable GPU acceleration

# Specify the path to use a unique temporary user data directory
temp_user_data_dir = tempfile.mkdtemp()
chrome_options.add_argument(f'--user-data-dir={temp_user_data_dir}')  # Use unique temporary user data directory
chrome_options.add_argument('--remote-debugging-port=9222')  # Enable remote debugging

# Initialize WebDriver with Chrome options
driver = webdriver.Chrome(options=chrome_options)

try:
    # Navigate to the product page
    url = "https://www.kkday.com/th/product/158964?qs=JR+TOKYO+Wide+Pass"
    print(f"Opening browser and navigating to: {url}")
    driver.get(url)
    
    # Wait a bit like a human user would
    time.sleep(2)
    print("Page loaded, waiting for content...")

    # Wait for the booking bar to load (wait for the price element by XPath)
    WebDriverWait(driver, 20).until(
        EC.presence_of_element_located((By.XPATH, "//*[@id='booking-bar']/div[1]/div[1]/div[1]/div/div/div/div/div[2]"))
    )
    print("Booking bar found!")

    # Extract the price from the XPath
    price_element = driver.find_element(By.XPATH, "//*[@id='booking-bar']/div[1]/div[1]/div[1]/div/div/div/div/div[2]")
    price_text = price_element.text.strip()  # Extract and clean the price text

    # Output the extracted price
    print(f"Extracted Price: {price_text}")
    
    # Wait a bit before closing to see the result
    time.sleep(3)

except Exception as e:
    print(f"An error occurred: {str(e)}")

finally:
    # Close the browser after scraping
    driver.quit()

    # Clean up temporary user data directory
    if os.path.exists(temp_user_data_dir):
        try:
            shutil.rmtree(temp_user_data_dir)
            print("Cleaned up temporary Chrome user data directory")
        except Exception as e:
            print(f"Warning: Could not clean up temporary directory: {e}")
