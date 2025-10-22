const mongoose = require('mongoose');
const SiteSettings = require('../models/SiteSettings');
require('dotenv').config();

const updateWhatsAppSettings = async () => {
  try {
    console.log('🔄 جاري الاتصال بقاعدة البيانات...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

    console.log('🔄 جاري تحديث إعدادات الواتساب...');
    
    // البحث عن الإعدادات الموجودة أو إنشاء جديدة
    let settings = await SiteSettings.findOne();
    
    if (!settings) {
      console.log('📝 إنشاء إعدادات جديدة...');
      settings = new SiteSettings();
    }

    // إضافة أو تحديث إعدادات الواتساب البسيطة
    if (!settings.contactInfo.whatsappEnabled) {
      settings.contactInfo.whatsappEnabled = true;
      console.log('✅ تم إضافة إعداد تفعيل الواتساب');
    } else {
      console.log('ℹ️ إعداد تفعيل الواتساب موجود بالفعل');
    }

    // حفظ التحديثات
    await settings.save();
    console.log('✅ تم حفظ إعدادات الواتساب بنجاح');

    // عرض الإعدادات المحدثة
    console.log('\n📋 إعدادات الواتساب الحالية:');
    console.log('- رقم الواتساب:', settings.contactInfo.whatsapp);
    console.log('- التفعيل:', settings.contactInfo.whatsappEnabled ? '✅ مفعل' : '❌ معطل');

  } catch (error) {
    console.error('❌ خطأ في تحديث إعدادات الواتساب:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 تم قطع الاتصال بقاعدة البيانات');
  }
};

// تشغيل السكريبت
if (require.main === module) {
  updateWhatsAppSettings();
}

module.exports = updateWhatsAppSettings;
