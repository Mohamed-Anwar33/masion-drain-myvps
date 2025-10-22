// اختبار سريع لـ Cloudinary
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// إعدادات Cloudinary
cloudinary.config({
  cloud_name: 'dbixjzxgp',
  api_key: '541661697753599',
  api_secret: 'nBlJQPoCISYrdFu2YR6GlDtKskU'
});

console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME || 'غير محدد');
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? 'محدد ✅' : 'غير محدد ❌');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? 'محدد ✅' : 'غير محدد ❌');

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'maison-darin',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function testCloudinary() {
  try {
    // Test upload with a sample image
    console.log('\n📤 اختبار رفع صورة تجريبية...');
    
    const result = await cloudinary.uploader.upload(
      'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop',
      {
        folder: 'maison-darin/test',
        public_id: 'test-image',
        overwrite: true
      }
    );
    
    console.log('✅ تم رفع الصورة بنجاح!');
    console.log('🔗 رابط الصورة:', result.secure_url);
    
    // Test listing existing images
    console.log('\n📋 البحث عن الصور الموجودة...');
    const resources = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'maison-darin/products',
      max_results: 10
    });
    
    console.log(`📦 وجدت ${resources.resources.length} صورة في مجلد المنتجات:`);
    resources.resources.forEach((resource, index) => {
      console.log(`${index + 1}. ${resource.public_id}`);
      console.log(`   🔗 ${resource.secure_url}`);
    });
    
  } catch (error) {
    console.error('❌ خطأ في اختبار Cloudinary:', error.message);
    
    if (error.message.includes('Invalid API key')) {
      console.log('\n💡 الحل: تأكد من صحة CLOUDINARY_API_KEY في ملف .env');
    } else if (error.message.includes('Invalid cloud name')) {
      console.log('\n💡 الحل: تأكد من صحة CLOUDINARY_CLOUD_NAME في ملف .env');
    }
  }
}

testCloudinary();
