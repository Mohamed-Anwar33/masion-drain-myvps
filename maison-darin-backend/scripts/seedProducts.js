#!/usr/bin/env node

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Product = require('../models/Product');
// Import real product data from website migration
const realProductData = require('./seedData/realProducts');
const { products: realProducts } = realProductData;

async function seedProducts() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/maison-darin';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    console.log('🧴 Seeding real products from website migration...');
    console.log(`📊 Total products to seed: ${realProducts.length}`);
    
    // Clear existing products first (optional - remove this if you want to keep existing data)
    console.log('🗑️  Clearing existing products...');
    await Product.deleteMany({});
    console.log('✅ Existing products cleared');

    let createdCount = 0;
    let updatedCount = 0;

    for (const productData of realProducts) {
      try {
        // Check if product already exists by frontend ID or name
        const existingProduct = await Product.findOne({ 
          $or: [
            { frontendId: productData.frontendId },
            { 'name.en': productData.name.en }
          ]
        });
        
        if (existingProduct) {
          console.log(`ℹ️  Product ${productData.name.en} already exists, updating...`);
          await Product.findByIdAndUpdate(existingProduct._id, productData);
          console.log(`✅ Updated product: ${productData.name.en}`);
          updatedCount++;
        } else {
          const product = await Product.create(productData);
          console.log(`✅ Created product: ${product.name.en} (${product.category})`);
          createdCount++;
        }
      } catch (error) {
        console.error(`❌ Error seeding product ${productData.name.en}:`, error.message);
      }
    }
    
    console.log('\n📊 SEEDING SUMMARY:');
    console.log(`   Products created: ${createdCount}`);
    console.log(`   Products updated: ${updatedCount}`);
    console.log(`   Total processed: ${createdCount + updatedCount}`);
    console.log('✅ Real products seeded successfully from website migration!');
    
    // Display database summary
    const totalProducts = await Product.countDocuments();
    const featuredProducts = await Product.countDocuments({ featured: true });
    const inStockProducts = await Product.countDocuments({ inStock: true });
    
    console.log('\n📊 DATABASE SUMMARY:');
    console.log('===================');
    console.log(`Total Products: ${totalProducts}`);
    console.log(`Featured Products: ${featuredProducts}`);
    console.log(`In Stock Products: ${inStockProducts}`);
    console.log(`Data Source: Website Migration (${realProductData.metadata.generatedAt})`);

  } catch (error) {
    console.error('❌ Error seeding products:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  seedProducts();
}

module.exports = seedProducts;