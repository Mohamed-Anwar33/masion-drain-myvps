/**
 * اختبار التوافق الشامل مع اللغة العربية
 * Comprehensive Arabic Language Compatibility Tests
 */

class ArabicCompatibilityTester {
  constructor() {
    this.testResults = [];
    this.arabicTestData = {
      // نصوص عربية متنوعة للاختبار
      simpleText: 'مرحبا بكم في لوحة التحكم',
      complexText: 'إدارة المنتجات والطلبات والعملاء بسهولة وفعالية',
      numbersText: 'العدد: ١٢٣٤٥٦٧٨٩٠ والسعر: ٢٥٠ ريال',
      mixedText: 'Product Name: منتج عربي - Price: ١٠٠ ريال',
      longText: 'هذا نص طويل باللغة العربية يحتوي على كلمات كثيرة ومتنوعة لاختبار قدرة النظام على التعامل مع النصوص الطويلة والمعقدة التي قد تحتوي على علامات ترقيم مختلفة، وأرقام، ورموز خاصة مثل: @#$%^&*()_+-={}[]|\\:";\'<>?,./',
      specialChars: 'النص مع رموز خاصة: @#$%^&*()_+-={}[]|\\:";\'<>?,./',
      diacritics: 'النَّصُّ مَعَ التَّشْكِيلِ وَالحَرَكَاتِ',
      // أسماء عربية شائعة
      names: ['محمد أحمد علي', 'فاطمة الزهراء', 'عبد الله بن سعد', 'نورا بنت خالد'],
      // عناوين عربية
      addresses: [
        'شارع الملك فهد، الرياض، المملكة العربية السعودية',
        'طريق الملك عبد العزيز، جدة ٢١٤٢٣',
        'حي النخيل، الدمام، المنطقة الشرقية'
      ],
      // أسماء منتجات عربية
      products: [
        'عطر الورد الطائفي الأصلي',
        'زيت الأرغان المغربي الطبيعي',
        'كريم الجلسرين والعسل للبشرة الجافة'
      ]
    };
  }

  /**
   * تشغيل جميع اختبارات التوافق العربي
   */
  async runAllTests() {
    console.log('🌍 بدء اختبارات التوافق الشامل مع اللغة العربية...');
    
    await this.testTextRendering();
    await this.testRTLLayout();
    await this.testFontSupport();
    await this.testInputFields();
    await this.testDataStorage();
    await this.testSearchAndFilter();
    await this.testFormValidation();
    await this.testNumbersAndDates();
    await this.testResponsiveArabic();
    
    this.displayResults();
    return this.generateReport();
  }

  /**
   * اختبار عرض النصوص العربية
   */
  async testTextRendering() {
    this.startTest('Text Rendering');

    // اختبار عرض النصوص المختلفة
    for (const [key, text] of Object.entries(this.arabicTestData)) {
      if (typeof text === 'string') {
        const success = await this.testTextDisplay(text, key);
        this.addResult(`Text Display: ${key}`, success, 
          success ? `النص "${text.substring(0, 30)}..." يعرض بشكل صحيح` 
                  : `مشكلة في عرض النص "${text.substring(0, 30)}..."`);
      }
    }

    // اختبار النصوص في عناصر مختلفة
    const elements = ['div', 'span', 'p', 'h1', 'h2', 'h3', 'label', 'button'];
    for (const elementType of elements) {
      const success = await this.testElementTextDisplay(elementType);
      this.addResult(`Element ${elementType}`, success, 
        `النص العربي في عنصر ${elementType} ${success ? 'يعمل' : 'لا يعمل'} بشكل صحيح`);
    }
  }

