const request = require('supertest');
const app = require('../../server');
const Payment = require('../../models/Payment');
const PaymentMethod = require('../../models/PaymentMethod');
const Order = require('../../models/Order');

describe('Payment Controller Tests', () => {
  let testOrder;
  let testPaymentMethod;

  beforeEach(async () => {
    // Create test order
    testOrder = await factory.create('Order', {
      total_amount: 100.00,
      status: 'pending',
      payment_status: 'pending'
    });

    // Create test payment method
    testPaymentMethod = await factory.create('PaymentMethod', {
      name: 'Credit Card',
      type: 'card',
      is_active: true
    });
  });

  describe('POST /api/payments/process', () => {
    it('should process payment successfully', async () => {
      const paymentData = {
        order_id: testOrder._id,
        payment_method_id: testPaymentMethod._id,
        amount: 100.00,
        currency: 'EGP',
        card_data: {
          number: '4111111111111111',
          expiry: '12/25',
          cvv: '123'
        }
      };

      const response = await request(app)
        .post('/api/payments/process')
        .send(paymentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.payment).toBeDefined();
      expect(response.body.payment.status).toBe('completed');
    });

    it('should handle payment failure', async () => {
      const paymentData = {
        order_id: testOrder._id,
        payment_method_id: testPaymentMethod._id,
        amount: 100.00,
        currency: 'EGP',
        card_data: {
          number: '4000000000000002', // Declined card
          expiry: '12/25',
          cvv: '123'
        }
      };

      const response = await request(app)
        .post('/api/payments/process')
        .send(paymentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });
});  desc
ribe('GET /api/payments/methods', () => {
    it('should get all active payment methods', async () => {
      const response = await request(app)
        .get('/api/payments/methods')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.methods)).toBe(true);
      expect(response.body.methods.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/payments/history/:orderId', () => {
    it('should get payment history for order', async () => {
      // Create a payment for the test order
      await factory.create('Payment', {
        order_id: testOrder._id,
        amount: 100.00,
        status: 'completed'
      });

      const response = await request(app)
        .get(`/api/payments/history/${testOrder._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.payments)).toBe(true);
      expect(response.body.payments.length).toBe(1);
    });
  });

  describe('POST /api/payments/refund', () => {
    it('should process refund successfully', async () => {
      // Create a completed payment
      const payment = await factory.create('Payment', {
        order_id: testOrder._id,
        amount: 100.00,
        status: 'completed',
        transaction_id: 'test_txn_123'
      });

      const refundData = {
        payment_id: payment._id,
        amount: 50.00,
        reason: 'Customer request'
      };

      const response = await request(app)
        .post('/api/payments/refund')
        .send(refundData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.refund).toBeDefined();
      expect(response.body.refund.amount).toBe(50.00);
    });
  });

  describe('Payment Validation', () => {
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/payments/process')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should validate payment amount', async () => {
      const paymentData = {
        order_id: testOrder._id,
        payment_method_id: testPaymentMethod._id,
        amount: -10.00, // Invalid negative amount
        currency: 'EGP'
      };

      const response = await request(app)
        .post('/api/payments/process')
        .send(paymentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Amount must be positive');
    });
  });
});