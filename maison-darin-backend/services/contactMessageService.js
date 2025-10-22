const ContactMessage = require('../models/ContactMessage');
const emailService = require('./emailService');
const logger = require('../utils/logger');

class ContactMessageService {
  /**
   * Create a new contact message
   * @param {Object} messageData - Contact message data
   * @param {Object} sourceDetails - Source information (IP, user agent, etc.)
   * @returns {Promise<Object>} Created contact message
   */
  async createContactMessage(messageData, sourceDetails = {}) {
    try {
      // Check rate limiting
      await this.checkRateLimit(messageData.customerInfo.email);

      // Create contact message with source details
      const contactMessage = new ContactMessage({
        ...messageData,
        sourceDetails: {
          userAgent: sourceDetails.userAgent,
          ipAddress: sourceDetails.ipAddress,
          referrer: sourceDetails.referrer,
          page: sourceDetails.page
        }
      });

      // Find and link related messages
      await contactMessage.findRelatedMessages();

      // Save the message
      const savedMessage = await contactMessage.save();

      // Send email notifications (don't wait for them to complete)
      this.sendEmailNotifications(savedMessage).catch(error => {
        logger.error('Failed to send email notifications', {
          error: error.message,
          messageId: savedMessage._id
        });
      });

      logger.info('Contact message created', {
        messageId: savedMessage._id,
        messageNumber: savedMessage.messageNumber,
        customerEmail: savedMessage.customerInfo.email,
        category: savedMessage.category,
        isSpam: savedMessage.isSpam,
        spamScore: savedMessage.spamScore
      });

      return savedMessage;
    } catch (error) {
      logger.error('Error creating contact message', {
        error: error.message,
        messageData: messageData
      });
      throw error;
    }
  }

