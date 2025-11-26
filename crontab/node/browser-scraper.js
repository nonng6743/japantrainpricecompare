const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class KlookBrowserScraper {
    constructor() {
        this.baseURL = 'https://www.klook.com';
    }

    async scrapePackageOptions(activityId = 1420) {
        let browser;
        try {
            console.log(`Starting browser scrape for activity ID: ${activityId}`);
            
            // Launch browser with stealth options
            browser = await puppeteer.launch({
                headless: false, // Set to true for production
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    '--disable-blink-features=AutomationControlled'
                ]
            });

            const page = await browser.newPage();
            
            // Remove webdriver property to avoid detection
            await page.evaluateOnNewDocument(() => {
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined,
                });
            });

            // Set user agent and viewport
            await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36');
            await page.setViewport({ width: 1366, height: 768 });

            // Set extra headers
            await page.setExtraHTTPHeaders({
                'accept-language': 'en_BS',
                'accept-encoding': 'gzip, deflate, br, zstd',
                'cache-control': 'no-cache',
                'currency': 'THB',
                'x-klook-market': 'global',
                'x-klook-traffic-channel': 'google_seo',
                'x-klook-user-residence': '4_TH',
                'x-platform': 'desktop'
            });

            // Navigate to the main Klook page first to establish session
            console.log('Navigating to Klook homepage to establish session...');
            await page.goto('https://www.klook.com', { waitUntil: 'networkidle2', timeout: 30000 });
            await page.waitForTimeout(2000);

            // Navigate to the activity page
            const activityUrl = `https://www.klook.com/activity/${activityId}-7-day-whole-japan-rail-pass-jr-pass/`;
            console.log('Navigating to activity page...');
            await page.goto(activityUrl, { waitUntil: 'networkidle2', timeout: 30000 });

            // Wait for page to fully load and check for CAPTCHA
            await page.waitForTimeout(5000);
            
            // Check if we're redirected to CAPTCHA page
            const currentUrl = page.url();
            if (currentUrl.includes('captcha') || currentUrl.includes('interstitial')) {
                console.log('⚠️  CAPTCHA detected! Waiting for manual intervention...');
                console.log('Please solve the CAPTCHA in the browser window and press Enter to continue...');
                
                // Wait for user to solve CAPTCHA
                await new Promise((resolve) => {
                    process.stdin.once('data', () => {
                        resolve();
                    });
                });
                
                // Navigate back to activity page
                await page.goto(activityUrl, { waitUntil: 'networkidle2', timeout: 30000 });
                await page.waitForTimeout(3000);
            }

            // Monitor network requests to catch the API call
            let apiResponse = null;
            const apiUrl = `${this.baseURL}/v1/experiencesrv/activity/package_service/get_package_option_sources`;
            
            // Set up request interception
            await page.setRequestInterception(true);
            page.on('request', (request) => {
                request.continue();
            });

            page.on('response', async (response) => {
                if (response.url().includes('get_package_option_sources')) {
                    console.log('API response detected!');
                    try {
                        const data = await response.json();
                        apiResponse = { success: true, data };
                    } catch (error) {
                        apiResponse = { success: false, error: error.message };
                    }
                }
            });

            // Try to trigger the API call by interacting with the page
            console.log('Looking for elements to trigger API call...');
            
            // Look for buttons or elements that might trigger the API call
            try {
                // Try clicking on date selectors or other interactive elements
                const dateSelectors = await page.$$('[data-testid*="date"], [class*="date"], [class*="calendar"]');
                if (dateSelectors.length > 0) {
                    console.log('Found date selectors, clicking...');
                    await dateSelectors[0].click();
                    await page.waitForTimeout(2000);
                }

                // Try clicking on package options
                const packageOptions = await page.$$('[data-testid*="package"], [class*="package"], [class*="option"]');
                if (packageOptions.length > 0) {
                    console.log('Found package options, clicking...');
                    await packageOptions[0].click();
                    await page.waitForTimeout(2000);
                }

                // Try scrolling to trigger lazy loading
                await page.evaluate(() => {
                    window.scrollTo(0, document.body.scrollHeight);
                });
                await page.waitForTimeout(2000);

            } catch (error) {
                console.log('No interactive elements found, trying direct API call...');
            }

            // If no API response was captured through page interaction, try direct call
            if (!apiResponse) {
                console.log('Making direct API request with browser context...');
                
                const params = {
                    activity_id: activityId,
                    preview: '',
                    translation: '',
                    partner_type: '',
                    from_b: '',
                    sales_channel: 'customer',
                    package_option_type: 'package_option',
                    k_lang: 'en_BS',
                    k_currency: 'THB',
                    preview: '0'
                };

                apiResponse = await page.evaluate(async (url, params) => {
                    const queryString = new URLSearchParams(params).toString();
                    const fullUrl = `${url}?${queryString}`;
                    
                    try {
                        const response = await fetch(fullUrl, {
                            method: 'GET',
                            headers: {
                                'accept': 'application/json, text/plain, */*',
                                'accept-language': 'en_BS',
                                'cache-control': 'no-cache',
                                'currency': 'THB',
                                'referer': window.location.href,
                                'sec-ch-device-memory': '8',
                                'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
                                'sec-ch-ua-arch': '"arm"',
                                'sec-ch-ua-mobile': '?0',
                                'sec-ch-ua-platform': '"macOS"',
                                'sec-fetch-dest': 'empty',
                                'sec-fetch-mode': 'cors',
                                'sec-fetch-site': 'same-origin',
                                'x-klook-host': 'www.klook.com',
                                'x-klook-market': 'global',
                                'x-klook-traffic-channel': 'google_seo',
                                'x-klook-user-residence': '4_TH',
                                'x-platform': 'desktop',
                                'x-requested-with': 'XMLHttpRequest'
                            }
                        });

                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }

                        const data = await response.json();
                        return { success: true, data };
                    } catch (error) {
                        return { success: false, error: error.message };
                    }
                }, apiUrl, params);
            }

            const response = apiResponse;

            if (!response.success) {
                throw new Error(`API request failed: ${response.error}`);
            }

            console.log('API request successful!');
            console.log(`Data keys: ${Object.keys(response.data).join(', ')}`);

            // Save raw response
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `klook_browser_data_${activityId}_${timestamp}.json`;
            const filepath = path.join(__dirname, filename);
            
            fs.writeFileSync(filepath, JSON.stringify(response.data, null, 2));
            console.log(`Data saved to: ${filepath}`);

            // Parse and display key information
            this.parseAndDisplayData(response.data);

            return response.data;

        } catch (error) {
            console.error('Error scraping Klook data with browser:', error.message);
            throw error;
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    parseAndDisplayData(data) {
        console.log('\n=== PARSED DATA ===');
        
        try {
            // Display basic structure
            if (data.result) {
                console.log('Result found:', typeof data.result);
                if (Array.isArray(data.result)) {
                    console.log(`Number of results: ${data.result.length}`);
                }
            }

            // Look for package options
            if (data.result && Array.isArray(data.result)) {
                data.result.forEach((item, index) => {
                    console.log(`\n--- Package Option ${index + 1} ---`);
                    if (item.title) console.log(`Title: ${item.title}`);
                    if (item.price) console.log(`Price: ${item.price}`);
                    if (item.currency) console.log(`Currency: ${item.currency}`);
                    if (item.description) console.log(`Description: ${item.description.substring(0, 100)}...`);
                });
            }

            // Look for pricing information
            if (data.pricing) {
                console.log('\n--- Pricing Information ---');
                console.log(JSON.stringify(data.pricing, null, 2));
            }

        } catch (parseError) {
            console.error('Error parsing data:', parseError.message);
        }
    }

    async scrapeMultipleActivities(activityIds) {
        const results = [];
        
        for (const activityId of activityIds) {
            try {
                console.log(`\n=== Scraping Activity ${activityId} with Browser ===`);
                const data = await this.scrapePackageOptions(activityId);
                results.push({
                    activityId,
                    success: true,
                    data
                });
                
                // Add delay between requests to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 5000));
                
            } catch (error) {
                console.error(`Failed to scrape activity ${activityId}:`, error.message);
                results.push({
                    activityId,
                    success: false,
                    error: error.message
                });
            }
        }
        
        return results;
    }
}

// Main execution
async function main() {
    const scraper = new KlookBrowserScraper();
    
    try {
        // Single activity scrape
        console.log('Starting Klook browser scraper...');
        await scraper.scrapePackageOptions(1420);
        
        // Uncomment to scrape multiple activities
        // const activityIds = [1420, 1421, 1422]; // Add more activity IDs as needed
        // await scraper.scrapeMultipleActivities(activityIds);
        
    } catch (error) {
        console.error('Main execution failed:', error.message);
        process.exit(1);
    }
}

// Run the scraper
if (require.main === module) {
    main();
}

module.exports = KlookBrowserScraper;
