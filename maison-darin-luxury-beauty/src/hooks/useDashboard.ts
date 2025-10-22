import { useState, useEffect, useCallback } from 'react';
import { dashboardService, DashboardStats, OverviewStats, RecentOrder } from '@/services/dashboardService';

interface UseDashboardResult {
  data: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

interface UseOverviewStatsResult {
  data: OverviewStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseRecentOrdersResult {
  data: RecentOrder[] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to manage complete dashboard statistics
 */
export function useDashboard(): UseDashboardResult {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const stats = await dashboardService.getDashboardStats();
      setData(stats);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
      setError(errorMessage);
      console.error('Dashboard data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    lastUpdated,
  };
}

/**
 * Hook to manage overview statistics only
 */
export function useOverviewStats(): UseOverviewStatsResult {
  const [data, setData] = useState<OverviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const stats = await dashboardService.getOverviewStats();
      setData(stats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch overview stats';
      setError(errorMessage);
      console.error('Overview stats fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

/**
 * Hook to manage recent orders
 */
export function useRecentOrders(): UseRecentOrdersResult {
  const [data, setData] = useState<RecentOrder[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const orders = await dashboardService.getRecentOrders();
      setData(orders);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch recent orders';
      setError(errorMessage);
      console.error('Recent orders fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

/**
 * Hook with auto-refresh functionality
 */
export function useDashboardWithAutoRefresh(intervalMs: number = 5 * 60 * 1000): UseDashboardResult {
  const dashboardResult = useDashboard();

  useEffect(() => {
    if (intervalMs <= 0) return;

    const interval = setInterval(() => {
      dashboardResult.refetch();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [dashboardResult.refetch, intervalMs]);

  return dashboardResult;
}