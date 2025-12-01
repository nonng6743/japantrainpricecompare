import express from 'express';
import { headerSettingController } from '../controllers/headerSettingController.js';

const router = express.Router();

// POST /api/header-setting - Create or update header setting
router.post('/', headerSettingController.createHeaderSetting);

// GET /api/header-setting - Get header setting
router.get('/', headerSettingController.getHeaderSetting);

// PUT /api/header-setting - Update header setting (full update)
router.put('/', headerSettingController.updateHeaderSetting);

// PATCH /api/header-setting - Partial update header setting
router.patch('/', headerSettingController.patchHeaderSetting);

export default router;

