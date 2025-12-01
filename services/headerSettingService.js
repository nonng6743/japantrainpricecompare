import HeaderSetting from '../models/HeaderSetting.js';

export const headerSettingService = {
  // CREATE or UPDATE - Create or update header setting (only one document allowed)
  async createOrUpdateHeaderSetting(headerText) {
    try {
      console.log('🔧 Service: Creating/Updating header setting');
      
      // Get or create the single document
      let setting = await HeaderSetting.findOne();
      
      if (setting) {
        // Update existing
        setting.header_text = headerText;
        await setting.save();
        console.log('✅ Service: Header setting updated');
      } else {
        // Create new
        setting = await HeaderSetting.create({ header_text: headerText });
        console.log('✅ Service: Header setting created');
      }
      
      return setting;
    } catch (error) {
      console.error('❌ Service: Error creating/updating header setting:', error);
      throw error;
    }
  },

  // GET - Get header setting
  async getHeaderSetting() {
    try {
      console.log('🔧 Service: Getting header setting');
      
      let setting = await HeaderSetting.findOne();
      
      // If no setting exists, create one with empty text
      if (!setting) {
        setting = await HeaderSetting.create({ header_text: "" });
        console.log('✅ Service: Created default header setting');
      }
      
      console.log('✅ Service: Header setting retrieved');
      return setting;
    } catch (error) {
      console.error('❌ Service: Error getting header setting:', error);
      throw error;
    }
  },

  // UPDATE - Update header setting (full update)
  async updateHeaderSetting(headerText) {
    try {
      console.log('🔧 Service: Updating header setting');
      
      let setting = await HeaderSetting.findOne();
      
      if (!setting) {
        throw new Error('Header setting not found. Use POST to create first.');
      }
      
      setting.header_text = headerText;
      await setting.save();
      
      console.log('✅ Service: Header setting updated');
      return setting;
    } catch (error) {
      console.error('❌ Service: Error updating header setting:', error);
      throw error;
    }
  },

  // PATCH - Partial update header setting
  async patchHeaderSetting(headerText) {
    try {
      console.log('🔧 Service: Partially updating header setting');
      
      let setting = await HeaderSetting.findOne();
      
      if (!setting) {
        throw new Error('Header setting not found. Use POST to create first.');
      }
      
      if (headerText !== undefined) {
        setting.header_text = headerText;
      }
      
      await setting.save();
      
      console.log('✅ Service: Header setting partially updated');
      return setting;
    } catch (error) {
      console.error('❌ Service: Error partially updating header setting:', error);
      throw error;
    }
  }
};