  /**
   * Get contact messages with filtering and pagination
   * @param {Object} filters - Filter criteria
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Contact messages with metadata
   */
  async getContactMessages(filters = {}, pagination = {}) {
    try {
      const {
        status,
        category,
        priority,
        assignedTo,
        customerEmail,
        dateRange,
        search,
        includeSpam = false
      } = filters;

      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = pagination;

      // Build query
      const query = { isDeleted: false };

      if (!includeSpam) {
        query.isSpam = false;
      }

      if (status) {
        if (Array.isArray(status)) {
          query.status = { $in: status };
        } else {
          query.status = status;
        }
      }

      if (category) {
        if (Array.isArray(category)) {
          query.category = { $in: category };
        } else {
          query.category = category;
        }
      }

      if (priority) {
        if (Array.isArray(priority)) {
          query.priority = { $in: priority };
        } else {
          query.priority = priority;
        }
      }

      if (assignedTo) {
        query.assignedTo = assignedTo;
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
          { 'customerInfo.company': new RegExp(search, 'i') },
          { messageNumber: new RegExp(search, 'i') },
          { subject: new RegExp(search, 'i') },
          { message: new RegExp(search, 'i') }
        ];
      }

      // Calculate pagination
      const skip = (page - 1) * limit;
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query
      const [messages, totalCount] = await Promise.all([
        ContactMessage.find(query)
          .populate('assignedTo', 'email')
          .populate('adminNotes.addedBy', 'email')
          .populate('responses.sentBy', 'email')
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .lean(),
        ContactMessage.countDocuments(query)
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        messages,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      logger.error('Error getting contact messages', {
        error: error.message,
        filters,
        pagination
      });
      throw error;
    }
  }

  /**
   * Get contact message by ID
   * @param {string} messageId - Contact message ID
   * @returns {Promise<Object>} Contact message
   */
  async getContactMessageById(messageId) {
    try {
      const contactMessage = await ContactMessage.findOne({
        _id: messageId,
        isDeleted: false
      })
        .populate('assignedTo', 'email')
        .populate('adminNotes.addedBy', 'email')
        .populate('responses.sentBy', 'email')
        .populate('relatedMessages', 'messageNumber subject createdAt status');

      if (!contactMessage) {
        const error = new Error('Contact message not found');
        error.statusCode = 404;
        error.code = 'MESSAGE_NOT_FOUND';
        throw error;
      }

      return contactMessage;
    } catch (error) {
      if (error.statusCode) throw error;
      
      logger.error('Error getting contact message by ID', {
        error: error.message,
        messageId
      });
      throw error;
    }
  }

  /**
   * Update contact message status
   * @param {string} messageId - Contact message ID
   * @param {string} newStatus - New status
   * @param {string} userId - User making the change
   * @param {string} reason - Reason for status change
   * @returns {Promise<Object>} Updated contact message
   */
  async updateContactMessageStatus(messageId, newStatus, userId, reason) {
    try {
      const contactMessage = await this.getContactMessageById(messageId);

      // Validate status transition
      this.validateStatusTransition(contactMessage.status, newStatus);

      // Update status
      await contactMessage.updateStatus(newStatus, userId, reason);

      logger.info('Contact message status updated', {
        messageId,
        messageNumber: contactMessage.messageNumber,
        oldStatus: contactMessage.status,
        newStatus,
        userId,
        reason
      });

      return contactMessage;
    } catch (error) {
      logger.error('Error updating contact message status', {
        error: error.message,
        messageId,
        newStatus,
        userId
      });
      throw error;
    }
  }

  /**
   * Assign contact message to user
   * @param {string} messageId - Contact message ID
   * @param {string} assigneeId - User to assign to
   * @param {string} assignedBy - User making the assignment
   * @returns {Promise<Object>} Updated contact message
   */
  async assignContactMessage(messageId, assigneeId, assignedBy) {
    try {
      const contactMessage = await this.getContactMessageById(messageId);
      await contactMessage.assignTo(assigneeId, assignedBy);

      logger.info('Contact message assigned', {
        messageId,
        messageNumber: contactMessage.messageNumber,
        assigneeId,
        assignedBy
      });

      return contactMessage;
    } catch (error) {
      logger.error('Error assigning contact message', {
        error: error.message,
        messageId,
        assigneeId,
        assignedBy
      });
      throw error;
    }
  }

  /**
   * Add admin note to contact message
   * @param {string} messageId - Contact message ID
   * @param {string} note - Admin note
   * @param {string} userId - User adding the note
   * @param {boolean} isInternal - Whether note is internal
   * @returns {Promise<Object>} Updated contact message
   */
  async addAdminNote(messageId, note, userId, isInternal = true) {
    try {
      const contactMessage = await this.getContactMessageById(messageId);
      await contactMessage.addAdminNote(note, userId, isInternal);

      logger.info('Admin note added to contact message', {
        messageId,
        messageNumber: contactMessage.messageNumber,
        userId,
        isInternal
      });

      return contactMessage;
    } catch (error) {
      logger.error('Error adding admin note', {
        error: error.message,
        messageId,
        userId
      });
      throw error;
    }
  }

  /**
   * Add response to contact message
   * @param {string} messageId - Contact message ID
   * @param {string} responseMessage - Response message
   * @param {string} userId - User sending the response
   * @param {string} method - Response method (email, phone, internal)
   * @returns {Promise<Object>} Updated contact message
   */
  async addResponse(messageId, responseMessage, userId, method = 'email') {
    try {
      const contactMessage = await this.getContactMessageById(messageId);
      await contactMessage.addResponse(responseMessage, userId, method);

      logger.info('Response added to contact message', {
        messageId,
        messageNumber: contactMessage.messageNumber,
        userId,
        method
      });

      return contactMessage;
    } catch (error) {
      logger.error('Error adding response', {
        error: error.message,
        messageId,
        userId
      });
      throw error;
    }
  }

  /**
   * Mark contact message as spam
   * @param {string} messageId - Contact message ID
   * @param {string} userId - User marking as spam
   * @param {Array} reasons - Spam reasons
   * @returns {Promise<Object>} Updated contact message
   */
  async markAsSpam(messageId, userId, reasons = []) {
    try {
      const contactMessage = await this.getContactMessageById(messageId);
      await contactMessage.markAsSpam(userId, reasons);

      logger.info('Contact message marked as spam', {
        messageId,
        messageNumber: contactMessage.messageNumber,
        userId,
        reasons
      });

      return contactMessage;
    } catch (error) {
      logger.error('Error marking message as spam', {
        error: error.message,
        messageId,
        userId
      });
      throw error;
    }
  }

  /**
   * Get contact message statistics
   * @param {Object} filters - Optional filters for statistics
   * @returns {Promise<Object>} Statistics
   */
  async getContactMessageStatistics(filters = {}) {
    try {
      const { dateRange, assignedTo } = filters;
      
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

      if (assignedTo) {
        baseQuery.assignedTo = assignedTo;
      }

      // Get basic statistics
      const basicStats = await ContactMessage.getStatistics();

      // Get additional statistics with filters
      const [
        categoryStats,
        priorityStats,
        responseTimeStats,
        monthlyStats,
        assignmentStats
      ] = await Promise.all([
        this.getCategoryStatistics(baseQuery),
        this.getPriorityStatistics(baseQuery),
        this.getResponseTimeStatistics(baseQuery),
        this.getMonthlyStatistics(baseQuery),
        this.getAssignmentStatistics(baseQuery)
      ]);

      return {
        ...basicStats,
        filtered: {
          byCategory: categoryStats,
          byPriority: priorityStats,
          responseTime: responseTimeStats,
          monthly: monthlyStats,
          assignments: assignmentStats
        }
      };
    } catch (error) {
      logger.error('Error getting contact message statistics', {
        error: error.message,
        filters
      });
      throw error;
    }
  }

  /**
   * Get messages requiring follow-up
   * @returns {Promise<Array>} Messages requiring follow-up
   */
  async getFollowUpMessages() {
    try {
      const messages = await ContactMessage.getFollowUpMessages();
      
      logger.info('Retrieved follow-up messages', {
        count: messages.length
      });

      return messages;
    } catch (error) {
      logger.error('Error getting follow-up messages', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Check rate limiting for contact form submissions
   * @param {string} email - Customer email
   * @private
   */
  async checkRateLimit(email) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentMessageCount = await ContactMessage.countDocuments({
      'customerInfo.email': email.toLowerCase(),
      createdAt: { $gte: oneHourAgo },
      isDeleted: false
    });

    const hourlyLimit = 50; // Increased for development
    if (recentMessageCount >= hourlyLimit) {
      const error = new Error(`Rate limit exceeded. Maximum ${hourlyLimit} messages per hour allowed.`);
      error.statusCode = 429;
      error.code = 'RATE_LIMIT_EXCEEDED';
      throw error;
    }

    // Check daily limit
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dailyMessageCount = await ContactMessage.countDocuments({
      'customerInfo.email': email.toLowerCase(),
      createdAt: { $gte: oneDayAgo },
      isDeleted: false
    });

    const dailyLimit = 100; // Increased for development
    if (dailyMessageCount >= dailyLimit) {
      const error = new Error(`Daily limit exceeded. Maximum ${dailyLimit} messages per day allowed.`);
      error.statusCode = 429;
      error.code = 'DAILY_LIMIT_EXCEEDED';
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
      new: ['read', 'in_progress', 'resolved', 'closed'],
      read: ['in_progress', 'resolved', 'closed'],
      in_progress: ['resolved', 'closed', 'read'],
      resolved: ['closed', 'in_progress'], // Allow reopening
      closed: [] // Final state (except for spam reversal)
    };

    if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(newStatus)) {
      const error = new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
      error.statusCode = 400;
      error.code = 'INVALID_STATUS_TRANSITION';
      throw error;
    }
  }

  /**
   * Get category statistics
   * @param {Object} baseQuery - Base query for filtering
   * @returns {Promise<Array>} Category statistics
   * @private
   */
  async getCategoryStatistics(baseQuery) {
    return await ContactMessage.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgResponseTime: {
            $avg: {
              $cond: {
                if: { $gt: [{ $size: '$responses' }, 0] },
                then: {
                  $subtract: [
                    { $arrayElemAt: ['$responses.sentAt', 0] },
                    '$createdAt'
                  ]
                },
                else: null
              }
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
    return await ContactMessage.aggregate([
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
   * Get response time statistics
   * @param {Object} baseQuery - Base query for filtering
   * @returns {Promise<Object>} Response time statistics
   * @private
   */
  async getResponseTimeStatistics(baseQuery) {
    const stats = await ContactMessage.aggregate([
      { $match: { ...baseQuery, 'responses.0': { $exists: true } } },
      {
        $project: {
          responseTime: {
            $subtract: [
              { $arrayElemAt: ['$responses.sentAt', 0] },
              '$createdAt'
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTime' },
          minResponseTime: { $min: '$responseTime' },
          maxResponseTime: { $max: '$responseTime' },
          count: { $sum: 1 }
        }
      }
    ]);

    return stats[0] || {
      avgResponseTime: null,
      minResponseTime: null,
      maxResponseTime: null,
      count: 0
    };
  }

  /**
   * Get monthly statistics
   * @param {Object} baseQuery - Base query for filtering
   * @returns {Promise<Array>} Monthly statistics
   * @private
   */
  async getMonthlyStatistics(baseQuery) {
    return await ContactMessage.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          resolved: {
            $sum: {
              $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0]
            }
          },
          avgResponseTime: {
            $avg: {
              $cond: {
                if: { $gt: [{ $size: '$responses' }, 0] },
                then: {
                  $subtract: [
                    { $arrayElemAt: ['$responses.sentAt', 0] },
                    '$createdAt'
                  ]
                },
                else: null
              }
            }
          }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);
  }

  /**
   * Get assignment statistics
   * @param {Object} baseQuery - Base query for filtering
   * @returns {Promise<Array>} Assignment statistics
   * @private
   */
  async getAssignmentStatistics(baseQuery) {
    return await ContactMessage.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$assignedTo',
          count: { $sum: 1 },
          resolved: {
            $sum: {
              $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0]
            }
          },
          avgResponseTime: {
            $avg: {
              $cond: {
                if: { $gt: [{ $size: '$responses' }, 0] },
                then: {
                  $subtract: [
                    { $arrayElemAt: ['$responses.sentAt', 0] },
                    '$createdAt'
                  ]
                },
                else: null
              }
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $project: {
          count: 1,
          resolved: 1,
          avgResponseTime: 1,
          userEmail: { $arrayElemAt: ['$user.email', 0] }
        }
      },
      { $sort: { count: -1 } }
    ]);
  }

  /**
   * Send email notifications for new contact message
   * @param {Object} contactMessage - The saved contact message
   */
  async sendEmailNotifications(contactMessage) {
    try {
      // Don't send emails for spam messages
      if (contactMessage.isSpam) {
        logger.info('Skipping email notifications for spam message', {
          messageId: contactMessage._id
        });
        return;
      }

      // Get site settings for email configuration
      const SiteSettings = require('../models/SiteSettings');
      const siteSettings = await SiteSettings.getSiteSettings();
      
      // Update email service configuration
      await emailService.updateConfig(siteSettings.emailSettings);

      // Send notification to admin (if enabled)
      if (siteSettings.emailSettings.enableNotifications) {
        await emailService.sendContactNotificationToAdmin(contactMessage);
      }
      
      // Send confirmation to customer (if enabled)
      if (siteSettings.emailSettings.enableCustomerConfirmation) {
        await emailService.sendCustomerConfirmation(contactMessage);
      }

      logger.info('Email notifications sent successfully', {
        messageId: contactMessage._id,
        messageNumber: contactMessage.messageNumber,
        adminNotification: siteSettings.emailSettings.enableNotifications,
        customerConfirmation: siteSettings.emailSettings.enableCustomerConfirmation
      });
    } catch (error) {
      logger.error('Error sending email notifications', {
        error: error.message,
        messageId: contactMessage._id
      });
      // Don't throw error - email failure shouldn't break the contact form
    }
  }
}

module.exports = new ContactMessageService();