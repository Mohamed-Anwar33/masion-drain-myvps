const mongoose = require('mongoose');
const SiteSettings = require('../models/SiteSettings');
require('dotenv').config();

const updatePayPalToLive = async () => {
  try {
    console.log('🔄 جاري الاتصال بقاعدة البيانات...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

    console.log('🔄 جاري تحديث إعدادات PayPal إلى Live...');
    
    // البحث عن الإعدادات الموجودة أو إنشاء جديدة
    let settings = await SiteSettings.findOne();
    
    if (!settings) {
      console.log('📝 إنشاء إعدادات جديدة...');
      settings = new SiteSettings();
    }

    // تحديث إعدادات PayPal لتكون Live
    if (!settings.paypalSettings) {
      settings.paypalSettings = {};
    }

    const oldEnvironment = settings.paypalSettings.environment || 'sandbox';
    settings.paypalSettings.environment = 'live';

    // حفظ التحديثات
    await settings.save();
    console.log('✅ تم تحديث إعدادات PayPal بنجاح');

    // عرض الإعدادات المحدثة
    console.log('\n📋 إعدادات PayPal المحدثة:');
    console.log('- البيئة السابقة:', oldEnvironment);
    console.log('- البيئة الجديدة:', settings.paypalSettings.environment);
    console.log('- حالة التفعيل:', settings.paypalSettings.enabled ? '✅ مفعل' : '❌ معطل');
    console.log('- Client ID:', settings.paypalSettings.clientId ? '✅ موجود' : '❌ غير موجود');
    console.log('- Client Secret:', settings.paypalSettings.clientSecret ? '✅ موجود' : '❌ غير موجود');

    console.log('\n🚀 PayPal جاهز للإنتاج (Live Environment)!');
    console.log('⚠️  تأكد من إدخال بيانات PayPal الحقيقية (Live) في لوحة التحكم');

  } catch (error) {
    console.error('❌ خطأ في تحديث إعدادات PayPal:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 تم قطع الاتصال بقاعدة البيانات');
  }
};

// تشغيل السكريبت
if (require.main === module) {
  updatePayPalToLive();
}

module.exports = updatePayPalToLive;
