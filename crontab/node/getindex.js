import puppeteer from "puppeteer-core";
import fs from "fs";

const CHROME_PATH = "/usr/bin/google-chrome";

const LINUX_CHROME_ARGS = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-blink-features=AutomationControlled',
    '--disable-gpu',
    '--no-zygote',
    '--single-process'
];

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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

    await page.setExtraHTTPHeaders({
        "accept-language": "en_US,en;q=0.9",
        "currency": "THB",   // ⭐ บังคับ Currency เป็น THB
        "sec-ch-ua": "\"Chromium\";v=\"142\", \"Google Chrome\";v=\"142\", \"Not A Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"macOS\""
    });

    const cdp = await page.target().createCDPSession();
    await cdp.send("Network.enable");

    let capturedHeaders = null;

    cdp.on("Network.requestWillBeSent", (params) => {
        const url = params.request.url;

        if (url.includes(targetApiUrl)) {
            console.log("🔥 FOUND TARGET REQUEST FULL HEADERS!");

            let h = params.request.headers;

            // ⭐ FIX HERE: เปลี่ยน USD → THB ก่อนบันทึก
            if (h["Currency"] === "USD") {
                h["Currency"] = "THB";
                console.log("🔄 FIXED Currency USD → THB");
            }

            (async () => {
                let headersList = {
                    "Accept": "*/*",
                    "User-Agent": "Thunder Client (https://www.thunderclient.com)",
                    "Content-Type": "application/json"
                };
                let headerJson = JSON.stringify(h, null, 2);
                let bodyContent = JSON.stringify({
                    "header_text": headerJson
                });

                let response = await fetch("https://api.japanallpass.com/api/header-setting", {
                    method: "PUT",
                    body: bodyContent,
                    headers: headersList
                });

                let data = await response.text();
                console.log(data);
            })();

            capturedHeaders = h;

            fs.writeFileSync("FULL_REQUEST_HEADERS.json", JSON.stringify(h, null, 2));
            console.log(`📁 Saved to FULL_REQUEST_HEADERS.json\n`);
        }
    });

    console.log("🌐 Opening Klook homepage...");
    await page.goto("https://www.klook.com", {
        waitUntil: "networkidle2",
        timeout: 60000
    });

    await delay(2000);

    console.log("🌐 Triggering API request...");
    await page.evaluate(async (url) => {
        await fetch(url, {
            method: "GET",
            credentials: "include",
            headers: { "currency": "THB" } // ⭐ Force THB ใน fetch
        });
    }, targetApiUrl);

    await delay(3000);

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
