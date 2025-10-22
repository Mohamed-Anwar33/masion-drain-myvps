#!/usr/bin/env node

/**
 * سكريبت تشغيل اختبارات التوافق والأداء الشاملة
 * Comprehensive Compatibility and Performance Test Runner
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 بدء تشغيل اختبارات التوافق والأداء الشاملة...');
console.log('🚀 Starting Comprehensive Compatibility and Performance Tests...\n');

const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  }
};

/**
 * تشغيل اختبار واحد
 */
function runTest(testName, testCommand, description) {
  console.log(`\n📋 تشغيل: ${testName}`);
  console.log(`📋 Running: ${description}`);
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  let success = false;
  let output = '';
  let error = '';
  
  try {
    output = execSync(testCommand, { 
      encoding: 'utf8',
      cwd: process.cwd(),
      timeout: 120000 // 2 minutes timeout
    });
    success = true;
    console.log('✅ نجح الاختبار');
    console.log('✅ Test Passed');
  } catch (err) {
    success = false;
    error = err.message;
    console.log('❌ فشل الاختبار');
    console.log('❌ Test Failed');
    console.log(`خطأ: ${err.message.substring(0, 200)}...`);
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  const result = {
    name: testName,
    description,
    success,
    duration,
    output: output.substring(0, 1000), // حفظ أول 1000 حرف فقط
    error: error.substring(0, 500) // حفظ أول 500 حرف من الخطأ
  };
  
  testResults.tests.push(result);
  testResults.summary.total++;
  
  if (success) {
    testResults.summary.passed++;
  } else {
    testResults.summary.failed++;
  }
  
  console.log(`⏱️ المدة: ${duration}ms`);
  console.log(`⏱️ Duration: ${duration}ms`);
  
  return success;
}

/**
 * تشغيل جميع الاختبارات
 */
async function runAllTests() {
  console.log('🔍 فحص البيئة...');
  console.log('🔍 Checking environment...');
  
  // التحقق من وجود الملفات المطلوبة
  const requiredFiles = [
    'tests/isolated-performance.test.js',
    'package.json'
  ];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      console.log(`❌ ملف مفقود: ${file}`);
      console.log(`❌ Missing file: ${file}`);
      process.exit(1);
    }
  }
  
  console.log('✅ البيئة جاهزة');
  console.log('✅ Environment ready\n');
  
  // قائمة الاختبارات
  const tests = [
    {
      name: 'اختبار الأداء المعزول',
      command: 'npx jest tests/isolated-performance.test.js --testTimeout=60000 --no-coverage --silent',
      description: 'Isolated Performance and Compatibility Tests'
    }
  ];
  
  // تشغيل الاختبارات
  for (const test of tests) {
    runTest(test.name, test.command, test.description);
    
    // انتظار قصير بين الاختبارات
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // إنشاء التقرير النهائي
  generateFinalReport();
}

/**
 * إنشاء التقرير النهائي
 */
