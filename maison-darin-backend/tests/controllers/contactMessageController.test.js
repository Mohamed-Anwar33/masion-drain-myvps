const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const ContactMessage = require('../../models/ContactMessage');
const User = require('../../models/User');
const { generateToken } = require('../../services/jwtService');

describe('ContactMessage Controller Tests', () => {
  let authToken;
  let testUser;
  let validContactMessageData;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await ContactMessage.deleteMany({});
    await User.deleteMany({});

    // Create test user and get auth token
    testUser = await User.create({
      email: 'admin@test.com',
      password: 'hashedpassword',
      role: 'admin'
    });

    authToken = generateToken(testUser._id);

    validContactMessageData = {
      customerInfo: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        company: 'Test Company'
      },
      subject: 'Product Inquiry',
      message: 'I would like to know more about your perfume collection.',
      category: 'product_question',
      preferredLanguage: 'en'
    };
  });

  describe('POST /api/contact', () => {
    test('should submit contact message with valid data', async () => {
      const response = await request(app)
        .post('/api/contact')
        .send(validContactMessageData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.messageNumber).toBeDefined();
      expect(response.body.data.status).toBe('new');
      expect(response.body.message).toContain('submitted successfully');
    });

    test('should reject message with missing required fields', async () => {
      delete validContactMessageData.customerInfo.firstName;

      const response = await request(app)
        .post('/api/contact')
        .send(validContactMessageData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('First name is required');
    });

    test('should reject message with invalid email', async () => {
      validContactMessageData.customerInfo.email = 'invalid-email';

      const response = await request(app)
        .post('/api/contact')
        .send(validContactMessageData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('valid email');
    });

    test('should enforce rate limiting', async () => {
      // Make 5 requests (at the limit)
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/contact')
          .send({
            ...validContactMessageData,
            customerInfo: {
              ...validContactMessageData.customerInfo,
              email: `test${i}@example.com`
            }
          })
          .expect(201);
      }

      // 6th request should be rate limited
      const response = await request(app)
        .post('/api/contact')
        .send({
          ...validContactMessageData,
          customerInfo: {
            ...validContactMessageData.customerInfo,
            email: 'test6@example.com'
          }
        })
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    test('should capture source details', async () => {
      const response = await request(app)
        .post('/api/contact')
        .set('User-Agent', 'Mozilla/5.0 Test Browser')
        .set('Referer', 'https://example.com/contact')
        .send({
          ...validContactMessageData,
          page: '/contact-us'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      
      // Verify source details were captured (check in database)
      const savedMessage = await ContactMessage.findOne({
        messageNumber: response.body.data.messageNumber
      });
      
      expect(savedMessage.sourceDetails.userAgent).toBe('Mozilla/5.0 Test Browser');
      expect(savedMessage.sourceDetails.referrer).toBe('https://example.com/contact');
      expect(savedMessage.sourceDetails.page).toBe('/contact-us');
    });
  });

  describe('GET /api/contact/messages', () => {
    beforeEach(async () => {
      // Create test contact messages
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/contact')
          .send({
            ...validContactMessageData,
            customerInfo: {
              ...validContactMessageData.customerInfo,
              email: `customer${i}@example.com`
            },
            subject: `Subject ${i}`,
            category: i % 2 === 0 ? 'product_question' : 'general_inquiry',
            priority: i < 3 ? 'high' : 'normal'
          });
      }
    });

    test('should get contact messages with authentication', async () => {
      const response = await request(app)
        .get('/api/contact/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(10);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.totalCount).toBe(10);
    });

    test('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/contact/messages')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should filter by status', async () => {
      const response = await request(app)
        .get('/api/contact/messages?status=new')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(10);
      response.body.data.forEach(message => {
        expect(message.status).toBe('new');
      });
    });

    test('should filter by multiple statuses', async () => {
      // Update some message statuses first
      const messages = await ContactMessage.find({}).limit(2);
      await ContactMessage.findByIdAndUpdate(messages[0]._id, { status: 'read' });
      await ContactMessage.findByIdAndUpdate(messages[1]._id, { status: 'in_progress' });

      const response = await request(app)
        .get('/api/contact/messages?status=read&status=in_progress')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      response.body.data.forEach(message => {
        expect(['read', 'in_progress']).toContain(message.status);
      });
    });

    test('should filter by category', async () => {
      const response = await request(app)
        .get('/api/contact/messages?category=product_question')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach(message => {
        expect(message.category).toBe('product_question');
      });
    });

    test('should filter by priority', async () => {
      const response = await request(app)
        .get('/api/contact/messages?priority=high')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      response.body.data.forEach(message => {
        expect(message.priority).toBe('high');
      });
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get('/api/contact/messages?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(5);
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.totalPages).toBe(2);
    });

    test('should search contact messages', async () => {
      const response = await request(app)
        .get('/api/contact/messages?search=Subject 1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].subject).toBe('Subject 1');
    });

    test('should exclude spam messages by default', async () => {
      // Mark one message as spam
      const message = await ContactMessage.findOne({});
      await ContactMessage.findByIdAndUpdate(message._id, { 
        isSpam: true, 
        status: 'closed' 
      });

      const response = await request(app)
        .get('/api/contact/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination.totalCount).toBe(9); // 10 - 1 spam
    });

    test('should include spam messages when requested', async () => {
      // Mark one message as spam
      const message = await ContactMessage.findOne({});
      await ContactMessage.findByIdAndUpdate(message._id, { 
        isSpam: true, 
        status: 'closed' 
      });

      const response = await request(app)
        .get('/api/contact/messages?includeSpam=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination.totalCount).toBe(10); // All messages including spam
    });
  });

  describe('GET /api/contact/messages/:id', () => {
    let contactMessage;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/contact')
        .send(validContactMessageData);
      
      const savedMessage = await ContactMessage.findOne({
        messageNumber: response.body.data.messageNumber
      });
      contactMessage = savedMessage;
    });

    test('should get contact message by ID', async () => {
      const response = await request(app)
        .get(`/api/contact/messages/${contactMessage._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(contactMessage._id.toString());
      expect(response.body.data.customerInfo.email).toBe('john.doe@example.com');
    });

    test('should return 404 for non-existent message', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/contact/messages/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MESSAGE_NOT_FOUND');
    });
  });

  describe('PUT /api/contact/messages/:id/status', () => {
    let contactMessage;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/contact')
        .send(validContactMessageData);
      
      const savedMessage = await ContactMessage.findOne({
        messageNumber: response.body.data.messageNumber
      });
      contactMessage = savedMessage;
    });

    test('should update contact message status', async () => {
      const response = await request(app)
        .put(`/api/contact/messages/${contactMessage._id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'read',
          reason: 'Message reviewed'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('read');
      expect(response.body.message).toBe('Contact message status updated successfully');
    });

    test('should reject invalid status transition', async () => {
      // First set to resolved
      await ContactMessage.findByIdAndUpdate(contactMessage._id, { status: 'resolved' });

      const response = await request(app)
        .put(`/api/contact/messages/${contactMessage._id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'new'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid status transition');
    });

    test('should require status field', async () => {
      const response = await request(app)
        .put(`/api/contact/messages/${contactMessage._id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Status is required');
    });
  });

  describe('PUT /api/contact/messages/:id/assign', () => {
    let contactMessage;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/contact')
        .send(validContactMessageData);
      
      const savedMessage = await ContactMessage.findOne({
        messageNumber: response.body.data.messageNumber
      });
      contactMessage = savedMessage;
    });

    test('should assign message to user', async () => {
      const response = await request(app)
        .put(`/api/contact/messages/${contactMessage._id}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assigneeId: testUser._id
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.assignedTo).toBe(testUser._id.toString());
      expect(response.body.message).toBe('Contact message assigned successfully');
    });

    test('should require assigneeId field', async () => {
      const response = await request(app)
        .put(`/api/contact/messages/${contactMessage._id}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Assignee ID is required');
    });
  });

  describe('POST /api/contact/messages/:id/notes', () => {
    let contactMessage;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/contact')
        .send(validContactMessageData);
      
      const savedMessage = await ContactMessage.findOne({
        messageNumber: response.body.data.messageNumber
      });
      contactMessage = savedMessage;
    });

    test('should add internal admin note', async () => {
      const response = await request(app)
        .post(`/api/contact/messages/${contactMessage._id}/notes`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          note: 'Customer called for follow-up',
          isInternal: true
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.adminNotes).toHaveLength(1);
      expect(response.body.data.adminNotes[0].note).toBe('Customer called for follow-up');
      expect(response.body.data.adminNotes[0].isInternal).toBe(true);
      expect(response.body.message).toBe('Admin note added successfully');
    });

    test('should add public admin note', async () => {
      const response = await request(app)
        .post(`/api/contact/messages/${contactMessage._id}/notes`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          note: 'Response sent to customer',
          isInternal: false
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.adminNotes[0].isInternal).toBe(false);
    });

    test('should require note field', async () => {
      const response = await request(app)
        .post(`/api/contact/messages/${contactMessage._id}/notes`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Note is required');
    });
  });

  describe('POST /api/contact/messages/:id/responses', () => {
    let contactMessage;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/contact')
        .send(validContactMessageData);
      
      const savedMessage = await ContactMessage.findOne({
        messageNumber: response.body.data.messageNumber
      });
      contactMessage = savedMessage;
    });

    test('should add response to message', async () => {
      const response = await request(app)
        .post(`/api/contact/messages/${contactMessage._id}/responses`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Thank you for your inquiry',
          method: 'email'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.responses).toHaveLength(1);
      expect(response.body.data.responses[0].message).toBe('Thank you for your inquiry');
      expect(response.body.data.responses[0].method).toBe('email');
      expect(response.body.data.status).toBe('in_progress');
      expect(response.body.message).toBe('Response added successfully');
    });

    test('should require message field', async () => {
      const response = await request(app)
        .post(`/api/contact/messages/${contactMessage._id}/responses`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Response message is required');
    });
  });

  describe('PUT /api/contact/messages/:id/spam', () => {
    let contactMessage;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/contact')
        .send(validContactMessageData);
      
      const savedMessage = await ContactMessage.findOne({
        messageNumber: response.body.data.messageNumber
      });
      contactMessage = savedMessage;
    });

    test('should mark message as spam', async () => {
      const response = await request(app)
        .put(`/api/contact/messages/${contactMessage._id}/spam`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reasons: ['manual_flag', 'suspicious_content']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isSpam).toBe(true);
      expect(response.body.data.spamScore).toBe(100);
      expect(response.body.data.spamReasons).toContain('manual_flag');
      expect(response.body.data.status).toBe('closed');
      expect(response.body.message).toBe('Contact message marked as spam successfully');
    });
  });

  describe('GET /api/contact/statistics', () => {
    beforeEach(async () => {
      // Create test messages with different categories and statuses
      const categories = ['product_question', 'general_inquiry', 'order_support'];
      
      for (let i = 0; i < 15; i++) {
        const response = await request(app)
          .post('/api/contact')
          .send({
            ...validContactMessageData,
            customerInfo: {
              ...validContactMessageData.customerInfo,
              email: `customer${i}@example.com`
            },
            category: categories[i % categories.length]
          });

        const savedMessage = await ContactMessage.findOne({
          messageNumber: response.body.data.messageNumber
        });

        // Update some statuses and add responses
        if (i < 5) {
          await ContactMessage.findByIdAndUpdate(savedMessage._id, { status: 'resolved' });
        } else if (i < 10) {
          await ContactMessage.findByIdAndUpdate(savedMessage._id, { 
            status: 'in_progress',
            responses: [{
              message: 'Response sent',
              sentBy: testUser._id,
              sentAt: new Date(),
              method: 'email'
            }]
          });
        }
      }
    });

    test('should get contact message statistics', async () => {
      const response = await request(app)
        .get('/api/contact/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalMessages).toBe(15);
      expect(response.body.data.byStatus).toBeDefined();
      expect(response.body.data.filtered).toBeDefined();
      expect(response.body.data.filtered.byCategory).toBeDefined();
      expect(response.body.data.filtered.byPriority).toBeDefined();
    });

    test('should filter statistics by date range', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const response = await request(app)
        .get(`/api/contact/statistics?startDate=${yesterday}&endDate=${tomorrow}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalMessages).toBe(15);
    });
  });

  describe('GET /api/contact/follow-up', () => {
    test('should get messages requiring follow-up', async () => {
      // Create message and set follow-up requirement
      const contactResponse = await request(app)
        .post('/api/contact')
        .send(validContactMessageData);
      
      const savedMessage = await ContactMessage.findOne({
        messageNumber: contactResponse.body.data.messageNumber
      });

      await ContactMessage.findByIdAndUpdate(savedMessage._id, {
        followUpRequired: true,
        followUpDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
      });

      const response = await request(app)
        .get('/api/contact/follow-up')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]._id).toBe(savedMessage._id.toString());
    });

    test('should not return resolved messages for follow-up', async () => {
      // Create message and set follow-up requirement but mark as resolved
      const contactResponse = await request(app)
        .post('/api/contact')
        .send(validContactMessageData);
      
      const savedMessage = await ContactMessage.findOne({
        messageNumber: contactResponse.body.data.messageNumber
      });

      await ContactMessage.findByIdAndUpdate(savedMessage._id, {
        followUpRequired: true,
        followUpDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        status: 'resolved'
      });

      const response = await request(app)
        .get('/api/contact/follow-up')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });
});