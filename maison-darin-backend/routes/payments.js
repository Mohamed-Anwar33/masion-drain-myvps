const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { validatePaymentData, validateRefundData } = require('../middleware/paymentValidation');

// Public routes (for customers)

// Get available payment methods
router.get('/methods', paymentController.getPaymentMethods);

// Calculate payment fees
router.post('/calculate-fees', paymentController.calculateFees);

// Initialize payment
router.post('/initialize', requireAuth, paymentController.initializePayment);

// Process different payment methods
router.post('/process/card', requireAuth, ...validatePaymentData, paymentController.processCardPayment);
router.post('/process/vodafone-cash', requireAuth, ...validatePaymentData, paymentController.processVodafoneCash);
router.post('/process/paypal', requireAuth, paymentController.processPayPalPayment);
router.post('/process/paypal/capture', requireAuth, paymentController.capturePayPalPayment);
router.post('/process/cash-on-delivery', requireAuth, paymentController.processCashOnDelivery);
router.post('/process/bank-transfer', requireAuth, paymentController.processBankTransfer);

// Get payment status
router.get('/:paymentId/status', paymentController.getPaymentStatus);

// Webhook endpoints (no authentication required)
router.post('/webhook/:provider', paymentController.handleWebhook);

// Admin routes (require admin authentication)

// Get payments list
router.get('/', requireAuth, requireAdmin, paymentController.getPayments);

// Get payment statistics
router.get('/statistics', requireAuth, requireAdmin, paymentController.getPaymentStatistics);

// Process refund
router.post('/:paymentId/refund', requireAuth, requireAdmin, ...validateRefundData, paymentController.processRefund);

// Verify bank transfer
router.post('/:paymentId/verify-bank-transfer', requireAuth, requireAdmin, paymentController.verifyBankTransfer);

module.exports = router;