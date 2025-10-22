#!/usr/bin/env node

/**
 * سكريبت سريع لاختبار لوحة التحكم من سطر الأوامر
 * Quick script to test admin dashboard from command line
 */

const axios = require('axios');
const colors = require('colors');

// إعدادات الاختبار
const API_BASE = process.env.VITE_API_URL || 'http://localhost:5000/api';
const ADMIN_EMAIL = 'admin@maisondarin.com';
const ADMIN_PASSWORD = 'Admin123456#';

let authToken = '';

// وظائف مساعدة
const log = {
  success: (msg) => console.log('✅', colors.green(msg)),
  error: (msg) => console.log('❌', colors.red(msg)),
  info: (msg) => console.log('ℹ️ ', colors.blue(msg)),
  warning: (msg) => console.log('⚠️ ', colors.yellow(msg)),
  header: (msg) => console.log('\n' + '='.repeat(50) + '\n' + colors.cyan.bold(msg) + '\n' + '='.repeat(50))
};

// اختبار الاتصال بالخادم
async function testConnection() {
  try {
    const response = await axios.get(`${API_BASE.replace('/api', '')}/health`);
    log.success(`Server is running: ${response.data?.message || 'OK'}`);
    return true;
  } catch (error) {
    log.error(`Server connection failed: ${error.message}`);
    return false;
  }
}

