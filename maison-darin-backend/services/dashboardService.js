const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

/**
 * Dashboard Statistics Service
 * Provides real-time data for the admin dashboard
 */
class DashboardService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  /**
   * Get cached data or fetch fresh data
   * @param {string} key - Cache key
   * @param {Function} fetchFunction - Function to fetch fresh data
   * @returns {Promise<any>} Cached or fresh data
   */
  async getCachedData(key, fetchFunction) {
    const cached = this.cache.get(key);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const freshData = await fetchFunction();
      this.cache.set(key, {
        data: freshData,
        timestamp: Date.now()
      });
      return freshData;
    } catch (error) {
      console.error(`Error fetching data for ${key}:`, error);
      // Return cached data if available, even if expired
      if (cached) {
        return cached.data;
      }
      throw error;
    }
  }

  /**
   * Get total number of products
   * @returns {Promise<number>} Total products count
   */
  async getTotalProducts() {
    return await this.getCachedData('totalProducts', async () => {
      return await Product.countDocuments();
    });
  }

  /**
   * Get total number of customers (unique email addresses from orders)
   * @returns {Promise<number>} Total customers count
   */
  async getTotalCustomers() {
    return await this.getCachedData('totalCustomers', async () => {
      const uniqueCustomers = await Order.distinct('customerInfo.email');
      return uniqueCustomers.length;
    });
  }

  /**
   * Get today's orders count
   * @returns {Promise<number>} Today's orders count
   */
  async getTodayOrders() {
    return await this.getCachedData('todayOrders', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      return await Order.countDocuments({
        createdAt: {
          $gte: today,
          $lt: tomorrow
        }
      });
    });
  }

  /**
   * Get recent orders (last 5)
   * @returns {Promise<Array>} Recent orders
   */
  async getRecentOrders() {
    return await this.getCachedData('recentOrders', async () => {
      return await Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('orderNumber customerInfo.firstName customerInfo.lastName total orderStatus createdAt')
        .lean();
    });
  }

  /**
   * Get pending orders count
   * @returns {Promise<number>} Pending orders count
   */
  async getPendingOrdersCount() {
    return await this.getCachedData('pendingOrders', async () => {
      return await Order.countDocuments({
        orderStatus: 'pending'
      });
    });
  }

  /**
   * Get products by stock status
   * @returns {Promise<Object>} Stock statistics
   */
  async getProductStockStats() {
    return await this.getCachedData('productStockStats', async () => {
      const [inStock, outOfStock, lowStock] = await Promise.all([
        Product.countDocuments({ inStock: true }),
        Product.countDocuments({ inStock: false }),
        Product.countDocuments({ 
          inStock: true, 
          stock: { $lte: 5, $gt: 0 } 
        })
      ]);

      return {
        inStock,
        outOfStock,
        lowStock
      };
    });
  }

  /**
   * Get orders by status
   * @returns {Promise<Object>} Orders status breakdown
   */
  async getOrdersByStatus() {
    return await this.getCachedData('ordersByStatus', async () => {
      const pipeline = [
        {
          $group: {
            _id: '$orderStatus',
            count: { $sum: 1 }
          }
        }
      ];

      const results = await Order.aggregate(pipeline);
      
      // Convert to object format
      const statusCounts = {};
      results.forEach(result => {
        statusCounts[result._id] = result.count;
      });

      return statusCounts;
    });
  }

  /**
   * Get revenue statistics
   * @returns {Promise<Object>} Revenue statistics
   */
  async getRevenueStats() {
    return await this.getCachedData('revenueStats', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);

      const [todayRevenue, thisMonthRevenue, lastMonthRevenue, totalRevenue] = await Promise.all([
        // Today's revenue
        Order.aggregate([
          {
            $match: {
              createdAt: { $gte: today },
              paymentStatus: 'completed'
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$total' }
            }
          }
        ]),
        
        // This month's revenue
        Order.aggregate([
          {
            $match: {
              createdAt: { $gte: thisMonth, $lt: thisMonthEnd },
              paymentStatus: 'completed'
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$total' }
            }
          }
        ]),
        
        // Last month's revenue
        Order.aggregate([
          {
            $match: {
              createdAt: { $gte: lastMonth, $lt: thisMonth },
              paymentStatus: 'completed'
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$total' }
            }
          }
        ]),
        
        // Total revenue
        Order.aggregate([
          {
            $match: {
              paymentStatus: 'completed'
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$total' }
            }
          }
        ])
      ]);

      return {
        today: todayRevenue[0]?.total || 0,
        thisMonth: thisMonthRevenue[0]?.total || 0,
        lastMonth: lastMonthRevenue[0]?.total || 0,
        total: totalRevenue[0]?.total || 0
      };
    });
  }

  /**
   * Get comprehensive dashboard statistics
   * @returns {Promise<Object>} Complete dashboard data
   */
  async getDashboardStats() {
    try {
      const [
        totalProducts,
        totalCustomers,
        todayOrders,
        recentOrders,
        pendingOrders,
        stockStats,
        ordersByStatus,
        revenueStats
      ] = await Promise.all([
        this.getTotalProducts(),
        this.getTotalCustomers(),
        this.getTodayOrders(),
        this.getRecentOrders(),
        this.getPendingOrdersCount(),
        this.getProductStockStats(),
        this.getOrdersByStatus(),
        this.getRevenueStats()
      ]);

      return {
        overview: {
          totalProducts,
          totalCustomers,
          todayOrders,
          pendingOrders
        },
        products: {
          total: totalProducts,
          ...stockStats
        },
        orders: {
          today: todayOrders,
          pending: pendingOrders,
          recent: recentOrders,
          byStatus: ordersByStatus
        },
        customers: {
          total: totalCustomers
        },
        revenue: revenueStats,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw new Error('Failed to fetch dashboard statistics');
    }
  }

  /**
   * Clear cache for specific key or all cache
   * @param {string} key - Optional specific key to clear
   */
  clearCache(key = null) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache status
   * @returns {Object} Cache information
   */
  getCacheStatus() {
    const cacheEntries = Array.from(this.cache.entries()).map(([key, value]) => ({
      key,
      age: Date.now() - value.timestamp,
      expired: (Date.now() - value.timestamp) > this.cacheTimeout
    }));

    return {
      size: this.cache.size,
      timeout: this.cacheTimeout,
      entries: cacheEntries
    };
  }
}

module.exports = new DashboardService();