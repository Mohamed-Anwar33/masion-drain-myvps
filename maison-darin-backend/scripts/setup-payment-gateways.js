#!/usr/bin/env node

/**
 * Payment Gateways Setup Script
 * 
 * This script initializes payment gateway settings in the database.
 * It supports importing from environment variables or interactive setup.
 * 
 * Usage:
 *   node scripts/setup-payment-gateways.js
 *   node scripts/setup-payment-gateways.js --from-env
 *   node scripts/setup-payment-gateways.js --interactive
 * 
 * Security: All sensitive credentials are encrypted before saving to database.
 */

const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config();

// Import models and utilities
const Settings = require('../models/Settings');
const paymentGatewayEncryption = require('../utils/paymentGatewayEncryption');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask questions
function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Connect to database
async function connectDB() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/maison-darin';
    await mongoose.connect(mongoURI);
    console.log('✓ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('✗ MongoDB connection error:', error.message);
    return false;
  }
}

// Setup from environment variables
async function setupFromEnv() {
  console.log('\n📦 Setting up payment gateways from environment variables...\n');

  const settings = await Settings.getSettings();

  // Paymob
  if (process.env.PAYMOB_API_KEY) {
    settings.paymentGateways.paymob = {
      enabled: true,
      environment: process.env.PAYMOB_ENVIRONMENT || 'sandbox',
      credentials: {
        apiKey: process.env.PAYMOB_API_KEY,
        secretKey: process.env.PAYMOB_SECRET_KEY || '',
        merchantId: process.env.PAYMOB_MERCHANT_ID || '',
        visaIntegrationId: process.env.PAYMOB_VISA_INTEGRATION_ID || '',
        mastercardIntegrationId: process.env.PAYMOB_MASTERCARD_INTEGRATION_ID || '',
        webhookSecret: process.env.PAYMOB_WEBHOOK_SECRET || ''
      }
    };
    console.log('✓ Paymob configured');
  }

  // Fawry
  if (process.env.FAWRY_MERCHANT_CODE) {
    settings.paymentGateways.fawry = {
      enabled: true,
      environment: process.env.FAWRY_ENVIRONMENT || 'sandbox',
      credentials: {
        merchantCode: process.env.FAWRY_MERCHANT_CODE,
        secretKey: process.env.FAWRY_SECRET_KEY || '',
        webhookSecret: process.env.FAWRY_WEBHOOK_SECRET || ''
      }
    };
    console.log('✓ Fawry configured');
  }

  // PayPal
  if (process.env.PAYPAL_CLIENT_ID) {
    settings.paymentGateways.paypal = {
      enabled: true,
      environment: process.env.PAYPAL_ENVIRONMENT || 'sandbox',
      credentials: {
        clientId: process.env.PAYPAL_CLIENT_ID,
        clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
        webhookId: process.env.PAYPAL_WEBHOOK_ID || ''
      }
    };
    console.log('✓ PayPal configured');
  }

  // Bank Transfer
  if (process.env.BANK_ACCOUNT_NUMBER) {
    settings.paymentGateways.bankTransfer = {
      enabled: true,
      accounts: [{
        bankName: {
          en: process.env.BANK_NAME || 'National Bank of Egypt',
          ar: process.env.BANK_NAME_AR || 'البنك الأهلي المصري'
        },
        accountName: {
          en: process.env.BANK_ACCOUNT_NAME || 'Maison Darin Perfumes',
          ar: process.env.BANK_ACCOUNT_NAME_AR || 'ميزون دارين للعطور'
        },
        accountNumber: process.env.BANK_ACCOUNT_NUMBER,
        iban: process.env.BANK_IBAN || '',
        swiftCode: process.env.BANK_SWIFT_CODE || '',
        currency: 'EGP',
        instructions: {
          en: process.env.BANK_INSTRUCTIONS_EN || 'Please transfer the amount and upload the receipt',
          ar: process.env.BANK_INSTRUCTIONS_AR || 'الرجاء تحويل المبلغ ورفع إيصال التحويل'
        }
      }]
    };
    console.log('✓ Bank Transfer configured');
  }

  await settings.save();
  console.log('\n✅ Payment gateways setup completed successfully!\n');
}

