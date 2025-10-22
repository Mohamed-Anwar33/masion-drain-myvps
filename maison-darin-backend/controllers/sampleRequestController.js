const sampleRequestService = require('../services/sampleRequestService');
const logger = require('../utils/logger');

class SampleRequestController {
  /**
   * Create a new sample request
   * POST /api/samples/request
   */
  async createSampleRequest(req, res) {
    try {
      const sampleRequest = await sampleRequestService.createSampleRequest(req.body);
      
      res.status(201).json({
        success: true,
        data: sampleRequest,
        message: 'Sample request submitted successfully'
      });
    } catch (error) {
      logger.error('Error in createSampleRequest controller', {
        error: error.message,
        body: req.body
      });

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while processing your sample request'
        }
      });
    }
  }

  /**
   * Get sample requests (Admin only)
   * GET /api/samples
   */
  async getSampleRequests(req, res) {
    try {
      const {
        status,
        priority,
        customerEmail,
        search,
        startDate,
        endDate,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Build filters
      const filters = {};
      
      if (status) {
        filters.status = status;
      }
      
      if (priority) {
        filters.priority = priority;
      }
      
      if (customerEmail) {
        filters.customerEmail = customerEmail;
      }
      
      if (search) {
        filters.search = search;
      }
      
      if (startDate || endDate) {
        filters.dateRange = {};
        if (startDate) filters.dateRange.start = startDate;
        if (endDate) filters.dateRange.end = endDate;
      }

      // Build pagination
      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder
      };

      const result = await sampleRequestService.getSampleRequests(filters, pagination);
      
      res.json({
        success: true,
        data: result.requests,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Error in getSampleRequests controller', {
        error: error.message,
        query: req.query
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while retrieving sample requests'
        }
      });
    }
  }

  /**
   * Get sample request by ID (Admin only)
   * GET /api/samples/:id
   */
  async getSampleRequestById(req, res) {
    try {
      const { id } = req.params;
      const sampleRequest = await sampleRequestService.getSampleRequestById(id);
      
      res.json({
        success: true,
        data: sampleRequest
      });
    } catch (error) {
      logger.error('Error in getSampleRequestById controller', {
        error: error.message,
        requestId: req.params.id
      });

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while retrieving the sample request'
        }
      });
    }
  }

  /**
   * Update sample request status (Admin only)
   * PUT /api/samples/:id/status
   */
  async updateSampleRequestStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const userId = req.user.id;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Status is required'
          }
        });
      }

      const sampleRequest = await sampleRequestService.updateSampleRequestStatus(
        id, status, userId, reason
      );
      
      res.json({
        success: true,
        data: sampleRequest,
        message: 'Sample request status updated successfully'
      });
    } catch (error) {
      logger.error('Error in updateSampleRequestStatus controller', {
        error: error.message,
        requestId: req.params.id,
        body: req.body
      });

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while updating the sample request status'
        }
      });
    }
  }

  /**
   * Add admin note to sample request (Admin only)
   * POST /api/samples/:id/notes
   */
  async addAdminNote(req, res) {
    try {
      const { id } = req.params;
      const { note } = req.body;
      const userId = req.user.id;

      if (!note) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Note is required'
          }
        });
      }

      const sampleRequest = await sampleRequestService.addAdminNote(id, note, userId);
      
      res.json({
        success: true,
        data: sampleRequest,
        message: 'Admin note added successfully'
      });
    } catch (error) {
      logger.error('Error in addAdminNote controller', {
        error: error.message,
        requestId: req.params.id,
        body: req.body
      });

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while adding the admin note'
        }
      });
    }
  }

  /**
   * Update shipping information (Admin only)
   * PUT /api/samples/:id/shipping
   */
  async updateShippingInfo(req, res) {
    try {
      const { id } = req.params;
      const shippingInfo = req.body;

      const sampleRequest = await sampleRequestService.updateShippingInfo(id, shippingInfo);
      
      res.json({
        success: true,
        data: sampleRequest,
        message: 'Shipping information updated successfully'
      });
    } catch (error) {
      logger.error('Error in updateShippingInfo controller', {
        error: error.message,
        requestId: req.params.id,
        body: req.body
      });

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while updating shipping information'
        }
      });
    }
  }

  /**
   * Get sample request statistics (Admin only)
   * GET /api/samples/statistics
   */
  async getSampleRequestStatistics(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      const filters = {};
      if (startDate || endDate) {
        filters.dateRange = {};
        if (startDate) filters.dateRange.start = startDate;
        if (endDate) filters.dateRange.end = endDate;
      }

      const statistics = await sampleRequestService.getSampleRequestStatistics(filters);
      
      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      logger.error('Error in getSampleRequestStatistics controller', {
        error: error.message,
        query: req.query
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while retrieving statistics'
        }
      });
    }
  }
}

module.exports = new SampleRequestController();