import DiscountLog from '../models/DiscountLog.js';

export const discountLogService = {
  // CREATE - Create new discount log
  async createDiscountLog(logData) {
    try {
      console.log('🔧 Service: Creating new discount log');
      
      // Calculate discount amount if not provided
      if (logData.old_price && logData.new_price && !logData.discount_amount) {
        logData.discount_amount = logData.old_price - logData.new_price;
      }
      
      const discountLog = new DiscountLog(logData);
      const savedLog = await discountLog.save();
      console.log('✅ Service: Discount log created successfully:', savedLog._id);
      return savedLog;
    } catch (error) {
      console.error('❌ Service: Error creating discount log:', error);
      throw error;
    }
  },

  // READ - Get all discount logs
  async getAllDiscountLogs(page = 1, limit = 50) {
    try {
      console.log('🔧 Service: Getting all discount logs');
      
      const skip = (page - 1) * limit;
      const logs = await DiscountLog.find()
        .populate('scrape_data_id', 'name_product no_product')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await DiscountLog.countDocuments();
      
      console.log(`✅ Service: Found ${logs.length} logs`);
      return {
        data: logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('❌ Service: Error getting all discount logs:', error);
      throw error;
    }
  },

  // READ - Get discount log by ID
  async getDiscountLogById(id) {
    try {
      console.log('🔧 Service: Getting discount log by ID:', id);
      
      const log = await DiscountLog.findById(id)
        .populate('scrape_data_id', 'name_product no_product');
      
      if (!log) {
        throw new Error('Discount log not found');
      }
      
      console.log('✅ Service: Log found:', log._id);
      return log;
    } catch (error) {
      console.error('❌ Service: Error getting discount log by ID:', error);
      throw error;
    }
  },

  // READ - Get logs by scrape data ID
  async getLogsByScrapeDataId(scrapeDataId, page = 1, limit = 50) {
    try {
      console.log('🔧 Service: Getting logs by scrape data ID:', scrapeDataId);
      
      const skip = (page - 1) * limit;
      const logs = await DiscountLog.find({ scrape_data_id: scrapeDataId })
        .populate('scrape_data_id', 'name_product no_product')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await DiscountLog.countDocuments({ scrape_data_id: scrapeDataId });
      
      console.log(`✅ Service: Found ${logs.length} logs for scrape data ID`);
      return {
        data: logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('❌ Service: Error getting logs by scrape data ID:', error);
      throw error;
    }
  },

  // READ - Get logs by source (kkday or klook)
  async getLogsBySource(source, page = 1, limit = 50) {
    try {
      console.log('🔧 Service: Getting logs by source:', source);
      
      if (!['kkday', 'klook'].includes(source)) {
        throw new Error('Invalid source. Must be "kkday" or "klook"');
      }
      
      const skip = (page - 1) * limit;
      const logs = await DiscountLog.find({ source })
        .populate('scrape_data_id', 'name_product no_product')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await DiscountLog.countDocuments({ source });
      
      console.log(`✅ Service: Found ${logs.length} logs for source: ${source}`);
      return {
        data: logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('❌ Service: Error getting logs by source:', error);
      throw error;
    }
  },

  // READ - Get applied discounts only
  async getAppliedDiscounts(page = 1, limit = 50) {
    try {
      console.log('🔧 Service: Getting applied discounts');
      
      const skip = (page - 1) * limit;
      const logs = await DiscountLog.find({ is_applied: true })
        .populate('scrape_data_id', 'name_product no_product')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await DiscountLog.countDocuments({ is_applied: true });
      
      console.log(`✅ Service: Found ${logs.length} applied discounts`);
      return {
        data: logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('❌ Service: Error getting applied discounts:', error);
      throw error;
    }
  },

  // READ - Get skipped discounts only
  async getSkippedDiscounts(page = 1, limit = 50) {
    try {
      console.log('🔧 Service: Getting skipped discounts');
      
      const skip = (page - 1) * limit;
      const logs = await DiscountLog.find({ is_applied: false })
        .populate('scrape_data_id', 'name_product no_product')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await DiscountLog.countDocuments({ is_applied: false });
      
      console.log(`✅ Service: Found ${logs.length} skipped discounts`);
      return {
        data: logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('❌ Service: Error getting skipped discounts:', error);
      throw error;
    }
  },

  // UPDATE - Update discount log
  async updateDiscountLog(id, updateData) {
    try {
      console.log('🔧 Service: Updating discount log:', id);
      
      const log = await DiscountLog.findById(id);
      if (!log) {
        throw new Error('Discount log not found');
      }
      
      // Recalculate discount amount if prices are updated
      if (updateData.old_price || updateData.new_price) {
        const oldPrice = updateData.old_price || log.old_price;
        const newPrice = updateData.new_price || log.new_price;
        if (oldPrice && newPrice) {
          updateData.discount_amount = oldPrice - newPrice;
          if (log.jp_price) {
            updateData.discount_percent = ((log.jp_price - newPrice) / log.jp_price) * 100;
          }
        }
      }
      
      const updatedLog = await DiscountLog.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );
      
      console.log('✅ Service: Discount log updated successfully:', updatedLog._id);
      return updatedLog;
    } catch (error) {
      console.error('❌ Service: Error updating discount log:', error);
      throw error;
    }
  },

  // DELETE - Delete discount log
  async deleteDiscountLog(id) {
    try {
      console.log('🔧 Service: Deleting discount log:', id);
      
      const deletedLog = await DiscountLog.findByIdAndDelete(id);
      
      if (!deletedLog) {
        throw new Error('Discount log not found');
      }
      
      console.log('✅ Service: Discount log deleted successfully:', deletedLog._id);
      return deletedLog;
    } catch (error) {
      console.error('❌ Service: Error deleting discount log:', error);
      throw error;
    }
  },

  // SEARCH - Search discount logs
  async searchDiscountLogs(searchCriteria, page = 1, limit = 50) {
    try {
      console.log('🔧 Service: Searching discount logs:', searchCriteria);
      
      const skip = (page - 1) * limit;
      const query = {};
      
      if (searchCriteria.source) {
        query.source = searchCriteria.source;
      }
      if (searchCriteria.scrape_data_id) {
        query.scrape_data_id = searchCriteria.scrape_data_id;
      }
      if (searchCriteria.is_applied !== undefined) {
        query.is_applied = searchCriteria.is_applied === 'true' || searchCriteria.is_applied === true;
      }
      if (searchCriteria.min_discount_percent || searchCriteria.max_discount_percent) {
        query.discount_percent = {};
        if (searchCriteria.min_discount_percent) {
          query.discount_percent.$gte = parseFloat(searchCriteria.min_discount_percent);
        }
        if (searchCriteria.max_discount_percent) {
          query.discount_percent.$lte = parseFloat(searchCriteria.max_discount_percent);
        }
      }
      if (searchCriteria.startDate || searchCriteria.endDate) {
        query.createdAt = {};
        if (searchCriteria.startDate) {
          query.createdAt.$gte = new Date(searchCriteria.startDate);
        }
        if (searchCriteria.endDate) {
          query.createdAt.$lte = new Date(searchCriteria.endDate);
        }
      }
      
      const logs = await DiscountLog.find(query)
        .populate('scrape_data_id', 'name_product no_product')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await DiscountLog.countDocuments(query);
      
      console.log(`✅ Service: Found ${logs.length} matching logs`);
      return {
        data: logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('❌ Service: Error searching discount logs:', error);
      throw error;
    }
  },

  // STATISTICS - Get discount log statistics
  async getDiscountLogStats() {
    try {
      console.log('🔧 Service: Getting discount log statistics');
      
      const stats = await DiscountLog.aggregate([
        {
          $group: {
            _id: null,
            totalLogs: { $sum: 1 },
            appliedLogs: {
              $sum: { $cond: [{ $eq: ['$is_applied', true] }, 1, 0] }
            },
            skippedLogs: {
              $sum: { $cond: [{ $eq: ['$is_applied', false] }, 1, 0] }
            },
            kkdayLogs: {
              $sum: { $cond: [{ $eq: ['$source', 'kkday'] }, 1, 0] }
            },
            klookLogs: {
              $sum: { $cond: [{ $eq: ['$source', 'klook'] }, 1, 0] }
            },
            avgDiscountPercent: { $avg: '$discount_percent' },
            totalDiscountAmount: { $sum: '$discount_amount' },
            avgDiscountAmount: { $avg: '$discount_amount' }
          }
        }
      ]);
      
      const result = stats[0] || {
        totalLogs: 0,
        appliedLogs: 0,
        skippedLogs: 0,
        kkdayLogs: 0,
        klookLogs: 0,
        avgDiscountPercent: 0,
        totalDiscountAmount: 0,
        avgDiscountAmount: 0
      };
      
      console.log('✅ Service: Statistics retrieved successfully');
      return result;
    } catch (error) {
      console.error('❌ Service: Error getting statistics:', error);
      throw error;
    }
  }
};

