import { apiClient } from './apiClient';

export interface CustomerAddress {
  _id?: string;
  type: 'home' | 'work' | 'other';
  address: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface CustomerPreferences {
  newsletter: boolean;
  smsNotifications: boolean;
  emailNotifications: boolean;
  language: 'ar' | 'en';
  favoriteCategories: string[];
}

export interface Customer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addresses: CustomerAddress[];
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  preferences: CustomerPreferences;
  loyaltyPoints: number;
  totalSpent: number;
  totalOrders: number;
  lastOrderDate?: string;
  status: 'active' | 'inactive' | 'blocked';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  fullName: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  defaultAddress?: CustomerAddress;
  recentOrders?: any[];
  lifetimeValue?: {
    totalSpent: number;
    averageOrderValue: number;
    totalOrders: number;
    loyaltyPoints: number;
  };
}

export interface CustomerFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  tier?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  averageOrdersPerCustomer: number;
  tierDistribution: {
    bronze: { count: number; totalSpent: number };
    silver: { count: number; totalSpent: number };
    gold: { count: number; totalSpent: number };
    platinum: { count: number; totalSpent: number };
  };
  recentCustomers: Customer[];
}

export interface CustomersResponse {
  customers: Customer[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCustomers: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface TierDistribution {
  distribution: {
    bronze: { count: number; totalSpent: number };
    silver: { count: number; totalSpent: number };
    gold: { count: number; totalSpent: number };
    platinum: { count: number; totalSpent: number };
  };
  requirements: {
    bronze: { min: number; max: number; name: string };
    silver: { min: number; max: number; name: string };
    gold: { min: number; max: number; name: string };
    platinum: { min: number; max: number; name: string };
  };
}

class CustomerService {
  private baseUrl = '/customers';

  /**
   * Get all customers with filters and pagination
   */
  async getCustomers(filters: CustomerFilters = {}): Promise<CustomersResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`${this.baseUrl}?${params.toString()}`);
    return {
      customers: response.data.data,
      pagination: response.data.pagination,
    };
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(id: string): Promise<Customer> {
    const response = await apiClient.get(`${this.baseUrl}/${id}`);
    return response.data.data;
  }

  /**
   * Create a new customer
   */
  async createCustomer(customerData: Partial<Customer>): Promise<Customer> {
    const response = await apiClient.post(this.baseUrl, customerData);
    return response.data.data;
  }

  /**
   * Update customer
   */
  async updateCustomer(id: string, customerData: Partial<Customer>): Promise<Customer> {
    const response = await apiClient.put(`${this.baseUrl}/${id}`, customerData);
    return response.data.data;
  }

  /**
   * Delete customer
   */
  async deleteCustomer(id: string): Promise<{ deleted: boolean; deactivated: boolean }> {
    const response = await apiClient.delete(`${this.baseUrl}/${id}`);
    return response.data.data;
  }

  /**
   * Update customer status
   */
  async updateCustomerStatus(id: string, status: string): Promise<Customer> {
    const response = await apiClient.patch(`${this.baseUrl}/${id}/status`, { status });
    return response.data.data;
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats(filters: { startDate?: string; endDate?: string } = {}): Promise<CustomerStats> {
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
   * Search customers
   */
  async searchCustomers(searchTerm: string, limit: number = 10): Promise<Customer[]> {
    const params = new URLSearchParams({
      q: searchTerm,
      limit: limit.toString()
    });

    const response = await apiClient.get(`${this.baseUrl}/search?${params.toString()}`);
    return response.data.data;
  }

  /**
   * Get tier distribution
   */
  async getTierDistribution(): Promise<TierDistribution> {
    const response = await apiClient.get(`${this.baseUrl}/tiers`);
    return response.data.data;
  }

  /**
   * Add customer address
   */
  async addCustomerAddress(customerId: string, addressData: Omit<CustomerAddress, '_id'>): Promise<Customer> {
    const response = await apiClient.post(`${this.baseUrl}/${customerId}/addresses`, addressData);
    return response.data.data;
  }

  /**
   * Update customer address
   */
  async updateCustomerAddress(customerId: string, addressId: string, addressData: Partial<CustomerAddress>): Promise<Customer> {
    const response = await apiClient.put(`${this.baseUrl}/${customerId}/addresses/${addressId}`, addressData);
    return response.data.data;
  }

  /**
   * Remove customer address
   */
  async removeCustomerAddress(customerId: string, addressId: string): Promise<Customer> {
    const response = await apiClient.delete(`${this.baseUrl}/${customerId}/addresses/${addressId}`);
    return response.data.data;
  }

  /**
   * Get customers by status
   */
  async getCustomersByStatus(status: string, filters: CustomerFilters = {}): Promise<CustomersResponse> {
    return this.getCustomers({
      ...filters,
      status
    });
  }

  /**
   * Get customers by tier
   */
  async getCustomersByTier(tier: string, filters: CustomerFilters = {}): Promise<CustomersResponse> {
    return this.getCustomers({
      ...filters,
      tier
    });
  }

  /**
   * Get recent customers
   */
  async getRecentCustomers(limit: number = 10): Promise<Customer[]> {
    const response = await this.getCustomers({
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    return response.customers;
  }

  /**
   * Format customer tier for display
   */
  formatTier(tier: string, lang: 'en' | 'ar'): string {
    const tierMap = {
      en: {
        bronze: 'Bronze',
        silver: 'Silver',
        gold: 'Gold',
        platinum: 'Platinum'
      },
      ar: {
        bronze: 'برونزي',
        silver: 'فضي',
        gold: 'ذهبي',
        platinum: 'بلاتيني'
      }
    };

    return tierMap[lang][tier as keyof typeof tierMap.en] || tier;
  }

  /**
   * Format customer status for display
   */
  formatStatus(status: string, lang: 'en' | 'ar'): string {
    const statusMap = {
      en: {
        active: 'Active',
        inactive: 'Inactive',
        blocked: 'Blocked'
      },
      ar: {
        active: 'نشط',
        inactive: 'غير نشط',
        blocked: 'محظور'
      }
    };

    return statusMap[lang][status as keyof typeof statusMap.en] || status;
  }

  /**
   * Get tier color for UI
   */
  getTierColor(tier: string): string {
    const colorMap: Record<string, string> = {
      bronze: 'bg-amber-100 text-amber-800',
      silver: 'bg-gray-100 text-gray-800',
      gold: 'bg-yellow-100 text-yellow-800',
      platinum: 'bg-purple-100 text-purple-800'
    };

    return colorMap[tier] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Get status color for UI
   */
  getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      blocked: 'bg-red-100 text-red-800'
    };

    return colorMap[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Calculate next tier requirements
   */
  getNextTierRequirements(currentTier: string, currentSpent: number): { nextTier: string; amountNeeded: number } | null {
    const tiers = [
      { name: 'bronze', min: 0, max: 999 },
      { name: 'silver', min: 1000, max: 4999 },
      { name: 'gold', min: 5000, max: 9999 },
      { name: 'platinum', min: 10000, max: Infinity }
    ];

    const currentTierIndex = tiers.findIndex(tier => tier.name === currentTier);
    if (currentTierIndex === -1 || currentTierIndex === tiers.length - 1) {
      return null; // Already at highest tier or invalid tier
    }

    const nextTier = tiers[currentTierIndex + 1];
    return {
      nextTier: nextTier.name,
      amountNeeded: nextTier.min - currentSpent
    };
  }
}

export const customerService = new CustomerService();