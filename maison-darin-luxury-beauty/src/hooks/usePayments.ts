import { useState } from 'react';
import { paymentService } from '@/services/paymentService';

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
  nextStep: {
    type: string;
    action: string;
    paymentId: string;
    requiredFields?: string[];
    message?: string;
    approvalUrl?: string;
    bankDetails?: any;
  };
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

export const usePayments = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get available payment methods
  const getPaymentMethods = async (currency = 'EGP'): Promise<{ success: boolean; paymentMethods?: PaymentMethod[]; error?: string }> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await paymentService.getPaymentMethods(currency);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get payment methods';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Calculate payment fees
  const calculateFees = async (paymentMethod: string, amount: number, currency = 'EGP') => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await paymentService.calculateFees(paymentMethod, amount, currency);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate fees';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Initialize payment
  const initializePayment = async (
    orderId: string, 
    paymentMethod: string, 
    customerData?: any
  ): Promise<{ success: boolean; data?: PaymentInitialization; error?: string }> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await paymentService.initializePayment(orderId, paymentMethod, customerData);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize payment';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Process card payment
  const processCardPayment = async (
    paymentId: string, 
    cardDetails: {
      cardNumber: string;
      expiryDate: string;
      cvv: string;
      cardholderName: string;
    }
  ): Promise<PaymentResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await paymentService.processCardPayment(paymentId, cardDetails);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process card payment';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Process Vodafone Cash payment
  const processVodafoneCash = async (
    paymentId: string, 
    phoneNumber: string
  ): Promise<PaymentResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await paymentService.processVodafoneCash(paymentId, phoneNumber);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process Vodafone Cash payment';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Process PayPal payment
  const processPayPalPayment = async (paymentId: string): Promise<PaymentResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await paymentService.processPayPalPayment(paymentId);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process PayPal payment';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Capture PayPal payment
  const capturePayPalPayment = async (
    paymentId: string, 
    paypalOrderId: string
  ): Promise<PaymentResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await paymentService.capturePayPalPayment(paymentId, paypalOrderId);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to capture PayPal payment';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Process Cash on Delivery
  const processCashOnDelivery = async (paymentId: string): Promise<PaymentResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await paymentService.processCashOnDelivery(paymentId);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process cash on delivery';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Process Bank Transfer
  const processBankTransfer = async (
    paymentId: string, 
    bankReference?: string
  ): Promise<PaymentResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await paymentService.processBankTransfer(paymentId, bankReference);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process bank transfer';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Get payment status
  const getPaymentStatus = async (paymentId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await paymentService.getPaymentStatus(paymentId);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get payment status';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Admin functions

  // Get payments list (admin)
  const getPayments = async (filters: any = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await paymentService.getPayments(filters);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get payments';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Get payment statistics (admin)
  const getPaymentStatistics = async (filters: any = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await paymentService.getPaymentStatistics(filters);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get payment statistics';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Process refund (admin)
  const processRefund = async (
    paymentId: string, 
    amount: number, 
    reason: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await paymentService.processRefund(paymentId, amount, reason);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process refund';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Verify bank transfer (admin)
  const verifyBankTransfer = async (
    paymentId: string, 
    verified: boolean, 
    adminNotes?: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await paymentService.verifyBankTransfer(paymentId, verified, adminNotes);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify bank transfer';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getPaymentMethods,
    calculateFees,
    initializePayment,
    processCardPayment,
    processVodafoneCash,
    processPayPalPayment,
    capturePayPalPayment,
    processCashOnDelivery,
    processBankTransfer,
    getPaymentStatus,
    getPayments,
    getPaymentStatistics,
    processRefund,
    verifyBankTransfer
  };
};