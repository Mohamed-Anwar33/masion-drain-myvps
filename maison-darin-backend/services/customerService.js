const Customer = require('../models/Customer');
const Order = require('../models/Order');

class CustomerService {
  /**
   * Get all customers with filters and pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Customers with pagination info
   */
  async getCustomers(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        search,
        tier,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      // Build filters
      const filters = {};
      if (status) filters.status = status;
      if (search) filters.search = search;
      if (tier) filters.tier = tier;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      // Calculate pagination
      const skip = (page - 1) * limit;
      
      // Get customers with filters
      const customers = await Customer.findWithFilters(filters)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // Add computed fields
      const enrichedCustomers = customers.map(customer => ({
        ...customer,
        fullName: `${customer.firstName} ${customer.lastName}`,
        tier: this.calculateTier(customer.totalSpent),
        defaultAddress: customer.addresses?.find(addr => addr.isDefault) || customer.addresses?.[0]
      }));

      // Get total count for pagination
      const totalCustomers = await Customer.countDocuments(
        Customer.findWithFilters(filters).getQuery()
      );

      return {
        customers: enrichedCustomers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCustomers / limit),
          totalCustomers,
          hasNextPage: page < Math.ceil(totalCustomers / limit),
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Failed to get customers: ${error.message}`);
    }
  }

  /**
   * Get customer by ID with order history
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Customer with order history
   */
  async getCustomerById(customerId) {
    try {
      const customer = await Customer.findById(customerId).lean();
      
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Get customer's order history
      const orders = await Order.find({ 'customerInfo.email': customer.email })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      // Enrich customer data
      const enrichedCustomer = {
        ...customer,
        fullName: `${customer.firstName} ${customer.lastName}`,
        tier: this.calculateTier(customer.totalSpent),
        defaultAddress: customer.addresses?.find(addr => addr.isDefault) || customer.addresses?.[0],
        recentOrders: orders,
        lifetimeValue: {
          totalSpent: customer.totalSpent,
          averageOrderValue: customer.totalOrders > 0 ? customer.totalSpent / customer.totalOrders : 0,
          totalOrders: customer.totalOrders,
          loyaltyPoints: customer.loyaltyPoints
        }
      };

      return enrichedCustomer;
    } catch (error) {
      throw new Error(`Failed to get customer: ${error.message}`);
    }
  }

  /**
   * Create a new customer
   * @param {Object} customerData - Customer data
   * @returns {Promise<Object>} Created customer
   */
  async createCustomer(customerData) {
    try {
      const customer = new Customer(customerData);
      const savedCustomer = await customer.save();
      
      return {
        ...savedCustomer.toObject(),
        fullName: savedCustomer.fullName,
        tier: this.calculateTier(savedCustomer.totalSpent),
        defaultAddress: savedCustomer.defaultAddress
      };
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Customer with this email already exists');
      }
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  }

  /**
   * Update customer
   * @param {string} customerId - Customer ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated customer
   */
  async updateCustomer(customerId, updateData) {
    try {
      const customer = await Customer.findByIdAndUpdate(
        customerId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).lean();

      if (!customer) {
        throw new Error('Customer not found');
      }

      return {
        ...customer,
        fullName: `${customer.firstName} ${customer.lastName}`,
        tier: this.calculateTier(customer.totalSpent),
        defaultAddress: customer.addresses?.find(addr => addr.isDefault) || customer.addresses?.[0]
      };
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Customer with this email already exists');
      }
      throw new Error(`Failed to update customer: ${error.message}`);
    }
  }

  /**
   * Delete customer
   * @param {string} customerId - Customer ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteCustomer(customerId) {
    try {
      const customer = await Customer.findById(customerId);
      
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Check if customer has orders
      const orderCount = await Order.countDocuments({ 'customerInfo.email': customer.email });
      
      if (orderCount > 0) {
        // Instead of deleting, mark as inactive
        await Customer.findByIdAndUpdate(customerId, { 
          status: 'inactive',
          updatedAt: new Date()
        });
        return { deleted: false, deactivated: true };
      } else {
        // Safe to delete if no orders
        await Customer.findByIdAndDelete(customerId);
        return { deleted: true, deactivated: false };
      }
    } catch (error) {
      throw new Error(`Failed to delete customer: ${error.message}`);
    }
  }

  /**
   * Get customer statistics
   * @param {Object} filters - Date and other filters
   * @returns {Promise<Object>} Customer statistics
   */
  async getCustomerStats(filters = {}) {
    try {
      const stats = await Customer.getCustomerStats(filters);
      
      // Get tier distribution
      const tierDistribution = await this.getTierDistribution();
      
      // Get recent customers
      const recentCustomers = await Customer.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      return {
        ...stats,
        tierDistribution,
        recentCustomers: recentCustomers.map(customer => ({
          ...customer,
          fullName: `${customer.firstName} ${customer.lastName}`,
          tier: this.calculateTier(customer.totalSpent)
        }))
      };
    } catch (error) {
      throw new Error(`Failed to get customer statistics: ${error.message}`);
    }
  }

  /**
   * Get tier distribution
   * @returns {Promise<Object>} Tier distribution
   */
  async getTierDistribution() {
    try {
      const pipeline = [
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $gte: ['$totalSpent', 10000] }, then: 'platinum' },
                  { case: { $gte: ['$totalSpent', 5000] }, then: 'gold' },
                  { case: { $gte: ['$totalSpent', 1000] }, then: 'silver' }
                ],
                default: 'bronze'
              }
            },
            count: { $sum: 1 },
            totalSpent: { $sum: '$totalSpent' }
          }
        },
        {
          $project: {
            tier: '$_id',
            count: 1,
            totalSpent: { $round: ['$totalSpent', 2] },
            _id: 0
          }
        }
      ];

      const result = await Customer.aggregate(pipeline);
      
      // Ensure all tiers are represented
      const tiers = ['bronze', 'silver', 'gold', 'platinum'];
      const distribution = {};
      
      tiers.forEach(tier => {
        const tierData = result.find(r => r.tier === tier);
        distribution[tier] = {
          count: tierData?.count || 0,
          totalSpent: tierData?.totalSpent || 0
        };
      });

      return distribution;
    } catch (error) {
      throw new Error(`Failed to get tier distribution: ${error.message}`);
    }
  }

  /**
   * Update customer from order
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} Updated customer
   */
  async updateCustomerFromOrder(orderData) {
    try {
      const { customerInfo, total } = orderData;
      
      // Find or create customer
      let customer = await Customer.findOne({ email: customerInfo.email });
      
      if (!customer) {
        // Create new customer from order data
        customer = new Customer({
          firstName: customerInfo.firstName,
          lastName: customerInfo.lastName,
          email: customerInfo.email,
          phone: customerInfo.phone,
          addresses: [{
            type: 'home',
            address: customerInfo.address,
            city: customerInfo.city,
            postalCode: customerInfo.postalCode,
            country: customerInfo.country,
            isDefault: true
          }]
        });
      }

      // Update customer statistics
      await customer.updateStats({ total });
      
      return customer;
    } catch (error) {
      throw new Error(`Failed to update customer from order: ${error.message}`);
    }
  }

  /**
   * Search customers
   * @param {string} searchTerm - Search term
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Matching customers
   */
  async searchCustomers(searchTerm, options = {}) {
    try {
      const { limit = 10 } = options;
      
      const searchRegex = new RegExp(searchTerm, 'i');
      const customers = await Customer.find({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex },
          { phone: searchRegex }
        ]
      })
      .limit(limit)
      .lean();

      return customers.map(customer => ({
        ...customer,
        fullName: `${customer.firstName} ${customer.lastName}`,
        tier: this.calculateTier(customer.totalSpent)
      }));
    } catch (error) {
      throw new Error(`Failed to search customers: ${error.message}`);
    }
  }

  /**
   * Calculate customer tier based on total spent
   * @param {number} totalSpent - Total amount spent
   * @returns {string} Customer tier
   */
  calculateTier(totalSpent) {
    if (totalSpent >= 10000) return 'platinum';
    if (totalSpent >= 5000) return 'gold';
    if (totalSpent >= 1000) return 'silver';
    return 'bronze';
  }

  /**
   * Get tier color for UI
   * @param {string} tier - Customer tier
   * @returns {string} Color class
   */
  getTierColor(tier) {
    const colors = {
      bronze: 'bg-amber-100 text-amber-800',
      silver: 'bg-gray-100 text-gray-800',
      gold: 'bg-yellow-100 text-yellow-800',
      platinum: 'bg-purple-100 text-purple-800'
    };
    return colors[tier] || colors.bronze;
  }

  /**
   * Get tier requirements
   * @returns {Object} Tier requirements
   */
  getTierRequirements() {
    return {
      bronze: { min: 0, max: 999, name: 'Bronze' },
      silver: { min: 1000, max: 4999, name: 'Silver' },
      gold: { min: 5000, max: 9999, name: 'Gold' },
      platinum: { min: 10000, max: Infinity, name: 'Platinum' }
    };
  }
}

module.exports = new CustomerService();