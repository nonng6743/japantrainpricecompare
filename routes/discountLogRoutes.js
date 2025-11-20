import express from 'express';
import { discountLogController } from '../controllers/discountLogController.js';

const router = express.Router();

// POST /api/discount-log - Create new discount log
router.post('/', discountLogController.createDiscountLog);

// GET /api/discount-log - Get all discount logs
router.get('/', discountLogController.getAllDiscountLogs);

// GET /api/discount-log/search - Search discount logs
router.get('/search', discountLogController.searchDiscountLogs);

// GET /api/discount-log/stats - Get discount log statistics
router.get('/stats', discountLogController.getDiscountLogStats);

// GET /api/discount-log/applied - Get applied discounts only
router.get('/applied', discountLogController.getAppliedDiscounts);

// GET /api/discount-log/skipped - Get skipped discounts only
router.get('/skipped', discountLogController.getSkippedDiscounts);

// GET /api/discount-log/scrape-data/:scrapeDataId - Get logs by scrape data ID
router.get('/scrape-data/:scrapeDataId', discountLogController.getLogsByScrapeDataId);

// GET /api/discount-log/source/:source - Get logs by source (kkday or klook)
router.get('/source/:source', discountLogController.getLogsBySource);

// GET /api/discount-log/:id - Get discount log by ID
router.get('/:id', discountLogController.getDiscountLogById);

// PUT /api/discount-log/:id - Update discount log
router.put('/:id', discountLogController.updateDiscountLog);

// DELETE /api/discount-log/:id - Delete discount log
router.delete('/:id', discountLogController.deleteDiscountLog);

export default router;

