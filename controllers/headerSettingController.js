import { headerSettingService } from '../services/headerSettingService.js';

export const headerSettingController = {
  // POST /api/header-setting - Create or update header setting
  async createHeaderSetting(req, res) {
    try {
      const { header_text } = req.body;

      if (header_text === undefined) {
        return res.status(400).json({
          success: false,
          error: 'header_text is required'
        });
      }

      console.log('📡 API: POST /api/header-setting called');

      const setting = await headerSettingService.createOrUpdateHeaderSetting(header_text);

      res.json({
        success: true,
        message: 'Header setting saved successfully',
        data: setting
      });
    } catch (error) {
      console.error('❌ Error creating/updating header setting:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // GET /api/header-setting - Get header setting
  async getHeaderSetting(req, res) {
    try {
      console.log('📡 API: GET /api/header-setting called');

      const setting = await headerSettingService.getHeaderSetting();

      res.json({
        success: true,
        data: setting
      });
    } catch (error) {
      console.error('❌ Error getting header setting:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // PUT /api/header-setting - Update header setting (full update)
  async updateHeaderSetting(req, res) {
    try {
      const { header_text } = req.body;

      if (header_text === undefined) {
        return res.status(400).json({
          success: false,
          error: 'header_text is required'
        });
      }

      console.log('📡 API: PUT /api/header-setting called');

      const setting = await headerSettingService.updateHeaderSetting(header_text);

      res.json({
        success: true,
        message: 'Header setting updated successfully',
        data: setting
      });
    } catch (error) {
      console.error('❌ Error updating header setting:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // PATCH /api/header-setting - Partial update header setting
  async patchHeaderSetting(req, res) {
    try {
      const { header_text } = req.body;

      console.log('📡 API: PATCH /api/header-setting called');

      const setting = await headerSettingService.patchHeaderSetting(header_text);

      res.json({
        success: true,
        message: 'Header setting partially updated successfully',
        data: setting
      });
    } catch (error) {
      console.error('❌ Error partially updating header setting:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