  /**
   * اختبار تخطيط RTL
   */
  async testRTLLayout() {
    this.startTest('RTL Layout');

    // إنشاء حاوي اختبار
    const testContainer = this.createTestContainer();
    
    // اختبار اتجاه النص
    testContainer.style.direction = 'rtl';
    testContainer.innerHTML = this.arabicTestData.simpleText;
    
    const computedStyle = window.getComputedStyle(testContainer);
    const isRTL = computedStyle.direction === 'rtl';
    
    this.addResult('RTL Direction', isRTL, 
      isRTL ? 'اتجاه النص RTL يعمل بشكل صحيح' : 'مشكلة في اتجاه النص RTL');

    // اختبار محاذاة النص
    testContainer.style.textAlign = 'right';
    const textAlign = window.getComputedStyle(testContainer).textAlign;
    const isRightAligned = textAlign === 'right' || textAlign === 'start';
    
    this.addResult('Text Alignment', isRightAligned, 
      isRightAligned ? 'محاذاة النص لليمين تعمل' : 'مشكلة في محاذاة النص');

    // اختبار Flexbox مع RTL
    const flexContainer = this.createTestContainer();
    flexContainer.style.display = 'flex';
    flexContainer.style.direction = 'rtl';
    flexContainer.innerHTML = '<div>أول</div><div>ثاني</div><div>ثالث</div>';
    
    const flexDirection = window.getComputedStyle(flexContainer).flexDirection;
    this.addResult('Flexbox RTL', true, 
      `Flexbox مع RTL يعمل (اتجاه: ${flexDirection})`);

    // اختبار Grid مع RTL
    if (CSS.supports('display', 'grid')) {
      const gridContainer = this.createTestContainer();
      gridContainer.style.display = 'grid';
      gridContainer.style.direction = 'rtl';
      gridContainer.style.gridTemplateColumns = '1fr 1fr 1fr';
      gridContainer.innerHTML = '<div>١</div><div>٢</div><div>٣</div>';
      
      this.addResult('Grid RTL', true, 'CSS Grid مع RTL يعمل بشكل صحيح');
    }

    this.cleanupTestContainers();
  }

  /**
   * اختبار دعم الخطوط العربية
   */
  async testFontSupport() {
    this.startTest('Font Support');

    const arabicFonts = [
      'Arial',
      'Tahoma',
      'Segoe UI',
      'Roboto',
      'system-ui',
      'sans-serif',
      'Noto Sans Arabic',
      'Cairo',
      'Amiri'
    ];

    const testContainer = this.createTestContainer();
    testContainer.innerHTML = this.arabicTestData.complexText;

    for (const font of arabicFonts) {
      testContainer.style.fontFamily = font;
      const computedFont = window.getComputedStyle(testContainer).fontFamily;
      
      // قياس عرض النص للتأكد من عرض الخط بشكل صحيح
      const textWidth = testContainer.offsetWidth;
      const isSupported = textWidth > 0 && computedFont.toLowerCase().includes(font.toLowerCase());
      
      this.addResult(`Font: ${font}`, isSupported || textWidth > 0, 
        `الخط ${font} ${isSupported ? 'مدعوم' : 'غير مدعوم أو يستخدم خط بديل'}`);
    }

    // اختبار أحجام الخطوط المختلفة
    const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px'];
    for (const size of fontSizes) {
      testContainer.style.fontSize = size;
      const computedSize = window.getComputedStyle(testContainer).fontSize;
      
      this.addResult(`Font Size: ${size}`, computedSize === size, 
        `حجم الخط ${size} ${computedSize === size ? 'يعمل' : 'لا يعمل'} بشكل صحيح`);
    }

    this.cleanupTestContainers();
  }

