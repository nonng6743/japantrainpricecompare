#!/usr/bin/env python3
"""
Web Scraping Script for KKday Product Page
URL: https://www.kkday.com/en/product/158964?qs=JR+TOKYO+Wide+Pass
XPath: /html/body/div[2]/div[2]/div/div/div[2]/div[1]/div/div/div[2]/div[1]/div[1]/div[1]/div[1]/div/div/div/div/div[2]
"""

import requests
from bs4 import BeautifulSoup
import time
import json
from urllib.parse import urljoin, urlparse
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class KKdayScraper:
    def __init__(self):
        self.base_url = "https://www.kkday.com"
        self.target_url = "https://www.kkday.com/th/product/158964?qs=JR+TOKYO+Wide+Pass"
        # Multiple XPath targets for price extraction
        self.xpath_targets = [
            "/html/body/div[2]/div[2]/div/div/div[2]/div[1]/div/div/div[2]/div[1]/div[1]/div[1]/div[1]/div/div/div/div/div[2]",  # Original XPath
            "//*[@id='booking-bar']/div[1]/div[1]/div[1]/div/div/div/div/div[2]"  # Booking bar XPath
        ]
        self.xpath = self.xpath_targets[0]  # Keep original for backward compatibility
        
        # Headers to mimic a real browser
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        
        self.session = requests.Session()
        self.session.headers.update(self.headers)

    def scrape_with_requests(self):
        """Scrape using requests and BeautifulSoup with enhanced 403 handling"""
        try:
            logger.info(f"Scraping URL: {self.target_url}")
            
            # Try multiple request strategies to handle 403 errors
            strategies = [
                self._request_strategy_1,
                self._request_strategy_2,
                self._request_strategy_3,
                self._request_strategy_4
            ]
            
            for i, strategy in enumerate(strategies, 1):
                try:
                    logger.info(f"Trying request strategy {i}")
                    result = strategy()
                    if result['success']:
                        logger.info(f"✅ Request strategy {i} successful")
                        return result
                    else:
                        logger.warning(f"❌ Request strategy {i} failed: {result.get('error', 'Unknown error')}")
                except Exception as e:
                    logger.warning(f"❌ Request strategy {i} failed with exception: {e}")
                    continue
            
            # If all strategies fail, return the last error
            return {'success': False, 'error': 'All request strategies failed', 'method': 'requests'}
                
        except Exception as e:
            logger.error(f"Unexpected error in requests scraping: {e}")
            return {'success': False, 'error': str(e), 'method': 'requests'}
    
    def _request_strategy_1(self):
        """Strategy 1: Basic requests with session"""
        response = self.session.get(self.target_url, timeout=30)
        response.raise_for_status()
        return self._process_response(response)
    
    def _request_strategy_2(self):
        """Strategy 2: Requests with different headers"""
        import requests
        
        # Create new session with different headers
        session = requests.Session()
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        })
        
        response = session.get(self.target_url, timeout=30)
        response.raise_for_status()
        return self._process_response(response)
    
    def _request_strategy_3(self):
        """Strategy 3: Requests with Safari user agent"""
        import requests
        
        # Create new session with Safari user agent
        session = requests.Session()
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        })
        
        response = session.get(self.target_url, timeout=30)
        response.raise_for_status()
        return self._process_response(response)
    
    def _request_strategy_4(self):
        """Strategy 4: Requests with mobile user agent"""
        import requests
        
        # Create new session with mobile user agent
        session = requests.Session()
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        })
        
        response = session.get(self.target_url, timeout=30)
        response.raise_for_status()
        return self._process_response(response)
    
    def _process_response(self, response):
        """Process the response and extract data"""
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Try to find the element using the XPath structure
        target_element = self.find_element_by_xpath_structure(soup)
        
        if target_element:
            logger.info("Element found using XPath structure")
            # Extract price information from the target element
            price_info = self.extract_price_from_bs4_element(target_element)
            
            return {
                'success': True,
                'method': 'requests',
                'content': target_element.get_text(strip=True),
                'html': str(target_element),
                'price_info': price_info,
                'url': self.target_url
            }
        else:
            # Fallback: extract general product information
            return self.extract_product_info(soup)

    def find_element_by_xpath_structure(self, soup):
        """Find element by approximating the XPath structure"""
        try:
            # Navigate through the DOM structure based on the XPath
            # /html/body/div[2]/div[2]/div/div/div[2]/div[1]/div/div/div[2]/div[1]/div[1]/div[1]/div[1]/div/div/div/div/div[2]
            
            body = soup.find('body')
            if not body:
                return None
                
            # Navigate through the div structure
            divs = body.find_all('div', recursive=False)
            if len(divs) < 3:
                return None
                
            # div[2] (index 1)
            second_div = divs[1]
            second_level_divs = second_div.find_all('div', recursive=False)
            if len(second_level_divs) < 1:
                return None
                
            # Continue navigating through the structure
            current = second_level_divs[0]
            
            # Navigate through the remaining path
            for i in range(6):  # Based on the XPath structure
                divs_at_level = current.find_all('div', recursive=False)
                if len(divs_at_level) < 1:
                    break
                current = divs_at_level[0]
            
            # Final navigation to get the target element
            final_divs = current.find_all('div', recursive=False)
            if len(final_divs) >= 2:
                return final_divs[1]  # div[2] in the XPath
                
            return current
            
        except Exception as e:
            logger.error(f"Error navigating XPath structure: {e}")
            return None

    def extract_product_info(self, soup):
        """Extract general product information as fallback"""
        try:
            product_info = {}
            
            # Extract title
            title_selectors = [
                'h1', 'h2', '.product-title', '.title', '[data-testid="product-title"]'
            ]
            for selector in title_selectors:
                title_elem = soup.select_one(selector)
                if title_elem:
                    product_info['title'] = title_elem.get_text(strip=True)
                    break
            
            # Extract price with comprehensive selectors
            price_selectors = [
                '.price', '.product-price', '[data-testid="price"]', '.amount',
                '.cost', '.total', '.fare', '.fee', '.booking-price',
                '.product-cost', '.item-price', '.tour-price', '.pass-price',
                '[class*="price"]', '[class*="cost"]', '[class*="amount"]',
                '[id*="price"]', '[id*="cost"]', '[id*="amount"]',
                '.booking-bar .price', '.product-info .price', '.ticket-price'
            ]
            
            for selector in price_selectors:
                price_elem = soup.select_one(selector)
                if price_elem:
                    price_text = price_elem.get_text(strip=True)
                    if price_text and any(char.isdigit() for char in price_text):
                        product_info['price'] = price_text
                        logger.info(f"Found price with selector: {selector}")
                        break
            
            # If no price found with selectors, search for currency symbols in text
            if 'price' not in product_info:
                import re
                # Look for currency patterns in the entire page
                currency_patterns = [
                    r'[\$€£¥₹]\s*[\d,]+\.?\d*',  # Currency symbols
                    r'[\d,]+\.?\d*\s*[\$€£¥₹]',  # Number + currency
                    r'USD\s*[\d,]+\.?\d*',        # USD format
                    r'TWD\s*[\d,]+\.?\d*',       # TWD format
                    r'THB\s*[\d,]+\.?\d*',       # THB format
                    r'JPY\s*[\d,]+\.?\d*',       # JPY format
                ]
                
                page_text = soup.get_text()
                for pattern in currency_patterns:
                    matches = re.findall(pattern, page_text, re.IGNORECASE)
                    if matches:
                        product_info['price'] = matches[0]
                        logger.info(f"Found price with regex pattern: {matches[0]}")
                        break
            
            # Extract description
            desc_selectors = [
                '.description', '.product-description', '.content', 'p'
            ]
            for selector in desc_selectors:
                desc_elem = soup.select_one(selector)
                if desc_elem:
                    product_info['description'] = desc_elem.get_text(strip=True)
                    break
            
            # Extract images
            images = []
            img_elements = soup.find_all('img')
            for img in img_elements:
                src = img.get('src') or img.get('data-src')
                if src:
                    images.append(urljoin(self.base_url, src))
            product_info['images'] = images
            
            return {
                'success': True,
                'method': 'requests_fallback',
                'product_info': product_info,
                'url': self.target_url
            }
            
        except Exception as e:
            logger.error(f"Error extracting product info: {e}")
            return {'success': False, 'error': str(e), 'method': 'requests_fallback'}

    def extract_price_from_bs4_element(self, element):
        """Extract price information from BeautifulSoup element"""
        try:
            price_info = {
                'raw_text': element.get_text(strip=True),
                'formatted_price': None,
                'currency': None,
                'numeric_price': None
            }
            
            # Clean and extract price from text
            text = element.get_text(strip=True)
            
            # Look for common price patterns
            import re
            
            # Pattern 1: Currency symbol + number (e.g., $100, €50, ¥1000)
            currency_patterns = [
                r'[\$€£¥₹]\s*[\d,]+\.?\d*',  # Currency symbols
                r'[\d,]+\.?\d*\s*[\$€£¥₹]',  # Number + currency
                r'USD\s*[\d,]+\.?\d*',        # USD format
                r'TWD\s*[\d,]+\.?\d*',       # TWD format
                r'THB\s*[\d,]+\.?\d*',       # THB format
            ]
            
            for pattern in currency_patterns:
                matches = re.findall(pattern, text, re.IGNORECASE)
                if matches:
                    price_info['formatted_price'] = matches[0]
                    # Extract currency
                    if '$' in matches[0]:
                        price_info['currency'] = 'USD'
                    elif '€' in matches[0]:
                        price_info['currency'] = 'EUR'
                    elif '¥' in matches[0]:
                        price_info['currency'] = 'JPY'
                    elif 'TWD' in matches[0].upper():
                        price_info['currency'] = 'TWD'
                    elif 'THB' in matches[0].upper():
                        price_info['currency'] = 'THB'
                    break
            
            # Extract numeric value
            numeric_match = re.search(r'[\d,]+\.?\d*', text)
            if numeric_match:
                numeric_str = numeric_match.group().replace(',', '')
                try:
                    price_info['numeric_price'] = float(numeric_str)
                except ValueError:
                    pass
            
            # If no currency pattern found, try to find any number
            if not price_info['formatted_price'] and numeric_match:
                price_info['formatted_price'] = numeric_match.group()
            
            return price_info
            
        except Exception as e:
            logger.error(f"Error extracting price from BS4 element: {e}")
            return {
                'raw_text': element.get_text(strip=True) if element else '',
                'formatted_price': None,
                'currency': None,
                'numeric_price': None,
                'error': str(e)
            }

    def scrape_with_selenium(self):
        """Scrape using Selenium for JavaScript-heavy content"""
        try:
            from selenium import webdriver
            from selenium.webdriver.common.by import By
            from selenium.webdriver.chrome.options import Options
            from selenium.webdriver.support.ui import WebDriverWait
            from selenium.webdriver.support import expected_conditions as EC
            from selenium.common.exceptions import TimeoutException, NoSuchElementException
            import shutil
            
            # Check for Chrome binary on Ubuntu server
            chrome_paths = [
                '/usr/bin/google-chrome',
                '/usr/bin/google-chrome-stable', 
                '/usr/bin/chromium-browser',
                '/usr/bin/chromium',
                '/snap/bin/chromium',
                '/opt/google/chrome/chrome'
            ]
            
            chrome_binary = None
            for path in chrome_paths:
                if shutil.which(path) or os.path.exists(path):
                    chrome_binary = path
                    logger.info(f"Found Chrome binary at: {chrome_binary}")
                    break
            
            if not chrome_binary:
                logger.warning("Chrome binary not found. Will try to use system default.")
            
            # Setup Chrome options for server environment
            chrome_options = Options()
            chrome_options.add_argument('--headless')  # Use headless for server
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--disable-gpu')
            chrome_options.add_argument('--disable-blink-features=AutomationControlled')
            chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
            chrome_options.add_experimental_option('useAutomationExtension', False)
            chrome_options.add_argument('--disable-extensions')
            chrome_options.add_argument('--disable-plugins')
            chrome_options.add_argument('--disable-images')  # Faster loading
            chrome_options.add_argument('--window-size=1920,1080')
            chrome_options.add_argument(f'--user-agent={self.headers["User-Agent"]}')
            
            # Set Chrome binary location if found
            if chrome_binary:
                chrome_options.binary_location = chrome_binary
            
            driver = webdriver.Chrome(options=chrome_options)
            
            # Execute script to remove webdriver property
            driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            
            try:
                logger.info(f"Scraping with Selenium: {self.target_url}")
                driver.get(self.target_url)
                
                # Wait for page to load
                WebDriverWait(driver, 15).until(
                    EC.presence_of_element_located((By.TAG_NAME, "body"))
                )
                
                # Add human-like delay
                time.sleep(3)
                
                # Scroll down a bit to simulate human behavior
                driver.execute_script("window.scrollTo(0, 500);")
                time.sleep(2)
                
                # Try to find element using multiple XPath targets
                element_found = False
                price_info = None
                content = ""
                html = ""
                used_xpath = ""
                
                for i, xpath in enumerate(self.xpath_targets):
                    try:
                        logger.info(f"Trying XPath {i+1}/{len(self.xpath_targets)}: {xpath}")
                        element = driver.find_element(By.XPATH, xpath)
                        content = element.text
                        html = element.get_attribute('outerHTML')
                        used_xpath = xpath
                        
                        # Extract price information specifically
                        price_info = self.extract_price_from_element(element)
                        element_found = True
                        logger.info(f"✅ Element found with XPath {i+1}")
                        break
                        
                    except NoSuchElementException:
                        logger.info(f"❌ XPath {i+1} not found, trying next...")
                        continue
                
                if element_found:
                    return {
                        'success': True,
                        'method': 'selenium',
                        'content': content,
                        'html': html,
                        'price_info': price_info,
                        'used_xpath': used_xpath,
                        'url': self.target_url
                    }
                else:
                    # Fallback: extract general information
                    logger.info("No XPath targets found, using fallback method")
                    return self.extract_with_selenium_fallback(driver)
                    
            finally:
                # Close browser automatically after extraction
                driver.quit()
                print("\n🌐 Browser closed automatically after price extraction")
                
        except ImportError:
            logger.warning("Selenium not available. Install with: pip install selenium")
            return {'success': False, 'error': 'Selenium not installed', 'method': 'selenium'}
        except Exception as e:
            logger.error(f"Selenium scraping failed: {e}")
            return {'success': False, 'error': str(e), 'method': 'selenium'}

    def extract_with_selenium_fallback(self, driver):
        """Extract information using Selenium fallback methods"""
        try:
            # Get page title
            title = driver.title
            
            # Try to find common product elements
            product_info = {'title': title}
            
            # Look for price elements
            price_selectors = [
                "//*[contains(@class, 'price')]",
                "//*[contains(@class, 'amount')]",
                "//*[contains(text(), '$')]"
            ]
            
            for selector in price_selectors:
                try:
                    price_elem = driver.find_element(By.XPATH, selector)
                    product_info['price'] = price_elem.text
                    break
                except NoSuchElementException:
                    continue
            
            # Get all text content
            body = driver.find_element(By.TAG_NAME, "body")
            content = body.text
            
            return {
                'success': True,
                'method': 'selenium_fallback',
                'content': content,
                'product_info': product_info,
                'url': self.target_url
            }
            
        except Exception as e:
            logger.error(f"Selenium fallback failed: {e}")
            return {'success': False, 'error': str(e), 'method': 'selenium_fallback'}

    def extract_price_from_element(self, element):
        """Extract price information from the target element"""
        try:
            price_info = {
                'raw_text': element.text.strip(),
                'formatted_price': None,
                'currency': None,
                'numeric_price': None
            }
            
            # Clean and extract price from text
            text = element.text.strip()
            
            # Look for common price patterns
            import re
            
            # Pattern 1: Currency symbol + number (e.g., $100, €50, ¥1000)
            currency_patterns = [
                r'[\$€£¥₹]\s*[\d,]+\.?\d*',  # Currency symbols
                r'[\d,]+\.?\d*\s*[\$€£¥₹]',  # Number + currency
                r'USD\s*[\d,]+\.?\d*',        # USD format
                r'TWD\s*[\d,]+\.?\d*',       # TWD format
                r'THB\s*[\d,]+\.?\d*',       # THB format
            ]
            
            for pattern in currency_patterns:
                matches = re.findall(pattern, text, re.IGNORECASE)
                if matches:
                    price_info['formatted_price'] = matches[0]
                    # Extract currency
                    if '$' in matches[0]:
                        price_info['currency'] = 'USD'
                    elif '€' in matches[0]:
                        price_info['currency'] = 'EUR'
                    elif '¥' in matches[0]:
                        price_info['currency'] = 'JPY'
                    elif 'TWD' in matches[0].upper():
                        price_info['currency'] = 'TWD'
                    elif 'THB' in matches[0].upper():
                        price_info['currency'] = 'THB'
                    break
            
            # Extract numeric value
            numeric_match = re.search(r'[\d,]+\.?\d*', text)
            if numeric_match:
                numeric_str = numeric_match.group().replace(',', '')
                try:
                    price_info['numeric_price'] = float(numeric_str)
                except ValueError:
                    pass
            
            # If no currency pattern found, try to find any number
            if not price_info['formatted_price'] and numeric_match:
                price_info['formatted_price'] = numeric_match.group()
            
            return price_info
            
        except Exception as e:
            logger.error(f"Error extracting price: {e}")
            return {
                'raw_text': element.text.strip() if element else '',
                'formatted_price': None,
                'currency': None,
                'numeric_price': None,
                'error': str(e)
            }

    def save_results(self, results, filename='kkday_scrape_results.json'):
        """Save scraping results to JSON file"""
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2, ensure_ascii=False)
            logger.info(f"Results saved to {filename}")
        except Exception as e:
            logger.error(f"Failed to save results: {e}")


