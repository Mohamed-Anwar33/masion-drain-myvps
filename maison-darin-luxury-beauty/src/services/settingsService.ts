import { apiClient } from './apiClient';

export interface SiteSettings {
  site: {
    title: { en: string; ar: string };
    tagline: { en: string; ar: string };
    description: { en: string; ar: string };
    email: string;
    phone: string;
    address: string;
    socialMedia: {
      instagram: string;
      facebook: string;
      twitter: string;
      tiktok?: string;
      youtube?: string;
    };
  };
  seo: {
    metaTitle: { en: string; ar: string };
    metaDescription: { en: string; ar: string };
    keywords: { en: string; ar: string };
    enableSitemap: boolean;
    enableRobots: boolean;
  };
  appearance: {
    primaryColor: string;
    accentColor: string;
    logoUrl: string;
    faviconUrl: string;
    enableAnimations: boolean;
    enableParallax: boolean;
  };
  features: {
    enableSampleRequests: boolean;
    enableNewsletter: boolean;
    enableLiveChat: boolean;
    enableAnalytics: boolean;
    maintenanceMode: boolean;
  };
  shipping: {
    enableShipping: boolean;
    freeShippingThreshold: number;
    domesticShipping: {
      enabled: boolean;
      cost: number;
      estimatedDays: string;
      description: { en: string; ar: string };
    };
    internationalShipping: {
      enabled: boolean;
      cost: number;
      estimatedDays: string;
      description: { en: string; ar: string };
    };
    expressShipping: {
      enabled: boolean;
      cost: number;
      estimatedDays: string;
      description: { en: string; ar: string };
    };
  };
  taxes: {
    enableTaxes: boolean;
    taxIncludedInPrice: boolean;
    defaultTaxRate: number;
    displayTaxBreakdown: boolean;
    taxRates: Array<{
      name: { en: string; ar: string };
      rate: number;
      countries: string[];
      enabled: boolean;
    }>;
  };
  localization: {
    defaultLanguage: 'en' | 'ar';
    enableRTL: boolean;
    dateFormat: string;
    currencySymbol: string;
    currencyCode?: string;
    timezone?: string;
  };
}

export interface ShippingCalculation {
  cost: number;
  isFree: boolean;
  reason?: string;
  type?: string;
  countryCode?: string;
}

export interface TaxCalculation {
  taxAmount: number;
  taxRate: number;
  taxIncluded: boolean;
  countryCode?: string;
}

class SettingsService {
  private baseUrl = '/settings';

  async getSettings(): Promise<SiteSettings> {
    const response = await apiClient.get(this.baseUrl);
    return response.data.data;
  }

  async updateSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    const response = await apiClient.put(this.baseUrl, { settings });
    return response.data.data;
  }

  async getSettingSection(section: keyof SiteSettings): Promise<any> {
    const response = await apiClient.get(`${this.baseUrl}/${section}`);
    return response.data.data.settings;
  }

  async updateSettingSection(section: keyof SiteSettings, settings: any): Promise<any> {
    const response = await apiClient.put(`${this.baseUrl}/${section}`, { settings });
    return response.data.data.settings;
  }

  async getSiteInfo(language: 'en' | 'ar' = 'en'): Promise<any> {
    const response = await apiClient.get(`${this.baseUrl}/site-info`, {
      params: { language }
    });
    return response.data.data;
  }

  async getShippingSettings(): Promise<any> {
    const response = await apiClient.get(`${this.baseUrl}/shipping`);
    return response.data.data;
  }

  async calculateShipping(
    countryCode: string, 
    orderTotal: number = 0, 
    shippingType: string = 'standard'
  ): Promise<ShippingCalculation> {
    const response = await apiClient.post(`${this.baseUrl}/calculate-shipping`, {
      countryCode,
      orderTotal,
      shippingType
    });
    return response.data.data;
  }

  async getTaxSettings(): Promise<any> {
    const response = await apiClient.get(`${this.baseUrl}/taxes`);
    return response.data.data;
  }

  async calculateTax(amount: number, countryCode: string): Promise<TaxCalculation> {
    const response = await apiClient.post(`${this.baseUrl}/calculate-tax`, {
      amount,
      countryCode
    });
    return response.data.data;
  }

  async exportSettings(): Promise<Blob> {
    const response = await apiClient.get(`${this.baseUrl}/export`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async importSettings(importData: any): Promise<SiteSettings> {
    const response = await apiClient.post(`${this.baseUrl}/import`, importData);
    return response.data.data;
  }

  async resetSettings(): Promise<SiteSettings> {
    const response = await apiClient.post(`${this.baseUrl}/reset`);
    return response.data.data;
  }
}

export const settingsService = new SettingsService();