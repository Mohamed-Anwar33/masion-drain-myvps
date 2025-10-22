/**
 * مراقب الأداء - Performance Monitor
 * 
 * هذا الملف يحتوي على أدوات مراقبة الأداء في الوقت الفعلي
 * لضمان أن لوحة التحكم تعمل بسرعة مقبولة
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'load' | 'runtime' | 'memory' | 'network';
  threshold?: number;
  unit: string;
}

interface PerformanceReport {
  timestamp: string;
  userAgent: string;
  metrics: PerformanceMetric[];
  warnings: string[];
  recommendations: string[];
  overallScore: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private isMonitoring = false;

  constructor() {
    this.setupPerformanceObservers();
  }

  /**
   * بدء مراقبة الأداء
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🚀 بدء مراقبة الأداء...');
    
    // مراقبة أوقات التحميل
    this.measureLoadTimes();
    
    // مراقبة استهلاك الذاكرة
    this.monitorMemoryUsage();
    
    // مراقبة أداء الشبكة
    this.monitorNetworkPerformance();
    
    // مراقبة أداء وقت التشغيل
    this.monitorRuntimePerformance();
  }

  /**
   * إيقاف مراقبة الأداء
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    console.log('⏹️ تم إيقاف مراقبة الأداء');
  }

  /**
   * إعداد مراقبي الأداء
   */
  private setupPerformanceObservers(): void {
    if (!('PerformanceObserver' in window)) {
      console.warn('⚠️ PerformanceObserver غير مدعوم في هذا المتصفح');
      return;
    }

    // مراقب أوقات التنقل
    try {
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'navigation') {
            this.processNavigationEntry(entry as PerformanceNavigationTiming);
          }
        });
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);
    } catch (error) {
      console.warn('⚠️ فشل في إعداد مراقب التنقل:', error);
    }

    // مراقب الموارد
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'resource') {
            this.processResourceEntry(entry as PerformanceResourceTiming);
          }
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (error) {
      console.warn('⚠️ فشل في إعداد مراقب الموارد:', error);
    }

    // مراقب الطلاء الأول
    try {
      const paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.addMetric({
            name: entry.name,
            value: entry.startTime,
            timestamp: Date.now(),
            category: 'load',
            threshold: entry.name === 'first-contentful-paint' ? 2000 : 1000,
            unit: 'ms'
          });
        });
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);
    } catch (error) {
      console.warn('⚠️ فشل في إعداد مراقب الطلاء:', error);
    }
  }

  /**
   * قياس أوقات التحميل
   */
  private measureLoadTimes(): void {
    if (!performance.timing) return;

    const timing = performance.timing;
    const navigationStart = timing.navigationStart;

    // وقت تحميل DOM
    const domContentLoaded = timing.domContentLoadedEventEnd - navigationStart;
    this.addMetric({
      name: 'DOM Content Loaded',
      value: domContentLoaded,
      timestamp: Date.now(),
      category: 'load',
      threshold: 2000,
      unit: 'ms'
    });

    // وقت تحميل الصفحة كاملة
    const pageLoad = timing.loadEventEnd - navigationStart;
    if (pageLoad > 0) {
      this.addMetric({
        name: 'Page Load Complete',
        value: pageLoad,
        timestamp: Date.now(),
        category: 'load',
        threshold: 3000,
        unit: 'ms'
      });
    }

    // وقت الاستجابة الأولى
    const responseTime = timing.responseEnd - timing.requestStart;
    this.addMetric({
      name: 'Server Response Time',
      value: responseTime,
      timestamp: Date.now(),
      category: 'network',
      threshold: 500,
      unit: 'ms'
    });
  }

  /**
   * مراقبة استهلاك الذاكرة
   */
  private monitorMemoryUsage(): void {
    if (!('memory' in performance)) {
      console.warn('⚠️ معلومات الذاكرة غير متاحة في هذا المتصفح');
      return;
    }

    const checkMemory = () => {
      if (!this.isMonitoring) return;

      const memory = (performance as any).memory;
      
      // الذاكرة المستخدمة
      const usedMemory = memory.usedJSHeapSize / 1024 / 1024; // MB
      this.addMetric({
        name: 'Used Memory',
        value: usedMemory,
        timestamp: Date.now(),
        category: 'memory',
        threshold: 50,
        unit: 'MB'
      });

      // إجمالي الذاكرة المخصصة
      const totalMemory = memory.totalJSHeapSize / 1024 / 1024; // MB
      this.addMetric({
        name: 'Total Allocated Memory',
        value: totalMemory,
        timestamp: Date.now(),
        category: 'memory',
        threshold: 100,
        unit: 'MB'
      });

      // نسبة استخدام الذاكرة
      const memoryUsagePercent = (usedMemory / totalMemory) * 100;
      this.addMetric({
        name: 'Memory Usage Percentage',
        value: memoryUsagePercent,
        timestamp: Date.now(),
        category: 'memory',
        threshold: 80,
        unit: '%'
      });

      setTimeout(checkMemory, 5000); // فحص كل 5 ثواني
    };

    setTimeout(checkMemory, 1000);
  }

  /**
   * مراقبة أداء الشبكة
   */
  private monitorNetworkPerformance(): void {
    // مراقبة طلبات API
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        const url = typeof args[0] === 'string' ? args[0] : args[0].url;
        
        this.addMetric({
          name: `API Request: ${this.getApiEndpoint(url)}`,
          value: duration,
          timestamp: Date.now(),
          category: 'network',
          threshold: 1000,
          unit: 'ms'
        });

        // تسجيل الأخطاء
        if (!response.ok) {
          console.warn(`⚠️ طلب API فاشل: ${url} - ${response.status}`);
        }

        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        console.error('❌ خطأ في طلب API:', error);
        
        this.addMetric({
          name: `API Error: ${this.getApiEndpoint(args[0] as string)}`,
          value: duration,
          timestamp: Date.now(),
          category: 'network',
          threshold: 1000,
          unit: 'ms'
        });

        throw error;
      }
    };
  }

  /**
   * مراقبة أداء وقت التشغيل
   */
  private monitorRuntimePerformance(): void {
    let frameCount = 0;
    let lastTime = performance.now();

    const measureFPS = () => {
      if (!this.isMonitoring) return;

      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        this.addMetric({
          name: 'Frame Rate (FPS)',
          value: frameCount,
          timestamp: Date.now(),
          category: 'runtime',
          threshold: 30,
          unit: 'fps'
        });

        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }

  /**
   * معالجة إدخال التنقل
   */
  private processNavigationEntry(entry: PerformanceNavigationTiming): void {
    // وقت DNS
    const dnsTime = entry.domainLookupEnd - entry.domainLookupStart;
    if (dnsTime > 0) {
      this.addMetric({
        name: 'DNS Lookup Time',
        value: dnsTime,
        timestamp: Date.now(),
        category: 'network',
        threshold: 100,
        unit: 'ms'
      });
    }

    // وقت الاتصال
    const connectTime = entry.connectEnd - entry.connectStart;
    if (connectTime > 0) {
      this.addMetric({
        name: 'Connection Time',
        value: connectTime,
        timestamp: Date.now(),
        category: 'network',
        threshold: 200,
        unit: 'ms'
      });
    }

    // وقت تحميل المحتوى
    const contentLoadTime = entry.responseEnd - entry.responseStart;
    this.addMetric({
      name: 'Content Download Time',
      value: contentLoadTime,
      timestamp: Date.now(),
      category: 'network',
      threshold: 500,
      unit: 'ms'
    });
  }

  /**
   * معالجة إدخال المورد
   */
  private processResourceEntry(entry: PerformanceResourceTiming): void {
    const duration = entry.responseEnd - entry.startTime;
    const resourceType = this.getResourceType(entry.name);
    
    // تسجيل الموارد البطيئة فقط
    if (duration > 100) {
      this.addMetric({
        name: `Resource Load: ${resourceType}`,
        value: duration,
        timestamp: Date.now(),
        category: 'network',
        threshold: resourceType === 'image' ? 1000 : 500,
        unit: 'ms'
      });
    }
  }

  /**
   * إضافة مقياس أداء
   */
  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // تحذير إذا تجاوز العتبة
    if (metric.threshold && metric.value > metric.threshold) {
      const warning = `⚠️ ${metric.name}: ${metric.value.toFixed(2)}${metric.unit} (العتبة: ${metric.threshold}${metric.unit})`;
      console.warn(warning);
    }

    // الاحتفاظ بآخر 1000 مقياس فقط
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * الحصول على نوع المورد
   */
  private getResourceType(url: string): string {
    if (url.includes('/api/')) return 'api';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'image';
    if (url.match(/\.(css)$/i)) return 'css';
    if (url.match(/\.(js)$/i)) return 'javascript';
    if (url.match(/\.(woff|woff2|ttf|eot)$/i)) return 'font';
    return 'other';
  }

  /**
   * الحصول على نقطة نهاية API
   */
  private getApiEndpoint(url: string): string {
    try {
      const urlObj = new URL(url, window.location.origin);
      const path = urlObj.pathname;
      
      // تبسيط المسار
      if (path.includes('/api/')) {
        const apiPath = path.split('/api/')[1];
        return apiPath.split('/')[0] || 'unknown';
      }
      
      return 'non-api';
    } catch {
      return 'invalid-url';
    }
  }

  /**
   * إنشاء تقرير الأداء
   */
  generateReport(): PerformanceReport {
    const now = new Date().toISOString();
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // تحليل المقاييس
    const categories = ['load', 'runtime', 'memory', 'network'] as const;
    let totalScore = 0;
    let scoreCount = 0;

    categories.forEach(category => {
      const categoryMetrics = this.metrics.filter(m => m.category === category);
      if (categoryMetrics.length === 0) return;

      const avgValue = categoryMetrics.reduce((sum, m) => sum + m.value, 0) / categoryMetrics.length;
      const problemMetrics = categoryMetrics.filter(m => m.threshold && m.value > m.threshold);

      if (problemMetrics.length > 0) {
        warnings.push(`${category}: ${problemMetrics.length} مقياس يتجاوز العتبة المحددة`);
      }

      // حساب النقاط (0-100)
      const categoryScore = Math.max(0, 100 - (problemMetrics.length / categoryMetrics.length) * 100);
      totalScore += categoryScore;
      scoreCount++;
    });

    const overallScore = scoreCount > 0 ? totalScore / scoreCount : 0;

    // توصيات بناءً على النتائج
    if (overallScore < 60) {
      recommendations.push('الأداء العام ضعيف - يحتاج تحسين شامل');
    } else if (overallScore < 80) {
      recommendations.push('الأداء متوسط - يمكن تحسينه');
    } else {
      recommendations.push('الأداء جيد - استمر في المراقبة');
    }

    // توصيات محددة
    const memoryMetrics = this.metrics.filter(m => m.category === 'memory');
    const highMemoryUsage = memoryMetrics.some(m => m.name.includes('Usage') && m.value > 70);
    if (highMemoryUsage) {
      recommendations.push('استهلاك الذاكرة مرتفع - تحقق من تسريبات الذاكرة');
    }

    const slowApiCalls = this.metrics.filter(m => 
      m.category === 'network' && m.name.includes('API') && m.value > 2000
    );
    if (slowApiCalls.length > 0) {
      recommendations.push('بعض طلبات API بطيئة - تحسين الخادم مطلوب');
    }

    return {
      timestamp: now,
      userAgent: navigator.userAgent,
      metrics: this.metrics,
      warnings,
      recommendations,
      overallScore: Math.round(overallScore)
    };
  }

  /**
   * طباعة تقرير الأداء
   */
  printReport(): void {
    const report = this.generateReport();
    
    console.log('\n📊 تقرير الأداء');
    console.log('='.repeat(50));
    console.log(`🕒 الوقت: ${report.timestamp}`);
    console.log(`🎯 النقاط الإجمالية: ${report.overallScore}/100`);
    
    if (report.warnings.length > 0) {
      console.log('\n⚠️ تحذيرات:');
      report.warnings.forEach(warning => console.log(`  • ${warning}`));
    }
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 توصيات:');
      report.recommendations.forEach(rec => console.log(`  • ${rec}`));
    }

    // ملخص المقاييس
    const categories = ['load', 'runtime', 'memory', 'network'] as const;
    categories.forEach(category => {
      const categoryMetrics = report.metrics.filter(m => m.category === category);
      if (categoryMetrics.length > 0) {
        console.log(`\n📈 ${category}:`);
        const recent = categoryMetrics.slice(-5); // آخر 5 مقاييس
        recent.forEach(metric => {
          const status = metric.threshold && metric.value > metric.threshold ? '❌' : '✅';
          console.log(`  ${status} ${metric.name}: ${metric.value.toFixed(2)}${metric.unit}`);
        });
      }
    });
  }

  /**
   * حفظ التقرير
   */
  saveReport(): void {
    const report = this.generateReport();
    
    try {
      localStorage.setItem('performanceReport', JSON.stringify(report));
      console.log('💾 تم حفظ تقرير الأداء');
    } catch (error) {
      console.error('❌ فشل في حفظ التقرير:', error);
    }
  }

  /**
   * الحصول على المقاييس الحالية
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * مسح المقاييس
   */
  clearMetrics(): void {
    this.metrics = [];
    console.log('🗑️ تم مسح جميع المقاييس');
  }
}

// إنشاء مثيل عام
const performanceMonitor = new PerformanceMonitor();

// تصدير للاستخدام
export default performanceMonitor;
export { PerformanceMonitor, type PerformanceMetric, type PerformanceReport };

// إتاحة في النافذة للاستخدام في Console
if (typeof window !== 'undefined') {
  (window as any).performanceMonitor = performanceMonitor;
}

/**
 * دليل الاستخدام:
 * 
 * 1. بدء المراقبة:
 *    performanceMonitor.startMonitoring()
 * 
 * 2. إيقاف المراقبة:
 *    performanceMonitor.stopMonitoring()
 * 
 * 3. عرض التقرير:
 *    performanceMonitor.printReport()
 * 
 * 4. حفظ التقرير:
 *    performanceMonitor.saveReport()
 * 
 * 5. مسح البيانات:
 *    performanceMonitor.clearMetrics()
 */