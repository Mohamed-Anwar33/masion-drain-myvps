import { apiClient } from './apiClient';

export interface PaymentGatewayCredentials {
  // Paymob
  apiKey?: string;
  secretKey?: string;
  merchantId?: string;
  visaIntegrationId?: string;
  mastercardIntegrationId?: string;
  webhookSecret?: string;
  
  // Fawry
  merchantCode?: string;
  
  // PayPal
  clientId?: string;
  clientSecret?: string;
  webhookId?: string;
}

export interface PaymentGateway {
  enabled: boolean;
  environment: 'sandbox' | 'production';
  credentials: PaymentGatewayCredentials;
}

export interface BankAccount {
  bankName: { en: string; ar: string };
  accountName: { en: string; ar: string };
  accountNumber: string;
  iban: string;
  swiftCode: string;
  currency: string;
  instructions: { en: string; ar: string };
}

export interface PaymentGatewaysSettings {
  paymob?: PaymentGateway;
  fawry?: PaymentGateway;
  paypal?: PaymentGateway;
  bankTransfer?: {
    enabled: boolean;
    accounts: BankAccount[];
  };
}

export interface GatewayStatus {
  enabled: boolean;
  environment: string;
  configured: boolean;
  accountsConfigured?: number;
}

class PaymentGatewayService {
  private baseUrl = '/settings/payment-gateways';

  async getPaymentGateways(): Promise<PaymentGatewaysSettings> {
    const response = await apiClient.get(this.baseUrl);
    return response.data.data;
  }

  async getGatewaysStatus(): Promise<Record<string, GatewayStatus>> {
    const response = await apiClient.get(`${this.baseUrl}/status`);
    return response.data.data;
  }

  async updateGateway(
    gateway: string,
    settings: Partial<PaymentGateway> | { enabled: boolean; accounts: BankAccount[] }
  ): Promise<any> {
    const response = await apiClient.put(`${this.baseUrl}/${gateway}`, { settings });
    return response.data.data;
  }

  async testGateway(gateway: string): Promise<{
    success: boolean;
    message: string;
    status: string;
    environment?: string;
  }> {
    const response = await apiClient.post(`${this.baseUrl}/${gateway}/test`);
    return response.data.data;
  }
}

export const paymentGatewayService = new PaymentGatewayService();
