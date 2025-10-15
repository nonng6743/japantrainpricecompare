import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import open from 'open';
import screenshot from 'screenshot-desktop';
import Tesseract from 'tesseract.js';
import fs from 'fs';
import { connectDB } from './config/database.js';
import ScrapeData from './models/ScrapeData.js';

const app = express();
const PORT = process.env.PORT || 4000;
const SCREENSHOT_WAIT_TIME = parseInt(process.env.SCREENSHOT_WAIT_TIME) || 5000;
const OCR_LANGUAGES = process.env.OCR_LANGUAGES || 'eng+tha';

// Middleware
app.use(cors());
app.use(express.json());

// Default KKDay URL
const defaultUrl = 'https://www.kkday.com/api/_nuxt/product/fetch-packages-data?prodMid=158964&previewToken&beginDate=2025-10-10&endDate=2026-01-05';

// ฟังก์ชันใหม่ที่เปลี่ยน /api/scrape-fulljson ให้เป็นฟังก์ชันในตัว
async function scrapeFullJson(url) {
  if (!url) {
    throw new Error('URL is required');
  }

  try {
    console.log("🌐 Opening URL:", url);
    await open(url);

    // รอให้หน้าเว็บโหลด
    await new Promise(resolve => setTimeout(resolve, SCREENSHOT_WAIT_TIME));

    const filename = 'price_screenshot.png';
    await screenshot({ filename });

    console.log("🔍 Running OCR...");
    const result = await Tesseract.recognize(filename, OCR_LANGUAGES);
    const text = result.data.text;

    console.log("✅ Full OCR text preview:", text.substring(0, 300) + "...");

    // 🔹 Regex: หาเลขหลัง B, @ หรือ $ (รวมถึงราคาที่มีคอมม่า)
    const regex = /(?:\nB|\n@|\n\$|\n$)([\d,]+(?:\.\d+)?)/g;
    const matches = [...text.matchAll(regex)];

    // แปลงเป็นตัวเลขจริงโดยเอาคอมม่าออกและแปลงค่าให้ถูกต้อง
    const pricesAraay = matches
      .map(m => parseFloat(m[1].replace(/,/g, '')))  // เอาคอมม่าออกแล้วแปลงเป็นตัวเลข
      .filter(p => !isNaN(p)); // กรองค่าที่ไม่ใช่ตัวเลข

    const prices = pricesAraay.length > 0 ? pricesAraay[0] : null;
      

    console.log("💰 Prices found after B, @, or $:", prices);

    return {
      success: true,
      prices: prices,               // เช่น [1200.0]
      count: pricesAraay.length,
      screenshotPath: filename,
      fullText: text
    };

  } catch (error) {
    console.error("❌ Error scraping page:", error);
    throw new Error(error.message);
  }
}


