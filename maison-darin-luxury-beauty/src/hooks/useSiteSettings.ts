import { useState, useEffect } from 'react';
import { siteSettingsService, SiteSettings } from '@/services/siteSettingsService';
import { apiClient } from '@/services/apiClient';

export const useSiteSettings = () => {
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSiteSettings = async () => {
    try {
      setLoading(true);
      // استخدام Public API للبيانات العامة (بدون authentication)
      const response = await apiClient.get('/public/site-settings');
      const result = response.data;
      
      // تحويل البيانات العامة لتتوافق مع SiteSettings interface
      const publicData = result.data;
      const fullSettings: SiteSettings = {
        emailSettings: {
          adminEmail: '',
          fromEmail: '',
          fromName: '',
          enableNotifications: true,
          enableCustomerConfirmation: true
        },
        siteInfo: publicData.siteInfo || {
          siteName: { ar: 'ميزون دارين', en: 'Maison Darin' },
          tagline: { ar: 'عالم العطور الفاخرة', en: 'World of Luxury Fragrances' },
          description: { ar: 'متجر ميزون دارين للعطور الفاخرة والأصيلة', en: 'Maison Darin Luxury and Authentic Fragrances Store' },
          logo: '',
          favicon: ''
        },
        contactInfo: publicData.contactInfo || {
          email: 'info@maison-darin.com',
          phone: '+966 50 123 4567',
          whatsapp: '+966 50 123 4567',
          address: { ar: 'الرياض، المملكة العربية السعودية', en: 'Riyadh, Saudi Arabia' },
          workingHours: { ar: 'السبت - الخميس: 9:00 ص - 10:00 م', en: 'Saturday - Thursday: 9:00 AM - 10:00 PM' }
        },
        socialMedia: publicData.socialMedia || {
          facebook: '',
          instagram: '',
          twitter: '',
          youtube: '',
          tiktok: '',
          snapchat: ''
        }
      };
      setSiteSettings(fullSettings);
      setError(null);
    } catch (err) {
      console.error('Error fetching site settings:', err);
      setError('Failed to load site settings');
      // Set default values as fallback
      setSiteSettings({
        emailSettings: {
          adminEmail: 'maisondarin2025@gmail.com',
          fromEmail: 'noreply@maison-darin.com',
          fromName: 'ميزون دارين - Maison Darin',
          enableNotifications: true,
          enableCustomerConfirmation: true
        },
        contactInfo: {
          email: 'info@maison-darin.com',
          phone: '+966 50 123 4567',
          whatsapp: '+966 50 123 4567',
          address: {
            ar: 'الرياض، المملكة العربية السعودية',
            en: 'Riyadh, Saudi Arabia'
          },
          workingHours: {
            ar: 'السبت - الخميس: 9:00 ص - 10:00 م',
            en: 'Saturday - Thursday: 9:00 AM - 10:00 PM'
          }
        },
        siteInfo: {
          siteName: { ar: 'ميزون دارين', en: 'Maison Darin' },
          tagline: { ar: 'عالم العطور الفاخرة', en: 'World of Luxury Fragrances' },
          description: { ar: 'متجر ميزون دارين للعطور الفاخرة والأصيلة', en: 'Maison Darin Luxury and Authentic Fragrances Store' },
          logo: '',
          favicon: ''
        },
        socialMedia: {
          facebook: '',
          instagram: '',
          twitter: '',
          youtube: '',
          tiktok: '',
          snapchat: ''
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<SiteSettings>) => {
    try {
      const updatedSettings = await siteSettingsService.updateSiteSettings(updates);
      setSiteSettings(updatedSettings);
      return updatedSettings;
    } catch (error) {
      console.error('Error updating site settings:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchSiteSettings();
  }, []);

  return {
    siteSettings,
    loading,
    error,
    refetch: fetchSiteSettings,
    updateSettings
  };
};
