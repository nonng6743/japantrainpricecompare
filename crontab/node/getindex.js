const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

/**
 * ดักจับ API request headers จากหน้า Klook activity
 * @param {string} activityUrl - URL ของ activity page
 * @param {string} targetApiUrl - URL ของ API ที่ต้องการดักจับ
 * @returns {Promise<Object>} captured headers และ request data
 */
async function captureApiHeaders(activityUrl, targetApiUrl) {
    let browser;
    try {
        console.log("🚀 เริ่มต้นดักจับ API headers...\n");
        
        browser = await puppeteer.launch({
            headless: "new",// เปิด browser เพื่อดูการทำงาน
            executablePath: "/usr/bin/google-chrome",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-blink-features=AutomationControlled'
            ]
        });

        const page = await browser.newPage();
        
        // Set user agent
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36');
        
        // ตัวแปรสำหรับเก็บข้อมูลที่ดักจับได้
        let capturedRequest = null;
        let capturedResponse = null;
        
        // ตั้งค่า request interception เพื่อดักจับ request
        await page.setRequestInterception(true);
        
        page.on('request', (request) => {
            const requestUrl = request.url();
            
            // ตรวจสอบว่าเป็น API ที่เราต้องการดักจับหรือไม่
            if (requestUrl.includes(targetApiUrl) || requestUrl.includes('get_simple_profile_by_token')) {
                console.log("\n" + "=".repeat(80));
                console.log("🎯 พบ API Request ที่ต้องการดักจับ!");
                console.log("=".repeat(80));
                
                let headers = request.headers();
                const method = request.method();
                const postData = request.postData();
                
                // แก้ไข currency จาก USD เป็น THB ถ้ามี
                if (headers['currency'] === 'USD') {
                    headers = { ...headers, 'currency': 'THB' };
                    console.log("   🔄 แก้ไข currency จาก USD เป็น THB");
                }
                
                capturedRequest = {
                    url: requestUrl,
                    method: method,
                    headers: headers,
                    postData: postData || null,
                    timestamp: new Date().toISOString()
                };
                
                console.log("\n📍 URL:");
                console.log(`   ${requestUrl}`);
                console.log("\n🔧 Method:");
                console.log(`   ${method}`);
                console.log("\n📤 Headers:");
                console.log("-".repeat(80));
                
                // แสดง headers (ซ่อน sensitive headers)
                const sensitiveHeaders = ['cookie', 'authorization', 'x-api-key', 'x-auth-token', 'x-csrf-token'];
                let displayedCount = 0;
                
                for (const [key, value] of Object.entries(headers)) {
                    if (sensitiveHeaders.includes(key.toLowerCase())) {
                        // แสดงแต่ไม่แสดงค่าเต็ม (เพื่อความปลอดภัย)
                        console.log(`   ${key}: [HIDDEN - ${value.length} characters]`);
                    } else {
                        const displayValue = value.length > 150 ? value.substring(0, 150) + "..." : value;
                        console.log(`   ${key}: ${displayValue}`);
                    }
                    displayedCount++;
                }
                
                if (postData) {
                    console.log("\n📦 Request Body (Post Data):");
                    try {
                        const postDataJson = JSON.parse(postData);
                        console.log(JSON.stringify(postDataJson, null, 2));
                    } catch {
                        console.log(postData.substring(0, 500));
                    }
                }
                
                console.log("\n" + "=".repeat(80));
            }
            
            // ต้อง continue request เพื่อให้ request ทำงานต่อ
            request.continue();
        });
        
        // ดักจับ response เพื่อดู response data
        page.on('response', async (response) => {
            const responseUrl = response.url();
            
            if (responseUrl.includes(targetApiUrl) || responseUrl.includes('get_simple_profile_by_token')) {
                console.log("\n📥 Response Headers:");
                console.log("-".repeat(80));
                
                const responseHeaders = response.headers();
                for (const [key, value] of Object.entries(responseHeaders)) {
                    console.log(`   ${key}: ${value}`);
                }
                
                try {
                    const responseData = await response.json();
                    capturedResponse = {
                        status: response.status(),
                        statusText: response.statusText(),
                        headers: responseHeaders,
                        data: responseData
                    };
                    
                    console.log("\n📊 Response Data:");
                    console.log(JSON.stringify(responseData, null, 2));
                } catch (error) {
                    const responseText = await response.text();
                    capturedResponse = {
                        status: response.status(),
                        statusText: response.statusText(),
                        headers: responseHeaders,
                        data: responseText
                    };
                    console.log("\n📊 Response Text:");
                    console.log(responseText.substring(0, 500));
                }
            }
        });
        
        // Navigate to activity page
        console.log(`📍 กำลังเปิดหน้า activity: ${activityUrl}`);
        await page.goto(activityUrl, {
            waitUntil: 'networkidle2',
            timeout: 60000
        });
        
        console.log("⏳ รอให้หน้าเว็บโหลดและ API requests ถูกส่ง...");
        
        // รอให้หน้าเว็บโหลดเสร็จ
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // คลิกปุ่มแรก (language/currency selector)
        console.log("\n" + "=".repeat(80));
        console.log("🔍 กำลังค้นหาปุ่มแรก (language/currency selector)...");
        console.log("=".repeat(80));
        try {
            const firstButtonXpath = '//*[@id="__layout"]/div/header/div/nav/div[2]/div[2]/div[1]/a';
            
            console.log("   กำลังรอให้ปุ่มปรากฏ (timeout: 10 วินาที)...");
            await page.waitForXPath(firstButtonXpath, { timeout: 10000 });
            
            console.log("   กำลังหา element ด้วย XPath...");
            const firstButton = await page.$x(firstButtonXpath);
            
            if (firstButton.length > 0) {
                console.log("✅ พบปุ่มแรก!");
                
                // Scroll to element
                console.log("   กำลัง scroll ไปที่ปุ่ม...");
                await firstButton[0].evaluate((element) => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                });
                
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Click the button
                console.log("🖱️  กำลังคลิกปุ่มแรก...");
                await firstButton[0].click();
                console.log("✅ คลิกปุ่มแรกสำเร็จ!");
                
                // รอให้ dropdown menu ปรากฏ
                console.log("   รอให้ dropdown menu ปรากฏ...");
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // คลิกปุ่มที่สอง (menu item - THB)
                console.log("\n" + "=".repeat(80));
                console.log("🔍 กำลังค้นหาปุ่มที่สอง (THB menu item)...");
                console.log("=".repeat(80));
                const secondButtonXpath = '//*[@id="__layout"]/div/header/div/nav/div[2]/div[2]/div[2]/div/div/div/div/ul[2]/li[28]/a';
                
                console.log("   กำลังรอให้ปุ่มปรากฏ (timeout: 10 วินาที)...");
                await page.waitForXPath(secondButtonXpath, { timeout: 10000 });
                
                console.log("   กำลังหา element ด้วย XPath...");
                const secondButton = await page.$x(secondButtonXpath);
                
                if (secondButton.length > 0) {
                    console.log("✅ พบปุ่มที่สอง!");
                    
                    // Scroll to element
                    console.log("   กำลัง scroll ไปที่ปุ่ม...");
                    await secondButton[0].evaluate((element) => {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    });
                    
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Click the button
                    console.log("🖱️  กำลังคลิกปุ่มที่สอง...");
                    await secondButton[0].click();
                    console.log("✅ คลิกปุ่มที่สองสำเร็จ!");
                    
                    // รอให้หน้าเว็บอัปเดตหลังจากคลิก
                    console.log("   รอให้หน้าเว็บอัปเดต...");
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } else {
                    console.log("⚠️  ไม่พบปุ่มที่สอง (XPath ไม่พบ element)");
                }
            } else {
                console.log("⚠️  ไม่พบปุ่มแรก (XPath ไม่พบ element)");
            }
        } catch (error) {
            console.log(`⚠️  เกิดข้อผิดพลาดในการคลิกปุ่ม: ${error.message}`);
            if (error.message.includes('timeout')) {
                console.log("   ⏱️  Timeout - ปุ่มอาจจะยังไม่โหลดหรือ XPath เปลี่ยน");
            }
            console.log("   กำลังดำเนินการต่อ...");
        }
        
        // ลอง interact กับหน้าเว็บเพื่อ trigger API calls
        console.log("\n🖱️  กำลัง interact กับหน้าเว็บ...");
        
        try {
            // Scroll down เพื่อ trigger lazy loading
            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight / 2);
            });
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Scroll up
            await page.evaluate(() => {
                window.scrollTo(0, 0);
            });
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // ลองคลิกที่ elements ต่างๆ
            const clickableElements = await page.$$('button, a, [role="button"], [class*="button"], [class*="btn"]');
            if (clickableElements.length > 0) {
                console.log(`   พบ clickable elements: ${clickableElements.length} ตัว`);
                // คลิกที่ element แรก (ถ้ามี)
                try {
                    await clickableElements[0].click();
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } catch (e) {
                    // ไม่เป็นไร ถ้าคลิกไม่ได้
                }
            }
        } catch (error) {
            console.log(`   ⚠️  ไม่สามารถ interact ได้: ${error.message}`);
        }
        
        // รอเพิ่มเติมเพื่อให้แน่ใจว่า API requests ถูกส่ง
        console.log("⏳ รอเพิ่มเติมเพื่อดักจับ API requests...");
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // ถ้ายังไม่พบ request ลอง trigger โดยตรง
        if (!capturedRequest) {
            console.log("\n⚠️  ยังไม่พบ API request, กำลังลอง trigger โดยตรง...");
            
            // ลองส่ง request ผ่าน page.evaluate
            try {
                const apiUrl = "https://www.klook.com/v3/userserv/user/profile_service/get_simple_profile_by_token?k_lang=en_BS&k_currency=THB";
                await page.evaluate(async (url) => {
                    await fetch(url, {
                        method: 'GET',
                        credentials: 'include'
                    });
                }, apiUrl);
                
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                console.log(`   ⚠️  ไม่สามารถ trigger request ได้: ${error.message}`);
            }
        }
        
        // รออีกสักครู่
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // เก็บผลลัพธ์
        const result = {
            activityUrl: activityUrl,
            targetApiUrl: targetApiUrl,
            capturedAt: new Date().toISOString(),
            request: capturedRequest,
            response: capturedResponse
        };
        
        // บันทึกเป็น JSON file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `captured_api_headers_${timestamp}.json`;
        const filepath = path.join(__dirname, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(result, null, 2), 'utf8');
        console.log(`\n💾 บันทึกข้อมูลลงไฟล์: ${filename}`);
        
        if (!capturedRequest) {
            console.log("\n⚠️  ไม่พบ API request ที่ต้องการดักจับ");
            console.log("   ลองเปิด browser และ interact กับหน้าเว็บด้วยตนเอง");
            console.log("   หรือรอให้หน้าเว็บโหลดเสร็จและ trigger API calls");
            
            // เปิด browser ไว้เพื่อให้ผู้ใช้ interact ได้
            console.log("\n⏸️  เปิด browser ไว้ 30 วินาทีเพื่อให้คุณ interact...");
            await new Promise(resolve => setTimeout(resolve, 30000));
        }
        
        return result;
        
    } catch (error) {
        console.error("❌ เกิดข้อผิดพลาด:", error.message);
        throw error;
    } finally {
        if (browser) {
            console.log("\n🔒 กำลังปิด browser...");
            await browser.close();
        }
    }
}