// Function to perform web scraping with OCR for KKDay
async function scrapeWithOCR(url) {
  try {
    console.log('🌐 Opening browser for', url);
    await open(url);

    // Wait for page to load and take screenshot (adjust time as needed)
    await new Promise(resolve => setTimeout(resolve, SCREENSHOT_WAIT_TIME));

    const filename = 'kkday.png';
    console.log('📸 Capturing screenshot...');
    await screenshot({ filename });

    console.log('🔍 Reading text from screenshot...');
    const result = await Tesseract.recognize(filename, OCR_LANGUAGES);
    const text = result.data.text;

    console.log('\n✅ Extracted text:\n', text.substring(0, 500) + '...');

    // 🔍 พยายาม parse JSON จากข้อความที่อ่านได้
    let parsedJson = null;
    let maxPrice = null;
    let minPrice = null;

    try {
      // หาส่วนที่เป็น JSON ในข้อความ (อาจจะไม่สมบูรณ์)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        // พยายาม clean JSON ที่อาจมี OCR errors
        let jsonText = jsonMatch[0];
        
        // แทนที่ single quotes ด้วย double quotes
        jsonText = jsonText.replace(/'/g, '"');
        
        // ลองแปลง JSON
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

    // ใช้ regex ดึงค่า max_price และ min_price
    const maxPriceMatch = text.match(/max_price['"]?\s*:\s*(\d+)/);
    const minPriceMatch = text.match(/min_price['"]?\s*:\s*(\d+)/);
    maxPrice = maxPriceMatch ? maxPriceMatch[1] : null;
    minPrice = minPriceMatch ? minPriceMatch[1] : null;

    console.log('💰 Detected prices:');
    if (maxPrice) console.log(`  max_price = ${maxPrice}`);
    if (minPrice) console.log(`  min_price = ${minPrice}`);

    // ดึงข้อมูลเพิ่มเติม
    const packageData = {
      prodMid: text.match(/prodMid['":\s]*(\d+)/)?.[1] || null,
      prodOid: text.match(/prod_oid['":\s]*(\d+)/)?.[1] || null,
      items: text.match(/items['":\s]*\[([^\]]+)\]/)?.[1] || null,
      availablePackages: text.match(/available_pkg['":\s]*\[([^\]]+)\]/)?.[1] || null
    };

    // ส่งค่ากลับพร้อมทั้ง JSON ที่ parse ได้และข้อมูลที่ดึงได้
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
}

// POST /api/scrape - Scrape both KKDay and KLook URLs
app.post('/api/scrape', async (req, res) => {
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
    // แปลง price_product จาก string ที่มีจุลภาคเป็น number
    let parsedPrice = price_product;
    if (typeof price_product === 'string') {
      // ลบจุลภาคและแปลงเป็น number
      parsedPrice = parseFloat(price_product.replace(/,/g, ''));
    }

    // Scrape URL 1 (KKDay)
    const resultKKDay = await scrapeWithOCR(url_kkday);

    // Scrape URL 2 (KLook) using scrapeFullJson
    const resultKLook = await scrapeFullJson(url_klook);

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
});

// POST /api/scrape-price - Scrape prices after ฿ symbol
app.post('/api/scrape-price', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ 
      success: false, 
      error: 'URL is required' 
    });
  }

  console.log('📡 API: /api/scrape-price called with URL:', url);

  try {
    console.log('🌐 Opening URL:', url);
    await open(url);

    // รอให้หน้าเว็บโหลดเสร็จ
    await new Promise(resolve => setTimeout(resolve, SCREENSHOT_WAIT_TIME));

    const filename = 'price_screenshot.png';
    console.log('📸 Capturing screenshot...');
    await screenshot({ filename });

    console.log('🔍 Reading text from screenshot...');
    const result = await Tesseract.recognize(filename, OCR_LANGUAGES);
    const text = result.data.text;

    console.log('✅ Extracted text preview:', text.substring(0, 300) + '...');

    // 🔍 พยายาม parse JSON จากข้อความ
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

    // 🔍 ดึงตัวเลขหลังเครื่องหมาย ฿
    const priceMatches = [...text.matchAll(/฿\s*([\d,]+(?:\.\d{2})?)/g)];
    let prices = [];
    
    if (priceMatches.length > 0) {
      prices = priceMatches.map(match => {
        const rawPrice = match[1];
        const numericPrice = parseFloat(rawPrice.replace(/,/g, ''));
        return {
          raw: rawPrice,           // เช่น "10,668"
          numeric: numericPrice    // เช่น 10668
        };
      });
      console.log('💰 Prices found after ฿:', prices);
    } else {
      console.log('❌ No prices found after ฿');
    }

    // ดึงตัวเลขที่มีจุลภาค (น่าจะเป็นราคา)
    // กรองเฉพาะตัวเลขที่มีรูปแบบราคาจริงๆ (100-1,000,000)
    const allNumberMatches = [...text.matchAll(/\b([\d,]+(?:\.\d{2})?)\b/g)];
    const numberWithComma = allNumberMatches
      .map(m => m[1])
      .filter(n => {
        if (!n.includes(',')) return false;
        const numeric = parseFloat(n.replace(/,/g, ''));
        // กรองเฉพาะตัวเลขที่น่าจะเป็นราคา (100-1,000,000)
        return numeric >= 100 && numeric <= 1000000;
      });
    
    // ถ้าไม่มีราคาหลัง ฿ แต่มีตัวเลขที่มีจุลภาค ให้ใช้ตัวนั้นแทน
    let minPrice = null;
    let maxPrice = null;
    
    if (prices.length > 0) {
      // ใช้ราคาจาก ฿
      minPrice = Math.min(...prices.map(p => p.numeric));
      maxPrice = Math.max(...prices.map(p => p.numeric));
    } else if (numberWithComma.length > 0) {
      // ใช้ตัวเลขที่มีจุลภาค
      const numericValues = numberWithComma.map(n => parseFloat(n.replace(/,/g, '')));
      minPrice = Math.min(...numericValues);
      maxPrice = Math.max(...numericValues);
      console.log(`💰 Using numbers with comma as prices: min=${minPrice}, max=${maxPrice}`);
      console.log(`   Found numbers: ${numberWithComma.join(', ')}`);
    }

    res.json({
      success: true,
      data: {
        url,
        prices,                    // ราคาที่พบหลัง ฿
        priceCount: prices.length,
        minPrice,
        maxPrice,
        numberWithComma,           // ตัวเลขที่มีจุลภาค (น่าจะเป็นราคา)
        fullJson,                  // JSON ที่ parse ได้
        screenshotPath: filename,
        extractedTextPreview: text.substring(0, 500)
      }
    });

  } catch (error) {
    console.error('❌ Error during price scraping:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/scrape - ดึงข้อมูลทั้งหมด
app.get('/api/scrape', async (req, res) => {
  try {
    const data = await ScrapeData.find().sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/scrape/:id - ดึงข้อมูลตาม id
app.get('/api/scrape/:id', async (req, res) => {
  try {
    const data = await ScrapeData.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Data not found' });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/', async (req, res) => {
  res.send('Hello api');
});


// Connect to MongoDB and start the server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📱 API available at: http://localhost:${PORT}`);
      console.log(`🔗 Try: http://localhost:${PORT}/api/scrape`);
      console.log(`📊 MongoDB connected: web-scraper database`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
