const orderController = require('../../controllers/orderController');
const orderService = require('../../services/orderService');

// Mock the order service
jest.mock('../../services/orderService');

describe('OrderController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    const mockOrderData = {
      items: [{
        product: 'product123',
        quantity: 2,
        price: 99.99,
        name: { en: 'Test Perfume', ar: 'عطر تجريبي' }
      }],
      total: 199.98,
      customerInfo: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        city: 'New York',
        postalCode: '10001',
        country: 'USA'
      },
      paymentMethod: 'card'
    };

    it('should create order successfully', async () => {
      const mockOrder = { _id: 'order123', orderNumber: 'MD123456789', ...mockOrderData };
      req.body = mockOrderData;
      orderService.createOrder.mockResolvedValue(mockOrder);

      await orderController.createOrder(req, res);

      expect(orderService.createOrder).toHaveBeenCalledWith(mockOrderData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockOrder,
        message: 'Order created successfully'
      });
    });

    it('should handle order creation error', async () => {
      req.body = mockOrderData;
      orderService.createOrder.mockRejectedValue(new Error('Validation failed'));

      await orderController.createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'ORDER_CREATE_ERROR',
          message: 'Validation failed'
        }
      });
    });
  });

  describe('getOrders', () => {
    it('should get orders with default pagination', async () => {
      const mockResult = {
        orders: [{ _id: 'order1' }, { _id: 'order2' }],
        pagination: { currentPage: 1, totalPages: 1, totalOrders: 2 }
      };
      orderService.getOrders.mockResolvedValue(mockResult);

      await orderController.getOrders(req, res);

      expect(orderService.getOrders).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        orderStatus: undefined,
        paymentStatus: undefined,
        customerEmail: undefined,
        orderNumber: undefined,
        startDate: undefined,
        endDate: undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult.orders,
        pagination: mockResult.pagination,
        message: 'Orders retrieved successfully'
      });
    });

    it('should get orders with custom filters', async () => {
      req.query = {
        page: '2',
        limit: '5',
        orderStatus: 'confirmed',
        paymentStatus: 'completed',
        customerEmail: 'john@example.com',
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const mockResult = {
        orders: [{ _id: 'order1' }],
        pagination: { currentPage: 2, totalPages: 3, totalOrders: 15 }
      };
      orderService.getOrders.mockResolvedValue(mockResult);

      await orderController.getOrders(req, res);

      expect(orderService.getOrders).toHaveBeenCalledWith({
        page: 2,
        limit: 5,
        orderStatus: 'confirmed',
        paymentStatus: 'completed',
        customerEmail: 'john@example.com',
        orderNumber: undefined,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
    });

    it('should handle service error', async () => {
      orderService.getOrders.mockRejectedValue(new Error('Database error'));

      await orderController.getOrders(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'ORDERS_FETCH_ERROR',
          message: 'Database error'
        }
      });
    });
  });

  describe('getOrderById', () => {
    it('should get order by ID successfully', async () => {
      const mockOrder = { _id: 'order123', orderNumber: 'MD123456789' };
      req.params.id = 'order123';
      orderService.getOrderById.mockResolvedValue(mockOrder);

      await orderController.getOrderById(req, res);

      expect(orderService.getOrderById).toHaveBeenCalledWith('order123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockOrder,
        message: 'Order retrieved successfully'
      });
    });

    it('should handle order not found', async () => {
      req.params.id = 'nonexistent';
      orderService.getOrderById.mockRejectedValue(new Error('Order not found'));

      await orderController.getOrderById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      });
    });

    it('should handle service error', async () => {
      req.params.id = 'order123';
      orderService.getOrderById.mockRejectedValue(new Error('Database error'));

      await orderController.getOrderById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'ORDER_FETCH_ERROR',
          message: 'Database error'
        }
      });
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status successfully', async () => {
      const mockOrder = { _id: 'order123', orderStatus: 'confirmed' };
      req.params.id = 'order123';
      req.body = { status: 'confirmed', statusType: 'order' };
      orderService.updateOrderStatus.mockResolvedValue(mockOrder);

      await orderController.updateOrderStatus(req, res);

      expect(orderService.updateOrderStatus).toHaveBeenCalledWith('order123', 'confirmed', 'order');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockOrder,
        message: 'Order order status updated successfully'
      });
    });

    it('should handle missing status', async () => {
      req.params.id = 'order123';
      req.body = {};

      await orderController.updateOrderStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Status is required'
        }
      });
    });

    it('should handle order not found', async () => {
      req.params.id = 'nonexistent';
      req.body = { status: 'confirmed' };
      orderService.updateOrderStatus.mockRejectedValue(new Error('Order not found'));

      await orderController.updateOrderStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      });
    });
  });

  describe('cancelOrder', () => {
    it('should cancel order successfully', async () => {
      const mockOrder = { _id: 'order123', orderStatus: 'cancelled' };
      req.params.id = 'order123';
      req.body = { reason: 'Customer request' };
      orderService.cancelOrder.mockResolvedValue(mockOrder);

      await orderController.cancelOrder(req, res);

      expect(orderService.cancelOrder).toHaveBeenCalledWith('order123', 'Customer request');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockOrder,
        message: 'Order cancelled successfully'
      });
    });

    it('should handle cancellation error', async () => {
      req.params.id = 'order123';
      req.body = { reason: 'Customer request' };
      orderService.cancelOrder.mockRejectedValue(new Error('Order cannot be cancelled'));

      await orderController.cancelOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'ORDER_CANCEL_ERROR',
          message: 'Order cannot be cancelled'
        }
      });
    });
  });

  describe('confirmOrder', () => {
    it('should confirm order successfully', async () => {
      const mockOrder = { _id: 'order123', orderStatus: 'confirmed' };
      req.params.id = 'order123';
      orderService.confirmOrder.mockResolvedValue(mockOrder);

      await orderController.confirmOrder(req, res);

      expect(orderService.confirmOrder).toHaveBeenCalledWith('order123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockOrder,
        message: 'Order confirmed successfully'
      });
    });

    it('should handle confirmation error', async () => {
      req.params.id = 'order123';
      orderService.confirmOrder.mockRejectedValue(new Error('Only pending orders can be confirmed'));

      await orderController.confirmOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'ORDER_CONFIRM_ERROR',
          message: 'Only pending orders can be confirmed'
        }
      });
    });
  });

  describe('refundOrder', () => {
    it('should refund order successfully', async () => {
      const mockOrder = { _id: 'order123', paymentStatus: 'refunded' };
      req.params.id = 'order123';
      req.body = { reason: 'Defective product' };
      orderService.refundOrder.mockResolvedValue(mockOrder);

      await orderController.refundOrder(req, res);

      expect(orderService.refundOrder).toHaveBeenCalledWith('order123', 'Defective product');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockOrder,
        message: 'Order refunded successfully'
      });
    });

    it('should handle refund error', async () => {
      req.params.id = 'order123';
      req.body = { reason: 'Defective product' };
      orderService.refundOrder.mockRejectedValue(new Error('Order cannot be refunded'));

      await orderController.refundOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'ORDER_REFUND_ERROR',
          message: 'Order cannot be refunded'
        }
      });
    });
  });

  describe('getOrderStats', () => {
    it('should get order statistics successfully', async () => {
      const mockStats = {
        totalOrders: 100,
        totalRevenue: 10000,
        averageOrderValue: 100
      };
      req.query = { startDate: '2024-01-01', endDate: '2024-01-31' };
      orderService.getOrderStats.mockResolvedValue(mockStats);

      await orderController.getOrderStats(req, res);

      expect(orderService.getOrderStats).toHaveBeenCalledWith({
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats,
        message: 'Order statistics retrieved successfully'
      });
    });

    it('should handle stats error', async () => {
      orderService.getOrderStats.mockRejectedValue(new Error('Database error'));

      await orderController.getOrderStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'STATS_FETCH_ERROR',
          message: 'Database error'
        }
      });
    });
  });

  describe('checkRefundEligibility', () => {
    it('should check refund eligibility successfully', async () => {
      req.params.id = 'order123';
      orderService.canOrderBeRefunded.mockResolvedValue(true);

      await orderController.checkRefundEligibility(req, res);

      expect(orderService.canOrderBeRefunded).toHaveBeenCalledWith('order123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { canRefund: true },
        message: 'Refund eligibility checked successfully'
      });
    });

    it('should handle order not found', async () => {
      req.params.id = 'nonexistent';
      orderService.canOrderBeRefunded.mockRejectedValue(new Error('Order not found'));

      await orderController.checkRefundEligibility(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      });
    });
  });
});