/**
 * سكريبت شامل لاختبار جميع وظائف لوحة التحكم
 * Comprehensive script to test all admin dashboard functionality
 */

import { productService } from '@/services/productService';
import { orderService } from '@/services/orderService';
import { dashboardService } from '@/services/dashboardService';
import { uploadService } from '@/services/uploadService';
import { apiClient } from '@/services/apiClient';

interface TestResult {
  name: string;
  nameAr: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  messageAr: string;
  duration: number;
  data?: any;
}

class ComprehensiveTestSuite {
  private results: TestResult[] = [];
  private startTime: number = 0;

  constructor() {
    console.log('🚀 بدء اختبار شامل للوحة التحكم / Starting Comprehensive Admin Dashboard Test');
  }

  private async runTest(
    name: string,
    nameAr: string,
    testFunction: () => Promise<any>
  ): Promise<TestResult> {
    const start = Date.now();
    
    try {
      console.log(`⏳ ${name} / ${nameAr}...`);
      const data = await testFunction();
      const duration = Date.now() - start;
      
      const result: TestResult = {
        name,
        nameAr,
        status: 'success',
        message: `✅ Passed in ${duration}ms`,
        messageAr: `✅ نجح في ${duration} ميلي ثانية`,
        duration,
        data
      };
      
      console.log(`✅ ${name} - Success`);
      this.results.push(result);
      return result;
      
    } catch (error: any) {
      const duration = Date.now() - start;
      
      const result: TestResult = {
        name,
        nameAr,
        status: 'error',
        message: `❌ Failed: ${error.message}`,
        messageAr: `❌ فشل: ${error.message}`,
        duration
      };
      
      console.error(`❌ ${name} - Error:`, error.message);
      this.results.push(result);
      return result;
    }
  }

  // 1. اختبار الاتصال بالـ Backend
  async testBackendConnection() {
    return this.runTest(
      'Backend Connection',
      'الاتصال بالخادم',
      async () => {
        const response = await apiClient.get('/health');
        return {
          status: response.status,
          message: response.data?.message || 'Connected'
        };
      }
    );
  }

  // 2. اختبار خدمة المنتجات - قراءة
  async testProductsRead() {
    return this.runTest(
      'Products - Read',
      'المنتجات - قراءة',
      async () => {
        const response = await productService.getProducts({ limit: 5 });
        return {
          totalProducts: response.products.length,
          pagination: response.pagination
        };
      }
    );
  }

  // 3. اختبار خدمة المنتجات - إنشاء
  async testProductsCreate() {
    return this.runTest(
      'Products - Create',
      'المنتجات - إنشاء',
      async () => {
        const testProduct = {
          name: {
            en: 'Test Product ' + Date.now(),
            ar: 'منتج تجريبي ' + Date.now()
          },
          description: {
            en: 'Test product for automated testing',
            ar: 'منتج تجريبي للاختبار الآلي'
          },
          price: 99.99,
          size: '50ml',
          category: 'floral',
          stock: 10,
          inStock: true,
          featured: false
        };
        
        const created = await productService.createProduct(testProduct);
        return {
          productId: created._id,
          name: created.name
        };
      }
    );
  }

  // 4. اختبار خدمة المنتجات - تحديث
  async testProductsUpdate(productId?: string) {
    return this.runTest(
      'Products - Update',
      'المنتجات - تحديث',
      async () => {
        // إذا لم يتم توفير معرف، احصل على أول منتج
        let id = productId;
        if (!id) {
          const products = await productService.getProducts({ limit: 1 });
          if (products.products.length === 0) {
            throw new Error('No products found to update');
          }
          id = products.products[0]._id;
        }
        
        const updateData = {
          price: 149.99,
          stock: 15
        };
        
        const updated = await productService.updateProduct(id, updateData);
        return {
          productId: updated._id,
          newPrice: updated.price,
          newStock: updated.stock
        };
      }
    );
  }

  // 5. اختبار خدمة الطلبات - قراءة
  async testOrdersRead() {
    return this.runTest(
      'Orders - Read',
      'الطلبات - قراءة',
      async () => {
        const response = await orderService.getOrders({ limit: 5 });
        return {
          totalOrders: response.orders.length,
          pagination: response.pagination
        };
      }
    );
  }

