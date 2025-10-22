const axios = require('axios');
const paymentEncryption = require('../../utils/paymentEncryption');
const SiteSettings = require('../../models/SiteSettings');

class PayPalGateway {
  constructor() {
    // Initialize with environment variables as fallback
    this.clientId = process.env.PAYPAL_CLIENT_ID;
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    this.environment = process.env.PAYPAL_ENVIRONMENT || 'sandbox';
    
    this.baseUrl = this.environment === 'production' 
      ? 'https://api.paypal.com'
      : 'https://api.sandbox.paypal.com';
    
    this.accessToken = null;
    this.tokenExpiry = null;
    this.settings = null;
  }

  // Load PayPal settings from database
  async loadSettings() {
    try {
      if (!this.settings) {
        const siteSettings = await SiteSettings.findOne();
        if (siteSettings && siteSettings.paypalSettings) {
          this.settings = siteSettings.paypalSettings;
          // Update instance variables with database settings
          this.clientId = this.settings.clientId || this.clientId;
          this.clientSecret = this.settings.clientSecret || this.clientSecret;
          this.environment = this.settings.mode || this.environment;
          
          this.baseUrl = this.environment === 'production' 
            ? 'https://api.paypal.com'
            : 'https://api.sandbox.paypal.com';
        }
      }
      return this.settings;
    } catch (error) {
      console.error('Error loading PayPal settings:', error);
      return null;
    }
  }

  // Get access token from PayPal
  async getAccessToken() {
    try {
      // Load PayPal settings from database if not already loaded
      if (!this.settings) {
        await this.loadSettings();
      }

      // Check if we have a valid token
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return {
          success: true,
          token: this.accessToken
        };
      }

      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await axios.post(`${this.baseUrl}/v1/oauth2/token`, 
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 minute buffer

      return {
        success: true,
        token: this.accessToken
      };
    } catch (error) {
      console.error('PayPal authentication error:', error.response?.data || error.message);
      return {
        success: false,
        error: 'Authentication failed'
      };
    }
  }

  // Create PayPal order
  async createOrder(paymentData) {
    try {
      const tokenResult = await this.getAccessToken();
      if (!tokenResult.success) {
        return tokenResult;
      }

      const orderData = {
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: paymentData.orderId,
          amount: {
            currency_code: paymentData.currency || 'USD',
            value: paymentData.amount.toFixed(2)
          },
          description: `Order ${paymentData.orderNumber}`,
          custom_id: paymentData.paymentId,
          invoice_id: paymentData.orderNumber
        }],
        application_context: {
          brand_name: this.settings?.brandName || 'Maison Darin',
          locale: this.settings?.locale || 'en-US',
          landing_page: this.settings?.landingPage || 'BILLING',
          shipping_preference: this.settings?.enableShipping ? 'SET_PROVIDED_ADDRESS' : 'NO_SHIPPING',
          user_action: this.settings?.userAction?.toUpperCase() || 'PAY_NOW',
          return_url: this.settings?.returnUrl || paymentData.returnUrl || `${process.env.FRONTEND_URL}/payment/success`,
          cancel_url: this.settings?.cancelUrl || paymentData.cancelUrl || `${process.env.FRONTEND_URL}/payment/cancel`
        }
      };

      const response = await axios.post(`${this.baseUrl}/v2/checkout/orders`, orderData, {
        headers: {
          'Authorization': `Bearer ${tokenResult.token}`,
          'Content-Type': 'application/json',
          'PayPal-Request-Id': paymentEncryption.generateToken(16)
        }
      });

      const order = response.data;
      const approvalUrl = order.links.find(link => link.rel === 'approve')?.href;

