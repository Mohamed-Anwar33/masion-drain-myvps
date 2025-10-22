const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const ContactMessage = require('../../models/ContactMessage');
const User = require('../../models/User');
const { generateToken } = require('../../services/jwtService');

describe('Contact Message Integration Tests', () => {
  let authToken;
  let testUser;

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
  });

  test('Complete contact message workflow', async () => {
    // Step 1: Customer submits contact message
    const contactMessageData = {
      customerInfo: {
        firstName: 'Emma',
        lastName: 'Wilson',
        email: 'emma.wilson@example.com',
        phone: '+1234567890',
        company: 'Wilson Enterprises'
      },
      subject: 'Wholesale Inquiry',
      message: 'I am interested in purchasing your perfumes in bulk for my retail store. Could you please provide information about wholesale pricing and minimum order quantities?',
      category: 'wholesale_inquiry',
      priority: 'high',
      preferredLanguage: 'en'
    };

    const submitResponse = await request(app)
      .post('/api/contact')
      .set('User-Agent', 'Mozilla/5.0 Test Browser')
      .set('Referer', 'https://example.com/contact')
      .send({
        ...contactMessageData,
        page: '/contact-us'
      })
      .expect(201);

    expect(submitResponse.body.success).toBe(true);
    expect(submitResponse.body.data.messageNumber).toBeDefined();
    expect(submitResponse.body.data.status).toBe('new');

    // Get the message ID from database
    const savedMessage = await ContactMessage.findOne({
      messageNumber: submitResponse.body.data.messageNumber
    });
    const messageId = savedMessage._id;

    // Step 2: Admin views the contact message
    const getResponse = await request(app)
      .get(`/api/contact/messages/${messageId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(getResponse.body.success).toBe(true);
    expect(getResponse.body.data.customerInfo.email).toBe('emma.wilson@example.com');
    expect(getResponse.body.data.category).toBe('wholesale_inquiry');
    expect(getResponse.body.data.priority).toBe('high');
    expect(getResponse.body.data.sourceDetails.userAgent).toBe('Mozilla/5.0 Test Browser');

    // Step 3: Admin marks message as read
    const readResponse = await request(app)
      .put(`/api/contact/messages/${messageId}/status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: 'read',
        reason: 'Message reviewed by admin'
      })
      .expect(200);

    expect(readResponse.body.success).toBe(true);
    expect(readResponse.body.data.status).toBe('read');

    // Step 4: Admin assigns message to themselves
    const assignResponse = await request(app)
      .put(`/api/contact/messages/${messageId}/assign`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        assigneeId: testUser._id
      })
      .expect(200);

    expect(assignResponse.body.success).toBe(true);
    expect(assignResponse.body.data.assignedTo).toBe(testUser._id.toString());

    // Step 5: Admin adds internal note
    const noteResponse = await request(app)
      .post(`/api/contact/messages/${messageId}/notes`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        note: 'High-value wholesale inquiry. Need to prepare detailed pricing sheet.',
        isInternal: true
      })
      .expect(200);

    expect(noteResponse.body.success).toBe(true);
    expect(noteResponse.body.data.adminNotes).toHaveLength(2); // Assignment note + manual note

    // Step 6: Admin sends response
    const responseMessage = 'Thank you for your wholesale inquiry. I will prepare a detailed pricing sheet and send it to you within 24 hours. Our minimum order quantity is 50 units per fragrance.';
    
    const responseResponse = await request(app)
      .post(`/api/contact/messages/${messageId}/responses`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        message: responseMessage,
        method: 'email'
      })
      .expect(200);

    expect(responseResponse.body.success).toBe(true);
    expect(responseResponse.body.data.responses).toHaveLength(1);
    expect(responseResponse.body.data.responses[0].message).toBe(responseMessage);
    expect(responseResponse.body.data.status).toBe('in_progress');

    // Step 7: Admin adds follow-up note
    const followUpResponse = await request(app)
      .post(`/api/contact/messages/${messageId}/notes`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        note: 'Pricing sheet sent via email. Follow up in 3 days if no response.',
        isInternal: false
      })
      .expect(200);

    expect(followUpResponse.body.success).toBe(true);
    expect(followUpResponse.body.data.adminNotes).toHaveLength(3);

    // Step 8: Admin resolves the message
    const resolveResponse = await request(app)
      .put(`/api/contact/messages/${messageId}/status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: 'resolved',
        reason: 'Wholesale information provided, customer satisfied'
      })
      .expect(200);

    expect(resolveResponse.body.success).toBe(true);
    expect(resolveResponse.body.data.status).toBe('resolved');
    expect(resolveResponse.body.data.resolution.resolvedAt).toBeDefined();
    expect(resolveResponse.body.data.resolution.resolvedBy).toBe(testUser._id.toString());

    // Step 9: Verify final state
    const finalResponse = await request(app)
      .get(`/api/contact/messages/${messageId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    const finalMessage = finalResponse.body.data;
    expect(finalMessage.status).toBe('resolved');
    expect(finalMessage.statusHistory).toHaveLength(4); // new -> read -> in_progress -> resolved
    expect(finalMessage.adminNotes).toHaveLength(3);
    expect(finalMessage.responses).toHaveLength(1);
    expect(finalMessage.assignedTo).toBe(testUser._id.toString());

    // Step 10: Check statistics
    const statsResponse = await request(app)
      .get('/api/contact/statistics')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(statsResponse.body.success).toBe(true);
    expect(statsResponse.body.data.totalMessages).toBe(1);
    expect(statsResponse.body.data.byStatus.resolved).toBeDefined();
    expect(statsResponse.body.data.byStatus.resolved.count).toBe(1);
  });

  test('Spam detection and handling workflow', async () => {
    // Step 1: Customer submits suspicious message
    const spamMessageData = {
      customerInfo: {
        firstName: 'Spam',
        lastName: 'Bot',
        email: 'spam@tempmail.org', // Suspicious domain
        phone: '+1234567890'
      },
      subject: 'Congratulations! You have won!',
      message: 'Congratulations! You have won the lottery! Act now for free money! Visit https://spam1.com and https://spam2.com and https://spam3.com and https://spam4.com for more details!',
      category: 'general_inquiry',
      preferredLanguage: 'en'
    };

    const submitResponse = await request(app)
      .post('/api/contact')
      .send(spamMessageData)
      .expect(201);

    expect(submitResponse.body.success).toBe(true);

    // Get the message from database to check spam detection
    const savedMessage = await ContactMessage.findOne({
      messageNumber: submitResponse.body.data.messageNumber
    });

    expect(savedMessage.spamScore).toBeGreaterThan(70); // Should be marked as spam
    expect(savedMessage.isSpam).toBe(true);
    expect(savedMessage.status).toBe('closed');
    expect(savedMessage.spamReasons.length).toBeGreaterThan(0);

    // Step 2: Admin views spam messages
    const spamResponse = await request(app)
      .get('/api/contact/messages?includeSpam=true&status=closed')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(spamResponse.body.success).toBe(true);
    expect(spamResponse.body.data).toHaveLength(1);
    expect(spamResponse.body.data[0].isSpam).toBe(true);

    // Step 3: Verify spam is excluded from normal view
    const normalResponse = await request(app)
      .get('/api/contact/messages')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(normalResponse.body.success).toBe(true);
    expect(normalResponse.body.pagination.totalCount).toBe(0); // Spam excluded
  });

  test('Manual spam marking workflow', async () => {
    // Step 1: Customer submits normal-looking message
    const messageData = {
      customerInfo: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890'
      },
      subject: 'Product Question',
      message: 'I have a question about your products.',
      category: 'product_question',
      preferredLanguage: 'en'
    };

    const submitResponse = await request(app)
      .post('/api/contact')
      .send(messageData)
      .expect(201);

    const savedMessage = await ContactMessage.findOne({
      messageNumber: submitResponse.body.data.messageNumber
    });
    const messageId = savedMessage._id;

    // Verify it's not automatically marked as spam
    expect(savedMessage.isSpam).toBe(false);
    expect(savedMessage.status).toBe('new');

    // Step 2: Admin manually marks as spam
    const spamResponse = await request(app)
      .put(`/api/contact/messages/${messageId}/spam`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        reasons: ['manual_flag', 'suspicious_behavior']
      })
      .expect(200);

    expect(spamResponse.body.success).toBe(true);
    expect(spamResponse.body.data.isSpam).toBe(true);
    expect(spamResponse.body.data.spamScore).toBe(100);
    expect(spamResponse.body.data.spamReasons).toContain('manual_flag');
    expect(spamResponse.body.data.status).toBe('closed');

    // Step 3: Verify message is now excluded from normal view
    const normalResponse = await request(app)
      .get('/api/contact/messages')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(normalResponse.body.pagination.totalCount).toBe(0);
  });

  test('Admin contact message management workflow', async () => {
    // Create multiple contact messages
    const categories = ['product_question', 'general_inquiry', 'order_support', 'wholesale_inquiry'];
    const priorities = ['low', 'normal', 'high'];
    const messages = [];

    for (let i = 0; i < 12; i++) {
      const response = await request(app)
        .post('/api/contact')
        .send({
          customerInfo: {
            firstName: `Customer${i}`,
            lastName: 'Test',
            email: `customer${i}@example.com`,
            phone: '+1234567890'
          },
          subject: `Subject ${i}`,
          message: `Test message content ${i}`,
          category: categories[i % categories.length],
          priority: priorities[i % priorities.length],
          preferredLanguage: 'en'
        });

      const savedMessage = await ContactMessage.findOne({
        messageNumber: response.body.data.messageNumber
      });
      messages.push(savedMessage);
    }

    // Step 1: Admin views all messages with pagination
    const allMessagesResponse = await request(app)
      .get('/api/contact/messages?page=1&limit=5')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(allMessagesResponse.body.success).toBe(true);
    expect(allMessagesResponse.body.data).toHaveLength(5);
    expect(allMessagesResponse.body.pagination.totalCount).toBe(12);
    expect(allMessagesResponse.body.pagination.totalPages).toBe(3);

    // Step 2: Admin filters by category
    const productQuestionsResponse = await request(app)
      .get('/api/contact/messages?category=product_question')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(productQuestionsResponse.body.data.length).toBeGreaterThan(0);
    productQuestionsResponse.body.data.forEach(message => {
      expect(message.category).toBe('product_question');
    });

    // Step 3: Admin filters by priority
    const highPriorityResponse = await request(app)
      .get('/api/contact/messages?priority=high')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(highPriorityResponse.body.data.length).toBeGreaterThan(0);
    highPriorityResponse.body.data.forEach(message => {
      expect(message.priority).toBe('high');
    });

    // Step 4: Admin searches messages
    const searchResponse = await request(app)
      .get('/api/contact/messages?search=Subject 5')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(searchResponse.body.data).toHaveLength(1);
    expect(searchResponse.body.data[0].subject).toBe('Subject 5');

    // Step 5: Admin processes messages in bulk
    for (let i = 0; i < 5; i++) {
      await request(app)
        .put(`/api/contact/messages/${messages[i]._id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'read',
          reason: `Bulk processing ${i}`
        })
        .expect(200);
    }

    // Step 6: Admin filters by status
    const readMessagesResponse = await request(app)
      .get('/api/contact/messages?status=read')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(readMessagesResponse.body.data).toHaveLength(5);
    readMessagesResponse.body.data.forEach(message => {
      expect(message.status).toBe('read');
    });

    // Step 7: Admin checks statistics
    const statsResponse = await request(app)
      .get('/api/contact/statistics')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(statsResponse.body.success).toBe(true);
    expect(statsResponse.body.data.totalMessages).toBe(12);
    expect(statsResponse.body.data.byStatus.new.count).toBe(7);
    expect(statsResponse.body.data.byStatus.read.count).toBe(5);

    // Step 8: Admin assigns messages
    for (let i = 0; i < 3; i++) {
      await request(app)
        .put(`/api/contact/messages/${messages[i]._id}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assigneeId: testUser._id
        })
        .expect(200);
    }

    // Step 9: Admin filters by assigned user
    const assignedResponse = await request(app)
      .get(`/api/contact/messages?assignedTo=${testUser._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(assignedResponse.body.data).toHaveLength(3);
    assignedResponse.body.data.forEach(message => {
      expect(message.assignedTo).toBe(testUser._id.toString());
    });
  });

  test('Follow-up message workflow', async () => {
    // Step 1: Create a message that needs follow-up
    const messageData = {
      customerInfo: {
        firstName: 'Alice',
        lastName: 'Brown',
        email: 'alice.brown@example.com',
        phone: '+1234567890'
      },
      subject: 'Custom Perfume Request',
      message: 'I would like to discuss creating a custom perfume for my wedding.',
      category: 'general_inquiry',
      priority: 'high',
      preferredLanguage: 'en'
    };

    const submitResponse = await request(app)
      .post('/api/contact')
      .send(messageData)
      .expect(201);

    const savedMessage = await ContactMessage.findOne({
      messageNumber: submitResponse.body.data.messageNumber
    });
    const messageId = savedMessage._id;

    // Step 2: Admin responds and sets follow-up
    await request(app)
      .post(`/api/contact/messages/${messageId}/responses`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        message: 'Thank you for your interest in custom perfumes. I will prepare some options and get back to you.',
        method: 'email'
      })
      .expect(200);

    // Manually set follow-up requirement
    await ContactMessage.findByIdAndUpdate(messageId, {
      followUpRequired: true,
      followUpDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
    });

    // Step 3: Admin checks follow-up messages
    const followUpResponse = await request(app)
      .get('/api/contact/follow-up')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(followUpResponse.body.success).toBe(true);
    expect(followUpResponse.body.data).toHaveLength(1);
    expect(followUpResponse.body.data[0]._id).toBe(messageId.toString());

    // Step 4: Admin follows up
    await request(app)
      .post(`/api/contact/messages/${messageId}/responses`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        message: 'Following up on your custom perfume request. I have prepared several options for you to consider.',
        method: 'email'
      })
      .expect(200);

    // Step 5: Admin resolves the message
    await request(app)
      .put(`/api/contact/messages/${messageId}/status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: 'resolved',
        reason: 'Custom perfume options provided, customer satisfied'
      })
      .expect(200);

    // Step 6: Verify message no longer appears in follow-up
    const noFollowUpResponse = await request(app)
      .get('/api/contact/follow-up')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(noFollowUpResponse.body.data).toHaveLength(0);
  });
});