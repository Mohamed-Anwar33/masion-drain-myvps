const Order = require('../models/Order');
const Product = require('../models/Product');
const notificationService = require('./notificationService');
const emailService = require('./emailService');

class OrderService {
  /**
   * Create a new order with complete validation
   * @param {Object} orderData - Order data
{{ ... }}
   * @returns {Promise<Object>} Created order
   */
  async createOrder(orderData) {
    try {
      // Validate order data structure
      this.validateOrderData(orderData);
      
      // Validate items against product availability
      await this.validateOrderItems(orderData.items);
      
      // Generate unique order number
      const orderNumber = await Order.generateOrderNumber();
      
      // Calculate and validate total
      const calculatedTotal = this.calculateOrderTotal(orderData.items);
      if (Math.abs(calculatedTotal - orderData.total) > 0.01) {
        throw new Error('Order total does not match calculated total');
      }
      
      // Create order with generated order number
      const order = new Order({
        ...orderData,
        orderNumber,
        total: calculatedTotal
      });
      
      // Save order and update product stock
      const savedOrder = await order.save();
      await this.updateProductStock(orderData.items);
      
      // For PayPal orders, don't send emails until payment is confirmed
      // For other payment methods (like COD), send confirmation email immediately
      if (orderData.paymentMethod !== 'paypal') {
        await this.sendOrderConfirmationEmails(savedOrder);
      } else {
        console.log(`📦 Order ${savedOrder.orderNumber} created - awaiting PayPal payment confirmation`);
      }
      
      return savedOrder;
    } catch (error) {
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  /**
   * Send order confirmation emails to customer and admin
   * @param {Object} order - Order object
   */
  async sendOrderConfirmationEmails(order) {
    // Send order confirmation email to customer
    try {
      await emailService.sendOrderConfirmation(order);
      console.log(`✅ Order confirmation email sent for order ${order.orderNumber}`);
    } catch (emailError) {
      console.error(`❌ Failed to send order confirmation email for order ${order.orderNumber}:`, emailError.message);
      // Don't fail if email fails
    }

    // Send notification to admin
    try {
      await emailService.sendPaymentNotification({
        orderNumber: order.orderNumber,
        customerName: `${order.customerInfo.firstName} ${order.customerInfo.lastName}`,
        customerEmail: order.customerInfo.email,
        total: order.total,
        paymentMethod: order.paymentMethod,
        items: order.items
      });
      console.log(`✅ Admin notification sent for order ${order.orderNumber}`);
    } catch (adminEmailError) {
      console.error(`❌ Failed to send admin notification for order ${order.orderNumber}:`, adminEmailError.message);
      // Don't fail if email fails
    }
  }

  /**
   * Validate order data structure
   * @param {Object} orderData - Order data to validate
   */
  validateOrderData(orderData) {
    if (!orderData) {
      throw new Error('Order data is required');
    }

    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    if (!orderData.customerInfo) {
      throw new Error('Customer information is required');
    }

    if (!orderData.paymentMethod) {
      throw new Error('Payment method is required');
    }

    if (typeof orderData.total !== 'number' || orderData.total <= 0) {
      throw new Error('Order total must be a positive number');
    }

    // Validate customer info
    const { customerInfo } = orderData;
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'country'];
    
    for (const field of requiredFields) {
      if (!customerInfo[field] || typeof customerInfo[field] !== 'string' || customerInfo[field].trim() === '') {
        throw new Error(`Customer ${field} is required`);
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerInfo.email)) {
      throw new Error('Invalid email format');
    }

    // Validate payment method
    const validPaymentMethods = ['cash_on_delivery', 'bank_transfer', 'credit_card', 'paypal'];
    if (!validPaymentMethods.includes(orderData.paymentMethod)) {
      throw new Error('Invalid payment method');
    }
  }

  /**
   * Validate order items against product availability
   * @param {Array} items - Order items to validate
   */
  async validateOrderItems(items) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    const Product = require('../models/Product');
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Basic validation
      if (!item.productId) {
        throw new Error(`Item ${i + 1}: Product ID is required`);
      }
      
      if (!item.quantity || item.quantity <= 0) {
        throw new Error(`Item ${i + 1}: Quantity must be greater than 0`);
      }
      
      if (!item.price || item.price <= 0) {
        throw new Error(`Item ${i + 1}: Price must be greater than 0`);
      }

      // Check if product exists (optional for PayPal orders)
      try {
        const product = await Product.findById(item.productId);
        if (!product) {
          console.warn(`Product ${item.productId} not found, but allowing order for PayPal`);
        }
      } catch (error) {
        console.warn(`Error checking product ${item.productId}:`, error.message);
        // Continue with order creation for PayPal
      }
    }
  }

  /**
   * Calculate order total from items
   * @param {Array} items - Order items
   * @returns {number} Calculated total
   */
  calculateOrderTotal(items) {
    return items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }

  /**
   * Update product stock after order creation
   * @param {Array} items - Order items
   */
  async updateProductStock(items) {
    for (const item of items) {
      try {
        const productId = item.productId || item.product;
        if (!productId) continue;

        const product = await Product.findById(productId);
        if (product) {
          // Update stock if product has stock tracking
          if (product.stock !== undefined && product.stock >= item.quantity) {
            product.stock -= item.quantity;
            await product.save();
            console.log(`Updated stock for product ${productId}: ${product.stock}`);
          } else {
            console.warn(`Insufficient stock for product ${productId} or stock not tracked`);
          }
        } else {
          console.warn(`Product ${productId} not found for stock update`);
        }
      } catch (error) {
        console.error(`Error updating stock for item:`, error.message);
        // Continue with other items even if one fails
      }
    }
  }

  /**
   * Get order by ID
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Order with populated product details
   */
  async getOrderById(orderId) {
    try {
      const order = await Order.findById(orderId).populate('items.product');
      
      if (!order) {
        throw new Error('Order not found');
      }
      
      return order;
    } catch (error) {
      throw new Error(`Failed to get order: ${error.message}`);
    }
  }

  /**
   * Get orders with filters and pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Orders with pagination info
  async getOrders(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        paymentStatus,
        customerEmail,
        orderNumber,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      // Build MongoDB query filters
      const mongoFilters = {};
      if (status) mongoFilters.status = status;
      if (paymentStatus) mongoFilters.paymentStatus = paymentStatus;
      if (customerEmail) mongoFilters['customerInfo.email'] = { $regex: customerEmail, $options: 'i' };
      if (orderNumber) mongoFilters.orderNumber = { $regex: orderNumber, $options: 'i' };
      
      // Date range filters
      if (startDate || endDate) {
        mongoFilters.createdAt = {};
        if (startDate) mongoFilters.createdAt.$gte = new Date(startDate);
        if (endDate) mongoFilters.createdAt.$lte = new Date(endDate);
      }

      // Calculate pagination
      const skip = (page - 1) * limit;
      
      console.log('📋 Order query filters:', mongoFilters);
      console.log('📋 Sort options:', { [sortBy]: sortOrder === 'desc' ? -1 : 1 });
      
      // Get orders with filters
      const orders = await Order.find(mongoFilters)
        .populate('items.productId', 'name price category images')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // Get total count for pagination
      const totalOrders = await Order.countDocuments(mongoFilters);

      return {
        orders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalOrders / limit),
          totalOrders,
          hasNextPage: page < Math.ceil(totalOrders / limit),
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Failed to get orders: ${error.message}`);
    }
  }

  /**
   * Get orders with filters and pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Orders with pagination info
   */
  async getOrders(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        paymentStatus,
        customerEmail,
        orderNumber,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      // Build MongoDB query filters
      const mongoFilters = {};
      if (status) mongoFilters.status = status;
      if (paymentStatus) mongoFilters.paymentStatus = paymentStatus;
      if (customerEmail) mongoFilters['customerInfo.email'] = { $regex: customerEmail, $options: 'i' };
      if (orderNumber) mongoFilters.orderNumber = { $regex: orderNumber, $options: 'i' };
      
      // Date range filters
      if (startDate || endDate) {
        mongoFilters.createdAt = {};
        if (startDate) mongoFilters.createdAt.$gte = new Date(startDate);
        if (endDate) mongoFilters.createdAt.$lte = new Date(endDate);
      }

      // Calculate pagination
      const skip = (page - 1) * limit;
      
      console.log('📋 Order query filters:', mongoFilters);
      console.log('📋 Sort options:', { [sortBy]: sortOrder === 'desc' ? -1 : 1 });
      
      // Get orders with filters
      const orders = await Order.find(mongoFilters)
        .populate('items.productId', 'name price category images')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // Get total count for pagination
      const totalOrders = await Order.countDocuments(mongoFilters);

      return {
        orders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalOrders / limit),
          totalOrders,
          hasNextPage: page < Math.ceil(totalOrders / limit),
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Failed to get orders: ${error.message}`);
    }
  }

  /**
   * Cancel an order
   * @param {string} orderId - Order ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Updated order
   */
  async cancelOrder(orderId, reason = '') {
    try {
      const order = await Order.findById(orderId).populate('items.product');
      
      if (!order) {
        throw new Error('Order not found');
      }

      if (!order.canBeCancelled()) {
        throw new Error('Order cannot be cancelled in its current status');
      }

      // Restore product stock
      await this.restoreProductStock(order.items);

      // Update order status
      await order.updateStatus('cancelled', 'order');
      
      // Add cancellation note
      order.notes = reason ? `Cancelled: ${reason}` : 'Order cancelled';
      await order.save();

      // Send cancellation notification
      try {
        await notificationService.sendOrderCancellationNotification(order, reason);
      } catch (notificationError) {
        // Log notification error but don't fail the cancellation
        console.error('Failed to send cancellation notification:', notificationError);
      }

      return order;
    } catch (error) {
      throw new Error(`Failed to cancel order: ${error.message}`);
    }
  }

  /**
   * Restore product stock after order cancellation
   * @param {Array} items - Order items
   */
  async restoreProductStock(items) {
    for (const item of items) {
      if (item.product) {
        await item.product.updateStock(item.quantity);
      }
    }
  }

  /**
   * Process order confirmation
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Confirmed order
   */
  async confirmOrder(orderId) {
    try {
      const order = await Order.findById(orderId);
      
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.orderStatus !== 'pending') {
        throw new Error('Only pending orders can be confirmed');
      }

      await order.updateStatus('confirmed', 'order');
      
      // Send confirmation notification
      try {
        await notificationService.sendOrderConfirmationNotification(order);
      } catch (notificationError) {
        // Log notification error but don't fail the confirmation
        console.error('Failed to send confirmation notification:', notificationError);
      }
      
      return order;
    } catch (error) {
      throw new Error(`Failed to confirm order: ${error.message}`);
    }
  }

  /**
   * Get order statistics
   * @param {Object} filters - Date and other filters
   * @returns {Promise<Object>} Order statistics
   */
  async getOrderStats(filters = {}) {
    try {
      return await Order.getOrderStats(filters);
    } catch (error) {
      throw new Error(`Failed to get order statistics: ${error.message}`);
    }
  }

  /**
   * Check if order can be refunded
   * @param {string} orderId - Order ID
   * @returns {Promise<boolean>} Whether order can be refunded
   */
  async canOrderBeRefunded(orderId) {
    try {
      const order = await Order.findById(orderId);
      
      if (!order) {
        throw new Error('Order not found');
      }

      return order.canBeRefunded();
    } catch (error) {
      throw new Error(`Failed to check refund eligibility: ${error.message}`);
    }
  }

  /**
   * Process order refund
   * @param {string} orderId - Order ID
   * @param {string} reason - Refund reason
   * @returns {Promise<Object>} Updated order
   */
  async refundOrder(orderId, reason = '') {
    try {
      const order = await Order.findById(orderId).populate('items.product');
      
      if (!order) {
        throw new Error('Order not found');
      }

      if (!order.canBeRefunded()) {
        throw new Error('Order cannot be refunded in its current status');
      }

      // Restore product stock if order was shipped/delivered
      if (['shipped', 'delivered'].includes(order.orderStatus)) {
        await this.restoreProductStock(order.items);
      }

      // Update payment status
      await order.updateStatus('refunded', 'payment');
      
      // Add refund note
      order.notes = reason ? `Refunded: ${reason}` : 'Order refunded';
      await order.save();

      return order;
    } catch (error) {
      throw new Error(`Failed to refund order: ${error.message}`);
    }
  }

  /**
   * Get order by ID
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Order
   */
  async getOrderById(orderId) {
    try {
      const order = await Order.findById(orderId)
        .populate('items.productId', 'name price category images')
        .lean();
      
      if (!order) {
        throw new Error('Order not found');
      }
      
      return order;
    } catch (error) {
      throw new Error(`Failed to get order: ${error.message}`);
    }
  }

  /**
   * Find order by PayPal order ID
   * @param {string} paypalOrderId - PayPal order ID
   * @returns {Promise<Object>} Order
   */
  async findByPayPalOrderId(paypalOrderId) {
    try {
      const order = await Order.findOne({ paypalOrderId })
        .populate('items.productId', 'name price category images');
      
      return order;
    } catch (error) {
      throw new Error(`Failed to find order by PayPal ID: ${error.message}`);
    }
  }

  /**
   * Update order status with additional data
   * @param {string} orderId - Order ID
   * @param {string} status - New status
   * @param {Object} additionalData - Additional data to update
   * @returns {Promise<Object>} Updated order
   */
  async updateOrderStatus(orderId, status, additionalData = {}) {
    try {
      const order = await Order.findById(orderId);
      
      if (!order) {
        throw new Error('Order not found');
      }

      // Update status and additional data
      order.status = status;
      Object.assign(order, additionalData);
      
      await order.save();
      
      console.log(`✅ Order ${order.orderNumber} status updated to: ${status}`);
      
      return order;
    } catch (error) {
      throw new Error(`Failed to update order status: ${error.message}`);
    }
  }

  /**
   * Delete an order (only unpaid orders)
   * @param {string} orderId - Order ID
   * @returns {Promise<void>}
   */
  async deleteOrder(orderId) {
    try {
      const order = await Order.findById(orderId);
      
      if (!order) {
        throw new Error('Order not found');
      }

      // Double check - ensure order is not paid
      if (order.paymentStatus === 'completed' || order.paymentStatus === 'paid') {
        throw new Error('Cannot delete paid orders');
      }

      // Delete the order
      await Order.findByIdAndDelete(orderId);
      
      console.log(`🗑️ Order ${order.orderNumber} deleted successfully`);
      
      return true;
    } catch (error) {
      throw new Error(`Failed to delete order: ${error.message}`);
    }
  }
}

module.exports = new OrderService();