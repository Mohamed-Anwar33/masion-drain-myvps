const Content = require('../models/Content');
const logger = require('../utils/logger');

class ContentService {
  /**
   * Get content by section and language with fallback support
   * @param {string} section - Content section (hero, about, nav, etc.)
   * @param {string} language - Language code (en, ar)
   * @returns {Object} Content object or null
   */
  async getContent(section, language = null) {
    try {
      const content = await Content.getLatestBySection(section);
      
      if (!content) {
        logger.warn(`Content not found for section: ${section}`);
        return null;
      }

      // If no specific language requested, return both languages
      if (!language) {
        return {
          section: content.section,
          content: content.content,
          version: content.version,
          updatedAt: content.updatedAt,
          id: content._id
        };
      }

      // Return specific language with fallback
      const requestedContent = content.content[language];
      const fallbackContent = content.content[language === 'en' ? 'ar' : 'en'];

      return {
        section: content.section,
        content: {
          [language]: requestedContent || fallbackContent
        },
        version: content.version,
        updatedAt: content.updatedAt,
        id: content._id,
        hasFallback: !requestedContent && !!fallbackContent
      };
    } catch (error) {
      logger.error('Error getting content:', error);
      throw new Error(`Failed to get content for section ${section}: ${error.message}`);
    }
  }

  /**
   * Get all content sections with optional language filtering
   * @param {string} language - Optional language filter
   * @returns {Array} Array of content objects
   */
  async getAllContent(language = null) {
    try {
      const sections = ['hero', 'about', 'nav', 'contact', 'collections', 'footer'];
      const contentPromises = sections.map(section => this.getContent(section, language));
      const contentResults = await Promise.all(contentPromises);
      
      // Filter out null results and return as object keyed by section
      const contentMap = {};
      contentResults.forEach((content, index) => {
        if (content) {
          contentMap[sections[index]] = content;
        }
      });

      return contentMap;
    } catch (error) {
      logger.error('Error getting all content:', error);
      throw new Error(`Failed to get all content: ${error.message}`);
    }
  }

  /**
   * Update content for a specific section with versioning
   * @param {string} section - Content section
   * @param {Object} contentData - Content data with en/ar properties
   * @param {string} updatedBy - User ID who is updating
   * @param {string} changeLog - Optional change description
   * @returns {Object} Updated content object
   */
  async updateContent(section, contentData, updatedBy, changeLog = 'Content updated') {
    try {
      // Validate section
      const validSections = ['hero', 'about', 'nav', 'contact', 'collections', 'footer'];
      if (!validSections.includes(section)) {
        throw new Error(`Invalid section: ${section}. Must be one of: ${validSections.join(', ')}`);
      }

      // Validate content structure
      if (!contentData || typeof contentData !== 'object') {
        throw new Error('Content data must be an object');
      }

      if (!contentData.en || !contentData.ar) {
        throw new Error('Content must include both English (en) and Arabic (ar) translations');
      }

      // Create new version using the static method
      const newContent = await Content.createVersion(
        section,
        contentData,
        updatedBy,
        changeLog
      );

      logger.info(`Content updated for section ${section} by user ${updatedBy}`);

      return {
        section: newContent.section,
        content: newContent.content,
        version: newContent.version,
        updatedAt: newContent.updatedAt,
        updatedBy: newContent.updatedBy,
        changeLog: newContent.changeLog,
        id: newContent._id
      };
    } catch (error) {
      logger.error('Error updating content:', error);
      throw new Error(`Failed to update content for section ${section}: ${error.message}`);
    }
  }

  /**
   * Get content history for a specific section
   * @param {string} section - Content section
   * @param {number} limit - Maximum number of history entries to return
   * @returns {Array} Array of content history objects
   */
  async getContentHistory(section, limit = 10) {
    try {
      const history = await Content.getHistory(section, limit);
      
      return history.map(item => ({
        version: item.version,
        isActive: item.isActive,
        updatedAt: item.updatedAt,
        updatedBy: item.updatedBy,
        changeLog: item.changeLog,
        id: item._id
      }));
    } catch (error) {
      logger.error('Error getting content history:', error);
      throw new Error(`Failed to get content history for section ${section}: ${error.message}`);
    }
  }

