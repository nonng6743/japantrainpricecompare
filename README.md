# Japan Train Price Compare - Backend

เว็บสคราปเพอร์สำหรับเปรียบเทียบราคาตั๋วรถไฟญี่ปุ่นจาก KKDay และ KLook

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 หรือสูงกว่า)
- MongoDB (ติดตั้งและรันอยู่)
- npm หรือ yarn

### Installation

1. ติดตั้ง dependencies:
```bash
npm install
```

2. สร้างไฟล์ `.env` จากตัวอย่าง:
```bash
cp .env.example .env
```

3. แก้ไขไฟล์ `.env` ตามต้องการ:
```env
# Server Configuration
PORT=4000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/web-scraper

# Screenshot Configuration
SCREENSHOT_WAIT_TIME=5000

# OCR Configuration
OCR_LANGUAGES=eng+tha
```

### Running the Application

#### Development Mode (with auto-reload):
```bash
npm run dev
```

#### Production Mode:
```bash
npm start
```

Server จะรันที่: `http://localhost:4000`

## 📡 API Endpoints

### 1. POST `/api/scrape`
Scrape ทั้ง KKDay และ KLook URLs

**Request Body:**
```json
{
  "no_product": "1",
  "name_product": "JR Pass",
  "price_product": "10000",
  "url_kkday": "https://www.kkday.com/...",
  "url_klook": "https://www.klook.com/...",
  "detail": "รายละเอียด"
}
```

### 2. POST `/api/scrape-price`
Scrape ราคาหลังเครื่องหมาย ฿

**Request Body:**
```json
{
  "url": "https://www.klook.com/..."
}
```

### 3. GET `/api/scrape`
ดึงข้อมูลทั้งหมดจาก MongoDB

### 4. GET `/api/scrape/:id`
ดึงข้อมูลตาม id

## 🛠️ Technologies Used

- **Express.js** - Web framework
- **MongoDB/Mongoose** - Database
- **Tesseract.js** - OCR (Optical Character Recognition)
- **screenshot-desktop** - Screenshot capture
- **dotenv** - Environment variables
- **nodemon** - Development auto-reload

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | พอร์ตของเซิร์ฟเวอร์ | 4000 |
| NODE_ENV | สภาพแวดล้อม (development/production) | development |
| MONGODB_URI | URI ของ MongoDB | mongodb://localhost:27017/web-scraper |
| SCREENSHOT_WAIT_TIME | เวลารอหน้าเว็บโหลด (มิลลิวินาที) | 5000 |
| OCR_LANGUAGES | ภาษาสำหรับ OCR | eng+tha |

## 📦 Project Structure

```
.
├── config/
│   └── database.js      # MongoDB configuration
├── models/
│   └── ScrapeData.js    # MongoDB schema
├── index.js             # Main application file
├── package.json         # Dependencies
├── nodemon.json         # Nodemon configuration
├── .env                 # Environment variables (not in git)
└── .env.example         # Environment variables template
```

## 🔧 Development

ใช้ `nodemon` สำหรับ auto-reload ระหว่างพัฒนา:

```bash
npm run dev
```

## 📸 Screenshots

เซิร์ฟเวอร์จะบันทึก screenshots ไว้ที่:
- `kkday.png` - Screenshot จาก KKDay
- `price_screenshot.png` - Screenshot จาก KLook

## 🐛 Troubleshooting

### MongoDB Connection Error
ตรวจสอบว่า MongoDB รันอยู่:
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### Screenshot ไม่สามารถถูกสร้างได้
ตรวจสอบว่าระบบปฏิบัติการอนุญาตให้ screenshot ได้

## 📄 License

ISC

