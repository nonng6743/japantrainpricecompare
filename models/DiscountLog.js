import mongoose from "mongoose";

// 🧱 Schema สำหรับ Discount Log
const discountLogSchema = new mongoose.Schema(
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
      default: null,
    },
    name_product: {
      type: String,
      default: null,
      index: true,
    },
    jp_price: {
      type: Number,
      required: true, // ราคา JP (ราคาเดิม)
    },
    old_price: {
      type: Number,
      default: null, // ราคาเก่าก่อนลด
    },
    new_price: {
      type: Number,
      required: true, // ราคาใหม่หลังลด
    },
    discount_percent: {
      type: Number,
      required: true, // เปอร์เซ็นต์ที่ลด
    },
    discount_limit_percent: {
      type: Number,
      required: true, // เปอร์เซ็นต์ limit ที่กำหนด
    },
    discount_amount: {
      type: Number,
      default: null, // จำนวนเงินที่ลด
    },
    is_applied: {
      type: Boolean,
      default: true, // ว่าลดราคาจริงหรือไม่ (ถ้าเกิน limit จะเป็น false)
    },
    reason: {
      type: String,
      default: null, // เหตุผลที่ลดหรือไม่ลด
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}, // เก็บข้อมูลเพิ่มเติม
    },
  },
  {
    timestamps: true,
    collection: "discount_logs",
  }
);

// 🔍 Indexes สำหรับค้นหาเร็วขึ้น
discountLogSchema.index({ scrape_data_id: 1, createdAt: -1 });
discountLogSchema.index({ source: 1, createdAt: -1 });
discountLogSchema.index({ createdAt: -1 });
discountLogSchema.index({ source: 1, scrape_data_id: 1 });
discountLogSchema.index({ is_applied: 1 });

// 🧠 Static methods
discountLogSchema.statics.getLogsByScrapeDataId = function (scrapeDataId, limit = 50) {
  return this.find({ scrape_data_id: scrapeDataId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

discountLogSchema.statics.getLogsBySource = function (source, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  return this.find({ source })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

discountLogSchema.statics.getAppliedDiscounts = function (page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  return this.find({ is_applied: true })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("scrape_data_id", "name_product no_product");
};

discountLogSchema.statics.getSkippedDiscounts = function (page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  return this.find({ is_applied: false })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("scrape_data_id", "name_product no_product");
};

const DiscountLog = mongoose.model("DiscountLog", discountLogSchema);
export default DiscountLog;

