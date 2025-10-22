const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

class CloudinaryService {
  constructor() {
    // Configure Cloudinary with environment variables
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });

    // Validate configuration
    this.validateConfig();
  }

  /**
   * Validate Cloudinary configuration
   * @throws {Error} If configuration is invalid
   */
  validateConfig() {
    const requiredVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required Cloudinary environment variables: ${missing.join(', ')}`);
    }
  }

  /**
   * Upload image to Cloudinary with optimization
   * @param {Buffer|string} file - File buffer or file path
   * @param {Object} options - Upload options
   * @param {string} options.folder - Cloudinary folder
   * @param {string} options.publicId - Custom public ID
   * @param {Array} options.tags - Tags for the image
   * @param {Object} options.transformation - Image transformation options
   * @returns {Promise<Object>} Upload result with URL and metadata
   */
  async uploadImage(file, options = {}) {
    try {
      const uploadOptions = {
        folder: options.folder || 'maison-darin',
        resource_type: 'image',
        // format: 'auto',
        quality: 'auto:good',
        // fetch_format: 'auto',
        flags: 'progressive',
        ...options,
        // Generate multiple size variants
        eager: [
          { width: 150, height: 150, crop: 'fill', quality: 'auto:good' }, // thumbnail
          { width: 400, height: 400, crop: 'fill', quality: 'auto:good' }, // medium
          { width: 800, height: 800, crop: 'fill', quality: 'auto:good' }, // large
          { width: 1200, crop: 'scale', quality: 'auto:good' } // extra large
        ],
        eager_async: false
      };

      let uploadResult;
      
      if (Buffer.isBuffer(file)) {
        // Upload from buffer
        uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(file);
        });
      } else {
        // Upload from file path
        uploadResult = await cloudinary.uploader.upload(file, uploadOptions);
      }

      logger.info(`Image uploaded successfully: ${uploadResult.public_id}`);

      return {
        success: true,
        data: {
          publicId: uploadResult.public_id,
          url: uploadResult.secure_url,
          width: uploadResult.width,
          height: uploadResult.height,
          format: uploadResult.format,
          size: uploadResult.bytes,
          createdAt: uploadResult.created_at,
          variants: {
            thumbnail: this.getOptimizedUrl(uploadResult.public_id, { width: 150, height: 150, crop: 'fill' }),
            medium: this.getOptimizedUrl(uploadResult.public_id, { width: 400, height: 400, crop: 'fill' }),
            large: this.getOptimizedUrl(uploadResult.public_id, { width: 800, height: 800, crop: 'fill' }),
            extraLarge: this.getOptimizedUrl(uploadResult.public_id, { width: 1200, crop: 'scale' })
          }
        }
      };
    } catch (error) {
      logger.error('Cloudinary upload error:', error);
      throw new Error(`Image upload failed: ${error.message}`);
    }
  }

  /**
   * Delete image from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteImage(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      
      if (result.result === 'ok') {
        logger.info(`Image deleted successfully: ${publicId}`);
        return {
          success: true,
          message: 'Image deleted successfully'
        };
      } else if (result.result === 'not found') {
        logger.warn(`Image not found for deletion: ${publicId}`);
        return {
          success: false,
          message: 'Image not found'
        };
      } else {
        throw new Error(`Unexpected deletion result: ${result.result}`);
      }
    } catch (error) {
      logger.error('Cloudinary deletion error:', error);
      throw new Error(`Image deletion failed: ${error.message}`);
    }
  }

  /**
   * Get optimized URL for an image
   * @param {string} publicId - Cloudinary public ID
   * @param {Object} transformations - Image transformation options
   * @returns {string} Optimized image URL
   */
  getOptimizedUrl(publicId, transformations = {}) {
    try {
      const defaultTransformations = {
        quality: 'auto:good',
        // fetch_format: 'auto',
        flags: 'progressive'
      };

      const finalTransformations = { ...defaultTransformations, ...transformations };
      
      return cloudinary.url(publicId, {
        secure: true,
        ...finalTransformations
      });
    } catch (error) {
      logger.error('Error generating optimized URL:', error);
      throw new Error(`Failed to generate optimized URL: ${error.message}`);
    }
  }

  /**
   * Bulk delete multiple images
   * @param {Array<string>} publicIds - Array of Cloudinary public IDs
   * @returns {Promise<Object>} Bulk deletion result
   */
  async bulkDelete(publicIds) {
    try {
      if (!Array.isArray(publicIds) || publicIds.length === 0) {
        return {
          success: true,
          deleted: [],
          failed: []
        };
      }

      const result = await cloudinary.api.delete_resources(publicIds);
      
      const deleted = [];
      const failed = [];

      Object.entries(result.deleted).forEach(([publicId, status]) => {
        if (status === 'deleted') {
          deleted.push(publicId);
        } else {
          failed.push({ publicId, reason: status });
        }
      });

      logger.info(`Bulk deletion completed. Deleted: ${deleted.length}, Failed: ${failed.length}`);

      return {
        success: true,
        deleted,
        failed
      };
    } catch (error) {
      logger.error('Cloudinary bulk deletion error:', error);
      throw new Error(`Bulk deletion failed: ${error.message}`);
    }
  }

  /**
   * Get image details from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<Object>} Image details
   */
  async getImageDetails(publicId) {
    try {
      const result = await cloudinary.api.resource(publicId);
      
      return {
        success: true,
        data: {
          publicId: result.public_id,
          url: result.secure_url,
          width: result.width,
          height: result.height,
          format: result.format,
          size: result.bytes,
          createdAt: result.created_at,
          tags: result.tags || []
        }
      };
    } catch (error) {
      if (error.http_code === 404) {
        return {
          success: false,
          message: 'Image not found'
        };
      }
      
      logger.error('Error fetching image details:', error);
      throw new Error(`Failed to fetch image details: ${error.message}`);
    }
  }

  /**
   * Update image tags
   * @param {string} publicId - Cloudinary public ID
   * @param {Array<string>} tags - New tags for the image
   * @returns {Promise<Object>} Update result
   */
  async updateImageTags(publicId, tags) {
    try {
      const result = await cloudinary.uploader.add_tag(tags.join(','), [publicId]);
      
      logger.info(`Tags updated for image: ${publicId}`);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      logger.error('Error updating image tags:', error);
      throw new Error(`Failed to update image tags: ${error.message}`);
    }
  }

  /**
   * Search images by tags or other criteria
   * @param {Object} searchOptions - Search criteria
   * @returns {Promise<Object>} Search results
   */
  async searchImages(searchOptions = {}) {
    try {
      const options = {
        resource_type: 'image',
        max_results: searchOptions.limit || 50,
        ...searchOptions
      };

      const result = await cloudinary.search
        .expression(searchOptions.expression || 'folder:maison-darin')
        .sort_by([['created_at', 'desc']])
        .execute();

      return {
        success: true,
        data: {
          images: result.resources.map(resource => ({
            publicId: resource.public_id,
            url: resource.secure_url,
            width: resource.width,
            height: resource.height,
            format: resource.format,
            size: resource.bytes,
            createdAt: resource.created_at,
            tags: resource.tags || []
          })),
          totalCount: result.total_count,
          nextCursor: result.next_cursor
        }
      };
    } catch (error) {
      logger.error('Error searching images:', error);
      throw new Error(`Image search failed: ${error.message}`);
    }
  }

  /**
   * Test Cloudinary connection
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    try {
      await cloudinary.api.ping();
      logger.info('Cloudinary connection test successful');
      return true;
    } catch (error) {
      logger.error('Cloudinary connection test failed:', error);
      return false;
    }
  }
}

module.exports = new CloudinaryService();
