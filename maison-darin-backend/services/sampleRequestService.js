const SampleRequest = require('../models/SampleRequest');
const Product = require('../models/Product');
const logger = require('../utils/logger');

class SampleRequestService {
  /**
   * Create a new sample request
   * @param {Object} requestData - Sample request data
   * @returns {Promise<Object>} Created sample request
   */
  async createSampleRequest(requestData) {
    try {
      // Validate products exist and are available
      await this.validateRequestedProducts(requestData.requestedProducts);

      // Create sample request
      const sampleRequest = new SampleRequest(requestData);

      // Check for duplicates
      const duplicate = await sampleRequest.checkForDuplicates();
      if (duplicate) {
        const error = new Error('A similar sample request was already submitted recently');
        error.statusCode = 409;
        error.code = 'DUPLICATE_REQUEST';
        error.details = {
          existingRequestId: duplicate._id,
          existingRequestNumber: duplicate.requestNumber,
          submittedAt: duplicate.createdAt
        };
        throw error;
      }

      // Save the request
      const savedRequest = await sampleRequest.save();
      
      // Populate product details
      await savedRequest.populate('requestedProducts.product', 'name price category images');

      logger.info('Sample request created', {
        requestId: savedRequest._id,
        requestNumber: savedRequest.requestNumber,
        customerEmail: savedRequest.customerInfo.email,
        productsCount: savedRequest.requestedProducts.length
      });

      return savedRequest;
    } catch (error) {
      logger.error('Error creating sample request', {
        error: error.message,
        requestData: requestData
      });
      throw error;
    }
  }

