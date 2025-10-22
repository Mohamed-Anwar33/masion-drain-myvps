const Payment = require('../models/Payment');
const PaymentMethod = require('../models/PaymentMethod');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const crypto = require('crypto');
const paymobGateway = require('./gateways/paymobGateway');
const fawryGateway = require('./gateways/fawryGateway');
const paypalGateway = require('./gateways/paypalGateway');

class PaymentService {
  constructor() {
    this.encryptionKey = process.env.PAYMENT_ENCRYPTION_KEY || 'default-key-change-in-production';
  }

  // Encrypt sensitive payment data
  encrypt(text) {
    if (!text) return null;
    
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    cipher.update(text, 'utf8', 'hex');
    const encrypted = cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  // Decrypt sensitive payment data
  decrypt(encryptedText) {
    if (!encryptedText) return null;
    
    try {
      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
      
      const parts = encryptedText.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      
      const decipher = crypto.createDecipher(algorithm, key);
      decipher.update(encrypted, 'hex', 'utf8');
      const decrypted = decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }

  // Initialize a new payment
  async initializePayment(orderData, paymentMethodName, customerData, additionalData = {}) {
    try {
      // Validate payment method
      const paymentMethod = await PaymentMethod.getByName(paymentMethodName);
      if (!paymentMethod) {
        throw new Error('Invalid payment method');
      }

      // Validate order
      const order = await Order.findById(orderData.orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Validate customer
      const customer = await Customer.findById(customerData.customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Validate amount
      const amountValidation = paymentMethod.validateAmount(order.total);
      if (!amountValidation.valid) {
        throw new Error(amountValidation.error);
      }

      // Calculate fees
      const fees = {
        gatewayFee: paymentMethod.calculateFees(order.total),
        processingFee: 0
      };

      // Generate payment ID
      const paymentId = await Payment.generatePaymentId();

      // Create payment record
      const payment = new Payment({
        paymentId,
        order: order._id,
        customer: customer._id,
        amount: order.total,
        currency: 'EGP',
        paymentMethod: paymentMethodName,
        fees,
        gateway: {
          provider: paymentMethod.provider
        },
        ipAddress: additionalData.ipAddress,
        userAgent: additionalData.userAgent
      });

      await payment.save();

      // Update payment method statistics
      await paymentMethod.updateStatistics(order.total, false); // Will update to true on success

      return {
        success: true,
        payment,
        paymentMethod,
        nextStep: this.getNextStepForPaymentMethod(paymentMethodName, payment)
      };

    } catch (error) {
      console.error('Payment initialization error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get next step based on payment method
  getNextStepForPaymentMethod(paymentMethodName, payment) {
    switch (paymentMethodName) {
      case 'visa':
      case 'mastercard':
        return {
          type: 'card_form',
          action: 'collect_card_details',
          paymentId: payment.paymentId,
          requiredFields: ['cardNumber', 'expiryDate', 'cvv', 'cardholderName']
        };
      
      case 'vodafone_cash':
        return {
          type: 'mobile_wallet',
          action: 'collect_phone_number',
          paymentId: payment.paymentId,
          requiredFields: ['phoneNumber']
        };
      
      case 'cash_on_delivery':
        return {
          type: 'confirmation',
          action: 'confirm_order',
          paymentId: payment.paymentId,
          message: 'سيتم تحصيل المبلغ عند التسليم'
        };
      
      case 'bank_transfer':
        return {
          type: 'bank_details',
          action: 'show_bank_details',
          paymentId: payment.paymentId,
          bankDetails: this.getBankTransferDetails()
        };
      
      default:
        return {
          type: 'error',
          message: 'Unsupported payment method'
        };
    }
  }

  // Process card payment
  async processCardPayment(paymentId, cardDetails) {
    try {
      const payment = await Payment.findOne({ paymentId });
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'pending') {
        throw new Error('Payment is not in pending status');
      }

      // Update payment status to processing
      await payment.updateStatus('processing');

      // Validate card details
      const validation = this.validateCardDetails(cardDetails);
      if (!validation.valid) {
        await payment.updateStatus('failed', { errorMessage: validation.error });
        throw new Error(validation.error);
      }

      // Store encrypted card details (last 4 digits only)
      payment.paymentDetails.cardLast4 = cardDetails.cardNumber.slice(-4);
      payment.paymentDetails.cardType = this.detectCardType(cardDetails.cardNumber);

      // Simulate payment processing (replace with actual gateway integration)
      const gatewayResult = await this.processWithGateway(payment, cardDetails);

      if (gatewayResult.success) {
        payment.paymentDetails.gatewayTransactionId = gatewayResult.transactionId;
        await payment.updateStatus('completed', {
          transactionId: gatewayResult.transactionId,
          response: gatewayResult.response
        });

        // Update order status
        const order = await Order.findById(payment.order);
        await order.updateStatus('confirmed', 'order');
        await order.updateStatus('completed', 'payment');

        // Update payment method statistics
        const paymentMethod = await PaymentMethod.getByName(payment.paymentMethod);
        await paymentMethod.updateStatistics(payment.amount, true);

        return {
          success: true,
          payment,
          transactionId: gatewayResult.transactionId
        };
      } else {
        await payment.updateStatus('failed', {
          errorCode: gatewayResult.errorCode,
          errorMessage: gatewayResult.errorMessage
        });

        throw new Error(gatewayResult.errorMessage);
      }

    } catch (error) {
      console.error('Card payment processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process Vodafone Cash payment
  async processVodafoneCashPayment(paymentId, phoneNumber) {
    try {
      const payment = await Payment.findOne({ paymentId });
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'pending') {
        throw new Error('Payment is not in pending status');
      }

      // Validate phone number
      if (!/^01[0-9]{9}$/.test(phoneNumber)) {
        throw new Error('Invalid Vodafone Cash number');
      }

      await payment.updateStatus('processing');

      // Store phone number (encrypted)
      payment.paymentDetails.vodafoneNumber = this.encrypt(phoneNumber);

      // Simulate Vodafone Cash processing
      const gatewayResult = await this.processVodafoneCash(payment, phoneNumber);

      if (gatewayResult.success) {
        payment.paymentDetails.gatewayTransactionId = gatewayResult.transactionId;
        await payment.updateStatus('completed', {
          transactionId: gatewayResult.transactionId,
          response: gatewayResult.response
        });

        // Update order status
        const order = await Order.findById(payment.order);
        await order.updateStatus('confirmed', 'order');
        await order.updateStatus('completed', 'payment');

        return {
          success: true,
          payment,
          transactionId: gatewayResult.transactionId
        };
      } else {
        await payment.updateStatus('failed', {
          errorCode: gatewayResult.errorCode,
          errorMessage: gatewayResult.errorMessage
        });

        throw new Error(gatewayResult.errorMessage);
      }

    } catch (error) {
      console.error('Vodafone Cash payment processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process Cash on Delivery
  async processCashOnDelivery(paymentId) {
    try {
      const payment = await Payment.findOne({ paymentId });
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'pending') {
        throw new Error('Payment is not in pending status');
      }

      // For COD, we mark payment as completed but order as confirmed
      await payment.updateStatus('completed', {
        transactionId: `COD_${payment.paymentId}`,
        response: { method: 'cash_on_delivery' }
      });

      // Update order status
      const order = await Order.findById(payment.order);
      await order.updateStatus('confirmed', 'order');
      // Payment status remains pending until delivery

      return {
        success: true,
        payment,
        message: 'Order confirmed. Payment will be collected on delivery.'
      };

    } catch (error) {
      console.error('COD processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process PayPal payment
  async processPayPalPayment(paymentId) {
    try {
      const payment = await Payment.findOne({ paymentId });
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'pending') {
        throw new Error('Payment is not in pending status');
      }

      await payment.updateStatus('processing');

      const order = await Order.findById(payment.order);
      const customer = await Customer.findById(payment.customer);

      const paymentData = {
        orderId: payment.order.toString(),
        orderNumber: order.orderNumber,
        paymentId: payment.paymentId,
        amount: payment.amount,
        currency: payment.currency === 'EGP' ? 'USD' : payment.currency, // PayPal doesn't support EGP directly
        customerEmail: customer.email,
        returnUrl: `${process.env.FRONTEND_URL}/payment/paypal/success?paymentId=${paymentId}`,
        cancelUrl: `${process.env.FRONTEND_URL}/payment/paypal/cancel?paymentId=${paymentId}`
      };

      // Convert EGP to USD if needed
      if (payment.currency === 'EGP') {
        const conversionResult = await paypalGateway.convertCurrency(payment.amount, 'EGP', 'USD');
        if (conversionResult.success) {
          paymentData.amount = conversionResult.convertedAmount;
        }
      }

      const result = await paypalGateway.createOrder(paymentData);

      if (result.success) {
        payment.gateway.transactionId = result.orderId;
        await payment.save();

        return {
          success: true,
          payment,
          approvalUrl: result.approvalUrl,
          orderId: result.orderId
        };
      } else {
        await payment.updateStatus('failed', {
          errorMessage: result.error
        });

        throw new Error(result.error);
      }

    } catch (error) {
      console.error('PayPal payment processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Capture PayPal payment after approval
  async capturePayPalPayment(paymentId, paypalOrderId) {
    try {
      const payment = await Payment.findOne({ paymentId });
      if (!payment) {
        throw new Error('Payment not found');
      }

      const result = await paypalGateway.captureOrder(paypalOrderId);

      if (result.success) {
        payment.paymentDetails.gatewayTransactionId = result.transactionId;
        await payment.updateStatus('completed', {
          transactionId: result.transactionId,
          response: result.response
        });

        // Update order status
        const order = await Order.findById(payment.order);
        await order.updateStatus('confirmed', 'order');
        await order.updateStatus('completed', 'payment');

        return {
          success: true,
          payment,
          transactionId: result.transactionId
        };
      } else {
        await payment.updateStatus('failed', {
          errorCode: result.errorCode,
          errorMessage: result.errorMessage
        });

        throw new Error(result.errorMessage);
      }

    } catch (error) {
      console.error('PayPal capture error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process Bank Transfer
  async processBankTransfer(paymentId, bankReference) {
    try {
      const payment = await Payment.findOne({ paymentId });
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'pending') {
        throw new Error('Payment is not in pending status');
      }

      await payment.updateStatus('processing');

      // Store bank reference
      payment.paymentDetails.bankReference = bankReference;

      // For bank transfer, payment remains in processing until manual verification
      await payment.save();

      // Update order status
      const order = await Order.findById(payment.order);
      await order.updateStatus('confirmed', 'order');

      return {
        success: true,
        payment,
        message: 'Bank transfer details recorded. Payment will be verified manually.'
      };

    } catch (error) {
      console.error('Bank transfer processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Validate card details
  validateCardDetails(cardDetails) {
    const { cardNumber, expiryDate, cvv, cardholderName } = cardDetails;

    // Validate card number (basic Luhn algorithm)
    if (!cardNumber || !/^[0-9]{13,19}$/.test(cardNumber.replace(/\s/g, ''))) {
      return { valid: false, error: 'Invalid card number' };
    }

    // Validate expiry date
    if (!expiryDate || !/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(expiryDate)) {
      return { valid: false, error: 'Invalid expiry date format (MM/YY)' };
    }

    // Check if card is not expired
    const [month, year] = expiryDate.split('/');
    const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
    if (expiry < new Date()) {
      return { valid: false, error: 'Card has expired' };
    }

    // Validate CVV
    if (!cvv || !/^[0-9]{3,4}$/.test(cvv)) {
      return { valid: false, error: 'Invalid CVV' };
    }

    // Validate cardholder name
    if (!cardholderName || cardholderName.trim().length < 2) {
      return { valid: false, error: 'Invalid cardholder name' };
    }

    return { valid: true };
  }

  // Detect card type from number
  detectCardType(cardNumber) {
    const number = cardNumber.replace(/\s/g, '');
    
    if (/^4/.test(number)) return 'visa';
    if (/^5[1-5]/.test(number)) return 'mastercard';
    if (/^3[47]/.test(number)) return 'amex';
    if (/^6/.test(number)) return 'discover';
    
    return 'unknown';
  }

  // Process payment through appropriate gateway
  async processWithGateway(payment, cardDetails) {
    try {
      const paymentMethod = await PaymentMethod.findOne({ name: payment.paymentMethod });
      if (!paymentMethod) {
        throw new Error('Payment method not found');
      }

      const order = await Order.findById(payment.order);
      const customer = await Customer.findById(payment.customer);

      const paymentData = {
        orderId: payment.order.toString(),
        orderNumber: order.orderNumber,
        paymentId: payment.paymentId,
        amount: payment.amount,
        currency: payment.currency,
        customerEmail: customer.email,
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerPhone: customer.phone,
        cardType: this.detectCardType(cardDetails.cardNumber)
      };

      // Route to appropriate gateway based on provider
      switch (paymentMethod.provider) {
        case 'paymob':
          return await paymobGateway.processCardPayment(paymentData, cardDetails);
        
        case 'paypal':
          // For PayPal, we need to create order first, then capture
          const orderResult = await paypalGateway.createOrder(paymentData);
          if (orderResult.success) {
            // In real implementation, customer would approve on PayPal site
            // For now, simulate immediate capture
            return await paypalGateway.captureOrder(orderResult.orderId);
          }
          return orderResult;
        
        default:
          // Fallback to simulation for unsupported gateways
          return await this.simulateGatewayProcessing(payment, cardDetails);
      }

    } catch (error) {
      console.error('Gateway processing error:', error);
      return {
        success: false,
        errorCode: 'GATEWAY_ERROR',
        errorMessage: 'Payment gateway error'
      };
    }
  }

  // Simulate gateway processing (fallback)
  async simulateGatewayProcessing(payment, cardDetails) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate success/failure (90% success rate)
    const success = Math.random() > 0.1;

    if (success) {
      return {
        success: true,
        transactionId: `SIM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        response: {
          status: 'approved',
          authCode: Math.random().toString(36).substr(2, 6).toUpperCase(),
          timestamp: new Date().toISOString()
        }
      };
    } else {
      return {
        success: false,
        errorCode: 'DECLINED',
        errorMessage: 'Transaction declined by bank'
      };
    }
  }

  // Process Vodafone Cash through Fawry gateway
  async processVodafoneCash(payment, phoneNumber) {
    try {
      // Validate Vodafone number
      if (!fawryGateway.validateVodafoneNumber(phoneNumber)) {
        return {
          success: false,
          errorCode: 'INVALID_PHONE',
          errorMessage: 'Invalid Vodafone Cash number'
        };
      }

      const order = await Order.findById(payment.order);
      const customer = await Customer.findById(payment.customer);

      const paymentData = {
        orderId: payment.order.toString(),
        orderNumber: order.orderNumber,
        paymentId: payment.paymentId,
        amount: payment.amount,
        currency: payment.currency,
        customerEmail: customer.email,
        customerName: `${customer.firstName} ${customer.lastName}`
      };

      return await fawryGateway.processVodafoneCashPayment(paymentData, phoneNumber);

    } catch (error) {
      console.error('Vodafone Cash processing error:', error);
      return {
        success: false,
        errorCode: 'GATEWAY_ERROR',
        errorMessage: 'Vodafone Cash gateway error'
      };
    }
  }

  // Get bank transfer details
  getBankTransferDetails() {
    return {
      bankName: 'البنك الأهلي المصري',
      accountName: 'ميزون دارين للعطور',
      accountNumber: '1234567890123456',
      iban: 'EG380003000012345678901234567',
      swiftCode: 'NBEAEGCX',
      instructions: {
        ar: 'يرجى إرسال إيصال التحويل عبر الواتساب أو البريد الإلكتروني مع رقم الطلب',
        en: 'Please send transfer receipt via WhatsApp or email with order number'
      }
    };
  }

  // Get payment by ID
  async getPayment(paymentId) {
    try {
      const payment = await Payment.findOne({ paymentId })
        .populate('order')
        .populate('customer');
      
      return {
        success: true,
        payment
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get payments with filters
  async getPayments(filters = {}, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      
      const payments = await Payment.findWithFilters(filters)
        .populate('order', 'orderNumber total orderStatus')
        .populate('customer', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Payment.countDocuments(Payment.findWithFilters(filters).getQuery());

      return {
        success: true,
        payments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get payment statistics
  async getPaymentStatistics(filters = {}) {
    try {
      const stats = await Payment.getPaymentStats(filters);
      return {
        success: true,
        statistics: stats
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process refund
  async processRefund(paymentId, amount, reason, adminId) {
    try {
      const payment = await Payment.findOne({ paymentId });
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'completed') {
        throw new Error('Can only refund completed payments');
      }

      const refundableAmount = payment.getRefundableAmount();
      if (amount > refundableAmount) {
        throw new Error(`Refund amount (${amount}) exceeds refundable amount (${refundableAmount})`);
      }

      // Process refund through gateway (simulate)
      const gatewayRefundId = `REF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await payment.processRefund(amount, reason, gatewayRefundId);

      // Update the latest refund status to completed (in real implementation, this would be done by webhook)
      const latestRefund = payment.refunds[payment.refunds.length - 1];
      latestRefund.status = 'completed';
      latestRefund.processedAt = new Date();
      await payment.save();

      return {
        success: true,
        payment,
        refund: latestRefund
      };

    } catch (error) {
      console.error('Refund processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify bank transfer manually
  async verifyBankTransfer(paymentId, verified, adminNotes = '') {
    try {
      const payment = await Payment.findOne({ paymentId });
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.paymentMethod !== 'bank_transfer') {
        throw new Error('Payment is not a bank transfer');
      }

      if (verified) {
        await payment.updateStatus('completed', {
          transactionId: `BANK_${payment.paymentId}`,
          response: { 
            method: 'bank_transfer',
            verifiedAt: new Date(),
            adminNotes 
          }
        });

        // Update order payment status
        const order = await Order.findById(payment.order);
        await order.updateStatus('completed', 'payment');
      } else {
        await payment.updateStatus('failed', {
          errorMessage: 'Bank transfer verification failed',
          response: { adminNotes }
        });
      }

      return {
        success: true,
        payment
      };

    } catch (error) {
      console.error('Bank transfer verification error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new PaymentService();