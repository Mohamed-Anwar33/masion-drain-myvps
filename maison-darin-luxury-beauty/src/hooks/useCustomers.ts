import { useState, useEffect, useCallback } from 'react';
import { customerService, Customer, CustomerFilters, CustomerStats, CustomersResponse } from '@/services/customerService';
import { useToast } from '@/hooks/use-toast';

export const useCustomers = (initialFilters: CustomerFilters = {}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCustomers: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [filters, setFilters] = useState<CustomerFilters>(initialFilters);
  const { toast } = useToast();

  const fetchCustomers = useCallback(async (newFilters?: CustomerFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      const filtersToUse = newFilters || filters;
      const response: CustomersResponse = await customerService.getCustomers(filtersToUse);
      
      setCustomers(response.customers);
      setPagination(response.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch customers';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  const updateFilters = useCallback((newFilters: Partial<CustomerFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    fetchCustomers(updatedFilters);
  }, [filters, fetchCustomers]);

  const resetFilters = useCallback(() => {
    const defaultFilters = { page: 1, limit: 10 };
    setFilters(defaultFilters);
    fetchCustomers(defaultFilters);
  }, [fetchCustomers]);

  const refreshCustomers = useCallback(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  return {
    customers,
    loading,
    error,
    pagination,
    filters,
    updateFilters,
    resetFilters,
    refreshCustomers,
    fetchCustomers
  };
};

export const useCustomer = (customerId: string | null) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCustomer = useCallback(async () => {
    if (!customerId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const customerData = await customerService.getCustomerById(customerId);
      setCustomer(customerData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch customer';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [customerId, toast]);

  const updateCustomer = useCallback(async (updateData: Partial<Customer>) => {
    if (!customerId) return;
    
    setLoading(true);
    
    try {
      const updatedCustomer = await customerService.updateCustomer(customerId, updateData);
      setCustomer(updatedCustomer);
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
      return updatedCustomer;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update customer';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [customerId, toast]);

  const updateCustomerStatus = useCallback(async (status: string) => {
    if (!customerId) return;
    
    setLoading(true);
    
    try {
      const updatedCustomer = await customerService.updateCustomerStatus(customerId, status);
      setCustomer(updatedCustomer);
      toast({
        title: "Success",
        description: "Customer status updated successfully",
      });
      return updatedCustomer;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update customer status';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [customerId, toast]);

  const deleteCustomer = useCallback(async () => {
    if (!customerId) return;
    
    setLoading(true);
    
    try {
      const result = await customerService.deleteCustomer(customerId);
      const message = result.deleted ? 
        "Customer deleted successfully" : 
        "Customer deactivated (has existing orders)";
      
      toast({
        title: "Success",
        description: message,
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete customer';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [customerId, toast]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  return {
    customer,
    loading,
    error,
    fetchCustomer,
    updateCustomer,
    updateCustomerStatus,
    deleteCustomer
  };
};

export const useCustomerStats = (filters: { startDate?: string; endDate?: string } = {}) => {
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const statsData = await customerService.getCustomerStats(filters);
      setStats(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch customer statistics';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    fetchStats
  };
};

export const useCustomerSearch = () => {
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const searchCustomers = useCallback(async (searchTerm: string, limit: number = 10) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const customers = await customerService.searchCustomers(searchTerm.trim(), limit);
      setResults(customers);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search customers';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    searchCustomers,
    clearResults
  };
};