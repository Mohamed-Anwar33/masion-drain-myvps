const axios = require('axios');
const paymentEncryption = require('../../utils/paymentEncryption');

class PaymobGateway {
  constructor() {
    this.apiKey = process.env.PAYMOB_API_KEY;
    this.secretKey = process.env.PAYMOB_SECRET_KEY;
    this.merchantId = process.env.PAYMOB_MERCHANT_ID;
    this.environment = process.env.PAYMOB_ENVIRONMENT || 'sandbox';
    
    this.baseUrl = this.environment === 'production' 
      ? 'https://accept.paymob.com/api'
      : 'https://accept.paymobsolutions.com/api';
    
    this.integrationIds = {
      visa: process.env.PAYMOB_VISA_INTEGRATION_ID,
      mastercard: process.env.PAYMOB_MASTERCARD_INTEGRATION_ID
    };
  }

  // Authenticate with Paymob and get auth token
  async authenticate() {
    try {
      const response = await axios.post(`${this.baseUrl}/auth/tokens`, {
        api_key: this.apiKey
      });

      return {
        success: true,
        token: response.data.token
      };
    } catch (error) {
      console.error('Paymob authentication error:', error.response?.data || error.message);
      return {
        success: false,
        error: 'Authentication failed'
      };
    }
  }

  // Create order in Paymob
  async createOrder(authToken, orderData) {
    try {
      const response = await axios.post(`${this.baseUrl}/ecommerce/orders`, {
        auth_token: authToken,
        delivery_needed: false,
        amount_cents: Math.round(orderData.amount * 100), // Convert to cents
        currency: orderData.currency || 'EGP',
        items: orderData.items || []
      });

      return {
        success: true,
        orderId: response.data.id
      };
    } catch (error) {
      console.error('Paymob create order error:', error.response?.data || error.message);
      return {
        success: false,
        error: 'Failed to create order'
      };
    }
  }

  // Get payment key for card payment
  async getPaymentKey(authToken, orderId, paymentData) {
    try {
      const integrationId = this.integrationIds[paymentData.cardType] || this.integrationIds.visa;
      
      const response = await axios.post(`${this.baseUrl}/acceptance/payment_keys`, {
        auth_token: authToken,
        amount_cents: Math.round(paymentData.amount * 100),
        expiration: 3600, // 1 hour
        order_id: orderId,
        billing_data: {
          apartment: paymentData.billingData?.apartment || 'NA',
          email: paymentData.billingData?.email || paymentData.customerEmail,
          floor: paymentData.billingData?.floor || 'NA',
          first_name: paymentData.billingData?.firstName || paymentData.customerName?.split(' ')[0] || 'Customer',
          street: paymentData.billingData?.street || 'NA',
          building: paymentData.billingData?.building || 'NA',
          phone_number: paymentData.billingData?.phone || paymentData.customerPhone || '+201000000000',
          shipping_method: 'PKG',
          postal_code: paymentData.billingData?.postalCode || 'NA',
          city: paymentData.billingData?.city || 'Cairo',
          country: paymentData.billingData?.country || 'EG',
          last_name: paymentData.billingData?.lastName || paymentData.customerName?.split(' ').slice(1).join(' ') || 'Name',
          state: paymentData.billingData?.state || 'Cairo'
        },
        currency: paymentData.currency || 'EGP',
        integration_id: integrationId
      });

      return {
        success: true,
        paymentKey: response.data.token
      };
    } catch (error) {
      console.error('Paymob payment key error:', error.response?.data || error.message);
      return {
        success: false,
        error: 'Failed to get payment key'
      };
    }
  }

  // Process card payment
  async processCardPayment(paymentData, cardDetails) {
    try {
      // Step 1: Authenticate
      const authResult = await this.authenticate();
      if (!authResult.success) {
        return authResult;
      }

      // Step 2: Create order
      const orderResult = await this.createOrder(authResult.token, paymentData);
      if (!orderResult.success) {
        return orderResult;
      }

      // Step 3: Get payment key
      const keyResult = await this.getPaymentKey(authResult.token, orderResult.orderId, paymentData);
      if (!keyResult.success) {
        return keyResult;
      }

      // Step 4: Process payment
      const paymentResult = await this.submitCardPayment(keyResult.paymentKey, cardDetails);
      
      return {
        success: paymentResult.success,
        transactionId: paymentResult.transactionId,
        paymobOrderId: orderResult.orderId,
        response: paymentResult.response,
        errorCode: paymentResult.errorCode,
        errorMessage: paymentResult.errorMessage
      };

    } catch (error) {
      console.error('Paymob card payment error:', error);
      return {
        success: false,
        error: 'Payment processing failed'
      };
    }
  }

