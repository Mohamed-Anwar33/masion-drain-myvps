const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { authenticate } = require('../middleware/auth');
const { validate, sanitizeInput, preventMongoInjection } = require('../middleware/validation');
const { contentSchemas } = require('../validation/schemas');

// Public routes (no authentication required)
/**
 * @swagger
 * /api/content/translations:
 *   get:
 *     summary: Get all translations for frontend
 *     tags: [Content]
 *     parameters:
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           enum: [en, ar]
 *         description: Filter by language (optional)
 *     responses:
 *       200:
 *         description: Translations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 language:
 *                   type: string
 */
router.get('/translations', 
  sanitizeInput, 
  preventMongoInjection, 
  validate(contentSchemas.query, 'query'), 
  contentController.getTranslations
);

/**
 * @swagger
 * /api/content/{section}:
 *   get:
 *     summary: Get content for a specific section
 *     tags: [Content]
 *     parameters:
 *       - in: path
 *         name: section
 *         required: true
 *         schema:
 *           type: string
 *           enum: [hero, about, nav, contact, collections, footer]
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           enum: [en, ar]
 *         description: Filter by language (optional)
 *     responses:
 *       200:
 *         description: Section content retrieved successfully
 *       404:
 *         description: Content not found for section
 */
router.get('/:section', 
  sanitizeInput, 
  preventMongoInjection, 
  validate(contentSchemas.params, 'params'), 
  validate(contentSchemas.query, 'query'), 
  contentController.getSection
);

/**
 * @swagger
 * /api/content/{section}/fallback:
 *   get:
 *     summary: Get content with fallback language support
 *     tags: [Content]
 *     parameters:
 *       - in: path
 *         name: section
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: preferred
 *         schema:
 *           type: string
 *           enum: [en, ar]
 *           default: en
 *       - in: query
 *         name: fallback
 *         schema:
 *           type: string
 *           enum: [en, ar]
 *           default: ar
 *     responses:
 *       200:
 *         description: Content retrieved with fallback support
 *       404:
 *         description: Content not found
 */
router.get('/:section/fallback', contentController.getSectionWithFallback);

// Protected routes (authentication required)
/**
 * @swagger
 * /api/content/translations:
 *   put:
 *     summary: Bulk update translations (Admin only)
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contentUpdates:
 *                 type: object
 *                 description: Object with section keys and content values
 *               changeLog:
 *                 type: string
 *                 description: Optional change description
 *     responses:
 *       200:
 *         description: All translations updated successfully
 *       207:
 *         description: Partial success (some updates failed)
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Authentication required
 */
router.put('/translations', 
  authenticate, 
  sanitizeInput, 
  preventMongoInjection, 
  validate(contentSchemas.update), 
  contentController.updateTranslations
);

/**
 * @swagger
 * /api/content/{section}:
 *   put:
 *     summary: Update content for a specific section (Admin only)
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: section
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: object
 *                 properties:
 *                   en:
 *                     type: object
 *                   ar:
 *                     type: object
 *               changeLog:
 *                 type: string
 *     responses:
 *       200:
 *         description: Section content updated successfully
 *       400:
 *         description: Invalid request or validation error
 *       401:
 *         description: Authentication required
 */
router.put('/:section', 
  authenticate, 
  sanitizeInput, 
  preventMongoInjection, 
  validate(contentSchemas.params, 'params'), 
  validate(contentSchemas.update), 
  contentController.updateSection
);

/**
 * @swagger
 * /api/content/{section}/history:
 *   get:
 *     summary: Get content history for a section (Admin only)
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: section
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Content history retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get('/:section/history', authenticate, contentController.getSectionHistory);

/**
 * @swagger
 * /api/content/{section}/rollback:
 *   post:
 *     summary: Rollback content to a specific version (Admin only)
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: section
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               versionId:
 *                 type: string
 *                 description: ID of the version to rollback to
 *               changeLog:
 *                 type: string
 *                 description: Optional rollback description
 *     responses:
 *       200:
 *         description: Content rolled back successfully
 *       400:
 *         description: Invalid request or version mismatch
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Version not found
 */
router.post('/:section/rollback', authenticate, contentController.rollbackSection);

/**
 * @swagger
 * /api/content/{section}/validate:
 *   post:
 *     summary: Validate content structure for a section (Admin only)
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: section
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: object
 *                 properties:
 *                   en:
 *                     type: object
 *                   ar:
 *                     type: object
 *     responses:
 *       200:
 *         description: Content validation completed
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Authentication required
 */
router.post('/:section/validate', authenticate, contentController.validateSection);

module.exports = router;