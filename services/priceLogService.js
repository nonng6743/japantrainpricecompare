import PriceLog from '../models/PriceLog.js';
import ScrapeData from '../models/ScrapeData.js';

export const priceLogService = {
  // CREATE - Create new price log
  async createPriceLog(logData) {
    try {
      console.log('🔧 Service: Creating new price log');
      
      const priceLog = new PriceLog(logData);
      
      // Calculate price difference if both old and new prices exist
      if (logData.old_price && logData.new_price) {
        priceLog.calculatePriceDifference();
      }
      
      const savedLog = await priceLog.save();
      console.log('✅ Service: Price log created successfully:', savedLog._id);
      return savedLog;
    } catch (error) {
      console.error('❌ Service: Error creating price log:', error);
      throw error;
    }
  },

  // READ - Get all price logs
  async getAllPriceLogs(page = 1, limit = 50) {
    try {
      console.log('🔧 Service: Getting all price logs');
      
      const skip = (page - 1) * limit;
      const logs = await PriceLog.find()
        .populate('scrape_data_id', 'name_product no_product')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await PriceLog.countDocuments();
      
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
      console.error('❌ Service: Error getting all price logs:', error);
      throw error;
    }
  },

  // READ - Get price log by ID
  async getPriceLogById(id) {
    try {
      console.log('🔧 Service: Getting price log by ID:', id);
      
      const log = await PriceLog.findById(id)
        .populate('scrape_data_id', 'name_product no_product');
      
      if (!log) {
        throw new Error('Price log not found');
      }
      
      console.log('✅ Service: Log found:', log._id);
      return log;
    } catch (error) {
      console.error('❌ Service: Error getting price log by ID:', error);
      throw error;
    }
  },

  // READ - Get logs by scrape data ID
  async getLogsByScrapeDataId(scrapeDataId, page = 1, limit = 50) {
    try {
      console.log('🔧 Service: Getting logs by scrape data ID:', scrapeDataId);
      
      const skip = (page - 1) * limit;
      const logs = await PriceLog.find({ scrape_data_id: scrapeDataId })
        .populate('scrape_data_id', 'name_product no_product')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await PriceLog.countDocuments({ scrape_data_id: scrapeDataId });
      
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
      const logs = await PriceLog.find({ source })
        .populate('scrape_data_id', 'name_product no_product')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await PriceLog.countDocuments({ source });
      
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

  // READ - Get price history for specific package
  async getPriceHistory(scrapeDataId, source, packageIndex = null) {
    try {
      console.log('🔧 Service: Getting price history');
      console.log('   Scrape Data ID:', scrapeDataId);
      console.log('   Source:', source);
      console.log('   Package Index:', packageIndex);
      
      const query = { scrape_data_id: scrapeDataId, source };
      if (packageIndex !== null) {
        query.package_index = packageIndex;
      }
      
      const logs = await PriceLog.find(query)
        .populate('scrape_data_id', 'name_product no_product')
        .sort({ createdAt: -1 });
      
      console.log(`✅ Service: Found ${logs.length} history records`);
      return logs;
    } catch (error) {
      console.error('❌ Service: Error getting price history:', error);
      throw error;
    }
  },

  // UPDATE - Update price log
  async updatePriceLog(id, updateData) {
    try {
      console.log('🔧 Service: Updating price log:', id);
      
      const log = await PriceLog.findById(id);
      if (!log) {
        throw new Error('Price log not found');
      }
      
      // If prices are being updated, recalculate difference
      if (updateData.old_price || updateData.new_price) {
        const oldPrice = updateData.old_price || log.old_price;
        const newPrice = updateData.new_price || log.new_price;
        updateData.old_price = oldPrice;
        updateData.new_price = newPrice;
        
        if (oldPrice && newPrice) {
          const oldPriceNum = parseFloat(String(oldPrice).replace(/[฿$,\s]/g, ""));
          const newPriceNum = parseFloat(String(newPrice).replace(/[฿$,\s]/g, ""));
          
          if (!isNaN(oldPriceNum) && !isNaN(newPriceNum)) {
            updateData.price_difference = newPriceNum - oldPriceNum;
            updateData.price_change_percent = ((newPriceNum - oldPriceNum) / oldPriceNum) * 100;
          }
        }
      }
      
      const updatedLog = await PriceLog.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );
      
      console.log('✅ Service: Price log updated successfully:', updatedLog._id);
      return updatedLog;
    } catch (error) {
      console.error('❌ Service: Error updating price log:', error);
      throw error;
    }
  },

  // DELETE - Delete price log
  async deletePriceLog(id) {
    try {
      console.log('🔧 Service: Deleting price log:', id);
      
      const deletedLog = await PriceLog.findByIdAndDelete(id);
      
      if (!deletedLog) {
        throw new Error('Price log not found');
      }
      
      console.log('✅ Service: Price log deleted successfully:', deletedLog._id);
      return deletedLog;
    } catch (error) {
      console.error('❌ Service: Error deleting price log:', error);
      throw error;
    }
  },

  // SEARCH - Search price logs
  async searchPriceLogs(searchCriteria, page = 1, limit = 50) {
    try {
      console.log('🔧 Service: Searching price logs:', searchCriteria);
      
      const skip = (page - 1) * limit;
      const query = {};
      
      if (searchCriteria.source) {
        query.source = searchCriteria.source;
      }
      if (searchCriteria.scrape_data_id) {
        query.scrape_data_id = searchCriteria.scrape_data_id;
      }
      if (searchCriteria.status) {
        query.status = searchCriteria.status;
      }
      if (searchCriteria.update_method) {
        query.update_method = searchCriteria.update_method;
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
      
      const logs = await PriceLog.find(query)
        .populate('scrape_data_id', 'name_product no_product')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await PriceLog.countDocuments(query);
      
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
      console.error('❌ Service: Error searching price logs:', error);
      throw error;
    }
  },

  // STATISTICS - Get price log statistics
  async getPriceLogStats() {
    try {
      console.log('🔧 Service: Getting price log statistics');
      
      const stats = await PriceLog.aggregate([
        {
          $group: {
            _id: null,
            totalLogs: { $sum: 1 },
            kkdayLogs: {
              $sum: { $cond: [{ $eq: ['$source', 'kkday'] }, 1, 0] }
            },
            klookLogs: {
              $sum: { $cond: [{ $eq: ['$source', 'klook'] }, 1, 0] }
            },
            successLogs: {
              $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
            },
            failedLogs: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
            },
            avgPriceDifference: { $avg: '$price_difference' },
            totalPriceIncrease: {
              $sum: { $cond: [{ $gt: ['$price_difference', 0] }, '$price_difference', 0] }
            },
            totalPriceDecrease: {
              $sum: { $cond: [{ $lt: ['$price_difference', 0] }, '$price_difference', 0] }
            }
          }
        }
      ]);
      
      const result = stats[0] || {
        totalLogs: 0,
        kkdayLogs: 0,
        klookLogs: 0,
        successLogs: 0,
        failedLogs: 0,
        avgPriceDifference: 0,
        totalPriceIncrease: 0,
        totalPriceDecrease: 0
      };
      
      console.log('✅ Service: Statistics retrieved successfully');
      return result;
    } catch (error) {
      console.error('❌ Service: Error getting statistics:', error);
      throw error;
    }
  },

  // Helper - Log price update automatically
  async logPriceUpdate(scrapeDataId, source, packageIndex, oldPrice, newPrice, metadata = {}) {
    try {
      const logData = {
        scrape_data_id: scrapeDataId,
        source,
        package_index: packageIndex,
        old_price: oldPrice,
        new_price: newPrice,
        update_method: 'automatic',
        status: 'success',
        metadata
      };
      
      return await this.createPriceLog(logData);
    } catch (error) {
      console.error('❌ Service: Error logging price update:', error);
      // Don't throw error, just log it so it doesn't break the main flow
      return null;
    }
  }
};