  // Submit card payment to Paymob
  async submitCardPayment(paymentKey, cardDetails) {
    try {
      const response = await axios.post(`${this.baseUrl}/acceptance/payments/pay`, {
        source: {
          identifier: cardDetails.cardNumber.replace(/\s/g, ''),
          sourceholder_name: cardDetails.cardholderName,
          subtype: 'CARD',
          expiry_month: cardDetails.expiryDate.split('/')[0],
          expiry_year: '20' + cardDetails.expiryDate.split('/')[1],
          cvv: cardDetails.cvv
        },
        payment_token: paymentKey
      });

      const result = response.data;

      if (result.success === true) {
        return {
          success: true,
          transactionId: result.id.toString(),
          response: result
        };
      } else {
        return {
          success: false,
          errorCode: result.data?.message || 'PAYMENT_FAILED',
          errorMessage: result.data?.message || 'Payment was declined',
          response: result
        };
      }

    } catch (error) {
      console.error('Paymob submit payment error:', error.response?.data || error.message);
      return {
        success: false,
        errorCode: 'GATEWAY_ERROR',
        errorMessage: 'Gateway communication error'
      };
    }
  }

  // Verify webhook signature
  verifyWebhook(payload, signature) {
    try {
      const crypto = require('crypto');
      const webhookSecret = process.env.PAYMOB_WEBHOOK_SECRET;
      
      if (!webhookSecret) {
        console.warn('Paymob webhook secret not configured');
        return false;
      }

      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      return paymentEncryption.secureCompare(signature, expectedSignature);
    } catch (error) {
      console.error('Paymob webhook verification error:', error);
      return false;
    }
  }

  // Process webhook notification
  async processWebhook(payload) {
    try {
      const transaction = payload.obj;
      
      return {
        success: true,
        transactionId: transaction.id?.toString(),
        status: this.mapPaymobStatus(transaction.success, transaction.pending),
        amount: transaction.amount_cents / 100,
        currency: transaction.currency,
        orderId: transaction.order?.id?.toString(),
        gatewayResponse: transaction
      };
    } catch (error) {
      console.error('Paymob webhook processing error:', error);
      return {
        success: false,
        error: 'Failed to process webhook'
      };
    }
  }

  // Map Paymob status to our internal status
  mapPaymobStatus(success, pending) {
    if (pending) return 'processing';
    if (success) return 'completed';
    return 'failed';
  }

  // Refund transaction
  async refundTransaction(transactionId, amount, reason) {
    try {
      const authResult = await this.authenticate();
      if (!authResult.success) {
        return authResult;
      }

      const response = await axios.post(`${this.baseUrl}/acceptance/void_refund/refund`, {
        auth_token: authResult.token,
        transaction_id: transactionId,
        amount_cents: Math.round(amount * 100)
      });

      return {
        success: true,
        refundId: response.data.id?.toString(),
        response: response.data
      };

    } catch (error) {
      console.error('Paymob refund error:', error.response?.data || error.message);
      return {
        success: false,
        error: 'Refund failed'
      };
    }
  }

  // Get transaction details
  async getTransaction(transactionId) {
    try {
      const authResult = await this.authenticate();
      if (!authResult.success) {
        return authResult;
      }

      const response = await axios.get(`${this.baseUrl}/acceptance/transactions/${transactionId}`, {
        params: {
          auth_token: authResult.token
        }
      });

      return {
        success: true,
        transaction: response.data
      };

    } catch (error) {
      console.error('Paymob get transaction error:', error.response?.data || error.message);
      return {
        success: false,
        error: 'Failed to get transaction details'
      };
    }
  }
}

module.exports = new PaymobGateway();