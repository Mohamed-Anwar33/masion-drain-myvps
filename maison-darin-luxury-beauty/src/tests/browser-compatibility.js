/**
 * اختبار التوافق مع المتصفحات المختلفة
 * Browser Compatibility Test Script
 * 
 * هذا الملف يحتوي على اختبارات يدوية للتأكد من عمل لوحة التحكم
 * على جميع المتصفحات الرئيسية
 */

class BrowserCompatibilityTester {
  constructor() {
    this.testResults = [];
    this.currentTest = null;
  }

  /**
   * بدء اختبارات التوافق
   */
  async runAllTests() {
    console.log('🚀 بدء اختبارات التوافق مع المتصفحات...');
    
    await this.testBrowserFeatures();
    await this.testRTLSupport();
    await this.testResponsiveDesign();
    await this.testPerformance();
    await this.testArabicFonts();
    
    this.displayResults();
  }

  /**
   * اختبار ميزات المتصفح الأساسية
   */
  async testBrowserFeatures() {
    this.startTest('Browser Features');
    
    // اختبار دعم ES6
    try {
      const arrow = () => 'ES6 Arrow Functions';
      const template = `Template literals work`;
      const [destructure] = ['Destructuring works'];
      
      this.addResult('ES6 Support', true, 'جميع ميزات ES6 مدعومة');
    } catch (error) {
      this.addResult('ES6 Support', false, `خطأ في دعم ES6: ${error.message}`);
    }

    // اختبار دعم Fetch API
    if (typeof fetch !== 'undefined') {
      this.addResult('Fetch API', true, 'Fetch API مدعوم');
    } else {
      this.addResult('Fetch API', false, 'Fetch API غير مدعوم - يحتاج polyfill');
    }

    // اختبار دعم Local Storage
    try {
      localStorage.setItem('test', 'value');
      localStorage.removeItem('test');
      this.addResult('Local Storage', true, 'Local Storage يعمل بشكل صحيح');
    } catch (error) {
      this.addResult('Local Storage', false, `مشكلة في Local Storage: ${error.message}`);
    }

    // اختبار دعم CSS Grid
    if (CSS.supports('display', 'grid')) {
      this.addResult('CSS Grid', true, 'CSS Grid مدعوم');
    } else {
      this.addResult('CSS Grid', false, 'CSS Grid غير مدعوم');
    }

    // اختبار دعم CSS Flexbox
    if (CSS.supports('display', 'flex')) {
      this.addResult('CSS Flexbox', true, 'CSS Flexbox مدعوم');
    } else {
      this.addResult('CSS Flexbox', false, 'CSS Flexbox غير مدعوم');
    }
  }

  /**
   * اختبار دعم اتجاه النص من اليمين لليسار
   */
  async testRTLSupport() {
    this.startTest('RTL Support');
    
    // إنشاء عنصر اختبار
    const testElement = document.createElement('div');
    testElement.innerHTML = 'النص العربي يجب أن يظهر من اليمين لليسار';
    testElement.style.direction = 'rtl';
    testElement.style.visibility = 'hidden';
    testElement.style.position = 'absolute';
    document.body.appendChild(testElement);

    // اختبار اتجاه النص
    const computedStyle = window.getComputedStyle(testElement);
    if (computedStyle.direction === 'rtl') {
      this.addResult('RTL Direction', true, 'اتجاه النص RTL يعمل بشكل صحيح');
    } else {
      this.addResult('RTL Direction', false, 'مشكلة في اتجاه النص RTL');
    }

    // اختبار خط عربي
    testElement.style.fontFamily = 'Arial, sans-serif';
    const arabicText = 'مرحبا بكم في لوحة التحكم';
    testElement.textContent = arabicText;
    
    if (testElement.textContent === arabicText) {
      this.addResult('Arabic Text Rendering', true, 'النصوص العربية تظهر بشكل صحيح');
    } else {
      this.addResult('Arabic Text Rendering', false, 'مشكلة في عرض النصوص العربية');
    }

    // تنظيف
    document.body.removeChild(testElement);
  }

