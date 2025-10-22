const axios = require('axios');

async function testAPI() {
  try {
    console.log('🔐 اختبار تسجيل دخول الأدمن...');
    
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@maisondarin.com',
      password: 'Admin123456#'
    });

    const token = loginResponse.data.token;
    console.log('✅ تم تسجيل الدخول بنجاح');
    console.log('🔑 Token:', token.substring(0, 20) + '...');

    console.log('\n📋 اختبار جلب الطلبات...');
    
    const ordersResponse = await axios.get('http://localhost:5000/api/orders?limit=5&sortBy=createdAt&sortOrder=desc', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ استجابة الـ API:');
    console.log('   Status:', ordersResponse.status);
    console.log('   Success:', ordersResponse.data.success);
    console.log('   عدد الطلبات:', ordersResponse.data.data ? ordersResponse.data.data.length : 0);
    
    if (ordersResponse.data.data && ordersResponse.data.data.length > 0) {
      console.log('\n📦 الطلبات المُستلمة:');
      ordersResponse.data.data.forEach((order, i) => {
        console.log(`   ${i+1}. ${order.orderNumber} - ${order.status} - ${order.paymentStatus}`);
      });
    }

    if (ordersResponse.data.pagination) {
      console.log('\n📊 معلومات الصفحات:');
      console.log('   إجمالي الطلبات:', ordersResponse.data.pagination.totalOrders);
      console.log('   الصفحة الحالية:', ordersResponse.data.pagination.currentPage);
      console.log('   إجمالي الصفحات:', ordersResponse.data.pagination.totalPages);
    }

  } catch (error) {
    console.error('❌ خطأ في الاختبار:');
    console.error('   Status:', error.response?.status);
    console.error('   Message:', error.response?.data?.message || error.message);
    console.error('   Error Code:', error.response?.data?.error?.code);
    
    if (error.response?.data) {
      console.error('   Full Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testAPI();