function generateFinalReport() {
  console.log('\n📊 إنشاء التقرير النهائي...');
  console.log('📊 Generating final report...\n');
  
  const successRate = (testResults.summary.passed / testResults.summary.total) * 100;
  
  console.log('='.repeat(80));
  console.log('📋 ملخص نتائج اختبارات التوافق والأداء');
  console.log('📋 COMPATIBILITY AND PERFORMANCE TEST SUMMARY');
  console.log('='.repeat(80));
  
  console.log(`📊 إجمالي الاختبارات: ${testResults.summary.total}`);
  console.log(`📊 Total Tests: ${testResults.summary.total}`);
  
  console.log(`✅ نجح: ${testResults.summary.passed}`);
  console.log(`✅ Passed: ${testResults.summary.passed}`);
  
  console.log(`❌ فشل: ${testResults.summary.failed}`);
  console.log(`❌ Failed: ${testResults.summary.failed}`);
  
  console.log(`📈 معدل النجاح: ${successRate.toFixed(1)}%`);
  console.log(`📈 Success Rate: ${successRate.toFixed(1)}%`);
  
  console.log('\n📝 تفاصيل الاختبارات:');
  console.log('📝 Test Details:');
  
  testResults.tests.forEach((test, index) => {
    const status = test.success ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${test.name} (${test.duration}ms)`);
    
    if (!test.success && test.error) {
      console.log(`   خطأ: ${test.error.substring(0, 100)}...`);
    }
  });
  
  // تقييم النتائج
  console.log('\n🎯 التقييم النهائي:');
  console.log('🎯 Final Assessment:');
  
  if (successRate >= 90) {
    console.log('🎉 ممتاز! النظام يحقق جميع معايير التوافق والأداء');
    console.log('🎉 Excellent! System meets all compatibility and performance criteria');
  } else if (successRate >= 75) {
    console.log('👍 جيد! النظام يحقق معظم معايير التوافق والأداء');
    console.log('👍 Good! System meets most compatibility and performance criteria');
  } else if (successRate >= 50) {
    console.log('⚠️ مقبول! هناك بعض المشاكل التي تحتاج إلى إصلاح');
    console.log('⚠️ Acceptable! Some issues need to be addressed');
  } else {
    console.log('❌ ضعيف! مشاكل كبيرة تحتاج إلى إصلاح فوري');
    console.log('❌ Poor! Major issues need immediate attention');
  }
  
  // حفظ التقرير في ملف
  const reportPath = path.join(__dirname, '..', 'test-reports', 'compatibility-performance-report.json');
  
  // إنشاء مجلد التقارير إذا لم يكن موجوداً
  const reportsDir = path.dirname(reportPath);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  try {
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    console.log(`\n💾 تم حفظ التقرير في: ${reportPath}`);
    console.log(`💾 Report saved to: ${reportPath}`);
  } catch (error) {
    console.log(`❌ فشل في حفظ التقرير: ${error.message}`);
    console.log(`❌ Failed to save report: ${error.message}`);
  }
  
  // إنشاء تقرير مبسط
  generateSimpleReport();
  
  console.log('\n✅ اكتملت جميع اختبارات التوافق والأداء!');
  console.log('✅ All compatibility and performance tests completed!');
  
  // إنهاء العملية بناءً على النتائج
  process.exit(testResults.summary.failed > 0 ? 1 : 0);
}

/**
 * إنشاء تقرير مبسط
 */
function generateSimpleReport() {
  const simpleReportPath = path.join(__dirname, '..', 'COMPATIBILITY_TEST_SUMMARY.md');
  
  const reportContent = `# ملخص اختبارات التوافق والأداء
# Compatibility and Performance Test Summary

**تاريخ التشغيل:** ${new Date().toLocaleDateString('ar-SA')}  
**Run Date:** ${new Date().toLocaleDateString('en-US')}

## النتائج - Results

- **إجمالي الاختبارات:** ${testResults.summary.total}
- **نجح:** ${testResults.summary.passed} ✅
- **فشل:** ${testResults.summary.failed} ❌
- **معدل النجاح:** ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%

## تفاصيل الاختبارات - Test Details

${testResults.tests.map((test, index) => {
  const status = test.success ? '✅' : '❌';
  return `${index + 1}. ${status} **${test.name}** (${test.duration}ms)
   - ${test.description}${!test.success && test.error ? `
   - خطأ: ${test.error.substring(0, 200)}...` : ''}`;
}).join('\n\n')}

## التوصيات - Recommendations

${testResults.summary.failed === 0 
  ? '🎉 جميع الاختبارات نجحت! النظام جاهز للإنتاج.'
  : `⚠️ هناك ${testResults.summary.failed} اختبار فشل. يرجى مراجعة الأخطاء وإصلاحها.`}

---
تم إنشاء هذا التقرير تلقائياً بواسطة نظام اختبار التوافق والأداء.
`;

  try {
    fs.writeFileSync(simpleReportPath, reportContent);
    console.log(`📄 تم إنشاء ملخص التقرير: ${simpleReportPath}`);
  } catch (error) {
    console.log(`❌ فشل في إنشاء ملخص التقرير: ${error.message}`);
  }
}

// تشغيل الاختبارات
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ خطأ في تشغيل الاختبارات:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests, runTest };