const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate } = require('../middleware/auth');
const { validate, sanitizeInput, preventMongoInjection } = require('../middleware/validation');
const { settingsSchemas } = require('../validation/schemas');

/**
 * @swagger
 * components:
 *   schemas:
 *     Settings:
 *       type: object
 *       properties:
 *         site:
 *           type: object
 *           description: Site information settings
 *         seo:
 *           type: object
 *           description: SEO settings
 *         appearance:
 *           type: object
 *           description: Appearance settings
 *         features:
 *           type: object
 *           description: Feature toggle settings
 *         shipping:
 *           type: object
 *           description: Shipping settings
 *         taxes:
 *           type: object
 *           description: Tax settings
 *         localization:
 *           type: object
 *           description: Localization settings
 */

// Public routes (no authentication required)
/**
 * @swagger
 * /api/settings/site-info:
 *   get:
 *     summary: Get site information for frontend
 *     tags: [Settings]
 *     parameters:
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           enum: [en, ar]
 *           default: en
 *         description: Language preference
 *     responses:
 *       200:
 *         description: Site information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 */
router.get('/site-info', 
  sanitizeInput, 
  preventMongoInjection, 
  settingsController.getSiteInfo
);

/**
 * @swagger
 * /api/settings/shipping:
 *   get:
 *     summary: Get shipping settings for frontend
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Shipping settings retrieved successfully
 */
router.get('/shipping', 
  sanitizeInput, 
  preventMongoInjection, 
  settingsController.getShippingSettings
);

/**
 * @swagger
 * /api/settings/calculate-shipping:
 *   post:
 *     summary: Calculate shipping cost for order
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - countryCode
 *             properties:
 *               countryCode:
 *                 type: string
 *                 description: ISO country code
 *               orderTotal:
 *                 type: number
 *                 description: Order total amount
 *               shippingType:
 *                 type: string
 *                 enum: [standard, express, international]
 *                 default: standard
 *     responses:
 *       200:
 *         description: Shipping cost calculated successfully
 */
router.post('/calculate-shipping', 
  sanitizeInput, 
  preventMongoInjection, 
  settingsController.calculateShipping
);

/**
 * @swagger
 * /api/settings/taxes:
 *   get:
 *     summary: Get tax settings for frontend
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Tax settings retrieved successfully
 */
router.get('/taxes', 
  sanitizeInput, 
  preventMongoInjection, 
  settingsController.getTaxSettings
);

/**
 * @swagger
 * /api/settings/calculate-tax:
 *   post:
 *     summary: Calculate tax amount for order
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - countryCode
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount to calculate tax on
 *               countryCode:
 *                 type: string
 *                 description: ISO country code
 *     responses:
 *       200:
 *         description: Tax amount calculated successfully
 */
router.post('/calculate-tax', 
  sanitizeInput, 
  preventMongoInjection, 
  settingsController.calculateTax
);

// Protected routes (authentication required)
/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Get all settings (Admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Settings'
 *       401:
 *         description: Authentication required
 */
router.get('/', 
  authenticate, 
  sanitizeInput, 
  preventMongoInjection, 
  settingsController.getSettings
);

/**
 * @swagger
 * /api/settings:
 *   put:
 *     summary: Update settings (Admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               settings:
 *                 $ref: '#/components/schemas/Settings'
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 */
router.put('/', 
  authenticate, 
  sanitizeInput, 
  preventMongoInjection, 
  settingsController.updateSettings
);

/**
 * @swagger
 * /api/settings/{section}:
 *   get:
 *     summary: Get specific setting section (Admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: section
 *         required: true
 *         schema:
 *           type: string
 *           enum: [site, seo, appearance, features, shipping, taxes, localization]
 *     responses:
 *       200:
 *         description: Setting section retrieved successfully
 *       404:
 *         description: Section not found
 *       401:
 *         description: Authentication required
 */
router.get('/:section', 
  authenticate, 
  sanitizeInput, 
  preventMongoInjection, 
  settingsController.getSettingSection
);

/**
 * @swagger
 * /api/settings/{section}:
 *   put:
 *     summary: Update specific setting section (Admin only)
 *     tags: [Settings]
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
 *               settings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Setting section updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 */
router.put('/:section', 
  authenticate, 
  sanitizeInput, 
  preventMongoInjection, 
  settingsController.updateSettingSection
);

/**
 * @swagger
 * /api/settings/export:
 *   get:
 *     summary: Export settings as JSON file (Admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings exported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Authentication required
 */
router.get('/export', 
  authenticate, 
  sanitizeInput, 
  preventMongoInjection, 
  settingsController.exportSettings
);

/**
 * @swagger
 * /api/settings/import:
 *   post:
 *     summary: Import settings from JSON (Admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               settings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Settings imported successfully
 *       400:
 *         description: Invalid import data
 *       401:
 *         description: Authentication required
 */
router.post('/import', 
  authenticate, 
  sanitizeInput, 
  preventMongoInjection, 
  settingsController.importSettings
);

/**
 * @swagger
 * /api/settings/reset:
 *   post:
 *     summary: Reset settings to defaults (Admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings reset successfully
 *       401:
 *         description: Authentication required
 */
router.post('/reset', 
  authenticate, 
  sanitizeInput, 
  preventMongoInjection, 
  settingsController.resetSettings
);

/**
 * @swagger
 * /api/settings/payment-gateways:
 *   get:
 *     summary: Get payment gateways settings (Admin only, masked for security)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment gateways retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get('/payment-gateways', 
  authenticate, 
  sanitizeInput, 
  preventMongoInjection, 
  settingsController.getPaymentGateways
);

/**
 * @swagger
 * /api/settings/payment-gateways/status:
 *   get:
 *     summary: Get payment gateways status (Admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment gateways status retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get('/payment-gateways/status', 
  authenticate, 
  sanitizeInput, 
  preventMongoInjection, 
  settingsController.getPaymentGatewaysStatus
);

/**
 * @swagger
 * /api/settings/payment-gateways/{gateway}:
 *   put:
 *     summary: Update specific payment gateway settings (Admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gateway
 *         required: true
 *         schema:
 *           type: string
 *           enum: [paymob, fawry, paypal, bankTransfer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               settings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Payment gateway updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 */
router.put('/payment-gateways/:gateway', 
  authenticate, 
  sanitizeInput, 
  preventMongoInjection, 
  settingsController.updatePaymentGateway
);

/**
 * @swagger
 * /api/settings/payment-gateways/{gateway}/test:
 *   post:
 *     summary: Test payment gateway connection (Admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gateway
 *         required: true
 *         schema:
 *           type: string
 *           enum: [paymob, fawry, paypal]
 *     responses:
 *       200:
 *         description: Gateway test completed
 *       401:
 *         description: Authentication required
 */
router.post('/payment-gateways/:gateway/test', 
  authenticate, 
  sanitizeInput, 
  preventMongoInjection, 
  settingsController.testPaymentGateway
);

module.exports = router;