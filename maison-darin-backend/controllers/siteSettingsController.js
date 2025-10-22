const SiteSettings = require('../models/SiteSettings');
const logger = require('../utils/logger');

// Helper function to validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

class SiteSettingsController {
  /**
   * Get site settings
   * GET /api/site-settings
   */
  async getSiteSettings(req, res) {
    try {
      const settings = await SiteSettings.getSiteSettings();
      
      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      logger.error('Error getting site settings', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while retrieving site settings'
        }
      });
    }
  }

  /**
   * Update site settings
   * PUT /api/site-settings
   */
  async updateSiteSettings(req, res) {
    try {
      const updates = req.body;
      
      // Validate required fields for email settings
      if (updates.emailSettings) {
        const { adminEmail, fromEmail, smtpUser } = updates.emailSettings;
        
        if (adminEmail && !isValidEmail(adminEmail)) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid admin email format'
            }
          });
        }
        
        if (fromEmail && !isValidEmail(fromEmail)) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid from email format'
            }
          });
        }
        
        if (smtpUser && !isValidEmail(smtpUser)) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid SMTP user email format'
            }
          });
        }
      }

      const settings = await SiteSettings.updateSiteSettings(updates);
      
      logger.info('Site settings updated', {
        updatedBy: req.user?.id,
        updatedFields: Object.keys(updates)
      });

      res.json({
        success: true,
        data: settings,
        message: 'Site settings updated successfully'
      });
    } catch (error) {
      logger.error('Error updating site settings', {
        error: error.message,
        updates: req.body
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while updating site settings'
        }
      });
    }
  }

  /**
   * Get email settings only
   * GET /api/site-settings/email
   */
  async getEmailSettings(req, res) {
    try {
      const settings = await SiteSettings.getSiteSettings();
      
      res.json({
        success: true,
        data: settings.emailSettings
      });
    } catch (error) {
      logger.error('Error getting email settings', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while retrieving email settings'
        }
      });
    }
  }

  /**
   * Update email settings only
   * PUT /api/site-settings/email
   */
  async updateEmailSettings(req, res) {
    try {
      const emailSettings = req.body;
      
      // Validate email settings
      const { adminEmail, fromEmail, smtpUser } = emailSettings;
      
      if (adminEmail && !this.isValidEmail(adminEmail)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid admin email format'
          }
        });
      }
      
      if (fromEmail && !this.isValidEmail(fromEmail)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid from email format'
          }
        });
      }
      
      if (smtpUser && !this.isValidEmail(smtpUser)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid SMTP user email format'
          }
        });
      }

      const settings = await SiteSettings.updateSiteSettings({
        emailSettings: emailSettings
      });
      
      logger.info('Email settings updated', {
        updatedBy: req.user?.id,
        adminEmail: emailSettings.adminEmail
      });

      res.json({
        success: true,
        data: settings.emailSettings,
        message: 'Email settings updated successfully'
      });
    } catch (error) {
      logger.error('Error updating email settings', {
        error: error.message,
        emailSettings: req.body
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while updating email settings'
        }
      });
    }
  }

  /**
   * Test email configuration
   * POST /api/site-settings/email/test
   */
  async testEmailSettings(req, res) {
    try {
      const emailService = require('../services/emailService');
      const SiteSettings = require('../models/SiteSettings');
      
      // Get current email settings
      const siteSettings = await SiteSettings.getSiteSettings();
      
      // Initialize email service with current settings
      await emailService.updateConfig(siteSettings.emailSettings);
      
      // Test email configuration
      const isValid = await emailService.testEmailConfiguration();
      
      if (!isValid) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'EMAIL_CONFIG_ERROR',
            message: 'Email configuration is invalid. Please check your email settings.'
          }
        });
      }
      
      // Send test email to admin email
      await emailService.sendTestEmail(siteSettings.emailSettings.adminEmail);
      
      res.json({
        success: true,
        message: 'Test email sent successfully'
      });
    } catch (error) {
      logger.error('Error testing email settings', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'EMAIL_TEST_ERROR',
          message: 'Failed to test email configuration'
        }
      });
    }
  }

  /**
   * Get contact information
   * GET /api/site-settings/contact
   */
  async getContactInfo(req, res) {
    try {
      const settings = await SiteSettings.getSiteSettings();
      
      res.json({
        success: true,
        data: settings.contactInfo
      });
    } catch (error) {
      logger.error('Error getting contact info', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while retrieving contact information'
        }
      });
    }
  }

  /**
   * Update contact information
   * PUT /api/site-settings/contact
   */
  async updateContactInfo(req, res) {
    try {
      const contactInfo = req.body;
      
      // Validate email if provided
      if (contactInfo.email && !this.isValidEmail(contactInfo.email)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid email format'
          }
        });
      }

      const settings = await SiteSettings.updateSiteSettings({
        contactInfo: contactInfo
      });
      
      logger.info('Contact info updated', {
        updatedBy: req.user?.id
      });

      res.json({
        success: true,
        data: settings.contactInfo,
        message: 'Contact information updated successfully'
      });
    } catch (error) {
      logger.error('Error updating contact info', {
        error: error.message,
        contactInfo: req.body
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while updating contact information'
        }
      });
    }
  }

  /**
   * Get public site settings (for frontend use)
   * GET /api/public/site-settings
   */
  async getPublicSiteSettings(req, res) {
    try {
      const settings = await SiteSettings.getSiteSettings();
      
      // Return only public information
      const publicSettings = {
        siteInfo: settings.siteInfo,
        contactInfo: settings.contactInfo,
        socialMedia: settings.socialMedia
      };
      
      res.json({
        success: true,
        data: publicSettings
      });
    } catch (error) {
      logger.error('Error getting public site settings', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while retrieving site settings'
        }
      });
    }
  }

}

module.exports = new SiteSettingsController();
