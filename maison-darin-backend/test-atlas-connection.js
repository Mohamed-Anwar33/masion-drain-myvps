/**
 * اختبار الاتصال مع MongoDB Atlas
 * Test MongoDB Atlas connection
 */

require('dotenv').config();
const mongoose = require('mongoose');

const ATLAS_MONGODB_URI = 'mongodb+srv://maisondarin:pjSZYpFRahUTeB81@cluster0.yanlxkn.mongodb.net/maison-darin?retryWrites=true&w=majority&appName=Cluster0';

async function testAtlasConnection() {
  try {
    console.log('🔄 Testing connection to MongoDB Atlas...');
    console.log('🌐 Cluster: cluster0.yanlxkn.mongodb.net');
    console.log('📊 Database: maison-darin\n');

    // Test connection
    await mongoose.connect(ATLAS_MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      socketTimeoutMS: 45000,
    });

    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    // Get connection info
    const db = mongoose.connection.db;
    const admin = db.admin();
    
    // Test database operations
    const dbStats = await db.stats();
    console.log('\n📊 Database Statistics:');
    console.log(`- Database Name: ${db.databaseName}`);
    console.log(`- Collections: ${dbStats.collections}`);
    console.log(`- Data Size: ${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`- Storage Size: ${(dbStats.storageSize / 1024 / 1024).toFixed(2)} MB`);

    // List collections
    const collections = await db.listCollections().toArray();
    console.log('\n📋 Available Collections:');
    if (collections.length === 0) {
      console.log('  - No collections found (empty database)');
    } else {
      collections.forEach(collection => {
        console.log(`  - ${collection.name}`);
      });
    }

    // Test basic operations
    console.log('\n🧪 Testing basic operations...');
    
    // Try to create a test document
    const testCollection = db.collection('connection_test');
    const testDoc = {
      message: 'Atlas connection test',
      timestamp: new Date(),
      success: true
    };
    
    const insertResult = await testCollection.insertOne(testDoc);
    console.log('✅ Insert operation successful');
    
    // Try to read the document
    const foundDoc = await testCollection.findOne({ _id: insertResult.insertedId });
    console.log('✅ Read operation successful');
    
    // Clean up test document
    await testCollection.deleteOne({ _id: insertResult.insertedId });
    console.log('✅ Delete operation successful');

    await mongoose.disconnect();
    console.log('\n🎉 MongoDB Atlas connection test completed successfully!');
    console.log('✅ Your database is ready to use');
    
    return true;

  } catch (error) {
    console.error('\n❌ Connection test failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.error('\n🔐 Authentication Error:');
      console.error('- Check your username and password');
      console.error('- Make sure the user has proper permissions');
    } else if (error.message.includes('timeout')) {
      console.error('\n⏰ Timeout Error:');
      console.error('- Check your internet connection');
      console.error('- Verify the cluster URL is correct');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('\n🌐 Network Error:');
      console.error('- Check your internet connection');
      console.error('- Verify the cluster hostname');
    }
    
    return false;
  }
}

// Run the test
if (require.main === module) {
  testAtlasConnection().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = testAtlasConnection;
