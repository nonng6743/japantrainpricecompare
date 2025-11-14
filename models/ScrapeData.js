import mongoose from "mongoose"

// 🧩 Subdocument สำหรับแพ็กเกจย่อย (KKday / Klook / อื่นๆ)
const packageSchema = new mongoose.Schema(
  {
    priceJP: {
      type: String,
      default: null,
    },
    name: {
      type: String,
      default: null, // เช่น "Kyushu Rail Pass 3 Days"
    },
    day: {
      type: String,
      default: null, 
    },
    detail: {
      type: String,
      default: null,
    },
    price: {
      type: String,
      default: null,
    },
    screenshotPath: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["success", "failed"],
      default: "success",
    },
    error: {
      type: String,
      default: null,
    },
  },
  { _id: false, timestamps: true } // ⬅️ ไม่ต้องสร้าง _id แยกให้ subdoc
)

// 🧱 Schema หลักของ Product
const scrapeDataSchema = new mongoose.Schema(
  {
    no_product: {
      type: String,
      default: null,
      index: true,
    },
    name_product: {
      type: String,
      default: null,
      index: true,
    },
    price_product: {
      type: String,
      default: null,
    },
    price_disc_pct_limit: {
      type: Number,
      default: 0,
    },
    price_disc_pct: {
      type: Number,
      default: 0,
    },
    detail: {
      type: String,
      default: null,
    },
    category: {
      type: String,
      default: null, // หมวดหมู่สินค้า
    },
    tags: {
      type: [String],
      default: [], // tags สำหรับค้นหา
    },
    // KKday data
    url_kkday: {
      type: String,
      default: null,
    },
    packages_kkday: {
      type: [packageSchema], // ⬅️ เก็บแพ็กเกจทั้งหมดใน array เดียว
      default: [],
    },
    kkday_status: {
      type: String,
      enum: ["success", "failed", "not_scraped"],
      default: "not_scraped",
    },
    kkday_last_scraped: {
      type: Date,
      default: null,
    },
    // Klook data
    url_klook: {
      type: String,
      default: null,
    },
    packages_klook: {
      type: [packageSchema], // ⬅️ เก็บแพ็กเกจทั้งหมดใน array เดียว
      default: [],
    },
    klook_status: {
      type: String,
      enum: ["success", "failed", "not_scraped"],
      default: "not_scraped",
    },
    price_difference: {
      type: Number,
      default: null, // ความแตกต่างของราคา
    },
    last_updated: {
      type: Date,
      default: Date.now,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "scrape_data",
  }
)

// 🔍 Indexes สำหรับค้นหาเร็วขึ้น
scrapeDataSchema.index({ no_product: 1 })
scrapeDataSchema.index({ name_product: 1 })
scrapeDataSchema.index({ category: 1 })
scrapeDataSchema.index({ tags: 1 })
scrapeDataSchema.index({ "packages_kkday.source": 1 })
scrapeDataSchema.index({ "packages_klook.source": 1 })
scrapeDataSchema.index({ kkday_status: 1 })
scrapeDataSchema.index({ klook_status: 1 })
scrapeDataSchema.index({ min_price: 1 })
scrapeDataSchema.index({ max_price: 1 })
scrapeDataSchema.index({ best_deal_source: 1 })
scrapeDataSchema.index({ is_active: 1 })
scrapeDataSchema.index({ createdAt: -1 })
scrapeDataSchema.index({ last_updated: -1 })

// 🧠 Static methods
scrapeDataSchema.statics.getLatestByProductNo = function (no_product) {
  return this.findOne({ no_product, is_active: true }).sort({ createdAt: -1 })
}

scrapeDataSchema.statics.getHistoryByProductNo = function (no_product, limit = 10) {
  return this.find({ no_product }).sort({ createdAt: -1 }).limit(limit)
}

scrapeDataSchema.statics.getAllProducts = function (page = 1, limit = 10) {
  const skip = (page - 1) * limit
  return this.find({ is_active: true }).sort({ createdAt: -1 }).skip(skip).limit(limit)
}

scrapeDataSchema.statics.getProductsByCategory = function (category, page = 1, limit = 10) {
  const skip = (page - 1) * limit
  return this.find({ category, is_active: true }).sort({ createdAt: -1 }).skip(skip).limit(limit)
}

scrapeDataSchema.statics.getBestDeals = function (limit = 10) {
  return this.find({ 
    best_deal_source: { $ne: "none" }, 
    is_active: true 
  }).sort({ price_difference: -1 }).limit(limit)
}

scrapeDataSchema.statics.getPriceComparison = function (no_product) {
  return this.findOne({ no_product, is_active: true })
    .select('name_product min_price max_price best_deal_source price_difference packages_kkday packages_klook')
}

scrapeDataSchema.statics.searchProducts = function (query, page = 1, limit = 10) {
  const skip = (page - 1) * limit
  const searchRegex = new RegExp(query, 'i')
  return this.find({
    $or: [
      { name_product: searchRegex },
      { tags: { $in: [searchRegex] } },
      { category: searchRegex }
    ],
    is_active: true
  }).sort({ createdAt: -1 }).skip(skip).limit(limit)
}

scrapeDataSchema.statics.getFailedScrapes = function (source = null) {
  const query = { is_active: true }
  if (source) {
    query[`${source}_status`] = "failed"
  } else {
    query.$or = [
      { kkday_status: "failed" },
      { klook_status: "failed" }
    ]
  }
  return this.find(query).sort({ last_updated: -1 })
}

// 🧠 Instance methods
scrapeDataSchema.methods.updatePriceComparison = function() {
  const allPackages = [...this.packages_kkday, ...this.packages_klook]
  const validPackages = allPackages.filter(pkg => pkg.numericPrice && pkg.status === 'success')
  
  if (validPackages.length > 0) {
    const prices = validPackages.map(pkg => pkg.numericPrice)
    this.min_price = Math.min(...prices)
    this.max_price = Math.max(...prices)
    this.total_packages = allPackages.length
    this.active_packages = validPackages.length
    
    // Determine best deal source
    const kkdayPrices = this.packages_kkday.filter(pkg => pkg.numericPrice && pkg.status === 'success').map(pkg => pkg.numericPrice)
    const klookPrices = this.packages_klook.filter(pkg => pkg.numericPrice && pkg.status === 'success').map(pkg => pkg.numericPrice)
    
    if (kkdayPrices.length > 0 && klookPrices.length > 0) {
      const kkdayMin = Math.min(...kkdayPrices)
      const klookMin = Math.min(...klookPrices)
      this.best_deal_source = kkdayMin < klookMin ? "kkday" : "klook"
      this.price_difference = Math.abs(kkdayMin - klookMin)
    } else if (kkdayPrices.length > 0) {
      this.best_deal_source = "kkday"
    } else if (klookPrices.length > 0) {
      this.best_deal_source = "klook"
    }
  }
  
  this.last_updated = new Date()
  return this.save()
}

const ScrapeData = mongoose.model("ScrapeData", scrapeDataSchema)
export default ScrapeData
