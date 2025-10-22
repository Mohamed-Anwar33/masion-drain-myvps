import { useState, useEffect, useCallback } from 'react';
import { orderService, Order, OrderFilters, OrderStats, OrdersResponse } from '@/services/orderService';
import { useToast } from '@/hooks/use-toast';

export const useOrders = (initialFilters: OrderFilters = {}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [filters, setFilters] = useState<OrderFilters>(initialFilters);
  const { toast } = useToast();

  const fetchOrders = useCallback(async (newFilters?: OrderFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      const filtersToUse = newFilters || filters;
      const response: OrdersResponse = await orderService.getOrders(filtersToUse);
      
      setOrders(response.orders);
      setPagination(response.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch orders';
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

  const updateFilters = useCallback((newFilters: Partial<OrderFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    fetchOrders(updatedFilters);
  }, [filters, fetchOrders]);

  const resetFilters = useCallback(() => {
    const defaultFilters = { page: 1, limit: 10 };
    setFilters(defaultFilters);
    fetchOrders(defaultFilters);
  }, [fetchOrders]);

  const refreshOrders = useCallback(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchOrders();
  }, []);

  return {
    orders,
    loading,
    error,
    pagination,
    filters,
    updateFilters,
    resetFilters,
    refreshOrders,
    fetchOrders
  };
};

export const useOrder = (orderId: string | null) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const orderData = await orderService.getOrderById(orderId);
      setOrder(orderData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch order';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [orderId, toast]);

  const updateOrderStatus = useCallback(async (
    status: string, 
    statusType: 'order' | 'payment' = 'order'
  ) => {
    if (!orderId) return;
    
    setLoading(true);
    
    try {
      const updatedOrder = await orderService.updateOrderStatus(orderId, status, statusType);
      setOrder(updatedOrder);
      toast({
        title: "Success",
        description: `Order ${statusType} status updated successfully`,
      });
      return updatedOrder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update order status';
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
  }, [orderId, toast]);

  const confirmOrder = useCallback(async () => {
    if (!orderId) return;
    
    setLoading(true);
    
    try {
      const updatedOrder = await orderService.confirmOrder(orderId);
      setOrder(updatedOrder);
      toast({
        title: "Success",
        description: "Order confirmed successfully",
      });
      return updatedOrder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to confirm order';
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
  }, [orderId, toast]);

  const cancelOrder = useCallback(async (reason?: string) => {
    if (!orderId) return;
    
    setLoading(true);
    
    try {
      const updatedOrder = await orderService.cancelOrder(orderId, reason);
      setOrder(updatedOrder);
      toast({
        title: "Success",
        description: "Order cancelled successfully",
      });
      return updatedOrder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel order';
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
  }, [orderId, toast]);

  const refundOrder = useCallback(async (reason?: string) => {
    if (!orderId) return;
    
    setLoading(true);
    
    try {
      const updatedOrder = await orderService.refundOrder(orderId, reason);
      setOrder(updatedOrder);
      toast({
        title: "Success",
        description: "Order refunded successfully",
      });
      return updatedOrder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refund order';
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
  }, [orderId, toast]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return {
    order,
    loading,
    error,
    fetchOrder,
    updateOrderStatus,
    confirmOrder,
    cancelOrder,
    refundOrder
  };
};

export const useOrderStats = (filters: { startDate?: string; endDate?: string } = {}) => {
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const statsData = await orderService.getOrderStats(filters);
      setStats(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch order statistics';
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