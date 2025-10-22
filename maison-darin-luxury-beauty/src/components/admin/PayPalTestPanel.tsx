import React, { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { TestTube, Play, CheckCircle, XCircle, DollarSign } from 'lucide-react';

const PayPalTestPanel: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const { showSaveSuccess, showSaveError, showInfo } = useNotifications();

  const runComprehensiveTest = async () => {
    setTesting(true);
    setTestResults(null);

    try {
      const tests = [
        { name: 'Connection Test', endpoint: '/api/paypal/test' },
        { name: 'Config Test', endpoint: '/api/paypal/config' },
        { name: 'Settings Test', endpoint: '/api/paypal/settings' }
      ];

      const results = [];

      for (const test of tests) {
        try {
          const response = await fetch(test.endpoint, {
            method: test.endpoint.includes('settings') ? 'GET' : 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
              'Content-Type': 'application/json'
            }
          });

          const data = await response.json();
          
          results.push({
            name: test.name,
            status: response.ok ? 'success' : 'error',
            message: data.message || 'Test completed',
            data: data
          });
        } catch (error) {
          results.push({
            name: test.name,
            status: 'error',
            message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            data: null
          });
        }
      }

      // Test payment creation
      try {
        const paymentTest = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/paypal/create-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: 1.00,
            currency: 'USD',
            returnUrl: `${window.location.origin}/test/success`,
            cancelUrl: `${window.location.origin}/test/cancel`,
            description: 'Test payment for integration'
          })
        });

        const paymentData = await paymentTest.json();
        
        results.push({
          name: 'Payment Creation Test',
          status: paymentTest.ok ? 'success' : 'error',
          message: paymentTest.ok ? 'Payment created successfully' : paymentData.message,
          data: paymentData
        });
      } catch (error) {
        results.push({
          name: 'Payment Creation Test',
          status: 'error',
          message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          data: null
        });
      }

      setTestResults(results);
      
      const successCount = results.filter(r => r.status === 'success').length;
      const totalTests = results.length;
      
      if (successCount === totalTests) {
        showInfo('نتائج الاختبار', 'جميع الاختبارات نجحت! PayPal جاهز للاستخدام');
      } else {
        showInfo('نتائج الاختبار', `نجح ${successCount} من ${totalTests} اختبارات`);
      }

    } catch (error) {
      console.error('Test suite error:', error);
      showSaveError('فشل في تشغيل الاختبارات');
    } finally {
      setTesting(false);
    }
  };

  const simulatePayment = async () => {
    showInfo('محاكاة الدفع', 'سيتم فتح نافذة PayPal للاختبار...');
    
    try {
      // Open PayPal sandbox in new window for testing
      const testUrl = 'https://www.sandbox.paypal.com/signin';
      window.open(testUrl, '_blank', 'width=600,height=700');
      
      showInfo('اختبار PayPal', 'تم فتح PayPal Sandbox للاختبار');
    } catch (error) {
      showSaveError('فشل في فتح PayPal للاختبار');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-off-white">
            اختبار PayPal
          </h2>
          <p className="text-beige/80 mt-2">
            اختبار شامل لتكامل PayPal والتأكد من عمل النظام
          </p>
        </div>
        <TestTube className="w-8 h-8 text-gold" />
      </div>

      <div className="bg-dark-brown/50 rounded-lg border border-gold/20 p-6">
        <div className="space-y-6">
          {/* Test Controls */}
          <div className="flex gap-4">
            <button
              onClick={runComprehensiveTest}
              disabled={testing}
              className="flex items-center gap-2 bg-gold hover:bg-gold/90 disabled:bg-gold/50 text-dark-brown font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              {testing ? 'جاري الاختبار...' : 'تشغيل اختبار شامل'}
            </button>

            <button
              onClick={simulatePayment}
              disabled={testing}
              className="flex items-center gap-2 bg-transparent border border-gold text-gold hover:bg-gold hover:text-dark-brown disabled:opacity-50 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              <DollarSign className="w-4 h-4" />
              محاكاة دفع
            </button>
          </div>

          {/* Test Results */}
          {testResults && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-off-white border-b border-gold/20 pb-2">
                نتائج الاختبار
              </h3>
              
              <div className="grid gap-3">
                {testResults.map((result: any, index: number) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      result.status === 'success' 
                        ? 'bg-green-900/20 border-green-400' 
                        : 'bg-red-900/20 border-red-400'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {result.status === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                      <span className="font-medium text-off-white">
                        {result.name}
                      </span>
                    </div>
                    <p className="text-beige/80 text-sm mb-2">
                      {result.message}
                    </p>
                    {result.data && (
                      <details className="text-xs text-beige/60">
                        <summary className="cursor-pointer hover:text-beige/80">
                          عرض التفاصيل
                        </summary>
                        <pre className="mt-2 p-2 bg-dark-brown/50 rounded text-xs overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-6 p-4 bg-gold/10 border border-gold/20 rounded-lg">
                <h4 className="text-gold font-semibold mb-2">ملخص النتائج</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-beige/80">إجمالي الاختبارات:</span>
                    <span className="text-off-white font-medium ml-2">
                      {testResults.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-beige/80">نجح:</span>
                    <span className="text-green-400 font-medium ml-2">
                      {testResults.filter((r: any) => r.status === 'success').length}
                    </span>
                  </div>
                  <div>
                    <span className="text-beige/80">فشل:</span>
                    <span className="text-red-400 font-medium ml-2">
                      {testResults.filter((r: any) => r.status === 'error').length}
                    </span>
                  </div>
                  <div>
                    <span className="text-beige/80">معدل النجاح:</span>
                    <span className="text-off-white font-medium ml-2">
                      {Math.round((testResults.filter((r: any) => r.status === 'success').length / testResults.length) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Testing Guidelines */}
          <div className="bg-gold/10 border border-gold/20 rounded-lg p-4">
            <h3 className="text-gold font-semibold mb-2">إرشادات الاختبار:</h3>
            <ul className="text-beige/80 text-sm space-y-1">
              <li>• تأكد من إدخال بيانات PayPal الصحيحة قبل الاختبار</li>
              <li>• استخدم وضع Sandbox للاختبار الآمن</li>
              <li>• اختبر بعملات مختلفة للتأكد من الدعم</li>
              <li>• راجع PayPal Developer Dashboard للمعاملات</li>
              <li>• اختبر سيناريوهات النجاح والفشل والإلغاء</li>
            </ul>
          </div>

          {/* Quick Access Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="https://developer.paypal.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 bg-dark-brown/30 border border-gold/10 rounded-lg hover:border-gold/30 transition-colors"
            >
              <h4 className="text-off-white font-medium mb-1">PayPal Developer</h4>
              <p className="text-beige/60 text-sm">إدارة التطبيقات والإعدادات</p>
            </a>
            <a
              href="https://www.sandbox.paypal.com/"
              target="_blank"
              rel="noopener noreferrer"  
              className="block p-4 bg-dark-brown/30 border border-gold/10 rounded-lg hover:border-gold/30 transition-colors"
            >
              <h4 className="text-off-white font-medium mb-1">PayPal Sandbox</h4>
              <p className="text-beige/60 text-sm">اختبار المعاملات والدفع</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayPalTestPanel;