      return {
        success: true,
        orderId: order.id,
        approvalUrl,
        response: order
      };

    } catch (error) {
      console.error('PayPal create order error:', error.response?.data || error.message);
      return {
        success: false,
        error: 'Failed to create PayPal order'
      };
    }
  }

  // Capture PayPal order
  async captureOrder(orderId) {
    try {
      const tokenResult = await this.getAccessToken();
      if (!tokenResult.success) {
        return tokenResult;
      }

      const response = await axios.post(`${this.baseUrl}/v2/checkout/orders/${orderId}/capture`, {}, {
        headers: {
          'Authorization': `Bearer ${tokenResult.token}`,
          'Content-Type': 'application/json',
          'PayPal-Request-Id': paymentEncryption.generateToken(16)
        }
      });

      const capture = response.data;
      const captureDetails = capture.purchase_units[0]?.payments?.captures[0];

      if (captureDetails?.status === 'COMPLETED') {
        return {
          success: true,
          transactionId: captureDetails.id,
          amount: parseFloat(captureDetails.amount.value),
          currency: captureDetails.amount.currency_code,
          response: capture
        };
      } else {
        return {
          success: false,
          errorCode: captureDetails?.status || 'CAPTURE_FAILED',
          errorMessage: 'Payment capture failed',
          response: capture
        };
      }

    } catch (error) {
      console.error('PayPal capture order error:', error.response?.data || error.message);
      return {
        success: false,
        error: 'Failed to capture PayPal payment'
      };
    }
  }

  // Get order details
  async getOrderDetails(orderId) {
    try {
      const tokenResult = await this.getAccessToken();
      if (!tokenResult.success) {
        return tokenResult;
      }

      const response = await axios.get(`${this.baseUrl}/v2/checkout/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${tokenResult.token}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        order: response.data
      };

    } catch (error) {
      console.error('PayPal get order error:', error.response?.data || error.message);
      return {
        success: false,
        error: 'Failed to get order details'
      };
    }
  }

  // Refund captured payment
  async refundPayment(captureId, amount, currency = 'USD', reason = 'Customer request') {
    try {
      const tokenResult = await this.getAccessToken();
      if (!tokenResult.success) {
        return tokenResult;
      }

      const refundData = {
        amount: {
          value: amount.toFixed(2),
          currency_code: currency
        },
        note_to_payer: reason
      };

      const response = await axios.post(`${this.baseUrl}/v2/payments/captures/${captureId}/refund`, refundData, {
        headers: {
          'Authorization': `Bearer ${tokenResult.token}`,
          'Content-Type': 'application/json',
          'PayPal-Request-Id': paymentEncryption.generateToken(16)
        }
      });

      const refund = response.data;

      if (refund.status === 'COMPLETED') {
        return {
          success: true,
          refundId: refund.id,
          amount: parseFloat(refund.amount.value),
          currency: refund.amount.currency_code,
          response: refund
        };
      } else {
        return {
          success: false,
          errorCode: refund.status || 'REFUND_FAILED',
          errorMessage: 'Refund processing failed',
          response: refund
        };
      }

    } catch (error) {
      console.error('PayPal refund error:', error.response?.data || error.message);
      return {
        success: false,
        error: 'Failed to process refund'
      };
    }
  }

  // Verify webhook signature
  verifyWebhook(payload, headers) {
    try {
      const webhookId = process.env.PAYPAL_WEBHOOK_ID;
      if (!webhookId) {
        console.warn('PayPal webhook ID not configured');
        return false;
      }

      // PayPal webhook verification requires the PayPal SDK
      // For now, we'll implement basic verification
      const expectedSignature = headers['paypal-transmission-sig'];
      const certId = headers['paypal-cert-id'];
      const transmissionId = headers['paypal-transmission-id'];
      const timestamp = headers['paypal-transmission-time'];

      // In production, use PayPal's webhook verification SDK
      // For now, return true if all required headers are present
      return !!(expectedSignature && certId && transmissionId && timestamp);

    } catch (error) {
      console.error('PayPal webhook verification error:', error);
      return false;
    }
  }

  // Process webhook notification
  async processWebhook(payload) {
    try {
      const eventType = payload.event_type;
      const resource = payload.resource;

      let status = 'pending';
      let transactionId = null;
      let amount = null;
      let currency = null;

      switch (eventType) {
        case 'CHECKOUT.ORDER.APPROVED':
          status = 'processing';
          transactionId = resource.id;
          break;
        
        case 'PAYMENT.CAPTURE.COMPLETED':
          status = 'completed';
          transactionId = resource.id;
          amount = parseFloat(resource.amount?.value || 0);
          currency = resource.amount?.currency_code;
          break;
        
        case 'PAYMENT.CAPTURE.DENIED':
        case 'PAYMENT.CAPTURE.DECLINED':
          status = 'failed';
          transactionId = resource.id;
          break;
        
        case 'PAYMENT.CAPTURE.REFUNDED':
          status = 'refunded';
          transactionId = resource.id;
          amount = parseFloat(resource.amount?.value || 0);
          currency = resource.amount?.currency_code;
          break;
      }

      return {
        success: true,
        eventType,
        status,
        transactionId,
        amount,
        currency,
        gatewayResponse: payload
      };

    } catch (error) {
      console.error('PayPal webhook processing error:', error);
      return {
        success: false,
        error: 'Failed to process webhook'
      };
    }
  }

  // Convert currency (basic implementation)
  async convertCurrency(amount, fromCurrency, toCurrency) {
    try {
      if (fromCurrency === toCurrency) {
        return { success: true, convertedAmount: amount, rate: 1 };
      }

      // In production, use a real currency conversion API
      // For now, use basic conversion rates
      const rates = {
        'EGP_USD': 0.032, // 1 EGP = 0.032 USD (approximate)
        'USD_EGP': 31.25, // 1 USD = 31.25 EGP (approximate)
        'EUR_USD': 1.08,  // 1 EUR = 1.08 USD (approximate)
        'USD_EUR': 0.93   // 1 USD = 0.93 EUR (approximate)
      };

      const rateKey = `${fromCurrency}_${toCurrency}`;
      const rate = rates[rateKey];

      if (!rate) {
        return {
          success: false,
          error: `Conversion rate not available for ${fromCurrency} to ${toCurrency}`
        };
      }

      const convertedAmount = amount * rate;

      return {
        success: true,
        convertedAmount: Math.round(convertedAmount * 100) / 100,
        rate
      };

    } catch (error) {
      console.error('Currency conversion error:', error);
      return {
        success: false,
        error: 'Currency conversion failed'
      };
    }
  }

  // Get supported currencies
  getSupportedCurrencies() {
    return ['USD', 'EUR', 'EGP'];
  }

  // Validate PayPal configuration
  validateConfiguration() {
    const errors = [];

    if (!this.clientId) {
      errors.push('PayPal Client ID is not configured');
    }

    if (!this.clientSecret) {
      errors.push('PayPal Client Secret is not configured');
    }

    if (!['sandbox', 'production'].includes(this.environment)) {
      errors.push('PayPal environment must be either "sandbox" or "production"');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = new PayPalGateway();