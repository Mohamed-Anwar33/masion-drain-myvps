import { useState, useEffect, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    const expiry = ttl || this.defaultTTL;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + expiry,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Global cache instance
const cacheManager = new CacheManager();

// Cleanup expired entries every minute
setInterval(() => {
  cacheManager.cleanup();
}, 60 * 1000);

export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    enabled?: boolean;
    refetchOnMount?: boolean;
  } = {}
) {
  const { ttl, enabled = true, refetchOnMount = false } = options;
  
  const [data, setData] = useState<T | null>(() => {
    if (!enabled) return null;
    return cacheManager.get<T>(key);
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return;

    // Check cache first unless forced
    if (!force && cacheManager.has(key)) {
      const cachedData = cacheManager.get<T>(key);
      if (cachedData) {
        setData(cachedData);
        return cachedData;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      cacheManager.set(key, result, ttl);
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, ttl, enabled]);

  // Fetch on mount if no cached data or refetchOnMount is true
  useEffect(() => {
    if (!enabled) return;

    const cachedData = cacheManager.get<T>(key);
    if (!cachedData || refetchOnMount) {
      fetchData();
    } else {
      setData(cachedData);
    }
  }, [key, enabled, refetchOnMount, fetchData]);

  const invalidate = useCallback(() => {
    cacheManager.delete(key);
    setData(null);
  }, [key]);

  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch,
    invalidate,
    isCached: cacheManager.has(key),
  };
}

// Hook for managing multiple cache entries
export function useCacheManager() {
  const invalidateAll = useCallback(() => {
    cacheManager.clear();
  }, []);

  const invalidateByPattern = useCallback((pattern: string | RegExp) => {
    const keys = Array.from(cacheManager.getStats().keys);
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    
    keys.forEach(key => {
      if (regex.test(key)) {
        cacheManager.delete(key);
      }
    });
  }, []);

  const getStats = useCallback(() => {
    return cacheManager.getStats();
  }, []);

  return {
    invalidateAll,
    invalidateByPattern,
    getStats,
  };
}

// Specialized hooks for admin data
export function useAdminStats() {
  return useCache(
    'admin-stats',
    async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        products: Math.floor(Math.random() * 50) + 10,
        customers: Math.floor(Math.random() * 2000) + 1000,
        samples: Math.floor(Math.random() * 1000) + 500,
        visits: Math.floor(Math.random() * 10000) + 5000,
      };
    },
    { ttl: 2 * 60 * 1000 } // 2 minutes
  );
}

export function useProductsData() {
  return useCache(
    'products-data',
    async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      return [
        { id: 1, name: 'Floral Symphony', status: 'active', views: 245, likes: 67 },
        { id: 2, name: 'Oriental Mystique', status: 'active', views: 198, likes: 45 },
        { id: 3, name: 'Fresh Breeze', status: 'active', views: 156, likes: 32 },
        { id: 4, name: 'Royal Garden', status: 'draft', views: 89, likes: 28 },
      ];
    },
    { ttl: 5 * 60 * 1000 } // 5 minutes
  );
}

export function useActivitiesData() {
  return useCache(
    'activities-data',
    async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 600));
      return [
        { action: 'New sample request', item: 'Floral Symphony', time: '5 minutes ago' },
        { action: 'Product updated', item: 'Oriental Mystique', time: '15 minutes ago' },
        { action: 'New image uploaded', item: 'Media Library', time: '30 minutes ago' },
        { action: 'Content updated', item: 'About Section', time: '1 hour ago' },
      ];
    },
    { ttl: 1 * 60 * 1000 } // 1 minute
  );
}