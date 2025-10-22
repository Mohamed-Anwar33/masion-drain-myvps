#!/usr/bin/env node

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import models
const User = require('../models/User');
const Product = require('../models/Product');
const Content = require('../models/Content');

// Import seed data
const { adminUsers } = require('./seedData/users');
const { products } = require('./seedData/products');
const { contentSections } = require('./seedData/content');

class DatabaseSeeder {
  constructor() {
    this.mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/maison-darin';
    this.isConnected = false;
  }

  async connect() {
    try {
      await mongoose.connect(this.mongoUri);
      this.isConnected = true;
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.isConnected) {
      await mongoose.connection.close();
      this.isConnected = false;
      console.log('🔌 Database connection closed');
    }
  }

  async clearDatabase() {
    try {
      console.log('🧹 Clearing existing data...');
      
      await User.deleteMany({});
      await Product.deleteMany({});
      await Content.deleteMany({});
      
      console.log('✅ Database cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing database:', error.message);
      throw error;
    }
  }

  async seedUsers() {
    try {
      console.log('👤 Seeding admin users...');
      
      for (const userData of adminUsers) {
        const existingUser = await User.findOne({ email: userData.email });
        
        if (existingUser) {
          console.log(`ℹ️  User ${userData.email} already exists, skipping...`);
          continue;
        }

        const user = await User.create(userData);
        console.log(`✅ Created user: ${user.email}`);
      }
      
      console.log('✅ Users seeded successfully');
    } catch (error) {
      console.error('❌ Error seeding users:', error.message);
      throw error;
    }
  }

  async seedProducts() {
    try {
      console.log('🧴 Seeding products...');
      
      for (const productData of products) {
        const existingProduct = await Product.findOne({ 
          'name.en': productData.name.en 
        });
        
        if (existingProduct) {
          console.log(`ℹ️  Product ${productData.name.en} already exists, skipping...`);
          continue;
        }

        const product = await Product.create(productData);
        console.log(`✅ Created product: ${product.name.en}`);
      }
      
      console.log('✅ Products seeded successfully');
    } catch (error) {
      console.error('❌ Error seeding products:', error.message);
      throw error;
    }
  }

  async seedContent() {
    try {
      console.log('📄 Seeding content sections...');
      
      // Get the first admin user as the content creator
      const adminUser = await User.findOne({ role: 'admin' });
      if (!adminUser) {
        throw new Error('No admin user found. Please seed users first.');
      }

      for (const contentData of contentSections) {
        const existingContent = await Content.findOne({ 
          section: contentData.section,
          isActive: true 
        });
        
        if (existingContent) {
          console.log(`ℹ️  Content section ${contentData.section} already exists, skipping...`);
          continue;
        }

        const content = await Content.create({
          ...contentData,
          updatedBy: adminUser._id,
          changeLog: 'Initial seed data'
        });
        
        console.log(`✅ Created content section: ${content.section}`);
      }
      
      console.log('✅ Content seeded successfully');
    } catch (error) {
      console.error('❌ Error seeding content:', error.message);
      throw error;
    }
  }

  async seedAll(options = {}) {
    const { clear = false, users = true, products = true, content = true } = options;
    
    try {
      await this.connect();
      
      if (clear) {
        await this.clearDatabase();
      }
      
      if (users) {
        await this.seedUsers();
      }
      
      if (products) {
        await this.seedProducts();
      }
      
      if (content) {
        await this.seedContent();
      }
      
      console.log('🎉 Database seeding completed successfully!');
      
      // Display summary
      await this.displaySummary();
      
    } catch (error) {
      console.error('❌ Seeding failed:', error.message);
      process.exit(1);
    } finally {
      await this.disconnect();
    }
  }

  async displaySummary() {
    try {
      console.log('\n📊 Database Summary:');
      console.log('==================');
      
      const userCount = await User.countDocuments();
      const productCount = await Product.countDocuments();
      const contentCount = await Content.countDocuments({ isActive: true });
      
      console.log(`👤 Users: ${userCount}`);
      console.log(`🧴 Products: ${productCount}`);
      console.log(`📄 Content Sections: ${contentCount}`);
      
      // Display categories
      const categories = await Product.getCategories();
      console.log(`🏷️  Product Categories: ${categories.join(', ')}`);
      
      // Display featured products count
      const featuredCount = await Product.countDocuments({ featured: true });
      console.log(`⭐ Featured Products: ${featuredCount}`);
      
    } catch (error) {
      console.error('❌ Error displaying summary:', error.message);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const seeder = new DatabaseSeeder();
  
  const options = {
    clear: args.includes('--clear') || args.includes('-c'),
    users: !args.includes('--no-users'),
    products: !args.includes('--no-products'),
    content: !args.includes('--no-content')
  };
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Maison Darin Database Seeder

Usage: node scripts/seed.js [options]

Options:
  --clear, -c         Clear existing data before seeding
  --no-users          Skip user seeding
  --no-products       Skip product seeding
  --no-content        Skip content seeding
  --help, -h          Show this help message

Examples:
  node scripts/seed.js                    # Seed all data
  node scripts/seed.js --clear            # Clear and seed all data
  node scripts/seed.js --no-products      # Seed only users and content
    `);
    return;
  }
  
  console.log('🌱 Starting database seeding...');
  console.log('Options:', options);
  console.log('');
  
  await seeder.seedAll(options);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Seeding script failed:', error);
    process.exit(1);
  });
}

module.exports = DatabaseSeeder;