import { useState, useEffect, useCallback } from 'react';
import homePageService, { FeaturedCollectionsSection, FeaturedCollection } from '../services/homePageService';

export const useFeaturedCollections = () => {
  const [collectionsData, setCollectionsData] = useState<FeaturedCollectionsSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch featured collections data
  const fetchCollectionsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await homePageService.getFeaturedCollections();
      setCollectionsData(data);
    } catch (err: any) {
      console.error('Error fetching featured collections:', err);
      setError(err.message || 'Failed to fetch featured collections');
    } finally {
      setLoading(false);
    }
  }, []);

  // Update featured collections section
  const updateCollections = useCallback(async (data: Partial<FeaturedCollectionsSection>) => {
    try {
      setError(null);
      const updatedData = await homePageService.updateFeaturedCollections(data);
      setCollectionsData(updatedData);
      return updatedData;
    } catch (err: any) {
      console.error('Error updating featured collections:', err);
      setError(err.message || 'Failed to update featured collections');
      throw err;
    }
  }, []);

  // Add a new collection
  const addCollection = useCallback(async (data: Omit<FeaturedCollection, '_id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null);
      const updatedData = await homePageService.addFeaturedCollection(data);
      setCollectionsData(updatedData);
      return updatedData;
    } catch (err: any) {
      console.error('Error adding featured collection:', err);
      setError(err.message || 'Failed to add featured collection');
      throw err;
    }
  }, []);

  // Update a specific collection
  const updateCollection = useCallback(async (collectionId: string, data: Partial<FeaturedCollection>) => {
    try {
      setError(null);
      const updatedData = await homePageService.updateFeaturedCollection(collectionId, data);
      setCollectionsData(updatedData);
      return updatedData;
    } catch (err: any) {
      console.error('Error updating featured collection:', err);
      setError(err.message || 'Failed to update featured collection');
      throw err;
    }
  }, []);

  // Remove a collection
  const removeCollection = useCallback(async (collectionId: string) => {
    try {
      setError(null);
      const updatedData = await homePageService.removeFeaturedCollection(collectionId);
      setCollectionsData(updatedData);
      return updatedData;
    } catch (err: any) {
      console.error('Error removing featured collection:', err);
      setError(err.message || 'Failed to remove featured collection');
      throw err;
    }
  }, []);

  // Refresh data
  const refreshCollections = useCallback(() => {
    return fetchCollectionsData();
  }, [fetchCollectionsData]);

  // Load data on mount
  useEffect(() => {
    fetchCollectionsData();
  }, [fetchCollectionsData]);

  return {
    collectionsData,
    loading,
    error,
    updateCollections,
    addCollection,
    updateCollection,
    removeCollection,
    refreshCollections
  };
};
