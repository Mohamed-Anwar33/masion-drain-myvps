// اختبار سريع لـ Cloudinary
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// إعدادات Cloudinary
cloudinary.config({
  cloud_name: 'dbixjzxgp',
  api_key: '541661697753599',
  api_secret: 'nBlJQPoCISYrdFu2YR6GlDtKskU'
});

async function testCloudinary() {
  try {
    console.log('🧪 اختبار اتصال Cloudinary...');
    
    // اختبار الاتصال
    const result = await cloudinary.api.ping();
    console.log('✅ الاتصال بـ Cloudinary نجح!', result);
    
    // اختبار Upload Presets
    console.log('\n🔍 فحص Upload Presets...');
    const presets = await cloudinary.api.upload_presets();
    console.log('📋 Upload Presets الموجودة:');
    presets.presets.forEach(preset => {
      console.log(`   - ${preset.name} (${preset.unsigned ? 'Unsigned' : 'Signed'})`);
    });
    
    // التحقق من وجود maison_darin preset
    const maisondarin = presets.presets.find(p => p.name === 'maison_darin');
    if (maisondarin) {
      console.log('✅ Upload Preset "maison_darin" موجود!');
      console.log(`   - Unsigned: ${maisondarin.unsigned}`);
      console.log(`   - Folder: ${maisondarin.folder || 'غير محدد'}`);
    } else {
      console.log('❌ Upload Preset "maison_darin" غير موجود!');
      console.log('\n📝 يرجى إنشاء Upload Preset بالخطوات التالية:');
      console.log('1. اذهب إلى cloudinary.com > Settings > Upload');
      console.log('2. اضغط "Add upload preset"');
      console.log('3. اسم الـ preset: maison_darin');
      console.log('4. Signing Mode: Unsigned');
      console.log('5. Folder: maison-darin/hero-images');
    }
    
  } catch (error) {
    console.error('❌ خطأ في الاتصال بـ Cloudinary:', error.message);
    
    if (error.http_code === 401) {
      console.log('\n🔑 خطأ في المصادقة - تأكد من:');
      console.log('- Cloud Name صحيح');
      console.log('- API Key صحيح');
      console.log('- API Secret صحيح');
    }
  }
}

// تشغيل الاختبار
testCloudinary();
