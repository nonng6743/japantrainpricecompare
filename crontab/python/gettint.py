#!/usr/bin/env python3
"""
Klook Web Scraper for JR East Tokyo Wide Pass
Scrapes price information from Klook activity page using browser automation

Optimized for Ubuntu 24.04.3 LTS (GNU/Linux 6.14.0-1011-aws x86_64)

Required system dependencies on Ubuntu:
    sudo apt-get update
    sudo apt-get install -y \
        chromium-browser \
        chromium-chromedriver \
        python3-pip \
        python3-selenium \
        xvfb \
        fonts-liberation \
        libasound2 \
        libatk-bridge2.0-0 \
        libatk1.0-0 \
        libatspi2.0-0 \
        libcups2 \
        libdbus-1-3 \
        libdrm2 \
        libgbm1 \
        libgtk-3-0 \
        libnspr4 \
        libnss3 \
        libxcomposite1 \
        libxdamage1 \
        libxfixes3 \
        libxkbcommon0 \
        libxrandr2 \
        xdg-utils

Or use Chrome instead of Chromium:
    wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
    sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
    sudo apt-get update
    sudo apt-get install -y google-chrome-stable
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
import requests
import zipfile
import os
import shutil
from datetime import datetime

def get_chrome_binary_path():
    """
    Get the installed Chrome binary path by checking common locations
    Returns the path (e.g., '/usr/local/bin/chrome') or None if not found
    """
    chrome_paths = [
        '/usr/local/bin/chrome',
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
    ]
    
    for chrome_path in chrome_paths:
        try:
            result = subprocess.run(
                [chrome_path, '--version'],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                # Extract version number for display
                version_match = re.search(r'(\d+\.\d+\.\d+\.\d+)', result.stdout)
                if version_match:
                    print(f"   Found Chrome: {chrome_path} (version: {version_match.group(1)})")
                    return chrome_path
        except (FileNotFoundError, subprocess.TimeoutExpired, Exception):
            continue
    
    return None

def get_chrome_version():
    """
    Get the installed Chrome version by checking common binary paths
    Returns the full version string (e.g., "141.0.7390.78") or None if not found
    """
    chrome_path = get_chrome_binary_path()
    if chrome_path:
        try:
            result = subprocess.run(
                [chrome_path, '--version'],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                # Extract full version number (e.g., "Google Chrome 141.0.7390.78" -> "141.0.7390.78")
                version_match = re.search(r'(\d+\.\d+\.\d+\.\d+)', result.stdout)
                if version_match:
                    return version_match.group(1)
        except Exception:
            pass
    
    return None

def get_chrome_major_version():
    """
    Get the major Chrome version number (e.g., 141)
    """
    full_version = get_chrome_version()
    if full_version:
        return int(full_version.split('.')[0])
    return None

def download_chromedriver_for_version(chrome_version):
    """
    Download ChromeDriver for a specific Chrome version using Chrome for Testing API
    Returns the path to the chromedriver binary
    """
    major_version = chrome_version.split('.')[0]
    print(f"   Attempting to download ChromeDriver for Chrome {chrome_version}...")
    
    # Try to find matching version from Chrome for Testing
    try:
        # Get known good versions
        versions_url = "https://googlechromelabs.github.io/chrome-for-testing/known-good-versions-with-downloads.json"
        response = requests.get(versions_url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            versions = data.get('versions', [])
            
            # Find version that matches our Chrome version
            matching_version = None
            for version_info in reversed(versions):  # Start from latest
                version_str = version_info.get('version', '')
                if version_str.startswith(major_version + '.'):
                    # Check if it has Linux chromedriver download
                    downloads = version_info.get('downloads', {})
                    chromedriver_downloads = downloads.get('chromedriver', [])
                    for download in chromedriver_downloads:
                        if download.get('platform') == 'linux64':
                            matching_version = version_str
                            download_url = download.get('url')
                            break
                    if matching_version:
                        break
            
            if matching_version and download_url:
                print(f"   Found matching ChromeDriver version: {matching_version}")
                # Download to temp directory
                import tempfile
                temp_dir = tempfile.mkdtemp()
                zip_path = os.path.join(temp_dir, 'chromedriver.zip')
                
                print(f"   Downloading from: {download_url}")
                response = requests.get(download_url, timeout=30)
                if response.status_code == 200:
                    with open(zip_path, 'wb') as f:
                        f.write(response.content)
                    
                    # Extract zip
                    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                        zip_ref.extractall(temp_dir)
                    
                    # Find chromedriver binary
                    for root, dirs, files in os.walk(temp_dir):
                        for file in files:
                            if file == 'chromedriver':
                                chromedriver_path = os.path.join(root, file)
                                # Make it executable
                                os.chmod(chromedriver_path, 0o755)
                                print(f"   ✅ ChromeDriver downloaded: {chromedriver_path}")
                                return chromedriver_path
    except Exception as e:
        print(f"   ⚠️  Failed to download from Chrome for Testing: {e}")
    
    return None

def setup_chrome_driver(chrome_binary_path=None):
    """
    Setup ChromeDriver with version matching the installed Chrome
    First tries ChromeDriverManager, then falls back to direct download if version mismatch
    """
    print("📦 Setting up ChromeDriver...")
    
    # Get Chrome binary path if not provided
    if not chrome_binary_path:
        chrome_binary_path = get_chrome_binary_path()
    
    # Get Chrome version
    chrome_version = get_chrome_version()
    if chrome_version:
        print(f"   Chrome version detected: {chrome_version}")
    
    # First try: Use ChromeDriverManager (should auto-detect)
    try:
        print("   Trying ChromeDriverManager (auto-detect)...")
        driver_path = ChromeDriverManager().install()
        print(f"   ✅ ChromeDriver installed: {driver_path}")
        return Service(driver_path), chrome_binary_path
    except Exception as auto_error:
        error_msg = str(auto_error)
        print(f"   ⚠️  ChromeDriverManager failed: {error_msg}")
        
        # Check if it's a version mismatch error
        is_version_mismatch = (
            "version" in error_msg.lower() or 
            "supports Chrome version" in error_msg or
            "session not created" in error_msg.lower()
        )
        
        if is_version_mismatch and chrome_version:
            print("   🔄 Version mismatch detected, trying to download matching ChromeDriver...")
            # Second try: Download matching ChromeDriver directly
            try:
                driver_path = download_chromedriver_for_version(chrome_version)
                if driver_path and os.path.exists(driver_path):
                    print(f"   ✅ ChromeDriver downloaded and ready: {driver_path}")
                    return Service(driver_path), chrome_binary_path
            except Exception as download_error:
                print(f"   ⚠️  Direct download also failed: {download_error}")
        
        # If all else fails, provide guidance
        print(f"\n   ❌ ChromeDriver setup failed completely")
        print("   💡 Troubleshooting:")
        print("   1. Try updating Chrome to the latest version")
        if chrome_version:
            print(f"   2. Your Chrome version: {chrome_version}")
            print(f"   3. Manually download matching ChromeDriver from:")
            print(f"      https://googlechromelabs.github.io/chrome-for-testing/")
            print(f"   4. Extract and place chromedriver in PATH or specify path")
        
        raise

def scrape_klook_activity():
    """
    Scrape Klook activity page for JR East Tokyo Wide Pass
    Opens browser to extract price information
    """
    url = "https://www.klook.com/activity/49927-jr-east-tokyo-tokyowidepass/?spm=Home.Popular%3Aany%3A%3APopularActivities%3ACard_LIST&clickId=3f5fba6719"
    
    # Configure Chrome options for Ubuntu/Linux server environment
    chrome_options = Options()
    
    # Enable headless mode for server environments (Ubuntu 24.04.3 LTS)
    chrome_options.add_argument('--headless=new')  # Use new headless mode
    chrome_options.add_argument('--no-sandbox')  # Required for running as root or in containers
    chrome_options.add_argument('--disable-dev-shm-usage')  # Overcome limited resource problems
    chrome_options.add_argument('--disable-gpu')  # Disable GPU hardware acceleration
    chrome_options.add_argument('--disable-software-rasterizer')  # Disable software rasterizer
    chrome_options.add_argument('--disable-extensions')  # Disable extensions
    chrome_options.add_argument('--disable-background-timer-throttling')  # Disable background throttling
    chrome_options.add_argument('--disable-backgrounding-occluded-windows')
    chrome_options.add_argument('--disable-renderer-backgrounding')
    chrome_options.add_argument('--disable-features=TranslateUI')  # Disable translation UI
    chrome_options.add_argument('--disable-ipc-flooding-protection')  # Disable IPC flooding protection
    
    # Anti-detection options
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    
    # Window and display settings
    chrome_options.add_argument('--window-size=1920,1080')
    chrome_options.add_argument('--start-maximized')
    
    # Linux user agent for Ubuntu 24.04.3 LTS
    chrome_options.add_argument('--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36')
    
    # Additional options for headless/server environments
    chrome_options.add_argument('--remote-debugging-port=9222')  # Enable remote debugging
    chrome_options.add_argument('--single-process')  # Run in single process mode (optional, may help with stability)
    
    # Set Chrome binary location if found
    chrome_binary_path = get_chrome_binary_path()
    if chrome_binary_path:
        chrome_options.binary_location = chrome_binary_path
        print(f"   Using Chrome binary: {chrome_binary_path}")
    
    # Enable performance logging to capture network requests
    chrome_options.set_capability('goog:loggingPrefs', {'performance': 'ALL'})
    
    driver = None
    captured_request = None
    target_url = "https://www.klook.com/v3/userserv/user/profile_service/get_simple_profile_by_token"
    
    try:
        import platform
        import os
        
        # Detect environment
        system_info = platform.system()
        platform_info = platform.platform()
        print(f"🚀 Starting browser scraper for Klook activity...")
        print(f"🖥️  Running on: {system_info} - {platform_info}")
        print(f"📍 URL: {url}")
        print(f"🌐 Headless mode: Enabled (server environment)")
        
        # Initialize WebDriver with version matching
        try:
            service, chrome_binary = setup_chrome_driver()
            # Ensure binary location is set in options
            if chrome_binary and not chrome_options.binary_location:
                chrome_options.binary_location = chrome_binary
            driver = webdriver.Chrome(service=service, options=chrome_options)
        except Exception as driver_error:
            print(f"❌ Error initializing ChromeDriver: {driver_error}")
            print("\n💡 Troubleshooting tips:")
            print("   1. Make sure Chrome/Chromium is installed:")
            print("      sudo apt-get install -y chromium-browser chromium-chromedriver")
            print("   2. Or install Google Chrome:")
            print("      wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -")
            print("      sudo sh -c 'echo \"deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main\" >> /etc/apt/sources.list.d/google-chrome.list'")
            print("      sudo apt-get update && sudo apt-get install -y google-chrome-stable")
            print("   3. Check if ChromeDriverManager can access the internet to download drivers")
            print("   4. If version mismatch persists, try manually installing ChromeDriver:")
            print("      - Check Chrome version: /usr/local/bin/chrome --version")
            print("      - Download matching ChromeDriver from: https://googlechromelabs.github.io/chrome-for-testing/")
            raise
        
        print("🌐 Opening browser (headless mode)...")
        # Navigate to URL
        driver.get(url)
        
        # Wait for page to load
        print("⏳ Waiting for page to load...")
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        
        # Wait a bit for dynamic content to load
        time.sleep(3)
        
        # Extract page title
        title = driver.title
        print(f"📄 Page Title: {title}")
        
        # Click first header button (likely language/currency selector)
        print("\n🔍 Searching for header button (language/currency selector)...")
        try:
            header_button_xpath = "//*[@id='__layout']/div/header/div/nav/div[2]/div[2]"
            header_button = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, header_button_xpath))
            )
            
            print("✅ Header button found!")
            
            # Scroll to element to make it visible
            driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", header_button)
            time.sleep(0.5)
            
            # Click the first button
            print("🖱️  Clicking header button...")
            header_button.click()
            print("✅ Header button clicked successfully!")
            
            # Wait for dropdown menu to appear
            time.sleep(1.5)
            
            # Click second button (menu item)
            print("\n🔍 Searching for menu item button...")
            menu_item_xpath = "//*[@id='__layout']/div/header/div/nav/div[2]/div[2]/div[2]/div/div/div/div/ul[2]/li[28]/a"
            menu_item = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, menu_item_xpath))
            )
            
            print("✅ Menu item found!")
            
            # Click the menu item
            print("🖱️  Clicking menu item...")
            menu_item.click()
            print("✅ Menu item clicked successfully!")
            
            # Wait for page to update after clicking
            time.sleep(2)
            
        except Exception as header_error:
            print(f"⚠️  Could not find or click header buttons: {header_error}")
            print("   Continuing with next steps anyway...")
        
        # Search for and click the button
        print("\n🔍 Searching for button with id='group-swiper-listItem-139519'...")
        try:
            # Try to find the button by ID
            button_xpath = "//*[@id='group-swiper-listItem-139519']"
            button_element = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, button_xpath))
            )
            
            print("✅ Button found!")
            
            # Scroll to element to make it visible
            print("📜 Scrolling to button...")
            driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", button_element)
            time.sleep(1)  # Wait for scroll to complete
            
            # Click the button
            print("🖱️  Clicking button...")
            button_element.click()
            print("✅ Button clicked successfully!")
            
            # Wait for any actions triggered by the click
            time.sleep(2)
            
        except Exception as click_error:
            print(f"⚠️  Could not find or click button: {click_error}")
            print("   Continuing with next steps anyway...")
        
        # Click the package option button
        print("\n🔍 Searching for package option button...")
        try:
            package_button_xpath = "//*[@id='group-web-id-620980-139519']/div[2]/div[2]/div[2]/button"
            package_button = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, package_button_xpath))
            )
            
            print("✅ Package option button found!")
            
            # Scroll to element to make it visible
            print("📜 Scrolling to package button...")
            driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", package_button)
            time.sleep(1)  # Wait for scroll to complete
            
            # Click the button
            print("🖱️  Clicking package option button...")
            package_button.click()
            print("✅ Package option button clicked successfully!")
            
            # Wait for any actions triggered by the click
            time.sleep(2)
            
        except Exception as package_error:
            print(f"⚠️  Could not find or click package option button: {package_error}")
            print("   Continuing with price extraction anyway...")
        
        # Monitor network requests for the target API
        print(f"\n📡 Monitoring network requests for: {target_url}")
        print("   Waiting for API request (this may take a moment)...")
        
        # Wait and check for captured requests using Performance logs
        max_wait_time = 30  # Wait up to 30 seconds
        check_interval = 1  # Check every 1 second
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
                            if target_url in request_url:
                                request_headers = request_data.get('headers', {})
                                request_method = request_data.get('method', 'N/A')
                                post_data = request_data.get('postData', '')
                                
                                captured_request = {
                                    'url': request_url,
                                    'method': request_method,
                                    'headers': request_headers,
                                    'postData': post_data,
                                    'timestamp': datetime.now().isoformat()
                                }
                                
                                print(f"\n{'='*70}")
                                print(f"🎯 TARGET API REQUEST CAPTURED!")
                                print(f"{'='*70}")
                                print(f"\n📍 URL:")
                                print(f"   {request_url}")
                                print(f"\n🔧 Method:")
                                print(f"   {request_method}")
                                print(f"\n📤 Headers: {len(request_headers)} headers captured")
                                print(f"{'-'*70}")
                                
                                # Display headers, filtering sensitive ones
                                sensitive_headers = ['cookie', 'authorization', 'x-api-key', 'x-auth-token', 'x-csrf-token']
                                displayed_count = 0
                                
                                for key, value in request_headers.items():
                                    # Skip sensitive headers in display (but keep in captured_request)
                                    if key.lower() in sensitive_headers:
                                        continue
                                    
                                    # Truncate very long values for display
                                    display_value = str(value)
                                    if len(display_value) > 150:
                                        display_value = display_value[:150] + "..."
                                    print(f"   {key}: {display_value}")
                                    displayed_count += 1
                                
                                # Show count of filtered headers
                                filtered_count = len(request_headers) - displayed_count
                                if filtered_count > 0:
                                    print(f"\n   ⚠️  {filtered_count} sensitive header(s) hidden (cookie, authorization, etc.)")
                                    print(f"   (Full headers saved in JSON output)")
                                
                                if post_data:
                                    print(f"\n📦 Request Body (Post Data):")
                                    try:
                                        # Try to parse as JSON for better display
                                        post_data_json = json.loads(post_data)
                                        print(f"   {json.dumps(post_data_json, indent=2, ensure_ascii=False)}")
                                    except:
                                        print(f"   {post_data[:500]}")  # Show first 500 chars
                                
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
                    print(f"   Still waiting... ({waited_time}s/{max_wait_time}s)")
        
        if not found_request:
            print(f"\n⚠️  No request to {target_url} was captured within {max_wait_time} seconds")
            print("   The request might not have been triggered yet")
            print("   Try interacting with the page more (select dates, options, quantity, etc.)")
        else:
            print(f"\n✅ Successfully captured API request!")
        
        # Try to extract price information
        price_data = {}
        
        # Common price selectors for Klook
        price_selectors = [
            # Try different possible selectors
            ("//span[contains(@class, 'price')]", "XPath - price class"),
            ("//div[contains(@class, 'price')]", "XPath - price div"),
            ("//*[contains(@class, 'amount')]", "XPath - amount class"),
            ("//*[contains(@data-testid, 'price')]", "XPath - data-testid price"),
            ("//*[contains(text(), '฿')]", "XPath - contains THB symbol"),
            ("//*[contains(text(), '$')]", "XPath - contains USD symbol"),
        ]
        
        print("\n🔍 Searching for price information...")
        for selector, description in price_selectors:
            try:
                elements = driver.find_elements(By.XPATH, selector)
                if elements:
                    for i, elem in enumerate(elements[:3]):  # Check first 3 matches
                        text = elem.text.strip()
                        if text and ('฿' in text or '$' in text or '¥' in text or any(char.isdigit() for char in text)):
                            price_data[f"price_{description}_{i}"] = text
                            print(f"  ✓ Found: {text} ({description})")
            except Exception as e:
                continue
        
        # Get page source for additional analysis
        page_source = driver.page_source
        
        # Try to find price in page source using text search
        if '฿' in page_source:
            import re
            # Look for price patterns like ฿1,234 or ฿ 1,234
            price_patterns = re.findall(r'฿\s*[\d,]+', page_source)
            if price_patterns:
                price_data['found_in_source'] = list(set(price_patterns))[:5]  # Get unique prices, max 5
                print(f"  ✓ Found prices in source: {price_data['found_in_source']}")
        
        # Save results
        result = {
            'url': url,
            'title': title,
            'scraped_at': datetime.now().isoformat(),
            'price_data': price_data,
            'page_source_length': len(page_source),
            'captured_api_request': captured_request
        }
        
        # Save to JSON file
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_file = f'klook_scrape_result_{timestamp}.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ Scraping completed!")
        print(f"💾 Results saved to: {output_file}")
        print(f"\n📊 Summary:")
        print(f"   - Title: {title}")
        print(f"   - Price data found: {len(price_data)} entries")
        if captured_request:
            print(f"   - API request captured: ✅")
            print(f"     URL: {captured_request.get('url', 'N/A')[:80]}...")
            print(f"     Method: {captured_request.get('method', 'N/A')}")
            print(f"     Headers count: {len(captured_request.get('headers', {}))}")
            if captured_request.get('postData'):
                print(f"     Has request body: ✅")
        else:
            print(f"   - API request captured: ❌")
        
        # Small delay before closing (headless mode, no visual browser)
        print("\n⏸️  Finalizing...")
        time.sleep(1)
        
        return result
        
    except Exception as e:
        print(f"❌ Error occurred: {str(e)}")
        import traceback
        traceback.print_exc()
        return None
        
    finally:
        if driver:
            print("\n🔒 Closing browser...")
            driver.quit()

if __name__ == "__main__":
    scrape_klook_activity()
