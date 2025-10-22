const contentService = require('../services/contentService');
const logger = require('../utils/logger');

class ContentController {
  /**
   * Get all translations for frontend consumption
   * GET /api/content/translations
   */
  async getTranslations(req, res) {
    try {
      const { language } = req.query;
      
      const allContent = await contentService.getAllContent(language);
      
      res.json({
        success: true,
        data: allContent,
        language: language || 'all'
      });
    } catch (error) {
      logger.error('Error getting translations:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'TRANSLATION_FETCH_ERROR',
          message: 'Failed to fetch translations',
          details: error.message
        }
      });
    }
  }

  /**
   * Bulk update translations for admin panel
   * PUT /api/content/translations
   */
  async updateTranslations(req, res) {
    try {
      const { contentUpdates, changeLog = 'Bulk translation update' } = req.body;
      const updatedBy = req.user.id;

      if (!contentUpdates || typeof contentUpdates !== 'object') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Content updates must be provided as an object',
            details: 'Request body must contain contentUpdates object'
          }
        });
      }

      const results = await contentService.bulkUpdateContent(
        contentUpdates,
        updatedBy,
        changeLog
      );

      const statusCode = results.failed.length > 0 ? 207 : 200; // 207 Multi-Status for partial success

      res.status(statusCode).json({
        success: results.failed.length === 0,
        data: {
          successful: results.successful,
          failed: results.failed,
          summary: {
            total: results.successful.length + results.failed.length,
            successful: results.successful.length,
            failed: results.failed.length
          }
        }
      });
    } catch (error) {
      logger.error('Error updating translations:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'TRANSLATION_UPDATE_ERROR',
          message: 'Failed to update translations',
          details: error.message
        }
      });
    }
  }

  /**
   * Get content for a specific section
   * GET /api/content/:section
   */
  async getSection(req, res) {
    try {
      const { section } = req.params;
      const { language } = req.query;

      const content = await contentService.getContent(section, language);

      if (!content) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CONTENT_NOT_FOUND',
            message: `Content not found for section: ${section}`,
            details: `No content exists for the requested section`
          }
        });
      }

      res.json({
        success: true,
        data: content
      });
    } catch (error) {
      logger.error('Error getting section content:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SECTION_FETCH_ERROR',
          message: 'Failed to fetch section content',
          details: error.message
        }
      });
    }
  }

  /**
   * Update content for a specific section
   * PUT /api/content/:section
   */
  async updateSection(req, res) {
    try {
      const { section } = req.params;
      const { content, changeLog = `Updated ${section} content` } = req.body;
      const updatedBy = req.user.id;

      if (!content) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Content data is required',
            details: 'Request body must contain content object with en and ar properties'
          }
        });
      }

      // Validate content structure before updating
      const validation = contentService.validateContentStructure(section, content);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Content validation failed',
            details: validation.errors
          }
        });
      }

      const updatedContent = await contentService.updateContent(
        section,
        content,
        updatedBy,
        changeLog
      );

      res.json({
        success: true,
        data: updatedContent
      });
    } catch (error) {
      logger.error('Error updating section content:', error);
      
      // Handle specific validation errors
      if (error.message.includes('Invalid section')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_SECTION',
            message: 'Invalid content section',
            details: error.message
          }
        });
      }

      if (error.message.includes('Invalid content structure')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CONTENT_STRUCTURE',
            message: 'Content structure validation failed',
            details: error.message
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'SECTION_UPDATE_ERROR',
          message: 'Failed to update section content',
          details: error.message
        }
      });
    }
  }

  /**
   * Get content history for a specific section
   * GET /api/content/:section/history
   */
  async getSectionHistory(req, res) {
    try {
      const { section } = req.params;
      const { limit = 10 } = req.query;

      const history = await contentService.getContentHistory(section, parseInt(limit));

      res.json({
        success: true,
        data: {
          section,
          history,
          total: history.length
        }
      });
    } catch (error) {
      logger.error('Error getting section history:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'HISTORY_FETCH_ERROR',
          message: 'Failed to fetch section history',
          details: error.message
        }
      });
    }
  }

  /**
   * Rollback content to a specific version
   * POST /api/content/:section/rollback
   */
  async rollbackSection(req, res) {
    try {
      const { section } = req.params;
      const { versionId, changeLog = 'Content rollback' } = req.body;
      const updatedBy = req.user.id;

      if (!versionId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Version ID is required',
            details: 'Request body must contain versionId'
          }
        });
      }

      const rolledBackContent = await contentService.rollbackContent(
        section,
        versionId,
        updatedBy,
        changeLog
      );

      res.json({
        success: true,
        data: rolledBackContent
      });
    } catch (error) {
      logger.error('Error rolling back section content:', error);
      
      if (error.message.includes('Version not found')) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'VERSION_NOT_FOUND',
            message: 'Version not found',
            details: error.message
          }
        });
      }

      if (error.message.includes('does not belong to section')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VERSION_MISMATCH',
            message: 'Version does not belong to the specified section',
            details: error.message
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'ROLLBACK_ERROR',
          message: 'Failed to rollback section content',
          details: error.message
        }
      });
    }
  }

  /**
   * Get content with fallback support
   * GET /api/content/:section/fallback
   */
  async getSectionWithFallback(req, res) {
    try {
      const { section } = req.params;
      const { preferred = 'en', fallback = 'ar' } = req.query;

      const content = await contentService.getContentWithFallback(section, preferred, fallback);

      if (!content) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CONTENT_NOT_FOUND',
            message: `Content not found for section: ${section}`,
            details: 'No content exists for the requested section'
          }
        });
      }

      res.json({
        success: true,
        data: content
      });
    } catch (error) {
      logger.error('Error getting section content with fallback:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FALLBACK_FETCH_ERROR',
          message: 'Failed to fetch section content with fallback',
          details: error.message
        }
      });
    }
  }

  /**
   * Validate content structure for a section
   * POST /api/content/:section/validate
   */
  async validateSection(req, res) {
    try {
      const { section } = req.params;
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Content data is required',
            details: 'Request body must contain content object'
          }
        });
      }

      const validation = contentService.validateContentStructure(section, content);

      res.json({
        success: true,
        data: {
          section,
          isValid: validation.isValid,
          errors: validation.errors
        }
      });
    } catch (error) {
      logger.error('Error validating section content:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Failed to validate section content',
          details: error.message
        }
      });
    }
  }
}

module.exports = new ContentController();