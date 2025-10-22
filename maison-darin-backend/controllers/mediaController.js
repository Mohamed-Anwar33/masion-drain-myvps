const Media = require('../models/Media');
const cloudinaryService = require('../services/cloudinaryService');
const ImageValidation = require('../utils/imageValidation');
const logger = require('../utils/logger');
const multer = require('multer');
const path = require('path');

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter for image validation
const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
  }
  
  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size && file.size > maxSize) {
    return cb(new Error('File size cannot exceed 5MB'), false);
  }
  
  cb(null, true);
};

// Configure multer upload
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Single file upload
  }
});

class MediaController {
  /**
   * Upload image to Cloudinary and save metadata to database
   * POST /api/media/upload
   */
  static async uploadImage(req, res) {
    try {
      logger.info('📤 Image upload request received');
      logger.info('📋 Request body:', req.body);
      logger.info('📋 Request file:', req.file ? { name: req.file.originalname, size: req.file.size, type: req.file.mimetype } : 'No file');
      
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NO_FILE_UPLOADED',
            message: 'No image file was uploaded'
          }
        });
      }

      const { buffer, originalname, mimetype, size } = req.file;
      const { tags, altEn, altAr, folder } = req.body;

      // Comprehensive file validation
      const fileValidation = ImageValidation.validateFile(req.file, {
        maxSize: 5 * 1024 * 1024 // 5MB
      });

      if (!fileValidation.valid) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'FILE_VALIDATION_ERROR',
            message: fileValidation.error
          }
        });
      }

      // Alt text is optional for now
      // TODO: Make alt text required for accessibility in the future

      // Prepare upload options
      const uploadOptions = {
        folder: folder || 'maison-darin',
        tags: tags ? tags.split(',').map(tag => tag.trim()) : []
      };

      // Upload to Cloudinary
      logger.info('☁️ Uploading to Cloudinary with options:', uploadOptions);
      const cloudinaryResult = await cloudinaryService.uploadImage(buffer, uploadOptions);
      logger.info('☁️ Cloudinary result:', cloudinaryResult.success ? '✅ Success' : '❌ Failed');

      if (!cloudinaryResult.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'UPLOAD_FAILED',
            message: 'Failed to upload image to Cloudinary'
          }
        });
      }

      // Validate processed image from Cloudinary
      const processedImageValidation = ImageValidation.validateProcessedImage(cloudinaryResult, {
        maxSize: 10 * 1024 * 1024, // Allow larger size after processing
        maxWidth: 5000,
        maxHeight: 5000
      });

      if (!processedImageValidation.valid) {
        // If validation fails, try to clean up the uploaded image
        try {
          await cloudinaryService.deleteImage(cloudinaryResult.data.publicId);
        } catch (cleanupError) {
          logger.warn('Failed to cleanup invalid uploaded image:', cleanupError);
        }

        return res.status(400).json({
          success: false,
          error: {
            code: 'PROCESSED_IMAGE_VALIDATION_ERROR',
            message: processedImageValidation.error
          }
        });
      }

      // Create media record in database
      const mediaData = {
        filename: `${Date.now()}-${originalname}`,
        originalName: originalname,
        cloudinaryUrl: cloudinaryResult.data.url,
        cloudinaryId: cloudinaryResult.data.publicId,
        size: size,
        mimetype: mimetype,
        width: cloudinaryResult.data.width,
        height: cloudinaryResult.data.height,
        alt: {
          en: altEn || '',
          ar: altAr || ''
        },
        variants: cloudinaryResult.data.variants,
        tags: uploadOptions.tags,
        uploadedBy: req.user.id
      };

      const media = new Media(mediaData);
      await media.save();

      logger.info(`Image uploaded successfully: ${media.cloudinaryId} by user ${req.user.id}`);

      res.status(201).json({
        success: true,
        data: {
          id: media._id,
          filename: media.filename,
          originalName: media.originalName,
          url: media.cloudinaryUrl,
          cloudinaryId: media.cloudinaryId,
          size: media.size,
          sizeFormatted: media.sizeFormatted,
          mimetype: media.mimetype,
          width: media.width,
          height: media.height,
          aspectRatio: media.aspectRatio,
          alt: media.alt,
          variants: media.variants,
          tags: media.tags,
          uploadedAt: media.uploadedAt
        }
      });

    } catch (error) {
      logger.error('Image upload error:', error);

      // Handle specific multer errors
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: {
              code: 'FILE_TOO_LARGE',
              message: 'File size cannot exceed 5MB'
            }
          });
        }
      }

      // Handle validation errors
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: Object.values(error.errors).map(err => ({
              field: err.path,
              message: err.message
            }))
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while uploading the image'
        }
      });
    }
  }

  /**
   * Get media library with filtering and pagination
   * GET /api/media
   */
  static async getMedia(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        mimetype,
        tags,
        uploadedBy,
        sortBy = 'uploadedAt',
        sortOrder = 'desc'
      } = req.query;

      // Build query options
      const options = {
        limit: Math.min(parseInt(limit), 100), // Max 100 items per page
        skip: (parseInt(page) - 1) * parseInt(limit)
      };

      let mediaQuery;

      if (search) {
        // Use search method for text search
        mediaQuery = Media.searchMedia(search, {
          mimetype,
          uploadedBy,
          ...options
        });
      } else {
        // Build filter query
        const filter = { isActive: true };
        
        if (mimetype) {
          filter.mimetype = mimetype;
        }
        
        if (uploadedBy) {
          filter.uploadedBy = uploadedBy;
        }
        
        if (tags) {
          const tagArray = tags.split(',').map(tag => tag.trim());
          filter.tags = { $in: tagArray };
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        mediaQuery = Media.find(filter)
          .populate('uploadedBy', 'email')
          .sort(sort)
          .limit(options.limit)
          .skip(options.skip);
      }

      const media = await mediaQuery;

      // Get total count for pagination
      const totalQuery = { isActive: true };
      if (mimetype) totalQuery.mimetype = mimetype;
      if (uploadedBy) totalQuery.uploadedBy = uploadedBy;
      if (tags) {
        const tagArray = tags.split(',').map(tag => tag.trim());
        totalQuery.tags = { $in: tagArray };
      }

      const total = await Media.countDocuments(totalQuery);

      res.json({
        success: true,
        data: {
          media: media.map(item => ({
            id: item._id,
            filename: item.filename,
            originalName: item.originalName,
            url: item.cloudinaryUrl,
            cloudinaryId: item.cloudinaryId,
            size: item.size,
            sizeFormatted: item.sizeFormatted,
            mimetype: item.mimetype,
            width: item.width,
            height: item.height,
            aspectRatio: item.aspectRatio,
            alt: item.alt,
            variants: item.variants,
            tags: item.tags,
            usageCount: item.usageCount,
            uploadedBy: item.uploadedBy,
            uploadedAt: item.uploadedAt,
            updatedAt: item.updatedAt
          })),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
            hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
            hasPrev: parseInt(page) > 1
          }
        }
      });

    } catch (error) {
      logger.error('Get media error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching media'
        }
      });
    }
  }

  /**
   * Get single media item by ID
   * GET /api/media/:id
   */
  static async getMediaById(req, res) {
    try {
      const { id } = req.params;

      const media = await Media.findOne({ _id: id, isActive: true })
        .populate('uploadedBy', 'email');

      if (!media) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'MEDIA_NOT_FOUND',
            message: 'Media not found'
          }
        });
      }

      res.json({
        success: true,
        data: {
          id: media._id,
          filename: media.filename,
          originalName: media.originalName,
          url: media.cloudinaryUrl,
          cloudinaryId: media.cloudinaryId,
          size: media.size,
          sizeFormatted: media.sizeFormatted,
          mimetype: media.mimetype,
          width: media.width,
          height: media.height,
          aspectRatio: media.aspectRatio,
          alt: media.alt,
          variants: media.variants,
          tags: media.tags,
          usageCount: media.usageCount,
          uploadedBy: media.uploadedBy,
          uploadedAt: media.uploadedAt,
          updatedAt: media.updatedAt
        }
      });

    } catch (error) {
      logger.error('Get media by ID error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching media'
        }
      });
    }
  }

  /**
   * Delete media item and remove from Cloudinary
   * DELETE /api/media/:id
   */
  static async deleteMedia(req, res) {
    try {
      const { id } = req.params;

      const media = await Media.findOne({ _id: id, isActive: true });

      if (!media) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'MEDIA_NOT_FOUND',
            message: 'Media not found'
          }
        });
      }

      // Delete from Cloudinary
      try {
        const cloudinaryResult = await cloudinaryService.deleteImage(media.cloudinaryId);
        if (!cloudinaryResult.success && cloudinaryResult.message !== 'Image not found') {
          logger.warn(`Failed to delete image from Cloudinary: ${media.cloudinaryId}`);
        }
      } catch (cloudinaryError) {
        logger.warn('Cloudinary deletion error:', cloudinaryError);
        // Continue with database deletion even if Cloudinary fails
      }

      // Soft delete from database
      await media.softDelete();

      logger.info(`Media deleted: ${media.cloudinaryId} by user ${req.user.id}`);

      res.json({
        success: true,
        message: 'Media deleted successfully'
      });

    } catch (error) {
      logger.error('Delete media error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while deleting media'
        }
      });
    }
  }

  /**
   * Update media metadata (alt text, tags)
   * PUT /api/media/:id
   */
  static async updateMediaMetadata(req, res) {
    try {
      const { id } = req.params;
      const { altEn, altAr, tags } = req.body;

      const media = await Media.findOne({ _id: id, isActive: true });

      if (!media) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'MEDIA_NOT_FOUND',
            message: 'Media not found'
          }
        });
      }

      // Update alt text if provided
      if (altEn !== undefined || altAr !== undefined) {
        const altText = {};
        if (altEn !== undefined) altText.en = altEn;
        if (altAr !== undefined) altText.ar = altAr;
        
        await media.updateAltText(altText);
      }

      // Update tags if provided
      if (tags !== undefined) {
        if (Array.isArray(tags)) {
          media.tags = tags.map(tag => tag.toLowerCase().trim());
        } else if (typeof tags === 'string') {
          media.tags = tags.split(',').map(tag => tag.toLowerCase().trim());
        }
        await media.save();
      }

      // Update Cloudinary tags if tags were changed
      if (tags !== undefined) {
        try {
          await cloudinaryService.updateImageTags(media.cloudinaryId, media.tags);
        } catch (cloudinaryError) {
          logger.warn('Failed to update Cloudinary tags:', cloudinaryError);
          // Continue even if Cloudinary update fails
        }
      }

      logger.info(`Media metadata updated: ${media.cloudinaryId} by user ${req.user.id}`);

      res.json({
        success: true,
        data: {
          id: media._id,
          filename: media.filename,
          originalName: media.originalName,
          url: media.cloudinaryUrl,
          cloudinaryId: media.cloudinaryId,
          size: media.size,
          sizeFormatted: media.sizeFormatted,
          mimetype: media.mimetype,
          width: media.width,
          height: media.height,
          aspectRatio: media.aspectRatio,
          alt: media.alt,
          variants: media.variants,
          tags: media.tags,
          usageCount: media.usageCount,
          uploadedAt: media.uploadedAt,
          updatedAt: media.updatedAt
        }
      });

    } catch (error) {
      logger.error('Update media metadata error:', error);

      // Handle validation errors
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: Object.values(error.errors).map(err => ({
              field: err.path,
              message: err.message
            }))
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while updating media metadata'
        }
      });
    }
  }

  /**
   * Get optimized URL for specific size
   * GET /api/media/:id/url/:size
   */
  static async getOptimizedUrl(req, res) {
    try {
      const { id, size } = req.params;

      const media = await Media.findOne({ _id: id, isActive: true });

      if (!media) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'MEDIA_NOT_FOUND',
            message: 'Media not found'
          }
        });
      }

      const optimizedUrl = media.getOptimizedUrl(size);

      res.json({
        success: true,
        data: {
          url: optimizedUrl,
          size: size,
          mediaId: media._id
        }
      });

    } catch (error) {
      logger.error('Get optimized URL error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while generating optimized URL'
        }
      });
    }
  }

  /**
   * Increment usage count for media
   * POST /api/media/:id/usage
   */
  static async incrementUsage(req, res) {
    try {
      const { id } = req.params;

      const media = await Media.findOne({ _id: id, isActive: true });

      if (!media) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'MEDIA_NOT_FOUND',
            message: 'Media not found'
          }
        });
      }

      await media.incrementUsage();

      res.json({
        success: true,
        data: {
          usageCount: media.usageCount
        }
      });

    } catch (error) {
      logger.error('Increment usage error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while updating usage count'
        }
      });
    }
  }
}

// Export the upload middleware and controller
module.exports = {
  MediaController,
  uploadMiddleware: upload.single('image')
};