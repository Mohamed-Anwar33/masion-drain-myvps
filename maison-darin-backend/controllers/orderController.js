const orderService = require('../services/orderService');

class OrderController {
  /**
   * Create a new order
   * POST /api/orders
   */
  async createOrder(req, res) {
    try {
      const orderData = req.body;
      const order = await orderService.createOrder(orderData);

      res.status(201).json({
        success: true,
        data: order,
        message: 'Order created successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'ORDER_CREATE_ERROR',
        }
      });
    }
  }

  /**
   * Get all orders with filtering and pagination
   * GET /api/orders
   */
  async getOrders(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        status: req.query.status,
        paymentStatus: req.query.paymentStatus,
        customerEmail: req.query.customerEmail,
        orderNumber: req.query.orderNumber,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc'
      };

      const result = await orderService.getOrders(options);

      res.status(200).json({
        success: true,
        data: result.orders,
        pagination: result.pagination,
        message: 'Orders retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'ORDERS_FETCH_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Get order by ID
   * GET /api/orders/:id
   */
  async getOrderById(req, res) {
    try {
      const { id } = req.params;
      const order = await orderService.getOrderById(id);

      res.status(200).json({
        success: true,
        data: order,
        message: 'Order retrieved successfully'
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode === 404 ? 'ORDER_NOT_FOUND' : 'ORDER_FETCH_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Update order status
   * PUT /api/orders/:id/status
   */
  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, statusType = 'order' } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Status is required'
          }
        });
      }

      const order = await orderService.updateOrderStatus(id, status, statusType);

      res.status(200).json({
        success: true,
        data: order,
        message: `Order ${statusType} status updated successfully`
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode === 404 ? 'ORDER_NOT_FOUND' : 'ORDER_UPDATE_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Cancel an order
   * PUT /api/orders/:id/cancel
   */
  async cancelOrder(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const order = await orderService.cancelOrder(id, reason);

      res.status(200).json({
        success: true,
        data: order,
        message: 'Order cancelled successfully'
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode === 404 ? 'ORDER_NOT_FOUND' : 'ORDER_CANCEL_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Confirm an order
   * PUT /api/orders/:id/confirm
   */
  async confirmOrder(req, res) {
    try {
      const { id } = req.params;
      const order = await orderService.confirmOrder(id);

      res.status(200).json({
        success: true,
        data: order,
        message: 'Order confirmed successfully'
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode === 404 ? 'ORDER_NOT_FOUND' : 'ORDER_CONFIRM_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Refund an order
   * PUT /api/orders/:id/refund
   */
  async refundOrder(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const order = await orderService.refundOrder(id, reason);

      res.status(200).json({
        success: true,
        data: order,
        message: 'Order refunded successfully'
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode === 404 ? 'ORDER_NOT_FOUND' : 'ORDER_REFUND_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Get order statistics
   * GET /api/orders/stats
   */
  async getOrderStats(req, res) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const stats = await orderService.getOrderStats(filters);

      res.status(200).json({
        success: true,
        data: stats,
        message: 'Order statistics retrieved successfully'
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
   * Check if order can be refunded
   * GET /api/orders/:id/refund-eligibility
   */
  async checkRefundEligibility(req, res) {
    try {
      const { id } = req.params;
      const canRefund = await orderService.canOrderBeRefunded(id);

      res.status(200).json({
        success: true,
        data: { canRefund },
        message: 'Refund eligibility checked successfully'
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode === 404 ? 'ORDER_NOT_FOUND' : 'REFUND_CHECK_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Get order by order number (public endpoint for success page)
   * GET /api/orders/public/:orderNumber
   */
  async getOrderByNumber(req, res) {
    try {
      const { orderNumber } = req.params;
      
      const Order = require('../models/Order');
      const order = await Order.findOne({ orderNumber })
        .populate('items.productId', 'name price images')
        .lean();

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Return only safe public information
      const publicOrder = {
        orderNumber: order.orderNumber,
        total: order.total,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        tax: order.tax,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        items: order.items?.map(item => ({
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal
        })) || [],
        customerInfo: {
          firstName: order.customerInfo?.firstName,
          lastName: order.customerInfo?.lastName,
          email: order.customerInfo?.email ? order.customerInfo.email.substring(0, 2) + '***@' + order.customerInfo.email.split('@')[1] : '' // Masked email
        },
        createdAt: order.createdAt
      };

      res.status(200).json({
        success: true,
        data: publicOrder
      });
    } catch (error) {
      console.error('Error fetching order by number:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
  /**
   * Delete an unpaid order
   * DELETE /api/orders/:id
   */
  async deleteOrder(req, res) {
    try {
      const { id } = req.params;
      
      // Find the order first
      const order = await orderService.getOrderById(id);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ORDER_NOT_FOUND',
            message: 'Order not found'
          }
        });
      }

      // Check if order is paid - prevent deletion of paid orders
      if (order.paymentStatus === 'completed' || order.paymentStatus === 'paid') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CANNOT_DELETE_PAID_ORDER',
            message: 'Cannot delete paid orders. Only unpaid orders can be deleted.'
          }
        });
      }

      // Delete the order
      await orderService.deleteOrder(id);

      res.status(200).json({
        success: true,
        message: 'Order deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting order:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'ORDER_DELETE_ERROR',
          message: error.message
        }
      });
    }
  }
}

module.exports = new OrderController();