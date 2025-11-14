import { priceLogService } from '../services/priceLogService.js';

export const priceLogController = {
  // POST /api/price-log - Create new price log
  async createPriceLog(req, res) {
    try {
      const logData = req.body;

      console.log('📡 API: POST /api/price-log called');
      console.log('📡 Log data:', logData);

      if (!logData.scrape_data_id || !logData.source || !logData.new_price) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: scrape_data_id, source, and new_price are required'
        });
      }

      const createdLog = await priceLogService.createPriceLog(logData);
      console.log('✅ Price log created successfully:', createdLog._id);

      res.status(201).json({
        success: true,
        message: 'Price log created successfully',
        data: createdLog
      });
    } catch (error) {
      console.error('❌ Error creating price log:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // GET /api/price-log - Get all price logs
  async getAllPriceLogs(req, res) {
    try {
      const { page = 1, limit = 50 } = req.query;

      console.log('📡 API: GET /api/price-log called');
      console.log('📡 Page:', page, 'Limit:', limit);

      const result = await priceLogService.getAllPriceLogs(parseInt(page), parseInt(limit));

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('❌ Error getting all price logs:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // GET /api/price-log/:id - Get price log by ID
  async getPriceLogById(req, res) {
    try {
      const { id } = req.params;

      console.log('📡 API: GET /api/price-log/:id called with ID:', id);

      const log = await priceLogService.getPriceLogById(id);

      res.json({
        success: true,
        data: log
      });
    } catch (error) {
      console.error('❌ Error getting price log by ID:', error);
      if (error.message === 'Price log not found') {
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

  // GET /api/price-log/scrape-data/:scrapeDataId - Get logs by scrape data ID
  async getLogsByScrapeDataId(req, res) {
    try {
      const { scrapeDataId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      console.log('📡 API: GET /api/price-log/scrape-data/:scrapeDataId called');
      console.log('📡 Scrape Data ID:', scrapeDataId);

      const result = await priceLogService.getLogsByScrapeDataId(
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

  // GET /api/price-log/source/:source - Get logs by source
  async getLogsBySource(req, res) {
    try {
      const { source } = req.params;
      const { page = 1, limit = 50 } = req.query;

      console.log('📡 API: GET /api/price-log/source/:source called');
      console.log('📡 Source:', source);

      const result = await priceLogService.getLogsBySource(
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

  // GET /api/price-log/history/:scrapeDataId - Get price history
  async getPriceHistory(req, res) {
    try {
      const { scrapeDataId } = req.params;
      const { source, packageIndex } = req.query;

      console.log('📡 API: GET /api/price-log/history/:scrapeDataId called');
      console.log('📡 Scrape Data ID:', scrapeDataId);
      console.log('📡 Source:', source);
      console.log('📡 Package Index:', packageIndex);

      if (!source) {
        return res.status(400).json({
          success: false,
          error: 'Source parameter is required'
        });
      }

      const logs = await priceLogService.getPriceHistory(
        scrapeDataId,
        source,
        packageIndex !== undefined ? parseInt(packageIndex) : null
      );

      res.json({
        success: true,
        data: logs
      });
    } catch (error) {
      console.error('❌ Error getting price history:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // PUT /api/price-log/:id - Update price log
  async updatePriceLog(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      console.log('📡 API: PUT /api/price-log/:id called with ID:', id);
      console.log('📡 Update data:', updateData);

      const updatedLog = await priceLogService.updatePriceLog(id, updateData);
      console.log('✅ Price log updated successfully:', updatedLog._id);

      res.json({
        success: true,
        message: 'Price log updated successfully',
        data: updatedLog
      });
    } catch (error) {
      console.error('❌ Error updating price log:', error);
      if (error.message === 'Price log not found') {
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

  // DELETE /api/price-log/:id - Delete price log
  async deletePriceLog(req, res) {
    try {
      const { id } = req.params;

      console.log('📡 API: DELETE /api/price-log/:id called with ID:', id);

      const deletedLog = await priceLogService.deletePriceLog(id);
      console.log('✅ Price log deleted successfully:', deletedLog._id);

      res.json({
        success: true,
        message: 'Price log deleted successfully',
        data: deletedLog
      });
    } catch (error) {
      console.error('❌ Error deleting price log:', error);
      if (error.message === 'Price log not found') {
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

  // GET /api/price-log/search - Search price logs
  async searchPriceLogs(req, res) {
    try {
      const { page = 1, limit = 50, ...searchCriteria } = req.query;

      console.log('📡 API: GET /api/price-log/search called');
      console.log('📡 Search criteria:', searchCriteria);

      const result = await priceLogService.searchPriceLogs(
        searchCriteria,
        parseInt(page),
        parseInt(limit)
      );

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('❌ Error searching price logs:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // GET /api/price-log/stats - Get price log statistics
  async getPriceLogStats(req, res) {
    try {
      console.log('📡 API: GET /api/price-log/stats called');

      const stats = await priceLogService.getPriceLogStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('❌ Error getting price log statistics:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

