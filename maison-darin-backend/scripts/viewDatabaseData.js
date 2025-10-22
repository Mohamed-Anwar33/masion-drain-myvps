#!/usr/bin/env node

/**
 * Database Data Viewer
 * أداة لعرض البيانات الموجودة في قاعدة البيانات
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Product = require('../models/Product');
const Content = require('../models/Content');
const User = require('../models/User');

async function viewDatabaseData() {
  try {
    // الاتصال بقاعدة البيانات
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/maison-darin';
    console.log('🔌 Connecting to:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully');

    console.log('\n' + '='.repeat(60));
    console.log('📊 MAISON DARIN DATABASE OVERVIEW');
    console.log('='.repeat(60));

    // عرض إحصائيات عامة
    const productCount = await Product.countDocuments();
    const contentCount = await Content.countDocuments({ isActive: true });
    const userCount = await User.countDocuments();

    console.log('\n📈 DATABASE STATISTICS:');
    console.log(`   Products: ${productCount}`);
    console.log(`   Content Sections: ${contentCount}`);
    console.log(`   Users: ${userCount}`);

    // عرض المنتجات
    console.log('\n📦 PRODUCTS:');
    console.log('-'.repeat(40));
    const products = await Product.find({}).sort({ price: 1 });
    
    if (products.length === 0) {
      console.log('   ❌ No products found');
    } else {
      products.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name.en} (${product.name.ar})`);
        console.log(`      Category: ${product.category}`);
        console.log(`      Price: $${product.price}`);
        console.log(`      In Stock: ${product.inStock ? 'Yes' : 'No'}`);
        console.log(`      Featured: ${product.featured ? 'Yes' : 'No'}`);
        console.log(`      Images: ${product.images ? product.images.length : 0}`);
        console.log('');
      });
    }

    // عرض الفئات
    const categories = await Product.distinct('category');
    console.log('🏷️ CATEGORIES:');
    console.log(`   ${categories.join(', ')}`);

    // عرض المحتوى
    console.log('\n📄 CONTENT SECTIONS:');
    console.log('-'.repeat(40));
    const contentSections = await Content.find({ isActive: true }).sort({ section: 1 });
    
    if (contentSections.length === 0) {
      console.log('   ❌ No content sections found');
    } else {
      contentSections.forEach((content, index) => {
        console.log(`   ${index + 1}. ${content.section.toUpperCase()}`);
        console.log(`      English Title: ${content.content.en.title || 'N/A'}`);
        console.log(`      Arabic Title: ${content.content.ar.title || 'N/A'}`);
        console.log(`      Version: ${content.version}`);
        console.log(`      Last Updated: ${content.updatedAt.toLocaleDateString()}`);
        console.log('');
      });
    }

    // عرض المنتجات المميزة
    const featuredProducts = await Product.find({ featured: true });
    console.log('⭐ FEATURED PRODUCTS:');
    console.log('-'.repeat(40));
    if (featuredProducts.length === 0) {
      console.log('   ❌ No featured products found');
    } else {
      featuredProducts.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name.en} - $${product.price}`);
      });
    }

    // عرض نطاق الأسعار
    if (products.length > 0) {
      const prices = products.map(p => p.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

      console.log('\n💰 PRICE ANALYSIS:');
      console.log('-'.repeat(40));
      console.log(`   Minimum Price: $${minPrice}`);
      console.log(`   Maximum Price: $${maxPrice}`);
      console.log(`   Average Price: $${avgPrice}`);
    }

    // عرض المستخدمين
    console.log('\n👥 USERS:');
    console.log('-'.repeat(40));
    const users = await User.find({}).select('email role createdAt');
    if (users.length === 0) {
      console.log('   ❌ No users found');
    } else {
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.role})`);
        console.log(`      Created: ${user.createdAt.toLocaleDateString()}`);
        console.log('');
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ DATABASE OVERVIEW COMPLETE');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error viewing database data:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// تشغيل الأداة إذا تم استدعاؤها مباشرة
if (require.main === module) {
  viewDatabaseData();
}

module.exports = viewDatabaseData;