import { apiClient } from './apiClient';

export interface DashboardStats {
  overview: {
    totalProducts: number;
    totalCustomers: number;
    todayOrders: number;
    pendingOrders: number;
  };
  products: {
    total: number;
    inStock: number;
    outOfStock: number;
    lowStock: number;
  };
  orders: {
    today: number;
    pending: number;
    recent: RecentOrder[];
    byStatus: Record<string, number>;
  };
  customers: {
    total: number;
  };
  revenue: {
    today: number;
    thisMonth: number;
    lastMonth: number;
    total: number;
  };
  lastUpdated: string;
}

export interface RecentOrder {
  _id: string;
  orderNumber: string;
  customerInfo: {
    firstName: string;
    lastName: string;
  };
  total: number;
  orderStatus: string;
  createdAt: string;
}

export interface OverviewStats {
  totalProducts: number;
  totalCustomers: number;
  todayOrders: number;
  pendingOrders: number;
  lastUpdated: string;
}

class DashboardService {
  private baseUrl = '/admin/dashboard';

  private async makeRequest<T>(endpoint: string): Promise<T> {
    const response = await apiClient.get(`${this.baseUrl}${endpoint}`);
    return response.data.data as T;
  }

  /**
   * Get complete dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    return this.makeRequest<DashboardStats>('');
  }

  /**
   * Get overview statistics (quick stats)
   */
  async getOverviewStats(): Promise<OverviewStats> {
    return this.makeRequest<OverviewStats>('/overview');
  }

  /**
   * Get recent orders
   */
  async getRecentOrders(): Promise<RecentOrder[]> {
    return this.makeRequest<RecentOrder[]>('/recent-orders');
  }

  /**
   * Get product statistics
   */
  async getProductStats(): Promise<{
    total: number;
    inStock: number;
    outOfStock: number;
    lowStock: number;
    lastUpdated: string;
  }> {
    return this.makeRequest('/products');
  }

  /**
   * Get order statistics
   */
  async getOrderStats(): Promise<{
    today: number;
    pending: number;
    byStatus: Record<string, number>;
    lastUpdated: string;
  }> {
    return this.makeRequest('/orders');
  }

  /**
   * Get revenue statistics
   */
  async getRevenueStats(): Promise<{
    today: number;
    thisMonth: number;
    lastMonth: number;
    total: number;
  }> {
    return this.makeRequest('/revenue');
  }

  /**
   * Clear dashboard cache
   */
  async clearCache(key?: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/clear-cache`, { key });
  }

  /**
   * Get cache status
   */
  async getCacheStatus(): Promise<{
    size: number;
    timeout: number;
    entries: Array<{
      key: string;
      age: number;
      expired: boolean;
    }>;
  }> {
    return this.makeRequest('/cache-status');
  }
}

export const dashboardService = new DashboardService();