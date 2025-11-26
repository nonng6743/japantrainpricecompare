const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");

const CHROME_PATH = "/usr/bin/google-chrome"; // <== เปลี่ยนถ้าใช้ chromium-browser

const LINUX_CHROME_ARGS = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-blink-features=AutomationControlled',
    '--disable-gpu',
    '--no-zygote',
    '--single-process'
];

async function captureFullHeaders(targetApiUrl) {
    console.log("🚀 Start capturing FULL HEADERS...\n");

    const browser = await puppeteer.launch({
        headless: "new",
        executablePath: CHROME_PATH,
        args: LINUX_CHROME_ARGS
    });

    const page = await browser.newPage();

    await page.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36"
    );

    // เปิด Client Hints
    await page.setExtraHTTPHeaders({
        "accept-language": "en_US,en;q=0.9",
        "sec-ch-ua": "\"Chromium\";v=\"142\", \"Google Chrome\";v=\"142\", \"Not A Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"macOS\""
    });

    // เปิด CDP
    const cdp = await page.target().createCDPSession();
    await cdp.send("Network.enable");

    let capturedHeaders = null;

    // ดักทุก request (เหมือน Chrome DevTools → Network)
    cdp.on("Network.requestWillBeSent", (params) => {
        const url = params.request.url;

        if (url.includes(targetApiUrl)) {
            console.log("🔥 FOUND TARGET REQUEST FULL HEADERS!");
            console.log(JSON.stringify(params.request.headers, null, 2));

            capturedHeaders = params.request.headers;

            const file = "FULL_REQUEST_HEADERS.json";
            fs.writeFileSync(file, JSON.stringify(params.request.headers, null, 2));
            console.log(`📁 Saved to ${file}\n`);
        }
    });

    console.log("🌐 Opening Klook homepage...");
    await page.goto("https://www.klook.com", {
        waitUntil: "networkidle2",
        timeout: 60000
    });

    await page.waitForTimeout(2000);

    console.log("🌐 Triggering API request...");
    await page.evaluate(async (url) => {
        await fetch(url, { method: "GET", credentials: "include" });
    }, targetApiUrl);

    await page.waitForTimeout(3000);

    await browser.close();
    console.log("🔒 Browser closed.");

    return capturedHeaders;
}

(async () => {
    try {
        const targetApi =
            "https://www.klook.com/v3/userserv/user/profile_service/get_simple_profile_by_token";

        const headers = await captureFullHeaders(targetApi);

        console.log("\n====================== RESULT ======================");
        if (!headers) {
            console.log("⚠️ No headers captured.");
        } else {
            console.log("✅ FULL HEADERS CAPTURED:");
            console.log(JSON.stringify(headers, null, 2));
        }
        console.log("====================================================\n");

    } catch (err) {
        console.error("❌ ERROR:", err.message);
        console.error(err);
    }
})();
