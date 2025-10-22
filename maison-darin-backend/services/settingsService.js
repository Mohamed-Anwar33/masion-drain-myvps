const Settings = require('../models/Settings');
const logger = require('../utils/logger');
const paymobGateway = require('./gateways/paymobGateway');
const fawryGateway = require('./gateways/fawryGateway');
const paypalGateway = require('./gateways/paypalGateway');

class SettingsService {
  /**
   * Get all settings
   * @returns {Object} Settings object
   */
  async getSettings() {
    try {
      const settings = await Settings.getSettings();
      return settings;
    } catch (error) {
      logger.error('Error getting settings:', error);
      throw new Error(`Failed to get settings: ${error.message}`);
    }
  }

  /**
   * Update settings
   * @param {Object} updates - Settings updates
   * @param {string} updatedBy - User ID who is updating
   * @returns {Object} Updated settings object
   */
  async updateSettings(updates, updatedBy) {
    try {
      // Validate updates structure
      this.validateSettingsUpdates(updates);
      
      const settings = await Settings.updateSettings(updates, updatedBy);
      
      logger.info(`Settings updated by user ${updatedBy}`);
      return settings;
    } catch (error) {
      logger.error('Error updating settings:', error);
      throw new Error(`Failed to update settings: ${error.message}`);
    }
  }

  /**
   * Get specific setting section
   * @param {string} section - Setting section name
   * @returns {Object} Section settings
   */
  async getSettingSection(section) {
    try {
      const settings = await this.getSettings();
      
      if (!settings[section]) {
        throw new Error(`Settings section '${section}' not found`);
      }
      
      return settings[section];
    } catch (error) {
      logger.error('Error getting setting section:', error);
      throw new Error(`Failed to get setting section: ${error.message}`);
    }
  }

  /**
   * Update specific setting section
   * @param {string} section - Setting section name
   * @param {Object} updates - Section updates
   * @param {string} updatedBy - User ID who is updating
   * @returns {Object} Updated section
   */
  async updateSettingSection(section, updates, updatedBy) {
    try {
      const fullUpdates = { [section]: updates };
      const settings = await this.updateSettings(fullUpdates, updatedBy);
      
      return settings[section];
    } catch (error) {
      logger.error('Error updating setting section:', error);
      throw new Error(`Failed to update setting section: ${error.message}`);
    }
  }

  /**
   * Get shipping settings for frontend
   * @returns {Object} Shipping settings
   */
  async getShippingSettings() {
    try {
      const settings = await this.getSettings();
      return {
        enableShipping: settings.shipping.enableShipping,
        freeShippingThreshold: settings.shipping.freeShippingThreshold,
        options: [
          settings.shipping.domesticShipping.enabled && {
            type: 'domestic',
            cost: settings.shipping.domesticShipping.cost,
            estimatedDays: settings.shipping.domesticShipping.estimatedDays,
            description: settings.shipping.domesticShipping.description
          },
          settings.shipping.internationalShipping.enabled && {
            type: 'international',
            cost: settings.shipping.internationalShipping.cost,
            estimatedDays: settings.shipping.internationalShipping.estimatedDays,
            description: settings.shipping.internationalShipping.description
          },
          settings.shipping.expressShipping.enabled && {
            type: 'express',
            cost: settings.shipping.expressShipping.cost,
            estimatedDays: settings.shipping.expressShipping.estimatedDays,
            description: settings.shipping.expressShipping.description
          }
        ].filter(Boolean),
        zones: settings.shipping.shippingZones
      };
    } catch (error) {
      logger.error('Error getting shipping settings:', error);
      throw new Error(`Failed to get shipping settings: ${error.message}`);
    }
  }

