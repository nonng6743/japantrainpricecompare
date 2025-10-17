import { chromium } from 'playwright';
import Tesseract from 'tesseract.js';

const SCREENSHOT_WAIT_TIME = parseInt(process.env.SCREENSHOT_WAIT_TIME) || 5000;
const OCR_LANGUAGES = process.env.OCR_LANGUAGES || 'eng+tha';

export const scrapeService = {
  async scrapeWithOCR(url) {
    const filename = "kkday.png";
    let browser;

    try {
      console.log("🌐 Launching Playwright for", url);

      // เปิดเบราว์เซอร์ในโหมด headless
      browser = await chromium.launch({
        headless: true,  // ใช้ headless mode
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      });

      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'networkidle' });

      // หน่วงเวลา (ทำให้เหมือนการใช้งานจากผู้ใช้จริง)
      console.log(`⏳ Waiting ${SCREENSHOT_WAIT_TIME}ms for page load...`);
      await new Promise(resolve => setTimeout(resolve, SCREENSHOT_WAIT_TIME));

      // การจำลองการเลื่อนเมาส์อย่างช้าๆ เพื่อทำให้การคลิกดูเป็นธรรมชาติ
      console.log("📍 Moving mouse...");
      const element = await page.$('button[type="submit"]'); // เปลี่ยนเป็น selector ที่ต้องการ
      const box = await element.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 }); // เลื่อนเมาส์ให้ช้า

      // คลิกที่ปุ่ม
      console.log("🖱 Clicking the button...");
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

      // 📸 Capturing screenshot ครั้งแรก
      console.log("📸 Capturing screenshot...");
      await page.screenshot({ path: filename, fullPage: true });

      console.log("🔍 Running OCR...");
      const result = await Tesseract.recognize(filename, OCR_LANGUAGES);
      const text = result.data.text;

      console.log("\n✅ Extracted text:\n", text.substring(0, 500) + "...");

      let parsedJson = null;
      let maxPrice = null;
      let minPrice = null;

      // ลองหา JSON ในข้อความ OCR
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          let jsonText = jsonMatch[0].replace(/'/g, '"');
          parsedJson = JSON.parse(jsonText);
          console.log("✅ JSON parsed successfully");
        }
      } catch {
        console.log("⚠️ JSON parse failed");
      }

      // หา min/max price ด้วย regex
      const maxPriceMatch = text.match(/max_price['"]?\s*:\s*(\d+)/);
      const minPriceMatch = text.match(/min_price['"]?\s*:\s*(\d+)/);
      maxPrice = maxPriceMatch ? maxPriceMatch[1] : null;
      minPrice = minPriceMatch ? minPriceMatch[1] : null;

      console.log("💰 Detected prices:");
      if (maxPrice) console.log(`  max_price = ${maxPrice}`);
      if (minPrice) console.log(`  min_price = ${minPrice}`);

      const packageData = {
        prodMid: text.match(/prodMid['":\s]*(\d+)/)?.[1] || null,
        prodOid: text.match(/prod_oid['":\s]*(\d+)/)?.[1] || null,
        items: text.match(/items['":\s]*\[([^\]]+)\]/)?.[1] || null,
        availablePackages:
          text.match(/available_pkg['":\s]*\[([^\]]+)\]/)?.[1] || null,
      };

      return {
        maxPrice,
        minPrice,
        extractedText: text,
        parsedJson,
        packageData,
        screenshotPath: filename,
        url,
      };
    } catch (error) {
      console.error("❌ Error during scraping:", error);
      throw error;
    } finally {
      if (browser) await browser.close();
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
};