def main():
    """Main function to run the scraper"""
    scraper = KKdayScraper()
    
    print("🚀 Starting KKday Web Scraping...")
    print(f"Target URL: {scraper.target_url}")
    print(f"XPath Targets:")
    for i, xpath in enumerate(scraper.xpath_targets, 1):
        print(f"  {i}. {xpath}")
    print("-" * 50)
    
    # Try Selenium first (visible browser) to bypass 403 errors
    print("🌐 Opening browser and attempting scraping with Selenium...")
    print("📝 Browser will close automatically after price extraction")
    results = scraper.scrape_with_selenium()
    
    if results['success']:
        print("✅ Selenium scraping successful!")
        print(f"Content preview: {results.get('content', '')[:200]}...")
    else:
        print(f"❌ Selenium scraping failed: {results.get('error', 'Unknown error')}")
        
        # Try requests as fallback
        print("\n📡 Attempting scraping with requests as fallback...")
        requests_results = scraper.scrape_with_requests()
        
        if requests_results['success']:
            print("✅ Requests scraping successful!")
            results = requests_results
        else:
            print(f"❌ Requests scraping failed: {requests_results.get('error', 'Unknown error')}")
    
    # Save results
    scraper.save_results(results)
    
    # Print summary
    print("\n" + "="*50)
    print("📊 SCRAPING SUMMARY")
    print("="*50)
    print(f"Success: {results.get('success', False)}")
    print(f"Method: {results.get('method', 'unknown')}")
    print(f"URL: {results.get('url', 'N/A')}")
    
    if results.get('success'):
        if 'content' in results:
            print(f"Content length: {len(results['content'])} characters")
        if 'product_info' in results:
            print(f"Product info extracted: {list(results['product_info'].keys())}")
        
        # Display which XPath was successful
        if 'used_xpath' in results:
            print(f"\n🎯 Successful XPath: {results['used_xpath']}")
        
        # Display price information prominently
        price_found = False
        
        # Check for price_info (from Selenium)
        if 'price_info' in results and results['price_info']:
            price_info = results['price_info']
            print("\n" + "="*30)
            print("💰 PRICE INFORMATION")
            print("="*30)
            print(f"Raw text: {price_info.get('raw_text', 'N/A')}")
            if price_info.get('formatted_price'):
                print(f"Formatted price: {price_info['formatted_price']}")
            if price_info.get('currency'):
                print(f"Currency: {price_info['currency']}")
            if price_info.get('numeric_price'):
                print(f"Numeric value: {price_info['numeric_price']}")
            if price_info.get('error'):
                print(f"Price extraction error: {price_info['error']}")
            price_found = True
        
        # Check for price in product_info (from requests fallback)
        elif 'product_info' in results and results['product_info'].get('price'):
            price = results['product_info']['price']
            print("\n" + "="*30)
            print("💰 PRICE INFORMATION")
            print("="*30)
            print(f"Price: {price}")
            price_found = True
        
        if not price_found:
            print("\n⚠️  No price information found")
    
    if 'error' in results:
        print(f"Error: {results['error']}")
    
    print("\n🎉 Scraping completed!")
    print("💡 Browser closed automatically after price extraction.")

if __name__ == "__main__":
    main()
