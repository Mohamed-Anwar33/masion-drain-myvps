const mongoose = require('mongoose');
const Order = require('../../models/Order');
const Product = require('../../models/Product');
const { connectDB, disconnectDB, clearDB } = require('../helpers/database');

describe('Order Model Integration Tests', () => {
  let testProduct;
  let validOrderData;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await clearDB();
    
    // Create a test product
    testProduct = await Product.create({
      name: {
        en: 'Test Perfume',
        ar: 'عطر تجريبي'
      },
      description: {
        en: 'A test perfume for orders',
        ar: 'عطر للاختبار للطلبات'
      },
      price: 99.99,
      size: '50ml',
      category: 'floral',
      stock: 10,
      inStock: true
    });

    validOrderData = {
      items: [{
        product: testProduct._id,
        quantity: 2,
        price: 99.99,
        name: {
          en: 'Test Perfume',
          ar: 'عطر تجريبي'
        }
      }],
      total: 199.98,
      customerInfo: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        city: 'New York',
        postalCode: '10001',
        country: 'USA'
      },
      paymentMethod: 'card'
    };
  });

  describe('Order Creation with Product Validation', () => {
    it('should create order with valid product reference', async () => {
      const orderNumber = await Order.generateOrderNumber();
      const orderData = { ...validOrderData, orderNumber };
      
      const order = await Order.create(orderData);
      
      expect(order._id).toBeDefined();
      expect(order.items[0].product.toString()).toBe(testProduct._id.toString());
    });

    it('should populate product details', async () => {
      const orderNumber = await Order.generateOrderNumber();
      const orderData = { ...validOrderData, orderNumber };
      
      const order = await Order.create(orderData);
      const populatedOrder = await Order.findById(order._id).populate('items.product');
      
      expect(populatedOrder.items[0].product.name.en).toBe('Test Perfume');
      expect(populatedOrder.items[0].product.price).toBe(99.99);
    });
  });

  describe('Order Number Generation', () => {
    it('should generate unique order numbers', async () => {
      const orderNumber1 = await Order.generateOrderNumber();
      const orderNumber2 = await Order.generateOrderNumber();
      
      expect(orderNumber1).not.toBe(orderNumber2);
      expect(orderNumber1).toMatch(/^MD\d{11}$/);
      expect(orderNumber2).toMatch(/^MD\d{11}$/);
    });

    it('should handle order number uniqueness constraint', async () => {
      const orderNumber = await Order.generateOrderNumber();
      
      // Create first order
      await Order.create({ ...validOrderData, orderNumber });
      
      // Try to create second order with same number
      await expect(Order.create({ ...validOrderData, orderNumber }))
        .rejects.toThrow();
    });

    it('should generate new number if collision occurs', async () => {
      // Mock the random function to create predictable collision
      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0.123);
      
      try {
        const orderNumber1 = await Order.generateOrderNumber();
        await Order.create({ ...validOrderData, orderNumber: orderNumber1 });
        
        // Should generate different number even with same random
        const orderNumber2 = await Order.generateOrderNumber();
        expect(orderNumber2).not.toBe(orderNumber1);
        
        const order2 = await Order.create({ ...validOrderData, orderNumber: orderNumber2 });
        expect(order2.orderNumber).toBe(orderNumber2);
      } finally {
        Math.random = originalRandom;
      }
    });
  });

  describe('Order Item Validation Against Products', () => {
    it('should validate order items against existing products', async () => {
      const items = [{
        product: testProduct._id,
        quantity: 2,
        price: 99.99,
        name: testProduct.name
      }];
      
      const validationErrors = await Order.validateOrderItems(items);
      expect(validationErrors).toHaveLength(0);
    });

    it('should detect non-existent products', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const items = [{
        product: nonExistentId,
        quantity: 1,
        price: 99.99,
        name: { en: 'Non-existent', ar: 'غير موجود' }
      }];
      
      const validationErrors = await Order.validateOrderItems(items);
      expect(validationErrors).toHaveLength(1);
      expect(validationErrors[0].message).toBe('Product not found');
    });

    it('should detect out of stock products', async () => {
      // Update product to be out of stock
      testProduct.inStock = false;
      await testProduct.save();
      
      const items = [{
        product: testProduct._id,
        quantity: 1,
        price: 99.99,
        name: testProduct.name
      }];
      
      const validationErrors = await Order.validateOrderItems(items);
      expect(validationErrors).toHaveLength(1);
      expect(validationErrors[0].message).toBe('Product is out of stock');
    });

    it('should detect insufficient stock', async () => {
      const items = [{
        product: testProduct._id,
        quantity: 15, // More than available stock (10)
        price: 99.99,
        name: testProduct.name
      }];
      
      const validationErrors = await Order.validateOrderItems(items);
      expect(validationErrors).toHaveLength(1);
      expect(validationErrors[0].message).toBe('Only 10 items available, requested 15');
    });

    it('should detect price mismatch', async () => {
      const items = [{
        product: testProduct._id,
        quantity: 1,
        price: 150.00, // Different from product price (99.99)
        name: testProduct.name
      }];
      
      const validationErrors = await Order.validateOrderItems(items);
      expect(validationErrors).toHaveLength(1);
      expect(validationErrors[0].message).toBe('Item price does not match current product price');
    });

    it('should validate multiple items and return all errors', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const items = [
        {
          product: nonExistentId,
          quantity: 1,
          price: 99.99,
          name: { en: 'Non-existent', ar: 'غير موجود' }
        },
        {
          product: testProduct._id,
          quantity: 15, // Too many
          price: 150.00, // Wrong price
          name: testProduct.name
        }
      ];
      
      const validationErrors = await Order.validateOrderItems(items);
      expect(validationErrors).toHaveLength(3); // Product not found, quantity, price
    });
  });

  describe('Order Filtering and Querying', () => {
    beforeEach(async () => {
      // Create test orders with different statuses and dates
      const baseOrder = { ...validOrderData };
      
      await Order.create([
        {
          ...baseOrder,
          orderNumber: await Order.generateOrderNumber(),
          orderStatus: 'pending',
          paymentStatus: 'pending',
          createdAt: new Date('2024-01-01')
        },
        {
          ...baseOrder,
          orderNumber: await Order.generateOrderNumber(),
          orderStatus: 'confirmed',
          paymentStatus: 'completed',
          createdAt: new Date('2024-01-15'),
          customerInfo: {
            ...baseOrder.customerInfo,
            email: 'jane@example.com'
          }
        },
        {
          ...baseOrder,
          orderNumber: await Order.generateOrderNumber(),
          orderStatus: 'shipped',
          paymentStatus: 'completed',
          createdAt: new Date('2024-02-01')
        }
      ]);
    });

    it('should filter orders by status', async () => {
      const pendingOrders = await Order.findWithFilters({ orderStatus: 'pending' });
      const confirmedOrders = await Order.findWithFilters({ orderStatus: 'confirmed' });
      
      expect(pendingOrders).toHaveLength(1);
      expect(confirmedOrders).toHaveLength(1);
      expect(pendingOrders[0].orderStatus).toBe('pending');
      expect(confirmedOrders[0].orderStatus).toBe('confirmed');
    });

    it('should filter orders by payment status', async () => {
      const completedPayments = await Order.findWithFilters({ paymentStatus: 'completed' });
      
      expect(completedPayments).toHaveLength(2);
      completedPayments.forEach(order => {
        expect(order.paymentStatus).toBe('completed');
      });
    });

    it('should filter orders by date range', async () => {
      const januaryOrders = await Order.findWithFilters({
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });
      
      expect(januaryOrders).toHaveLength(2);
    });

    it('should filter orders by customer email', async () => {
      const janeOrders = await Order.findWithFilters({ customerEmail: 'jane' });
      
      expect(janeOrders).toHaveLength(1);
      expect(janeOrders[0].customerInfo.email).toBe('jane@example.com');
    });

    it('should combine multiple filters', async () => {
      const filteredOrders = await Order.findWithFilters({
        orderStatus: 'confirmed',
        paymentStatus: 'completed',
        customerEmail: 'jane'
      });
      
      expect(filteredOrders).toHaveLength(1);
      expect(filteredOrders[0].orderStatus).toBe('confirmed');
      expect(filteredOrders[0].paymentStatus).toBe('completed');
      expect(filteredOrders[0].customerInfo.email).toBe('jane@example.com');
    });
  });

  describe('Order Statistics', () => {
    beforeEach(async () => {
      const baseOrder = { ...validOrderData };
      
      await Order.create([
        {
          ...baseOrder,
          orderNumber: await Order.generateOrderNumber(),
          total: 100.00,
          orderStatus: 'pending'
        },
        {
          ...baseOrder,
          orderNumber: await Order.generateOrderNumber(),
          total: 200.00,
          orderStatus: 'confirmed'
        },
        {
          ...baseOrder,
          orderNumber: await Order.generateOrderNumber(),
          total: 150.00,
          orderStatus: 'shipped'
        }
      ]);
    });

    it('should calculate order statistics', async () => {
      const stats = await Order.getOrderStats();
      
      expect(stats.totalOrders).toBe(3);
      expect(stats.totalRevenue).toBe(450.00);
      expect(stats.averageOrderValue).toBe(150.00);
      expect(stats.statusBreakdown).toHaveLength(3);
    });

    it('should calculate statistics with date filter', async () => {
      // Update one order to have different date
      const orders = await Order.find();
      orders[0].createdAt = new Date('2023-12-01');
      await orders[0].save();
      
      const stats = await Order.getOrderStats({
        startDate: '2024-01-01'
      });
      
      expect(stats.totalOrders).toBe(2);
    });

    it('should return empty stats when no orders match', async () => {
      const stats = await Order.getOrderStats({
        startDate: '2025-01-01'
      });
      
      expect(stats.totalOrders).toBe(0);
      expect(stats.totalRevenue).toBe(0);
      expect(stats.averageOrderValue).toBe(0);
    });
  });

  describe('Order Status Management', () => {
    let order;

    beforeEach(async () => {
      const orderNumber = await Order.generateOrderNumber();
      order = await Order.create({ ...validOrderData, orderNumber });
    });

    it('should update order status through method', async () => {
      await order.updateStatus('confirmed', 'order');
      
      const updatedOrder = await Order.findById(order._id);
      expect(updatedOrder.orderStatus).toBe('confirmed');
    });

    it('should update payment status through method', async () => {
      await order.updateStatus('completed', 'payment');
      
      const updatedOrder = await Order.findById(order._id);
      expect(updatedOrder.paymentStatus).toBe('completed');
    });

    it('should validate status transitions', async () => {
      await expect(order.updateStatus('invalid-status', 'order'))
        .rejects.toThrow('Invalid order status');
    });

    it('should check cancellation eligibility', () => {
      order.orderStatus = 'pending';
      expect(order.canBeCancelled()).toBe(true);
      
      order.orderStatus = 'shipped';
      expect(order.canBeCancelled()).toBe(false);
    });

    it('should check refund eligibility', () => {
      order.orderStatus = 'confirmed';
      order.paymentStatus = 'completed';
      expect(order.canBeRefunded()).toBe(true);
      
      order.paymentStatus = 'pending';
      expect(order.canBeRefunded()).toBe(false);
    });
  });

  describe('Database Indexes and Performance', () => {
    it('should have proper indexes for common queries', async () => {
      const indexes = await Order.collection.getIndexes();
      
      // Check that important indexes exist
      const indexNames = Object.keys(indexes);
      expect(indexNames).toContain('orderNumber_1');
      expect(indexNames).toContain('orderStatus_1');
      expect(indexNames).toContain('paymentStatus_1');
      expect(indexNames).toContain('createdAt_-1');
    });

    it('should enforce unique constraint on orderNumber', async () => {
      const orderNumber = await Order.generateOrderNumber();
      
      await Order.create({ ...validOrderData, orderNumber });
      
      await expect(Order.create({ ...validOrderData, orderNumber }))
        .rejects.toThrow();
    });
  });
});