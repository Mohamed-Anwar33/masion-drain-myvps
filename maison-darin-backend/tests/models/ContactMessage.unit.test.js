const mongoose = require('mongoose');
const ContactMessage = require('../../models/ContactMessage');
const User = require('../../models/User');

describe('ContactMessage Model Unit Tests', () => {
  let validMessageData;
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

  describe('Schema Validation', () => {
    test('should create contact message with valid data', async () => {
      const contactMessage = new ContactMessage(validMessageData);
      const savedMessage = await contactMessage.save();

      expect(savedMessage._id).toBeDefined();
      expect(savedMessage.messageNumber).toBeDefined();
      expect(savedMessage.status).toBe('new');
      expect(savedMessage.statusHistory).toHaveLength(1);
      expect(savedMessage.spamScore).toBe(0);
    });

    test('should require customer first name', async () => {
      delete validMessageData.customerInfo.firstName;
      const contactMessage = new ContactMessage(validMessageData);

      await expect(contactMessage.save()).rejects.toThrow('First name is required');
    });

    test('should require customer email', async () => {
      delete validMessageData.customerInfo.email;
      const contactMessage = new ContactMessage(validMessageData);

      await expect(contactMessage.save()).rejects.toThrow('Email is required');
    });

    test('should validate email format', async () => {
      validMessageData.customerInfo.email = 'invalid-email';
      const contactMessage = new ContactMessage(validMessageData);

      await expect(contactMessage.save()).rejects.toThrow('Please enter a valid email');
    });

    test('should validate phone number format', async () => {
      validMessageData.customerInfo.phone = 'invalid-phone';
      const contactMessage = new ContactMessage(validMessageData);

      await expect(contactMessage.save()).rejects.toThrow('Please enter a valid phone number');
    });

    test('should require subject', async () => {
      delete validMessageData.subject;
      const contactMessage = new ContactMessage(validMessageData);

      await expect(contactMessage.save()).rejects.toThrow('Subject is required');
    });

    test('should require message', async () => {
      delete validMessageData.message;
      const contactMessage = new ContactMessage(validMessageData);

      await expect(contactMessage.save()).rejects.toThrow('Message is required');
    });

    test('should validate category enum', async () => {
      validMessageData.category = 'invalid-category';
      const contactMessage = new ContactMessage(validMessageData);

      await expect(contactMessage.save()).rejects.toThrow();
    });

    test('should validate status enum', async () => {
      const contactMessage = new ContactMessage(validMessageData);
      contactMessage.status = 'invalid-status';

      await expect(contactMessage.save()).rejects.toThrow();
    });

    test('should validate priority enum', async () => {
      validMessageData.priority = 'invalid-priority';
      const contactMessage = new ContactMessage(validMessageData);

      await expect(contactMessage.save()).rejects.toThrow();
    });

    test('should validate message length limits', async () => {
      validMessageData.message = 'a'.repeat(2001);
      const contactMessage = new ContactMessage(validMessageData);

      await expect(contactMessage.save()).rejects.toThrow('Message cannot exceed 2000 characters');
    });

    test('should validate subject length limits', async () => {
      validMessageData.subject = 'a'.repeat(201);
      const contactMessage = new ContactMessage(validMessageData);

      await expect(contactMessage.save()).rejects.toThrow('Subject cannot exceed 200 characters');
    });
  });

  describe('Message Number Generation', () => {
    test('should generate unique message numbers', async () => {
      const message1 = new ContactMessage(validMessageData);
      await message1.save();

      const message2Data = { ...validMessageData };
      message2Data.customerInfo.email = 'different@example.com';
      const message2 = new ContactMessage(message2Data);
      await message2.save();

      expect(message1.messageNumber).toBeDefined();
      expect(message2.messageNumber).toBeDefined();
      expect(message1.messageNumber).not.toBe(message2.messageNumber);
      expect(message1.messageNumber).toMatch(/^CM\d{10}$/);
    });
  });

  describe('Spam Detection', () => {
    test('should detect duplicate content as spam', async () => {
      const message1 = new ContactMessage(validMessageData);
      await message1.save();

      const message2 = new ContactMessage(validMessageData);
      await message2.save();

      expect(message2.spamScore).toBeGreaterThan(0);
      expect(message2.spamReasons).toContain('duplicate_content');
    });

    test('should detect suspicious email domains', async () => {
      validMessageData.customerInfo.email = 'test@tempmail.org';
      const contactMessage = new ContactMessage(validMessageData);
      await contactMessage.save();

      expect(contactMessage.spamScore).toBeGreaterThan(0);
      expect(contactMessage.spamReasons).toContain('suspicious_email');
    });

    test('should detect excessive links', async () => {
      validMessageData.message = 'Check out https://link1.com and https://link2.com and https://link3.com and https://link4.com';
      const contactMessage = new ContactMessage(validMessageData);
      await contactMessage.save();

      expect(contactMessage.spamScore).toBeGreaterThan(0);
      expect(contactMessage.spamReasons).toContain('excessive_links');
    });

    test('should detect suspicious keywords', async () => {
      validMessageData.message = 'Congratulations! You have won the lottery! Act now for free money!';
      const contactMessage = new ContactMessage(validMessageData);
      await contactMessage.save();

      expect(contactMessage.spamScore).toBeGreaterThan(0);
      expect(contactMessage.spamReasons).toContain('suspicious_keywords');
    });

    test('should mark as spam when score exceeds threshold', async () => {
      validMessageData.customerInfo.email = 'test@tempmail.org';
      validMessageData.message = 'Congratulations! You have won the lottery! Check https://link1.com and https://link2.com and https://link3.com and https://link4.com';
      
      const contactMessage = new ContactMessage(validMessageData);
      await contactMessage.save();

      expect(contactMessage.isSpam).toBe(true);
      expect(contactMessage.status).toBe('closed');
    });
  });

  describe('Status Management', () => {
    test('should update status with history', async () => {
      const contactMessage = new ContactMessage(validMessageData);
      await contactMessage.save();

      await contactMessage.updateStatus('read', testUser._id, 'Message reviewed');

      expect(contactMessage.status).toBe('read');
      expect(contactMessage.statusHistory).toHaveLength(2);
      expect(contactMessage.statusHistory[1].status).toBe('read');
      expect(contactMessage.statusHistory[1].changedBy.toString()).toBe(testUser._id.toString());
      expect(contactMessage.statusHistory[1].reason).toBe('Message reviewed');
    });

    test('should set resolution timestamp when resolved', async () => {
      const contactMessage = new ContactMessage(validMessageData);
      await contactMessage.save();

      await contactMessage.updateStatus('resolved', testUser._id, 'Issue resolved');

      expect(contactMessage.resolution.resolvedAt).toBeDefined();
      expect(contactMessage.resolution.resolvedBy.toString()).toBe(testUser._id.toString());
    });
  });

  describe('Admin Notes', () => {
    test('should add admin notes', async () => {
      const contactMessage = new ContactMessage(validMessageData);
      await contactMessage.save();

      await contactMessage.addAdminNote('Customer called for follow-up', testUser._id);

      expect(contactMessage.adminNotes).toHaveLength(1);
      expect(contactMessage.adminNotes[0].note).toBe('Customer called for follow-up');
      expect(contactMessage.adminNotes[0].addedBy.toString()).toBe(testUser._id.toString());
      expect(contactMessage.adminNotes[0].isInternal).toBe(true);
    });

    test('should add public admin notes', async () => {
      const contactMessage = new ContactMessage(validMessageData);
      await contactMessage.save();

      await contactMessage.addAdminNote('Response sent to customer', testUser._id, false);

      expect(contactMessage.adminNotes[0].isInternal).toBe(false);
    });
  });

  describe('Responses', () => {
    test('should add responses and update status', async () => {
      const contactMessage = new ContactMessage(validMessageData);
      await contactMessage.save();

      await contactMessage.addResponse('Thank you for your inquiry', testUser._id, 'email');

      expect(contactMessage.responses).toHaveLength(1);
      expect(contactMessage.responses[0].message).toBe('Thank you for your inquiry');
      expect(contactMessage.responses[0].sentBy.toString()).toBe(testUser._id.toString());
      expect(contactMessage.responses[0].method).toBe('email');
      expect(contactMessage.status).toBe('in_progress');
    });
  });

  describe('Assignment', () => {
    test('should assign message to user', async () => {
      const contactMessage = new ContactMessage(validMessageData);
      await contactMessage.save();

      await contactMessage.assignTo(testUser._id, testUser._id);

      expect(contactMessage.assignedTo.toString()).toBe(testUser._id.toString());
      expect(contactMessage.adminNotes).toHaveLength(1);
      expect(contactMessage.adminNotes[0].note).toContain('assigned to user');
    });
  });

  describe('Spam Management', () => {
    test('should mark message as spam manually', async () => {
      const contactMessage = new ContactMessage(validMessageData);
      await contactMessage.save();

      await contactMessage.markAsSpam(testUser._id, ['manual_flag']);

      expect(contactMessage.isSpam).toBe(true);
      expect(contactMessage.spamScore).toBe(100);
      expect(contactMessage.spamReasons).toContain('manual_flag');
      expect(contactMessage.status).toBe('closed');
    });
  });

  describe('Related Messages', () => {
    test('should find related messages by email', async () => {
      // Create first message
      const message1 = new ContactMessage(validMessageData);
      await message1.save();

      // Create second message from same customer
      const message2Data = { ...validMessageData };
      message2Data.subject = 'Follow-up question';
      const message2 = new ContactMessage(message2Data);
      await message2.save();

      await message2.findRelatedMessages();

      expect(message2.relatedMessages).toHaveLength(1);
      expect(message2.relatedMessages[0].toString()).toBe(message1._id.toString());
      expect(message2.customerInteractionCount).toBe(2);
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      // Create test messages
      const messages = [];
      for (let i = 0; i < 5; i++) {
        const messageData = {
          ...validMessageData,
          customerInfo: {
            ...validMessageData.customerInfo,
            email: `customer${i}@example.com`
          },
          subject: `Subject ${i}`
        };
        messages.push(await ContactMessage.create(messageData));
      }

      // Update some statuses
      await messages[0].updateStatus('read', testUser._id);
      await messages[1].updateStatus('in_progress', testUser._id);
    });

    test('should find messages by email', async () => {
      const results = await ContactMessage.findByEmail('customer0@example.com');
      expect(results).toHaveLength(1);
      expect(results[0].customerInfo.email).toBe('customer0@example.com');
    });

    test('should find messages by status', async () => {
      const newMessages = await ContactMessage.findByStatus('new');
      const readMessages = await ContactMessage.findByStatus('read');

      expect(newMessages).toHaveLength(3);
      expect(readMessages).toHaveLength(1);
    });

    test('should get statistics', async () => {
      const stats = await ContactMessage.getStatistics();

      expect(stats.totalMessages).toBe(5);
      expect(stats.byStatus.new).toBeDefined();
      expect(stats.byStatus.read).toBeDefined();
      expect(stats.byStatus.in_progress).toBeDefined();
      expect(stats.byStatus.new.count).toBe(3);
      expect(stats.byStatus.read.count).toBe(1);
      expect(stats.byStatus.in_progress.count).toBe(1);
    });

    test('should get follow-up messages', async () => {
      // Create message requiring follow-up
      const messageData = { ...validMessageData };
      messageData.followUpRequired = true;
      messageData.followUpDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      
      const message = await ContactMessage.create(messageData);

      const followUpMessages = await ContactMessage.getFollowUpMessages();
      expect(followUpMessages).toHaveLength(1);
      expect(followUpMessages[0]._id.toString()).toBe(message._id.toString());
    });
  });

  describe('Virtual Properties', () => {
    test('should calculate response time', async () => {
      const contactMessage = new ContactMessage(validMessageData);
      await contactMessage.save();

      // Simulate some time passing
      await new Promise(resolve => setTimeout(resolve, 10));
      await contactMessage.addResponse('Test response', testUser._id);

      expect(contactMessage.responseTime).toBeGreaterThan(0);
    });

    test('should return null response time for messages without responses', async () => {
      const contactMessage = new ContactMessage(validMessageData);
      await contactMessage.save();

      expect(contactMessage.responseTime).toBeNull();
    });

    test('should generate full customer name', async () => {
      const contactMessage = new ContactMessage(validMessageData);
      await contactMessage.save();

      expect(contactMessage.customerFullName).toBe('John Doe');
    });

    test('should calculate days since creation', async () => {
      const contactMessage = new ContactMessage(validMessageData);
      await contactMessage.save();

      expect(contactMessage.daysSinceCreation).toBe(1);
    });
  });

  describe('Indexes', () => {
    test('should have proper indexes', async () => {
      const indexes = await ContactMessage.collection.getIndexes();
      
      expect(indexes).toHaveProperty('customerInfo.email_1_createdAt_-1');
      expect(indexes).toHaveProperty('status_1_createdAt_-1');
      expect(indexes).toHaveProperty('category_1_createdAt_-1');
      expect(indexes).toHaveProperty('messageNumber_1');
      expect(indexes).toHaveProperty('assignedTo_1_status_1');
    });
  });
});