// Interactive setup
async function setupInteractive() {
  console.log('\n🎯 Interactive Payment Gateways Setup\n');
  console.log('This wizard will help you configure payment gateways.');
  console.log('Press Enter to skip any field.\n');

  const settings = await Settings.getSettings();

  // Paymob setup
  console.log('--- Paymob Configuration ---');
  const paymobEnabled = await question('Enable Paymob? (y/n): ');
  if (paymobEnabled.toLowerCase() === 'y') {
    const paymobApiKey = await question('Paymob API Key: ');
    const paymobSecretKey = await question('Paymob Secret Key: ');
    const paymobMerchantId = await question('Paymob Merchant ID: ');
    const paymobVisaId = await question('Paymob Visa Integration ID: ');
    const paymobMastercardId = await question('Paymob Mastercard Integration ID: ');
    const paymobWebhookSecret = await question('Paymob Webhook Secret: ');
    const paymobEnv = await question('Environment (sandbox/production) [sandbox]: ');

    settings.paymentGateways.paymob = {
      enabled: true,
      environment: paymobEnv || 'sandbox',
      credentials: {
        apiKey: paymobApiKey,
        secretKey: paymobSecretKey,
        merchantId: paymobMerchantId,
        visaIntegrationId: paymobVisaId,
        mastercardIntegrationId: paymobMastercardId,
        webhookSecret: paymobWebhookSecret
      }
    };
    console.log('✓ Paymob configured\n');
  }

  // Fawry setup
  console.log('--- Fawry Configuration ---');
  const fawryEnabled = await question('Enable Fawry? (y/n): ');
  if (fawryEnabled.toLowerCase() === 'y') {
    const fawryMerchantCode = await question('Fawry Merchant Code: ');
    const fawrySecretKey = await question('Fawry Secret Key: ');
    const fawryWebhookSecret = await question('Fawry Webhook Secret: ');
    const fawryEnv = await question('Environment (sandbox/production) [sandbox]: ');

    settings.paymentGateways.fawry = {
      enabled: true,
      environment: fawryEnv || 'sandbox',
      credentials: {
        merchantCode: fawryMerchantCode,
        secretKey: fawrySecretKey,
        webhookSecret: fawryWebhookSecret
      }
    };
    console.log('✓ Fawry configured\n');
  }

  // PayPal setup
  console.log('--- PayPal Configuration ---');
  const paypalEnabled = await question('Enable PayPal? (y/n): ');
  if (paypalEnabled.toLowerCase() === 'y') {
    const paypalClientId = await question('PayPal Client ID: ');
    const paypalClientSecret = await question('PayPal Client Secret: ');
    const paypalWebhookId = await question('PayPal Webhook ID: ');
    const paypalEnv = await question('Environment (sandbox/production) [sandbox]: ');

    settings.paymentGateways.paypal = {
      enabled: true,
      environment: paypalEnv || 'sandbox',
      credentials: {
        clientId: paypalClientId,
        clientSecret: paypalClientSecret,
        webhookId: paypalWebhookId
      }
    };
    console.log('✓ PayPal configured\n');
  }

  // Bank Transfer setup
  console.log('--- Bank Transfer Configuration ---');
  const bankEnabled = await question('Enable Bank Transfer? (y/n): ');
  if (bankEnabled.toLowerCase() === 'y') {
    const bankNameEn = await question('Bank Name (English): ');
    const bankNameAr = await question('Bank Name (Arabic): ');
    const accountNameEn = await question('Account Name (English): ');
    const accountNameAr = await question('Account Name (Arabic): ');
    const accountNumber = await question('Account Number: ');
    const iban = await question('IBAN: ');
    const swiftCode = await question('SWIFT Code: ');
    const instructionsEn = await question('Instructions (English): ');
    const instructionsAr = await question('Instructions (Arabic): ');

    settings.paymentGateways.bankTransfer = {
      enabled: true,
      accounts: [{
        bankName: {
          en: bankNameEn || 'National Bank of Egypt',
          ar: bankNameAr || 'البنك الأهلي المصري'
        },
        accountName: {
          en: accountNameEn || 'Maison Darin Perfumes',
          ar: accountNameAr || 'ميزون دارين للعطور'
        },
        accountNumber: accountNumber,
        iban: iban,
        swiftCode: swiftCode,
        currency: 'EGP',
        instructions: {
          en: instructionsEn || 'Please transfer the amount and upload the receipt',
          ar: instructionsAr || 'الرجاء تحويل المبلغ ورفع إيصال التحويل'
        }
      }]
    };
    console.log('✓ Bank Transfer configured\n');
  }

  await settings.save();
  console.log('\n✅ Payment gateways setup completed successfully!\n');
}

// Display current configuration
async function displayConfig() {
  console.log('\n📊 Current Payment Gateways Configuration\n');

  const settings = await Settings.getSettings();
  const masked = settings.getMaskedPaymentGateways();

  console.log('Paymob:');
  console.log(`  Enabled: ${masked.paymentGateways.paymob?.enabled || false}`);
  console.log(`  Environment: ${masked.paymentGateways.paymob?.environment || 'N/A'}`);
  console.log(`  API Key: ${masked.paymentGateways.paymob?.credentials?.apiKey || 'Not set'}\n`);

  console.log('Fawry:');
  console.log(`  Enabled: ${masked.paymentGateways.fawry?.enabled || false}`);
  console.log(`  Environment: ${masked.paymentGateways.fawry?.environment || 'N/A'}`);
  console.log(`  Merchant Code: ${masked.paymentGateways.fawry?.credentials?.merchantCode || 'Not set'}\n`);

  console.log('PayPal:');
  console.log(`  Enabled: ${masked.paymentGateways.paypal?.enabled || false}`);
  console.log(`  Environment: ${masked.paymentGateways.paypal?.environment || 'N/A'}`);
  console.log(`  Client ID: ${masked.paymentGateways.paypal?.credentials?.clientId || 'Not set'}\n`);

  console.log('Bank Transfer:');
  console.log(`  Enabled: ${masked.paymentGateways.bankTransfer?.enabled || false}`);
  console.log(`  Accounts: ${masked.paymentGateways.bankTransfer?.accounts?.length || 0}\n`);
}

// Main function
async function main() {
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║   Payment Gateways Setup - Maison Darin      ║');
  console.log('╚═══════════════════════════════════════════════╝\n');

  const connected = await connectDB();
  if (!connected) {
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const mode = args[0];

  try {
    if (mode === '--from-env') {
      await setupFromEnv();
    } else if (mode === '--display' || mode === '--show') {
      await displayConfig();
    } else {
      // Interactive mode by default
      await setupInteractive();
    }
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    rl.close();
    await mongoose.connection.close();
    console.log('✓ Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { setupFromEnv, setupInteractive, displayConfig };
