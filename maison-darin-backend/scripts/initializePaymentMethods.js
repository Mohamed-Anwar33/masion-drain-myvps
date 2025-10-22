const mongoose = require('mongoose');
const PaymentMethod = require('../models/PaymentMethod');
require('dotenv').config();

// Default payment methods configuration
const defaultPaymentMethods = [
  {
    name: 'visa',
    displayName: {
      ar: 'فيزا',
      en: 'Visa'
    },
    type: 'card',
    provider: 'paymob',
    isActive: true,
    configuration: {
      environment: 'sandbox',
      supportedCurrencies: ['EGP', 'USD'],
      minAmount: 10,
      maxAmount: 50000,
      timeoutMinutes: 30
    },
    fees: {
      fixedFee: 5,
      percentageFee: 2.5,
      feeCurrency: 'EGP'
    },
    ui: {
      icon: 'visa-icon.svg',
      color: '#1A1F71',
      description: {
        ar: 'ادفع بأمان باستخدام بطاقة الفيزا الخاصة بك',
        en: 'Pay securely with your Visa card'
      },
      instructions: {
        ar: 'أدخل بيانات بطاقة الفيزا الخاصة بك لإتمام عملية الدفع',
        en: 'Enter your Visa card details to complete the payment'
      },
      sortOrder: 1
    },
    validation: {
      requiredFields: ['cardNumber', 'expiryDate', 'cvv', 'cardholderName'],
      patterns: {
        cardNumber: '^4[0-9]{12}(?:[0-9]{3})?$'
      }
    },
    processing: {
      autoCapture: true,
      timeoutMinutes: 30,
      maxRetries: 3,
      supportsRefunds: true,
      supportsPartialRefunds: true
    }
  },
  {
    name: 'mastercard',
    displayName: {
      ar: 'ماستركارد',
      en: 'Mastercard'
    },
    type: 'card',
    provider: 'paymob',
    isActive: true,
    configuration: {
      environment: 'sandbox',
      supportedCurrencies: ['EGP', 'USD'],
      minAmount: 10,
      maxAmount: 50000,
      timeoutMinutes: 30
    },
    fees: {
      fixedFee: 5,
      percentageFee: 2.5,
      feeCurrency: 'EGP'
    },
    ui: {
      icon: 'mastercard-icon.svg',
      color: '#EB001B',
      description: {
        ar: 'ادفع بأمان باستخدام بطاقة الماستركارد الخاصة بك',
        en: 'Pay securely with your Mastercard'
      },
      instructions: {
        ar: 'أدخل بيانات بطاقة الماستركارد الخاصة بك لإتمام عملية الدفع',
        en: 'Enter your Mastercard details to complete the payment'
      },
      sortOrder: 2
    },
    validation: {
      requiredFields: ['cardNumber', 'expiryDate', 'cvv', 'cardholderName'],
      patterns: {
        cardNumber: '^5[1-5][0-9]{14}$'
      }
    },
    processing: {
      autoCapture: true,
      timeoutMinutes: 30,
      maxRetries: 3,
      supportsRefunds: true,
      supportsPartialRefunds: true
    }
  },
  {
    name: 'vodafone_cash',
    displayName: {
      ar: 'فودافون كاش',
      en: 'Vodafone Cash'
    },
    type: 'mobile_wallet',
    provider: 'fawry',
    isActive: true,
    configuration: {
      environment: 'sandbox',
      supportedCurrencies: ['EGP'],
      minAmount: 5,
      maxAmount: 30000,
      timeoutMinutes: 15
    },
    fees: {
      fixedFee: 2,
      percentageFee: 1.5,
      feeCurrency: 'EGP'
    },
    ui: {
      icon: 'vodafone-cash-icon.svg',
      color: '#E60000',
      description: {
        ar: 'ادفع بسهولة باستخدام محفظة فودافون كاش',
        en: 'Pay easily with Vodafone Cash wallet'
      },
      instructions: {
        ar: 'أدخل رقم فودافون كاش الخاص بك لإتمام عملية الدفع',
        en: 'Enter your Vodafone Cash number to complete the payment'
      },
      sortOrder: 3
    },
    validation: {
      requiredFields: ['phoneNumber'],
      patterns: {
        phoneNumber: '^01[0-9]{9}$'
      }
    },
    processing: {
      autoCapture: true,
      timeoutMinutes: 15,
      maxRetries: 2,
      supportsRefunds: true,
      supportsPartialRefunds: false
    }
  },
  {
    name: 'cash_on_delivery',
    displayName: {
      ar: 'الدفع عند الاستلام',
      en: 'Cash on Delivery'
    },
    type: 'cash',
    provider: 'internal',
    isActive: true,
    configuration: {
      environment: 'production',
      supportedCurrencies: ['EGP'],
      minAmount: 50,
      maxAmount: 10000,
      timeoutMinutes: 1440 // 24 hours
    },
    fees: {
      fixedFee: 15,
      percentageFee: 0,
      feeCurrency: 'EGP'
    },
    ui: {
      icon: 'cash-icon.svg',
      color: '#28A745',
      description: {
        ar: 'ادفع نقداً عند استلام طلبك',
        en: 'Pay cash when you receive your order'
      },
      instructions: {
        ar: 'سيتم تحصيل المبلغ نقداً عند تسليم الطلب',
        en: 'Payment will be collected in cash upon delivery'
      },
      sortOrder: 4
    },
    validation: {
      requiredFields: []
    },
    processing: {
      autoCapture: false,
      timeoutMinutes: 1440,
      maxRetries: 0,
      supportsRefunds: true,
      supportsPartialRefunds: true
    }
  },
  {
    name: 'bank_transfer',
    displayName: {
      ar: 'تحويل بنكي',
      en: 'Bank Transfer'
    },
    type: 'bank_transfer',
    provider: 'internal',
    isActive: true,
    configuration: {
      environment: 'production',
      supportedCurrencies: ['EGP'],
      minAmount: 100,
      maxAmount: 100000,
      timeoutMinutes: 4320 // 72 hours
    },
    fees: {
      fixedFee: 0,
      percentageFee: 0,
      feeCurrency: 'EGP'
    },
    ui: {
      icon: 'bank-icon.svg',
      color: '#007BFF',
      description: {
        ar: 'حول المبلغ إلى حسابنا البنكي',
        en: 'Transfer the amount to our bank account'
      },
      instructions: {
        ar: 'قم بالتحويل إلى الحساب البنكي المحدد وأرسل إيصال التحويل',
        en: 'Transfer to the specified bank account and send the transfer receipt'
      },
      sortOrder: 5
    },
    validation: {
      requiredFields: ['bankReference']
    },
    processing: {
      autoCapture: false,
      timeoutMinutes: 4320,
      maxRetries: 0,
      supportsRefunds: true,
      supportsPartialRefunds: true
    }
  },
  {
    name: 'paypal',
    displayName: {
      ar: 'باي بال',
      en: 'PayPal'
    },
    type: 'digital_wallet',
    provider: 'paypal',
    isActive: true,
    configuration: {
      environment: 'sandbox',
      supportedCurrencies: ['USD', 'EUR'],
      minAmount: 1,
      maxAmount: 10000,
      timeoutMinutes: 60
    },
    fees: {
      fixedFee: 0,
      percentageFee: 3.4,
      feeCurrency: 'USD'
    },
    ui: {
      icon: 'paypal-icon.svg',
      color: '#0070BA',
      description: {
        ar: 'ادفع بأمان باستخدام حساب PayPal الخاص بك',
        en: 'Pay securely with your PayPal account'
      },
      instructions: {
        ar: 'سيتم توجيهك إلى PayPal لإتمام عملية الدفع',
        en: 'You will be redirected to PayPal to complete the payment'
      },
      sortOrder: 6
    },
    validation: {
      requiredFields: []
    },
    processing: {
      autoCapture: false,
      timeoutMinutes: 60,
      maxRetries: 2,
      supportsRefunds: true,
      supportsPartialRefunds: true
    }
  }
];

