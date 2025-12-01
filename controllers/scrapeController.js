import { scrapeService } from '../services/scrapeService.js';
import { spawn } from 'child_process';
import axios from 'axios';
import https from 'https';
import { chromium } from 'playwright';
export const scrapeController = {
  // POST /api/scrape - Scrape both KKDay and KLook URLs

  async scrapeBothloop(req, res) {
    const python = spawn('python', ['crontab/python/index.py', 'https://www.kkday.com/th/product/158964?qs=JR+TOKYO+Wide+Pass', 'world']);

    let result = '';
    python.stdout.on('data', (data) => {
      result += data.toString();
    });

    python.stderr.on('data', (data) => {
      console.error(`Error: ${data}`);
    });

    python.on('close', (code) => {
      console.log(`Python exited with code ${code}`);
      res.send(`Result from Python: ${result}`);
    });
  },

  async scrapeBoth(req, res) {
    const {
      no_product,
      name_product,
      price_product,
      detail,
      url_kkday,
      packages_kkday,
      url_klook,
      packages_klook
    } = req.body;

    // Check if both URLs are provided
    if (!url_kkday || !url_klook) {
      return res.status(400).json({
        success: false,
        error: 'Both url_kkday and url_klook are required.'
      });
    }

    console.log('📡 API: /api/scrape called with:', req.body);

    try {
      // Scrape both URLs
      const [resultKKDay, resultKLook] = await Promise.all([
        scrapeService.scrapeWithOCRKday(packages_kkday, url_kkday),
        scrapeService.scrapeWithOCRKlook(packages_klook, url_klook)
      ]);

      // Create scrape data using service
      const scrapeData = {
        no_product,
        name_product,
        price_product,
        detail,
        url_kkday,
        packages_kkday: resultKKDay,
        url_klook,
        packages_klook: resultKLook
      };

      const savedData = await scrapeService.createScrapeData(scrapeData);
      console.log('💾 Data saved to MongoDB:', savedData._id);

      // Send the result back to the client
      res.json({
        success: true,
        data: savedData
      });
    } catch (error) {
      console.error('❌ Error during scraping:', error);
      
      // Check if it's a duplicate error
      if (error.duplicate) {
        return res.status(409).json({
          success: false,
          error: error.message,
          duplicate: true,
          existingId: error.existingId
        });
      }
      
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // POST /api/scrape-price - Scrape prices after ฿ symbol
  async scrapePrice(req, res) {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    console.log('📡 API: /api/scrape-price called with URL:', url);

    try {
      const result = await scrapeService.scrapePriceWithOCR(url);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('❌ Error during price scraping:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // GET /api/scrape - Get all scrape data
  async getAllScrapeData(req, res) {
    try {
      const { page = 1, limit } = req.query;
      // If limit is not provided or is 0 or "all", get all data
      const limitValue = limit === undefined || limit === '0' || limit === 'all' 
        ? null 
        : parseInt(limit);
      const result = await scrapeService.getAllScrapeData(parseInt(page), limitValue);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // GET /api/scrape/:id - Get scrape data by ID
  async getScrapeDataById(req, res) {
    try {
      const data = await scrapeService.getScrapeDataById(req.params.id);
      res.json({ success: true, data });
    } catch (error) {
      if (error.message === 'Scrape data not found') {
        res.status(404).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  },

  // PUT /api/scrape/:id - Update scrape data by ID (Full Update)
  async updateScrapeData(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      console.log('📡 API: PUT /api/scrape/:id called with ID:', id);
      console.log('📡 Update data:', updateData);

      const updatedData = await scrapeService.updateScrapeData(id, updateData);
      console.log('✅ Data updated successfully:', updatedData._id);

      res.json({
        success: true,
        message: 'Scrape data updated successfully',
        data: updatedData
      });
    } catch (error) {
      console.error('❌ Error updating scrape data:', error);
      if (error.message.includes('Missing required fields') || error.message === 'Scrape data not found') {
        res.status(400).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  },

  // PATCH /api/scrape/:id - Partial update scrape data by ID
  async patchScrapeData(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      console.log('📡 API: PATCH /api/scrape/:id called with ID:', id);
      console.log('📡 Partial update data:', updateData);

      const updatedData = await scrapeService.patchScrapeData(id, updateData);
      console.log('✅ Data partially updated successfully:', updatedData._id);

      res.json({
        success: true,
        message: 'Scrape data partially updated successfully',
        data: updatedData
      });
    } catch (error) {
      console.error('❌ Error partially updating scrape data:', error);
      if (error.message === 'Scrape data not found') {
        res.status(404).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  },

  // DELETE /api/scrape/:id - Delete scrape data by ID
  async deleteScrapeData(req, res) {
    try {
      const { id } = req.params;

      console.log('📡 API: DELETE /api/scrape/:id called with ID:', id);

      const deletedData = await scrapeService.deleteScrapeData(id);
      console.log('✅ Data deleted successfully:', deletedData._id);

      res.json({
        success: true,
        message: 'Scrape data deleted successfully',
        data: deletedData
      });
    } catch (error) {
      console.error('❌ Error deleting scrape data:', error);
      if (error.message === 'Scrape data not found') {
        res.status(404).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  },

  // GET /api/scrape/search - Search scrape data
  async searchScrapeData(req, res) {
    try {
      const { page = 1, limit = 10, ...searchCriteria } = req.query;

      console.log('📡 API: GET /api/scrape/search called with:', searchCriteria);

      const result = await scrapeService.searchScrapeData(searchCriteria, parseInt(page), parseInt(limit));

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('❌ Error searching scrape data:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // GET /api/scrape/stats - Get scrape data statistics
  async getScrapeDataStats(req, res) {
    try {
      console.log('📡 API: GET /api/scrape/stats called');

      const stats = await scrapeService.getScrapeDataStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('❌ Error getting statistics:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // PUT /api/scrape/bulk - Bulk update scrape data
  async bulkUpdateScrapeData(req, res) {
    try {
      const { updateCriteria, updateData } = req.body;

      console.log('📡 API: PUT /api/scrape/bulk called');
      console.log('📡 Update criteria:', updateCriteria);
      console.log('📡 Update data:', updateData);

      if (!updateCriteria || !updateData) {
        return res.status(400).json({
          success: false,
          error: 'updateCriteria and updateData are required'
        });
      }

      const result = await scrapeService.bulkUpdateScrapeData(updateCriteria, updateData);

      res.json({
        success: true,
        message: `Bulk updated ${result.modifiedCount} records`,
        data: result
      });
    } catch (error) {
      console.error('❌ Error bulk updating scrape data:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  

  async getKlook(req, res) {
    const URL = 'https://www.klook.com/v1/experiencesrv/order/settlement_service/pre_settlement';

    const {
      page_from = 2,
      arrangement_id = 1762819200564715,
      sku_list = [
        { sku_id: 828952039775, quantity: 1 },
        { sku_id: 828952039776, quantity: 1 }
      ]
    } = req.body || {};

    const payload = {
      page_from,
      arrangement_id,
      sku_list
    };

    try {
      // Get headers from remote API
      const headerRes = await axios.get("https://api.hellopassxyz.com/api/header-setting", { timeout: 5000 });
      let HEADERS = {};
      if (
        headerRes &&
        headerRes.data &&
        headerRes.data.header_text
      ) {
        try {
          HEADERS = JSON.parse(headerRes.data.header_text);
        } catch (err) {
          console.error("Error parsing header_text from remote API:", err);
          return res.status(500).json({ success: false, error: "Failed to parse header_text from header-setting API" });
        }
      } else {
        return res.status(500).json({ success: false, error: "No header_text found in header-setting API" });
      }

      // Always make sure content-type is present
      if (!HEADERS['content-type']) HEADERS['content-type'] = 'application/json';

      const response = await axios.post(URL, payload, { headers: HEADERS, timeout: 20000 });
      res.json({ success: true, data: response.data });
    } catch (error) {
      if (error.response) {
        console.error('Error response data:', error.response.data);
        return res.status(error.response.status || 500).json({
          success: false,
          error: error.response.data
        });
      }

      if (error.request) {
        console.error('Error request data:', error.request);
        return res.status(504).json({
          success: false,
          error: 'No response received from Klook'
        });
      }

      console.error('Error message:', error.message);
      res.status(500).json({
        success: false,
        error: error.message || 'Request failed'
      });
    }
  },

  async getKkday(req, res) {
    const {
      prodMid = '25777',
      beginDate = '2025-11-13',
      endDate = '2026-02-09',
      previewToken = '',
      useBrowser = false // Option to use Playwright browser automation
    } = req.body || {};

    // If useBrowser is true, delegate to browser method
    if (useBrowser) {
      return this.getKkdayWithBrowser(req, res);
    }

    const URL = `https://www.kkday.com/api/_nuxt/product/fetch-packages-data?prodMid=${prodMid}&previewToken=${previewToken}&beginDate=${beginDate}&endDate=${endDate}`;

    // More realistic browser headers to avoid CAPTCHA
    const HEADERS = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json, text/plain, */*",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7",
      Connection: "keep-alive",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
      "Referer": `https://www.kkday.com/th/product/${prodMid}`,
      "Origin": "https://www.kkday.com",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      "Sec-Ch-Ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"Windows"',
      country_lang: "th-th",
      lang_ui: "th",
      UD1: "Thai_TH",
      UD4: "Thai_TH",
      currency: "THB",
      market: "th",
    };

    console.log("🔄 Fetching KKDay packages...");

    try {
      const response = await axios.get(URL, {
        headers: HEADERS,
        timeout: 15000,
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        maxRedirects: 5,
        validateStatus: function (status) {
          return status >= 200 && status < 400; // Accept 2xx and 3xx
        }
      });

      // Check if response is CAPTCHA redirect
      if (response.data && typeof response.data === 'object' && response.data.url && response.data.url.includes('captcha-delivery.com')) {
        console.error("❌ CAPTCHA detected in response, trying browser method...");
        // Automatically retry with browser
        req.body.useBrowser = true;
        return this.getKkdayWithBrowser(req, res);
      }

      const payload = response.data;

      if (payload.status !== 200) {
        console.error("❌ Unexpected status in payload:", payload.status);
        return res.status(payload.status || 500).json({
          success: false,
          error: `Unexpected status: ${payload.status}`,
          data: payload
        });
      }

      const packageMap = payload?.data?.PACKAGE || {};
      if (!packageMap || Object.keys(packageMap).length === 0) {
        console.log("⚠️ No packages found in response.");
        return res.json({
          success: true,
          message: "No packages found in response",
          data: []
        });
      }

      const itemMap = payload?.data?.ITEM || {};
      const allSkuSummaries = [];

      for (const [pkgId, pkg] of Object.entries(packageMap)) {
        const itemIds = pkg.items || [];

        if (itemIds.length === 0) {
          allSkuSummaries.push({
            package_id: pkgId,
            name: pkg.name || "(no name)",
            items: [],
            message: "Package does not list any item IDs.",
          });
          continue;
        }

        for (const itemId of itemIds) {
          const item = itemMap[String(itemId)];

          if (!item) {
            allSkuSummaries.push({
              package_id: pkgId,
              name: pkg.name || "(no name)",
              item_id: itemId,
              message: "Item not found in ITEM map.",
            });
            continue;
          }

          const specsMeta = item.specs || [];
          const skus = item.skus || [];

          if (!skus.length) {
            allSkuSummaries.push({
              package_id: pkgId,
              name: pkg.name || "(no name)",
              item_id: itemId,
              message: "No SKUs found.",
            });
            continue;
          }

          if (specsMeta.length) {
            for (const sku of skus) {
              const skuId = sku.sku_oid;
              const specMap = sku.spec || {};
              const selections = [];

              for (const [spec_oid, option_id] of Object.entries(specMap)) {
                const specDef = specsMeta.find((s) => s.spec_oid === spec_oid);
                if (!specDef) continue;

                const optionDef = specDef.spec_items?.find(
                  (s) => s.spec_item_oid === option_id
                );

                const optionName = optionDef ? optionDef.name : option_id;

                selections.push({
                  spec_oid,
                  spec_title: specDef.spec_title || spec_oid,
                  option_id,
                  option_name: optionName,
                });
              }

              const price = sku.single_price?.fullday || null;

              allSkuSummaries.push({
                package_id: pkgId,
                package_name: pkg.name || "(no name)",
                item_id: item.item_oid,
                sku_id: skuId,
                price,
                selections,
              });
            }
          }
        }
      }

      res.json({
        success: true,
        data: allSkuSummaries
      });
    } catch (error) {
      // Check for CAPTCHA in error response
      if (error.response) {
        const errorData = error.response.data;
        if (errorData && typeof errorData === 'object' && errorData.url && errorData.url.includes('captcha-delivery.com')) {
          console.error("❌ CAPTCHA detected in error response, trying browser method...");
          // Automatically retry with browser
          req.body.useBrowser = true;
          return this.getKkdayWithBrowser(req, res);
        }
        
        console.error('Error response data:', errorData);
        return res.status(error.response.status || 500).json({
          success: false,
          error: errorData
        });
      }

      if (error.request) {
        console.error('Error request data:', error.request);
        return res.status(504).json({
          success: false,
          error: 'No response received from KKDay'
        });
      }

      console.error('Error message:', error.message);
      res.status(500).json({
        success: false,
        error: error.message || 'Request failed'
      });
    }
  },

  // Alternative method using Playwright to bypass CAPTCHA
  async getKkdayWithBrowser(req, res) {
    const {
      prodMid = '25777',
      beginDate = '2025-11-13',
      endDate = '2026-02-09',
      previewToken = ''
    } = req.body || {};

    const URL = `https://www.kkday.com/api/_nuxt/product/fetch-packages-data?prodMid=${prodMid}&previewToken=${previewToken}&beginDate=${beginDate}&endDate=${endDate}`;

    console.log("🔄 Fetching KKDay packages using browser automation...");

    let browser;
    try {
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
      });

      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        locale: 'th-TH',
        timezoneId: 'Asia/Bangkok',
        viewport: { width: 1920, height: 1080 },
        extraHTTPHeaders: {
          'Accept-Language': 'th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7',
          'country_lang': 'th-th',
          'lang_ui': 'th',
          'UD1': 'Thai_TH',
          'UD4': 'Thai_TH',
          'currency': 'THB',
          'market': 'th',
        }
      });

      const page = await context.newPage();
      
      // Navigate to the product page first to establish session
      await page.goto(`https://www.kkday.com/th/product/${prodMid}`, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // Wait a bit to let any scripts load
      await page.waitForTimeout(2000);

      // Now make the API request
      const response = await page.request.get(URL, {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Referer': `https://www.kkday.com/th/product/${prodMid}`,
          'Origin': 'https://www.kkday.com',
        }
      });

      const payload = await response.json();

      if (payload.status !== 200) {
        console.error("❌ Unexpected status in payload:", payload.status);
        return res.status(payload.status || 500).json({
          success: false,
          error: `Unexpected status: ${payload.status}`,
          data: payload
        });
      }

      const packageMap = payload?.data?.PACKAGE || {};
      if (!packageMap || Object.keys(packageMap).length === 0) {
        console.log("⚠️ No packages found in response.");
        return res.json({
          success: true,
          message: "No packages found in response",
          data: []
        });
      }

      const itemMap = payload?.data?.ITEM || {};
      const allSkuSummaries = [];

      for (const [pkgId, pkg] of Object.entries(packageMap)) {
        const itemIds = pkg.items || [];

        if (itemIds.length === 0) {
          allSkuSummaries.push({
            package_id: pkgId,
            name: pkg.name || "(no name)",
            items: [],
            message: "Package does not list any item IDs.",
          });
          continue;
        }

        for (const itemId of itemIds) {
          const item = itemMap[String(itemId)];

          if (!item) {
            allSkuSummaries.push({
              package_id: pkgId,
              name: pkg.name || "(no name)",
              item_id: itemId,
              message: "Item not found in ITEM map.",
            });
            continue;
          }

          const specsMeta = item.specs || [];
          const skus = item.skus || [];

          if (!skus.length) {
            allSkuSummaries.push({
              package_id: pkgId,
              name: pkg.name || "(no name)",
              item_id: itemId,
              message: "No SKUs found.",
            });
            continue;
          }

          if (specsMeta.length) {
            for (const sku of skus) {
              const skuId = sku.sku_oid;
              const specMap = sku.spec || {};
              const selections = [];

              for (const [spec_oid, option_id] of Object.entries(specMap)) {
                const specDef = specsMeta.find((s) => s.spec_oid === spec_oid);
                if (!specDef) continue;

                const optionDef = specDef.spec_items?.find(
                  (s) => s.spec_item_oid === option_id
                );

                const optionName = optionDef ? optionDef.name : option_id;

                selections.push({
                  spec_oid,
                  spec_title: specDef.spec_title || spec_oid,
                  option_id,
                  option_name: optionName,
                });
              }

              const price = sku.single_price?.fullday || null;

              allSkuSummaries.push({
                package_id: pkgId,
                package_name: pkg.name || "(no name)",
                item_id: item.item_oid,
                sku_id: skuId,
                price,
                selections,
              });
            }
          }
        }
      }

      res.json({
        success: true,
        data: allSkuSummaries
      });
    } catch (error) {
      console.error('❌ Error fetching with browser:', error.message);
      res.status(500).json({
        success: false,
        error: error.message || 'Request failed'
      });
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }


};