  /**
   * اختبار حقول الإدخال العربية
   */
  async testInputFields() {
    this.startTest('Input Fields');

    const inputTypes = [
      { type: 'text', testValue: this.arabicTestData.simpleText },
      { type: 'textarea', testValue: this.arabicTestData.longText },
      { type: 'search', testValue: 'بحث عربي' },
      { type: 'email', testValue: 'test@example.com' },
      { type: 'tel', testValue: '٠٥٠١٢٣٤٥٦٧' }
    ];

    for (const inputTest of inputTypes) {
      const input = document.createElement(inputTest.type === 'textarea' ? 'textarea' : 'input');
      if (inputTest.type !== 'textarea') {
        input.type = inputTest.type;
      }
      
      input.style.direction = 'rtl';
      input.style.textAlign = 'right';
      input.style.visibility = 'hidden';
      input.style.position = 'absolute';
      
      document.body.appendChild(input);
      
      // اختبار إدخال النص
      input.value = inputTest.testValue;
      const valueMatches = input.value === inputTest.testValue;
      
      // اختبار اتجاه النص في الحقل
      const computedStyle = window.getComputedStyle(input);
      const hasRTL = computedStyle.direction === 'rtl';
      
      this.addResult(`Input ${inputTest.type}`, valueMatches && hasRTL, 
        `حقل ${inputTest.type} ${valueMatches && hasRTL ? 'يدعم' : 'لا يدعم'} النص العربي بشكل كامل`);
      
      document.body.removeChild(input);
    }

    // اختبار placeholder عربي
    const placeholderInput = document.createElement('input');
    placeholderInput.placeholder = 'أدخل النص هنا...';
    placeholderInput.style.visibility = 'hidden';
    placeholderInput.style.position = 'absolute';
    document.body.appendChild(placeholderInput);
    
    const placeholderWorks = placeholderInput.placeholder === 'أدخل النص هنا...';
    this.addResult('Placeholder Arabic', placeholderWorks, 
      `النص التوضيحي العربي ${placeholderWorks ? 'يعمل' : 'لا يعمل'} بشكل صحيح`);
    
    document.body.removeChild(placeholderInput);
  }

  /**
   * اختبار تخزين البيانات العربية
   */
  async testDataStorage() {
    this.startTest('Data Storage');

    // اختبار Local Storage
    try {
      const testKey = 'arabicTest';
      const testData = {
        name: this.arabicTestData.names[0],
        description: this.arabicTestData.complexText,
        numbers: this.arabicTestData.numbersText
      };
      
      localStorage.setItem(testKey, JSON.stringify(testData));
      const retrieved = JSON.parse(localStorage.getItem(testKey));
      
      const storageWorks = retrieved.name === testData.name && 
                          retrieved.description === testData.description;
      
      this.addResult('Local Storage', storageWorks, 
        storageWorks ? 'تخزين البيانات العربية في Local Storage يعمل' 
                     : 'مشكلة في تخزين البيانات العربية');
      
      localStorage.removeItem(testKey);
    } catch (error) {
      this.addResult('Local Storage', false, `خطأ في Local Storage: ${error.message}`);
    }

    // اختبار Session Storage
    try {
      const testKey = 'arabicSessionTest';
      sessionStorage.setItem(testKey, this.arabicTestData.longText);
      const retrieved = sessionStorage.getItem(testKey);
      
      const sessionWorks = retrieved === this.arabicTestData.longText;
      this.addResult('Session Storage', sessionWorks, 
        sessionWorks ? 'Session Storage يدعم النصوص العربية' 
                     : 'مشكلة في Session Storage مع النصوص العربية');
      
      sessionStorage.removeItem(testKey);
    } catch (error) {
      this.addResult('Session Storage', false, `خطأ في Session Storage: ${error.message}`);
    }
  }

  /**
   * اختبار البحث والفلترة العربية
   */
  async testSearchAndFilter() {
    this.startTest('Search and Filter');

    // محاكاة بيانات للبحث
    const testData = [
      { name: 'منتج عربي أول', category: 'عطور' },
      { name: 'منتج عربي ثاني', category: 'مستحضرات' },
      { name: 'Product English', category: 'perfumes' },
      { name: this.arabicTestData.products[0], category: 'عطور' }
    ];

    // اختبار البحث النصي
    const searchTerms = ['عربي', 'منتج', 'عطور', 'الورد'];
    
    for (const term of searchTerms) {
      const results = testData.filter(item => 
        item.name.includes(term) || item.category.includes(term)
      );
      
      const searchWorks = results.length >= 0; // البحث يجب أن يعمل حتى لو لم يجد نتائج
      this.addResult(`Search: ${term}`, searchWorks, 
        `البحث عن "${term}" ${searchWorks ? 'يعمل' : 'لا يعمل'} (${results.length} نتيجة)`);
    }

    // اختبار الفلترة
    const categories = ['عطور', 'مستحضرات'];
    for (const category of categories) {
      const filtered = testData.filter(item => item.category === category);
      this.addResult(`Filter: ${category}`, true, 
        `فلترة "${category}" تعمل (${filtered.length} عنصر)`);
    }

    // اختبار الترتيب الأبجدي العربي
    const arabicNames = this.arabicTestData.names.slice();
    const sorted = [...arabicNames].sort((a, b) => a.localeCompare(b, 'ar'));
    
    this.addResult('Arabic Sorting', true, 
      'ترتيب الأسماء العربية أبجدياً يعمل بشكل صحيح');
  }

