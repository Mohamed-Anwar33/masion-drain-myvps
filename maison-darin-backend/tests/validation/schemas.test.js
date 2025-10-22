const {
  authSchemas,
  productSchemas,
  contentSchemas,
  mediaSchemas,
  orderSchemas,
  sampleSchemas,
  contactSchemas,
  objectId,
  email,
  multilingualText
} = require('../../validation/schemas');

describe('Validation Schemas', () => {
  describe('Common patterns', () => {
    describe('objectId', () => {
      it('should validate valid ObjectId', () => {
        const { error } = objectId.validate('507f1f77bcf86cd799439011');
        expect(error).toBeUndefined();
      });

      it('should reject invalid ObjectId', () => {
        const { error } = objectId.validate('invalid-id');
        expect(error).toBeDefined();
      });
    });

    describe('email', () => {
      it('should validate valid email', () => {
        const { error } = email.validate('test@example.com');
        expect(error).toBeUndefined();
      });

      it('should normalize email to lowercase', () => {
        const { value } = email.validate('TEST@EXAMPLE.COM');
        expect(value).toBe('test@example.com');
      });

      it('should reject invalid email', () => {
        const { error } = email.validate('invalid-email');
        expect(error).toBeDefined();
      });
    });

    describe('multilingualText', () => {
      it('should validate valid multilingual text', () => {
        const { error } = multilingualText.validate({
          en: 'English text',
          ar: 'Arabic text'
        });
        expect(error).toBeUndefined();
      });

      it('should require both languages', () => {
        const { error } = multilingualText.validate({
          en: 'English text'
        });
        expect(error).toBeDefined();
      });

      it('should reject empty strings', () => {
        const { error } = multilingualText.validate({
          en: '',
          ar: 'Arabic text'
        });
        expect(error).toBeDefined();
      });
    });
  });

  describe('authSchemas', () => {
    describe('login', () => {
      it('should validate valid login data', () => {
        const { error } = authSchemas.login.validate({
          email: 'test@example.com',
          password: 'password123'
        });
        expect(error).toBeUndefined();
      });

      it('should require email and password', () => {
        const { error } = authSchemas.login.validate({});
        expect(error).toBeDefined();
        expect(error.details.length).toBeGreaterThanOrEqual(1);
        
        // Check that both email and password are required
        const missingFields = error.details.map(detail => detail.path[0]);
        expect(missingFields).toContain('email');
        
        // Test password separately since Joi might stop at first error
        const { error: passwordError } = authSchemas.login.validate({ email: 'test@example.com' });
        expect(passwordError).toBeDefined();
        expect(passwordError.details[0].path[0]).toBe('password');
      });

      it('should reject short password', () => {
        const { error } = authSchemas.login.validate({
          email: 'test@example.com',
          password: '123'
        });
        expect(error).toBeDefined();
      });
    });

    describe('refreshToken', () => {
      it('should validate valid refresh token', () => {
        const { error } = authSchemas.refreshToken.validate({
          refreshToken: 'valid-token'
        });
        expect(error).toBeUndefined();
      });

      it('should require refresh token', () => {
        const { error } = authSchemas.refreshToken.validate({});
        expect(error).toBeDefined();
      });
    });
  });

  describe('productSchemas', () => {
    const validProduct = {
      name: {
        en: 'Test Product',
        ar: 'منتج تجريبي'
      },
      description: {
        en: 'Test description',
        ar: 'وصف تجريبي'
      },
      price: 99.99,
      size: '50ml',
      category: 'floral'
    };

    describe('create', () => {
      it('should validate valid product data', () => {
        const { error } = productSchemas.create.validate(validProduct);
        expect(error).toBeUndefined();
      });

      it('should require all mandatory fields', () => {
        const { error } = productSchemas.create.validate({});
        expect(error).toBeDefined();
        expect(error.details.length).toBeGreaterThan(0);
      });

      it('should reject invalid category', () => {
        const { error } = productSchemas.create.validate({
          ...validProduct,
          category: 'invalid-category'
        });
        expect(error).toBeDefined();
      });

      it('should reject negative price', () => {
        const { error } = productSchemas.create.validate({
          ...validProduct,
          price: -10
        });
        expect(error).toBeDefined();
      });

      it('should set default values', () => {
        const { value } = productSchemas.create.validate(validProduct);
        expect(value.featured).toBe(false);
        expect(value.inStock).toBe(true);
        expect(value.stock).toBe(0);
      });
    });

    describe('update', () => {
      it('should validate partial updates', () => {
        const { error } = productSchemas.update.validate({
          price: 89.99
        });
        expect(error).toBeUndefined();
      });

      it('should require at least one field', () => {
        const { error } = productSchemas.update.validate({});
        expect(error).toBeDefined();
      });
    });

    describe('query', () => {
      it('should validate query parameters', () => {
        const { error } = productSchemas.query.validate({
          page: 1,
          limit: 10,
          category: 'floral',
          featured: true
        });
        expect(error).toBeUndefined();
      });

      it('should set default values', () => {
        const { value } = productSchemas.query.validate({});
        expect(value.page).toBe(1);
        expect(value.limit).toBe(10);
        expect(value.sort).toBe('-createdAt');
      });

      it('should convert string numbers to integers', () => {
        const { value } = productSchemas.query.validate({
          page: '2',
          limit: '20'
        });
        expect(value.page).toBe(2);
        expect(value.limit).toBe(20);
      });
    });
  });

  describe('orderSchemas', () => {
    const validOrder = {
      items: [{
        product: '507f1f77bcf86cd799439011',
        quantity: 2,
        price: 99.99
      }],
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
      paymentMethod: 'paypal'
    };

    describe('create', () => {
      it('should validate valid order data', () => {
        const { error } = orderSchemas.create.validate(validOrder);
        expect(error).toBeUndefined();
      });

      it('should require items array', () => {
        const { error } = orderSchemas.create.validate({
          ...validOrder,
          items: []
        });
        expect(error).toBeDefined();
      });

      it('should limit quantity per item', () => {
        const { error } = orderSchemas.create.validate({
          ...validOrder,
          items: [{
            ...validOrder.items[0],
            quantity: 15 // exceeds max of 10
          }]
        });
        expect(error).toBeDefined();
      });

      it('should validate payment method', () => {
        const { error } = orderSchemas.create.validate({
          ...validOrder,
          paymentMethod: 'invalid-method'
        });
        expect(error).toBeDefined();
      });
    });

    describe('updateStatus', () => {
      it('should validate status updates', () => {
        const { error } = orderSchemas.updateStatus.validate({
          orderStatus: 'confirmed'
        });
        expect(error).toBeUndefined();
      });

      it('should require at least one field', () => {
        const { error } = orderSchemas.updateStatus.validate({});
        expect(error).toBeDefined();
      });
    });
  });

  describe('contactSchemas', () => {
    const validContact = {
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Test Subject',
      message: 'This is a test message with enough content to pass validation.'
    };

    describe('create', () => {
      it('should validate valid contact data', () => {
        const { error } = contactSchemas.create.validate(validContact);
        expect(error).toBeUndefined();
      });

      it('should set default category', () => {
        const { value } = contactSchemas.create.validate(validContact);
        expect(value.category).toBe('general');
      });

      it('should require minimum message length', () => {
        const { error } = contactSchemas.create.validate({
          ...validContact,
          message: 'short'
        });
        expect(error).toBeDefined();
      });

      it('should validate category options', () => {
        const { error } = contactSchemas.create.validate({
          ...validContact,
          category: 'invalid-category'
        });
        expect(error).toBeDefined();
      });
    });
  });

  describe('sampleSchemas', () => {
    const validSample = {
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
      requestedProducts: [{
        product: '507f1f77bcf86cd799439011',
        notes: 'Sample notes'
      }]
    };

    describe('create', () => {
      it('should validate valid sample request', () => {
        const { error } = sampleSchemas.create.validate(validSample);
        expect(error).toBeUndefined();
      });

      it('should limit number of products', () => {
        const { error } = sampleSchemas.create.validate({
          ...validSample,
          requestedProducts: Array(6).fill(validSample.requestedProducts[0])
        });
        expect(error).toBeDefined();
      });

      it('should require at least one product', () => {
        const { error } = sampleSchemas.create.validate({
          ...validSample,
          requestedProducts: []
        });
        expect(error).toBeDefined();
      });
    });

    describe('updateStatus', () => {
      it('should validate status updates', () => {
        const { error } = sampleSchemas.updateStatus.validate({
          status: 'approved',
          adminNotes: 'Approved for shipping'
        });
        expect(error).toBeUndefined();
      });

      it('should require status field', () => {
        const { error } = sampleSchemas.updateStatus.validate({
          adminNotes: 'Notes only'
        });
        expect(error).toBeDefined();
      });
    });
  });

  describe('mediaSchemas', () => {
    describe('upload', () => {
      it('should validate media upload data', () => {
        const { error } = mediaSchemas.upload.validate({
          alt: {
            en: 'English alt text',
            ar: 'Arabic alt text'
          },
          tags: ['tag1', 'tag2']
        });
        expect(error).toBeUndefined();
      });

      it('should allow empty alt text', () => {
        const { error } = mediaSchemas.upload.validate({
          alt: {
            en: '',
            ar: ''
          }
        });
        expect(error).toBeUndefined();
      });

      it('should limit number of tags', () => {
        const { error } = mediaSchemas.upload.validate({
          tags: Array(15).fill('tag')
        });
        expect(error).toBeDefined();
      });
    });

    describe('query', () => {
      it('should validate query parameters', () => {
        const { error } = mediaSchemas.query.validate({
          page: 1,
          limit: 20,
          tags: 'product,hero'
        });
        expect(error).toBeUndefined();
      });

      it('should set default pagination', () => {
        const { value } = mediaSchemas.query.validate({});
        expect(value.page).toBe(1);
        expect(value.limit).toBe(20);
      });
    });
  });

  describe('contentSchemas', () => {
    describe('update', () => {
      it('should validate content updates', () => {
        const { error } = contentSchemas.update.validate({
          content: {
            en: { title: 'English Title' },
            ar: { title: 'Arabic Title' }
          }
        });
        expect(error).toBeUndefined();
      });

      it('should require both language versions', () => {
        const { error } = contentSchemas.update.validate({
          content: {
            en: { title: 'English Title' }
          }
        });
        expect(error).toBeDefined();
      });
    });

    describe('params', () => {
      it('should validate valid section names', () => {
        const validSections = ['hero', 'about', 'nav', 'contact', 'collections', 'footer'];
        
        validSections.forEach(section => {
          const { error } = contentSchemas.params.validate({ section });
          expect(error).toBeUndefined();
        });
      });

      it('should reject invalid section names', () => {
        const { error } = contentSchemas.params.validate({ section: 'invalid-section' });
        expect(error).toBeDefined();
      });
    });
  });
});