/**
 * ดึง kepler-id จาก Klook โดยใช้ browser automation
 * @returns {Promise<string>} kepler-id
 */
async function getKeplerId() {
    let browser;
    try {
        console.log("🌐 กำลังเปิด browser เพื่อดึง kepler-id...");
        
        browser = await puppeteer.launch({
            headless: true, // ใช้ headless mode สำหรับ server
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-blink-features=AutomationControlled'
            ]
        });

        const page = await browser.newPage();
        
        // Set user agent
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36');
        
        // Navigate to Klook homepage เพื่อให้สร้าง kepler-id
        console.log("📍 กำลังเข้าหน้า Klook...");
        await page.goto('https://www.klook.com', { 
            waitUntil: 'networkidle2', 
            timeout: 30000 
        });
        
        // รอสักครู่เพื่อให้ cookie ถูกสร้าง
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // ดึง cookies
        const cookies = await page.cookies();
        console.log(`🍪 พบ cookies ทั้งหมด: ${cookies.length} ตัว`);
        
        // หา kepler_id จาก cookies
        const keplerCookie = cookies.find(cookie => cookie.name === 'kepler_id');
        
        if (keplerCookie) {
            const keplerId = keplerCookie.value;
            console.log(`✅ พบ kepler-id: ${keplerId}`);
            return keplerId;
        } else {
            // ลองดึงจาก localStorage หรือ sessionStorage
            console.log("⚠️  ไม่พบ kepler_id ใน cookies, กำลังลองดึงจาก localStorage...");
            const keplerIdFromStorage = await page.evaluate(() => {
                return localStorage.getItem('kepler_id') || 
                       sessionStorage.getItem('kepler_id') ||
                       document.cookie.match(/kepler_id=([^;]+)/)?.[1];
            });
            
            if (keplerIdFromStorage) {
                console.log(`✅ พบ kepler-id จาก storage: ${keplerIdFromStorage}`);
                return keplerIdFromStorage;
            }
            
            throw new Error("ไม่พบ kepler-id ใน cookies หรือ storage");
        }
        
    } catch (error) {
        console.error("❌ เกิดข้อผิดพลาดในการดึง kepler-id:", error.message);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

/**
 * ส่ง API request ผ่าน browser context เพื่อหลีกเลี่ยง CAPTCHA
 * @param {string} keplerId - kepler-id ที่ดึงมา
 * @returns {Promise<Object>} API response data
 */
async function makeApiRequestWithBrowser(keplerId) {
    let browser;
    try {
        console.log("🌐 กำลังเปิด browser เพื่อส่ง API request...");
        
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-blink-features=AutomationControlled'
            ]
        });

        const page = await browser.newPage();
        
        // Set user agent
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36');
        
        // Set extra headers
        await page.setExtraHTTPHeaders({
            'accept-language': 'en_BS',
            'accept-encoding': 'gzip, deflate, br, zstd',
            'cache-control': 'no-cache',
            'currency': 'THB',
            'x-klook-kepler-id': keplerId,
            'x-platform': 'desktop',
            'x-requested-with': 'XMLHttpRequest'
        });
        
        // Navigate to Klook homepage ก่อนเพื่อสร้าง session
        console.log("📍 กำลังเข้าหน้า Klook เพื่อสร้าง session...");
        await page.goto('https://www.klook.com', { 
            waitUntil: 'networkidle2', 
            timeout: 30000 
        });
        
        // รอให้ session และ cookies ถูกสร้าง
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // ส่ง API request ผ่าน browser context (ใช้ fetch API)
        console.log("📡 กำลังส่ง API request ผ่าน browser context...");
        const apiUrl = "https://www.klook.com/v3/userserv/user/profile_service/get_simple_profile_by_token?k_lang=en_BS&k_currency=THB";
        
        const response = await page.evaluate(async (url) => {
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'accept': 'application/json, text/plain, */*',
                        'accept-language': 'en_BS',
                        'cache-control': 'no-cache',
                        'currency': 'THB',
                        'x-klook-kepler-id': document.cookie.match(/kepler_id=([^;]+)/)?.[1] || '',
                        'x-platform': 'desktop',
                        'x-requested-with': 'XMLHttpRequest',
                        'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
                        'sec-ch-ua-platform': '"macOS"',
                        'sec-ch-ua-mobile': '?0',
                        'sec-fetch-dest': 'empty',
                        'sec-fetch-mode': 'cors',
                        'sec-fetch-site': 'same-origin',
                        'referer': 'https://www.klook.com/'
                    },
                    credentials: 'include' // ส่ง cookies อัตโนมัติ
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    return {
                        success: false,
                        status: response.status,
                        statusText: response.statusText,
                        error: errorText
                    };
                }
                
                const data = await response.json();
                return {
                    success: true,
                    status: response.status,
                    data: data
                };
            } catch (error) {
                return {
                    success: false,
                    error: error.message
                };
            }
        }, apiUrl);
        
        if (!response.success) {
            throw new Error(`API request failed: ${response.error || response.statusText || 'Unknown error'}`);
        }
        
        console.log(`✅ API request สำเร็จ (Status: ${response.status})`);
        return response.data;
        
    } catch (error) {
        console.error("❌ เกิดข้อผิดพลาดในการส่ง API request:", error.message);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

(async () => {
    try {
        // URL ของ activity page
        const activityUrl = "https://www.klook.com/activity/1418-jr-east-tohoku-area-jr-pass/?spm=Home.Popular%3Aany%3A%3APopularActivities%3ACard_LIST&clickId=81d145f7f0";
        
        // URL ของ API ที่ต้องการดักจับ
        const targetApiUrl = "https://www.klook.com/v3/userserv/user/profile_service/get_simple_profile_by_token";
        
        // ดักจับ API headers
        const result = await captureApiHeaders(activityUrl, targetApiUrl);
        
        console.log("\n" + "=".repeat(80));
        console.log("✅ สรุปผลลัพธ์:");
        console.log("=".repeat(80));
        
        if (result.request) {
            console.log("\n✅ ดักจับ Request สำเร็จ!");
            console.log(`   URL: ${result.request.url}`);
            console.log(`   Method: ${result.request.method}`);
            console.log(`   Headers count: ${Object.keys(result.request.headers).length}`);
        } else {
            console.log("\n⚠️  ไม่พบ Request");
        }
        
        if (result.response) {
            console.log("\n✅ ดักจับ Response สำเร็จ!");
            console.log(`   Status: ${result.response.status} ${result.response.statusText}`);
        }
        
        console.log(`\n💾 ข้อมูลถูกบันทึกในไฟล์ JSON แล้ว`);

    } catch (err) {
        console.log("\n❌ เกิดข้อผิดพลาด:");
        console.log("Error:", err.message);
        if (err.stack) {
            console.log("Stack:", err.stack);
        }
    }
})();
