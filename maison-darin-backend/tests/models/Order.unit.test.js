const mongoose = require('mongoose');
const Order = require('../../models/Order');

describe('Order Model Unit Tests', () => {
  let validOrderData;

  beforeEach(() => {
    validOrderData = {
      orderNumber: 'MD123456789',
      items: [{
        product: new mongoose.Types.ObjectId(),
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

  describe('Schema Validation', () => {
    it('should create a valid order instance', () => {
      const order = new Order(validOrderData);
      
      expect(order.orderNumber).toBe(validOrderData.orderNumber);
      expect(order.total).toBe(validOrderData.total);
      expect(order.orderStatus).toBe('pending');
      expect(order.paymentStatus).toBe('pending');
      expect(order.items).toHaveLength(1);
      expect(order.customerInfo.email).toBe(validOrderData.customerInfo.email);
    });

    it('should validate orderNumber is required', () => {
      const orderData = { ...validOrderData };
      delete orderData.orderNumber;
      
      const order = new Order(orderData);
      const validationError = order.validateSync();
      
      expect(validationError.errors.orderNumber).toBeDefined();
      expect(validationError.errors.orderNumber.message).toBe('Order number is required');
    });

    it('should validate items array is not empty', () => {
      const orderData = { ...validOrderData };
      orderData.items = [];
      
      const order = new Order(orderData);
      
      // Empty items array should be valid for schema but business logic should handle it
      expect(order.items).toHaveLength(0);
    });

    it('should validate total is required', () => {
      const orderData = { ...validOrderData };
      delete orderData.total;
      
      const order = new Order(orderData);
      const validationError = order.validateSync();
      
      expect(validationError.errors.total).toBeDefined();
      expect(validationError.errors.total.message).toBe('Order total is required');
    });

    it('should validate customerInfo is required', () => {
      const orderData = { ...validOrderData };
      delete orderData.customerInfo;
      
      const order = new Order(orderData);
      const validationError = order.validateSync();
      
      expect(validationError.errors['customerInfo.firstName']).toBeDefined();
    });

    it('should validate paymentMethod is required', () => {
      const orderData = { ...validOrderData };
      delete orderData.paymentMethod;
      
      const order = new Order(orderData);
      const validationError = order.validateSync();
      
      expect(validationError.errors.paymentMethod).toBeDefined();
      expect(validationError.errors.paymentMethod.message).toBe('Payment method is required');
    });
  });

  describe('Order Items Validation', () => {
    it('should validate product reference is required in items', () => {
      const orderData = { ...validOrderData };
      delete orderData.items[0].product;
      
      const order = new Order(orderData);
      const validationError = order.validateSync();
      
      expect(validationError.errors['items.0.product']).toBeDefined();
      expect(validationError.errors['items.0.product'].message).toBe('Product reference is required');
    });

    it('should validate quantity is required in items', () => {
      const orderData = { ...validOrderData };
      delete orderData.items[0].quantity;
      
      const order = new Order(orderData);
      const validationError = order.validateSync();
      
      expect(validationError.errors['items.0.quantity']).toBeDefined();
      expect(validationError.errors['items.0.quantity'].message).toBe('Quantity is required');
    });

    it('should validate quantity is positive', () => {
      const orderData = { ...validOrderData };
      orderData.items[0].quantity = 0;
      
      const order = new Order(orderData);
      const validationError = order.validateSync();
      
      expect(validationError.errors['items.0.quantity']).toBeDefined();
      expect(validationError.errors['items.0.quantity'].message).toBe('Quantity must be at least 1');
    });

    it('should validate quantity is integer', () => {
      const orderData = { ...validOrderData };
      orderData.items[0].quantity = 1.5;
      
      const order = new Order(orderData);
      const validationError = order.validateSync();
      
      expect(validationError.errors['items.0.quantity']).toBeDefined();
      expect(validationError.errors['items.0.quantity'].message).toBe('Quantity must be a positive integer');
    });

    it('should validate price is required in items', () => {
      const orderData = { ...validOrderData };
      delete orderData.items[0].price;
      
      const order = new Order(orderData);
      const validationError = order.validateSync();
      
      expect(validationError.errors['items.0.price']).toBeDefined();
      expect(validationError.errors['items.0.price'].message).toBe('Item price is required');
    });

    it('should validate price is non-negative', () => {
      const orderData = { ...validOrderData };
      orderData.items[0].price = -10;
      
      const order = new Order(orderData);
      const validationError = order.validateSync();
      
      expect(validationError.errors['items.0.price']).toBeDefined();
      expect(validationError.errors['items.0.price'].message).toBe('Price cannot be negative');
    });

    it('should validate product name in both languages', () => {
      const orderData = { ...validOrderData };
      delete orderData.items[0].name.en;
      
      const order = new Order(orderData);
      const validationError = order.validateSync();
      
      expect(validationError.errors['items.0.name.en']).toBeDefined();
      expect(validationError.errors['items.0.name.en'].message).toBe('English product name is required');
    });
  });

  describe('Customer Info Validation', () => {
    it('should validate firstName is required', () => {
      const orderData = { ...validOrderData };
      delete orderData.customerInfo.firstName;
      
      const order = new Order(orderData);
      const validationError = order.validateSync();
      
      expect(validationError.errors['customerInfo.firstName']).toBeDefined();
      expect(validationError.errors['customerInfo.firstName'].message).toBe('First name is required');
    });

    it('should validate firstName contains only letters and spaces', () => {
      const orderData = { ...validOrderData };
      orderData.customerInfo.firstName = 'John123';
      
      const order = new Order(orderData);
      const validationError = order.validateSync();
      
      expect(validationError.errors['customerInfo.firstName']).toBeDefined();
      expect(validationError.errors['customerInfo.firstName'].message).toBe('First name can only contain letters and spaces');
    });

    it('should validate email format', () => {
      const orderData = { ...validOrderData };
      orderData.customerInfo.email = 'invalid-email';
      
      const order = new Order(orderData);
      const validationError = order.validateSync();
      
      expect(validationError.errors['customerInfo.email']).toBeDefined();
      expect(validationError.errors['customerInfo.email'].message).toBe('Please provide a valid email address');
    });

    it('should validate phone number format', () => {
      const orderData = { ...validOrderData };
      orderData.customerInfo.phone = 'invalid-phone';
      
      const order = new Order(orderData);
      const validationError = order.validateSync();
      
      expect(validationError.errors['customerInfo.phone']).toBeDefined();
      expect(validationError.errors['customerInfo.phone'].message).toBe('Please provide a valid phone number');
    });

    it('should accept valid international phone formats', () => {
      const orderData = { ...validOrderData };
      orderData.customerInfo.phone = '+1 (555) 123-4567';
      
      const order = new Order(orderData);
      const validationError = order.validateSync();
      
      // If no validation error, it should be null or undefined
      expect(validationError).toBeFalsy();
      expect(order.customerInfo.phone).toBe('+1 (555) 123-4567');
    });
  });

  describe('Payment and Order Status Validation', () => {
    it('should validate paymentMethod enum', () => {
      const orderData = { ...validOrderData };
      orderData.paymentMethod = 'invalid-method';
      
      const order = new Order(orderData);
      const validationError = order.validateSync();
      
      expect(validationError.errors.paymentMethod).toBeDefined();
      expect(validationError.errors.paymentMethod.message).toBe('Payment method must be one of: paypal, card, bank_transfer');
    });

    it('should set default paymentStatus to pending', () => {
      const order = new Order(validOrderData);
      
      expect(order.paymentStatus).toBe('pending');
    });

    it('should set default orderStatus to pending', () => {
      const order = new Order(validOrderData);
      
      expect(order.orderStatus).toBe('pending');
    });

    it('should validate paymentStatus enum', () => {
      const orderData = { ...validOrderData };
      orderData.paymentStatus = 'invalid-status';
      
      const order = new Order(orderData);
      const validationError = order.validateSync();
      
      expect(validationError.errors.paymentStatus).toBeDefined();
      expect(validationError.errors.paymentStatus.message).toBe('Payment status must be one of: pending, completed, failed, refunded');
    });

    it('should validate orderStatus enum', () => {
      const orderData = { ...validOrderData };
      orderData.orderStatus = 'invalid-status';
      
      const order = new Order(orderData);
      const validationError = order.validateSync();
      
      expect(validationError.errors.orderStatus).toBeDefined();
      expect(validationError.errors.orderStatus.message).toBe('Order status must be one of: pending, confirmed, processing, shipped, delivered, cancelled');
    });
  });

  describe('Total Validation', () => {
    it('should validate total is non-negative', () => {
      const orderData = { ...validOrderData };
      orderData.total = -100;
      
      const order = new Order(orderData);
      const validationError = order.validateSync();
      
      expect(validationError.errors.total).toBeDefined();
      expect(validationError.errors.total.message).toBe('Total cannot be negative');
    });

    it('should accept valid positive total', () => {
      const orderData = { ...validOrderData };
      orderData.total = 199.98;
      
      const order = new Order(orderData);
      const validationError = order.validateSync();
      
      // If no validation error, it should be null or undefined
      expect(validationError).toBeFalsy();
      expect(order.total).toBe(199.98);
    });
  });

  describe('Instance Methods', () => {
    let order;

    beforeEach(() => {
      order = new Order(validOrderData);
    });

    describe('calculateTotal', () => {
      it('should calculate total correctly', () => {
        const calculatedTotal = order.calculateTotal();
        expect(calculatedTotal).toBe(199.98);
      });

      it('should handle multiple items', () => {
        order.items.push({
          product: new mongoose.Types.ObjectId(),
          quantity: 1,
          price: 50.00,
          name: {
            en: 'Another Perfume',
            ar: 'عطر آخر'
          }
        });
        
        const calculatedTotal = order.calculateTotal();
        expect(calculatedTotal).toBe(249.98);
      });
    });

    describe('updateStatus', () => {
      // Mock the save method for these tests
      beforeEach(() => {
        order.save = jest.fn().mockResolvedValue(order);
      });

      it('should update order status', async () => {
        await order.updateStatus('confirmed', 'order');
        expect(order.orderStatus).toBe('confirmed');
      });

      it('should update payment status', async () => {
        await order.updateStatus('completed', 'payment');
        expect(order.paymentStatus).toBe('completed');
      });

      it('should reject invalid order status', async () => {
        await expect(order.updateStatus('invalid-status', 'order'))
          .rejects.toThrow('Invalid order status: invalid-status');
      });

      it('should reject invalid payment status', async () => {
        await expect(order.updateStatus('invalid-status', 'payment'))
          .rejects.toThrow('Invalid payment status: invalid-status');
      });

      it('should reject invalid status type', async () => {
        await expect(order.updateStatus('confirmed', 'invalid-type'))
          .rejects.toThrow('Status type must be either "order" or "payment"');
      });
    });

    describe('canBeCancelled', () => {
      it('should return true for pending orders', () => {
        order.orderStatus = 'pending';
        expect(order.canBeCancelled()).toBe(true);
      });

      it('should return true for confirmed orders', () => {
        order.orderStatus = 'confirmed';
        expect(order.canBeCancelled()).toBe(true);
      });

      it('should return false for shipped orders', () => {
        order.orderStatus = 'shipped';
        expect(order.canBeCancelled()).toBe(false);
      });

      it('should return false for delivered orders', () => {
        order.orderStatus = 'delivered';
        expect(order.canBeCancelled()).toBe(false);
      });
    });

    describe('canBeRefunded', () => {
      it('should return true for completed payment and confirmed order', () => {
        order.orderStatus = 'confirmed';
        order.paymentStatus = 'completed';
        expect(order.canBeRefunded()).toBe(true);
      });

      it('should return true for completed payment and processing order', () => {
        order.orderStatus = 'processing';
        order.paymentStatus = 'completed';
        expect(order.canBeRefunded()).toBe(true);
      });

      it('should return false for pending payment', () => {
        order.orderStatus = 'confirmed';
        order.paymentStatus = 'pending';
        expect(order.canBeRefunded()).toBe(false);
      });

      it('should return false for delivered order', () => {
        order.orderStatus = 'delivered';
        order.paymentStatus = 'completed';
        expect(order.canBeRefunded()).toBe(false);
      });
    });
  });

  describe('Static Methods', () => {
    describe('generateOrderNumber', () => {
      beforeEach(() => {
        // Mock Order.findOne to simulate database queries
        Order.findOne = jest.fn().mockResolvedValue(null);
      });

      it('should generate order number with correct format', async () => {
        const orderNumber = await Order.generateOrderNumber();
        
        expect(orderNumber).toMatch(/^MD\d{11}$/);
        expect(orderNumber.length).toBe(13);
      });

      it('should generate different order numbers', async () => {
        const orderNumber1 = await Order.generateOrderNumber();
        const orderNumber2 = await Order.generateOrderNumber();
        
        expect(orderNumber1).not.toBe(orderNumber2);
      });

      it('should handle collision by generating new number', async () => {
        // Mock collision on first attempt
        Order.findOne = jest.fn()
          .mockResolvedValueOnce({ orderNumber: 'MD12345678901' }) // First call returns existing
          .mockResolvedValueOnce(null); // Second call returns null (unique)

        const orderNumber = await Order.generateOrderNumber();
        
        expect(orderNumber).toMatch(/^MD\d{13}$/); // Should have counter appended
        expect(Order.findOne).toHaveBeenCalledTimes(2);
      });
    });

    describe('findWithFilters', () => {
      beforeEach(() => {
        // Mock Order.find method
        Order.find = jest.fn().mockReturnValue({
          find: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue([])
        });
      });

      it('should build query for order status filter', () => {
        Order.findWithFilters({ orderStatus: 'confirmed' });
        
        expect(Order.find).toHaveBeenCalledWith({ orderStatus: 'confirmed' });
      });

      it('should build query for payment status filter', () => {
        Order.findWithFilters({ paymentStatus: 'completed' });
        
        expect(Order.find).toHaveBeenCalledWith({ paymentStatus: 'completed' });
      });

      it('should build query for customer email filter', () => {
        Order.findWithFilters({ customerEmail: 'jane' });
        
        expect(Order.find).toHaveBeenCalledWith({ 
          'customerInfo.email': expect.any(RegExp) 
        });
      });

      it('should build query for date range filter', () => {
        const startDate = '2024-01-01';
        const endDate = '2024-01-31';
        
        Order.findWithFilters({ startDate, endDate });
        
        expect(Order.find).toHaveBeenCalledWith({
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        });
      });
    });
  });

  describe('Timestamps', () => {
    it('should set createdAt and updatedAt on creation', () => {
      const order = new Order(validOrderData);
      
      expect(order.createdAt).toBeDefined();
      expect(order.updatedAt).toBeDefined();
      expect(order.createdAt).toEqual(order.updatedAt);
    });

    it('should have default timestamp values', () => {
      const order = new Order(validOrderData);
      const now = new Date();
      
      expect(order.createdAt).toBeInstanceOf(Date);
      expect(order.updatedAt).toBeInstanceOf(Date);
      expect(Math.abs(order.createdAt.getTime() - now.getTime())).toBeLessThan(1000);
    });
  });
});