const paymentService = require('../services/paymentService');
const PaymentMethod = require('../models/PaymentMethod');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const paymentEncryption = require('../utils/paymentEncryption');

class PaymentController {
  // Get available payment methods
  async getPaymentMethods(req, res) {
    try {
      const { currency = 'EGP' } = req.query;
      
      const paymentMethods = await PaymentMethod.getActivePaymentMethods(currency);
      
      // Format response for frontend
      const formattedMethods = paymentMethods.map(method => ({
        name: method.name,
        displayName: method.getDisplayName(req.language || 'ar'),
        type: method.type,
        description: method.getDescription(req.language || 'ar'),
        instructions: method.getInstructions(req.language || 'ar'),
        icon: method.ui.icon,
        color: method.ui.color,
        minAmount: method.configuration.minAmount,
        maxAmount: method.configuration.maxAmount,
        supportedCurrencies: method.configuration.supportedCurrencies,
        fees: {
          fixed: method.fees.fixedFee,
          percentage: method.fees.percentageFee
        }
      }));

      res.json({
        success: true,
        paymentMethods: formattedMethods
      });
    } catch (error) {
      console.error('Get payment methods error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve payment methods',
        error: error.message
      });
    }
  }

  // Calculate payment fees
  async calculateFees(req, res) {
    try {
      const { paymentMethod, amount, currency = 'EGP' } = req.body;

      if (!paymentMethod || !amount) {
        return res.status(400).json({
          success: false,
          message: 'Payment method and amount are required'
        });
      }

      const method = await PaymentMethod.getByName(paymentMethod);
      if (!method) {
        return res.status(404).json({
          success: false,
          message: 'Payment method not found'
        });
      }

      const fees = method.calculateFees(amount, currency);
      const total = amount + fees;

      res.json({
        success: true,
        calculation: {
          amount,
          fees,
          total,
          currency
        }
      });
    } catch (error) {
      console.error('Calculate fees error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate fees',
        error: error.message
      });
    }
  }

  // Initialize payment
  async initializePayment(req, res) {
    try {
      const { orderId, paymentMethod, customerData } = req.body;

      if (!orderId || !paymentMethod) {
        return res.status(400).json({
          success: false,
          message: 'Order ID and payment method are required'
        });
      }

      // Get client IP and user agent for security
      const additionalData = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      };

      const result = await paymentService.initializePayment(
        { orderId },
        paymentMethod,
        customerData,
        additionalData
      );

      if (result.success) {
        res.json({
          success: true,
          paymentId: result.payment.paymentId,
          amount: result.payment.amount,
          currency: result.payment.currency,
          expiresAt: result.payment.expiresAt,
          nextStep: result.nextStep
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Initialize payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initialize payment',
        error: error.message
      });
    }
  }

  // Process card payment
  async processCardPayment(req, res) {
    try {
      const { paymentId, cardDetails } = req.body;

      if (!paymentId || !cardDetails) {
        return res.status(400).json({
          success: false,
          message: 'Payment ID and card details are required'
        });
      }

      // Validate required card fields
      const requiredFields = ['cardNumber', 'expiryDate', 'cvv', 'cardholderName'];
      for (const field of requiredFields) {
        if (!cardDetails[field]) {
          return res.status(400).json({
            success: false,
            message: `${field} is required`
          });
        }
      }

      const result = await paymentService.processCardPayment(paymentId, cardDetails);

      if (result.success) {
        res.json({
          success: true,
          paymentId: result.payment.paymentId,
          transactionId: result.transactionId,
          status: result.payment.status,
          message: 'Payment processed successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Process card payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process card payment',
        error: error.message
      });
    }
  }

  // Process Vodafone Cash payment
  async processVodafoneCash(req, res) {
    try {
      const { paymentId, phoneNumber } = req.body;

      if (!paymentId || !phoneNumber) {
        return res.status(400).json({
          success: false,
          message: 'Payment ID and phone number are required'
        });
      }

      const result = await paymentService.processVodafoneCashPayment(paymentId, phoneNumber);

      if (result.success) {
        res.json({
          success: true,
          paymentId: result.payment.paymentId,
          transactionId: result.transactionId,
          status: result.payment.status,
          message: 'Vodafone Cash payment processed successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Process Vodafone Cash payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process Vodafone Cash payment',
        error: error.message
      });
    }
  }

  // Process Cash on Delivery
  async processCashOnDelivery(req, res) {
    try {
      const { paymentId } = req.body;

      if (!paymentId) {
        return res.status(400).json({
          success: false,
          message: 'Payment ID is required'
        });
      }

      const result = await paymentService.processCashOnDelivery(paymentId);

      if (result.success) {
        res.json({
          success: true,
          paymentId: result.payment.paymentId,
          status: result.payment.status,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Process COD error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process cash on delivery',
        error: error.message
      });
    }
  }

  // Process PayPal payment
  async processPayPalPayment(req, res) {
    try {
      const { paymentId } = req.body;

      if (!paymentId) {
        return res.status(400).json({
          success: false,
          message: 'Payment ID is required'
        });
      }

      const result = await paymentService.processPayPalPayment(paymentId);

      if (result.success) {
        res.json({
          success: true,
          paymentId: result.payment.paymentId,
          approvalUrl: result.approvalUrl,
          orderId: result.orderId,
          message: 'PayPal payment initialized. Redirect to approval URL.'
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Process PayPal payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process PayPal payment',
        error: error.message
      });
    }
  }

  // Capture PayPal payment after approval
  async capturePayPalPayment(req, res) {
    try {
      const { paymentId, paypalOrderId } = req.body;

      if (!paymentId || !paypalOrderId) {
        return res.status(400).json({
          success: false,
          message: 'Payment ID and PayPal Order ID are required'
        });
      }

      const result = await paymentService.capturePayPalPayment(paymentId, paypalOrderId);

      if (result.success) {
        res.json({
          success: true,
          paymentId: result.payment.paymentId,
          transactionId: result.transactionId,
          status: result.payment.status,
          message: 'PayPal payment captured successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Capture PayPal payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to capture PayPal payment',
        error: error.message
      });
    }
  }

  // Process Bank Transfer
  async processBankTransfer(req, res) {
    try {
      const { paymentId, bankReference } = req.body;

      if (!paymentId) {
        return res.status(400).json({
          success: false,
          message: 'Payment ID is required'
        });
      }

      const result = await paymentService.processBankTransfer(paymentId, bankReference);

      if (result.success) {
        res.json({
          success: true,
          paymentId: result.payment.paymentId,
          status: result.payment.status,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Process bank transfer error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process bank transfer',
        error: error.message
      });
    }
  }

  // Get payment status
  async getPaymentStatus(req, res) {
    try {
      const { paymentId } = req.params;

      const result = await paymentService.getPayment(paymentId);

      if (result.success) {
        const payment = result.payment;
        
        res.json({
          success: true,
          payment: {
            paymentId: payment.paymentId,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            paymentMethod: payment.paymentMethod,
            createdAt: payment.createdAt,
            completedAt: payment.completedAt,
            expiresAt: payment.expiresAt,
            isExpired: payment.isExpired(),
            order: {
              orderNumber: payment.order?.orderNumber,
              total: payment.order?.total
            },
            customer: {
              name: payment.customer ? `${payment.customer.firstName} ${payment.customer.lastName}` : null,
              email: payment.customer?.email
            }
          }
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }
    } catch (error) {
      console.error('Get payment status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve payment status',
        error: error.message
      });
    }
  }

  // Get payments list (admin only)
  async getPayments(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        paymentMethod,
        startDate,
        endDate,
        customerId,
        orderId
      } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (paymentMethod) filters.paymentMethod = paymentMethod;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (customerId) filters.customerId = customerId;
      if (orderId) filters.orderId = orderId;

      const result = await paymentService.getPayments(filters, parseInt(page), parseInt(limit));

      if (result.success) {
        // Format payments for admin view
        const formattedPayments = result.payments.map(payment => ({
          paymentId: payment.paymentId,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          paymentMethod: payment.paymentMethod,
          createdAt: payment.createdAt,
          completedAt: payment.completedAt,
          order: {
            orderNumber: payment.order?.orderNumber,
            total: payment.order?.total,
            status: payment.order?.orderStatus
          },
          customer: {
            name: payment.customer ? `${payment.customer.firstName} ${payment.customer.lastName}` : null,
            email: paymentEncryption.maskEmail(payment.customer?.email)
          },
          fees: payment.fees,
          refundedAmount: payment.getRefundedAmount(),
          refundableAmount: payment.getRefundableAmount()
        }));

        res.json({
          success: true,
          payments: formattedPayments,
          pagination: result.pagination
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Get payments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve payments',
        error: error.message
      });
    }
  }

  // Get payment statistics (admin only)
  async getPaymentStatistics(req, res) {
    try {
      const { startDate, endDate } = req.query;

      const filters = {};
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const result = await paymentService.getPaymentStatistics(filters);

      if (result.success) {
        res.json({
          success: true,
          statistics: result.statistics
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Get payment statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve payment statistics',
        error: error.message
      });
    }
  }

  // Process refund (admin only)
  async processRefund(req, res) {
    try {
      const { paymentId } = req.params;
      const { amount, reason } = req.body;
      const adminId = req.user?.id; // Assuming admin authentication middleware

      if (!amount || !reason) {
        return res.status(400).json({
          success: false,
          message: 'Amount and reason are required for refund'
        });
      }

      const result = await paymentService.processRefund(paymentId, amount, reason, adminId);

      if (result.success) {
        res.json({
          success: true,
          message: 'Refund processed successfully',
          refund: {
            refundId: result.refund.refundId,
            amount: result.refund.amount,
            status: result.refund.status,
            reason: result.refund.reason
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Process refund error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process refund',
        error: error.message
      });
    }
  }

  // Verify bank transfer (admin only)
  async verifyBankTransfer(req, res) {
    try {
      const { paymentId } = req.params;
      const { verified, adminNotes } = req.body;

      if (typeof verified !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'Verified status (true/false) is required'
        });
      }

      const result = await paymentService.verifyBankTransfer(paymentId, verified, adminNotes);

      if (result.success) {
        res.json({
          success: true,
          message: verified ? 'Bank transfer verified successfully' : 'Bank transfer verification failed',
          payment: {
            paymentId: result.payment.paymentId,
            status: result.payment.status
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Verify bank transfer error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify bank transfer',
        error: error.message
      });
    }
  }

  // Webhook handler for payment gateways
  async handleWebhook(req, res) {
    try {
      const { provider } = req.params;
      const webhookData = req.body;

      console.log(`Received webhook from ${provider}:`, webhookData);

      // TODO: Implement webhook verification and processing based on provider
      // This would handle real-time updates from payment gateways

      switch (provider) {
        case 'paymob':
          // Handle Paymob webhook
          break;
        case 'fawry':
          // Handle Fawry webhook
          break;
        case 'paypal':
          // Handle PayPal webhook
          break;
        default:
          console.warn(`Unknown webhook provider: ${provider}`);
      }

      res.json({ success: true, message: 'Webhook processed' });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process webhook',
        error: error.message
      });
    }
  }
}

const paymentController = new PaymentController();

// Bind methods to maintain 'this' context
module.exports = {
  getPaymentMethods: paymentController.getPaymentMethods.bind(paymentController),
  calculateFees: paymentController.calculateFees.bind(paymentController),
  initializePayment: paymentController.initializePayment.bind(paymentController),
  processCardPayment: paymentController.processCardPayment.bind(paymentController),
  processVodafoneCash: paymentController.processVodafoneCash.bind(paymentController),
  processCashOnDelivery: paymentController.processCashOnDelivery.bind(paymentController),
  processPayPalPayment: paymentController.processPayPalPayment.bind(paymentController),
  capturePayPalPayment: paymentController.capturePayPalPayment.bind(paymentController),
  processBankTransfer: paymentController.processBankTransfer.bind(paymentController),
  getPaymentStatus: paymentController.getPaymentStatus.bind(paymentController),
  getPayments: paymentController.getPayments.bind(paymentController),
  getPaymentStatistics: paymentController.getPaymentStatistics.bind(paymentController),
  processRefund: paymentController.processRefund.bind(paymentController),
  verifyBankTransfer: paymentController.verifyBankTransfer.bind(paymentController),
  handleWebhook: paymentController.handleWebhook.bind(paymentController)
};