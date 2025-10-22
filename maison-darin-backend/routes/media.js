const express = require('express');
const { MediaController, uploadMiddleware } = require('../controllers/mediaController');
const { authenticate } = require('../middleware/auth');
const { validate, sanitizeInput, preventMongoInjection } = require('../middleware/validation');
const { createUploadMiddleware, validateFile, handleMulterError } = require('../middleware/fileValidation');
const { mediaSchemas } = require('../validation/schemas');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Media:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Media ID
 *         filename:
 *           type: string
 *           description: Generated filename
 *         originalName:
 *           type: string
 *           description: Original uploaded filename
 *         url:
 *           type: string
 *           description: Cloudinary URL
 *         cloudinaryId:
 *           type: string
 *           description: Cloudinary public ID
 *         size:
 *           type: number
 *           description: File size in bytes
 *         sizeFormatted:
 *           type: string
 *           description: Human readable file size
 *         mimetype:
 *           type: string
 *           description: File MIME type
 *         width:
 *           type: number
 *           description: Image width in pixels
 *         height:
 *           type: number
 *           description: Image height in pixels
 *         aspectRatio:
 *           type: string
 *           description: Image aspect ratio
 *         alt:
 *           type: object
 *           properties:
 *             en:
 *               type: string
 *               description: English alt text
 *             ar:
 *               type: string
 *               description: Arabic alt text
 *         variants:
 *           type: object
 *           properties:
 *             thumbnail:
 *               type: string
 *               description: Thumbnail URL
 *             medium:
 *               type: string
 *               description: Medium size URL
 *             large:
 *               type: string
 *               description: Large size URL
 *             extraLarge:
 *               type: string
 *               description: Extra large size URL
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Image tags
 *         usageCount:
 *           type: number
 *           description: Number of times image has been used
 *         uploadedBy:
 *           type: string
 *           description: User who uploaded the image
 *         uploadedAt:
 *           type: string
 *           format: date-time
 *           description: Upload timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

/**
 * @swagger
 * /api/media/upload:
 *   post:
 *     summary: Upload image to Cloudinary
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG, PNG, WebP, max 5MB)
 *               altEn:
 *                 type: string
 *                 description: English alt text
 *               altAr:
 *                 type: string
 *                 description: Arabic alt text
 *               tags:
 *                 type: string
 *                 description: Comma-separated tags
 *               folder:
 *                 type: string
 *                 description: Cloudinary folder, defaults to maison-darin
 *     responses:
 *       201:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Media'
 *       400:
 *         description: Validation error or no file uploaded
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/upload', 
  authenticate, 
  createUploadMiddleware('image', 1),
  handleMulterError,
  validateFile,
  validate(mediaSchemas.upload),
  MediaController.uploadImage
);

/**
 * @swagger
 * /api/media:
 *   get:
 *     summary: Get media library with filtering and pagination
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for filename, alt text, or tags
 *       - in: query
 *         name: mimetype
 *         schema:
 *           type: string
 *           enum: [image/jpeg, image/png, image/webp]
 *         description: Filter by MIME type
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated tags to filter by
 *       - in: query
 *         name: uploadedBy
 *         schema:
 *           type: string
 *         description: Filter by uploader user ID
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: uploadedAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Media list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     media:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Media'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', 
  authenticate, 
  sanitizeInput, 
  preventMongoInjection, 
  validate(mediaSchemas.query, 'query'), 
  MediaController.getMedia
);

/**
 * @swagger
 * /api/media/{id}:
 *   get:
 *     summary: Get single media item by ID
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Media ID
 *     responses:
 *       200:
 *         description: Media item retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Media'
 *       404:
 *         description: Media not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/:id', 
  authenticate, 
  sanitizeInput, 
  preventMongoInjection, 
  validate(mediaSchemas.params, 'params'), 
  MediaController.getMediaById
);

/**
 * @swagger
 * /api/media/{id}:
 *   put:
 *     summary: Update media metadata (alt text, tags)
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Media ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               altEn:
 *                 type: string
 *                 description: English alt text
 *               altAr:
 *                 type: string
 *                 description: Arabic alt text
 *               tags:
 *                 oneOf:
 *                   - type: array
 *                     items:
 *                       type: string
 *                   - type: string
 *                 description: Tags as array or comma-separated string
 *     responses:
 *       200:
 *         description: Media metadata updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Media'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Media not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/:id', 
  authenticate, 
  sanitizeInput, 
  preventMongoInjection, 
  validate(mediaSchemas.params, 'params'), 
  validate(mediaSchemas.update), 
  MediaController.updateMediaMetadata
);

/**
 * @swagger
 * /api/media/{id}:
 *   delete:
 *     summary: Delete media item and remove from Cloudinary
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Media ID
 *     responses:
 *       200:
 *         description: Media deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Media not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/:id', 
  authenticate, 
  sanitizeInput, 
  preventMongoInjection, 
  validate(mediaSchemas.params, 'params'), 
  MediaController.deleteMedia
);

/**
 * @swagger
 * /api/media/{id}/url/{size}:
 *   get:
 *     summary: Get optimized URL for specific size
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Media ID
 *       - in: path
 *         name: size
 *         required: true
 *         schema:
 *           type: string
 *           enum: [thumbnail, medium, large, extraLarge]
 *         description: Image size variant
 *     responses:
 *       200:
 *         description: Optimized URL retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     size:
 *                       type: string
 *                     mediaId:
 *                       type: string
 *       404:
 *         description: Media not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/:id/url/:size', authenticate, MediaController.getOptimizedUrl);

/**
 * @swagger
 * /api/media/{id}/usage:
 *   post:
 *     summary: Increment usage count for media
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Media ID
 *     responses:
 *       200:
 *         description: Usage count updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     usageCount:
 *                       type: number
 *       404:
 *         description: Media not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/:id/usage', authenticate, MediaController.incrementUsage);

module.exports = router;