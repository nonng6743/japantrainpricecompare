#!/usr/bin/env python3
"""
Klook Web Scraper - Capture API Headers
Scrapes Klook activity page and captures headers from API request
Compatible with Ubuntu 24.04.3 LTS
"""

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.core.os_manager import ChromeType
import time
import json
import subprocess
import re
import os
import requests
import zipfile
import shutil
from datetime import datetime

def get_chrome_version():
    """
    Get installed Chrome version
    """
    try:
        # Try different methods to get Chrome version
        chrome_paths = ['/usr/local/bin/chrome', '/usr/bin/google-chrome', '/usr/bin/chromium-browser']
        chrome_path = None
        
        for path in chrome_paths:
            try:
                result = subprocess.run([path, '--version'], capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    chrome_path = path
                    version_output = result.stdout.strip()
                    # Extract version number (e.g., "Google Chrome 141.0.7390.78")
                    match = re.search(r'(\d+)\.(\d+)\.(\d+)\.(\d+)', version_output)
                    if match:
                        return chrome_path, match.group(0)
            except (subprocess.TimeoutExpired, FileNotFoundError, subprocess.SubprocessError):
                continue
        
        return None, None
    except Exception as e:
        print(f"⚠️  Could not detect Chrome version: {e}")
        return None, None

def scrape_klook_and_capture_headers():
    """
    Scrape Klook activity page and capture headers from API request
    """
    # Target URLs
    activity_url = "https://www.klook.com/activity/49927-jr-east-tokyo-tokyowidepass/?spm=Activity.TopNavigation.SelectCurrency&clickId=63bd5fbfb3"
    target_api_url = "https://www.klook.com/v3/userserv/user/profile_service/get_simple_profile_by_token"
    
    # Get Chrome version and path
    print("=" * 80)
    print("🚀 Klook Web Scraper - API Header Capture")
    print("=" * 80)
    print(f"\n📍 Activity URL: {activity_url}")
    print(f"🎯 Target API: {target_api_url}")
    print(f"\n🔍 Detecting Chrome installation...")
    
    chrome_path, chrome_version = get_chrome_version()
    if chrome_path:
        print(f"✅ Chrome found at: {chrome_path}")
        print(f"✅ Chrome version: {chrome_version}")
    else:
        print("⚠️  Could not detect Chrome version, using default settings")
    
    # Configure Chrome options for Ubuntu 24.04.3 LTS
    chrome_options = Options()
    # Headless mode for Ubuntu server
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    chrome_options.add_argument('--window-size=1920,1080')
    chrome_options.add_argument('--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    # Set Chrome binary path if found
    if chrome_path:
        chrome_options.binary_location = chrome_path
    
    # Enable performance logging to capture network requests
    chrome_options.set_capability('goog:loggingPrefs', {'performance': 'ALL'})
    
    driver = None
    captured_headers = None
    
    try:
        print(f"\n⏳ Initializing browser...")
        
        # Initialize WebDriver with ChromeDriverManager
        # ChromeDriverManager should auto-detect Chrome version when binary_location is set
        try:
            print(f"📥 Downloading ChromeDriver...")
            # ChromeDriverManager will try to match Chrome version automatically
            driver_manager = ChromeDriverManager()
            driver_path = driver_manager.install()
            print(f"✅ ChromeDriver installed at: {driver_path}")
            service = Service(driver_path)
            driver = webdriver.Chrome(service=service, options=chrome_options)
        except Exception as driver_error:
            error_msg = str(driver_error)
            print(f"⚠️  ChromeDriverManager error: {error_msg}")
            
            # Check if it's a version mismatch error
            if "version" in error_msg.lower() or "supports Chrome version" in error_msg:
                print("\n🔧 Detected ChromeDriver version mismatch!")
                print("   Attempting to fix by downloading matching ChromeDriver...")
                
                if chrome_version:
                    # Extract major version (e.g., 141 from 141.0.7390.78)
                    major_version = chrome_version.split('.')[0]
                    print(f"   Chrome version: {chrome_version} (major: {major_version})")
                    print(f"   Attempting to download ChromeDriver {major_version}...")
                    
                    try:
                        # Try to download specific version from Chrome for Testing
                        # Try with full version first, then major version
                        urls_to_try = [
                            f"https://storage.googleapis.com/chrome-for-testing-public/{chrome_version}/linux64/chromedriver-linux64.zip",
                            f"https://storage.googleapis.com/chrome-for-testing-public/{major_version}.0.0.0/linux64/chromedriver-linux64.zip",
                            f"https://chromedriver.storage.googleapis.com/LATEST_RELEASE_{major_version}",
                        ]
                        
                        chromedriver_dir = os.path.expanduser("~/.wdm/drivers/chromedriver/linux64")
                        os.makedirs(chromedriver_dir, exist_ok=True)
                        
                        chromedriver_binary = None
                        download_success = False
                        
                        # Try first URL (Chrome for Testing with full version)
                        chromedriver_url = urls_to_try[0]
                        print(f"   Downloading from: {chromedriver_url}")
                        
                        zip_path = os.path.join(chromedriver_dir, f"chromedriver_{chrome_version}.zip")
                        try:
                            response = requests.get(chromedriver_url, timeout=30, allow_redirects=True)
                            if response.status_code == 200:
                                with open(zip_path, 'wb') as f:
                                    f.write(response.content)
                                
                                # Extract
                                extract_dir = os.path.join(chromedriver_dir, chrome_version)
                                os.makedirs(extract_dir, exist_ok=True)
                                with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                                    zip_ref.extractall(extract_dir)
                                
                                # Find chromedriver binary (it's usually in a subdirectory)
                                for root, dirs, files in os.walk(extract_dir):
                                    for file in files:
                                        if file == 'chromedriver':
                                            chromedriver_binary = os.path.join(root, file)
                                            download_success = True
                                            break
                                    if chromedriver_binary:
                                        break
                        except Exception as url_error:
                            print(f"   ⚠️  Failed with full version URL: {url_error}")
                            # Try alternative: get latest release for major version
                            try:
                                latest_url = f"https://chromedriver.storage.googleapis.com/LATEST_RELEASE_{major_version}"
                                print(f"   Trying to get latest release for version {major_version}...")
                                latest_response = requests.get(latest_url, timeout=10)
                                if latest_response.status_code == 200:
                                    specific_version = latest_response.text.strip()
                                    download_url = f"https://chromedriver.storage.googleapis.com/{specific_version}/chromedriver_linux64.zip"
                                    print(f"   Downloading ChromeDriver {specific_version}...")
                                    zip_response = requests.get(download_url, timeout=30)
                                    if zip_response.status_code == 200:
                                        with open(zip_path, 'wb') as f:
                                            f.write(zip_response.content)
                                        extract_dir = os.path.join(chromedriver_dir, specific_version)
                                        os.makedirs(extract_dir, exist_ok=True)
                                        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                                            zip_ref.extractall(extract_dir)
                                        # Find chromedriver binary
                                        for root, dirs, files in os.walk(extract_dir):
                                            for file in files:
                                                if file == 'chromedriver':
                                                    chromedriver_binary = os.path.join(root, file)
                                                    download_success = True
                                                    break
                                            if chromedriver_binary:
                                                break
                            except Exception as alt_error:
                                print(f"   ⚠️  Alternative download also failed: {alt_error}")
                        
                        if chromedriver_binary and download_success:
                            # Make executable
                            os.chmod(chromedriver_binary, 0o755)
                            print(f"   ✅ ChromeDriver downloaded and extracted to: {chromedriver_binary}")
                            service = Service(chromedriver_binary)
                            driver = webdriver.Chrome(service=service, options=chrome_options)
                        else:
                            raise Exception("ChromeDriver binary not found or download failed")
                    except Exception as download_error:
                        print(f"   ⚠️  Failed to download matching ChromeDriver: {download_error}")
                        print("\n💡 Solution: Please install ChromeDriver version that matches Chrome")
                        print(f"   Chrome version: {chrome_version}")
                        print("   You can:")
                        print("   1. Update Chrome to match ChromeDriver version")
                        print("   2. Install ChromeDriver 141 manually")
                        print("   3. Use: sudo apt-get install chromium-chromedriver")
                        raise driver_error
                else:
                    raise driver_error
            else:
                # Other errors, try system ChromeDriver
                print("   Trying system ChromeDriver...")
                try:
                    driver = webdriver.Chrome(options=chrome_options)
                except Exception as alt_error:
                    print(f"   ⚠️  System ChromeDriver also failed: {alt_error}")
                    raise driver_error
        
        print("✅ Browser initialized")
        print("🌐 Navigating to activity page...")
        
        # Navigate to URL
        driver.get(activity_url)
        
        # Wait for page to load
        print("⏳ Waiting for page to load...")
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        
        # Wait for dynamic content to load
        time.sleep(3)
        
        print("✅ Page loaded")
        print(f"📄 Page Title: {driver.title}")
        
        # Try to interact with the page to trigger API calls
        # Click on currency/language selector if available
        print("\n🔍 Attempting to trigger API request...")
        try:
            # Try to find and click currency selector
            currency_selector_xpath = "//*[@id='__layout']/div/header/div/nav/div[2]/div[2]"
            currency_button = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, currency_selector_xpath))
            )
            
            print("✅ Currency selector found")
            driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", currency_button)
            time.sleep(0.5)
            
            print("🖱️  Clicking currency selector...")
            currency_button.click()
            time.sleep(2)
            
            # Try to select THB currency
            try:
                thb_option_xpath = "//a[contains(@href, 'k_currency=THB') or contains(text(), 'THB') or contains(text(), '฿')]"
                thb_option = WebDriverWait(driver, 5).until(
                    EC.element_to_be_clickable((By.XPATH, thb_option_xpath))
                )
                print("✅ THB option found")
                thb_option.click()
                time.sleep(2)
            except:
                print("⚠️  THB option not found, continuing...")
                
        except Exception as e:
            print(f"⚠️  Could not interact with currency selector: {e}")
            print("   Continuing to monitor network requests...")
        
        # Monitor network requests for the target API
        print(f"\n📡 Monitoring network requests for API endpoint...")
        print("   Waiting for API request (this may take up to 30 seconds)...")
        
        max_wait_time = 30
        check_interval = 1
        waited_time = 0
        found_request = False
        
        while waited_time < max_wait_time and not found_request:
            try:
                # Get performance logs
                logs = driver.get_log('performance')
                for log in logs:
                    try:
                        message = json.loads(log['message'])
                        method = message.get('message', {}).get('method', '')
                        
                        # Check for requestWillBeSent event
                        if method == 'Network.requestWillBeSent':
                            params = message.get('message', {}).get('params', {})
                            request_data = params.get('request', {})
                            request_url = request_data.get('url', '')
                            
                            # Check if this is our target URL
                            if target_api_url in request_url:
                                request_headers = request_data.get('headers', {})
                                request_method = request_data.get('method', 'N/A')
                                
                                captured_headers = request_headers
                                
                                print("\n" + "=" * 80)
                                print("🎯 API REQUEST CAPTURED!")
                                print("=" * 80)
                                print(f"\n📍 Request URL:")
                                print(f"   {request_url}")
                                print(f"\n🔧 HTTP Method:")
                                print(f"   {request_method}")
                                print(f"\n📤 Request Headers ({len(request_headers)} headers):")
                                print("-" * 80)
                                
                                # Print all headers
                                for key, value in request_headers.items():
                                    # Truncate very long values for display
                                    display_value = str(value)
                                    if len(display_value) > 200:
                                        display_value = display_value[:200] + "... (truncated)"
                                    print(f"   {key}: {display_value}")
                                
                                print("=" * 80)
                                
                                found_request = True
                                break
                                
                    except (json.JSONDecodeError, KeyError, TypeError) as e:
                        continue
                        
            except Exception as check_error:
                pass
            
            if not found_request:
                time.sleep(check_interval)
                waited_time += check_interval
                if waited_time % 5 == 0:
                    print(f"   ⏳ Still waiting... ({waited_time}s/{max_wait_time}s)")
        
        if not found_request:
            print(f"\n⚠️  No request to {target_api_url} was captured within {max_wait_time} seconds")
            print("   The API request might not have been triggered yet.")
            print("   Try:")
            print("   - Interacting with the page more (select dates, options, etc.)")
            print("   - Checking if the API endpoint is called on page load")
            print("   - Increasing the wait time")
        else:
            print(f"\n✅ Successfully captured API headers!")
            
            # Save headers to JSON file
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_file = f'klook_api_headers_{timestamp}.json'
            result = {
                'api_url': target_api_url,
                'activity_url': activity_url,
                'captured_at': datetime.now().isoformat(),
                'headers': captured_headers
            }
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(result, f, indent=2, ensure_ascii=False)
            
            print(f"💾 Headers saved to: {output_file}")
        
        return captured_headers
        
    except Exception as e:
        print(f"\n❌ Error occurred: {str(e)}")
        import traceback
        traceback.print_exc()
        return None
        
    finally:
        if driver:
            print("\n🔒 Closing browser...")
            driver.quit()
            print("✅ Browser closed")

if __name__ == "__main__":
    headers = scrape_klook_and_capture_headers()
    if headers:
        print("\n✅ Scraping completed successfully!")
    else:
        print("\n⚠️  Scraping completed but no headers were captured")
