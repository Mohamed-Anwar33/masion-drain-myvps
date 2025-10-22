const orderService = require('../../services/orderService');
const Order = require('../../models/Order');
const Product = require('../../models/Product');

// Mock the models
jest.mock('../../models/Order');
jest.mock('../../models/Product');

describe('OrderService Unit Tests', () => {
  let validOrderData;
  let mockProduct;

  beforeEach(() => {
    jest.clearAllMocks();

    mockProduct = {
      _id: 'product123',
      name: { en: 'Test Perfume', ar: 'عطر تجريبي' },
      price: 99.99,
      stock: 10,
      inStock: true,
      updateStock: jest.fn().mockResolvedValue(true)
    };

    validOrderData = {
      items: [{
        product: 'product123',
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

  describe('validateOrderData', () => {
    it('should validate valid order data', () => {
      expect(() => orderService.validateOrderData(validOrderData)).not.toThrow();
    });

    it('should throw error for missing order data', () => {
      expect(() => orderService.validateOrderData(null)).toThrow('Order data is required');
    });

    it('should throw error for empty items array', () => {
      const orderData = { ...validOrderData, items: [] };
      expect(() => orderService.validateOrderData(orderData)).toThrow('Order must contain at least one item');
    });

    it('should throw error for missing customer info', () => {
      const orderData = { ...validOrderData };
      delete orderData.customerInfo;
      expect(() => orderService.validateOrderData(orderData)).toThrow('Customer information is required');
    });

    it('should throw error for missing payment method', () => {
      const orderData = { ...validOrderData };
      delete orderData.paymentMethod;
      expect(() => orderService.validateOrderData(orderData)).toThrow('Payment method is required');
    });

    it('should throw error for invalid total', () => {
      const orderData = { ...validOrderData, total: -100 };
      expect(() => orderService.validateOrderData(orderData)).toThrow('Order total must be a positive number');
    });

    it('should throw error for missing customer fields', () => {
      const orderData = { ...validOrderData };
      delete orderData.customerInfo.firstName;
      expect(() => orderService.validateOrderData(orderData)).toThrow('Customer firstName is required');
    });

    it('should throw error for invalid email format', () => {
      const orderData = { ...validOrderData };
      orderData.customerInfo.email = 'invalid-email';
      expect(() => orderService.validateOrderData(orderData)).toThrow('Invalid email format');
    });

    it('should throw error for invalid payment method', () => {
      const orderData = { ...validOrderData, paymentMethod: 'invalid' };
      expect(() => orderService.validateOrderData(orderData)).toThrow('Invalid payment method');
    });
  });

  describe('calculateOrderTotal', () => {
    it('should calculate total correctly for single item', () => {
      const items = [{ price: 99.99, quantity: 2 }];
      const total = orderService.calculateOrderTotal(items);
      expect(total).toBe(199.98);
    });

    it('should calculate total correctly for multiple items', () => {
      const items = [
        { price: 99.99, quantity: 2 },
        { price: 50.00, quantity: 1 }
      ];
      const total = orderService.calculateOrderTotal(items);
      expect(total).toBe(249.98);
    });

    it('should handle zero quantity', () => {
      const items = [{ price: 99.99, quantity: 0 }];
      const total = orderService.calculateOrderTotal(items);
      expect(total).toBe(0);
    });
  });

  describe('createOrder', () => {
    beforeEach(() => {
      Order.generateOrderNumber = jest.fn().mockResolvedValue('MD123456789');
      Order.validateOrderItems = jest.fn().mockResolvedValue([]);
      Order.prototype.save = jest.fn().mockResolvedValue({
        _id: 'order123',
        orderNumber: 'MD123456789',
        ...validOrderData
      });
      Product.findById = jest.fn().mockResolvedValue(mockProduct);
    });

    it('should create order successfully', async () => {
      const result = await orderService.createOrder(validOrderData);
      
      expect(Order.generateOrderNumber).toHaveBeenCalled();
      expect(Order.validateOrderItems).toHaveBeenCalledWith(validOrderData.items);
      expect(result.orderNumber).toBe('MD123456789');
      expect(mockProduct.updateStock).toHaveBeenCalledWith(-2);
    });

    it('should throw error for invalid order data', async () => {
      const invalidData = { ...validOrderData };
      delete invalidData.customerInfo;
      
      await expect(orderService.createOrder(invalidData))
        .rejects.toThrow('Failed to create order: Customer information is required');
    });

    it('should throw error for item validation failure', async () => {
      Order.validateOrderItems = jest.fn().mockResolvedValue([
        { item: 0, message: 'Product not found' }
      ]);
      
      await expect(orderService.createOrder(validOrderData))
        .rejects.toThrow('Failed to create order: Order validation failed: Item 1: Product not found');
    });

    it('should throw error for total mismatch', async () => {
      const orderData = { ...validOrderData, total: 100 };
      
      await expect(orderService.createOrder(orderData))
        .rejects.toThrow('Failed to create order: Order total does not match calculated total');
    });
  });

  describe('getOrderById', () => {
    it('should return order when found', async () => {
      const mockOrder = { _id: 'order123', orderNumber: 'MD123456789' };
      Order.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockOrder)
      });
      
      const result = await orderService.getOrderById('order123');
      
      expect(Order.findById).toHaveBeenCalledWith('order123');
      expect(result).toEqual(mockOrder);
    });

    it('should throw error when order not found', async () => {
      Order.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });
      
      await expect(orderService.getOrderById('nonexistent'))
        .rejects.toThrow('Failed to get order: Order not found');
    });
  });

  describe('updateOrderStatus', () => {
    let mockOrder;

    beforeEach(() => {
      mockOrder = {
        _id: 'order123',
        updateStatus: jest.fn().mockResolvedValue(true)
      };
      Order.findById = jest.fn().mockResolvedValue(mockOrder);
    });

    it('should update order status successfully', async () => {
      const result = await orderService.updateOrderStatus('order123', 'confirmed', 'order');
      
      expect(Order.findById).toHaveBeenCalledWith('order123');
      expect(mockOrder.updateStatus).toHaveBeenCalledWith('confirmed', 'order');
      expect(result).toEqual(mockOrder);
    });

    it('should throw error when order not found', async () => {
      Order.findById = jest.fn().mockResolvedValue(null);
      
      await expect(orderService.updateOrderStatus('nonexistent', 'confirmed'))
        .rejects.toThrow('Failed to update order status: Order not found');
    });
  });

  describe('cancelOrder', () => {
    let mockOrder;

    beforeEach(() => {
      mockOrder = {
        _id: 'order123',
        items: [{ product: mockProduct, quantity: 2 }],
        canBeCancelled: jest.fn().mockReturnValue(true),
        updateStatus: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
        notes: ''
      };
      Order.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockOrder)
      });
    });

    it('should cancel order successfully', async () => {
      const result = await orderService.cancelOrder('order123', 'Customer request');
      
      expect(mockOrder.canBeCancelled).toHaveBeenCalled();
      expect(mockProduct.updateStock).toHaveBeenCalledWith(2);
      expect(mockOrder.updateStatus).toHaveBeenCalledWith('cancelled', 'order');
      expect(mockOrder.notes).toBe('Cancelled: Customer request');
    });

    it('should throw error when order cannot be cancelled', async () => {
      mockOrder.canBeCancelled = jest.fn().mockReturnValue(false);
      
      await expect(orderService.cancelOrder('order123'))
        .rejects.toThrow('Failed to cancel order: Order cannot be cancelled in its current status');
    });
  });

  describe('confirmOrder', () => {
    let mockOrder;

    beforeEach(() => {
      mockOrder = {
        _id: 'order123',
        orderStatus: 'pending',
        updateStatus: jest.fn().mockResolvedValue(true)
      };
      Order.findById = jest.fn().mockResolvedValue(mockOrder);
    });

    it('should confirm pending order successfully', async () => {
      const result = await orderService.confirmOrder('order123');
      
      expect(mockOrder.updateStatus).toHaveBeenCalledWith('confirmed', 'order');
      expect(result).toEqual(mockOrder);
    });

    it('should throw error for non-pending order', async () => {
      mockOrder.orderStatus = 'confirmed';
      
      await expect(orderService.confirmOrder('order123'))
        .rejects.toThrow('Failed to confirm order: Only pending orders can be confirmed');
    });
  });

  describe('canOrderBeRefunded', () => {
    let mockOrder;

    beforeEach(() => {
      mockOrder = {
        _id: 'order123',
        canBeRefunded: jest.fn().mockReturnValue(true)
      };
      Order.findById = jest.fn().mockResolvedValue(mockOrder);
    });

    it('should return refund eligibility', async () => {
      const result = await orderService.canOrderBeRefunded('order123');
      
      expect(mockOrder.canBeRefunded).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should throw error when order not found', async () => {
      Order.findById = jest.fn().mockResolvedValue(null);
      
      await expect(orderService.canOrderBeRefunded('nonexistent'))
        .rejects.toThrow('Failed to check refund eligibility: Order not found');
    });
  });

  describe('refundOrder', () => {
    let mockOrder;

    beforeEach(() => {
      mockOrder = {
        _id: 'order123',
        orderStatus: 'shipped',
        items: [{ product: mockProduct, quantity: 2 }],
        canBeRefunded: jest.fn().mockReturnValue(true),
        updateStatus: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
        notes: ''
      };
      Order.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockOrder)
      });
    });

    it('should refund shipped order successfully', async () => {
      const result = await orderService.refundOrder('order123', 'Defective product');
      
      expect(mockOrder.canBeRefunded).toHaveBeenCalled();
      expect(mockProduct.updateStock).toHaveBeenCalledWith(2);
      expect(mockOrder.updateStatus).toHaveBeenCalledWith('refunded', 'payment');
      expect(mockOrder.notes).toBe('Refunded: Defective product');
    });

    it('should throw error when order cannot be refunded', async () => {
      mockOrder.canBeRefunded = jest.fn().mockReturnValue(false);
      
      await expect(orderService.refundOrder('order123'))
        .rejects.toThrow('Failed to refund order: Order cannot be refunded in its current status');
    });
  });

  describe('getOrderStats', () => {
    it('should return order statistics', async () => {
      const mockStats = {
        totalOrders: 100,
        totalRevenue: 10000,
        averageOrderValue: 100
      };
      Order.getOrderStats = jest.fn().mockResolvedValue(mockStats);
      
      const result = await orderService.getOrderStats({ startDate: '2024-01-01' });
      
      expect(Order.getOrderStats).toHaveBeenCalledWith({ startDate: '2024-01-01' });
      expect(result).toEqual(mockStats);
    });
  });
});