async function initializePaymentMethods() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/maison-darin');
    console.log('Connected to MongoDB');

    // Clear existing payment methods (optional - remove in production)
    // await PaymentMethod.deleteMany({});
    // console.log('Cleared existing payment methods');

    // Insert default payment methods
    for (const methodData of defaultPaymentMethods) {
      try {
        // Check if payment method already exists
        const existingMethod = await PaymentMethod.findOne({ name: methodData.name });
        
        if (existingMethod) {
          console.log(`Payment method '${methodData.name}' already exists, updating...`);
          await PaymentMethod.findOneAndUpdate(
            { name: methodData.name },
            methodData,
            { new: true, upsert: true }
          );
        } else {
          console.log(`Creating payment method '${methodData.name}'...`);
          await PaymentMethod.create(methodData);
        }
        
        console.log(`✓ Payment method '${methodData.name}' initialized successfully`);
      } catch (error) {
        console.error(`✗ Failed to initialize payment method '${methodData.name}':`, error.message);
      }
    }

    console.log('\n=== Payment Methods Initialization Complete ===');
    
    // Display summary
    const totalMethods = await PaymentMethod.countDocuments();
    const activeMethods = await PaymentMethod.countDocuments({ isActive: true });
    
    console.log(`Total payment methods: ${totalMethods}`);
    console.log(`Active payment methods: ${activeMethods}`);
    
    // List all payment methods
    const methods = await PaymentMethod.find({}).sort({ 'ui.sortOrder': 1 });
    console.log('\nConfigured payment methods:');
    methods.forEach(method => {
      console.log(`- ${method.name} (${method.displayName.en}) - ${method.isActive ? 'Active' : 'Inactive'}`);
    });

  } catch (error) {
    console.error('Error initializing payment methods:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

// Run the initialization
if (require.main === module) {
  initializePaymentMethods()
    .then(() => {
      console.log('Payment methods initialization completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Payment methods initialization failed:', error);
      process.exit(1);
    });
}

module.exports = { initializePaymentMethods, defaultPaymentMethods };