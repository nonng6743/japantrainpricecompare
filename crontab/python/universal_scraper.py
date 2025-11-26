#!/usr/bin/env python3
"""
Universal Web Scraper Module
A module for web scraping using both Selenium and Requests methods
"""

import json
import re
from typing import Dict, Any, Optional
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import requests
from bs4 import BeautifulSoup
import time


class UniversalWebScraper:
    """
    A universal web scraper that supports both Selenium and Requests methods
    """
    
    def __init__(self, config_path: str = 'scraping_config.json'):
        """
        Initialize the scraper with a configuration file
        
        Args:
            config_path: Path to the configuration JSON file
        """
        self.config_path = config_path
        self.config = self._load_config()
        self.driver = None
        
    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from JSON file"""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            # Return default config if file doesn't exist
            return {
                'kkday': {
                    'headers': {},
                    'selectors': {}
                },
                'klook': {
                    'headers': {},
                    'selectors': {}
                }
            }
        except json.JSONDecodeError:
            return {}
    
    def _get_website_config(self, website: str) -> Dict[str, Any]:
        """Get configuration for a specific website"""
        return self.config.get(website, {})
    
    def scrape_with_selenium(self, url: str, website: str = 'generic', headless: bool = False) -> Dict[str, Any]:
        """
        Scrape a website using Selenium
        
        Args:
            url: URL to scrape
            website: Website name (kkday, klook, etc.)
            headless: Run browser in headless mode
            
        Returns:
            Dictionary with success, title, and data keys
        """
        try:
            # Setup Chrome options
            chrome_options = Options()
            if headless:
                chrome_options.add_argument('--headless')
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--disable-blink-features=AutomationControlled')
            chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
            chrome_options.add_experimental_option('useAutomationExtension', False)
            chrome_options.add_argument('--window-size=1920,1080')
            chrome_options.add_argument('--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36')
            
            # Initialize WebDriver
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            
            # Navigate to URL
            self.driver.get(url)
            
            # Wait for page to load
            WebDriverWait(self.driver, 20).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # Wait a bit for dynamic content to load
            time.sleep(2)
            
            # Try to find and click the button at XPath
            try:
                button_xpath = "//*[@id='group-swiper-listItem-139519']"
                button_element = WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.XPATH, button_xpath))
                )
                
                # Scroll to element to make it visible
                self.driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", button_element)
                time.sleep(1)  # Wait for scroll to complete
                
                # Click the button
                button_element.click()
                print(f"✅ Clicked button at XPath: {button_xpath}")
                time.sleep(2)  # Wait for any actions triggered by the click
                
            except Exception as click_error:
                print(f"⚠️ Could not click button at XPath: {click_error}")
                # Continue execution even if button click fails
            
            # Get page title
            title = self.driver.title
            
            # Extract data
            page_source = self.driver.page_source
            soup = BeautifulSoup(page_source, 'html.parser')
            
            # Try to extract price information
            price = self._extract_price_from_soup(soup)
            
            # Monitor network requests (basic implementation)
            captured_headers = self._get_captured_headers()
            
            data = {
                'price': price,
                'captured_headers': captured_headers,
                'url': url,
                'website': website
            }
            
            return {
                'success': True,
                'title': title,
                'data': data
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'title': None,
                'data': {}
            }
        finally:
            if self.driver:
                self.driver.quit()
                self.driver = None
    
    def scrape_with_requests(self, url: str, website: str = 'generic') -> Dict[str, Any]:
        """
        Scrape a website using Requests library
        
        Args:
            url: URL to scrape
            website: Website name (kkday, klook, etc.)
            
        Returns:
            Dictionary with success, title, and data keys
        """
        try:
            # Get website-specific headers
            website_config = self._get_website_config(website)
            headers = website_config.get('headers', {})
            
            # Default headers
            default_headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            }
            default_headers.update(headers)
            
            # Make request
            response = requests.get(url, headers=default_headers, timeout=30)
            response.raise_for_status()
            
            # Parse HTML
            soup = BeautifulSoup(response.text, 'html.parser')
            title = soup.find('title')
            title_text = title.get_text() if title else 'No title found'
            
            # Extract data
            price = self._extract_price_from_soup(soup)
            
            # Get response headers
            captured_headers = dict(response.headers)
            
            data = {
                'price': price,
                'captured_headers': captured_headers,
                'url': url,
                'website': website
            }
            
            return {
                'success': True,
                'title': title_text,
                'data': data
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'title': None,
                'data': {}
            }
    
    def _extract_price_from_soup(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract price information from BeautifulSoup object"""
        # Try common price selectors
        price_selectors = [
            {'class': 'price'},
            {'class': 'amount'},
            {'data-price': True},
            {'id': re.compile('price', re.I)},
        ]
        
        for selector in price_selectors:
            price_elem = soup.find(attrs=selector)
            if price_elem:
                price_text = price_elem.get_text(strip=True)
                if price_text:
                    return price_text
        
        # Try to find price patterns in text
        text = soup.get_text()
        price_patterns = [
            r'฿\s*([\d,]+)',
            r'\$\s*([\d,]+)',
            r'([\d,]+)\s*บาท',
        ]
        
        for pattern in price_patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(0)
        
        return None
    
    def _get_captured_headers(self) -> Dict[str, str]:
        """Get headers from the current request (placeholder for network monitoring)"""
        # This is a placeholder - in a full implementation, you'd monitor network requests
        return {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        }
    
    def extract_price_info(self, price: Optional[str]) -> Dict[str, Any]:
        """
        Extract structured price information from price text
        
        Args:
            price: Price text to parse
            
        Returns:
            Dictionary with raw_text, formatted_price, currency, and numeric_price
        """
        if not price:
            return {
                'raw_text': '',
                'formatted_price': None,
                'currency': None,
                'numeric_price': None
            }
        
        raw_text = price.strip()
        
        # Extract currency
        currency = None
        if '฿' in raw_text or 'บาท' in raw_text:
            currency = 'THB'
        elif '$' in raw_text:
            currency = 'USD'
        elif '¥' in raw_text or '円' in raw_text:
            currency = 'JPY'
        
        # Extract numeric price
        numeric_price = None
        numbers = re.findall(r'[\d,]+\.?\d*', raw_text)
        if numbers:
            # Take the first number found
            numeric_str = numbers[0].replace(',', '')
            try:
                numeric_price = float(numeric_str)
            except ValueError:
                pass
        
        # Format price
        formatted_price = raw_text
        
        return {
            'raw_text': raw_text,
            'formatted_price': formatted_price,
            'currency': currency,
            'numeric_price': numeric_price
        }

