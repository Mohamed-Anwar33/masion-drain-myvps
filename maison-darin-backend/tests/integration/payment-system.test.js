const request = require('supertest');
const app = require('../../server');
const Payment = require('../../models/Payment');
const Order = require('../../models/Order');
const PaymentMethod = require('../../models/PaymentMethod');

describe('Payment System Integration Tests', () => {
  let authToken;
  let testOrder;
  let testCustomer;

  beforeAll(async () => {
    // Create admin user and get auth token
    const adminUser = await factory.create('User', {
      email: 'admin@test.com',
      role: 'admin'
    });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123'
      });

    authToken = loginResponse.body.data.tokens.accessToken;

    // Create test customer and order
    testCustomer = await factory.create('Customer', {
      name: 'Test Customer',
      email: 'customer@test.com',
      phone: '+201234567890'
    });

    testOrder = await factory.create('Order', {
      customer_id: testCustomer._id,
      total_amount: 500.00,
      status: 'pending',
      payment_status: 'pending'
    });
  });

  describe('Payment Methods', () => {
    it('should get all available payment methods', async () => {
      const response = await request(app)
        .get('/api/payments/methods')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.methods)).toBe(true);
      
      const methods = response.body.methods;
      expect(methods.some(m => m.type === 'card')).toBe(true);
      expect(methods.some(m => m.type === 'wallet')).toBe(true);
      expect(methods.some(m => m.type === 'cash_on_delivery')).toBe(true);
    });

    it('should only return active payment methods', async () => {
      const response = await request(app)
        .get('/api/payments/methods')
        .expect(200);

      const methods = response.body.methods;
      methods.forEach(method => {
        expect(method.is_active).toBe(true);
      });
    });
  });

  describe('Credit Card Payments', () => {
    it('should process valid credit card payment', async () => {
      const paymentData = {
        order_id: testOrder._id,
        payment_method: 'card',
        amount: 500.00,
        currency: 'EGP',
        card_data: {
          number: '4111111111111111', // Valid test card
          expiry: '12/25',
          cvv: '123',
          holder_name: 'Test Customer'
        }
      };

      const response = await request(app)
        .post('/api/payments/process')
        .send(paymentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.payment.status).toBe('completed');
      expect(response.body.payment.amount).toBe(500.00);
      expect(response.body.payment.transaction_id).toBeDefined();
    });

    it('should reject invalid credit card', async () => {
      const paymentData = {
        order_id: testOrder._id,
        payment_method: 'card',
        amount: 500.00,
        currency: 'EGP',
        card_data: {
          number: '4000000000000002', // Declined test card
          expiry: '12/25',
          cvv: '123',
          holder_name: 'Test Customer'
        }
      };

      const response = await request(app)
        .post('/api/payments/process')
        .send(paymentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PAYMENT_DECLINED');
    });

    it('should validate card expiry date', async () => {
      const paymentData = {
        order_id: testOrder._id,
        payment_method: 'card',
        amount: 500.00,
        currency: 'EGP',
        card_data: {
          number: '4111111111111111',
          expiry: '12/20', // Expired date
          cvv: '123',
          holder_name: 'Test Customer'
        }
      };

      const response = await request(app)
        .post('/api/payments/process')
        .send(paymentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Card has expired');
    });
  }); 
 describe('Mobile Wallet Payments', () => {
    it('should process Vodafone Cash payment', async () => {
      const paymentData = {
        order_id: testOrder._id,
        payment_method: 'vodafone_cash',
        amount: 500.00,
        currency: 'EGP',
        wallet_data: {
          phone: '+201234567890',
          pin: '1234'
        }
      };

      const response = await request(app)
        .post('/api/payments/process')
        .send(paymentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.payment.status).toBe('completed');
      expect(response.body.payment.gateway).toBe('vodafone_cash');
    });

    it('should validate wallet phone number', async () => {
      const paymentData = {
        order_id: testOrder._id,
        payment_method: 'vodafone_cash',
        amount: 500.00,
        currency: 'EGP',
        wallet_data: {
          phone: 'invalid-phone',
          pin: '1234'
        }
      };

      const response = await request(app)
        .post('/api/payments/process')
        .send(paymentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Invalid phone number format');
    });
  });

  describe('Cash on Delivery', () => {
    it('should process cash on delivery order', async () => {
      const paymentData = {
        order_id: testOrder._id,
        payment_method: 'cash_on_delivery',
        amount: 500.00,
        currency: 'EGP'
      };

      const response = await request(app)
        .post('/api/payments/process')
        .send(paymentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.payment.status).toBe('pending');
      expect(response.body.payment.gateway).toBe('cash_on_delivery');
    });
  });

  describe('Payment History and Receipts', () => {
    let completedPayment;

    beforeEach(async () => {
      completedPayment = await factory.create('Payment', {
        order_id: testOrder._id,
        amount: 500.00,
        status: 'completed',
        transaction_id: 'test_txn_123',
        gateway: 'paymob'
      });
    });

    it('should get payment history for order', async () => {
      const response = await request(app)
        .get(`/api/payments/history/${testOrder._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.payments)).toBe(true);
      expect(response.body.payments.length).toBeGreaterThan(0);
    });

    it('should generate payment receipt', async () => {
      const response = await request(app)
        .get(`/api/payments/receipt/${completedPayment._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.receipt).toBeDefined();
      expect(response.body.receipt.payment_id).toBe(completedPayment._id.toString());
      expect(response.body.receipt.amount).toBe(500.00);
    });
  });

  describe('Payment Refunds', () => {
    let completedPayment;

    beforeEach(async () => {
      completedPayment = await factory.create('Payment', {
        order_id: testOrder._id,
        amount: 500.00,
        status: 'completed',
        transaction_id: 'test_txn_refund',
        gateway: 'paymob'
      });
    });

    it('should process full refund', async () => {
      const refundData = {
        payment_id: completedPayment._id,
        amount: 500.00,
        reason: 'Customer request'
      };

      const response = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${authToken}`)
        .send(refundData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.refund.amount).toBe(500.00);
      expect(response.body.refund.status).toBe('completed');
    });

    it('should process partial refund', async () => {
      const refundData = {
        payment_id: completedPayment._id,
        amount: 250.00,
        reason: 'Partial return'
      };

      const response = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${authToken}`)
        .send(refundData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.refund.amount).toBe(250.00);
    });

    it('should reject refund exceeding payment amount', async () => {
      const refundData = {
        payment_id: completedPayment._id,
        amount: 600.00, // More than original payment
        reason: 'Invalid refund'
      };

      const response = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${authToken}`)
        .send(refundData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('exceeds payment amount');
    });
  });

  describe('Payment Validation', () => {
    it('should validate required payment fields', async () => {
      const response = await request(app)
        .post('/api/payments/process')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors).toContain('Order ID is required');
      expect(response.body.errors).toContain('Payment method is required');
      expect(response.body.errors).toContain('Amount is required');
    });

    it('should validate payment amount is positive', async () => {
      const paymentData = {
        order_id: testOrder._id,
        payment_method: 'card',
        amount: -100.00,
        currency: 'EGP'
      };

      const response = await request(app)
        .post('/api/payments/process')
        .send(paymentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Amount must be positive');
    });

    it('should validate order exists', async () => {
      const paymentData = {
        order_id: '507f1f77bcf86cd799439999', // Non-existent order
        payment_method: 'card',
        amount: 100.00,
        currency: 'EGP'
      };

      const response = await request(app)
        .post('/api/payments/process')
        .send(paymentData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ORDER_NOT_FOUND');
    });
  });
});