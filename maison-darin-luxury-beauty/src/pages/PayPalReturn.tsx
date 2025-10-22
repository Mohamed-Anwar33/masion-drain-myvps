import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';

const PayPalReturn: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processPayPalReturn = async () => {
      try {
        const token = searchParams.get('token'); // PayPal order ID
        const payerId = searchParams.get('PayerID');

        console.log('\n════════════════════════════════════');
        console.log('🔄 PROCESSING PAYPAL RETURN');
        console.log('════════════════════════════════════');
        console.log('📋 Token (Order ID):', token);
        console.log('👤 Payer ID:', payerId);
        console.log('🕐 Timestamp:', new Date().toISOString());

        if (!token || !payerId) {
          console.error('❌ Missing PayPal parameters');
          throw new Error('معاملات PayPal مفقودة');
        }

        console.log('\n💳 Sending capture request to backend...');

        // Capture the payment
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/paypal/orders/${token}/capture`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        console.log('📡 Response Status:', response.status);
        console.log('📡 Response OK:', response.ok);

        const result = await response.json();
        console.log('\n📋 Payment Capture Result:');
        console.log(JSON.stringify(result, null, 2));

        if (response.ok && result.success && result.status === 'COMPLETED') {
          console.log('\n✅ PAYMENT SUCCESSFUL!');
          console.log('   Order Number:', result.localOrderNumber);
          console.log('   Capture ID:', result.captureId);
          console.log('════════════════════════════════════\n');
          
          // Payment successful - clear cart and redirect to success page
          clearCart();
          navigate(`/checkout/success?orderNumber=${result.localOrderNumber}`, { 
            replace: true 
          });
        } else {
          // Payment failed - extract detailed error
          console.error('\n❌ PAYMENT CAPTURE FAILED');
          console.error('   Error Code:', result.error);
          console.error('   Message:', result.message);
          console.error('   Details:', result.details);
          console.error('════════════════════════════════════\n');
          
          // Build detailed error message
          let errorMessage = result.message || 'فشل في تأكيد الدفع';
          
          // Add debug info if available
          if (result.debugInfo) {
            console.error('🐛 Debug Info:', result.debugInfo);
          }
          
          // Add error code to message for clarity
          if (result.error && result.error !== 'CAPTURE_FAILED') {
            errorMessage += ` (${result.error})`;
          }
          
          throw new Error(errorMessage);
        }

      } catch (error: any) {
        console.error('\n❌ PAYPAL RETURN ERROR');
        console.error('════════════════════════════════════');
        console.error('Error:', error);
        console.error('Message:', error.message);
        console.error('════════════════════════════════════\n');
        
        setError(error.message || 'حدث خطأ أثناء معالجة الدفع');
        setIsProcessing(false);
        
        // Redirect to cancel page after 5 seconds (increased from 3)
        setTimeout(() => {
          navigate('/checkout/cancel', { replace: true });
        }, 5000);
      }
    };

    processPayPalReturn();
  }, [searchParams, navigate, clearCart]);

  if (error) {
    return (
      <div className="min-h-screen bg-dark-brown flex items-center justify-center p-4">
        <div className="max-w-lg mx-auto text-center">
          <div className="bg-gradient-to-br from-dark-brown via-dark-brown/95 to-dark-brown/90 rounded-2xl shadow-2xl p-8 border border-red-500/20">
            <div className="mb-6">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-3xl">❌</span>
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-off-white mb-4">
              خطأ في معالجة الدفع
            </h1>
            
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <p className="text-off-white/90 text-lg leading-relaxed">
                {error}
              </p>
            </div>

            <div className="bg-gold/5 border border-gold/20 rounded-lg p-4 mb-6">
              <p className="text-beige/80 text-sm">
                💡 <strong>ماذا حدث؟</strong>
              </p>
              <p className="text-beige/60 text-sm mt-2">
                حدث خطأ أثناء تأكيد دفعتك مع PayPal. قد يكون السبب:
              </p>
              <ul className="text-beige/60 text-sm mt-2 text-right list-disc list-inside space-y-1">
                <li>انتهت صلاحية جلسة الدفع</li>
                <li>تم إلغاء العملية من PayPal</li>
                <li>مشكلة مؤقتة في الاتصال</li>
                <li>الطلب تم معالجته مسبقاً</li>
              </ul>
            </div>

            <div className="flex items-center justify-center gap-2 text-beige/70 text-sm animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              <p>سيتم توجيهك تلقائياً خلال 5 ثوان...</p>
            </div>

            <div className="mt-6 pt-6 border-t border-beige/10">
              <p className="text-beige/60 text-xs">
                إذا كنت بحاجة للمساعدة، يرجى التواصل مع الدعم الفني
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-off-white via-soft-neutral to-beige flex items-center justify-center">
      <motion.div 
        className="max-w-md mx-auto text-center p-8"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="mb-8"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-gold to-gold-light rounded-full flex items-center justify-center shadow-luxury">
            <Loader className="w-10 h-10 text-dark-tea" />
          </div>
        </motion.div>
        
        <motion.h1 
          className="text-3xl font-display font-bold text-dark-tea mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          جاري معالجة الدفع...
        </motion.h1>
        
        <motion.p 
          className="text-xl text-teal-green mb-6 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          يرجى الانتظار بينما نتأكد من عملية الدفع وننشئ طلبك
        </motion.p>
        
        <motion.div 
          className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-gold/20 shadow-glass"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="text-dark-tea font-medium mb-2">⚠️ تعليمات مهمة</div>
          <div className="text-sm text-teal-green/80">
            لا تغلق هذه الصفحة أو تضغط على زر الرجوع حتى اكتمال العملية
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PayPalReturn;
