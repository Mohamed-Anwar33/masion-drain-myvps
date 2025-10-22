const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

async function testConnection() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/maison-darin');
    console.log('✅ Connected to MongoDB');

    // Test products collection
    const productCount = await Product.countDocuments();
    console.log(`📦 Products in database: ${productCount}`);

    if (productCount === 0) {
      console.log('⚠️  No products found. You may need to seed the database.');
    } else {
      // Get first few products
      const products = await Product.find().limit(3);
      console.log('📋 Sample products:');
      products.forEach(product => {
        console.log(`  - ${product.name.en} (${product.name.ar}) - $${product.price}`);
      });
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testConnection();