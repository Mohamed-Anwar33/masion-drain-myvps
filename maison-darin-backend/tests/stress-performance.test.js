const request = require('supertest');
const app = require('../server');
const { performance } = require('perf_hooks');

describe('اختبار الأداء تحت الضغط الشديد - Stress Performance Tests', () => {
  let authToken;
  const testResults = {
    responseTime: [],
    memoryUsage: [],
    concurrentRequests: [],
    errorRates: []
  };

  beforeAll(async () => {
    // تسجيل دخول للحصول على رمز المصادقة
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });
    
    if (loginResponse.body.token) {
      authToken = loginResponse.body.token;
    }
  });

  describe('اختبار الحمولة العالية - High Load Tests', () => {
    
    test('يجب أن يتعامل مع 100 طلب متزامن', async () => {
      const concurrentRequests = 100;
      const requests = [];
      const startTime = performance.now();

      // إنشاء 100 طلب متزامن
      for (let i = 0; i < concurrentRequests; i++) {
        requests.push(
          request(app)
            .get('/api/dashboard/stats')
            .set('Authorization', `Bearer ${authToken}`)
        );
      }

      const responses = await Promise.all(requests);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // تحليل النتائج
      const successfulRequests = responses.filter(r => r.status === 200).length;
      const errorRate = ((concurrentRequests - successfulRequests) / concurrentRequests) * 100;
      const averageResponseTime = totalTime / concurrentRequests;

      console.log(`📊 نتائج اختبار 100 طلب متزامن:`);
      console.log(`   - الطلبات الناجحة: ${successfulRequests}/${concurrentRequests}`);
      console.log(`   - معدل الأخطاء: ${errorRate.toFixed(2)}%`);
      console.log(`   - متوسط وقت الاستجابة: ${averageResponseTime.toFixed(2)}ms`);
      console.log(`   - الوقت الإجمالي: ${totalTime.toFixed(2)}ms`);

      // التحقق من المعايير
      expect(successfulRequests).toBeGreaterThanOrEqual(95); // 95% نجاح على الأقل
      expect(errorRate).toBeLessThan(5); // أقل من 5% أخطاء
      expect(averageResponseTime).toBeLessThan(2000); // أقل من ثانيتين

      testResults.concurrentRequests.push({
        requests: concurrentRequests,
        successful: successfulRequests,
        errorRate,
        averageResponseTime,
        totalTime
      });
    });

    test('يجب أن يحافظ على الأداء مع طلبات متتالية', async () => {
      const sequentialRequests = 50;
      const responseTimes = [];

      console.log(`🔄 تشغيل ${sequentialRequests} طلب متتالي...`);

      for (let i = 0; i < sequentialRequests; i++) {
        const startTime = performance.now();
        
        const response = await request(app)
          .get('/api/products?limit=20')
          .set('Authorization', `Bearer ${authToken}`);
        
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        responseTimes.push(responseTime);
        
        expect(response.status).toBe(200);
        
        // طباعة تقدم كل 10 طلبات
        if ((i + 1) % 10 === 0) {
          const avgSoFar = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
          console.log(`   - الطلب ${i + 1}: ${responseTime.toFixed(2)}ms (متوسط: ${avgSoFar.toFixed(2)}ms)`);
        }
      }

      // تحليل النتائج
      const averageTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const minTime = Math.min(...responseTimes);
      const maxTime = Math.max(...responseTimes);
      const standardDeviation = Math.sqrt(
        responseTimes.reduce((sq, n) => sq + Math.pow(n - averageTime, 2), 0) / responseTimes.length
      );

      console.log(`📈 إحصائيات الطلبات المتتالية:`);
      console.log(`   - متوسط وقت الاستجابة: ${averageTime.toFixed(2)}ms`);
      console.log(`   - أسرع استجابة: ${minTime.toFixed(2)}ms`);
      console.log(`   - أبطأ استجابة: ${maxTime.toFixed(2)}ms`);
      console.log(`   - الانحراف المعياري: ${standardDeviation.toFixed(2)}ms`);

      // التحقق من الاستقرار
      expect(averageTime).toBeLessThan(1500);
      expect(maxTime).toBeLessThan(3000);
      expect(standardDeviation).toBeLessThan(500); // استقرار في الأداء

      testResults.responseTime.push({
        type: 'sequential',
        count: sequentialRequests,
        average: averageTime,
        min: minTime,
        max: maxTime,
        standardDeviation
      });
    });

    test('يجب أن يتعامل مع بيانات كبيرة الحجم', async () => {
      const largeDataSizes = [100, 500, 1000];

      for (const size of largeDataSizes) {
        const startTime = performance.now();
        
        const response = await request(app)
          .get(`/api/products?limit=${size}`)
          .set('Authorization', `Bearer ${authToken}`);
        
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        console.log(`📦 تحميل ${size} منتج: ${responseTime.toFixed(2)}ms`);

        expect(response.status).toBe(200);
        expect(responseTime).toBeLessThan(5000); // أقل من 5 ثواني

        // التحقق من حجم البيانات
        const dataSize = JSON.stringify(response.body).length;
        console.log(`   - حجم البيانات: ${(dataSize / 1024).toFixed(2)} KB`);
      }
    });
  });

  describe('اختبار استهلاك الذاكرة - Memory Usage Tests', () => {
    
    test('يجب أن يدير الذاكرة بكفاءة', async () => {
      // قياس الذاكرة قبل الاختبار
      const initialMemory = process.memoryUsage();
      console.log(`💾 استهلاك الذاكرة الأولي:`);
      console.log(`   - RSS: ${(initialMemory.rss / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   - Heap Used: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   - Heap Total: ${(initialMemory.heapTotal / 1024 / 1024).toFixed(2)} MB`);

      // تشغيل عدة طلبات لاختبار تسريب الذاكرة
      const requests = 20;
      for (let i = 0; i < requests; i++) {
        await request(app)
          .get('/api/products?limit=50')
          .set('Authorization', `Bearer ${authToken}`);
        
        await request(app)
          .get('/api/orders?limit=30')
          .set('Authorization', `Bearer ${authToken}`);
        
        await request(app)
          .get('/api/customers?limit=25')
          .set('Authorization', `Bearer ${authToken}`);
      }

      // قياس الذاكرة بعد الاختبار
      const finalMemory = process.memoryUsage();
      console.log(`💾 استهلاك الذاكرة النهائي:`);
      console.log(`   - RSS: ${(finalMemory.rss / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   - Heap Used: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   - Heap Total: ${(finalMemory.heapTotal / 1024 / 1024).toFixed(2)} MB`);

      // حساب الزيادة في استهلاك الذاكرة
      const memoryIncrease = {
        rss: (finalMemory.rss - initialMemory.rss) / 1024 / 1024,
        heapUsed: (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024,
        heapTotal: (finalMemory.heapTotal - initialMemory.heapTotal) / 1024 / 1024
      };

      console.log(`📈 زيادة استهلاك الذاكرة:`);
      console.log(`   - RSS: ${memoryIncrease.rss.toFixed(2)} MB`);
      console.log(`   - Heap Used: ${memoryIncrease.heapUsed.toFixed(2)} MB`);
      console.log(`   - Heap Total: ${memoryIncrease.heapTotal.toFixed(2)} MB`);

      // التحقق من عدم وجود تسريب كبير في الذاكرة
      expect(memoryIncrease.heapUsed).toBeLessThan(50); // أقل من 50 MB زيادة

      testResults.memoryUsage.push({
        initial: initialMemory,
        final: finalMemory,
        increase: memoryIncrease,
        requests: requests * 3
      });
    });
  });

  describe('اختبار مقاومة الأخطاء - Error Resilience Tests', () => {
    
    test('يجب أن يتعامل مع طلبات خاطئة بدون تعطل', async () => {
      const errorTests = [
        { endpoint: '/api/products/invalid-id', expectedStatus: 404 },
        { endpoint: '/api/orders/999999', expectedStatus: 404 },
        { endpoint: '/api/customers/abc', expectedStatus: 400 },
        { endpoint: '/api/nonexistent', expectedStatus: 404 }
      ];

      let errorCount = 0;
      let totalRequests = 0;

      for (const test of errorTests) {
        // تشغيل كل اختبار خطأ عدة مرات
        for (let i = 0; i < 10; i++) {
          totalRequests++;
          
          const response = await request(app)
            .get(test.endpoint)
            .set('Authorization', `Bearer ${authToken}`);

          if (response.status !== test.expectedStatus) {
            errorCount++;
            console.log(`❌ خطأ غير متوقع في ${test.endpoint}: ${response.status} (متوقع: ${test.expectedStatus})`);
          }
        }
      }

      const errorRate = (errorCount / totalRequests) * 100;
      console.log(`🛡️ معدل الأخطاء غير المتوقعة: ${errorRate.toFixed(2)}%`);

      expect(errorRate).toBeLessThan(5); // أقل من 5% أخطاء غير متوقعة

      testResults.errorRates.push({
        totalRequests,
        unexpectedErrors: errorCount,
        errorRate
      });
    });

    test('يجب أن يتعافى من الأخطاء بسرعة', async () => {
      // محاولة إرسال طلبات خاطئة ثم طلبات صحيحة
      const recoveryTests = [];

      for (let i = 0; i < 5; i++) {
        // طلب خاطئ
        const errorStart = performance.now();
        await request(app)
          .get('/api/products/invalid')
          .set('Authorization', `Bearer ${authToken}`);
        const errorEnd = performance.now();

        // طلب صحيح فوراً بعد الخطأ
        const validStart = performance.now();
        const validResponse = await request(app)
          .get('/api/products?limit=5')
          .set('Authorization', `Bearer ${authToken}`);
        const validEnd = performance.now();

        recoveryTests.push({
          errorTime: errorEnd - errorStart,
          validTime: validEnd - validStart,
          validStatus: validResponse.status
        });

        expect(validResponse.status).toBe(200);
      }

      const avgRecoveryTime = recoveryTests.reduce((sum, test) => sum + test.validTime, 0) / recoveryTests.length;
      console.log(`🔄 متوسط وقت التعافي من الأخطاء: ${avgRecoveryTime.toFixed(2)}ms`);

      expect(avgRecoveryTime).toBeLessThan(1000); // التعافي في أقل من ثانية
    });
  });

  afterAll(async () => {
    // طباعة ملخص شامل للنتائج
    console.log('\n📊 ملخص شامل لاختبارات الأداء تحت الضغط:');
    console.log('='.repeat(60));

    if (testResults.concurrentRequests.length > 0) {
      const concurrentTest = testResults.concurrentRequests[0];
      console.log(`\n🔄 الطلبات المتزامنة:`);
      console.log(`   - عدد الطلبات: ${concurrentTest.requests}`);
      console.log(`   - معدل النجاح: ${((concurrentTest.successful / concurrentTest.requests) * 100).toFixed(1)}%`);
      console.log(`   - متوسط وقت الاستجابة: ${concurrentTest.averageResponseTime.toFixed(2)}ms`);
    }

    if (testResults.responseTime.length > 0) {
      const responseTest = testResults.responseTime[0];
      console.log(`\n⏱️ أوقات الاستجابة:`);
      console.log(`   - متوسط الوقت: ${responseTest.average.toFixed(2)}ms`);
      console.log(`   - أسرع استجابة: ${responseTest.min.toFixed(2)}ms`);
      console.log(`   - أبطأ استجابة: ${responseTest.max.toFixed(2)}ms`);
      console.log(`   - الاستقرار: ${responseTest.standardDeviation.toFixed(2)}ms انحراف معياري`);
    }

    if (testResults.memoryUsage.length > 0) {
      const memoryTest = testResults.memoryUsage[0];
      console.log(`\n💾 استهلاك الذاكرة:`);
      console.log(`   - زيادة Heap: ${memoryTest.increase.heapUsed.toFixed(2)}MB`);
      console.log(`   - زيادة RSS: ${memoryTest.increase.rss.toFixed(2)}MB`);
      console.log(`   - عدد الطلبات: ${memoryTest.requests}`);
    }

    if (testResults.errorRates.length > 0) {
      const errorTest = testResults.errorRates[0];
      console.log(`\n🛡️ مقاومة الأخطاء:`);
      console.log(`   - معدل الأخطاء: ${errorTest.errorRate.toFixed(2)}%`);
      console.log(`   - إجمالي الطلبات: ${errorTest.totalRequests}`);
    }

    console.log(`\n✅ اكتملت جميع اختبارات الأداء تحت الضغط بنجاح!`);
  });
});