const express = require('express');
const router = express.Router();
const sampleRequestController = require('../controllers/sampleRequestController');
const { authenticate } = require('../middleware/auth');
const { validate, sanitizeInput, preventMongoInjection } = require('../middleware/validation');
const { sampleSchemas } = require('../validation/schemas');
const rateLimit = require('express-rate-limit');

/**
 * @swagger
 * components:
 *   schemas:
 *     SampleRequest:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         customerInfo:
 *           type: object
 *           properties:
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *             email:
 *               type: string
 *             phone:
 *               type: string
 *             address:
 *               type: object
 *               properties:
 *                 street:
 *                   type: string
 *                 city:
 *                   type: string
 *                 postalCode:
 *                   type: string
 *                 country:
 *                   type: string
 *         requestedProducts:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               product:
 *                 type: string
 *               productName:
 *                 $ref: '#/components/schemas/MultilingualText'
 *               quantity:
 *                 type: number
 *               sampleSize:
 *                 type: string
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected, shipped, delivered]
 *         priority:
 *           type: string
 *           enum: [low, medium, high]
 *         message:
 *           type: string
 *         preferredLanguage:
 *           type: string
 *           enum: [en, ar]
 *         adminNotes:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *               addedBy:
 *                 type: string
 *               addedAt:
 *                 type: string
 *                 format: date-time
 *         shippingInfo:
 *           type: object
 *           properties:
 *             trackingNumber:
 *               type: string
 *             shippingMethod:
 *               type: string
 *             estimatedDelivery:
 *               type: string
 *               format: date-time
 *             shippedAt:
 *               type: string
 *               format: date-time
 *             deliveredAt:
 *               type: string
 *               format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     SampleRequestCreate:
 *       type: object
 *       required:
 *         - customerInfo
 *         - requestedProducts
 *       properties:
 *         customerInfo:
 *           type: object
 *           required:
 *             - firstName
 *             - lastName
 *             - email
 *             - phone
 *             - address
 *           properties:
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *             email:
 *               type: string
 *               format: email
 *             phone:
 *               type: string
 *             address:
 *               type: object
 *               required:
 *                 - street
 *                 - city
 *                 - country
 *               properties:
 *                 street:
 *                   type: string
 *                 city:
 *                   type: string
 *                 postalCode:
 *                   type: string
 *                 country:
 *                   type: string
 *         requestedProducts:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: object
 *             required:
 *               - product
 *               - quantity
 *             properties:
 *               product:
 *                 type: string
 *               quantity:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               sampleSize:
 *                 type: string
 *                 enum: [2ml, 5ml, 10ml]
 *         message:
 *           type: string
 *         preferredLanguage:
 *           type: string
 *           enum: [en, ar]
 *           default: en
 */

// Rate limiting for sample requests
const sampleRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Maximum 5 sample requests per hour per IP
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many sample requests. Please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * @swagger
 * /api/samples/request:
 *   post:
 *     summary: Submit a sample request
 *     description: Submit a request for product samples (rate limited to 5 requests per hour)
 *     tags: [Samples]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SampleRequestCreate'
 *     responses:
 *       201:
 *         description: Sample request submitted successfully
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
 *                     sampleRequest:
 *                       $ref: '#/components/schemas/SampleRequest'
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// Public Routes
router.post('/request', 
  sampleRequestLimiter, 
  sanitizeInput, 
  preventMongoInjection, 
  validate(sampleSchemas.create), 
  sampleRequestController.createSampleRequest
);

/**
 * @swagger
 * /api/samples:
 *   get:
 *     summary: Get all sample requests
 *     description: Get all sample requests with filtering and pagination (admin only)
 *     tags: [Samples]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, shipped, delivered]
 *         description: Filter by status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Filter by priority
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in customer name or email
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, status, priority]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Sample requests retrieved successfully
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
 *                     sampleRequests:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SampleRequest'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationMeta'
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// Admin Routes (Protected)
router.get('/', 
  authenticate, 
  sanitizeInput, 
  preventMongoInjection, 
  validate(sampleSchemas.query, 'query'), 
  sampleRequestController.getSampleRequests
);

/**
 * @swagger
 * /api/samples/statistics:
 *   get:
 *     summary: Get sample request statistics
 *     description: Get comprehensive statistics for sample requests (admin only)
 *     tags: [Samples]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
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
 *                     totalRequests:
 *                       type: number
 *                     statusBreakdown:
 *                       type: object
 *                     priorityBreakdown:
 *                       type: object
 *                     recentRequests:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SampleRequest'
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/statistics', authenticate, sampleRequestController.getSampleRequestStatistics);

/**
 * @swagger
 * /api/samples/{id}:
 *   get:
 *     summary: Get sample request by ID
 *     description: Get a specific sample request by its ID (admin only)
 *     tags: [Samples]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sample request ID
 *     responses:
 *       200:
 *         description: Sample request retrieved successfully
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
 *                     sampleRequest:
 *                       $ref: '#/components/schemas/SampleRequest'
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', 
  authenticate, 
  sanitizeInput, 
  preventMongoInjection, 
  validate(sampleSchemas.params, 'params'), 
  sampleRequestController.getSampleRequestById
);

/**
 * @swagger
 * /api/samples/{id}/status:
 *   put:
 *     summary: Update sample request status
 *     description: Update the status of a sample request (admin only)
 *     tags: [Samples]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sample request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected, shipped, delivered]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:id/status', 
  authenticate, 
  sanitizeInput, 
  preventMongoInjection, 
  validate(sampleSchemas.params, 'params'), 
  validate(sampleSchemas.updateStatus), 
  sampleRequestController.updateSampleRequestStatus
);

/**
 * @swagger
 * /api/samples/{id}/notes:
 *   post:
 *     summary: Add admin note
 *     description: Add an admin note to a sample request (admin only)
 *     tags: [Samples]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sample request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - note
 *             properties:
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Note added successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/:id/notes', authenticate, sampleRequestController.addAdminNote);

/**
 * @swagger
 * /api/samples/{id}/shipping:
 *   put:
 *     summary: Update shipping information
 *     description: Update shipping information for a sample request (admin only)
 *     tags: [Samples]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sample request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trackingNumber:
 *                 type: string
 *               shippingMethod:
 *                 type: string
 *               estimatedDelivery:
 *                 type: string
 *                 format: date-time
 *               shippedAt:
 *                 type: string
 *                 format: date-time
 *               deliveredAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Shipping information updated successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:id/shipping', authenticate, sampleRequestController.updateShippingInfo);

module.exports = router;