const dashboardService = require('../services/dashboardService');
const { validationResult } = require('express-validator');

/**
 * Dashboard Controller
 * Handles admin dashboard API endpoints
 */
class DashboardController {
  /**
   * Get complete dashboard statistics
   * @route GET /api/admin/dashboard
   * @access Private (Admin only)
   */
  async getDashboardStats(req, res) {
    try {
      const stats = await dashboardService.getDashboardStats();
      
      res.status(200).json({
        success: true,
        data: stats,
        message: 'Dashboard statistics retrieved successfully'
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve dashboard statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get overview statistics (quick stats)
   * @route GET /api/admin/dashboard/overview
   * @access Private (Admin only)
   */
  async getOverviewStats(req, res) {
    try {
      const [totalProducts, totalCustomers, todayOrders, pendingOrders] = await Promise.all([
        dashboardService.getTotalProducts(),
        dashboardService.getTotalCustomers(),
        dashboardService.getTodayOrders(),
        dashboardService.getPendingOrdersCount()
      ]);

      const overview = {
        totalProducts,
        totalCustomers,
        todayOrders,
        pendingOrders,
        lastUpdated: new Date().toISOString()
      };

      res.status(200).json({
        success: true,
        data: overview,
        message: 'Overview statistics retrieved successfully'
      });
    } catch (error) {
      console.error('Overview stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve overview statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get recent orders
   * @route GET /api/admin/dashboard/recent-orders
   * @access Private (Admin only)
   */
  async getRecentOrders(req, res) {
    try {
      const recentOrders = await dashboardService.getRecentOrders();
      
      res.status(200).json({
        success: true,
        data: recentOrders,
        message: 'Recent orders retrieved successfully'
      });
    } catch (error) {
      console.error('Recent orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve recent orders',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get product statistics
   * @route GET /api/admin/dashboard/products
   * @access Private (Admin only)
   */
  async getProductStats(req, res) {
    try {
      const [totalProducts, stockStats] = await Promise.all([
        dashboardService.getTotalProducts(),
        dashboardService.getProductStockStats()
      ]);

      const productStats = {
        total: totalProducts,
        ...stockStats,
        lastUpdated: new Date().toISOString()
      };

      res.status(200).json({
        success: true,
        data: productStats,
        message: 'Product statistics retrieved successfully'
      });
    } catch (error) {
      console.error('Product stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve product statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get order statistics
   * @route GET /api/admin/dashboard/orders
   * @access Private (Admin only)
   */
  async getOrderStats(req, res) {
    try {
      const [todayOrders, pendingOrders, ordersByStatus] = await Promise.all([
        dashboardService.getTodayOrders(),
        dashboardService.getPendingOrdersCount(),
        dashboardService.getOrdersByStatus()
      ]);

      const orderStats = {
        today: todayOrders,
        pending: pendingOrders,
        byStatus: ordersByStatus,
        lastUpdated: new Date().toISOString()
      };

      res.status(200).json({
        success: true,
        data: orderStats,
        message: 'Order statistics retrieved successfully'
      });
    } catch (error) {
      console.error('Order stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve order statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get revenue statistics
   * @route GET /api/admin/dashboard/revenue
   * @access Private (Admin only)
   */
  async getRevenueStats(req, res) {
    try {
      const revenueStats = await dashboardService.getRevenueStats();
      
      res.status(200).json({
        success: true,
        data: revenueStats,
        message: 'Revenue statistics retrieved successfully'
      });
    } catch (error) {
      console.error('Revenue stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve revenue statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Clear dashboard cache
   * @route POST /api/admin/dashboard/clear-cache
   * @access Private (Admin only)
   */
  async clearCache(req, res) {
    try {
      const { key } = req.body;
      
      dashboardService.clearCache(key);
      
      res.status(200).json({
        success: true,
        message: key ? `Cache cleared for key: ${key}` : 'All cache cleared successfully'
      });
    } catch (error) {
      console.error('Clear cache error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear cache',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get cache status
   * @route GET /api/admin/dashboard/cache-status
   * @access Private (Admin only)
   */
  async getCacheStatus(req, res) {
    try {
      const cacheStatus = dashboardService.getCacheStatus();
      
      res.status(200).json({
        success: true,
        data: cacheStatus,
        message: 'Cache status retrieved successfully'
      });
    } catch (error) {
      console.error('Cache status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve cache status',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = new DashboardController();