  /**
   * Get tax settings for frontend
   * @returns {Object} Tax settings
   */
  async getTaxSettings() {
    try {
      const settings = await this.getSettings();
      return {
        enableTaxes: settings.taxes.enableTaxes,
        taxIncludedInPrice: settings.taxes.taxIncludedInPrice,
        defaultTaxRate: settings.taxes.defaultTaxRate,
        displayTaxBreakdown: settings.taxes.displayTaxBreakdown,
        taxRates: settings.taxes.taxRates.filter(rate => rate.enabled)
      };
    } catch (error) {
      logger.error('Error getting tax settings:', error);
      throw new Error(`Failed to get tax settings: ${error.message}`);
    }
  }

  /**
   * Calculate shipping cost for order
   * @param {string} countryCode - Country code
   * @param {number} orderTotal - Order total amount
   * @param {string} shippingType - Shipping type preference
   * @returns {Object} Shipping calculation result
   */
  async calculateShipping(countryCode, orderTotal = 0, shippingType = 'standard') {
    try {
      const settings = await this.getSettings();
      
      if (!settings.shipping.enableShipping) {
        return {
          cost: 0,
          isFree: false,
          reason: 'Shipping disabled'
        };
      }
      
      // Check free shipping threshold
      if (orderTotal >= settings.shipping.freeShippingThreshold) {
        return {
          cost: 0,
          isFree: true,
          reason: 'Free shipping threshold met'
        };
      }
      
      const cost = settings.getShippingCost(countryCode, shippingType);
      
      return {
        cost,
        isFree: false,
        type: shippingType,
        countryCode
      };
    } catch (error) {
      logger.error('Error calculating shipping:', error);
      throw new Error(`Failed to calculate shipping: ${error.message}`);
    }
  }

  /**
   * Calculate tax for order
   * @param {number} amount - Amount to calculate tax on
   * @param {string} countryCode - Country code
   * @returns {Object} Tax calculation result
   */
  async calculateTax(amount, countryCode) {
    try {
      const settings = await this.getSettings();
      
      if (!settings.taxes.enableTaxes) {
        return {
          taxAmount: 0,
          taxRate: 0,
          taxIncluded: false
        };
      }
      
      const taxRate = settings.getTaxRate(countryCode);
      const taxAmount = settings.calculateTax(amount, countryCode);
      
      return {
        taxAmount,
        taxRate,
        taxIncluded: settings.taxes.taxIncludedInPrice,
        countryCode
      };
    } catch (error) {
      logger.error('Error calculating tax:', error);
      throw new Error(`Failed to calculate tax: ${error.message}`);
    }
  }

  /**
   * Get site information for frontend
   * @param {string} language - Language preference
   * @returns {Object} Site information
   */
  async getSiteInfo(language = 'en') {
    try {
      const settings = await this.getSettings();
      
      return {
        title: settings.site.title[language] || settings.site.title.en,
        tagline: settings.site.tagline[language] || settings.site.tagline.en,
        description: settings.site.description[language] || settings.site.description.en,
        email: settings.site.email,
        phone: settings.site.phone,
        address: settings.site.address,
        socialMedia: settings.site.socialMedia,
        seo: {
          metaTitle: settings.seo.metaTitle[language] || settings.seo.metaTitle.en,
          metaDescription: settings.seo.metaDescription[language] || settings.seo.metaDescription.en,
          keywords: settings.seo.keywords[language] || settings.seo.keywords.en
        },
        appearance: settings.appearance,
        localization: settings.localization
      };
    } catch (error) {
      logger.error('Error getting site info:', error);
      throw new Error(`Failed to get site info: ${error.message}`);
    }
  }

  /**
   * Validate settings updates
   * @param {Object} updates - Settings updates to validate
   */
  validateSettingsUpdates(updates) {
    // Basic validation - can be expanded
    if (updates.shipping) {
      if (updates.shipping.freeShippingThreshold !== undefined && 
          (typeof updates.shipping.freeShippingThreshold !== 'number' || 
           updates.shipping.freeShippingThreshold < 0)) {
        throw new Error('Free shipping threshold must be a positive number');
      }
    }
    
    if (updates.taxes) {
      if (updates.taxes.defaultTaxRate !== undefined && 
          (typeof updates.taxes.defaultTaxRate !== 'number' || 
           updates.taxes.defaultTaxRate < 0 || 
           updates.taxes.defaultTaxRate > 100)) {
        throw new Error('Default tax rate must be between 0 and 100');
      }
    }
    
    if (updates.localization) {
      if (updates.localization.defaultLanguage && 
          !['en', 'ar'].includes(updates.localization.defaultLanguage)) {
        throw new Error('Default language must be either "en" or "ar"');
      }
    }
  }

