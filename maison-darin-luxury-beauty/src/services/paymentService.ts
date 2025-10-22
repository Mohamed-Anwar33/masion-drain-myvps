import { apiClient } from './apiClient';

export interface PaymentMethod {
  name: string;
  displayName: string;
  type: string;
  description: string;
  instructions: string;
  icon: string;
  color: string;
  minAmount: number;
  maxAmount: number;
  supportedCurrencies: string[];
  fees: {
    fixed: number;
    percentage: number;
  };
}

export interface PaymentInitialization {
  paymentId: string;
  amount: number;
  currency: string;
  expiresAt: string;
  nextStep: any;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  transactionId?: string;
  status?: string;
  message?: string;
  error?: string;
  approvalUrl?: string;
}

class PaymentService {
  private baseUrl = '/api/payments';

  // Get available payment methods
  async getPaymentMethods(currency = 'EGP'): Promise<{ success: boolean; paymentMethods?: PaymentMethod[]; error?: string }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/methods`, {
        params: { currency }
      });
      return response.data;
    } catch (error: any) {
      console.error('Get payment methods error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get payment methods'
      };
    }
  }

  // Calculate payment fees
  async calculateFees(paymentMethod: string, amount: number, currency = 'EGP') {
    try {
      const response = await apiClient.post(`${this.baseUrl}/calculate-fees`, {
        paymentMethod,
        amount,
        currency
      });
      return response.data;
    } catch (error: any) {
      console.error('Calculate fees error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to calculate fees'
      };
    }
  }

  // Initialize payment
  async initializePayment(
    orderId: string, 
    paymentMethod: string, 
    customerData?: any
  ): Promise<{ success: boolean; data?: PaymentInitialization; error?: string }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/initialize`, {
        orderId,
        paymentMethod,
        customerData
      });
      
      if (response.data.success) {
        return {
          success: true,
          data: {
            paymentId: response.data.paymentId,
            amount: response.data.amount,
            currency: response.data.currency,
            expiresAt: response.data.expiresAt,
            nextStep: response.data.nextStep
          }
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to initialize payment'
        };
      }
    } catch (error: any) {
      console.error('Initialize payment error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to initialize payment'
      };
    }
  }

  // Process card payment
  async processCardPayment(
    paymentId: string, 
    cardDetails: {
      cardNumber: string;
      expiryDate: string;
      cvv: string;
      cardholderName: string;
    }
  ): Promise<PaymentResult> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/process/card`, {
        paymentId,
        cardDetails
      });
      return response.data;
    } catch (error: any) {
      console.error('Process card payment error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to process card payment'
      };
    }
  }

  // Process Vodafone Cash payment
  async processVodafoneCash(paymentId: string, phoneNumber: string): Promise<PaymentResult> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/process/vodafone-cash`, {
        paymentId,
        phoneNumber
      });
      return response.data;
    } catch (error: any) {
      console.error('Process Vodafone Cash error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to process Vodafone Cash payment'
      };
    }
  }

  // Process PayPal payment
  async processPayPalPayment(paymentId: string): Promise<PaymentResult> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/process/paypal`, {
        paymentId
      });
      return response.data;
    } catch (error: any) {
      console.error('Process PayPal payment error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to process PayPal payment'
      };
    }
  }

  // Capture PayPal payment
  async capturePayPalPayment(paymentId: string, paypalOrderId: string): Promise<PaymentResult> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/process/paypal/capture`, {
        paymentId,
        paypalOrderId
      });
      return response.data;
    } catch (error: any) {
      console.error('Capture PayPal payment error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to capture PayPal payment'
      };
    }
  }

  // Process Cash on Delivery
  async processCashOnDelivery(paymentId: string): Promise<PaymentResult> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/process/cash-on-delivery`, {
        paymentId
      });
      return response.data;
    } catch (error: any) {
      console.error('Process COD error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to process cash on delivery'
      };
    }
  }

  // Process Bank Transfer
  async processBankTransfer(paymentId: string, bankReference?: string): Promise<PaymentResult> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/process/bank-transfer`, {
        paymentId,
        bankReference
      });
      return response.data;
    } catch (error: any) {
      console.error('Process bank transfer error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to process bank transfer'
      };
    }
  }

  // Get payment status
  async getPaymentStatus(paymentId: string) {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${paymentId}/status`);
      return response.data;
    } catch (error: any) {
      console.error('Get payment status error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get payment status'
      };
    }
  }

  // Admin functions

  // Get payments list (admin)
  async getPayments(filters: any = {}) {
    try {
      const response = await apiClient.get(this.baseUrl, {
        params: filters
      });
      return response.data;
    } catch (error: any) {
      console.error('Get payments error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get payments'
      };
    }
  }

  // Get payment statistics (admin)
  async getPaymentStatistics(filters: any = {}) {
    try {
      const response = await apiClient.get(`${this.baseUrl}/statistics`, {
        params: filters
      });
      return response.data;
    } catch (error: any) {
      console.error('Get payment statistics error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get payment statistics'
      };
    }
  }

  // Process refund (admin)
  async processRefund(paymentId: string, amount: number, reason: string) {
    try {
      const response = await apiClient.post(`${this.baseUrl}/${paymentId}/refund`, {
        amount,
        reason
      });
      return response.data;
    } catch (error: any) {
      console.error('Process refund error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to process refund'
      };
    }
  }

  // Verify bank transfer (admin)
  async verifyBankTransfer(paymentId: string, verified: boolean, adminNotes?: string) {
    try {
      const response = await apiClient.post(`${this.baseUrl}/${paymentId}/verify-bank-transfer`, {
        verified,
        adminNotes
      });
      return response.data;
    } catch (error: any) {
      console.error('Verify bank transfer error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to verify bank transfer'
      };
    }
  }

  // Utility functions

  // Format payment method name for display
  formatPaymentMethodName(method: string, language = 'ar'): string {
    const names: Record<string, Record<string, string>> = {
      visa: { ar: 'فيزا', en: 'Visa' },
      mastercard: { ar: 'ماستركارد', en: 'Mastercard' },
      vodafone_cash: { ar: 'فودافون كاش', en: 'Vodafone Cash' },
      cash_on_delivery: { ar: 'الدفع عند الاستلام', en: 'Cash on Delivery' },
      bank_transfer: { ar: 'تحويل بنكي', en: 'Bank Transfer' },
      paypal: { ar: 'باي بال', en: 'PayPal' }
    };

    return names[method]?.[language] || method;
  }

  // Format payment status for display
  formatPaymentStatus(status: string, language = 'ar'): string {
    const statuses: Record<string, Record<string, string>> = {
      pending: { ar: 'في الانتظار', en: 'Pending' },
      processing: { ar: 'قيد المعالجة', en: 'Processing' },
      completed: { ar: 'مكتملة', en: 'Completed' },
      failed: { ar: 'فاشلة', en: 'Failed' },
      cancelled: { ar: 'ملغية', en: 'Cancelled' },
      refunded: { ar: 'مستردة', en: 'Refunded' },
      partially_refunded: { ar: 'مستردة جزئياً', en: 'Partially Refunded' }
    };

    return statuses[status]?.[language] || status;
  }

  // Validate card number using Luhn algorithm
  validateCardNumber(cardNumber: string): boolean {
    const digits = cardNumber.replace(/\D/g, '');
    
    if (digits.length < 13 || digits.length > 19) {
      return false;
    }

    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  // Detect card type from number
  detectCardType(cardNumber: string): string {
    const number = cardNumber.replace(/\D/g, '');
    
    if (/^4/.test(number)) return 'visa';
    if (/^5[1-5]/.test(number)) return 'mastercard';
    if (/^3[47]/.test(number)) return 'amex';
    if (/^6/.test(number)) return 'discover';
    
    return 'unknown';
  }

  // Validate expiry date
  validateExpiryDate(expiryDate: string): boolean {
    const match = expiryDate.match(/^(0[1-9]|1[0-2])\/([0-9]{2})$/);
    if (!match) return false;

    const month = parseInt(match[1]);
    const year = parseInt(match[2]) + 2000;
    const expiry = new Date(year, month - 1);
    const now = new Date();

    return expiry > now;
  }

  // Validate CVV
  validateCVV(cvv: string, cardType?: string): boolean {
    if (cardType === 'amex') {
      return /^[0-9]{4}$/.test(cvv);
    }
    return /^[0-9]{3}$/.test(cvv);
  }

  // Validate Egyptian phone number for Vodafone Cash
  validateVodafoneNumber(phoneNumber: string): boolean {
    return /^01[0125][0-9]{8}$/.test(phoneNumber);
  }
}

export const paymentService = new PaymentService();