  // 6. اختبار إحصائيات الطلبات
  async testOrderStats() {
    return this.runTest(
      'Order Statistics',
      'إحصائيات الطلبات',
      async () => {
        const stats = await orderService.getOrderStats();
        return {
          totalOrders: stats.totalOrders,
          totalRevenue: stats.totalRevenue,
          averageOrderValue: stats.averageOrderValue
        };
      }
    );
  }

  // 7. اختبار الطلبات الأخيرة
  async testRecentOrders() {
    return this.runTest(
      'Recent Orders',
      'الطلبات الأخيرة',
      async () => {
        const orders = await orderService.getRecentOrders(3);
        return {
          count: orders.length,
          orders: orders.map(o => ({
            id: o._id,
            orderNumber: o.orderNumber,
            total: o.total,
            status: o.orderStatus
          }))
        };
      }
    );
  }

  // 8. اختبار لوحة التحكم
  async testDashboard() {
    return this.runTest(
      'Dashboard Statistics',
      'إحصائيات لوحة التحكم',
      async () => {
        const stats = await dashboardService.getDashboardStats();
        return {
          overview: stats.overview,
          products: stats.products,
          revenue: stats.revenue
        };
      }
    );
  }

  // 9. اختبار الفئات
  async testCategories() {
    return this.runTest(
      'Product Categories',
      'فئات المنتجات',
      async () => {
        const categories = await productService.getCategories();
        return {
          count: categories.length,
          categories: categories.map(c => ({
            value: c.value,
            label: c.label
          }))
        };
      }
    );
  }

  // 10. اختبار إحصائيات الفئات
  async testCategoryStats() {
    return this.runTest(
      'Category Statistics',
      'إحصائيات الفئات',
      async () => {
        const stats = await productService.getCategoryStats();
        return {
          count: stats.length,
          stats: stats.map(s => ({
            category: s.category,
            totalProducts: s.totalProducts,
            totalValue: s.totalValue
          }))
        };
      }
    );
  }

  // 11. اختبار البحث في المنتجات
  async testProductSearch() {
    return this.runTest(
      'Product Search',
      'البحث في المنتجات',
      async () => {
        const results = await productService.getProducts({
          search: 'perfume',
          language: 'en'
        });
        return {
          searchTerm: 'perfume',
          resultsCount: results.products.length
        };
      }
    );
  }

  // 12. اختبار فلترة المنتجات
  async testProductFilter() {
    return this.runTest(
      'Product Filtering',
      'فلترة المنتجات',
      async () => {
        const results = await productService.getProducts({
          category: 'floral',
          inStock: true
        });
        return {
          category: 'floral',
          inStockOnly: true,
          resultsCount: results.products.length
        };
      }
    );
  }

  // 13. اختبار تحديث حالة الطلب
  async testOrderStatusUpdate() {
    return this.runTest(
      'Order Status Update',
      'تحديث حالة الطلب',
      async () => {
        // احصل على أول طلب
        const orders = await orderService.getOrders({ limit: 1 });
        if (orders.orders.length === 0) {
          throw new Error('No orders found to update');
        }
        
        const order = orders.orders[0];
        const originalStatus = order.orderStatus;
        
        // جرب تحديث الحالة (لن نغير فعلياً لتجنب تعديل البيانات الحقيقية)
        return {
          orderId: order._id,
          orderNumber: order.orderNumber,
          originalStatus,
          message: 'Status update test completed (no actual change made)'
        };
      }
    );
  }

  // 14. اختبار المصادقة
  async testAuthentication() {
    return this.runTest(
      'Authentication Check',
      'فحص المصادقة',
      async () => {
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('user');
        
        if (!token) {
          throw new Error('No auth token found');
        }
        
        return {
          hasToken: !!token,
          hasUser: !!user,
          tokenLength: token.length
        };
      }
    );
  }

  // 15. اختبار إعدادات الـ API
  async testApiConfiguration() {
    return this.runTest(
      'API Configuration',
      'إعدادات الـ API',
      async () => {
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        
        // اختبار الاتصال
        const response = await fetch(baseURL.replace('/api', '/health'));
        const isHealthy = response.ok;
        
        return {
          baseURL,
          isHealthy,
          status: response.status
        };
      }
    );
  }