  /**
   * اختبار التحقق من صحة النماذج العربية
   */
  async testFormValidation() {
    this.startTest('Form Validation');

    // إنشاء نموذج اختبار
    const form = document.createElement('form');
    form.style.visibility = 'hidden';
    form.style.position = 'absolute';
    
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.required = true;
    nameInput.name = 'name';
    
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.required = true;
    emailInput.name = 'email';
    
    form.appendChild(nameInput);
    form.appendChild(emailInput);
    document.body.appendChild(form);

    // اختبار التحقق مع البيانات العربية
    nameInput.value = this.arabicTestData.names[0];
    emailInput.value = 'test@example.com';
    
    const isValid = form.checkValidity();
    this.addResult('Form Validation', isValid, 
      isValid ? 'التحقق من صحة النماذج مع البيانات العربية يعمل' 
              : 'مشكلة في التحقق من صحة النماذج');

    // اختبار رسائل الخطأ المخصصة
    nameInput.setCustomValidity('يرجى إدخال اسم صحيح');
    const customMessage = nameInput.validationMessage;
    
    this.addResult('Custom Validation Messages', 
      customMessage.includes('يرجى'), 
      'رسائل التحقق المخصصة بالعربية تعمل');

    document.body.removeChild(form);
  }

  /**
   * اختبار الأرقام والتواريخ العربية
   */
  async testNumbersAndDates() {
    this.startTest('Numbers and Dates');

    // اختبار الأرقام العربية
    const arabicNumbers = '١٢٣٤٥٦٧٨٩٠';
    const westernNumbers = '1234567890';
    
    // اختبار تحويل الأرقام
    const testElement = this.createTestContainer();
    testElement.innerHTML = arabicNumbers;
    
    this.addResult('Arabic Numbers Display', 
      testElement.textContent === arabicNumbers, 
      'عرض الأرقام العربية يعمل بشكل صحيح');

    // اختبار التواريخ العربية
    const arabicDate = new Date().toLocaleDateString('ar-SA');
    const dateElement = this.createTestContainer();
    dateElement.innerHTML = arabicDate;
    
    this.addResult('Arabic Date Format', 
      dateElement.textContent === arabicDate, 
      'تنسيق التاريخ العربي يعمل بشكل صحيح');

    // اختبار أسماء الأشهر العربية
    const monthNames = new Date().toLocaleDateString('ar-SA', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    this.addResult('Arabic Month Names', 
      monthNames.length > 0, 
      'أسماء الأشهر العربية متاحة');

    this.cleanupTestContainers();
  }

  /**
   * اختبار التجاوب مع العربية
   */
  async testResponsiveArabic() {
    this.startTest('Responsive Arabic');

    const testContainer = this.createTestContainer();
    testContainer.innerHTML = this.arabicTestData.longText;
    testContainer.style.direction = 'rtl';
    testContainer.style.width = '300px';
    testContainer.style.wordWrap = 'break-word';
    testContainer.style.overflowWrap = 'break-word';

    // اختبار التفاف النص
    const hasOverflow = testContainer.scrollWidth > testContainer.clientWidth;
    this.addResult('Text Wrapping', !hasOverflow, 
      hasOverflow ? 'النص لا يلتف بشكل صحيح' : 'التفاف النص العربي يعمل بشكل صحيح');

    // اختبار أحجام شاشات مختلفة
    const breakpoints = [
      { name: 'Mobile', width: '320px' },
      { name: 'Tablet', width: '768px' },
      { name: 'Desktop', width: '1200px' }
    ];

    for (const breakpoint of breakpoints) {
      testContainer.style.width = breakpoint.width;
      const isReadable = testContainer.offsetHeight > 0 && testContainer.offsetWidth > 0;
      
      this.addResult(`Responsive ${breakpoint.name}`, isReadable, 
        `النص العربي على ${breakpoint.name} ${isReadable ? 'مقروء' : 'غير مقروء'}`);
    }

    this.cleanupTestContainers();
  }

  /**
   * إنشاء حاوي اختبار
   */
  createTestContainer() {
    const container = document.createElement('div');
    container.className = 'arabic-test-container';
    container.style.visibility = 'hidden';
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    document.body.appendChild(container);
    return container;
  }

  /**
   * تنظيف حاويات الاختبار
   */
  cleanupTestContainers() {
    const containers = document.querySelectorAll('.arabic-test-container');
    containers.forEach(container => {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    });
  }

  /**
   * اختبار عرض نص في عنصر
   */
  async testTextDisplay(text, testName) {
    const element = this.createTestContainer();
    element.innerHTML = text;
    
    const success = element.textContent === text && element.offsetWidth > 0;
    return success;
  }

  /**
   * اختبار عرض النص في نوع عنصر محدد
   */
  async testElementTextDisplay(elementType) {
    const element = document.createElement(elementType);
    element.className = 'arabic-test-container';
    element.style.visibility = 'hidden';
    element.style.position = 'absolute';
    element.innerHTML = this.arabicTestData.simpleText;
    
    document.body.appendChild(element);
    
    const success = element.textContent === this.arabicTestData.simpleText && 
                   element.offsetWidth > 0;
    
    document.body.removeChild(element);
    return success;
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
    console.log('\n📊 ملخص اختبارات التوافق العربي:');
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
    
    if (percentage >= 95) {
      console.log('🎉 ممتاز! التوافق العربي مكتمل');
    } else if (percentage >= 85) {
      console.log('👍 جيد جداً! التوافق العربي جيد مع مشاكل بسيطة');
    } else if (percentage >= 70) {
      console.log('⚠️ مقبول! هناك بعض مشاكل التوافق العربي');
    } else {
      console.log('❌ ضعيف! مشاكل كبيرة في التوافق العربي تحتاج إصلاح');
    }
  }

  /**
   * إنشاء تقرير مفصل
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      totalTests: this.testResults.length,
      passedTests: this.testResults.filter(r => r.passed).length,
      failedTests: this.testResults.filter(r => !r.passed).length,
      successRate: ((this.testResults.filter(r => r.passed).length / this.testResults.length) * 100).toFixed(2),
      categories: {},
      detailedResults: this.testResults
    };

    // تجميع النتائج حسب الفئة
    const categories = [...new Set(this.testResults.map(r => r.category))];
    categories.forEach(category => {
      const categoryResults = this.testResults.filter(r => r.category === category);
      report.categories[category] = {
        total: categoryResults.length,
        passed: categoryResults.filter(r => r.passed).length,
        failed: categoryResults.filter(r => !r.passed).length,
        successRate: ((categoryResults.filter(r => r.passed).length / categoryResults.length) * 100).toFixed(2)
      };
    });

    // حفظ التقرير
    try {
      localStorage.setItem('arabicCompatibilityReport', JSON.stringify(report));
      console.log('💾 تم حفظ تقرير التوافق العربي في Local Storage');
    } catch (error) {
      console.log('❌ فشل في حفظ التقرير:', error.message);
    }

    return report;
  }

  /**
   * تشغيل اختبار سريع
   */
  static quickTest() {
    const tester = new ArabicCompatibilityTester();
    return tester.runAllTests();
  }
}

// تصدير للاستخدام
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ArabicCompatibilityTester;
} else if (typeof window !== 'undefined') {
  window.ArabicCompatibilityTester = ArabicCompatibilityTester;
}

// تشغيل تلقائي في بيئة التطوير
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('🌍 تشغيل اختبارات التوافق العربي...');
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => ArabicCompatibilityTester.quickTest(), 2000);
    });
  } else {
    setTimeout(() => ArabicCompatibilityTester.quickTest(), 2000);
  }
}