import express from 'express';
import { priceLogController } from '../controllers/priceLogController.js';

const router = express.Router();

// POST /api/price-log - Create new price log
router.post('/', priceLogController.createPriceLog);

// GET /api/price-log - Get all price logs
router.get('/', priceLogController.getAllPriceLogs);

// GET /api/price-log/search - Search price logs
router.get('/search', priceLogController.searchPriceLogs);

// GET /api/price-log/stats - Get price log statistics
router.get('/stats', priceLogController.getPriceLogStats);

// GET /api/price-log/scrape-data/:scrapeDataId - Get logs by scrape data ID
router.get('/scrape-data/:scrapeDataId', priceLogController.getLogsByScrapeDataId);

// GET /api/price-log/source/:source - Get logs by source (kkday or klook)
router.get('/source/:source', priceLogController.getLogsBySource);

// GET /api/price-log/history/:scrapeDataId - Get price history
router.get('/history/:scrapeDataId', priceLogController.getPriceHistory);

// GET /api/price-log/:id - Get price log by ID
router.get('/:id', priceLogController.getPriceLogById);

// PUT /api/price-log/:id - Update price log
router.put('/:id', priceLogController.updatePriceLog);

// DELETE /api/price-log/:id - Delete price log
router.delete('/:id', priceLogController.deletePriceLog);

export default router;

