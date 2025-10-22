const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Test Data Factories
 * Provides consistent test data generation for all models
 */

class TestFactory {
  constructor() {
    this.counters = {};
  }

  // Get unique counter for each factory type
  getCounter(type) {
    if (!this.counters[type]) {
      this.counters[type] = 0;
    }
    return ++this.counters[type];
  }

  // Reset all counters
  reset() {
    this.counters = {};
  }

  // User Factory
  createUser(overrides = {}) {
    const counter = this.getCounter('user');
    return {
      email: `admin${counter}@maisondarin.com`,
      password: 'password123',
      role: 'admin',
      isActive: true,
      lastLogin: new Date(),
      ...overrides
    };
  }

  async createUserWithHashedPassword(overrides = {}) {
    const userData = this.createUser(overrides);
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 12);
    }
    return userData;
  }

  // Product Factory
  createProduct(overrides = {}) {
    const counter = this.getCounter('product');
    return {
      name: {
        en: `Test Perfume ${counter}`,
        ar: `عطر تجريبي ${counter}`
      },
      description: {
        en: `A luxurious test perfume ${counter} with exquisite notes`,
        ar: `عطر فاخر تجريبي ${counter} بنفحات رائعة`
      },
      longDescription: {
        en: `This is a detailed description of test perfume ${counter}. It features complex notes and sophisticated composition.`,
        ar: `هذا وصف مفصل للعطر التجريبي ${counter}. يتميز بنفحات معقدة وتركيبة متطورة.`
      },
      price: 150 + (counter * 10),
      size: '50ml',
      category: ['floral', 'oriental', 'fresh', 'woody'][counter % 4],
      images: [
        {
          url: `https://res.cloudinary.com/test/image/upload/test-perfume-${counter}.jpg`,
          cloudinaryId: `test-perfume-${counter}`,
          alt: {
            en: `Test Perfume ${counter} Image`,
            ar: `صورة العطر التجريبي ${counter}`
          },
          order: 0
        }
      ],
      featured: counter % 3 === 0,
      inStock: true,
      stock: 50 + counter,
      concentration: {
        en: 'Eau de Parfum',
        ar: 'أو دو بارفان'
      },
      notes: {
        top: {
          en: ['Bergamot', 'Lemon', 'Orange'],
          ar: ['البرغموت', 'الليمون', 'البرتقال']
        },
        middle: {
          en: ['Rose', 'Jasmine', 'Lavender'],
          ar: ['الورد', 'الياسمين', 'اللافندر']
        },
        base: {
          en: ['Sandalwood', 'Musk', 'Amber'],
          ar: ['خشب الصندل', 'المسك', 'العنبر']
        }
      },
      seo: {
        metaTitle: {
          en: `Test Perfume ${counter} - Luxury Fragrance`,
          ar: `العطر التجريبي ${counter} - عطر فاخر`
        },
        metaDescription: {
          en: `Discover the luxurious Test Perfume ${counter} with its unique blend of notes`,
          ar: `اكتشف العطر الفاخر التجريبي ${counter} بمزيجه الفريد من النفحات`
        }
      },
      ...overrides
    };
  }

  // Order Factory
  createOrder(overrides = {}) {
    const counter = this.getCounter('order');
    return {
      orderNumber: `ORD-${Date.now()}-${counter}`,
      items: [
        {
          product: new mongoose.Types.ObjectId(),
          quantity: 1,
          price: 150,
          name: {
            en: `Test Perfume ${counter}`,
            ar: `عطر تجريبي ${counter}`
          }
        }
      ],
      total: 150,
      customerInfo: {
        firstName: `John${counter}`,
        lastName: `Doe${counter}`,
        email: `customer${counter}@example.com`,
        phone: `+1234567890${counter}`,
        address: `123 Test Street ${counter}`,
        city: 'Test City',
        postalCode: `1234${counter}`,
        country: 'Test Country'
      },
      paymentMethod: 'card',
      paymentStatus: 'pending',
      orderStatus: 'pending',
      notes: `Test order ${counter}`,
      ...overrides
    };
  }

  // Sample Request Factory
  createSampleRequest(overrides = {}) {
    const counter = this.getCounter('sampleRequest');
    return {
      customerInfo: {
        firstName: `Jane${counter}`,
        lastName: `Smith${counter}`,
        email: `sample${counter}@example.com`,
        phone: `+9876543210${counter}`,
        address: {
          street: `456 Sample Avenue ${counter}`,
          city: 'Sample City',
          postalCode: `5678${counter}`,
          country: 'Sample Country'
        }
      },
      requestedProducts: [
        {
          product: new mongoose.Types.ObjectId(),
          productName: {
            en: `Sample Perfume ${counter}`,
            ar: `عينة عطر ${counter}`
          },
          quantity: 1,
          sampleSize: '2ml'
        }
      ],
      status: 'pending',
      priority: 'medium',
      message: `Sample request message ${counter}`,
      preferredLanguage: 'en',
      adminNotes: [],
      shippingInfo: {},
      ...overrides
    };
  }

  // Contact Message Factory
  createContactMessage(overrides = {}) {
    const counter = this.getCounter('contactMessage');
    return {
      customerInfo: {
        firstName: `Contact${counter}`,
        lastName: `User${counter}`,
        email: `contact${counter}@example.com`,
        phone: `+1122334455${counter}`,
        company: `Test Company ${counter}`
      },
      subject: `Test Subject ${counter}`,
      message: `This is a test contact message ${counter}. It contains some sample content for testing purposes.`,
      category: 'general',
      priority: 'medium',
      status: 'new',
      preferredLanguage: 'en',
      page: '/contact',
      isSpam: false,
      spamReasons: [],
      adminNotes: [],
      responses: [],
      ...overrides
    };
  }

  // Content Factory
  createContent(overrides = {}) {
    const counter = this.getCounter('content');
    return {
      section: 'hero',
      content: {
        en: {
          title: `Test Hero Title ${counter}`,
          subtitle: `Test Hero Subtitle ${counter}`,
          description: `Test hero description ${counter}`
        },
        ar: {
          title: `عنوان البطل التجريبي ${counter}`,
          subtitle: `عنوان فرعي للبطل التجريبي ${counter}`,
          description: `وصف البطل التجريبي ${counter}`
        }
      },
      version: 1,
      isActive: true,
      ...overrides
    };
  }

  // Media Factory
  createMedia(overrides = {}) {
    const counter = this.getCounter('media');
    return {
      filename: `test-image-${counter}.jpg`,
      originalName: `original-test-${counter}.jpg`,
      cloudinaryUrl: `https://res.cloudinary.com/test/image/upload/test-${counter}.jpg`,
      cloudinaryId: `test-${counter}`,
      size: 1024000 + (counter * 1000),
      mimetype: 'image/jpeg',
      width: 800,
      height: 600,
      tags: [`test${counter}`, 'sample'],
      alt: {
        en: `Test Image ${counter}`,
        ar: `صورة تجريبية ${counter}`
      },
      variants: {
        thumbnail: `https://res.cloudinary.com/test/image/upload/c_thumb,w_150,h_150/test-${counter}.jpg`,
        medium: `https://res.cloudinary.com/test/image/upload/c_scale,w_400/test-${counter}.jpg`,
        large: `https://res.cloudinary.com/test/image/upload/c_scale,w_800/test-${counter}.jpg`,
        extraLarge: `https://res.cloudinary.com/test/image/upload/c_scale,w_1200/test-${counter}.jpg`
      },
      usageCount: 0,
      uploadedBy: new mongoose.Types.ObjectId(),
      ...overrides
    };
  }

  // Create multiple instances
  createMultiple(factoryMethod, count, overrides = {}) {
    const items = [];
    for (let i = 0; i < count; i++) {
      items.push(factoryMethod.call(this, overrides));
    }
    return items;
  }

  // Create and save to database
  async createAndSave(Model, factoryMethod, overrides = {}) {
    const data = factoryMethod.call(this, overrides);
    const instance = new Model(data);
    return await instance.save();
  }

  // Create multiple and save to database
  async createMultipleAndSave(Model, factoryMethod, count, overrides = {}) {
    const items = [];
    for (let i = 0; i < count; i++) {
      const item = await this.createAndSave(Model, factoryMethod, overrides);
      items.push(item);
    }
    return items;
  }

  // Customer Factory
  createCustomer(overrides = {}) {
    const counter = this.getCounter('customer');
    return {
      name: `Customer ${counter}`,
      email: `customer${counter}@test.com`,
      phone: `+20123456789${counter}`,
      address: `Test Address ${counter}, Cairo, Egypt`,
      total_orders: 0,
      total_spent: 0,
      created_at: new Date(),
      ...overrides
    };
  }

  // Payment Factory
  createPayment(overrides = {}) {
    const counter = this.getCounter('payment');
    return {
      order_id: new mongoose.Types.ObjectId(),
      amount: 100.00 + (counter * 10),
      currency: 'EGP',
      status: 'completed',
      gateway: 'paymob',
      transaction_id: `test_txn_${counter}`,
      gateway_response: {
        success: true,
        transaction_id: `test_txn_${counter}`,
        reference: `ref_${counter}`
      },
      created_at: new Date(),
      ...overrides
    };
  }

  // Payment Method Factory
  createPaymentMethod(overrides = {}) {
    const counter = this.getCounter('paymentMethod');
    const methods = [
      { name: 'Credit Card', type: 'card', gateway: 'paymob' },
      { name: 'Vodafone Cash', type: 'wallet', gateway: 'vodafone_cash' },
      { name: 'Cash on Delivery', type: 'cash_on_delivery', gateway: 'cash_on_delivery' }
    ];
    
    const method = methods[counter % methods.length];
    
    return {
      name: method.name,
      type: method.type,
      gateway: method.gateway,
      is_active: true,
      settings: {
        min_amount: 10,
        max_amount: 10000,
        fees: 0
      },
      ...overrides
    };
  }

  // Settings Factory
  createSettings(overrides = {}) {
    const counter = this.getCounter('settings');
    return {
      key: `test_setting_${counter}`,
      value: `test_value_${counter}`,
      type: 'string',
      category: 'general',
      description: `Test setting ${counter}`,
      is_public: false,
      ...overrides
    };
  }

  // Enhanced create method that works with actual models
  async create(modelName, overrides = {}) {
    const factoryMethods = {
      'User': this.createUser,
      'Product': this.createProduct,
      'Order': this.createOrder,
      'Customer': this.createCustomer,
      'Payment': this.createPayment,
      'PaymentMethod': this.createPaymentMethod,
      'SampleRequest': this.createSampleRequest,
      'ContactMessage': this.createContactMessage,
      'Content': this.createContent,
      'Media': this.createMedia,
      'Settings': this.createSettings
    };

    const factoryMethod = factoryMethods[modelName];
    if (!factoryMethod) {
      throw new Error(`No factory method found for model: ${modelName}`);
    }

    const data = factoryMethod.call(this, overrides);
    
    // If we have access to the actual model, create and save
    try {
      const Model = require(`../../models/${modelName}`);
      const instance = new Model(data);
      return await instance.save();
    } catch (error) {
      // If model doesn't exist or can't be loaded, return the data
      return { ...data, _id: new mongoose.Types.ObjectId() };
    }
  }
}

// Export singleton instance
module.exports = new TestFactory();