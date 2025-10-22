const customerService = require('../services/customerService');

class CustomerController {
  /**
   * Get all customers with filtering and pagination
   * GET /api/customers
   */
  async getCustomers(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        status: req.query.status,
        search: req.query.search,
        tier: req.query.tier,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc'
      };

      const result = await customerService.getCustomers(options);

      res.status(200).json({
        success: true,
        data: result.customers,
        pagination: result.pagination,
        message: 'Customers retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'CUSTOMERS_FETCH_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Get customer by ID
   * GET /api/customers/:id
   */
  async getCustomerById(req, res) {
    try {
      const { id } = req.params;
      const customer = await customerService.getCustomerById(id);

      res.status(200).json({
        success: true,
        data: customer,
        message: 'Customer retrieved successfully'
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode === 404 ? 'CUSTOMER_NOT_FOUND' : 'CUSTOMER_FETCH_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Create a new customer
   * POST /api/customers
   */
  async createCustomer(req, res) {
    try {
      const customerData = req.body;
      const customer = await customerService.createCustomer(customerData);

      res.status(201).json({
        success: true,
        data: customer,
        message: 'Customer created successfully'
      });
    } catch (error) {
      const statusCode = error.message.includes('already exists') ? 409 : 400;
      res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode === 409 ? 'CUSTOMER_EXISTS' : 'CUSTOMER_CREATE_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Update customer
   * PUT /api/customers/:id
   */
  async updateCustomer(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const customer = await customerService.updateCustomer(id, updateData);

      res.status(200).json({
        success: true,
        data: customer,
        message: 'Customer updated successfully'
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 
                        error.message.includes('already exists') ? 409 : 400;
      res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode === 404 ? 'CUSTOMER_NOT_FOUND' : 
                statusCode === 409 ? 'CUSTOMER_EXISTS' : 'CUSTOMER_UPDATE_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Delete customer
   * DELETE /api/customers/:id
   */
  async deleteCustomer(req, res) {
    try {
      const { id } = req.params;
      const result = await customerService.deleteCustomer(id);

      const message = result.deleted ? 
        'Customer deleted successfully' : 
        'Customer deactivated (has existing orders)';

      res.status(200).json({
        success: true,
        data: result,
        message
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode === 404 ? 'CUSTOMER_NOT_FOUND' : 'CUSTOMER_DELETE_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Get customer statistics
   * GET /api/customers/stats
   */
  async getCustomerStats(req, res) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const stats = await customerService.getCustomerStats(filters);

      res.status(200).json({
        success: true,
        data: stats,
        message: 'Customer statistics retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'STATS_FETCH_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Search customers
   * GET /api/customers/search
   */
  async searchCustomers(req, res) {
    try {
      const { q: searchTerm, limit } = req.query;

      if (!searchTerm || searchTerm.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_SEARCH_TERM',
            message: 'Search term must be at least 2 characters long'
          }
        });
      }

      const customers = await customerService.searchCustomers(searchTerm.trim(), {
        limit: parseInt(limit) || 10
      });

      res.status(200).json({
        success: true,
        data: customers,
        message: 'Customer search completed successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'SEARCH_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Get tier distribution
   * GET /api/customers/tiers
   */
  async getTierDistribution(req, res) {
    try {
      const distribution = await customerService.getTierDistribution();

      res.status(200).json({
        success: true,
        data: {
          distribution,
          requirements: customerService.getTierRequirements()
        },
        message: 'Tier distribution retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'TIER_DISTRIBUTION_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Update customer status
   * PATCH /api/customers/:id/status
   */
  async updateCustomerStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['active', 'inactive', 'blocked'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Status must be one of: active, inactive, blocked'
          }
        });
      }

      const customer = await customerService.updateCustomer(id, { status });

      res.status(200).json({
        success: true,
        data: customer,
        message: 'Customer status updated successfully'
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode === 404 ? 'CUSTOMER_NOT_FOUND' : 'STATUS_UPDATE_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Add customer address
   * POST /api/customers/:id/addresses
   */
  async addCustomerAddress(req, res) {
    try {
      const { id } = req.params;
      const addressData = req.body;

      const Customer = require('../models/Customer');
      const customer = await Customer.findById(id);

      if (!customer) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CUSTOMER_NOT_FOUND',
            message: 'Customer not found'
          }
        });
      }

      await customer.addAddress(addressData);

      res.status(201).json({
        success: true,
        data: customer,
        message: 'Address added successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'ADDRESS_ADD_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Update customer address
   * PUT /api/customers/:id/addresses/:addressId
   */
  async updateCustomerAddress(req, res) {
    try {
      const { id, addressId } = req.params;
      const addressData = req.body;

      const Customer = require('../models/Customer');
      const customer = await Customer.findById(id);

      if (!customer) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CUSTOMER_NOT_FOUND',
            message: 'Customer not found'
          }
        });
      }

      await customer.updateAddress(addressId, addressData);

      res.status(200).json({
        success: true,
        data: customer,
        message: 'Address updated successfully'
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode === 404 ? 'ADDRESS_NOT_FOUND' : 'ADDRESS_UPDATE_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Remove customer address
   * DELETE /api/customers/:id/addresses/:addressId
   */
  async removeCustomerAddress(req, res) {
    try {
      const { id, addressId } = req.params;

      const Customer = require('../models/Customer');
      const customer = await Customer.findById(id);

      if (!customer) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CUSTOMER_NOT_FOUND',
            message: 'Customer not found'
          }
        });
      }

      await customer.removeAddress(addressId);

      res.status(200).json({
        success: true,
        data: customer,
        message: 'Address removed successfully'
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode === 404 ? 'ADDRESS_NOT_FOUND' : 'ADDRESS_REMOVE_ERROR',
          message: error.message
        }
      });
    }
  }
}

module.exports = new CustomerController();