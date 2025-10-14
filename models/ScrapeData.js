import mongoose from 'mongoose';

const scrapeDataSchema = new mongoose.Schema({
  // Product information
  no_product: {
    type: String,
    default: null
  },
  name_product: {
    type: String,
    default: null,
    index: true
  },
  price_product: {
    type: String,
    default: null
  },
  detail: {
    type: String,
    default: null
  },
  
  // KKDay data
  url_kkday: {
    type: String,
    required: true,
    index: true
  },
  extractedText_kkday: {
    type: String,
    default: null
  },
  maxPrice_kkday: {
    type: String,
    default: null
  },
  minPrice_kkday: {
    type: String,
    default: null
  },
  screenshotPath_kkday: {
    type: String,
    default: null
  },
  
  // KLook data
  url_klook: {
    type: String,
    required: true,
    index: true
  },
  extractedText_klook: {
    type: String,
    default: null
  },
  maxPrice_klook: {
    type: String,
    default: null
  },
  minPrice_klook: {
    type: String,
    default: null
  },
  screenshotPath_klook: {
    type: String,
    default: null
  },
  
  // Status and error tracking
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success'
  },
  error: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  collection: 'scrape_data'
});

// Index for better query performance
scrapeDataSchema.index({ url_kkday: 1, createdAt: -1 });
scrapeDataSchema.index({ url_klook: 1, createdAt: -1 });
scrapeDataSchema.index({ status: 1, createdAt: -1 });
scrapeDataSchema.index({ no_product: 1 });
scrapeDataSchema.index({ name_product: 1 });

// Method to get latest scrape data by product number
scrapeDataSchema.statics.getLatestByProductNo = function(no_product) {
  return this.findOne({ no_product }).sort({ createdAt: -1 });
};

// Method to get scrape history by product number
scrapeDataSchema.statics.getHistoryByProductNo = function(no_product, limit = 10) {
  return this.find({ no_product }).sort({ createdAt: -1 }).limit(limit);
};

// Method to get all products
scrapeDataSchema.statics.getAllProducts = function(page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return this.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
};

const ScrapeData = mongoose.model('ScrapeData', scrapeDataSchema);

export default ScrapeData;

