import open from 'open';
import screenshot from 'screenshot-desktop';
import Tesseract from 'tesseract.js';

const SCREENSHOT_WAIT_TIME = parseInt(process.env.SCREENSHOT_WAIT_TIME) || 5000;
const OCR_LANGUAGES = process.env.OCR_LANGUAGES || 'eng+tha';

export const scrapeService = {
  // Scrape with OCR for KKDay
  async scrapeWithOCR(url) {
    try {
      console.log('🌐 Opening browser for', url);
      await open(url);

      // Wait for page to load and take screenshot
      await new Promise(resolve => setTimeout(resolve, SCREENSHOT_WAIT_TIME));

      const filename = 'kkday.png';
      console.log('📸 Capturing screenshot...');
      await screenshot({ filename });

      console.log('🔍 Reading text from screenshot...');
      const result = await Tesseract.recognize(filename, OCR_LANGUAGES);
      const text = result.data.text;

      console.log('\n✅ Extracted text:\n', text.substring(0, 500) + '...');

      // Try to parse JSON from extracted text
      let parsedJson = null;
      let maxPrice = null;
      let minPrice = null;

      try {
        // Find JSON part in text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          // Clean JSON that might have OCR errors
          let jsonText = jsonMatch[0];
          
          // Replace single quotes with double quotes
          jsonText = jsonText.replace(/'/g, '"');
          
          // Try to parse JSON
          try {
            parsedJson = JSON.parse(jsonText);
            console.log('✅ JSON parsed successfully');
          } catch (e) {
            console.log('⚠️ JSON parse failed, using regex fallback');
          }
        }
      } catch (e) {
        console.log('⚠️ No valid JSON found in text');
      }

      // Use regex to extract max_price and min_price
      const maxPriceMatch = text.match(/max_price['"]?\s*:\s*(\d+)/);
      const minPriceMatch = text.match(/min_price['"]?\s*:\s*(\d+)/);
      maxPrice = maxPriceMatch ? maxPriceMatch[1] : null;
      minPrice = minPriceMatch ? minPriceMatch[1] : null;

      console.log('💰 Detected prices:');
      if (maxPrice) console.log(`  max_price = ${maxPrice}`);
      if (minPrice) console.log(`  min_price = ${minPrice}`);

      // Extract additional data
      const packageData = {
        prodMid: text.match(/prodMid['":\s]*(\d+)/)?.[1] || null,
        prodOid: text.match(/prod_oid['":\s]*(\d+)/)?.[1] || null,
        items: text.match(/items['":\s]*\[([^\]]+)\]/)?.[1] || null,
        availablePackages: text.match(/available_pkg['":\s]*\[([^\]]+)\]/)?.[1] || null
      };

      return { 
        maxPrice, 
        minPrice, 
        extractedText: text, 
        parsedJson,
        packageData,
        screenshotPath: filename, 
        url 
      }; 

    } catch (error) {
      console.error('❌ Error during scraping:', error);
      throw error;
    }
  },

  // Scrape full JSON data
  async scrapeFullJson(url) {
    if (!url) {
      throw new Error('URL is required');
    }

    try {
      console.log("🌐 Opening URL:", url);
      await open(url);

      // Wait for page to load
      await new Promise(resolve => setTimeout(resolve, SCREENSHOT_WAIT_TIME));

      const filename = 'price_screenshot.png';
      await screenshot({ filename });

      console.log("🔍 Running OCR...");
      const result = await Tesseract.recognize(filename, OCR_LANGUAGES);
      const text = result.data.text;

      console.log("✅ Full OCR text preview:", text.substring(0, 300) + "...");

      // Regex: Find numbers after B, @ or $ (including prices with commas)
      const regex = /(?:\nB|\n@|\n\$|\n$|\) B )([\d,]+(?:\.\d+)?)/g;
      const matches = [...text.matchAll(regex)];

      // Convert to actual numbers by removing commas
      const pricesArray = matches
        .map(m => parseFloat(m[1].replace(/,/g, '')))  // Remove commas and convert to number
        .filter(p => !isNaN(p)); // Filter out non-numeric values

      const prices = pricesArray.length > 0 ? pricesArray[0] : null;
        
      console.log("💰 Prices found after B, @, or $:", prices);

      return {
        success: true,
        prices: prices,               // e.g. [1200.0]
        count: pricesArray.length,
        screenshotPath: filename,
        fullText: text
      };

    } catch (error) {
      console.error("❌ Error scraping page:", error);
      throw new Error(error.message);
    }
  },

  // Scrape prices with OCR (for ฿ symbol)
  async scrapePriceWithOCR(url) {
    try {
      console.log('🌐 Opening URL:', url);
      await open(url);

      // Wait for page to load
      await new Promise(resolve => setTimeout(resolve, SCREENSHOT_WAIT_TIME));

      const filename = 'price_screenshot.png';
      console.log('📸 Capturing screenshot...');
      await screenshot({ filename });

      console.log('🔍 Reading text from screenshot...');
      const result = await Tesseract.recognize(filename, OCR_LANGUAGES);
      const text = result.data.text;

      console.log('✅ Extracted text preview:', text.substring(0, 300) + '...');

      // Try to parse JSON from text
      let fullJson = null;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          let jsonText = jsonMatch[0];
          jsonText = jsonText.replace(/'/g, '"');
          try {
            fullJson = JSON.parse(jsonText);
            console.log('✅ Full JSON parsed successfully');
          } catch (e) {
            console.log('⚠️ Full JSON parse failed');
          }
        }
      } catch (e) {
        console.log('⚠️ No JSON found in text');
      }

      // Extract numbers after ฿ symbol
      const priceMatches = [...text.matchAll(/฿\s*([\d,]+(?:\.\d{2})?)/g)];
      let prices = [];
      
      if (priceMatches.length > 0) {
        prices = priceMatches.map(match => {
          const rawPrice = match[1];
          const numericPrice = parseFloat(rawPrice.replace(/,/g, ''));
          return {
            raw: rawPrice,           // e.g. "10,668"
            numeric: numericPrice    // e.g. 10668
          };
        });
        console.log('💰 Prices found after ฿:', prices);
      } else {
        console.log('❌ No prices found after ฿');
      }

      // Extract numbers with commas (likely prices)
      // Filter only numbers that look like real prices (100-1,000,000)
      const allNumberMatches = [...text.matchAll(/\b([\d,]+(?:\.\d{2})?)\b/g)];
      const numberWithComma = allNumberMatches
        .map(m => m[1])
        .filter(n => {
          if (!n.includes(',')) return false;
          const numeric = parseFloat(n.replace(/,/g, ''));
          // Filter only numbers that look like prices (100-1,000,000)
          return numeric >= 100 && numeric <= 1000000;
        });
      
      // If no prices after ฿ but numbers with commas exist, use those
      let minPrice = null;
      let maxPrice = null;
      
      if (prices.length > 0) {
        // Use prices from ฿
        minPrice = Math.min(...prices.map(p => p.numeric));
        maxPrice = Math.max(...prices.map(p => p.numeric));
      } else if (numberWithComma.length > 0) {
        // Use numbers with commas
        const numericValues = numberWithComma.map(n => parseFloat(n.replace(/,/g, '')));
        minPrice = Math.min(...numericValues);
        maxPrice = Math.max(...numericValues);
        console.log(`💰 Using numbers with comma as prices: min=${minPrice}, max=${maxPrice}`);
        console.log(`   Found numbers: ${numberWithComma.join(', ')}`);
      }

      return {
        url,
        prices,                    // Prices found after ฿
        priceCount: prices.length,
        minPrice,
        maxPrice,
        numberWithComma,           // Numbers with commas (likely prices)
        fullJson,                  // Parsed JSON
        screenshotPath: filename,
        extractedTextPreview: text.substring(0, 500)
      };

    } catch (error) {
      console.error('❌ Error during price scraping:', error);
      throw error;
    }
  }
};
