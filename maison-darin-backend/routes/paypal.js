const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticate } = require('../middleware/auth');
const SiteSettings = require('../models/SiteSettings');
const orderService = require('../services/orderService');
const currencyService = require('../services/currencyService');

// PayPal configuration interface
const defaultPayPalConfig = {
  enabled: false,
  environment: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox',
  sandbox: {
    clientId: '',
    clientSecret: '',
    webhookId: ''
  },
  live: {
    clientId: '',
    clientSecret: '',
    webhookId: ''
  }
};

// Get PayPal settings (Admin only)
router.get('/settings', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    let settings = await SiteSettings.findOne();

    if (!settings) {
      console.log('No settings found, returning defaults');
      return res.json({ 
        success: true,
        paypalSettings: defaultPayPalConfig 
      });
    }

    console.log('Returning PayPal settings:', settings.paypalSettings);

    res.json({ 
      success: true,
      paypalSettings: settings.paypalSettings || defaultPayPalConfig 
    });
  } catch (error) {
    console.error('Error fetching PayPal settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update PayPal settings (Admin only)
router.put('/settings', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const {
      enabled,
      clientId,
      clientSecret,
      webhookId
    } = req.body;

    // Validation
    if (enabled && (!clientId || !clientSecret)) {
      return res.status(400).json({ 
        message: 'Client ID and Client Secret are required when PayPal is enabled' 
      });
    }

    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = new SiteSettings();
    }

    // Update PayPal settings
    settings.paypalSettings = {
      enabled: Boolean(enabled),
      clientId: clientId || '',
      clientSecret: clientSecret || '',
      webhookId: webhookId || ''
    };

    await settings.save();

    console.log('PayPal settings updated successfully:', settings.paypalSettings);

    res.status(200).json({ 
      success: true,
      message: 'PayPal settings updated successfully',
      paypalSettings: settings.paypalSettings 
    });
  } catch (error) {
    console.error('Error updating PayPal settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Test PayPal connection (Admin only)
router.post('/test', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const settings = await SiteSettings.findOne();
    if (!settings || !settings.paypalSettings || !settings.paypalSettings.enabled) {
      return res.status(400).json({ message: 'PayPal is not configured or enabled' });
    }

    const { clientId, clientSecret, mode } = settings.paypalSettings;
    
    if (!clientId || !clientSecret) {
      return res.status(400).json({ message: 'PayPal credentials are missing' });
    }

    // Test PayPal API connection
    const baseURL = mode === 'production' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com';

    try {
      // Get access token to test credentials
      const authResponse = await fetch(`${baseURL}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Language': 'en_US',
          'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      });

      if (authResponse.ok) {
        const authData = await authResponse.json();
        res.json({ 
          success: true, 
          message: 'PayPal connection test successful',
          mode: mode,
          tokenType: authData.token_type
        });
      } else {
        const errorData = await authResponse.json();
        res.status(400).json({ 
          success: false, 
          message: 'PayPal authentication failed',
          error: errorData.error_description || 'Invalid credentials'
        });
      }
    } catch (fetchError) {
      console.error('PayPal API test error:', fetchError);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to connect to PayPal API',
        error: fetchError.message
      });
    }

  } catch (error) {
    console.error('Error testing PayPal connection:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create PayPal payment
router.post('/create-payment', async (req, res) => {
  try {
    const settings = await SiteSettings.findOne();
    if (!settings || !settings.paypalSettings || !settings.paypalSettings.enabled) {
      return res.status(400).json({ message: 'PayPal is not available' });
    }

    const { amount, currency, returnUrl, cancelUrl, description } = req.body;

    if (!amount || !returnUrl || !cancelUrl) {
      return res.status(400).json({ message: 'Missing required payment parameters' });
    }

    const { clientId, clientSecret, mode } = settings.paypalSettings;
    const baseURL = mode === 'production' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com';

    // Get access token
    const authResponse = await fetch(`${baseURL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // Create payment
    const paymentData = {
      intent: 'sale',
      payer: {
        payment_method: 'paypal'
      },
      transactions: [{
        amount: {
          total: amount.toString(),
          currency: currency || settings.paypalSettings.currency || 'USD'
        },
        description: description || 'Maison Darin Purchase'
      }],
      // No redirect_urls for local development
      redirect_urls: {
        return_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel'
      }
    };

    const paymentResponse = await fetch(`${baseURL}/v1/payments/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(paymentData)
    });

    const paymentResult = await paymentResponse.json();

    if (paymentResponse.ok) {
      res.json(paymentResult);
    } else {
      res.status(400).json({ 
        message: 'Failed to create PayPal payment',
        error: paymentResult
      });
    }

  } catch (error) {
    console.error('Error creating PayPal payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get PayPal public configuration (for frontend)
router.get('/config', async (req, res) => {
  try {
    const settings = await SiteSettings.findOne();
    if (!settings || !settings.paypalSettings || !settings.paypalSettings.enabled) {
      return res.json({ 
        enabled: false,
        message: 'PayPal is not enabled'
      });
    }

    // Return only public configuration (no secrets)
    res.json({
      enabled: settings.paypalSettings.enabled,
      clientId: settings.paypalSettings.clientId
    });

  } catch (error) {
    console.error('Error fetching PayPal config:', error);
    res.status(500).json({ 
      enabled: false,
      message: 'Server error' 
    });
  }
});

// Test PayPal connection
router.post('/test', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const settings = await SiteSettings.findOne();
    
    if (!settings || !settings.paypalSettings || !settings.paypalSettings.enabled) {
      return res.json({ 
        success: false,
        message: 'PayPal is not enabled' 
      });
    }

    const { clientId, clientSecret } = settings.paypalSettings;
    
    if (!clientId || !clientSecret) {
      return res.json({ 
        success: false,
        message: 'PayPal credentials not configured' 
      });
    }

    // Test PayPal authentication
    try {
      const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const baseUrl = 'https://api.sandbox.paypal.com'; // Always use sandbox for testing
      
      const response = await axios.post(`${baseUrl}/v1/oauth2/token`, 
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 10000
        }
      );

      if (response.data.access_token) {
        return res.json({ 
          success: true,
          message: 'PayPal connection successful',
          mode: 'sandbox'
        });
      } else {
        return res.json({ 
          success: false,
          message: 'Failed to get access token' 
        });
      }
    } catch (paypalError) {
      console.error('PayPal API Error:', paypalError.response?.data || paypalError.message);
      return res.json({ 
        success: false,
        message: 'PayPal authentication failed: ' + (paypalError.response?.data?.error_description || paypalError.message)
      });
    }

  } catch (error) {
    console.error('Error testing PayPal:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Execute PayPal payment
router.post('/execute-payment', async (req, res) => {
  try {
    const { paymentId, payerId } = req.body;

    if (!paymentId || !payerId) {
      return res.status(400).json({ message: 'Missing payment ID or payer ID' });
    }

    const settings = await SiteSettings.findOne();
    if (!settings || !settings.paypalSettings || !settings.paypalSettings.enabled) {
      return res.status(400).json({ message: 'PayPal is not available' });
    }

    const { clientId, clientSecret, mode } = settings.paypalSettings;
    const baseURL = mode === 'production' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com';

    // Get access token
    const authResponse = await fetch(`${baseURL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // Execute payment
    const executeResponse = await fetch(`${baseURL}/v1/payments/payment/${paymentId}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ payer_id: payerId })
    });

    const executeResult = await executeResponse.json();

    if (executeResponse.ok) {
      res.json(executeResult);
    } else {
      res.status(400).json({ 
        message: 'Failed to execute PayPal payment',
        error: executeResult
      });
    }

  } catch (error) {
    console.error('Error executing PayPal payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create PayPal order with local order integration
router.post('/orders', async (req, res) => {
  try {
    console.log('📦 Creating PayPal order with data:', req.body);
    
    const { 
      amount, 
      currency, 
      orderData,
      returnUrl, 
      cancelUrl
    } = req.body;

    console.log('📍 PayPal Order Creation - Development Mode');

    // Validate required data
    if (!amount || !orderData) {
      return res.status(400).json({ 
        success: false,
        message: 'Amount and order data are required' 
      });
    }

    // Get site settings for currency configuration
    const settings = await SiteSettings.findOne();
    const siteCurrency = settings?.businessSettings?.currency || 'SAR';
    const originalCurrency = currency || siteCurrency;

    console.log('💰 Currency Information:');
    console.log(`   Original Amount: ${amount} ${originalCurrency}`);
    console.log(`   Site Currency: ${siteCurrency}`);

    // Convert currency for PayPal if needed
    let paypalAmount = amount;
    let paypalCurrency = originalCurrency;
    let conversionDetails = null;

    if (originalCurrency === 'SAR') {
      console.log('🔄 Converting SAR to USD for PayPal...');
      
      try {
        const conversion = await currencyService.convertForPayPal(amount, 'SAR');
        paypalAmount = conversion.amount;
        paypalCurrency = conversion.currency;
        conversionDetails = conversion.conversionDetails;

        console.log('✅ Currency conversion successful:');
        console.log(`   ${amount} SAR → ${paypalAmount} ${paypalCurrency}`);
        console.log(`   Exchange Rate: ${conversionDetails?.exchangeRate}`);
        console.log(`   Using ${conversionDetails?.usingFallback ? 'fallback' : 'live'} rates`);
        
      } catch (error) {
        console.error('❌ Currency conversion failed:', error.message);
        return res.status(400).json({ 
          success: false,
          message: 'Currency conversion failed: ' + error.message
        });
      }
    } else if (originalCurrency !== 'USD') {
      console.log(`⚠️ Currency ${originalCurrency} not supported for PayPal conversion`);
      return res.status(400).json({ 
        success: false,
        message: `Currency ${originalCurrency} is not supported. Please use SAR or USD.`
      });
    }

    // Check PayPal settings (settings already loaded above)
    if (!settings.paypalSettings || !settings.paypalSettings.enabled) {
      return res.status(400).json({ 
        success: false,
        message: 'PayPal is not available' 
      });
    }

    const { clientId, clientSecret } = settings.paypalSettings;
    if (!clientId || !clientSecret) {
      return res.status(400).json({ 
        success: false,
        message: 'PayPal credentials not configured' 
      });
    }

    // Get PayPal access token
    const baseURL = 'https://api-m.sandbox.paypal.com'; // Use sandbox for development
    
    const authResponse = await fetch(`${baseURL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!authResponse.ok) {
      console.error('❌ PayPal auth failed:', await authResponse.text());
      return res.status(400).json({ 
        success: false,
        message: 'PayPal authentication failed' 
      });
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // Create local order first with pending payment status
    const localOrderData = {
      ...orderData,
      paymentMethod: 'paypal',
      paymentStatus: 'pending',
      status: 'pending'
    };

    const localOrder = await orderService.createOrder(localOrderData);
    console.log('✅ Local order created:', localOrder.orderNumber);

    // Create PayPal order
    const paypalOrderData = {
      intent: 'CAPTURE',
      application_context: {
        brand_name: 'Maison Darin',
        locale: 'en-US',
        landing_page: 'BILLING',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
        return_url: 'http://localhost:8080/payment/return',
        cancel_url: 'http://localhost:8080/checkout/cancel'
      },
      purchase_units: [{
        reference_id: localOrder.orderNumber,
        description: `Maison Darin - Order ${localOrder.orderNumber}`,
        custom_id: localOrder._id.toString(),
        amount: {
          currency_code: paypalCurrency,
          value: paypalAmount.toString()
        }
        // Simplified order structure to avoid compliance issues in Sandbox
        // All order details are stored in our local database
      }]
    };

    console.log('🔄 Creating PayPal order:', JSON.stringify(paypalOrderData, null, 2));

    const paypalResponse = await fetch(`${baseURL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `${localOrder.orderNumber}-${Date.now()}`
      },
      body: JSON.stringify(paypalOrderData)
    });

    const paypalResult = await paypalResponse.json();
    console.log('💳 PayPal order response:', paypalResult);

    if (paypalResponse.ok && paypalResult.id) {
      // Update local order with PayPal order ID
      localOrder.paypalOrderId = paypalResult.id;
      await localOrder.save();

      res.json({
        success: true,
        orderId: paypalResult.id,
        localOrderId: localOrder._id,
        localOrderNumber: localOrder.orderNumber,
        approveUrl: paypalResult.links?.find(link => link.rel === 'approve')?.href,
        paypalOrder: paypalResult,
        // Currency conversion information
        currencyInfo: {
          originalAmount: amount,
          originalCurrency: originalCurrency,
          paypalAmount: paypalAmount,
          paypalCurrency: paypalCurrency,
          converted: conversionDetails !== null,
          conversionDetails: conversionDetails
        }
      });
    } else {
      console.error('❌ PayPal order creation failed:', paypalResult);
      
      // Delete the local order if PayPal order creation failed
      await orderService.cancelOrder(localOrder._id, 'PayPal order creation failed');
      
      res.status(400).json({ 
        success: false,
        message: 'Failed to create PayPal order',
        error: paypalResult.details || paypalResult.message || 'Unknown error'
      });
    }

  } catch (error) {
    console.error('❌ Error creating PayPal order:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error: ' + error.message 
    });
  }
});

// Capture PayPal order and update local order
router.post('/orders/:orderId/capture', async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log('\n═══════════════════════════════════════');
    console.log('💰 CAPTURING PAYPAL ORDER');
    console.log('═══════════════════════════════════════');
    console.log('📋 Order ID:', orderId);
    console.log('🕐 Timestamp:', new Date().toISOString());

    // Check PayPal settings
    const settings = await SiteSettings.findOne();
    console.log('\n🔍 Checking PayPal settings...');
    
    if (!settings) {
      console.error('❌ No site settings found in database');
      return res.status(400).json({ 
        success: false,
        message: 'إعدادات الموقع غير موجودة',
        error: 'NO_SETTINGS'
      });
    }

    if (!settings.paypalSettings) {
      console.error('❌ PayPal settings not configured');
      return res.status(400).json({ 
        success: false,
        message: 'إعدادات PayPal غير موجودة',
        error: 'NO_PAYPAL_SETTINGS'
      });
    }

    if (!settings.paypalSettings.enabled) {
      console.error('❌ PayPal is disabled');
      return res.status(400).json({ 
        success: false,
        message: 'PayPal غير مفعل',
        error: 'PAYPAL_DISABLED'
      });
    }

    const { clientId, clientSecret } = settings.paypalSettings;
    
    if (!clientId || !clientSecret) {
      console.error('❌ PayPal credentials missing');
      console.error('   Client ID:', clientId ? 'EXISTS' : 'MISSING');
      console.error('   Client Secret:', clientSecret ? 'EXISTS' : 'MISSING');
      return res.status(400).json({ 
        success: false,
        message: 'بيانات PayPal غير مكتملة',
        error: 'MISSING_CREDENTIALS'
      });
    }

    console.log('✅ PayPal settings validated');
    console.log('   Client ID:', clientId.substring(0, 10) + '...');
    console.log('   Environment: Sandbox');

    const baseURL = 'https://api-m.sandbox.paypal.com';

    // Get access token
    console.log('\n🔐 Getting PayPal access token...');
    const authResponse = await fetch(`${baseURL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error('❌ PayPal authentication failed');
      console.error('   Status:', authResponse.status);
      console.error('   Error:', errorText);
      return res.status(400).json({ 
        success: false,
        message: 'فشل المصادقة مع PayPal',
        error: 'AUTH_FAILED',
        details: errorText
      });
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;
    
    if (!accessToken) {
      console.error('❌ No access token received');
      return res.status(400).json({ 
        success: false,
        message: 'فشل الحصول على رمز الوصول',
        error: 'NO_ACCESS_TOKEN'
      });
    }
    
    console.log('✅ Access token obtained successfully');

    // Capture PayPal order
    console.log('\n💳 Attempting to capture PayPal order...');
    console.log('   Endpoint:', `${baseURL}/v2/checkout/orders/${orderId}/capture`);
    
    const captureResponse = await fetch(`${baseURL}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `capture-${orderId}-${Date.now()}`
      }
    });

    console.log('📡 Capture Response Status:', captureResponse.status);
    console.log('📡 Capture Response Headers:', Object.fromEntries(captureResponse.headers.entries()));

    const captureResult = await captureResponse.json();
    console.log('\n📋 PayPal Capture Result:');
    console.log(JSON.stringify(captureResult, null, 2));

    if (captureResponse.ok && captureResult.status === 'COMPLETED') {
      console.log('\n✅ PayPal capture successful!');
      console.log('   Status:', captureResult.status);
      console.log('   Capture ID:', captureResult.id);
      
      // Find local order by PayPal order ID
      const Order = require('../models/Order');
      console.log('\n🔍 Looking for local order with PayPal ID:', orderId);
      const localOrder = await Order.findOne({ paypalOrderId: orderId });

      if (localOrder) {
        console.log('✅ Local order found:', localOrder.orderNumber);
        
        // Update local order status
        localOrder.paymentStatus = 'paid';
        localOrder.status = 'confirmed';
        localOrder.paypalCaptureId = captureResult.id;
        localOrder.paymentDetails = {
          paypalOrderId: orderId,
          paypalCaptureId: captureResult.id,
          captureTime: new Date(),
          amount: captureResult.purchase_units[0].payments.captures[0].amount
        };
        
        await localOrder.save();
        
        console.log(`✅ Order ${localOrder.orderNumber} marked as paid and confirmed`);

        // Now send confirmation emails since payment is successful
        try {
          console.log('📧 Sending confirmation emails...');
          await orderService.sendOrderConfirmationEmails(localOrder);
          console.log(`✅ Confirmation emails sent for order ${localOrder.orderNumber}`);
        } catch (emailError) {
          console.error(`❌ Failed to send confirmation emails for order ${localOrder.orderNumber}:`, emailError.message);
          // Don't fail the payment completion if email fails
        }

        console.log('\n═══════════════════════════════════════');
        console.log('✅ PAYMENT CAPTURE COMPLETED');
        console.log('═══════════════════════════════════════\n');

        res.json({
          success: true,
          message: 'Payment completed successfully',
          orderId,
          localOrderNumber: localOrder.orderNumber,
          captureId: captureResult.id,
          status: 'COMPLETED'
        });
      } else {
        console.error('\n❌ LOCAL ORDER NOT FOUND');
        console.error('   PayPal Order ID:', orderId);
        console.error('   Searched in database but no matching order found');
        console.error('═══════════════════════════════════════\n');
        
        res.status(404).json({
          success: false,
          message: 'الطلب المحلي غير موجود',
          error: 'LOCAL_ORDER_NOT_FOUND',
          paypalOrderId: orderId
        });
      }
    } else {
      // PayPal capture failed
      console.error('\n❌ PAYPAL CAPTURE FAILED');
      console.error('   Response Status:', captureResponse.status);
      console.error('   Result Status:', captureResult.status);
      console.error('   Error Details:', JSON.stringify(captureResult, null, 2));
      
      // Parse specific PayPal error messages
      let errorMessage = 'فشل في تأكيد الدفع';
      let errorCode = 'CAPTURE_FAILED';
      
      if (captureResult.details && captureResult.details.length > 0) {
        const firstError = captureResult.details[0];
        errorCode = firstError.issue || errorCode;
        
        // Translate common PayPal errors to Arabic
        switch (errorCode) {
          case 'ORDER_ALREADY_CAPTURED':
            errorMessage = 'هذا الطلب تم تأكيده مسبقاً';
            break;
          case 'ORDER_EXPIRED':
            errorMessage = 'انتهت صلاحية الطلب، يرجى المحاولة مرة أخرى';
            break;
          case 'ORDER_NOT_APPROVED':
            errorMessage = 'لم يتم الموافقة على الطلب من PayPal';
            break;
          case 'INSTRUMENT_DECLINED':
            errorMessage = 'تم رفض وسيلة الدفع';
            break;
          case 'PAYER_ACTION_REQUIRED':
            errorMessage = 'يتطلب إجراء من المشتري';
            break;
          case 'COMPLIANCE_VIOLATION':
            errorMessage = 'مشكلة في حساب PayPal Sandbox - يرجى التواصل مع الدعم الفني';
            console.error('⚠️  COMPLIANCE_VIOLATION - This is usually a PayPal Sandbox account issue');
            console.error('   Solutions:');
            console.error('   1. Create a new Sandbox Business account');
            console.error('   2. Verify the Business account is fully activated');
            console.error('   3. Try with a different Sandbox app credentials');
            console.error('   4. Contact PayPal Developer Support');
            break;
          default:
            errorMessage = firstError.description || errorMessage;
        }
        
        console.error('   Issue:', errorCode);
        console.error('   Description:', errorMessage);
      }
      
      console.error('═══════════════════════════════════════\n');
      
      res.status(400).json({
        success: false,
        message: errorMessage,
        error: errorCode,
        details: captureResult.details || captureResult,
        debugInfo: {
          orderId,
          status: captureResult.status,
          timestamp: new Date().toISOString()
        }
      });
    }

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR CAPTURING PAYMENT');
    console.error('═══════════════════════════════════════');
    console.error('Error Type:', error.constructor.name);
    console.error('Error Message:', error.message);
    console.error('Stack Trace:', error.stack);
    console.error('═══════════════════════════════════════\n');
    
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم: ' + error.message,
      error: 'SERVER_ERROR',
      details: error.message
    });
  }
});

// PayPal Webhook endpoint
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    console.log('\n🔔 PayPal Webhook received');
    console.log('════════════════════════════════════');
    
    const webhookEvent = JSON.parse(req.body.toString());
    console.log('📋 Event Type:', webhookEvent.event_type);
    console.log('📋 Event ID:', webhookEvent.id);
    console.log('📋 Resource Type:', webhookEvent.resource_type);

    // Get webhook settings
    const settings = await SiteSettings.findOne();
    if (!settings?.paypalSettings?.webhookId) {
      console.log('⚠️ No webhook ID configured, processing anyway...');
    }

    // Handle different webhook events
    switch (webhookEvent.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCaptureCompleted(webhookEvent);
        break;
      
      case 'PAYMENT.CAPTURE.DENIED':
        await handlePaymentCaptureDenied(webhookEvent);
        break;
      
      case 'PAYMENT.CAPTURE.PENDING':
        await handlePaymentCapturePending(webhookEvent);
        break;
      
      case 'CHECKOUT.ORDER.APPROVED':
        await handleOrderApproved(webhookEvent);
        break;
      
      case 'CHECKOUT.ORDER.COMPLETED':
        await handleOrderCompleted(webhookEvent);
        break;
      
      default:
        console.log(`ℹ️ Unhandled webhook event: ${webhookEvent.event_type}`);
    }

    console.log('✅ Webhook processed successfully');
    console.log('════════════════════════════════════\n');
    
    res.status(200).json({ success: true });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Webhook event handlers
async function handlePaymentCaptureCompleted(event) {
  try {
    const resource = event.resource;
    const customId = resource.custom_id;
    const captureId = resource.id;
    const amount = resource.amount;

    console.log('💰 Payment Capture Completed:');
    console.log(`   Capture ID: ${captureId}`);
    console.log(`   Amount: ${amount.value} ${amount.currency_code}`);
    console.log(`   Custom ID: ${customId}`);

    if (customId) {
      // Update local order status
      const order = await orderService.updateOrderStatus(customId, 'completed', {
        paymentStatus: 'completed',
        paypalCaptureId: captureId,
        webhookProcessed: true,
        webhookTimestamp: new Date()
      });

      if (order) {
        console.log(`✅ Order ${order.orderNumber} marked as completed via webhook`);
        
        // Send confirmation email if needed
        // await emailService.sendOrderConfirmation(order);
      }
    }
  } catch (error) {
    console.error('❌ Error handling payment capture completed:', error);
  }
}

async function handlePaymentCaptureDenied(event) {
  try {
    const resource = event.resource;
    const customId = resource.custom_id;
    const captureId = resource.id;

    console.log('❌ Payment Capture Denied:');
    console.log(`   Capture ID: ${captureId}`);
    console.log(`   Custom ID: ${customId}`);

    if (customId) {
      await orderService.updateOrderStatus(customId, 'cancelled', {
        paymentStatus: 'failed',
        paypalCaptureId: captureId,
        webhookProcessed: true,
        webhookTimestamp: new Date(),
        cancellationReason: 'Payment capture denied by PayPal'
      });

      console.log(`❌ Order marked as cancelled due to payment denial`);
    }
  } catch (error) {
    console.error('❌ Error handling payment capture denied:', error);
  }
}

async function handlePaymentCapturePending(event) {
  try {
    const resource = event.resource;
    const customId = resource.custom_id;
    const captureId = resource.id;

    console.log('⏳ Payment Capture Pending:');
    console.log(`   Capture ID: ${captureId}`);
    console.log(`   Custom ID: ${customId}`);

    if (customId) {
      await orderService.updateOrderStatus(customId, 'processing', {
        paymentStatus: 'pending',
        paypalCaptureId: captureId,
        webhookProcessed: true,
        webhookTimestamp: new Date()
      });

      console.log(`⏳ Order marked as processing (payment pending)`);
    }
  } catch (error) {
    console.error('❌ Error handling payment capture pending:', error);
  }
}

async function handleOrderApproved(event) {
  try {
    const resource = event.resource;
    const orderId = resource.id;

    console.log('✅ Order Approved:');
    console.log(`   PayPal Order ID: ${orderId}`);

    // Find local order by PayPal order ID
    const order = await orderService.findByPayPalOrderId(orderId);
    if (order) {
      await orderService.updateOrderStatus(order._id, 'processing', {
        paymentStatus: 'approved',
        webhookProcessed: true,
        webhookTimestamp: new Date()
      });

      console.log(`✅ Order ${order.orderNumber} marked as approved`);
    }
  } catch (error) {
    console.error('❌ Error handling order approved:', error);
  }
}

async function handleOrderCompleted(event) {
  try {
    const resource = event.resource;
    const orderId = resource.id;

    console.log('🎉 Order Completed:');
    console.log(`   PayPal Order ID: ${orderId}`);

    // Find local order by PayPal order ID
    const order = await orderService.findByPayPalOrderId(orderId);
    if (order) {
      await orderService.updateOrderStatus(order._id, 'completed', {
        paymentStatus: 'completed',
        webhookProcessed: true,
        webhookTimestamp: new Date()
      });

      console.log(`🎉 Order ${order.orderNumber} completed via webhook`);
    }
  } catch (error) {
    console.error('❌ Error handling order completed:', error);
  }
}

// Get currency conversion rates (for admin dashboard)
router.get('/currency-rates', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const rates = await currencyService.getExchangeRates();
    
    res.json({
      success: true,
      rates: rates.rates,
      lastUpdated: rates.lastUpdated,
      usingFallback: rates.usingFallback || false
    });

  } catch (error) {
    console.error('Error fetching currency rates:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch currency rates' 
    });
  }
});

// Test currency conversion (for admin)
router.post('/test-conversion', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { amount, fromCurrency = 'SAR', toCurrency = 'USD' } = req.body;

    if (!amount) {
      return res.status(400).json({ 
        success: false,
        message: 'Amount is required' 
      });
    }

    let conversion;
    if (fromCurrency === 'SAR') {
      conversion = await currencyService.convertFromSAR(amount, toCurrency);
    } else {
      return res.status(400).json({ 
        success: false,
        message: 'Only SAR conversion is currently supported' 
      });
    }

    res.json({
      success: true,
      conversion: conversion
    });

  } catch (error) {
    console.error('Error testing currency conversion:', error);
    res.status(500).json({ 
      success: false,
      message: 'Conversion test failed: ' + error.message 
    });
  }
});

module.exports = router;
