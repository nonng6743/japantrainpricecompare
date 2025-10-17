import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager  # ใช้เพื่อติดตั้ง ChromeDriver อัตโนมัติ

# ใช้ Service แทน executable_path
service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service)

# URL ที่ต้องการเปิด
url = "https://www.kkday.com/api/_nuxt/product/fetch-items-data?pkgOid=1277992&itemOidList=1023769&beginDate=2025-10-16&endDate=2025-11-30&vertical=DEFAULT&shouldInstantCalendar=false&previewToken&itemOidList%5B%5D=1023769"

# ทำการแคปหน้าจอ 10 รอบ
for i in range(10):
    # เปิด URL
    driver.get(url)

    # รอให้หน้าเว็บโหลด
    driver.implicitly_wait(10)  # รอ 10 วินาที

    # แคปหน้าจอ
    screenshot_path = f"screenshot_{i+1}.png"  # ชื่อไฟล์จะเป็น screenshot_1.png, screenshot_2.png, ...
    driver.save_screenshot(screenshot_path)

    print(f"แคปหน้าจอรอบที่ {i+1} เสร็จสิ้น: {screenshot_path}")

    # หน่วงเวลา 5 วินาที
    time.sleep(5)

# ปิด WebDriver
driver.quit()