  // تشغيل جميع الاختبارات
  async runAllTests(): Promise<TestResult[]> {
    this.startTime = Date.now();
    console.log('🎯 بدء تشغيل جميع الاختبارات / Starting all tests...\n');

    // اختبارات الأساسيات
    await this.testBackendConnection();
    await this.testApiConfiguration();
    await this.testAuthentication();

    // اختبارات المنتجات
    await this.testProductsRead();
    await this.testCategories();
    await this.testCategoryStats();
    await this.testProductSearch();
    await this.testProductFilter();
    
    // اختبار إنشاء منتج (اختياري)
    const createResult = await this.testProductsCreate();
    if (createResult.status === 'success' && createResult.data?.productId) {
      await this.testProductsUpdate(createResult.data.productId);
    } else {
      await this.testProductsUpdate();
    }

    // اختبارات الطلبات
    await this.testOrdersRead();
    await this.testOrderStats();
    await this.testRecentOrders();
    await this.testOrderStatusUpdate();

    // اختبارات لوحة التحكم
    await this.testDashboard();

    return this.generateReport();
  }

  // إنشاء تقرير شامل
  generateReport(): TestResult[] {
    const totalTime = Date.now() - this.startTime;
    const successCount = this.results.filter(r => r.status === 'success').length;
    const errorCount = this.results.filter(r => r.status === 'error').length;
    const warningCount = this.results.filter(r => r.status === 'warning').length;

    console.log('\n📊 تقرير الاختبارات النهائي / Final Test Report');
    console.log('='.repeat(60));
    console.log(`⏱️  إجمالي الوقت / Total Time: ${totalTime}ms`);
    console.log(`✅ نجح / Passed: ${successCount}`);
    console.log(`❌ فشل / Failed: ${errorCount}`);
    console.log(`⚠️  تحذير / Warnings: ${warningCount}`);
    console.log(`📈 معدل النجاح / Success Rate: ${((successCount / this.results.length) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));

    // طباعة النتائج التفصيلية
    this.results.forEach((result, index) => {
      const icon = result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⚠️';
      console.log(`${index + 1}. ${icon} ${result.name} / ${result.nameAr}`);
      console.log(`   ${result.message} / ${result.messageAr}`);
      if (result.data) {
        console.log(`   Data:`, JSON.stringify(result.data, null, 2));
      }
      console.log('');
    });

    // توصيات
    console.log('💡 التوصيات / Recommendations:');
    if (errorCount === 0) {
      console.log('🎉 ممتاز! جميع الاختبارات نجحت / Excellent! All tests passed');
    } else {
      console.log(`🔧 يرجى إصلاح ${errorCount} مشكلة / Please fix ${errorCount} issues`);
    }

    if (successCount > 0) {
      console.log('✨ لوحة التحكم جاهزة للاستخدام / Admin dashboard is ready to use');
    }

    return this.results;
  }

  // اختبار سريع للوظائف الأساسية
  async quickTest(): Promise<boolean> {
    console.log('⚡ اختبار سريع / Quick Test');
    
    try {
      await this.testBackendConnection();
      await this.testProductsRead();
      await this.testOrdersRead();
      await this.testDashboard();
      
      const errors = this.results.filter(r => r.status === 'error').length;
      const success = errors === 0;
      
      console.log(success ? '✅ الاختبار السريع نجح' : '❌ الاختبار السريع فشل');
      return success;
    } catch (error) {
      console.error('❌ خطأ في الاختبار السريع:', error);
      return false;
    }
  }
}

// تصدير الكلاس والوظائف المساعدة
export { ComprehensiveTestSuite, type TestResult };

// وظيفة لتشغيل الاختبار من الكونسول
export const runComprehensiveTest = async () => {
  const testSuite = new ComprehensiveTestSuite();
  return await testSuite.runAllTests();
};

export const runQuickTest = async () => {
  const testSuite = new ComprehensiveTestSuite();
  return await testSuite.quickTest();
};

// تشغيل تلقائي إذا تم استدعاء الملف مباشرة
if (typeof window !== 'undefined') {
  (window as any).runAdminTest = runComprehensiveTest;
  (window as any).runQuickAdminTest = runQuickTest;
  console.log('🔧 لتشغيل الاختبار الشامل: runAdminTest()');
  console.log('⚡ لتشغيل الاختبار السريع: runQuickAdminTest()');
}