// تسجيل الدخول
async function login() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    authToken = response.data.data.tokens.accessToken;
    log.success('Admin login successful');
    return true;
  } catch (error) {
    log.error(`Login failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// إعداد headers للمصادقة
function getAuthHeaders() {
  return {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };
}

// اختبار المنتجات
async function testProducts() {
  try {
    const response = await axios.get(`${API_BASE}/products`, {
      headers: getAuthHeaders(),
      params: { limit: 5 }
    });
    
    const products = response.data.data.products || response.data.data || [];
    log.success(`Products loaded: ${products.length} items`);
    
    if (products.length > 0) {
      log.info(`Sample product: ${products[0].name?.en || products[0].name || 'Unknown'}`);
    }
    
    return true;
  } catch (error) {
    log.error(`Products test failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// اختبار الطلبات
async function testOrders() {
  try {
    const response = await axios.get(`${API_BASE}/orders`, {
      headers: getAuthHeaders(),
      params: { limit: 5 }
    });
    
    const orders = response.data.data.orders || response.data.data || [];
    log.success(`Orders loaded: ${orders.length} items`);
    
    if (orders.length > 0) {
      log.info(`Sample order: ${orders[0].orderNumber || orders[0]._id || 'Unknown'}`);
    }
    
    return true;
  } catch (error) {
    log.error(`Orders test failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// اختبار لوحة التحكم
async function testDashboard() {
  try {
    const response = await axios.get(`${API_BASE}/admin/dashboard`, {
      headers: getAuthHeaders()
    });
    
    const stats = response.data.data;
    log.success('Dashboard stats loaded');
    log.info(`Total products: ${stats.overview?.totalProducts || 'N/A'}`);
    log.info(`Total customers: ${stats.overview?.totalCustomers || 'N/A'}`);
    log.info(`Today's orders: ${stats.overview?.todayOrders || 'N/A'}`);
    
    return true;
  } catch (error) {
    log.error(`Dashboard test failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// اختبار الفئات
async function testCategories() {
  try {
    const response = await axios.get(`${API_BASE}/categories/active`, {
      headers: getAuthHeaders()
    });
    
    const categories = response.data.data.categories || response.data.data || [];
    log.success(`Categories loaded: ${categories.length} items`);
    
    return true;
  } catch (error) {
    log.error(`Categories test failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// اختبار إنشاء منتج (اختياري)
async function testCreateProduct() {
  try {
    const testProduct = {
      name: {
        en: `Test Product ${Date.now()}`,
        ar: `منتج تجريبي ${Date.now()}`
      },
      description: {
        en: 'Automated test product',
        ar: 'منتج اختبار آلي'
      },
      price: 99.99,
      size: '50ml',
      category: 'floral',
      stock: 5,
      inStock: true,
      featured: false
    };
    
    const response = await axios.post(`${API_BASE}/products`, testProduct, {
      headers: getAuthHeaders()
    });
    
    const created = response.data.data.product || response.data.data;
    log.success(`Product created: ${created._id}`);
    
    // حذف المنتج التجريبي
    try {
      await axios.delete(`${API_BASE}/products/${created._id}`, {
        headers: getAuthHeaders()
      });
      log.info('Test product cleaned up');
    } catch (cleanupError) {
      log.warning('Could not clean up test product');
    }
    
    return true;
  } catch (error) {
    log.error(`Create product test failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// الاختبار الرئيسي
async function runTests() {
  log.header('🚀 MAISON DARIN ADMIN DASHBOARD TEST / اختبار لوحة تحكم ميزون دارين');
  
  const startTime = Date.now();
  const tests = [];
  
  // اختبارات أساسية
  log.header('📡 Basic Connectivity Tests / اختبارات الاتصال الأساسية');
  tests.push({ name: 'Server Connection', result: await testConnection() });
  tests.push({ name: 'Admin Login', result: await login() });
  
  if (!authToken) {
    log.error('Cannot continue without authentication');
    process.exit(1);
  }
  
  // اختبارات البيانات
  log.header('📊 Data Access Tests / اختبارات الوصول للبيانات');
  tests.push({ name: 'Products API', result: await testProducts() });
  tests.push({ name: 'Orders API', result: await testOrders() });
  tests.push({ name: 'Dashboard API', result: await testDashboard() });
  tests.push({ name: 'Categories API', result: await testCategories() });
  
  // اختبارات العمليات (اختيارية)
  if (process.argv.includes('--full')) {
    log.header('🔧 Operations Tests / اختبارات العمليات');
    tests.push({ name: 'Create Product', result: await testCreateProduct() });
  }
  
  // النتائج النهائية
  const totalTime = Date.now() - startTime;
  const passed = tests.filter(t => t.result).length;
  const failed = tests.length - passed;
  const successRate = ((passed / tests.length) * 100).toFixed(1);
  
  log.header('📈 FINAL RESULTS / النتائج النهائية');
  console.log(`⏱️  Total Time / الوقت الإجمالي: ${totalTime}ms`);
  console.log(`✅ Passed / نجح: ${passed}`);
  console.log(`❌ Failed / فشل: ${failed}`);
  console.log(`📊 Success Rate / معدل النجاح: ${successRate}%`);
  
  // تفاصيل النتائج
  console.log('\n📋 Test Details / تفاصيل الاختبارات:');
  tests.forEach((test, index) => {
    const icon = test.result ? '✅' : '❌';
    console.log(`${index + 1}. ${icon} ${test.name}`);
  });
  
  // التوصيات
  console.log('\n💡 Recommendations / التوصيات:');
  if (failed === 0) {
    log.success('🎉 All tests passed! Admin dashboard is ready to use.');
    log.success('🎉 جميع الاختبارات نجحت! لوحة التحكم جاهزة للاستخدام.');
  } else {
    log.warning(`🔧 Please fix ${failed} failing test(s) before using the admin dashboard.`);
    log.warning(`🔧 يرجى إصلاح ${failed} اختبار فاشل قبل استخدام لوحة التحكم.`);
  }
  
  console.log('\n🌐 Access URLs / روابط الوصول:');
  console.log(`   Frontend: http://localhost:5173/admin`);
  console.log(`   Backend:  ${API_BASE}`);
  console.log(`   Login:    ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  
  process.exit(failed > 0 ? 1 : 0);
}

// معالجة الأخطاء
process.on('unhandledRejection', (error) => {
  log.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});

// تشغيل الاختبار
if (require.main === module) {
  console.log('🎯 Starting Admin Dashboard Test...\n');
  
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
Usage: node test-admin.js [options]

Options:
  --full    Run full tests including create/update operations
  --help    Show this help message

Examples:
  node test-admin.js          # Quick test
  node test-admin.js --full   # Full test with operations
    `);
    process.exit(0);
  }
  
  runTests().catch(error => {
    log.error(`Test suite failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runTests, testConnection, testProducts, testOrders, testDashboard };
