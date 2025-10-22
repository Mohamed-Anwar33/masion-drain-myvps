const mongoose = require('mongoose');
const contactMessageService = require('../../services/contactMessageService');
const ContactMessage = require('../../models/ContactMessage');
const User = require('../../models/User');

describe('ContactMessageService Unit Tests', () => {
  let testUser;
  let validMessageData;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await ContactMessage.deleteMany({});
    await User.deleteMany({});

    // Create test user
    testUser = await User.create({
      email: 'admin@test.com',
      password: 'hashedpassword',
      role: 'admin'
    });

    validMessageData = {
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

  describe('createContactMessage', () => {
    test('should create contact message with valid data', async () => {
      const sourceDetails = {
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
        referrer: 'https://google.com',
        page: '/contact'
      };

      const result = await contactMessageService.createContactMessage(validMessageData, sourceDetails);

      expect(result._id).toBeDefined();
      expect(result.messageNumber).toBeDefined();
      expect(result.status).toBe('new');
      expect(result.customerInfo.email).toBe('john.doe@example.com');
      expect(result.sourceDetails.userAgent).toBe('Mozilla/5.0');
      expect(result.sourceDetails.ipAddress).toBe('192.168.1.1');
    });

    test('should enforce hourly rate limit', async () => {
      // Create 5 messages (at the limit)
      for (let i = 0; i < 5; i++) {
        await contactMessageService.createContactMessage(validMessageData);
      }

      // 6th message should be rejected
      await expect(contactMessageService.createContactMessage(validMessageData))
        .rejects.toThrow('Rate limit exceeded. Maximum 5 messages per hour allowed.');
    });

    test('should enforce daily rate limit', async () => {
      // Mock the hourly check to pass but create 10 messages
      const originalCountDocuments = ContactMessage.countDocuments;
      let callCount = 0;
      
      ContactMessage.countDocuments = jest.fn().mockImplementation((query) => {
        callCount++;
        if (callCount % 2 === 1) { // Odd calls (hourly check)
          return Promise.resolve(0);
        } else { // Even calls (daily check)
          return Promise.resolve(callCount === 2 ? 0 : 10); // First daily check passes, second fails
        }
      });

      // First message should succeed
      await contactMessageService.createContactMessage(validMessageData);

      // Second message should fail daily limit
      await expect(contactMessageService.createContactMessage(validMessageData))
        .rejects.toThrow('Daily limit exceeded. Maximum 10 messages per day allowed.');

      // Restore original method
      ContactMessage.countDocuments = originalCountDocuments;
    });

    test('should link related messages', async () => {
      // Create first message
      const firstMessage = await contactMessageService.createContactMessage(validMessageData);

      // Create second message from same customer
      const secondMessageData = { ...validMessageData };
      secondMessageData.subject = 'Follow-up question';
      const secondMessage = await contactMessageService.createContactMessage(secondMessageData);

      expect(secondMessage.relatedMessages).toHaveLength(1);
      expect(secondMessage.relatedMessages[0].toString()).toBe(firstMessage._id.toString());
      expect(secondMessage.customerInteractionCount).toBe(2);
    });
  });

  describe('getContactMessages', () => {
    beforeEach(async () => {
      // Create test messages
      const messages = [];
      for (let i = 0; i < 10; i++) {
        const messageData = {
          ...validMessageData,
          customerInfo: {
            ...validMessageData.customerInfo,
            email: `customer${i}@example.com`
          },
          subject: `Subject ${i}`,
          category: i % 2 === 0 ? 'product_question' : 'general_inquiry',
          priority: i < 3 ? 'high' : 'normal'
        };
        messages.push(await contactMessageService.createContactMessage(messageData));
      }

      // Update some statuses
      await contactMessageService.updateContactMessageStatus(
        messages[0]._id, 'read', testUser._id, 'Message reviewed'
      );
      await contactMessageService.updateContactMessageStatus(
        messages[1]._id, 'in_progress', testUser._id, 'Working on response'
      );
    });

    test('should get all contact messages with pagination', async () => {
      const result = await contactMessageService.getContactMessages({}, { page: 1, limit: 5 });

      expect(result.messages).toHaveLength(5);
      expect(result.pagination.totalCount).toBe(10);
      expect(result.pagination.totalPages).toBe(2);
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.hasNextPage).toBe(true);
    });

    test('should filter messages by status', async () => {
      const result = await contactMessageService.getContactMessages({ status: 'new' });

      expect(result.messages.length).toBeGreaterThan(0);
      result.messages.forEach(message => {
        expect(message.status).toBe('new');
      });
    });

    test('should filter messages by multiple statuses', async () => {
      const result = await contactMessageService.getContactMessages({ 
        status: ['read', 'in_progress'] 
      });

      expect(result.messages).toHaveLength(2);
      result.messages.forEach(message => {
        expect(['read', 'in_progress']).toContain(message.status);
      });
    });

    test('should filter messages by category', async () => {
      const result = await contactMessageService.getContactMessages({ 
        category: 'product_question' 
      });

      expect(result.messages.length).toBeGreaterThan(0);
      result.messages.forEach(message => {
        expect(message.category).toBe('product_question');
      });
    });

    test('should filter messages by priority', async () => {
      const result = await contactMessageService.getContactMessages({ 
        priority: 'high' 
      });

      expect(result.messages).toHaveLength(3);
      result.messages.forEach(message => {
        expect(message.priority).toBe('high');
      });
    });

    test('should filter messages by customer email', async () => {
      const result = await contactMessageService.getContactMessages({ 
        customerEmail: 'customer0@example.com' 
      });

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].customerInfo.email).toBe('customer0@example.com');
    });

    test('should search messages by text', async () => {
      const result = await contactMessageService.getContactMessages({ 
        search: 'Subject 1' 
      });

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].subject).toBe('Subject 1');
    });

    test('should exclude spam messages by default', async () => {
      // Mark one message as spam
      const messages = await ContactMessage.find({}).limit(1);
      await contactMessageService.markAsSpam(messages[0]._id, testUser._id, ['manual_flag']);

      const result = await contactMessageService.getContactMessages({});
      expect(result.pagination.totalCount).toBe(9); // 10 - 1 spam
    });

    test('should include spam messages when requested', async () => {
      // Mark one message as spam
      const messages = await ContactMessage.find({}).limit(1);
      await contactMessageService.markAsSpam(messages[0]._id, testUser._id, ['manual_flag']);

      const result = await contactMessageService.getContactMessages({ includeSpam: true });
      expect(result.pagination.totalCount).toBe(10); // All messages including spam
    });

    test('should sort messages by different fields', async () => {
      const result = await contactMessageService.getContactMessages({}, {
        sortBy: 'customerInfo.email',
        sortOrder: 'asc'
      });

      expect(result.messages[0].customerInfo.email).toBe('customer0@example.com');
    });
  });

  describe('getContactMessageById', () => {
    test('should get contact message by ID', async () => {
      const created = await contactMessageService.createContactMessage(validMessageData);
      const result = await contactMessageService.getContactMessageById(created._id);

      expect(result._id.toString()).toBe(created._id.toString());
      expect(result.customerInfo.email).toBe('john.doe@example.com');
    });

    test('should throw error for non-existent message', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await expect(contactMessageService.getContactMessageById(fakeId))
        .rejects.toThrow('Contact message not found');
    });
  });

  describe('updateContactMessageStatus', () => {
    let contactMessage;

    beforeEach(async () => {
      contactMessage = await contactMessageService.createContactMessage(validMessageData);
    });

    test('should update status with valid transition', async () => {
      const result = await contactMessageService.updateContactMessageStatus(
        contactMessage._id, 'read', testUser._id, 'Message reviewed'
      );

      expect(result.status).toBe('read');
      expect(result.statusHistory).toHaveLength(2);
      expect(result.statusHistory[1].reason).toBe('Message reviewed');
    });

    test('should reject invalid status transition', async () => {
      // First set to resolved
      await contactMessageService.updateContactMessageStatus(
        contactMessage._id, 'resolved', testUser._id, 'Resolved'
      );

      // Try to transition from resolved to new (invalid)
      await expect(contactMessageService.updateContactMessageStatus(
        contactMessage._id, 'new', testUser._id, 'Invalid transition'
      )).rejects.toThrow('Invalid status transition from resolved to new');
    });
  });

  describe('assignContactMessage', () => {
    test('should assign message to user', async () => {
      const contactMessage = await contactMessageService.createContactMessage(validMessageData);
      
      const result = await contactMessageService.assignContactMessage(
        contactMessage._id, testUser._id, testUser._id
      );

      expect(result.assignedTo.toString()).toBe(testUser._id.toString());
      expect(result.adminNotes).toHaveLength(1);
      expect(result.adminNotes[0].note).toContain('assigned to user');
    });
  });

  describe('addAdminNote', () => {
    test('should add internal admin note', async () => {
      const contactMessage = await contactMessageService.createContactMessage(validMessageData);
      
      const result = await contactMessageService.addAdminNote(
        contactMessage._id, 'Customer called for follow-up', testUser._id, true
      );

      expect(result.adminNotes).toHaveLength(1);
      expect(result.adminNotes[0].note).toBe('Customer called for follow-up');
      expect(result.adminNotes[0].isInternal).toBe(true);
    });

    test('should add public admin note', async () => {
      const contactMessage = await contactMessageService.createContactMessage(validMessageData);
      
      const result = await contactMessageService.addAdminNote(
        contactMessage._id, 'Response sent to customer', testUser._id, false
      );

      expect(result.adminNotes[0].isInternal).toBe(false);
    });
  });

  describe('addResponse', () => {
    test('should add response and update status', async () => {
      const contactMessage = await contactMessageService.createContactMessage(validMessageData);
      
      const result = await contactMessageService.addResponse(
        contactMessage._id, 'Thank you for your inquiry', testUser._id, 'email'
      );

      expect(result.responses).toHaveLength(1);
      expect(result.responses[0].message).toBe('Thank you for your inquiry');
      expect(result.responses[0].method).toBe('email');
      expect(result.status).toBe('in_progress');
    });
  });

  describe('markAsSpam', () => {
    test('should mark message as spam', async () => {
      const contactMessage = await contactMessageService.createContactMessage(validMessageData);
      
      const result = await contactMessageService.markAsSpam(
        contactMessage._id, testUser._id, ['manual_flag', 'suspicious_content']
      );

      expect(result.isSpam).toBe(true);
      expect(result.spamScore).toBe(100);
      expect(result.spamReasons).toContain('manual_flag');
      expect(result.spamReasons).toContain('suspicious_content');
      expect(result.status).toBe('closed');
    });
  });

  describe('getContactMessageStatistics', () => {
    beforeEach(async () => {
      // Create test messages with different categories and statuses
      const categories = ['product_question', 'general_inquiry', 'order_support'];
      const priorities = ['low', 'normal', 'high'];
      
      for (let i = 0; i < 15; i++) {
        const messageData = {
          ...validMessageData,
          customerInfo: {
            ...validMessageData.customerInfo,
            email: `customer${i}@example.com`
          },
          category: categories[i % categories.length],
          priority: priorities[i % priorities.length]
        };
        
        const message = await contactMessageService.createContactMessage(messageData);
        
        // Update some statuses and add responses
        if (i < 5) {
          await contactMessageService.updateContactMessageStatus(
            message._id, 'resolved', testUser._id, 'Resolved'
          );
        } else if (i < 10) {
          await contactMessageService.addResponse(
            message._id, 'Response sent', testUser._id, 'email'
          );
        }
      }
    });

    test('should get comprehensive statistics', async () => {
      const stats = await contactMessageService.getContactMessageStatistics();

      expect(stats.totalMessages).toBe(15);
      expect(stats.byStatus).toBeDefined();
      expect(stats.filtered.byCategory).toBeDefined();
      expect(stats.filtered.byPriority).toBeDefined();
      expect(stats.filtered.responseTime).toBeDefined();
      expect(stats.filtered.monthly).toBeDefined();
      expect(stats.filtered.assignments).toBeDefined();
    });

    test('should filter statistics by date range', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const stats = await contactMessageService.getContactMessageStatistics({
        dateRange: {
          start: yesterday,
          end: tomorrow
        }
      });

      expect(stats.totalMessages).toBe(15);
    });

    test('should filter statistics by assigned user', async () => {
      // Assign some messages to test user
      const messages = await ContactMessage.find({}).limit(3);
      for (const message of messages) {
        await contactMessageService.assignContactMessage(
          message._id, testUser._id, testUser._id
        );
      }

      const stats = await contactMessageService.getContactMessageStatistics({
        assignedTo: testUser._id
      });

      expect(stats.filtered.assignments.length).toBeGreaterThan(0);
    });
  });

  describe('getFollowUpMessages', () => {
    test('should get messages requiring follow-up', async () => {
      // Create message requiring follow-up
      const messageData = { ...validMessageData };
      const message = await contactMessageService.createContactMessage(messageData);
      
      // Manually set follow-up requirement
      await ContactMessage.findByIdAndUpdate(message._id, {
        followUpRequired: true,
        followUpDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
      });

      const followUpMessages = await contactMessageService.getFollowUpMessages();
      expect(followUpMessages).toHaveLength(1);
      expect(followUpMessages[0]._id.toString()).toBe(message._id.toString());
    });

    test('should not return resolved or closed messages for follow-up', async () => {
      // Create message requiring follow-up but resolved
      const messageData = { ...validMessageData };
      const message = await contactMessageService.createContactMessage(messageData);
      
      await ContactMessage.findByIdAndUpdate(message._id, {
        followUpRequired: true,
        followUpDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        status: 'resolved'
      });

      const followUpMessages = await contactMessageService.getFollowUpMessages();
      expect(followUpMessages).toHaveLength(0);
    });
  });
});