  /**
   * Get sample requests with filtering and pagination
   * @param {Object} filters - Filter criteria
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Sample requests with metadata
   */
  async getSampleRequests(filters = {}, pagination = {}) {
    try {
      const {
        status,
        priority,
        customerEmail,
        dateRange,
        search
      } = filters;

      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = pagination;

      // Build query
      const query = { isDeleted: false };

      if (status) {
        query.status = status;
      }

      if (priority) {
        query.priority = priority;
      }

      if (customerEmail) {
        query['customerInfo.email'] = new RegExp(customerEmail, 'i');
      }

      if (dateRange) {
        query.createdAt = {};
        if (dateRange.start) {
          query.createdAt.$gte = new Date(dateRange.start);
        }
        if (dateRange.end) {
          query.createdAt.$lte = new Date(dateRange.end);
        }
      }

      if (search) {
        query.$or = [
          { 'customerInfo.firstName': new RegExp(search, 'i') },
          { 'customerInfo.lastName': new RegExp(search, 'i') },
          { 'customerInfo.email': new RegExp(search, 'i') },
          { requestNumber: new RegExp(search, 'i') },
          { message: new RegExp(search, 'i') }
        ];
      }

      // Calculate pagination
      const skip = (page - 1) * limit;
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query
      const [requests, totalCount] = await Promise.all([
        SampleRequest.find(query)
          .populate('requestedProducts.product', 'name price category images')
          .populate('adminNotes.addedBy', 'email')
          .populate('statusHistory.changedBy', 'email')
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .lean(),
        SampleRequest.countDocuments(query)
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        requests,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      logger.error('Error getting sample requests', {
        error: error.message,
        filters,
        pagination
      });
      throw error;
    }
  }

  /**
   * Get sample request by ID
   * @param {string} requestId - Sample request ID
   * @returns {Promise<Object>} Sample request
   */
  async getSampleRequestById(requestId) {
    try {
      const sampleRequest = await SampleRequest.findOne({
        _id: requestId,
        isDeleted: false
      })
        .populate('requestedProducts.product', 'name price category images')
        .populate('adminNotes.addedBy', 'email')
        .populate('statusHistory.changedBy', 'email');

      if (!sampleRequest) {
        const error = new Error('Sample request not found');
        error.statusCode = 404;
        error.code = 'REQUEST_NOT_FOUND';
        throw error;
      }

      return sampleRequest;
    } catch (error) {
      if (error.statusCode) throw error;
      
      logger.error('Error getting sample request by ID', {
        error: error.message,
        requestId
      });
      throw error;
    }
  }

  /**
   * Update sample request status
   * @param {string} requestId - Sample request ID
   * @param {string} newStatus - New status
   * @param {string} userId - User making the change
   * @param {string} reason - Reason for status change
   * @returns {Promise<Object>} Updated sample request
   */
  async updateSampleRequestStatus(requestId, newStatus, userId, reason) {
    try {
      const sampleRequest = await this.getSampleRequestById(requestId);

      // Validate status transition
      this.validateStatusTransition(sampleRequest.status, newStatus);

      // Update status
      await sampleRequest.updateStatus(newStatus, userId, reason);

      logger.info('Sample request status updated', {
        requestId,
        requestNumber: sampleRequest.requestNumber,
        oldStatus: sampleRequest.status,
        newStatus,
        userId,
        reason
      });

      return sampleRequest;
    } catch (error) {
      logger.error('Error updating sample request status', {
        error: error.message,
        requestId,
        newStatus,
        userId
      });
      throw error;
    }
  }

  /**
   * Add admin note to sample request
   * @param {string} requestId - Sample request ID
   * @param {string} note - Admin note
   * @param {string} userId - User adding the note
   * @returns {Promise<Object>} Updated sample request
   */
  async addAdminNote(requestId, note, userId) {
    try {
      const sampleRequest = await this.getSampleRequestById(requestId);
      await sampleRequest.addAdminNote(note, userId);

      logger.info('Admin note added to sample request', {
        requestId,
        requestNumber: sampleRequest.requestNumber,
        userId
      });

      return sampleRequest;
    } catch (error) {
      logger.error('Error adding admin note', {
        error: error.message,
        requestId,
        userId
      });
      throw error;
    }
  }

  /**
   * Update shipping information
   * @param {string} requestId - Sample request ID
   * @param {Object} shippingInfo - Shipping information
   * @returns {Promise<Object>} Updated sample request
   */
  async updateShippingInfo(requestId, shippingInfo) {
    try {
      const sampleRequest = await this.getSampleRequestById(requestId);

      // Update shipping information
      Object.assign(sampleRequest.shippingInfo, shippingInfo);
      await sampleRequest.save();

      logger.info('Shipping information updated', {
        requestId,
        requestNumber: sampleRequest.requestNumber,
        trackingNumber: shippingInfo.trackingNumber
      });

      return sampleRequest;
    } catch (error) {
      logger.error('Error updating shipping information', {
        error: error.message,
        requestId,
        shippingInfo
      });
      throw error;
    }
  }

  /**
   * Get sample request statistics
   * @param {Object} filters - Optional filters for statistics
   * @returns {Promise<Object>} Statistics
   */
  async getSampleRequestStatistics(filters = {}) {
    try {
      const { dateRange } = filters;
      
      // Build base query
      const baseQuery = { isDeleted: false };
      
      if (dateRange) {
        baseQuery.createdAt = {};
        if (dateRange.start) {
          baseQuery.createdAt.$gte = new Date(dateRange.start);
        }
        if (dateRange.end) {
          baseQuery.createdAt.$lte = new Date(dateRange.end);
        }
      }

      // Get basic statistics
      const basicStats = await SampleRequest.getStatistics();

      // Get additional statistics with filters
      const [
        statusStats,
        priorityStats,
        monthlyStats,
        topProducts
      ] = await Promise.all([
        this.getStatusStatistics(baseQuery),
        this.getPriorityStatistics(baseQuery),
        this.getMonthlyStatistics(baseQuery),
        this.getTopRequestedProducts(baseQuery)
      ]);

      return {
        ...basicStats,
        filtered: {
          byStatus: statusStats,
          byPriority: priorityStats,
          monthly: monthlyStats,
          topProducts
        }
      };
    } catch (error) {
      logger.error('Error getting sample request statistics', {
        error: error.message,
        filters
      });
      throw error;
    }
  }

  /**
   * Validate requested products
   * @param {Array} requestedProducts - Products to validate
   * @private
   */
  async validateRequestedProducts(requestedProducts) {
    if (!requestedProducts || requestedProducts.length === 0) {
      const error = new Error('At least one product must be requested');
      error.statusCode = 400;
      error.code = 'NO_PRODUCTS_REQUESTED';
      throw error;
    }

    // Check if all products exist and are available
    const productIds = requestedProducts.map(p => p.product);
    const products = await Product.find({
      _id: { $in: productIds },
      inStock: true
    });

    if (products.length !== productIds.length) {
      const foundIds = products.map(p => p._id.toString());
      const missingIds = productIds.filter(id => !foundIds.includes(id.toString()));
      
      const error = new Error('Some requested products are not available');
      error.statusCode = 400;
      error.code = 'PRODUCTS_NOT_AVAILABLE';
      error.details = { missingProductIds: missingIds };
      throw error;
    }

    // Validate sample quantities
    const maxSamplesPerProduct = 5;
    const totalSamplesLimit = 10;
    
    let totalSamples = 0;
    for (const requestedProduct of requestedProducts) {
      if (requestedProduct.quantity > maxSamplesPerProduct) {
        const error = new Error(`Maximum ${maxSamplesPerProduct} samples per product allowed`);
        error.statusCode = 400;
        error.code = 'QUANTITY_LIMIT_EXCEEDED';
        throw error;
      }
      totalSamples += requestedProduct.quantity;
    }

    if (totalSamples > totalSamplesLimit) {
      const error = new Error(`Maximum ${totalSamplesLimit} total samples allowed per request`);
      error.statusCode = 400;
      error.code = 'TOTAL_SAMPLES_LIMIT_EXCEEDED';
      throw error;
    }
  }

  /**
   * Validate status transition
   * @param {string} currentStatus - Current status
   * @param {string} newStatus - New status
   * @private
   */
  validateStatusTransition(currentStatus, newStatus) {
    const validTransitions = {
      pending: ['approved', 'rejected'],
      approved: ['processing', 'rejected'],
      processing: ['shipped', 'rejected'],
      shipped: ['delivered'],
      rejected: ['pending'], // Allow reprocessing
      delivered: [] // Final state
    };

    if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(newStatus)) {
      const error = new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
      error.statusCode = 400;
      error.code = 'INVALID_STATUS_TRANSITION';
      throw error;
    }
  }

  /**
   * Get status statistics
   * @param {Object} baseQuery - Base query for filtering
   * @returns {Promise<Array>} Status statistics
   * @private
   */
  async getStatusStatistics(baseQuery) {
    return await SampleRequest.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgProcessingTime: {
            $avg: {
              $subtract: ['$updatedAt', '$createdAt']
            }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);
  }

  /**
   * Get priority statistics
   * @param {Object} baseQuery - Base query for filtering
   * @returns {Promise<Array>} Priority statistics
   * @private
   */
  async getPriorityStatistics(baseQuery) {
    return await SampleRequest.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
  }

  /**
   * Get monthly statistics
   * @param {Object} baseQuery - Base query for filtering
   * @returns {Promise<Array>} Monthly statistics
   * @private
   */
  async getMonthlyStatistics(baseQuery) {
    return await SampleRequest.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          totalSamples: { $sum: '$totalSamples' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);
  }

  /**
   * Get top requested products
   * @param {Object} baseQuery - Base query for filtering
   * @returns {Promise<Array>} Top requested products
   * @private
   */
  async getTopRequestedProducts(baseQuery) {
    return await SampleRequest.aggregate([
      { $match: baseQuery },
      { $unwind: '$requestedProducts' },
      {
        $group: {
          _id: '$requestedProducts.product',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$requestedProducts.quantity' },
          productName: { $first: '$requestedProducts.productName' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
  }
}

module.exports = new SampleRequestService();