  /**
   * Reset settings to defaults
   * @param {string} updatedBy - User ID who is resetting
   * @returns {Object} Reset settings
   */
  async resetSettings(updatedBy) {
    try {
      // Delete existing settings
      await Settings.deleteMany({});
      
      // Create new default settings
      const settings = await Settings.getSettings();
      settings.system.updatedBy = updatedBy;
      await settings.save();
      
      logger.info(`Settings reset to defaults by user ${updatedBy}`);
      return settings;
    } catch (error) {
      logger.error('Error resetting settings:', error);
      throw new Error(`Failed to reset settings: ${error.message}`);
    }
  }

  /**
   * Export settings as JSON
   * @returns {Object} Settings export
   */
  async exportSettings() {
    try {
      const settings = await this.getSettings();
      
      return {
        exportDate: new Date().toISOString(),
        version: settings.system.version,
        settings: settings.toObject()
      };
    } catch (error) {
      logger.error('Error exporting settings:', error);
      throw new Error(`Failed to export settings: ${error.message}`);
    }
  }

  /**
   * Import settings from JSON
   * @param {Object} importData - Settings import data
   * @param {string} updatedBy - User ID who is importing
   * @returns {Object} Imported settings
   */
  async importSettings(importData, updatedBy) {
    try {
      if (!importData.settings) {
        throw new Error('Invalid import data format');
      }
      
      // Validate import data
      this.validateSettingsUpdates(importData.settings);
      
      // Update settings
      const settings = await Settings.updateSettings(importData.settings, updatedBy);
      
      logger.info(`Settings imported by user ${updatedBy}`);
      return settings;
    } catch (error) {
      logger.error('Error importing settings:', error);
      throw new Error(`Failed to import settings: ${error.message}`);
    }
  }

  /**
   * Get payment gateways settings (masked for security)
   * @returns {Object} Payment gateways settings
   */
  async getPaymentGateways() {
    try {
      const settings = await this.getSettings();
      
      // Return masked credentials for security
      return settings.getMaskedPaymentGateways().paymentGateways;
    } catch (error) {
      logger.error('Error getting payment gateways:', error);
      throw new Error(`Failed to get payment gateways: ${error.message}`);
    }
  }

  /**
   * Update payment gateway settings
   * @param {string} gateway - Gateway name (paymob, fawry, paypal, bankTransfer)
   * @param {Object} gatewaySettings - Gateway settings to update
   * @param {string} updatedBy - User ID who is updating
   * @returns {Object} Updated gateway settings (masked)
   */
  async updatePaymentGateway(gateway, gatewaySettings, updatedBy) {
    try {
      const updates = {
        paymentGateways: {
          [gateway]: gatewaySettings
        }
      };
      
      await this.updateSettings(updates, updatedBy);
      
      logger.info(`Payment gateway ${gateway} updated by user ${updatedBy}`);
      
      // Return masked settings
      const settings = await this.getSettings();
      return settings.getMaskedPaymentGateways().paymentGateways[gateway];
    } catch (error) {
      logger.error(`Error updating payment gateway ${gateway}:`, error);
      throw new Error(`Failed to update payment gateway: ${error.message}`);
    }
  }

