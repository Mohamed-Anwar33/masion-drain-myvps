import { useState, useEffect, useCallback } from 'react';
import homePageService, { AboutSection } from '../services/homePageService';

export const useAboutSection = () => {
  const [aboutData, setAboutData] = useState<AboutSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch about section data
  const fetchAboutData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await homePageService.getAboutSection();
      setAboutData(data);
    } catch (err: any) {
      console.error('Error fetching about section:', err);
      setError(err.message || 'Failed to fetch about section');
    } finally {
      setLoading(false);
    }
  }, []);

  // Update about section
  const updateAbout = useCallback(async (data: Partial<AboutSection>) => {
    try {
      setError(null);
      const updatedData = await homePageService.updateAboutSection(data);
      setAboutData(updatedData);
      return updatedData;
    } catch (err: any) {
      console.error('Error updating about section:', err);
      setError(err.message || 'Failed to update about section');
      throw err;
    }
  }, []);

  // Refresh data
  const refreshAbout = useCallback(() => {
    return fetchAboutData();
  }, [fetchAboutData]);

  // Load data on mount
  useEffect(() => {
    fetchAboutData();
  }, [fetchAboutData]);

  return {
    aboutData,
    loading,
    error,
    updateAbout,
    refreshAbout
  };
};
