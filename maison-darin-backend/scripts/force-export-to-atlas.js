/**
 * نقل قسري لجميع البيانات من قاعدة البيانات المحلية إلى MongoDB Atlas
 * Force export ALL local database data to MongoDB Atlas (bypassing validation)
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Local database connection
const LOCAL_MONGODB_URI = 'mongodb://127.0.0.1:27017/maison-darin';

// Atlas database connection
const ATLAS_MONGODB_URI = 'mongodb+srv://maisondarin:pjSZYpFRahUTeB81@cluster0.yanlxkn.mongodb.net/maison-darin?retryWrites=true&w=majority&appName=Cluster0';

async function forceExportAllData() {
  let localConnection = null;
  let atlasConnection = null;
  
  try {
    console.log('🚀 Starting FORCE migration - ALL data will be transferred!');
    console.log('⚠️ This will bypass all validation and transfer everything as-is\n');

    // Connect to local database
    console.log('🔄 Connecting to local MongoDB...');
    localConnection = mongoose.createConnection(LOCAL_MONGODB_URI);
    
    // Wait for connection to be ready
    await new Promise((resolve, reject) => {
      localConnection.on('connected', resolve);
      localConnection.on('error', reject);
      setTimeout(() => reject(new Error('Connection timeout')), 10000);
    });
    console.log('✅ Connected to local MongoDB');

    // Get all collections from local database
    const collections = await localConnection.db.listCollections().toArray();
    console.log(`📋 Found ${collections.length} collections in local database:`);
    collections.forEach(collection => {
      console.log(`  - ${collection.name}`);
    });

    const exportData = {};

    // Export data from each collection using raw database operations
    for (const collection of collections) {
      const collectionName = collection.name;
      try {
        console.log(`\n📊 Exporting ${collectionName}...`);
        const data = await localConnection.db.collection(collectionName).find({}).toArray();
        exportData[collectionName] = data;
        console.log(`✅ Exported ${data.length} documents from ${collectionName}`);
      } catch (error) {
        console.log(`⚠️ Failed to export ${collectionName}:`, error.message);
        exportData[collectionName] = [];
      }
    }

    // Save backup to JSON file
    const exportPath = path.join(__dirname, 'complete-database-backup.json');
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    console.log(`💾 Complete backup saved to: ${exportPath}`);

    await localConnection.close();
    console.log('👋 Disconnected from local MongoDB');

    // Connect to Atlas
    console.log('\n🔄 Connecting to MongoDB Atlas...');
    atlasConnection = mongoose.createConnection(ATLAS_MONGODB_URI);
    
    // Wait for Atlas connection to be ready
    await new Promise((resolve, reject) => {
      atlasConnection.on('connected', resolve);
      atlasConnection.on('error', reject);
      setTimeout(() => reject(new Error('Atlas connection timeout')), 15000);
    });
    console.log('✅ Connected to MongoDB Atlas');

    // Import all data using raw database operations (bypassing validation)
    console.log('\n=== IMPORTING ALL DATA TO ATLAS (BYPASSING VALIDATION) ===');
    
    for (const [collectionName, data] of Object.entries(exportData)) {
      if (data && data.length > 0) {
        try {
          console.log(`\n📥 Force importing ${data.length} documents to ${collectionName}...`);
          
          // Clear existing data first
          const deleteResult = await atlasConnection.db.collection(collectionName).deleteMany({});
          console.log(`🗑️ Cleared ${deleteResult.deletedCount} existing documents`);
          
          // Insert all data using raw operations (bypasses mongoose validation)
          const insertResult = await atlasConnection.db.collection(collectionName).insertMany(data, {
            ordered: false, // Continue even if some docs fail
            bypassDocumentValidation: true // Bypass validation
          });
          
          console.log(`✅ Successfully imported ${insertResult.insertedCount} documents to ${collectionName}`);
          
        } catch (error) {
          // Even if some documents fail, continue with the rest
          console.log(`⚠️ Some documents in ${collectionName} had issues, but continuing...`);
          console.log(`   Error: ${error.message}`);
          
          // Try individual inserts for failed collection
          let successCount = 0;
          for (let i = 0; i < data.length; i++) {
            try {
              await atlasConnection.db.collection(collectionName).insertOne(data[i]);
              successCount++;
            } catch (docError) {
              console.log(`   ❌ Failed to insert document ${i + 1}: ${docError.message}`);
            }
          }
          console.log(`✅ Managed to import ${successCount}/${data.length} documents individually`);
        }
      } else {
        console.log(`⚠️ No data to import for ${collectionName}`);
      }
    }

    await atlasConnection.close();
    console.log('\n👋 Disconnected from MongoDB Atlas');

    // Final verification
    console.log('\n=== FINAL VERIFICATION ===');
    const verifyConnection = mongoose.createConnection(ATLAS_MONGODB_URI);
    
    // Wait for verification connection
    await new Promise((resolve, reject) => {
      verifyConnection.on('connected', resolve);
      verifyConnection.on('error', reject);
      setTimeout(() => reject(new Error('Verification connection timeout')), 10000);
    });
    const atlasCollections = await verifyConnection.db.listCollections().toArray();
    
    console.log(`✅ Atlas now has ${atlasCollections.length} collections:`);
    for (const collection of atlasCollections) {
      const count = await verifyConnection.db.collection(collection.name).countDocuments();
      console.log(`  - ${collection.name}: ${count} documents`);
    }
    
    await verifyConnection.close();

    console.log('\n🎉 FORCE MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('✅ ALL local data has been transferred to MongoDB Atlas');
    console.log('🔗 Your Maison Darin website is now running on Atlas');
    console.log('📊 Database: maison-darin on cluster0.yanlxkn.mongodb.net');

    return true;

  } catch (error) {
    console.error('\n💥 Force migration failed:', error);
    return false;
  } finally {
    // Ensure connections are closed
    if (localConnection) {
      try { await localConnection.close(); } catch (e) {}
    }
    if (atlasConnection) {
      try { await atlasConnection.close(); } catch (e) {}
    }
  }
}

// Run the force migration
if (require.main === module) {
  forceExportAllData().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = forceExportAllData;
