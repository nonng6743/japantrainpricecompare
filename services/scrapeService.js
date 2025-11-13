import { chromium } from 'playwright';
import Tesseract from 'tesseract.js';
import { spawn } from 'child_process';
import ScrapeData from '../models/ScrapeData.js';
const SCREENSHOT_WAIT_TIME = parseInt(process.env.SCREENSHOT_WAIT_TIME) || 5000;
const OCR_LANGUAGES = process.env.OCR_LANGUAGES || 'eng+tha';

export const scrapeService = {


  async scrapeWithOCRKday(packages_kkday, url) {
    try {
      const updatedPackagesKKDay = packages_kkday; // สร้างอาร์เรย์ที่จะเก็บข้อมูลที่อัปเดต

      // ลูปผ่านทุกๆ packages_kkday ใช้ for...of เพื่อรองรับ async/await
      // for (const pkg of packages_kkday) {
      //   const python = spawn('python', [
      //     'crontab/python/index.py',
      //     url || 'https://www.kkday.com/th/product/158964?qs=JR+TOKYO+Wide+Pass',
      //     'world'
      //   ]);

      //   const result = await new Promise((resolve, reject) => {
      //     let output = '';
      //     python.stdout.on('data', (data) => {
      //       output += data.toString();
      //     });
      //     python.stderr.on('data', (data) => {
      //       console.error(`Error: ${data}`);
      //     });
      //     python.on('close', (code) => {
      //       console.log(`Python exited with code ${code}`);
      //       resolve(output);
      //     });
      //     python.on('error', (err) => {
      //       reject(err);
      //     });
      //   });

      // เพิ่มข้อมูลที่อัปเดตลงในอาร์เรย์
      // updatedPackagesKKDay.push({
      //   "priceJP": pkg.priceJP,
      //   "name": pkg.name,
      //   "detail": pkg.detail,
      //   "screenshotPath": pkg.screenshotPath,
      //   "status": null
      // });
      // }

      // ส่งคืนอาร์เรย์ที่อัปเดตทั้งหมดหลังจากลูปเสร็จสิ้น
      return updatedPackagesKKDay;
    } catch (error) {
      console.error("❌ Error during scraping:", error);
      throw error;
    }
  },

  async scrapeWithOCRKlook(packages_klook, url) {
    try {
      const updatedPackagesKKlook = packages_klook; // สร้างอาร์เรย์ที่จะเก็บข้อมูลที่อัปเดต

      // ลูปผ่านทุกๆ packages_kkday ใช้ for...of เพื่อรองรับ async/await
      // for (const pkg of packages_kkday) {
      //   const python = spawn('python', [
      //     'crontab/python/index.py',
      //     url || 'https://www.kkday.com/th/product/158964?qs=JR+TOKYO+Wide+Pass',
      //     'world'
      //   ]);

      //   const result = await new Promise((resolve, reject) => {
      //     let output = '';
      //     python.stdout.on('data', (data) => {
      //       output += data.toString();
      //     });
      //     python.stderr.on('data', (data) => {
      //       console.error(`Error: ${data}`);
      //     });
      //     python.on('close', (code) => {
      //       console.log(`Python exited with code ${code}`);
      //       resolve(output);
      //     });
      //     python.on('error', (err) => {
      //       reject(err);
      //     });
      //   });

      // เพิ่มข้อมูลที่อัปเดตลงในอาร์เรย์
      // updatedPackagesKKlook.push({
      //   "priceJP": pkg.priceJP,
      //   "name": pkg.name,
      //   "detail": pkg.detail,
      //   "screenshotPath": pkg.screenshotPath,
      //   "status": null
      // });
      // }

      // ส่งคืนอาร์เรย์ที่อัปเดตทั้งหมดหลังจากลูปเสร็จสิ้น
      return updatedPackagesKKlook;
    } catch (error) {
      console.error("❌ Error during scraping:", error);
      throw error;
    }
  },


  // 🧩 Scrape full JSON data
  async scrapeFullJson(url) {
    if (!url) throw new Error("URL is required");

    const filename = "price_screenshot.png";
    let browser;

    try {
      console.log("🌐 Opening URL:", url);

      browser = await chromium.launch({
        headless: true,  // ใช้ headless mode
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      });

      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'networkidle' });

      // หน่วงเวลาเพื่อหลีกเลี่ยงการถูกบล็อก
      await new Promise(resolve => setTimeout(resolve, SCREENSHOT_WAIT_TIME));

      await page.screenshot({ path: filename, fullPage: true });

      console.log("🔍 Running OCR...");
      const result = await Tesseract.recognize(filename, OCR_LANGUAGES);
      const text = result.data.text;

      console.log("✅ Full OCR text preview:", text.substring(0, 300) + "...");

      const regex = /(?:\nB|\n@|\n\$|\n$|\) B )([\d,]+(?:\.\d+)?)/g;
      const matches = [...text.matchAll(regex)];
      const pricesArray = matches
        .map((m) => parseFloat(m[1].replace(/,/g, "")))
        .filter((p) => !isNaN(p));

      const prices = pricesArray.length > 0 ? pricesArray[0] : null;

      console.log("💰 Prices found after B, @, or $:", prices);

      return {
        success: true,
        prices,
        count: pricesArray.length,
        screenshotPath: filename,
        fullText: text,
      };
    } catch (error) {
      console.error("❌ Error scraping page:", error);
      throw error;
    } finally {
      if (browser) await browser.close();
    }
  },

  // 🧩 Scrape prices with OCR (for ฿ symbol)
  async scrapePriceWithOCR(url) {
    const filename = "price_screenshot.png";
    let browser;

    try {
      if (!url) throw new Error("URL is required");
      console.log("🌐 Opening URL:", url);

      browser = await chromium.launch({
        headless: true,  // ใช้ headless mode
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      });

      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'networkidle' });

      await new Promise((resolve) => setTimeout(resolve, SCREENSHOT_WAIT_TIME)); // รอเวลา
      await page.screenshot({ path: filename, fullPage: true });

      console.log("🔍 Reading text from screenshot...");
      const result = await Tesseract.recognize(filename, OCR_LANGUAGES);
      const text = result.data.text;

      console.log("✅ Extracted text preview:", text.substring(0, 300) + "...");

      let fullJson = null;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          let jsonText = jsonMatch[0].replace(/'/g, '"');
          fullJson = JSON.parse(jsonText);
          console.log("✅ Full JSON parsed successfully");
        }
      } catch {
        console.log("⚠️ Full JSON parse failed");
      }

      const priceMatches = [...text.matchAll(/฿\s*([\d,]+(?:\.\d{2})?)/g)];
      let prices = [];

      if (priceMatches.length > 0) {
        prices = priceMatches.map((match) => {
          const rawPrice = match[1];
          const numericPrice = parseFloat(rawPrice.replace(/,/g, ""));
          return { raw: rawPrice, numeric: numericPrice };
        });
        console.log("💰 Prices found after ฿:", prices);
      } else {
        console.log("❌ No prices found after ฿");
      }

      const allNumberMatches = [...text.matchAll(/\b([\d,]+(?:\.\d{2})?)\b/g)];
      const numberWithComma = allNumberMatches
        .map((m) => m[1])
        .filter((n) => {
          if (!n.includes(",")) return false;
          const numeric = parseFloat(n.replace(/,/g, ""));
          return numeric >= 100 && numeric <= 1000000;
        });

      let minPrice = null;
      let maxPrice = null;

      if (prices.length > 0) {
        minPrice = Math.min(...prices.map((p) => p.numeric));
        maxPrice = Math.max(...prices.map((p) => p.numeric));
      } else if (numberWithComma.length > 0) {
        const numericValues = numberWithComma.map((n) =>
          parseFloat(n.replace(/,/g, ""))
        );
        minPrice = Math.min(...numericValues);
        maxPrice = Math.max(...numericValues);
        console.log(
          `💰 Using numbers with comma as prices: min=${minPrice}, max=${maxPrice}`
        );
      }

      return {
        url,
        prices,
        priceCount: prices.length,
        minPrice,
        maxPrice,
        numberWithComma,
        fullJson,
        screenshotPath: filename,
        extractedTextPreview: text.substring(0, 500),
      };
    } catch (error) {
      console.error("❌ Error during price scraping:", error);
      throw error;
    } finally {
      if (browser) await browser.close();
    }
  },

  // ==================== CRUD SERVICE FUNCTIONS ====================

  // CREATE - Create new scrape data
  async createScrapeData(data) {
    try {
      console.log('🔧 Service: Creating new scrape data');
      
      // Parse price if provided
      if (data.price_product && typeof data.price_product === 'string') {
        data.price_product = parseFloat(data.price_product.replace(/,/g, ''));
      }

      const scrapeRecord = new ScrapeData(data);
      const savedData = await scrapeRecord.save();
      
      console.log('✅ Service: Data created successfully:', savedData._id);
      return savedData;
    } catch (error) {
      console.error('❌ Service: Error creating scrape data:', error);
      throw error;
    }
  },

  // READ - Get all scrape data
  async getAllScrapeData(page = 1, limit = 10) {
    try {
      console.log('🔧 Service: Getting all scrape data');
      
      const skip = (page - 1) * limit;
      const data = await ScrapeData.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await ScrapeData.countDocuments();
      
      console.log(`✅ Service: Found ${data.length} records`);
      return {
        data,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('❌ Service: Error getting all scrape data:', error);
      throw error;
    }
  },

  // READ - Get scrape data by ID
  async getScrapeDataById(id) {
    try {
      console.log('🔧 Service: Getting scrape data by ID:', id);
      
      const data = await ScrapeData.findById(id);
      
      if (!data) {
        throw new Error('Scrape data not found');
      }
      
      console.log('✅ Service: Data found:', data._id);
      return data;
    } catch (error) {
      console.error('❌ Service: Error getting scrape data by ID:', error);
      throw error;
    }
  },

  // UPDATE - Full update scrape data
  async updateScrapeData(id, updateData) {
    try {
      console.log('🔧 Service: Updating scrape data:', id);
      console.log('🔧 Service: Update data:', updateData);

      // Validate required fields for full update
      const requiredFields = ['no_product', 'name_product', 'url_kkday', 'url_klook'];
      const missingFields = requiredFields.filter(field => !updateData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Parse price if provided
      if (updateData.price_product && typeof updateData.price_product === 'string') {
        updateData.price_product = parseFloat(updateData.price_product.replace(/,/g, ''));
      }

      const updatedData = await ScrapeData.findByIdAndUpdate(
        id,
        updateData,
        { 
          new: true,
          runValidators: true
        }
      );

      if (!updatedData) {
        throw new Error('Scrape data not found');
      }

      console.log('✅ Service: Data updated successfully:', updatedData._id);
      return updatedData;
    } catch (error) {
      console.error('❌ Service: Error updating scrape data:', error);
      throw error;
    }
  },

  // PATCH - Partial update scrape data
  async patchScrapeData(id, updateData) {
    try {
      console.log('🔧 Service: Partially updating scrape data:', id);
      console.log('🔧 Service: Partial update data:', updateData);

      // Parse price if provided
      if (updateData.price_product && typeof updateData.price_product === 'string') {
        updateData.price_product = parseFloat(updateData.price_product.replace(/,/g, ''));
      }

      const updatedData = await ScrapeData.findByIdAndUpdate(
        id,
        { $set: updateData },
        { 
          new: true,
          runValidators: true
        }
      );

      if (!updatedData) {
        throw new Error('Scrape data not found');
      }

      console.log('✅ Service: Data partially updated successfully:', updatedData._id);
      return updatedData;
    } catch (error) {
      console.error('❌ Service: Error partially updating scrape data:', error);
      throw error;
    }
  },

  // DELETE - Delete scrape data
  async deleteScrapeData(id) {
    try {
      console.log('🔧 Service: Deleting scrape data:', id);

      const deletedData = await ScrapeData.findByIdAndDelete(id);

      if (!deletedData) {
        throw new Error('Scrape data not found');
      }

      console.log('✅ Service: Data deleted successfully:', deletedData._id);
      return deletedData;
    } catch (error) {
      console.error('❌ Service: Error deleting scrape data:', error);
      throw error;
    }
  },

  // SEARCH - Search scrape data by criteria
  async searchScrapeData(searchCriteria, page = 1, limit = 10) {
    try {
      console.log('🔧 Service: Searching scrape data:', searchCriteria);
      
      const skip = (page - 1) * limit;
      const query = {};
      
      // Build search query
      if (searchCriteria.no_product) {
        query.no_product = { $regex: searchCriteria.no_product, $options: 'i' };
      }
      if (searchCriteria.name_product) {
        query.name_product = { $regex: searchCriteria.name_product, $options: 'i' };
      }
      if (searchCriteria.min_price || searchCriteria.max_price) {
        query.price_product = {};
        if (searchCriteria.min_price) {
          query.price_product.$gte = parseFloat(searchCriteria.min_price);
        }
        if (searchCriteria.max_price) {
          query.price_product.$lte = parseFloat(searchCriteria.max_price);
        }
      }
      
      const data = await ScrapeData.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await ScrapeData.countDocuments(query);
      
      console.log(`✅ Service: Found ${data.length} matching records`);
      return {
        data,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('❌ Service: Error searching scrape data:', error);
      throw error;
    }
  },

  // BULK UPDATE - Update multiple records
  async bulkUpdateScrapeData(updateCriteria, updateData) {
    try {
      console.log('🔧 Service: Bulk updating scrape data');
      console.log('🔧 Service: Update criteria:', updateCriteria);
      console.log('🔧 Service: Update data:', updateData);

      const result = await ScrapeData.updateMany(updateCriteria, { $set: updateData });
      
      console.log(`✅ Service: Bulk updated ${result.modifiedCount} records`);
      return result;
    } catch (error) {
      console.error('❌ Service: Error bulk updating scrape data:', error);
      throw error;
    }
  },

  // STATISTICS - Get scrape data statistics
  async getScrapeDataStats() {
    try {
      console.log('🔧 Service: Getting scrape data statistics');
      
      const stats = await ScrapeData.aggregate([
        {
          $group: {
            _id: null,
            totalRecords: { $sum: 1 },
            avgPrice: { $avg: '$price_product' },
            minPrice: { $min: '$price_product' },
            maxPrice: { $max: '$price_product' },
            totalKKDayPackages: { $sum: { $size: '$packages_kkday' } },
            totalKLookPackages: { $sum: { $size: '$packages_klook' } }
          }
        }
      ]);
      
      const result = stats[0] || {
        totalRecords: 0,
        avgPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        totalKKDayPackages: 0,
        totalKLookPackages: 0
      };
      
      console.log('✅ Service: Statistics retrieved successfully');
      return result;
    } catch (error) {
      console.error('❌ Service: Error getting statistics:', error);
      throw error;
    }
  }


};
