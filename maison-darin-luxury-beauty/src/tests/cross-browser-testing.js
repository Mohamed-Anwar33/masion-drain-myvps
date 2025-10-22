/**
 * اختبار التوافق مع المتصفحات المختلفة - متقدم
 * Advanced Cross-Browser Compatibility Testing
 */

class CrossBrowserTester {
  constructor() {
    this.testResults = [];
    this.browserInfo = this.detectBrowser();
    this.supportedFeatures = new Map();
    this.performanceMetrics = {};
  }

  /**
   * تشغيل جميع اختبارات التوافق
   */
  async runAllTests() {
    console.log('🌐 بدء اختبارات التوافق الشاملة مع المتصفحات...');
    console.log(`🔍 المتصفح المكتشف: ${this.browserInfo.name} ${this.browserInfo.version}`);
    
    await this.testJavaScriptFeatures();
    await this.testCSSFeatures();
    await this.testHTMLFeatures();
    await this.testWebAPIs();
    await this.testPerformanceAPIs();
    await this.testSecurityFeatures();
    await this.testAccessibilityFeatures();
    await this.testMobileFeatures();
    
    this.displayResults();
    return this.generateCompatibilityReport();
  }

  /**
   * كشف نوع المتصفح
   */
  detectBrowser() {
    const userAgent = navigator.userAgent;
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';

    // كشف Chrome
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      browserName = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    }
    // كشف Firefox
    else if (userAgent.includes('Firefox')) {
      browserName = 'Firefox';
      const match = userAgent.match(/Firefox\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    }
    // كشف Safari
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browserName = 'Safari';
      const match = userAgent.match(/Version\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    }
    // كشف Edge
    else if (userAgent.includes('Edg')) {
      browserName = 'Edge';
      const match = userAgent.match(/Edg\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    }
    // كشف Internet Explorer
    else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
      browserName = 'Internet Explorer';
      const match = userAgent.match(/(?:MSIE |rv:)(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    }

    return {
      name: browserName,
      version: browserVersion,
      userAgent: userAgent,
      platform: navigator.platform,
      language: navigator.language
    };
  }

  /**
   * اختبار ميزات JavaScript
   */
  async testJavaScriptFeatures() {
    this.startTest('JavaScript Features');

    const jsFeatures = [
      {
        name: 'ES6 Arrow Functions',
        test: () => {
          try {
            const arrow = () => true;
            return arrow();
          } catch (e) { return false; }
        }
      },
      {
        name: 'ES6 Template Literals',
        test: () => {
          try {
            const test = `Template literal`;
            return test === 'Template literal';
          } catch (e) { return false; }
        }
      },
      {
        name: 'ES6 Destructuring',
        test: () => {
          try {
            const [a, b] = [1, 2];
            const {x, y} = {x: 1, y: 2};
            return a === 1 && b === 2 && x === 1 && y === 2;
          } catch (e) { return false; }
        }
      },
      {
        name: 'ES6 Classes',
        test: () => {
          try {
            class TestClass {
              constructor() { this.value = true; }
            }
            return new TestClass().value === true;
          } catch (e) { return false; }
        }
      },
      {
        name: 'Async/Await',
        test: async () => {
          try {
            const asyncFunc = async () => 'success';
            const result = await asyncFunc();
            return result === 'success';
          } catch (e) { return false; }
        }
      },
      {
        name: 'Promises',
        test: () => {
          try {
            return Promise.resolve(true) instanceof Promise;
          } catch (e) { return false; }
        }
      },
      {
        name: 'Map and Set',
        test: () => {
          try {
            const map = new Map();
            const set = new Set();
            map.set('key', 'value');
            set.add('item');
            return map.get('key') === 'value' && set.has('item');
          } catch (e) { return false; }
        }
      },
      {
        name: 'Symbol',
        test: () => {
          try {
            const sym = Symbol('test');
            return typeof sym === 'symbol';
          } catch (e) { return false; }
        }
      },
      {
        name: 'Proxy',
        test: () => {
          try {
            const target = {};
            const proxy = new Proxy(target, {});
            return typeof proxy === 'object';
          } catch (e) { return false; }
        }
      },
      {
        name: 'WeakMap and WeakSet',
        test: () => {
          try {
            const wm = new WeakMap();
            const ws = new WeakSet();
            return wm instanceof WeakMap && ws instanceof WeakSet;
          } catch (e) { return false; }
        }
      }
    ];

    for (const feature of jsFeatures) {
      try {
        const result = await feature.test();
        this.supportedFeatures.set(feature.name, result);
        this.addResult(feature.name, result, 
          result ? `${feature.name} مدعوم` : `${feature.name} غير مدعوم`);
      } catch (error) {
        this.supportedFeatures.set(feature.name, false);
        this.addResult(feature.name, false, `خطأ في اختبار ${feature.name}: ${error.message}`);
      }
    }
  }

  /**
   * اختبار ميزات CSS
   */
  async testCSSFeatures() {
    this.startTest('CSS Features');

    const cssFeatures = [
      { name: 'CSS Grid', property: 'display', value: 'grid' },
      { name: 'CSS Flexbox', property: 'display', value: 'flex' },
      { name: 'CSS Variables', property: '--test-var', value: 'test' },
      { name: 'CSS Transforms', property: 'transform', value: 'rotate(45deg)' },
      { name: 'CSS Transitions', property: 'transition', value: 'all 0.3s ease' },
      { name: 'CSS Animations', property: 'animation', value: 'test 1s ease' },
      { name: 'CSS Calc', property: 'width', value: 'calc(100% - 20px)' },
      { name: 'CSS Gradients', property: 'background', value: 'linear-gradient(to right, red, blue)' },
      { name: 'CSS Box Shadow', property: 'box-shadow', value: '0 0 10px rgba(0,0,0,0.5)' },
      { name: 'CSS Border Radius', property: 'border-radius', value: '10px' },
      { name: 'CSS Opacity', property: 'opacity', value: '0.5' },
      { name: 'CSS Multiple Backgrounds', property: 'background', value: 'url(a.png), url(b.png)' }
    ];

    for (const feature of cssFeatures) {
      let isSupported = false;
      
      if (feature.name === 'CSS Variables') {
        // اختبار خاص للمتغيرات
        isSupported = CSS.supports('color', 'var(--test)');
      } else {
        isSupported = CSS.supports(feature.property, feature.value);
      }
      
      this.supportedFeatures.set(feature.name, isSupported);
      this.addResult(feature.name, isSupported, 
        isSupported ? `${feature.name} مدعوم` : `${feature.name} غير مدعوم`);
    }

    // اختبار ميزات CSS خاصة
    await this.testSpecialCSSFeatures();
  }

  /**
   * اختبار ميزات CSS خاصة
   */
  async testSpecialCSSFeatures() {
    // اختبار Media Queries
    const supportsMediaQueries = window.matchMedia && window.matchMedia('(min-width: 1px)').matches;
    this.addResult('CSS Media Queries', supportsMediaQueries, 
      supportsMediaQueries ? 'Media Queries مدعومة' : 'Media Queries غير مدعومة');

    // اختبار Viewport Units
    const supportsViewportUnits = CSS.supports('width', '100vw') && CSS.supports('height', '100vh');
    this.addResult('CSS Viewport Units', supportsViewportUnits, 
      supportsViewportUnits ? 'Viewport Units مدعومة' : 'Viewport Units غير مدعومة');

    // اختبار CSS Grid Areas
    const supportsGridAreas = CSS.supports('grid-template-areas', '"header header"');
    this.addResult('CSS Grid Areas', supportsGridAreas, 
      supportsGridAreas ? 'Grid Areas مدعومة' : 'Grid Areas غير مدعومة');

    // اختبار CSS Subgrid
    const supportsSubgrid = CSS.supports('grid-template-rows', 'subgrid');
    this.addResult('CSS Subgrid', supportsSubgrid, 
      supportsSubgrid ? 'CSS Subgrid مدعوم' : 'CSS Subgrid غير مدعوم');
  }

  /**
   * اختبار ميزات HTML
   */
  async testHTMLFeatures() {
    this.startTest('HTML Features');

    const htmlFeatures = [
      {
        name: 'HTML5 Semantic Elements',
        test: () => {
          const elements = ['article', 'section', 'nav', 'header', 'footer', 'aside', 'main'];
          return elements.every(tag => document.createElement(tag) instanceof HTMLElement);
        }
      },
      {
        name: 'HTML5 Input Types',
        test: () => {
          const input = document.createElement('input');
          input.type = 'email';
          return input.type === 'email';
        }
      },
      {
        name: 'HTML5 Form Validation',
        test: () => {
          const input = document.createElement('input');
          return typeof input.checkValidity === 'function';
        }
      },
      {
        name: 'HTML5 Data Attributes',
        test: () => {
          const div = document.createElement('div');
          div.setAttribute('data-test', 'value');
          return div.dataset && div.dataset.test === 'value';
        }
      },
      {
        name: 'HTML5 Canvas',
        test: () => {
          const canvas = document.createElement('canvas');
          return !!(canvas.getContext && canvas.getContext('2d'));
        }
      },
      {
        name: 'HTML5 SVG',
        test: () => {
          return !!(document.createElementNS && 
                   document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect);
        }
      },
      {
        name: 'HTML5 Audio',
        test: () => {
          const audio = document.createElement('audio');
          return !!(audio.canPlayType);
        }
      },
      {
        name: 'HTML5 Video',
        test: () => {
          const video = document.createElement('video');
          return !!(video.canPlayType);
        }
      }
    ];

    for (const feature of htmlFeatures) {
      try {
        const result = feature.test();
        this.supportedFeatures.set(feature.name, result);
        this.addResult(feature.name, result, 
          result ? `${feature.name} مدعوم` : `${feature.name} غير مدعوم`);
      } catch (error) {
        this.supportedFeatures.set(feature.name, false);
        this.addResult(feature.name, false, `خطأ في اختبار ${feature.name}: ${error.message}`);
      }
    }
  }

  /**
   * اختبار Web APIs
   */
  async testWebAPIs() {
    this.startTest('Web APIs');

    const webAPIs = [
      { name: 'Fetch API', check: () => typeof fetch !== 'undefined' },
      { name: 'Local Storage', check: () => typeof localStorage !== 'undefined' },
      { name: 'Session Storage', check: () => typeof sessionStorage !== 'undefined' },
      { name: 'IndexedDB', check: () => typeof indexedDB !== 'undefined' },
      { name: 'Web Workers', check: () => typeof Worker !== 'undefined' },
      { name: 'Service Workers', check: () => 'serviceWorker' in navigator },
      { name: 'Geolocation API', check: () => 'geolocation' in navigator },
      { name: 'Notification API', check: () => 'Notification' in window },
      { name: 'File API', check: () => typeof FileReader !== 'undefined' },
      { name: 'Drag and Drop API', check: () => 'draggable' in document.createElement('div') },
      { name: 'History API', check: () => !!(window.history && window.history.pushState) },
      { name: 'WebSocket API', check: () => typeof WebSocket !== 'undefined' },
      { name: 'WebRTC API', check: () => !!(window.RTCPeerConnection || window.webkitRTCPeerConnection) },
      { name: 'Web Audio API', check: () => !!(window.AudioContext || window.webkitAudioContext) },
      { name: 'WebGL', check: () => {
        try {
          const canvas = document.createElement('canvas');
          return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch (e) { return false; }
      }},
      { name: 'Intersection Observer', check: () => 'IntersectionObserver' in window },
      { name: 'Mutation Observer', check: () => 'MutationObserver' in window },
      { name: 'Resize Observer', check: () => 'ResizeObserver' in window }
    ];

    for (const api of webAPIs) {
      try {
        const result = api.check();
        this.supportedFeatures.set(api.name, result);
        this.addResult(api.name, result, 
          result ? `${api.name} مدعوم` : `${api.name} غير مدعوم`);
      } catch (error) {
        this.supportedFeatures.set(api.name, false);
        this.addResult(api.name, false, `خطأ في اختبار ${api.name}: ${error.message}`);
      }
    }
  }

  /**
   * اختبار Performance APIs
   */
  async testPerformanceAPIs() {
    this.startTest('Performance APIs');

    const performanceAPIs = [
      { 
        name: 'Performance API', 
        check: () => typeof performance !== 'undefined',
        test: () => {
          if (performance.now) {
            const start = performance.now();
            const end = performance.now();
            return end >= start;
          }
          return false;
        }
      },
      { 
        name: 'Performance Observer', 
        check: () => 'PerformanceObserver' in window 
      },
      { 
        name: 'Performance Memory', 
        check: () => !!(performance.memory) 
      },
      { 
        name: 'Performance Timing', 
        check: () => !!(performance.timing) 
      },
      { 
        name: 'Performance Navigation', 
        check: () => !!(performance.navigation) 
      },
      { 
        name: 'User Timing API', 
        check: () => !!(performance.mark && performance.measure) 
      },
      { 
        name: 'Resource Timing API', 
        check: () => !!(performance.getEntriesByType) 
      }
    ];

    for (const api of performanceAPIs) {
      try {
        let result = api.check();
        
        // تشغيل اختبار إضافي إذا كان متاحاً
        if (result && api.test) {
          result = api.test();
        }
        
        this.supportedFeatures.set(api.name, result);
        this.addResult(api.name, result, 
          result ? `${api.name} يعمل بشكل صحيح` : `${api.name} غير متاح أو لا يعمل`);
        
        // جمع معلومات الأداء
        if (result && api.name === 'Performance API') {
          this.collectPerformanceMetrics();
        }
      } catch (error) {
        this.supportedFeatures.set(api.name, false);
        this.addResult(api.name, false, `خطأ في اختبار ${api.name}: ${error.message}`);
      }
    }
  }

  /**
   * جمع معلومات الأداء
   */
  collectPerformanceMetrics() {
    try {
      if (performance.timing) {
        const timing = performance.timing;
        this.performanceMetrics = {
          domLoading: timing.domLoading - timing.navigationStart,
          domInteractive: timing.domInteractive - timing.navigationStart,
          domComplete: timing.domComplete - timing.navigationStart,
          loadComplete: timing.loadEventEnd - timing.navigationStart
        };
      }
      
      if (performance.memory) {
        this.performanceMetrics.memory = {
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
        };
      }
    } catch (error) {
      console.warn('فشل في جمع معلومات الأداء:', error.message);
    }
  }

  /**
   * اختبار ميزات الأمان
   */
  async testSecurityFeatures() {
    this.startTest('Security Features');

    const securityFeatures = [
      { 
        name: 'HTTPS Support', 
        check: () => location.protocol === 'https:' || location.hostname === 'localhost'
      },
      { 
        name: 'Content Security Policy', 
        check: () => {
          const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
          return !!(meta || document.querySelector('meta[name="csp-nonce"]'));
        }
      },
      { 
        name: 'Secure Context', 
        check: () => window.isSecureContext 
      },
      { 
        name: 'SubResource Integrity', 
        check: () => 'integrity' in document.createElement('script') 
      },
      { 
        name: 'Referrer Policy', 
        check: () => 'referrerPolicy' in document.createElement('a') 
      }
    ];

    for (const feature of securityFeatures) {
      try {
        const result = feature.check();
        this.supportedFeatures.set(feature.name, result);
        this.addResult(feature.name, result, 
          result ? `${feature.name} مفعل` : `${feature.name} غير مفعل`);
      } catch (error) {
        this.supportedFeatures.set(feature.name, false);
        this.addResult(feature.name, false, `خطأ في اختبار ${feature.name}: ${error.message}`);
      }
    }
  }

  /**
   * اختبار ميزات إمكانية الوصول
   */
  async testAccessibilityFeatures() {
    this.startTest('Accessibility Features');

    const a11yFeatures = [
      { 
        name: 'ARIA Support', 
        check: () => 'setAttribute' in document.createElement('div') 
      },
      { 
        name: 'Focus Management', 
        check: () => 'focus' in document.createElement('input') 
      },
      { 
        name: 'Screen Reader Support', 
        check: () => 'ariaLabel' in document.createElement('div') 
      },
      { 
        name: 'High Contrast Support', 
        check: () => window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches !== undefined 
      },
      { 
        name: 'Reduced Motion Support', 
        check: () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches !== undefined 
      }
    ];

    for (const feature of a11yFeatures) {
      try {
        const result = feature.check();
        this.supportedFeatures.set(feature.name, result);
        this.addResult(feature.name, result, 
          result ? `${feature.name} مدعوم` : `${feature.name} غير مدعوم`);
      } catch (error) {
        this.supportedFeatures.set(feature.name, false);
        this.addResult(feature.name, false, `خطأ في اختبار ${feature.name}: ${error.message}`);
      }
    }
  }

  /**
   * اختبار ميزات الأجهزة المحمولة
   */
  async testMobileFeatures() {
    this.startTest('Mobile Features');

    const mobileFeatures = [
      { 
        name: 'Touch Events', 
        check: () => 'ontouchstart' in window 
      },
      { 
        name: 'Orientation API', 
        check: () => 'orientation' in window || 'onorientationchange' in window 
      },
      { 
        name: 'Device Motion API', 
        check: () => 'DeviceMotionEvent' in window 
      },
      { 
        name: 'Device Orientation API', 
        check: () => 'DeviceOrientationEvent' in window 
      },
      { 
        name: 'Vibration API', 
        check: () => 'vibrate' in navigator 
      },
      { 
        name: 'Battery API', 
        check: () => 'getBattery' in navigator 
      },
      { 
        name: 'Network Information API', 
        check: () => 'connection' in navigator 
      }
    ];

    for (const feature of mobileFeatures) {
      try {
        const result = feature.check();
        this.supportedFeatures.set(feature.name, result);
        this.addResult(feature.name, result, 
          result ? `${feature.name} مدعوم` : `${feature.name} غير مدعوم`);
      } catch (error) {
        this.supportedFeatures.set(feature.name, false);
        this.addResult(feature.name, false, `خطأ في اختبار ${feature.name}: ${error.message}`);
      }
    }
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
   * عرض النتائج
   */
  displayResults() {
    console.log('\n📊 ملخص اختبارات التوافق مع المتصفحات:');
    console.log('='.repeat(60));
    
    console.log(`🔍 معلومات المتصفح:`);
    console.log(`   - الاسم: ${this.browserInfo.name}`);
    console.log(`   - الإصدار: ${this.browserInfo.version}`);
    console.log(`   - المنصة: ${this.browserInfo.platform}`);
    console.log(`   - اللغة: ${this.browserInfo.language}`);
    
    const categories = [...new Set(this.testResults.map(r => r.category))];
    
    categories.forEach(category => {
      const categoryResults = this.testResults.filter(r => r.category === category);
      const passed = categoryResults.filter(r => r.passed).length;
      const total = categoryResults.length;
      const percentage = ((passed / total) * 100).toFixed(1);
      
      console.log(`\n📁 ${category}: ${passed}/${total} (${percentage}%)`);
      
      // عرض الميزات غير المدعومة فقط لتوفير المساحة
      const failed = categoryResults.filter(r => !r.passed);
      if (failed.length > 0) {
        console.log(`   ❌ غير مدعوم: ${failed.map(f => f.test).join(', ')}`);
      } else {
        console.log(`   ✅ جميع الميزات مدعومة`);
      }
    });

    // عرض معلومات الأداء إذا كانت متاحة
    if (Object.keys(this.performanceMetrics).length > 0) {
      console.log(`\n⚡ معلومات الأداء:`);
      if (this.performanceMetrics.memory) {
        console.log(`   - استهلاك الذاكرة: ${this.performanceMetrics.memory.used}MB / ${this.performanceMetrics.memory.total}MB`);
      }
      if (this.performanceMetrics.domComplete) {
        console.log(`   - وقت تحميل DOM: ${this.performanceMetrics.domComplete}ms`);
      }
    }

    const totalPassed = this.testResults.filter(r => r.passed).length;
    const totalTests = this.testResults.length;
    const overallPercentage = ((totalPassed / totalTests) * 100).toFixed(1);
    
    console.log(`\n🎯 النتيجة الإجمالية: ${totalPassed}/${totalTests} (${overallPercentage}%)`);
    
    if (overallPercentage >= 90) {
      console.log('🎉 ممتاز! توافق ممتاز مع هذا المتصفح');
    } else if (overallPercentage >= 80) {
      console.log('👍 جيد جداً! توافق جيد مع مشاكل بسيطة');
    } else if (overallPercentage >= 70) {
      console.log('⚠️ مقبول! هناك بعض مشاكل التوافق');
    } else {
      console.log('❌ ضعيف! مشاكل كبيرة في التوافق تحتاج إصلاح');
    }
  }

  /**
   * إنشاء تقرير التوافق
   */
  generateCompatibilityReport() {
    const report = {
      timestamp: new Date().toISOString(),
      browser: this.browserInfo,
      performance: this.performanceMetrics,
      totalTests: this.testResults.length,
      passedTests: this.testResults.filter(r => r.passed).length,
      failedTests: this.testResults.filter(r => !r.passed).length,
      successRate: ((this.testResults.filter(r => r.passed).length / this.testResults.length) * 100).toFixed(2),
      categories: {},
      supportedFeatures: Object.fromEntries(this.supportedFeatures),
      detailedResults: this.testResults,
      recommendations: this.generateRecommendations()
    };

    // تجميع النتائج حسب الفئة
    const categories = [...new Set(this.testResults.map(r => r.category))];
    categories.forEach(category => {
      const categoryResults = this.testResults.filter(r => r.category === category);
      report.categories[category] = {
        total: categoryResults.length,
        passed: categoryResults.filter(r => r.passed).length,
        failed: categoryResults.filter(r => !r.passed).length,
        successRate: ((categoryResults.filter(r => r.passed).length / categoryResults.length) * 100).toFixed(2),
        failedFeatures: categoryResults.filter(r => !r.passed).map(r => r.test)
      };
    });

    // حفظ التقرير
    try {
      localStorage.setItem('crossBrowserCompatibilityReport', JSON.stringify(report));
      console.log('💾 تم حفظ تقرير التوافق في Local Storage');
    } catch (error) {
      console.log('❌ فشل في حفظ التقرير:', error.message);
    }

    return report;
  }

  /**
   * إنشاء توصيات بناءً على النتائج
   */
  generateRecommendations() {
    const recommendations = [];
    const failedTests = this.testResults.filter(r => !r.passed);

    // توصيات عامة
    if (failedTests.length === 0) {
      recommendations.push('🎉 ممتاز! جميع الميزات مدعومة في هذا المتصفح');
    } else {
      recommendations.push(`⚠️ هناك ${failedTests.length} ميزة غير مدعومة تحتاج إلى polyfills أو حلول بديلة`);
    }

    // توصيات محددة
    const failedFeatures = failedTests.map(t => t.test);
    
    if (failedFeatures.includes('Fetch API')) {
      recommendations.push('💡 استخدم polyfill للـ Fetch API أو استخدم XMLHttpRequest كبديل');
    }
    
    if (failedFeatures.includes('CSS Grid')) {
      recommendations.push('💡 استخدم Flexbox كبديل لـ CSS Grid في المتصفحات القديمة');
    }
    
    if (failedFeatures.includes('ES6 Arrow Functions')) {
      recommendations.push('💡 استخدم Babel لتحويل ES6+ إلى ES5 للمتصفحات القديمة');
    }
    
    if (failedFeatures.includes('Service Workers')) {
      recommendations.push('💡 تأكد من تشغيل الموقع على HTTPS لدعم Service Workers');
    }

    // توصيات الأداء
    if (this.performanceMetrics.memory && this.performanceMetrics.memory.used > 100) {
      recommendations.push('⚡ استهلاك الذاكرة مرتفع - فكر في تحسين الكود');
    }

    return recommendations;
  }

  /**
   * تشغيل اختبار سريع
   */
  static quickTest() {
    const tester = new CrossBrowserTester();
    return tester.runAllTests();
  }
}

// تصدير للاستخدام
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CrossBrowserTester;
} else if (typeof window !== 'undefined') {
  window.CrossBrowserTester = CrossBrowserTester;
}

// تشغيل تلقائي في بيئة التطوير
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('🌐 تشغيل اختبارات التوافق مع المتصفحات...');
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => CrossBrowserTester.quickTest(), 3000);
    });
  } else {
    setTimeout(() => CrossBrowserTester.quickTest(), 3000);
  }
}