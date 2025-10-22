const mongoose = require('mongoose');
const Product = require('./models/Product');

async function checkDatabase() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/maison-darin';
    await mongoose.connect(mongoUri);
    
    console.log('✅ متصل بقاعدة البيانات MongoDB');
    console.log(`📊 اسم قاعدة البيانات: ${mongoose.connection.name}`);
    console.log(`🌐 الخادم: ${mongoose.connection.host}:${mongoose.connection.port}`);
    
    // Check products
    const productCount = await Product.countDocuments();
    console.log(`\n📦 عدد المنتجات في قاعدة البيانات: ${productCount}`);
    
    if (productCount > 0) {
      console.log('\n🎯 المنتجات الموجودة:');
      const products = await Product.find({}, 'name.ar name.en price category inStock').limit(10);
      
      products.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name.ar} (${product.name.en})`);
        console.log(`   💰 السعر: ${product.price} ريال`);
        console.log(`   📂 الفئة: ${product.category}`);
        console.log(`   📦 متوفر: ${product.inStock ? 'نعم' : 'لا'}`);
        console.log('   ─────────────────────────────');
      });
    } else {
      console.log('\n❌ لا توجد منتجات في قاعدة البيانات!');
      console.log('\n💡 لتحميل المنتجات، استخدم الأمر:');
      console.log('   node scripts/seed.js');
    }
    
    // Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n📋 المجموعات الموجودة في قاعدة البيانات:`);
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
  } catch (error) {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 تم قطع الاتصال بقاعدة البيانات');
  }
}

checkDatabase();
