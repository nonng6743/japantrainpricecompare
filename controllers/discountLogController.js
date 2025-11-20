import { discountLogService } from '../services/discountLogService.js';

export const discountLogController = {
  // POST /api/discount-log - Create new discount log
  async createDiscountLog(req, res) {
    try {
      const logData = req.body;

      console.log('📡 API: POST /api/discount-log called');
      console.log('📡 Log data:', logData);

      if (!logData.scrape_data_id || !logData.source || !logData.jp_price || !logData.new_price) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: scrape_data_id, source, jp_price, and new_price are required'
        });
      }

      const createdLog = await discountLogService.createDiscountLog(logData);
      console.log('✅ Discount log created successfully:', createdLog._id);

      res.status(201).json({
        success: true,
        message: 'Discount log created successfully',
        data: createdLog
      });
    } catch (error) {
      console.error('❌ Error creating discount log:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // GET /api/discount-log - Get all discount logs
  async getAllDiscountLogs(req, res) {
    try {
      const { page = 1, limit = 50 } = req.query;

      console.log('📡 API: GET /api/discount-log called');
      console.log('📡 Page:', page, 'Limit:', limit);

      const result = await discountLogService.getAllDiscountLogs(parseInt(page), parseInt(limit));

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('❌ Error getting all discount logs:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // GET /api/discount-log/:id - Get discount log by ID
  async getDiscountLogById(req, res) {
    try {
      const { id } = req.params;

      console.log('📡 API: GET /api/discount-log/:id called with ID:', id);

      const log = await discountLogService.getDiscountLogById(id);

      res.json({
        success: true,
        data: log
      });
    } catch (error) {
      console.error('❌ Error getting discount log by ID:', error);
      if (error.message === 'Discount log not found') {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  },

  // GET /api/discount-log/scrape-data/:scrapeDataId - Get logs by scrape data ID
  async getLogsByScrapeDataId(req, res) {
    try {
      const { scrapeDataId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      console.log('📡 API: GET /api/discount-log/scrape-data/:scrapeDataId called');
      console.log('📡 Scrape Data ID:', scrapeDataId);

      const result = await discountLogService.getLogsByScrapeDataId(
        scrapeDataId,
        parseInt(page),
        parseInt(limit)
      );

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('❌ Error getting logs by scrape data ID:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // GET /api/discount-log/source/:source - Get logs by source
  async getLogsBySource(req, res) {
    try {
      const { source } = req.params;
      const { page = 1, limit = 50 } = req.query;

      console.log('📡 API: GET /api/discount-log/source/:source called');
      console.log('📡 Source:', source);

      const result = await discountLogService.getLogsBySource(
        source,
        parseInt(page),
        parseInt(limit)
      );

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('❌ Error getting logs by source:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // GET /api/discount-log/applied - Get applied discounts only
  async getAppliedDiscounts(req, res) {
    try {
      const { page = 1, limit = 50 } = req.query;

      console.log('📡 API: GET /api/discount-log/applied called');

      const result = await discountLogService.getAppliedDiscounts(parseInt(page), parseInt(limit));

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('❌ Error getting applied discounts:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // GET /api/discount-log/skipped - Get skipped discounts only
  async getSkippedDiscounts(req, res) {
    try {
      const { page = 1, limit = 50 } = req.query;

      console.log('📡 API: GET /api/discount-log/skipped called');

      const result = await discountLogService.getSkippedDiscounts(parseInt(page), parseInt(limit));

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('❌ Error getting skipped discounts:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // PUT /api/discount-log/:id - Update discount log
  async updateDiscountLog(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      console.log('📡 API: PUT /api/discount-log/:id called with ID:', id);
      console.log('📡 Update data:', updateData);

      const updatedLog = await discountLogService.updateDiscountLog(id, updateData);
      console.log('✅ Discount log updated successfully:', updatedLog._id);

      res.json({
        success: true,
        message: 'Discount log updated successfully',
        data: updatedLog
      });
    } catch (error) {
      console.error('❌ Error updating discount log:', error);
      if (error.message === 'Discount log not found') {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  },

  // DELETE /api/discount-log/:id - Delete discount log
  async deleteDiscountLog(req, res) {
    try {
      const { id } = req.params;

      console.log('📡 API: DELETE /api/discount-log/:id called with ID:', id);

      const deletedLog = await discountLogService.deleteDiscountLog(id);
      console.log('✅ Discount log deleted successfully:', deletedLog._id);

      res.json({
        success: true,
        message: 'Discount log deleted successfully',
        data: deletedLog
      });
    } catch (error) {
      console.error('❌ Error deleting discount log:', error);
      if (error.message === 'Discount log not found') {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  },

  // GET /api/discount-log/search - Search discount logs
  async searchDiscountLogs(req, res) {
    try {
      const { page = 1, limit = 50, ...searchCriteria } = req.query;

      console.log('📡 API: GET /api/discount-log/search called');
      console.log('📡 Search criteria:', searchCriteria);

      const result = await discountLogService.searchDiscountLogs(
        searchCriteria,
        parseInt(page),
        parseInt(limit)
      );

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('❌ Error searching discount logs:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // GET /api/discount-log/stats - Get discount log statistics
  async getDiscountLogStats(req, res) {
    try {
      console.log('📡 API: GET /api/discount-log/stats called');

      const stats = await discountLogService.getDiscountLogStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('❌ Error getting discount log statistics:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