  /**
   * Rollback content to a specific version
   * @param {string} section - Content section
   * @param {string} versionId - ID of the version to rollback to
   * @param {string} updatedBy - User ID performing the rollback
   * @param {string} changeLog - Optional rollback description
   * @returns {Object} Rolled back content object
   */
  async rollbackContent(section, versionId, updatedBy, changeLog = 'Rolled back to previous version') {
    try {
      // Find the specific version to rollback to
      const targetVersion = await Content.findById(versionId);
      
      if (!targetVersion) {
        throw new Error(`Version not found: ${versionId}`);
      }

      if (targetVersion.section !== section) {
        throw new Error(`Version ${versionId} does not belong to section ${section}`);
      }

      // Perform rollback using the instance method
      const rolledBackContent = await targetVersion.rollback(updatedBy, changeLog);

      logger.info(`Content rolled back for section ${section} to version ${targetVersion.version} by user ${updatedBy}`);

      return {
        section: rolledBackContent.section,
        content: rolledBackContent.content,
        version: rolledBackContent.version,
        updatedAt: rolledBackContent.updatedAt,
        updatedBy: rolledBackContent.updatedBy,
        changeLog: rolledBackContent.changeLog,
        id: rolledBackContent._id
      };
    } catch (error) {
      logger.error('Error rolling back content:', error);
      throw new Error(`Failed to rollback content for section ${section}: ${error.message}`);
    }
  }

  /**
   * Validate content structure for a specific section
   * @param {string} section - Content section
   * @param {Object} contentData - Content data to validate
   * @returns {Object} Validation result with isValid and errors
   */
  validateContentStructure(section, contentData) {
    try {
      const errors = [];

      // Check if content data exists
      if (!contentData || typeof contentData !== 'object') {
        errors.push('Content data must be an object');
        return { isValid: false, errors };
      }

      // Check for required languages
      if (!contentData.en) {
        errors.push('English (en) content is required');
      }
      if (!contentData.ar) {
        errors.push('Arabic (ar) content is required');
      }

      if (errors.length > 0) {
        return { isValid: false, errors };
      }

      // Create a temporary content instance for validation
      const tempContent = new Content({
        section,
        content: contentData,
        updatedBy: '000000000000000000000000' // Dummy ObjectId for validation
      });

      // Use the model's validation method
      const isStructureValid = tempContent.validateContentStructure();
      
      if (!isStructureValid) {
        errors.push(`Invalid content structure for section: ${section}`);
      }

      return {
        isValid: isStructureValid && errors.length === 0,
        errors
      };
    } catch (error) {
      logger.error('Error validating content structure:', error);
      return {
        isValid: false,
        errors: [`Validation error: ${error.message}`]
      };
    }
  }

  /**
   * Get content with fallback mechanism
   * @param {string} section - Content section
   * @param {string} preferredLanguage - Preferred language
   * @param {string} fallbackLanguage - Fallback language
   * @returns {Object} Content with fallback information
   */
  async getContentWithFallback(section, preferredLanguage = 'en', fallbackLanguage = 'ar') {
    try {
      const content = await Content.getLatestBySection(section);
      
      if (!content) {
        return null;
      }

      const preferredContent = content.content[preferredLanguage];
      const fallbackContent = content.content[fallbackLanguage];

      // Determine which content to use
      let finalContent = preferredContent;
      let usedFallback = false;

      if (!preferredContent && fallbackContent) {
        finalContent = fallbackContent;
        usedFallback = true;
      }

      return {
        section: content.section,
        content: finalContent,
        language: usedFallback ? fallbackLanguage : preferredLanguage,
        usedFallback,
        version: content.version,
        updatedAt: content.updatedAt,
        id: content._id
      };
    } catch (error) {
      logger.error('Error getting content with fallback:', error);
      throw new Error(`Failed to get content with fallback for section ${section}: ${error.message}`);
    }
  }

  /**
   * Bulk update multiple content sections
   * @param {Object} contentUpdates - Object with section keys and content values
   * @param {string} updatedBy - User ID performing the updates
   * @param {string} changeLog - Optional change description
   * @returns {Object} Results of bulk update operation
   */
  async bulkUpdateContent(contentUpdates, updatedBy, changeLog = 'Bulk content update') {
    try {
      const results = {
        successful: [],
        failed: []
      };

      const updatePromises = Object.entries(contentUpdates).map(async ([section, contentData]) => {
        try {
          const updatedContent = await this.updateContent(section, contentData, updatedBy, changeLog);
          results.successful.push({
            section,
            content: updatedContent
          });
        } catch (error) {
          results.failed.push({
            section,
            error: error.message
          });
        }
      });

      await Promise.all(updatePromises);

      logger.info(`Bulk content update completed. Successful: ${results.successful.length}, Failed: ${results.failed.length}`);

      return results;
    } catch (error) {
      logger.error('Error in bulk content update:', error);
      throw new Error(`Failed to perform bulk content update: ${error.message}`);
    }
  }
}

module.exports = new ContentService();