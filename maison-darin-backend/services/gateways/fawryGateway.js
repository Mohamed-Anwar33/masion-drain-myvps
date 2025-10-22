const axios = require('axios');
const crypto = require('crypto');
const paymentEncryption = require('../../utils/paymentEncryption');

class FawryGateway {
  constructor() {
    this.merchantCode = process.env.FAWRY_MERCHANT_CODE;
    this.secretKey = process.env.FAWRY_SECRET_KEY;
    this.environment = process.env.FAWRY_ENVIRONMENT || 'sandbox';
    
    this.baseUrl = this.environment === 'production' 
      ? 'https://www.atfawry.com/fawrypay-api/api'
      : 'https://atfawry.fawrystaging.com/fawrypay-api/api';
  }

  // Generate signature for Fawry requests
  generateSignature(data) {
    try {
      // Fawry signature format: merchantCode + merchantRefNum + customerProfileId + paymentMethod + amount + currencyCode + secretKey
      const signatureString = [
        data.merchantCode || this.merchantCode,
        data.merchantRefNum,
        data.customerProfileId || '',
        data.paymentMethod || '',
        data.amount,
        data.currencyCode || 'EGP',
        this.secretKey
      ].join('');

      return crypto.createHash('sha256').update(signatureString).digest('hex');
    } catch (error) {
      console.error('Fawry signature generation error:', error);
      throw new Error('Failed to generate signature');
    }
  }

  // Process Vodafone Cash payment
  async processVodafoneCashPayment(paymentData, phoneNumber) {
    try {
      const merchantRefNum = `VF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const requestData = {
        merchantCode: this.merchantCode,
        merchantRefNum,
        customerMobile: phoneNumber,
        customerEmail: paymentData.customerEmail,
        paymentMethod: 'VFCASH',
        amount: paymentData.amount,
        currencyCode: 'EGP',
        language: 'ar-eg',
        chargeItems: [{
          itemId: paymentData.orderId,
          description: `Order ${paymentData.orderNumber}`,
          price: paymentData.amount,
          quantity: 1
        }]
      };

      // Generate signature
      requestData.signature = this.generateSignature(requestData);

      const response = await axios.post(`${this.baseUrl}/payments/charge`, requestData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = response.data;

      if (result.statusCode === 200) {
        return {
          success: true,
          transactionId: result.fawryRefNumber,
          merchantRefNum,
          response: result
        };
      } else {
        return {
          success: false,
          errorCode: result.statusCode?.toString() || 'PAYMENT_FAILED',
          errorMessage: result.statusDescription || 'Vodafone Cash payment failed',
          response: result
        };
      }

    } catch (error) {
      console.error('Fawry Vodafone Cash payment error:', error.response?.data || error.message);
      return {
        success: false,
        errorCode: 'GATEWAY_ERROR',
        errorMessage: 'Gateway communication error'
      };
    }
  }

  // Check payment status
  async checkPaymentStatus(merchantRefNum) {
    try {
      const requestData = {
        merchantCode: this.merchantCode,
        merchantRefNumber: merchantRefNum
      };

      // Generate signature for status check
      const signatureString = this.merchantCode + merchantRefNum + this.secretKey;
      requestData.signature = crypto.createHash('sha256').update(signatureString).digest('hex');

      const response = await axios.get(`${this.baseUrl}/payments/status`, {
        params: requestData
      });

      const result = response.data;

      return {
        success: true,
        status: this.mapFawryStatus(result.paymentStatus),
        fawryRefNumber: result.fawryRefNumber,
        response: result
      };

    } catch (error) {
      console.error('Fawry status check error:', error.response?.data || error.message);
      return {
        success: false,
        error: 'Failed to check payment status'
      };
    }
  }

  // Map Fawry status to our internal status
  mapFawryStatus(fawryStatus) {
    const statusMap = {
      'PAID': 'completed',
      'UNPAID': 'pending',
      'CANCELLED': 'cancelled',
      'EXPIRED': 'failed',
      'PARTIAL': 'processing'
    };

    return statusMap[fawryStatus] || 'pending';
  }

  // Refund Vodafone Cash payment
  async refundVodafoneCash(originalRefNum, amount, reason) {
    try {
      const refundRefNum = `REF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const requestData = {
        merchantCode: this.merchantCode,
        referenceNumber: refundRefNum,
        fawryRefNumber: originalRefNum,
        refundAmount: amount,
        reason: reason || 'Customer request'
      };

      // Generate signature for refund
      const signatureString = [
        this.merchantCode,
        refundRefNum,
        originalRefNum,
        amount,
        reason || '',
        this.secretKey
      ].join('');
      
      requestData.signature = crypto.createHash('sha256').update(signatureString).digest('hex');

      const response = await axios.post(`${this.baseUrl}/payments/refund`, requestData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = response.data;

      if (result.statusCode === 200) {
        return {
          success: true,
          refundId: result.fawryRefNumber,
          refundRefNum,
          response: result
        };
      } else {
        return {
          success: false,
          errorCode: result.statusCode?.toString() || 'REFUND_FAILED',
          errorMessage: result.statusDescription || 'Refund failed',
          response: result
        };
      }

    } catch (error) {
      console.error('Fawry refund error:', error.response?.data || error.message);
      return {
        success: false,
        error: 'Refund processing failed'
      };
    }
  }

  // Verify webhook signature
  verifyWebhook(payload, signature) {
    try {
      const webhookSecret = process.env.FAWRY_WEBHOOK_SECRET || this.secretKey;
      
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      return paymentEncryption.secureCompare(signature, expectedSignature);
    } catch (error) {
      console.error('Fawry webhook verification error:', error);
      return false;
    }
  }

  // Process webhook notification
  async processWebhook(payload) {
    try {
      return {
        success: true,
        merchantRefNum: payload.merchantRefNumber,
        fawryRefNumber: payload.fawryRefNumber,
        status: this.mapFawryStatus(payload.paymentStatus),
        amount: payload.paymentAmount,
        currency: 'EGP',
        gatewayResponse: payload
      };
    } catch (error) {
      console.error('Fawry webhook processing error:', error);
      return {
        success: false,
        error: 'Failed to process webhook'
      };
    }
  }

  // Get supported payment methods
  getSupportedMethods() {
    return [
      {
        method: 'VFCASH',
        name: 'Vodafone Cash',
        minAmount: 5,
        maxAmount: 30000,
        currency: 'EGP'
      }
    ];
  }

  // Validate phone number for Vodafone Cash
  validateVodafoneNumber(phoneNumber) {
    // Egyptian Vodafone numbers start with 010, 011, 012, or 015
    const vodafonePattern = /^01[0125][0-9]{8}$/;
    return vodafonePattern.test(phoneNumber);
  }

  // Generate payment URL for redirect (if needed)
  generatePaymentUrl(paymentData) {
    try {
      const params = new URLSearchParams({
        merchantCode: this.merchantCode,
        merchantRefNum: paymentData.merchantRefNum,
        amount: paymentData.amount,
        currencyCode: 'EGP',
        signature: paymentData.signature
      });

      return `${this.baseUrl}/payments/charge?${params.toString()}`;
    } catch (error) {
      console.error('Fawry payment URL generation error:', error);
      return null;
    }
  }
}

module.exports = new FawryGateway();