  /**
   * Test payment gateway connection
   * @param {string} gateway - Gateway name
   * @returns {Object} Test result
   */
  async testPaymentGateway(gateway) {
    try {
      const settings = await this.getSettings();
      const decryptedSettings = settings.decryptPaymentGateways();
      const gatewayConfig = decryptedSettings.paymentGateways[gateway];

      if (!gatewayConfig || !gatewayConfig.enabled) {
        return {
          success: false,
          message: `${gateway} gateway is not enabled`,
          status: 'disabled'
        };
      }

      let testResult;

      switch (gateway) {
        case 'paymob':
          // Test Paymob connection
          testResult = await this.testPaymobConnection(gatewayConfig);
          break;
        
        case 'fawry':
          // Test Fawry connection
          testResult = await this.testFawryConnection(gatewayConfig);
          break;
        
        case 'paypal':
          // Test PayPal connection
          testResult = await this.testPayPalConnection(gatewayConfig);
          break;
        
        default:
          throw new Error(`Unknown gateway: ${gateway}`);
      }

      logger.info(`Payment gateway ${gateway} test completed`);
      return testResult;
    } catch (error) {
      logger.error(`Error testing payment gateway ${gateway}:`, error);
      return {
        success: false,
        message: error.message,
        status: 'error'
      };
    }
  }

  /**
   * Test Paymob connection
   * @private
   */
  async testPaymobConnection(config) {
    try {
      // Basic connectivity test - try to authenticate
      const result = await paymobGateway.authenticate();
      
      return {
        success: result.success,
        message: result.success ? 'Paymob connection successful' : 'Paymob authentication failed',
        status: result.success ? 'connected' : 'failed',
        environment: config.environment
      };
    } catch (error) {
      return {
        success: false,
        message: `Paymob test failed: ${error.message}`,
        status: 'error'
      };
    }
  }

  /**
   * Test Fawry connection
   * @private
   */
  async testFawryConnection(config) {
    try {
      // Fawry doesn't have a test endpoint, so we check config validity
      if (!config.credentials.merchantCode || !config.credentials.secretKey) {
        return {
          success: false,
          message: 'Fawry credentials incomplete',
          status: 'invalid_config'
        };
      }

      return {
        success: true,
        message: 'Fawry configuration valid',
        status: 'configured',
        environment: config.environment
      };
    } catch (error) {
      return {
        success: false,
        message: `Fawry test failed: ${error.message}`,
        status: 'error'
      };
    }
  }

  /**
   * Test PayPal connection
   * @private
   */
  async testPayPalConnection(config) {
    try {
      // Test PayPal by getting access token
      const result = await paypalGateway.getAccessToken();
      
      return {
        success: result.success,
        message: result.success ? 'PayPal connection successful' : 'PayPal authentication failed',
        status: result.success ? 'connected' : 'failed',
        environment: config.environment
      };
    } catch (error) {
      return {
        success: false,
        message: `PayPal test failed: ${error.message}`,
        status: 'error'
      };
    }
  }

  /**
   * Get payment gateways status
   * @returns {Object} Status of all payment gateways
   */
  async getPaymentGatewaysStatus() {
    try {
      const settings = await this.getSettings();
      const gateways = settings.paymentGateways;

      return {
        paymob: {
          enabled: gateways.paymob?.enabled || false,
          environment: gateways.paymob?.environment || 'sandbox',
          configured: !!(gateways.paymob?.credentials?.apiKey && gateways.paymob?.credentials?.secretKey)
        },
        fawry: {
          enabled: gateways.fawry?.enabled || false,
          environment: gateways.fawry?.environment || 'sandbox',
          configured: !!(gateways.fawry?.credentials?.merchantCode && gateways.fawry?.credentials?.secretKey)
        },
        paypal: {
          enabled: gateways.paypal?.enabled || false,
          environment: gateways.paypal?.environment || 'sandbox',
          configured: !!(gateways.paypal?.credentials?.clientId && gateways.paypal?.credentials?.clientSecret)
        },
        bankTransfer: {
          enabled: gateways.bankTransfer?.enabled || false,
          accountsConfigured: gateways.bankTransfer?.accounts?.length || 0
        }
      };
    } catch (error) {
      logger.error('Error getting payment gateways status:', error);
      throw new Error(`Failed to get payment gateways status: ${error.message}`);
    }
  }
}

module.exports = new SettingsService();