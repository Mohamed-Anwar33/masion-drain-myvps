/**
 * سكريبت لتصدير البيانات من قاعدة البيانات المحلية إلى MongoDB Atlas
 * Export local database data to MongoDB Atlas
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Local database connection
const LOCAL_MONGODB_URI = 'mongodb://127.0.0.1:27017/maison-darin';

// Atlas database connection
const ATLAS_MONGODB_URI = 'mongodb+srv://maisondarin:pjSZYpFRahUTeB81@cluster0.yanlxkn.mongodb.net/maison-darin?retryWrites=true&w=majority&appName=Cluster0';

// Import all models
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');
const Customer = require('../models/Customer');
const HomePageContent = require('../models/HomePageContent');
const SiteSettings = require('../models/SiteSettings');
const ContactMessage = require('../models/ContactMessage');

async function exportDataFromLocal() {
  try {
    console.log('🔄 Connecting to local MongoDB...');
    await mongoose.connect(LOCAL_MONGODB_URI);
    console.log('✅ Connected to local MongoDB');

    const collections = [
      { name: 'products', model: Product },
      { name: 'categories', model: Category },
      { name: 'orders', model: Order },
      { name: 'users', model: User },
      { name: 'customers', model: Customer },
      { name: 'homepagecontents', model: HomePageContent },
      { name: 'sitesettings', model: SiteSettings },
      { name: 'contactmessages', model: ContactMessage }
    ];

    const exportData = {};

    for (const collection of collections) {
      try {
        console.log(`📊 Exporting ${collection.name}...`);
        const data = await collection.model.find({}).lean();
        exportData[collection.name] = data;
        console.log(`✅ Exported ${data.length} documents from ${collection.name}`);
      } catch (error) {
        console.log(`⚠️ Collection ${collection.name} might not exist or is empty:`, error.message);
        exportData[collection.name] = [];
      }
    }

    // Save to JSON file
    const exportPath = path.join(__dirname, 'local-database-export.json');
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    console.log(`💾 Data exported to: ${exportPath}`);

    await mongoose.disconnect();
    console.log('👋 Disconnected from local MongoDB');

    return exportData;
  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  }
}

async function importDataToAtlas(exportData) {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    await mongoose.connect(ATLAS_MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    const collections = [
      { name: 'products', model: Product },
      { name: 'categories', model: Category },
      { name: 'orders', model: Order },
      { name: 'users', model: User },
      { name: 'customers', model: Customer },
      { name: 'homepagecontents', model: HomePageContent },
      { name: 'sitesettings', model: SiteSettings },
      { name: 'contactmessages', model: ContactMessage }
    ];

    for (const collection of collections) {
      try {
        const data = exportData[collection.name];
        if (data && data.length > 0) {
          console.log(`📥 Importing ${data.length} documents to ${collection.name}...`);
          
          // Clear existing data (optional - comment out if you want to merge)
          await collection.model.deleteMany({});
          
          // Import new data
          await collection.model.insertMany(data);
          console.log(`✅ Imported ${data.length} documents to ${collection.name}`);
        } else {
          console.log(`⚠️ No data to import for ${collection.name}`);
        }
      } catch (error) {
        console.error(`❌ Failed to import ${collection.name}:`, error.message);
      }
    }

    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB Atlas');

  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  }
}

async function testAtlasConnection() {
  try {
    console.log('🧪 Testing Atlas connection...');
    await mongoose.connect(ATLAS_MONGODB_URI);
    
    // Test basic operations
    const productCount = await Product.countDocuments();
    const userCount = await User.countDocuments();
    const orderCount = await Order.countDocuments();
    
    console.log('✅ Atlas connection test successful!');
    console.log(`📊 Products: ${productCount}`);
    console.log(`👥 Users: ${userCount}`);
    console.log(`📦 Orders: ${orderCount}`);
    
    await mongoose.disconnect();
    return true;
  } catch (error) {
    console.error('❌ Atlas connection test failed:', error);
    return false;
  }
}

async function main() {
  try {
    console.log('🚀 Starting data migration to MongoDB Atlas...\n');

    // Step 1: Export from local
    console.log('=== STEP 1: Export from Local Database ===');
    const exportData = await exportDataFromLocal();
    
    // Step 2: Import to Atlas
    console.log('\n=== STEP 2: Import to MongoDB Atlas ===');
    await importDataToAtlas(exportData);
    
    // Step 3: Test Atlas connection
    console.log('\n=== STEP 3: Test Atlas Connection ===');
    const testResult = await testAtlasConnection();
    
    if (testResult) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('✅ Your Maison Darin website is now connected to MongoDB Atlas');
      console.log('🔗 Atlas Cluster: cluster0.yanlxkn.mongodb.net');
      console.log('📊 Database: maison-darin');
    } else {
      console.log('\n❌ Migration completed but connection test failed');
    }

  } catch (error) {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  main();
}

module.exports = {
  exportDataFromLocal,
  importDataToAtlas,
  testAtlasConnection
};
