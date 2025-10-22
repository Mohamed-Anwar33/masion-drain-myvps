import { apiClient } from './apiClient';

export interface OrderItem {
  product: string;
  quantity: number;
  price: number;
  name: {
    en: string;
    ar: string;
  };
}

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  total: number;
  customerInfo: CustomerInfo;
  paymentMethod: 'paypal' | 'card' | 'bank_transfer';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  orderStatus?: string;
  paymentStatus?: string;
  customerEmail?: string;
  orderNumber?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  statusBreakdown: string[];
}

export interface OrdersResponse {
  orders: Order[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalOrders: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

class OrderService {
  private baseUrl = '/orders';

  /**
   * Get all orders with filters and pagination
   */
  async getOrders(filters: OrderFilters = {}): Promise<OrdersResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`${this.baseUrl}?${params.toString()}`);
    return {
      orders: response.data.data,
      pagination: response.data.pagination,
    };
  }

  /**
   * Get order by ID
   */
  async getOrderById(id: string): Promise<Order> {
    const response = await apiClient.get(`${this.baseUrl}/${id}`);
    return response.data.data;
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    id: string, 
    status: string, 
    statusType: 'order' | 'payment' = 'order'
  ): Promise<Order> {
    const response = await apiClient.put(`${this.baseUrl}/${id}/status`, {
      status,
      statusType
    });
    return response.data.data;
  }

  /**
   * Confirm an order
   */
  async confirmOrder(id: string): Promise<Order> {
    const response = await apiClient.put(`${this.baseUrl}/${id}/confirm`);
    return response.data.data;
  }

  /**
   * Cancel an order
   */
  async cancelOrder(id: string, reason?: string): Promise<Order> {
    const response = await apiClient.put(`${this.baseUrl}/${id}/cancel`, {
      reason
    });
    return response.data.data;
  }

  /**
   * Refund an order
   */
  async refundOrder(id: string, reason?: string): Promise<Order> {
    const response = await apiClient.put(`${this.baseUrl}/${id}/refund`, {
      reason
    });
    return response.data.data;
  }

  /**
   * Check refund eligibility
   */
  async checkRefundEligibility(id: string): Promise<{ canRefund: boolean }> {
    const response = await apiClient.get(`${this.baseUrl}/${id}/refund-eligibility`);
    return response.data.data;
  }

  /**
   * Get order statistics
   */
  async getOrderStats(filters: { startDate?: string; endDate?: string } = {}): Promise<OrderStats> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`${this.baseUrl}/stats?${params.toString()}`);
    return response.data.data;
  }

  /**
   * Search orders by multiple criteria
   */
  async searchOrders(searchTerm: string, filters: OrderFilters = {}): Promise<OrdersResponse> {
    const searchFilters = {
      ...filters,
      // Try to match order number, customer email, or customer name
      orderNumber: searchTerm,
      customerEmail: searchTerm
    };

    return this.getOrders(searchFilters);
  }

  /**
   * Get orders by status
   */
  async getOrdersByStatus(status: string, filters: OrderFilters = {}): Promise<OrdersResponse> {
    return this.getOrders({
      ...filters,
      orderStatus: status
    });
  }

  /**
   * Get recent orders
   */
  async getRecentOrders(limit: number = 10): Promise<Order[]> {
    const response = await this.getOrders({
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    return response.orders;
  }

  /**
   * Get orders for today
   */
  async getTodayOrders(): Promise<Order[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const response = await this.getOrders({
      startDate: today.toISOString(),
      endDate: tomorrow.toISOString(),
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    return response.orders;
  }

  /**
   * Format order status for display
   */
  formatOrderStatus(status: string, lang: 'en' | 'ar'): string {
    const statusMap = {
      en: {
        pending: 'Pending',
        confirmed: 'Confirmed',
        processing: 'Processing',
        shipped: 'Shipped',
        delivered: 'Delivered',
        cancelled: 'Cancelled'
      },
      ar: {
        pending: 'في الانتظار',
        confirmed: 'مؤكد',
        processing: 'قيد المعالجة',
        shipped: 'تم الشحن',
        delivered: 'تم التسليم',
        cancelled: 'ملغي'
      }
    };

    return statusMap[lang][status as keyof typeof statusMap.en] || status;
  }

  /**
   * Format payment status for display
   */
  formatPaymentStatus(status: string, lang: 'en' | 'ar'): string {
    const statusMap = {
      en: {
        pending: 'Pending',
        completed: 'Completed',
        failed: 'Failed',
        refunded: 'Refunded'
      },
      ar: {
        pending: 'في الانتظار',
        completed: 'مكتمل',
        failed: 'فشل',
        refunded: 'مسترد'
      }
    };

    return statusMap[lang][status as keyof typeof statusMap.en] || status;
  }

  /**
   * Get status color for UI
   */
  getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };

    return colorMap[status] || 'bg-gray-100 text-gray-800';
  }
}

export const orderService = new OrderService();