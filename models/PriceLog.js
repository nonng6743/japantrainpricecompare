import mongoose from "mongoose";

// 🧱 Schema สำหรับ Price Log
const priceLogSchema = new mongoose.Schema(
  {
    scrape_data_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ScrapeData",
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: ["kkday", "klook"],
      required: true,
      index: true,
    },
    package_index: {
      type: Number,
      default: null, // Index ของ package ใน array
    },
    package_name: {
      type: String,
      default: null,
    },
    package_day: {
      type: String,
      default: null, // วัน/ระยะเวลา package เช่น "JR TOKYO Wide Pass"
    },
    name_product: {
      type: String,
      default: null, // ชื่อสินค้าหลัก
      index: true,
    },
    old_price: {
      type: String,
      default: null, // ราคาเก่า
    },
    new_price: {
      type: String,
      required: true, // ราคาใหม่
    },
    price_difference: {
      type: Number,
      default: null, // ความแตกต่างของราคา (new - old)
    },
    price_change_percent: {
      type: Number,
      default: null, // เปอร์เซ็นต์การเปลี่ยนแปลง
    },
    sku_id: {
      type: String,
      default: null, // SKU ID สำหรับ KKDay
    },
    update_method: {
      type: String,
      enum: ["manual", "automatic", "cron"],
      default: "automatic",
    },
    status: {
      type: String,
      enum: ["success", "failed"],
      default: "success",
    },
    error_message: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}, // เก็บข้อมูลเพิ่มเติม เช่น params ที่ใช้
    },
  },
  {
    timestamps: true,
    collection: "price_logs",
  }
);

// 🔍 Indexes สำหรับค้นหาเร็วขึ้น
priceLogSchema.index({ scrape_data_id: 1, createdAt: -1 });
priceLogSchema.index({ source: 1, createdAt: -1 });
priceLogSchema.index({ createdAt: -1 });
priceLogSchema.index({ source: 1, scrape_data_id: 1 });

// 🧠 Static methods
priceLogSchema.statics.getLogsByScrapeDataId = function (scrapeDataId, limit = 50) {
  return this.find({ scrape_data_id: scrapeDataId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

priceLogSchema.statics.getLogsBySource = function (source, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  return this.find({ source })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

priceLogSchema.statics.getRecentLogs = function (limit = 100) {
  return this.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("scrape_data_id", "name_product no_product");
};

priceLogSchema.statics.getPriceHistory = function (scrapeDataId, source, packageIndex = null) {
  const query = { scrape_data_id: scrapeDataId, source };
  if (packageIndex !== null) {
    query.package_index = packageIndex;
  }
  return this.find(query).sort({ createdAt: -1 });
};

// 🧠 Instance methods
priceLogSchema.methods.calculatePriceDifference = function () {
  if (this.old_price && this.new_price) {
    const oldPriceNum = parseFloat(String(this.old_price).replace(/[฿$,\s]/g, ""));
    const newPriceNum = parseFloat(String(this.new_price).replace(/[฿$,\s]/g, ""));
    
    if (!isNaN(oldPriceNum) && !isNaN(newPriceNum)) {
      this.price_difference = newPriceNum - oldPriceNum;
      this.price_change_percent = ((newPriceNum - oldPriceNum) / oldPriceNum) * 100;
    }
  }
  return this;
};

const PriceLog = mongoose.model("PriceLog", priceLogSchema);
export default PriceLog;