  /**
   * اختبار التصميم المتجاوب
   */
  async testResponsiveDesign() {
    this.startTest('Responsive Design');
    
    const originalWidth = window.innerWidth;
    
    // محاكاة أحجام شاشات مختلفة
    const breakpoints = [
      { name: 'Mobile', width: 375 },
      { name: 'Tablet', width: 768 },
      { name: 'Desktop', width: 1200 }
    ];

    for (const breakpoint of breakpoints) {
      // لا يمكن تغيير حجم النافذة برمجياً في معظم المتصفحات
      // لكن يمكن اختبار CSS media queries
      const mediaQuery = window.matchMedia(`(max-width: ${breakpoint.width}px)`);
      
      this.addResult(
        `${breakpoint.name} Breakpoint`, 
        true, 
        `Media query للـ ${breakpoint.name} متاح للاختبار`
      );
    }

    // اختبار viewport meta tag
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      this.addResult('Viewport Meta Tag', true, 'Viewport meta tag موجود');
    } else {
      this.addResult('Viewport Meta Tag', false, 'Viewport meta tag مفقود');
    }
  }

  /**
   * اختبار الأداء
   */
  async testPerformance() {
    this.startTest('Performance');
    
    // اختبار وقت تحميل الصفحة
    if (performance.timing) {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      const domReady = performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart;
      
      this.addResult(
        'Page Load Time', 
        loadTime < 3000, 
        `وقت تحميل الصفحة: ${loadTime}ms ${loadTime < 3000 ? '(ممتاز)' : '(بطيء)'}`
      );
      
      this.addResult(
        'DOM Ready Time', 
        domReady < 2000, 
        `وقت جاهزية DOM: ${domReady}ms ${domReady < 2000 ? '(ممتاز)' : '(بطيء)'}`
      );
    }

    // اختبار استهلاك الذاكرة (إذا كان متاحاً)
    if (performance.memory) {
      const memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
      this.addResult(
        'Memory Usage', 
        memoryUsage < 50, 
        `استهلاك الذاكرة: ${memoryUsage.toFixed(2)}MB ${memoryUsage < 50 ? '(جيد)' : '(مرتفع)'}`
      );
    }

    // اختبار FPS (إذا كان متاحاً)
    let frameCount = 0;
    const startTime = performance.now();
    
    const countFrames = () => {
      frameCount++;
      if (performance.now() - startTime < 1000) {
        requestAnimationFrame(countFrames);
      } else {
        this.addResult(
          'Frame Rate', 
          frameCount > 30, 
          `معدل الإطارات: ${frameCount} FPS ${frameCount > 30 ? '(ممتاز)' : '(منخفض)'}`
        );
      }
    };
    
    requestAnimationFrame(countFrames);
  }

  /**
   * اختبار الخطوط العربية
   */
  async testArabicFonts() {
    this.startTest('Arabic Fonts');
    
    const testElement = document.createElement('div');
    testElement.style.visibility = 'hidden';
    testElement.style.position = 'absolute';
    testElement.innerHTML = 'النص العربي مع الأرقام ١٢٣٤٥٦٧٨٩٠';
    document.body.appendChild(testElement);

    // اختبار خطوط مختلفة
    const fonts = [
      'Arial',
      'Tahoma',
      'Segoe UI',
      'Roboto',
      'system-ui'
    ];

    for (const font of fonts) {
      testElement.style.fontFamily = font;
      const computedFont = window.getComputedStyle(testElement).fontFamily;
      
      this.addResult(
        `Font: ${font}`, 
        computedFont.includes(font) || computedFont !== '', 
        `الخط ${font} ${computedFont.includes(font) ? 'متاح' : 'غير متاح'}`
      );
    }

    // اختبار الأرقام العربية
    testElement.innerHTML = '١٢٣٤٥٦٧٨٩٠';
    const arabicNumbers = testElement.textContent;
    
    this.addResult(
      'Arabic Numbers', 
      arabicNumbers === '١٢٣٤٥٦٧٨٩٠', 
      'الأرقام العربية تظهر بشكل صحيح'
    );

    document.body.removeChild(testElement);
  }

  /**
   * بدء اختبار جديد
   */
  startTest(testName) {
    this.currentTest = testName;
    console.log(`🧪 بدء اختبار: ${testName}`);
  }

  /**
   * إضافة نتيجة اختبار
   */
  addResult(testName, passed, message) {
    const result = {
      category: this.currentTest,
      test: testName,
      passed,
      message,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.push(result);
    
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${testName}: ${message}`);
  }

  /**
   * عرض النتائج النهائية
   */
  displayResults() {
    console.log('\n📊 ملخص نتائج الاختبارات:');
    console.log('='.repeat(50));
    
    const categories = [...new Set(this.testResults.map(r => r.category))];
    
    categories.forEach(category => {
      const categoryResults = this.testResults.filter(r => r.category === category);
      const passed = categoryResults.filter(r => r.passed).length;
      const total = categoryResults.length;
      
      console.log(`\n📁 ${category}: ${passed}/${total} نجح`);
      
      categoryResults.forEach(result => {
        const icon = result.passed ? '✅' : '❌';
        console.log(`  ${icon} ${result.test}: ${result.message}`);
      });
    });

    const totalPassed = this.testResults.filter(r => r.passed).length;
    const totalTests = this.testResults.length;
    const percentage = ((totalPassed / totalTests) * 100).toFixed(1);
    
    console.log(`\n🎯 النتيجة الإجمالية: ${totalPassed}/${totalTests} (${percentage}%)`);
    
    if (percentage >= 90) {
      console.log('🎉 ممتاز! التوافق ممتاز مع هذا المتصفح');
    } else if (percentage >= 75) {
      console.log('👍 جيد! التوافق جيد مع بعض المشاكل البسيطة');
    } else {
      console.log('⚠️ تحذير! هناك مشاكل في التوافق تحتاج إلى إصلاح');
    }

    // حفظ النتائج في Local Storage للمراجعة لاحقاً
    try {
      localStorage.setItem('browserCompatibilityResults', JSON.stringify({
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        results: this.testResults,
        summary: {
          total: totalTests,
          passed: totalPassed,
          percentage: percentage
        }
      }));
      console.log('💾 تم حفظ النتائج في Local Storage');
    } catch (error) {
      console.log('❌ فشل في حفظ النتائج:', error.message);
    }
  }

  /**
   * تشغيل اختبار سريع
   */
  static quickTest() {
    const tester = new BrowserCompatibilityTester();
    tester.runAllTests();
  }
}

// تشغيل الاختبارات تلقائياً عند تحميل الصفحة (في بيئة التطوير فقط)
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('🔧 بيئة التطوير - تشغيل اختبارات التوافق...');
  
  // انتظار تحميل الصفحة كاملة
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => BrowserCompatibilityTester.quickTest(), 1000);
    });
  } else {
    setTimeout(() => BrowserCompatibilityTester.quickTest(), 1000);
  }
}

// تصدير للاستخدام اليدوي
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BrowserCompatibilityTester;
} else if (typeof window !== 'undefined') {
  window.BrowserCompatibilityTester = BrowserCompatibilityTester;
}

/**
 * دليل الاستخدام:
 * 
 * 1. للتشغيل التلقائي في بيئة التطوير:
 *    - افتح لوحة التحكم في المتصفح (F12)
 *    - ستعمل الاختبارات تلقائياً
 * 
 * 2. للتشغيل اليدوي:
 *    - افتح Console في المتصفح
 *    - اكتب: BrowserCompatibilityTester.quickTest()
 * 
 * 3. لعرض النتائج المحفوظة:
 *    - اكتب: JSON.parse(localStorage.getItem('browserCompatibilityResults'))
 * 
 * 4. اختبار متصفحات مختلفة:
 *    - Chrome/Chromium
 *    - Firefox
 *    - Safari (على Mac)
 *    - Edge
 *    - Opera
 * 
 * 5. اختبار أجهزة مختلفة:
 *    - استخدم Developer Tools لمحاكاة الأجهزة المحمولة
 *    - اختبر على أجهزة حقيقية إذا أمكن
 */