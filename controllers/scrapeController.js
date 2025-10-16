import { scrapeService } from '../services/scrapeService.js';
import ScrapeData from '../models/ScrapeData.js';

export const scrapeController = {
  // POST /api/scrape - Scrape both KKDay and KLook URLs

  async scrapeBothloop(req, res) {
    try {
      
      const data = await ScrapeData.find().sort({ createdAt: -1 });

      for (const item of data) {
        console.log(item)
      }
      res.json({ success: true, count: data.length });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }

  },

  async scrapeBoth(req, res) {
    const { no_product, name_product, price_product, url_kkday, url_klook, detail } = req.body;

    // Check if both URLs are provided
    if (!url_kkday || !url_klook) {
      return res.status(400).json({
        success: false,
        error: 'Both url_kkday and url_klook are required.'
      });
    }

    console.log('📡 API: /api/scrape called with:', req.body);

    try {
      // Parse price_product from string to number
      let parsedPrice = price_product;
      if (typeof price_product === 'string') {
        parsedPrice = parseFloat(price_product.replace(/,/g, ''));
      }

      // Scrape both URLs
      const [resultKKDay, resultKLook] = await Promise.all([
        scrapeService.scrapeWithOCR(url_kkday),
        scrapeService.scrapeFullJson(url_klook)
      ]);

      // Save the scrape data to MongoDB
      const scrapeRecord = new ScrapeData({
        no_product,
        name_product,
        price_product: parsedPrice,
        url_kkday,
        url_klook,
        detail,
        status: 'success',
        extractedText_kkday: resultKKDay.extractedText,
        maxPrice_kkday: resultKKDay.maxPrice,
        minPrice_kkday: resultKKDay.minPrice,
        screenshotPath_kkday: resultKKDay.screenshotPath,
        extractedText_klook: resultKLook.extractedText,
        maxPrice_klook: resultKLook.prices,
        minPrice_klook: resultKLook.prices,
        screenshotPath_klook: resultKLook.screenshotPath
      });

      const savedData = await scrapeRecord.save();
      console.log('💾 Data saved to MongoDB:', savedData._id);

      // Send the result back to the client
      res.json({
        success: true,
        data: {
          id: savedData._id,
          no_product,
          name_product,
          price_product: parsedPrice,
          url_kkday,
          url_klook,
          detail,
          kkday: {
            maxPrice: resultKKDay.maxPrice,
            minPrice: resultKKDay.minPrice,
            parsedJson: resultKKDay.parsedJson,
            packageData: resultKKDay.packageData,
            screenshotPath: resultKKDay.screenshotPath
          },
          klook: {
            maxPrice: resultKLook.prices,
            minPrice: resultKLook.prices,
            parsedJson: resultKLook.parsedJson,
            packageData: resultKLook.packageData,
            screenshotPath: resultKLook.screenshotPath,
            fullText: resultKLook.fullText
          },
          createdAt: savedData.createdAt
        }
      });
    } catch (error) {
      console.error('❌ Error during scraping:', error);
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
      const data = await ScrapeData.find().sort({ createdAt: -1 });
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // GET /api/scrape/:id - Get scrape data by ID
  async getScrapeDataById(req, res) {
    try {
      const data = await ScrapeData.findById(req.params.id);
      if (!data) return res.status(404).json({ success: false, error: 'Data not found' });
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};
