import React from 'react';
import { Link } from 'react-router-dom';
import { XCircle, ArrowRight, ShoppingBag, HelpCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const CheckoutCancel: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-neutral via-beige/50 to-off-white">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-24 right-12"
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        >
          <AlertTriangle className="w-5 h-5 text-orange-400/20" />
        </motion.div>
        <motion.div
          className="absolute bottom-32 left-16"
          animate={{ rotate: -360, scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="w-4 h-4 text-teal-green/15" />
        </motion.div>
      </div>

      <div className="container mx-auto px-4 py-16 relative">
        <motion.div 
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Cancel Icon */}
          <motion.div 
            className="mb-8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <div className="mx-auto w-28 h-28 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-luxury relative">
              <XCircle className="w-16 h-16 text-white" />
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-orange-300"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </div>
          </motion.div>

          {/* Cancel Message */}
          <motion.h1 
            className="text-5xl font-display font-bold text-dark-tea mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            😔 تم إلغاء الطلب
          </motion.h1>
          
          <motion.p 
            className="text-xl text-teal-green mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            لم يتم إكمال عملية الطلب. لا تقلق، لم يتم خصم أي مبلغ من حسابك ومنتجاتك محفوظة في السلة.
          </motion.p>

          {/* Reasons */}
          <motion.div 
            className="bg-white/70 backdrop-blur-sm border border-orange-200 rounded-2xl p-8 mb-10 shadow-glass"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-dark-tea mb-6 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-500 ml-2" />
              أسباب محتملة للإلغاء
            </h2>
            <div className="grid md:grid-cols-2 gap-4 text-right">
              <motion.div 
                className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-4"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-orange-400 rounded-full ml-3"></div>
                  <span className="text-dark-tea font-medium">إغلاق النافذة بالخطأ</span>
                </div>
                <p className="text-sm text-teal-green/80 pr-6">تم إغلاق صفحة الدفع قبل إتمام العملية</p>
              </motion.div>
              
              <motion.div 
                className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl p-4"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full ml-3"></div>
                  <span className="text-dark-tea font-medium">مشكلة في الاتصال</span>
                </div>
                <p className="text-sm text-teal-green/80 pr-6">انقطاع مؤقت في الإنترنت أثناء الدفع</p>
              </motion.div>
              
              <motion.div 
                className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full ml-3"></div>
                  <span className="text-dark-tea font-medium">تغيير الرأي</span>
                </div>
                <p className="text-sm text-teal-green/80 pr-6">قررت عدم إكمال الطلب في اللحظة الأخيرة</p>
              </motion.div>
              
              <motion.div 
                className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-purple-400 rounded-full ml-3"></div>
                  <span className="text-dark-tea font-medium">مشكلة تقنية</span>
                </div>
                <p className="text-sm text-teal-green/80 pr-6">خطأ مؤقت في نظام الدفع</p>
              </motion.div>
            </div>
          </motion.div>

          {/* What's Next */}
          <motion.div 
            className="bg-gradient-to-r from-beige/50 to-soft-neutral/50 backdrop-blur-sm border border-gold/30 rounded-2xl p-8 mb-10 shadow-glass"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h3 className="text-2xl font-bold text-dark-tea mb-6 flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-teal-green ml-2" />
              ماذا يمكنك فعله الآن؟
            </h3>
            <div className="grid md:grid-cols-3 gap-6 text-right">
              <motion.div 
                className="bg-gradient-to-br from-teal-green/10 to-teal-green/5 rounded-xl p-6"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <ShoppingBag className="w-8 h-8 text-teal-green mb-4 mx-auto" />
                <div className="text-dark-tea font-bold text-lg mb-2">العودة للسلة</div>
                <div className="text-teal-green/80 text-sm leading-relaxed">
                  منتجاتك محفوظة في السلة وبانتظارك
                </div>
              </motion.div>
              
              <motion.div 
                className="bg-gradient-to-br from-gold/10 to-gold/5 rounded-xl p-6"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <ArrowRight className="w-8 h-8 text-gold mb-4 mx-auto" />
                <div className="text-dark-tea font-bold text-lg mb-2">إعادة المحاولة</div>
                <div className="text-teal-green/80 text-sm leading-relaxed">
                  يمكنك المحاولة مرة أخرى في أي وقت
                </div>
              </motion.div>
              
              <motion.div 
                className="bg-gradient-to-br from-light-brown/10 to-light-brown/5 rounded-xl p-6"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <HelpCircle className="w-8 h-8 text-light-brown mb-4 mx-auto" />
                <div className="text-dark-tea font-bold text-lg mb-2">طلب المساعدة</div>
                <div className="text-teal-green/80 text-sm leading-relaxed">
                  تواصل معنا إذا واجهت أي مشكلة
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Contact Info */}
          <motion.div 
            className="bg-gradient-to-r from-orange-50/80 to-red-50/80 backdrop-blur-sm border border-orange-200 rounded-2xl p-8 mb-10 shadow-glass"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h3 className="text-xl font-bold text-dark-tea mb-6 flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-orange-500 ml-2" />
              تحتاج مساعدة؟
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
            <p className="text-sm text-teal-green/80 mt-4 font-medium">
              🕐 فريق الدعم متاح 24/7 لمساعدتك
            </p>
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
                to="/checkout"
                className="bg-gradient-to-r from-gold to-gold-light hover:from-gold-light hover:to-gold text-dark-tea font-bold py-4 px-10 rounded-xl transition-all duration-300 shadow-luxury hover:shadow-xl inline-block"
              >
                🔄 إعادة المحاولة
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
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/"
                className="bg-transparent border-2 border-light-brown text-light-brown hover:bg-light-brown hover:text-off-white font-bold py-4 px-10 rounded-xl transition-all duration-300 shadow-glass hover:shadow-luxury inline-block"
              >
                🏠 الصفحة الرئيسية
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default CheckoutCancel;
