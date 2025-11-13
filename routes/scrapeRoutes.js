import express from 'express';
import { scrapeController } from '../controllers/scrapeController.js';

const router = express.Router();


// POST /api/scrape - Scrape both KKDay and KLook URLs
router.get('/scrapeloop', scrapeController.scrapeBothloop);

// POST /api/scrape - Scrape both KKDay and KLook URLs
router.post('/', scrapeController.scrapeBoth);

// POST /api/scrape-price - Scrape prices after ฿ symbol
router.post('/price', scrapeController.scrapePrice);

// GET /api/scrape - Get all scrape data
router.get('/', scrapeController.getAllScrapeData);

// GET /api/scrape/:id - Get scrape data by ID
router.get('/:id', scrapeController.getScrapeDataById);

// PUT /api/scrape/:id - Update scrape data by ID
router.put('/:id', scrapeController.updateScrapeData);

// PATCH /api/scrape/:id - Partial update scrape data by ID
router.patch('/:id', scrapeController.patchScrapeData);

// DELETE /api/scrape/:id - Delete scrape data by ID
router.delete('/:id', scrapeController.deleteScrapeData);

// GET /api/scrape/search - Search scrape data
router.get('/search', scrapeController.searchScrapeData);

// GET /api/scrape/stats - Get scrape data statistics
router.get('/stats', scrapeController.getScrapeDataStats);

// PUT /api/scrape/bulk - Bulk update scrape data
router.put('/bulk', scrapeController.bulkUpdateScrapeData);

// GET /api/scrape/stats - Get scrape data statistics
router.post('/getKlook', scrapeController.getKlook);

// GET /api/scrape/stats - Get scrape data statistics
router.post('/getKkday', scrapeController.getKkday);

export default router;
