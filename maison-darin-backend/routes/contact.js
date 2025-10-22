const express = require('express');
const router = express.Router();
const contactMessageController = require('../controllers/contactMessageController');
const { authenticate } = require('../middleware/auth');
const { validate, sanitizeInput, preventMongoInjection } = require('../middleware/validation');
const { contactSchemas } = require('../validation/schemas');
const rateLimit = require('express-rate-limit');

/**
 * @swagger
 * components:
 *   schemas:
 *     ContactMessage:
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
 *             company:
 *               type: string
 *         subject:
 *           type: string
 *         message:
 *           type: string
 *         category:
 *           type: string
 *           enum: [general, product_inquiry, support, complaint, suggestion, partnership]
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         status:
 *           type: string
 *           enum: [new, in_progress, resolved, closed, spam]
 *         preferredLanguage:
 *           type: string
 *           enum: [en, ar]
 *         page:
 *           type: string
 *         isSpam:
 *           type: boolean
 *         spamReasons:
 *           type: array
 *           items:
 *             type: string
 *         assignedTo:
 *           type: string
 *         adminNotes:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *               isInternal:
 *                 type: boolean
 *               addedBy:
 *                 type: string
 *               addedAt:
 *                 type: string
 *                 format: date-time
 *         responses:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               method:
 *                 type: string
 *                 enum: [email, phone, internal]
 *               respondedBy:
 *                 type: string
 *               respondedAt:
 *                 type: string
 *                 format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     ContactMessageCreate:
 *       type: object
 *       required:
 *         - customerInfo
 *         - subject
 *         - message
 *         - category
 *       properties:
 *         customerInfo:
 *           type: object
 *           required:
 *             - firstName
 *             - lastName
 *             - email
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
 *             company:
 *               type: string
 *         subject:
 *           type: string
 *         message:
 *           type: string
 *         category:
 *           type: string
 *           enum: [general, product_inquiry, support, complaint, suggestion, partnership]
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *           default: medium
 *         preferredLanguage:
 *           type: string
 *           enum: [en, ar]
 *           default: en
 *         page:
 *           type: string
 */

// Rate limiting for contact form submissions
const contactFormLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Maximum 5 contact messages per hour per IP
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many contact form submissions. Please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * @swagger
 * /api/contact:
 *   post:
 *     summary: Submit a contact message
 *     description: Submit a contact form message (rate limited to 5 messages per hour)
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContactMessageCreate'
 *     responses:
 *       201:
 *         description: Contact message submitted successfully
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
 *                     contactMessage:
 *                       $ref: '#/components/schemas/ContactMessage'
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
router.post('/', 
  contactFormLimiter, 
  sanitizeInput, 
  preventMongoInjection, 
  validate(contactSchemas.create), 
  contactMessageController.submitContactMessage
);

/**
 * @swagger
 * /api/contact/messages:
 *   get:
 *     summary: Get all contact messages
 *     description: Get all contact messages with filtering and pagination (admin only)
 *     tags: [Contact]
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
 *           enum: [new, in_progress, resolved, closed, spam]
 *         description: Filter by status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [general, product_inquiry, support, complaint, suggestion, partnership]
 *         description: Filter by category
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: Filter by priority
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in subject, message, or customer info
 *       - in: query
 *         name: includeSpam
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include spam messages
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, priority, status]
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
 *         description: Contact messages retrieved successfully
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
 *                     contactMessages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ContactMessage'
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
router.get('/messages', 
  authenticate, 
  sanitizeInput, 
  preventMongoInjection, 
  validate(contactSchemas.query, 'query'), 
  contactMessageController.getContactMessages
);

/**
 * @swagger
 * /api/contact/statistics:
 *   get:
 *     summary: Get contact message statistics
 *     description: Get comprehensive statistics for contact messages (admin only)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/statistics', authenticate, contactMessageController.getContactMessageStatistics);

/**
 * @swagger
 * /api/contact/follow-up:
 *   get:
 *     summary: Get messages requiring follow-up
 *     description: Get contact messages that require follow-up (admin only)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Follow-up messages retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/follow-up', authenticate, contactMessageController.getFollowUpMessages);

/**
 * @swagger
 * /api/contact/messages/{id}:
 *   get:
 *     summary: Get contact message by ID
 *     description: Get a specific contact message by its ID (admin only)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact message ID
 *     responses:
 *       200:
 *         description: Contact message retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/messages/:id', 
  authenticate, 
  sanitizeInput, 
  preventMongoInjection, 
  validate(contactSchemas.params, 'params'), 
  contactMessageController.getContactMessageById
);

/**
 * @swagger
 * /api/contact/messages/{id}/status:
 *   put:
 *     summary: Update contact message status
 *     description: Update the status of a contact message (admin only)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact message ID
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
 *                 enum: [new, in_progress, resolved, closed, spam]
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
router.put('/messages/:id/status', authenticate, contactMessageController.updateContactMessageStatus);

/**
 * @swagger
 * /api/contact/messages/{id}/assign:
 *   put:
 *     summary: Assign contact message
 *     description: Assign a contact message to a user (admin only)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact message ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assigneeId
 *             properties:
 *               assigneeId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message assigned successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/messages/:id/assign', authenticate, contactMessageController.assignContactMessage);

/**
 * @swagger
 * /api/contact/messages/{id}/notes:
 *   post:
 *     summary: Add admin note
 *     description: Add an admin note to a contact message (admin only)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact message ID
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
 *               isInternal:
 *                 type: boolean
 *                 default: false
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
router.post('/messages/:id/notes', authenticate, contactMessageController.addAdminNote);

/**
 * @swagger
 * /api/contact/messages/{id}/responses:
 *   post:
 *     summary: Add response
 *     description: Add a response to a contact message (admin only)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact message ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *               method:
 *                 type: string
 *                 enum: [email, phone, internal]
 *                 default: email
 *     responses:
 *       200:
 *         description: Response added successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/messages/:id/responses', authenticate, contactMessageController.addResponse);

/**
 * @swagger
 * /api/contact/messages/{id}/spam:
 *   put:
 *     summary: Mark as spam
 *     description: Mark a contact message as spam (admin only)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact message ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reasons:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Message marked as spam successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/messages/:id/spam', authenticate, contactMessageController.markAsSpam);

module.exports = router;