const contactMessageService = require('../services/contactMessageService');
const logger = require('../utils/logger');

class ContactMessageController {
  /**
   * Submit a contact message
   * POST /api/contact
   */
  async submitContactMessage(req, res) {
    try {
      // Extract source details from request
      const sourceDetails = {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip || req.connection.remoteAddress,
        referrer: req.get('Referer'),
        page: req.body.page || req.get('Referer')
      };

      const contactMessage = await contactMessageService.createContactMessage(
        req.body, 
        sourceDetails
      );
      
      res.status(201).json({
        success: true,
        data: {
          messageNumber: contactMessage.messageNumber,
          status: contactMessage.status,
          createdAt: contactMessage.createdAt
        },
        message: 'Your message has been submitted successfully. We will get back to you soon.'
      });
    } catch (error) {
      logger.error('Error in submitContactMessage controller', {
        error: error.message,
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
          message: 'An error occurred while submitting your message'
        }
      });
    }
  }

  /**
   * Get contact messages (Admin only)
   * GET /api/contact/messages
   */
  async getContactMessages(req, res) {
    try {
      const {
        status,
        category,
        priority,
        assignedTo,
        customerEmail,
        search,
        includeSpam,
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
        filters.status = Array.isArray(status) ? status : [status];
      }
      
      if (category) {
        filters.category = Array.isArray(category) ? category : [category];
      }
      
      if (priority) {
        filters.priority = Array.isArray(priority) ? priority : [priority];
      }
      
      if (assignedTo) {
        filters.assignedTo = assignedTo;
      }
      
      if (customerEmail) {
        filters.customerEmail = customerEmail;
      }
      
      if (search) {
        filters.search = search;
      }
      
      if (includeSpam) {
        filters.includeSpam = includeSpam === 'true';
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

      const result = await contactMessageService.getContactMessages(filters, pagination);
      
      res.json({
        success: true,
        data: result.messages,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Error in getContactMessages controller', {
        error: error.message,
        query: req.query
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while retrieving contact messages'
        }
      });
    }
  }

  /**
   * Get contact message by ID (Admin only)
   * GET /api/contact/messages/:id
   */
  async getContactMessageById(req, res) {
    try {
      const { id } = req.params;
      const contactMessage = await contactMessageService.getContactMessageById(id);
      
      res.json({
        success: true,
        data: contactMessage
      });
    } catch (error) {
      logger.error('Error in getContactMessageById controller', {
        error: error.message,
        messageId: req.params.id
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
          message: 'An error occurred while retrieving the contact message'
        }
      });
    }
  }

  /**
   * Update contact message status (Admin only)
   * PUT /api/contact/messages/:id/status
   */
  async updateContactMessageStatus(req, res) {
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

      const contactMessage = await contactMessageService.updateContactMessageStatus(
        id, status, userId, reason
      );
      
      res.json({
        success: true,
        data: contactMessage,
        message: 'Contact message status updated successfully'
      });
    } catch (error) {
      logger.error('Error in updateContactMessageStatus controller', {
        error: error.message,
        messageId: req.params.id,
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
          message: 'An error occurred while updating the contact message status'
        }
      });
    }
  }

  /**
   * Assign contact message to user (Admin only)
   * PUT /api/contact/messages/:id/assign
   */
  async assignContactMessage(req, res) {
    try {
      const { id } = req.params;
      const { assigneeId } = req.body;
      const assignedBy = req.user.id;

      if (!assigneeId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Assignee ID is required'
          }
        });
      }

      const contactMessage = await contactMessageService.assignContactMessage(
        id, assigneeId, assignedBy
      );
      
      res.json({
        success: true,
        data: contactMessage,
        message: 'Contact message assigned successfully'
      });
    } catch (error) {
      logger.error('Error in assignContactMessage controller', {
        error: error.message,
        messageId: req.params.id,
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
          message: 'An error occurred while assigning the contact message'
        }
      });
    }
  }

  /**
   * Add admin note to contact message (Admin only)
   * POST /api/contact/messages/:id/notes
   */
  async addAdminNote(req, res) {
    try {
      const { id } = req.params;
      const { note, isInternal = true } = req.body;
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

      const contactMessage = await contactMessageService.addAdminNote(
        id, note, userId, isInternal
      );
      
      res.json({
        success: true,
        data: contactMessage,
        message: 'Admin note added successfully'
      });
    } catch (error) {
      logger.error('Error in addAdminNote controller', {
        error: error.message,
        messageId: req.params.id,
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
   * Add response to contact message (Admin only)
   * POST /api/contact/messages/:id/responses
   */
  async addResponse(req, res) {
    try {
      const { id } = req.params;
      const { message, method = 'email' } = req.body;
      const userId = req.user.id;

      if (!message) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Response message is required'
          }
        });
      }

      const contactMessage = await contactMessageService.addResponse(
        id, message, userId, method
      );
      
      res.json({
        success: true,
        data: contactMessage,
        message: 'Response added successfully'
      });
    } catch (error) {
      logger.error('Error in addResponse controller', {
        error: error.message,
        messageId: req.params.id,
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
          message: 'An error occurred while adding the response'
        }
      });
    }
  }

  /**
   * Mark contact message as spam (Admin only)
   * PUT /api/contact/messages/:id/spam
   */
  async markAsSpam(req, res) {
    try {
      const { id } = req.params;
      const { reasons = [] } = req.body;
      const userId = req.user.id;

      const contactMessage = await contactMessageService.markAsSpam(id, userId, reasons);
      
      res.json({
        success: true,
        data: contactMessage,
        message: 'Contact message marked as spam successfully'
      });
    } catch (error) {
      logger.error('Error in markAsSpam controller', {
        error: error.message,
        messageId: req.params.id,
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
          message: 'An error occurred while marking the message as spam'
        }
      });
    }
  }

  /**
   * Get contact message statistics (Admin only)
   * GET /api/contact/statistics
   */
  async getContactMessageStatistics(req, res) {
    try {
      const { startDate, endDate, assignedTo } = req.query;
      
      const filters = {};
      if (startDate || endDate) {
        filters.dateRange = {};
        if (startDate) filters.dateRange.start = startDate;
        if (endDate) filters.dateRange.end = endDate;
      }
      
      if (assignedTo) {
        filters.assignedTo = assignedTo;
      }

      const statistics = await contactMessageService.getContactMessageStatistics(filters);
      
      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      logger.error('Error in getContactMessageStatistics controller', {
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

  /**
   * Get messages requiring follow-up (Admin only)
   * GET /api/contact/follow-up
   */
  async getFollowUpMessages(req, res) {
    try {
      const messages = await contactMessageService.getFollowUpMessages();
      
      res.json({
        success: true,
        data: messages
      });
    } catch (error) {
      logger.error('Error in getFollowUpMessages controller', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while retrieving follow-up messages'
        }
      });
    }
  }
}

module.exports = new ContactMessageController();