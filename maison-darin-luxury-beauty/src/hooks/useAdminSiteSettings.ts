import { useState, useEffect } from 'react';
import { siteSettingsService, SiteSettings } from '@/services/siteSettingsService';

export const useAdminSiteSettings = () => {
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSiteSettings = async () => {
    try {
      setLoading(true);
      const data = await siteSettingsService.getSiteSettings();
      setSiteSettings(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching admin site settings:', err);
      setError('Failed to load site settings');
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
