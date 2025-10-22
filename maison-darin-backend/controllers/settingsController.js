const settingsService = require('../services/settingsService');
const logger = require('../utils/logger');

class SettingsController {
  /**
   * Get all settings
   * GET /api/settings
   */
  async getSettings(req, res) {
    try {
      const settings = await settingsService.getSettings();
      
      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      logger.error('Error getting settings:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SETTINGS_FETCH_ERROR',
          message: 'Failed to fetch settings',
          details: error.message
        }
      });
    }
  }

  /**
   * Update settings
   * PUT /api/settings
   */
  async updateSettings(req, res) {
    try {
      const { settings: updates } = req.body;
      const updatedBy = req.user.id;

      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Settings updates must be provided as an object',
            details: 'Request body must contain settings object'
          }
        });
      }

      const updatedSettings = await settingsService.updateSettings(updates, updatedBy);

      res.json({
        success: true,
        data: updatedSettings
      });
    } catch (error) {
      logger.error('Error updating settings:', error);
      
      if (error.message.includes('validation') || error.message.includes('must be')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Settings validation failed',
            details: error.message
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'SETTINGS_UPDATE_ERROR',
          message: 'Failed to update settings',
          details: error.message
        }
      });
    }
  }

  /**
   * Get specific setting section
   * GET /api/settings/:section
   */
  async getSettingSection(req, res) {
    try {
      const { section } = req.params;
      
      const sectionData = await settingsService.getSettingSection(section);
      
      res.json({
        success: true,
        data: {
          section,
          settings: sectionData
        }
      });
    } catch (error) {
      logger.error('Error getting setting section:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'SECTION_NOT_FOUND',
            message: 'Settings section not found',
            details: error.message
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'SECTION_FETCH_ERROR',
          message: 'Failed to fetch setting section',
          details: error.message
        }
      });
    }
  }

  /**
   * Update specific setting section
   * PUT /api/settings/:section
   */
  async updateSettingSection(req, res) {
    try {
      const { section } = req.params;
      const { settings: updates } = req.body;
      const updatedBy = req.user.id;

      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Section updates must be provided as an object',
            details: 'Request body must contain settings object'
          }
        });
      }

      const updatedSection = await settingsService.updateSettingSection(section, updates, updatedBy);

      res.json({
        success: true,
        data: {
          section,
          settings: updatedSection
        }
      });
    } catch (error) {
      logger.error('Error updating setting section:', error);
      
      if (error.message.includes('validation') || error.message.includes('must be')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Section validation failed',
            details: error.message
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'SECTION_UPDATE_ERROR',
          message: 'Failed to update setting section',
          details: error.message
        }
      });
    }
  }

  /**
   * Get site information for frontend
   * GET /api/settings/site-info
   */
  async getSiteInfo(req, res) {
    try {
      const { language = 'en' } = req.query;
      
      const siteInfo = await settingsService.getSiteInfo(language);
      
      res.json({
        success: true,
        data: siteInfo
      });
    } catch (error) {
      logger.error('Error getting site info:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SITE_INFO_ERROR',
          message: 'Failed to fetch site information',
          details: error.message
        }
      });
    }
  }

  /**
   * Get shipping settings for frontend
   * GET /api/settings/shipping
   */
  async getShippingSettings(req, res) {
    try {
      const shippingSettings = await settingsService.getShippingSettings();
      
      res.json({
        success: true,
        data: shippingSettings
      });
    } catch (error) {
      logger.error('Error getting shipping settings:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SHIPPING_SETTINGS_ERROR',
          message: 'Failed to fetch shipping settings',
          details: error.message
        }
      });
    }
  }

  /**
   * Calculate shipping cost
   * POST /api/settings/calculate-shipping
   */
  async calculateShipping(req, res) {
    try {
      const { countryCode, orderTotal = 0, shippingType = 'standard' } = req.body;

      if (!countryCode) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Country code is required',
            details: 'Request body must contain countryCode'
          }
        });
      }

      const shippingCalculation = await settingsService.calculateShipping(
        countryCode, 
        orderTotal, 
        shippingType
      );

      res.json({
        success: true,
        data: shippingCalculation
      });
    } catch (error) {
      logger.error('Error calculating shipping:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SHIPPING_CALCULATION_ERROR',
          message: 'Failed to calculate shipping',
          details: error.message
        }
      });
    }
  }

  /**
   * Get tax settings for frontend
   * GET /api/settings/taxes
   */
  async getTaxSettings(req, res) {
    try {
      const taxSettings = await settingsService.getTaxSettings();
      
      res.json({
        success: true,
        data: taxSettings
      });
    } catch (error) {
      logger.error('Error getting tax settings:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'TAX_SETTINGS_ERROR',
          message: 'Failed to fetch tax settings',
          details: error.message
        }
      });
    }
  }

  /**
   * Calculate tax amount
   * POST /api/settings/calculate-tax
   */
  async calculateTax(req, res) {
    try {
      const { amount, countryCode } = req.body;

      if (!amount || !countryCode) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Amount and country code are required',
            details: 'Request body must contain amount and countryCode'
          }
        });
      }

      const taxCalculation = await settingsService.calculateTax(amount, countryCode);

      res.json({
        success: true,
        data: taxCalculation
      });
    } catch (error) {
      logger.error('Error calculating tax:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'TAX_CALCULATION_ERROR',
          message: 'Failed to calculate tax',
          details: error.message
        }
      });
    }
  }

  /**
   * Export settings
   * GET /api/settings/export
   */
  async exportSettings(req, res) {
    try {
      const exportData = await settingsService.exportSettings();
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="maison-darin-settings.json"');
      
      res.json(exportData);
    } catch (error) {
      logger.error('Error exporting settings:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'EXPORT_ERROR',
          message: 'Failed to export settings',
          details: error.message
        }
      });
    }
  }

  /**
   * Import settings
   * POST /api/settings/import
   */
  async importSettings(req, res) {
    try {
      const importData = req.body;
      const updatedBy = req.user.id;

      if (!importData || typeof importData !== 'object') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Import data must be provided as an object',
            details: 'Request body must contain valid settings export data'
          }
        });
      }

      const importedSettings = await settingsService.importSettings(importData, updatedBy);

      res.json({
        success: true,
        data: importedSettings
      });
    } catch (error) {
      logger.error('Error importing settings:', error);
      
      if (error.message.includes('Invalid import data') || error.message.includes('validation')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_IMPORT_DATA',
            message: 'Invalid import data format',
            details: error.message
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'IMPORT_ERROR',
          message: 'Failed to import settings',
          details: error.message
        }
      });
    }
  }

  /**
   * Reset settings to defaults
   * POST /api/settings/reset
   */
  async resetSettings(req, res) {
    try {
      const updatedBy = req.user.id;
      
      const resetSettings = await settingsService.resetSettings(updatedBy);

      res.json({
        success: true,
        data: resetSettings,
        message: 'Settings reset to defaults successfully'
      });
    } catch (error) {
      logger.error('Error resetting settings:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'RESET_ERROR',
          message: 'Failed to reset settings',
          details: error.message
        }
      });
    }
  }

  /**
   * Get payment gateways settings (masked for security)
   * GET /api/settings/payment-gateways
   */
  async getPaymentGateways(req, res) {
    try {
      const paymentGateways = await settingsService.getPaymentGateways();
      
      res.json({
        success: true,
        data: paymentGateways
      });
    } catch (error) {
      logger.error('Error getting payment gateways:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PAYMENT_GATEWAYS_ERROR',
          message: 'Failed to fetch payment gateways settings',
          details: error.message
        }
      });
    }
  }

  /**
   * Update payment gateway settings
   * PUT /api/settings/payment-gateways/:gateway
   */
  async updatePaymentGateway(req, res) {
    try {
      const { gateway } = req.params;
      const { settings: gatewaySettings } = req.body;
      const updatedBy = req.user.id;

      if (!gatewaySettings || typeof gatewaySettings !== 'object') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Gateway settings must be provided as an object',
            details: 'Request body must contain settings object'
          }
        });
      }

      const validGateways = ['paymob', 'fawry', 'paypal', 'bankTransfer'];
      if (!validGateways.includes(gateway)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_GATEWAY',
            message: 'Invalid payment gateway',
            details: `Gateway must be one of: ${validGateways.join(', ')}`
          }
        });
      }

      const updatedGateway = await settingsService.updatePaymentGateway(
        gateway,
        gatewaySettings,
        updatedBy
      );

      res.json({
        success: true,
        data: updatedGateway,
        message: 'Payment gateway settings updated successfully'
      });
    } catch (error) {
      logger.error('Error updating payment gateway:', error);
      
      if (error.message.includes('validation')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Gateway settings validation failed',
            details: error.message
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'GATEWAY_UPDATE_ERROR',
          message: 'Failed to update payment gateway settings',
          details: error.message
        }
      });
    }
  }

  /**
   * Test payment gateway connection
   * POST /api/settings/payment-gateways/:gateway/test
   */
  async testPaymentGateway(req, res) {
    try {
      const { gateway } = req.params;

      const validGateways = ['paymob', 'fawry', 'paypal'];
      if (!validGateways.includes(gateway)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_GATEWAY',
            message: 'Invalid payment gateway for testing',
            details: `Gateway must be one of: ${validGateways.join(', ')}`
          }
        });
      }

      const testResult = await settingsService.testPaymentGateway(gateway);

      res.json({
        success: true,
        data: testResult
      });
    } catch (error) {
      logger.error('Error testing payment gateway:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GATEWAY_TEST_ERROR',
          message: 'Failed to test payment gateway connection',
          details: error.message
        }
      });
    }
  }

  /**
   * Get payment gateway status
   * GET /api/settings/payment-gateways/status
   */
  async getPaymentGatewaysStatus(req, res) {
    try {
      const status = await settingsService.getPaymentGatewaysStatus();
      
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Error getting payment gateways status:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GATEWAY_STATUS_ERROR',
          message: 'Failed to fetch payment gateways status',
          details: error.message
        }
      });
    }
  }
}

module.exports = new SettingsController();