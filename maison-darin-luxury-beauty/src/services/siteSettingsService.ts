import { API_BASE_URL } from '@/config/api';
import { apiClient } from '@/services/apiClient';

export interface SiteSettings {
  emailSettings: {
    adminEmail: string;
    fromEmail: string;
    fromName: string;
    // SMTP settings removed for security - now fixed in backend
    enableNotifications: boolean;
    enableCustomerConfirmation: boolean;
  };
  siteInfo: {
    siteName: { ar: string; en: string };
    tagline: { ar: string; en: string };
    description: { ar: string; en: string };
    logo: string;
    favicon: string;
  };
  contactInfo: {
    email: string;
    phone: string;
    whatsapp: string;
    whatsappEnabled: boolean;
    address: { ar: string; en: string };
    workingHours: { ar: string; en: string };
  };
  socialMedia: {
    facebook: string;
    instagram: string;
    twitter: string;
    youtube: string;
    tiktok: string;
    snapchat: string;
  };
}

class SiteSettingsService {
  async getSiteSettings(): Promise<SiteSettings> {
    try {
      const response = await apiClient.get('/site-settings');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching site settings:', error);
      throw error;
    }
  }

  async updateSiteSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    try {
      const response = await apiClient.put('/site-settings', settings);
      return response.data.data;
    } catch (error) {
      console.error('Error updating site settings:', error);
      throw error;
    }
  }

  async getContactInfo(): Promise<SiteSettings['contactInfo']> {
    try {
      const response = await apiClient.get('/site-settings/contact');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching contact info:', error);
      throw error;
    }
  }

  async updateContactInfo(contactInfo: SiteSettings['contactInfo']): Promise<SiteSettings['contactInfo']> {
    try {
      const response = await apiClient.put('/site-settings/contact', contactInfo);
      return response.data.data;
    } catch (error) {
      console.error('Error updating contact info:', error);
      throw error;
    }
  }

  async testEmailSettings(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post('/site-settings/email/test');
      return response.data;
    } catch (error) {
      console.error('Error testing email settings:', error);
      throw error;
    }
  }
}

export const siteSettingsService = new SiteSettingsService();
