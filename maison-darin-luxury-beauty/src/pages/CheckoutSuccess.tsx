import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Package, Mail, Phone, Sparkles, Heart, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const CheckoutSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const orderNumber = searchParams.get('orderNumber');

  useEffect(() => {
    if (orderNumber) {
      // Fetch order details if needed
      fetchOrderDetails(orderNumber);
    }
  }, [orderNumber]);

  const fetchOrderDetails = async (orderNum: string) => {
    try {
      const response = await fetch(`/api/orders/public/${orderNum}`);
      if (response.ok) {
        const data = await response.json();
        setOrderDetails(data);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-off-white via-soft-neutral to-beige">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10"
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-6 h-6 text-gold/30" />
        </motion.div>
        <motion.div
          className="absolute top-32 right-16"
          animate={{ rotate: -360, scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        >
          <Heart className="w-5 h-5 text-teal-green/20" />
        </motion.div>
        <motion.div
          className="absolute bottom-32 left-20"
          animate={{ rotate: 360, scale: [1, 1.3, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        >
          <Star className="w-4 h-4 text-light-brown/25" />
        </motion.div>
      </div>

      <div className="container mx-auto px-4 py-16 relative">
        <motion.div 
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Success Icon */}
          <motion.div 
            className="mb-8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <div className="mx-auto w-28 h-28 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-luxury relative">
              <CheckCircle className="w-16 h-16 text-white" />
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-emerald-300"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>

          {/* Success Message */}
          <motion.h1 
            className="text-5xl font-display font-bold text-dark-tea mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            🎉 تم تأكيد طلبك بنجاح!
          </motion.h1>
          
          <motion.p 
            className="text-xl text-teal-green mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            شكراً لك على ثقتك في ميزون دارين. سنتواصل معك قريباً لتأكيد التفاصيل وضمان وصول طلبك في أفضل حالة.
          </motion.p>

          {/* Order Number */}
          {orderNumber && (
            <motion.div 
              className="bg-gradient-to-r from-gold/20 to-gold-light/20 border-2 border-gold/30 rounded-2xl p-8 mb-10 shadow-luxury backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center justify-center mb-6">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Package className="w-8 h-8 text-gold ml-3" />
                </motion.div>
                <span className="text-2xl font-bold text-dark-tea">رقم الطلب</span>
              </div>
              <div className="text-4xl font-bold text-dark-tea font-mono bg-white/50 rounded-xl py-4 px-6 inline-block shadow-inner">
                {orderNumber}
              </div>
              <p className="text-teal-green font-medium mt-4 text-lg">
                احتفظ بهذا الرقم للمتابعة والاستعلام
              </p>
            </motion.div>
          )}

          {/* Next Steps */}
          <motion.div 
            className="bg-white/70 backdrop-blur-sm border border-teal-green/20 rounded-2xl p-8 mb-10 shadow-glass"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-dark-tea mb-6 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-gold ml-2" />
              الخطوات التالية
            </h2>
            <div className="grid md:grid-cols-3 gap-6 text-right">
              <motion.div 
                className="bg-gradient-to-br from-teal-green/10 to-teal-green/5 rounded-xl p-6"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Mail className="w-8 h-8 text-teal-green mb-4 mx-auto" />
                <div className="text-dark-tea font-bold text-lg mb-2">تأكيد بالإيميل</div>
                <div className="text-teal-green/80 text-sm leading-relaxed">
                  ستصلك رسالة تأكيد تحتوي على جميع تفاصيل طلبك
                </div>
              </motion.div>
              
              <motion.div 
                className="bg-gradient-to-br from-light-brown/10 to-light-brown/5 rounded-xl p-6"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Phone className="w-8 h-8 text-light-brown mb-4 mx-auto" />
                <div className="text-dark-tea font-bold text-lg mb-2">اتصال للتأكيد</div>
                <div className="text-teal-green/80 text-sm leading-relaxed">
                  سنتصل بك خلال 24 ساعة لتأكيد الطلب وتفاصيل التسليم
                </div>
              </motion.div>
              
              <motion.div 
                className="bg-gradient-to-br from-gold/10 to-gold/5 rounded-xl p-6"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Package className="w-8 h-8 text-gold mb-4 mx-auto" />
                <div className="text-dark-tea font-bold text-lg mb-2">التحضير والشحن</div>
                <div className="text-teal-green/80 text-sm leading-relaxed">
                  سيتم تحضير طلبك وشحنه خلال 2-3 أيام عمل
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Contact Info */}
          <motion.div 
            className="bg-gradient-to-r from-beige/50 to-soft-neutral/50 backdrop-blur-sm border border-gold/30 rounded-2xl p-8 mb-10 shadow-glass"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h3 className="text-xl font-bold text-dark-tea mb-6 flex items-center justify-center">
              <Heart className="w-6 h-6 text-teal-green ml-2" />
              هل تحتاج مساعدة؟
            </h3>
            <div className="grid md:grid-cols-3 gap-4 text-dark-tea">
              <motion.div 
                className="bg-white/60 rounded-xl p-4 shadow-sm"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-2xl mb-2">📧</div>
                <div className="font-medium">البريد الإلكتروني</div>
                <div className="text-sm text-teal-green">maisondarin2025@gmail.com</div>
              </motion.div>
              <motion.div 
                className="bg-white/60 rounded-xl p-4 shadow-sm"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-2xl mb-2">📱</div>
                <div className="font-medium">واتساب</div>
                <div className="text-sm text-teal-green">+20 123 456 7890</div>
              </motion.div>
              <motion.div 
                className="bg-white/60 rounded-xl p-4 shadow-sm"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-2xl mb-2">📞</div>
                <div className="font-medium">الهاتف</div>
                <div className="text-sm text-teal-green">+20 123 456 7890</div>
              </motion.div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-6 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/"
                className="bg-gradient-to-r from-gold to-gold-light hover:from-gold-light hover:to-gold text-dark-tea font-bold py-4 px-10 rounded-xl transition-all duration-300 shadow-luxury hover:shadow-xl inline-block"
              >
                🏠 العودة للصفحة الرئيسية
              </Link>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/products"
                className="bg-transparent border-2 border-teal-green text-teal-green hover:bg-teal-green hover:text-off-white font-bold py-4 px-10 rounded-xl transition-all duration-300 shadow-glass hover:shadow-luxury inline-block"
              >
                🛍️ تصفح المنتجات
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
