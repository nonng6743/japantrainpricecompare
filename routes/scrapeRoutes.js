import express from 'express';
import { scrapeController } from '../controllers/scrapeController.js';

const router = express.Router();

// POST /api/scrape - Scrape both KKDay and KLook URLs
router.post('/', scrapeController.scrapeBoth);

// POST /api/scrape-price - Scrape prices after ฿ symbol
router.post('/price', scrapeController.scrapePrice);

// GET /api/scrape - Get all scrape data
router.get('/', scrapeController.getAllScrapeData);

// GET /api/scrape/:id - Get scrape data by ID
router.get('/:id', scrapeController.getScrapeDataById);

export default router;
