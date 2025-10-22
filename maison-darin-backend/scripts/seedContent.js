#!/usr/bin/env node

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Content = require('../models/Content');
const User = require('../models/User');
// Import real content data from website migration
const realContentData = require('./seedData/realContent');
const { content: realContent } = realContentData;

async function seedContent() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/maison-darin';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get admin user for content creation
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('⚠️  No admin user found. Creating default admin user...');
      const defaultAdmin = await User.create({
        email: 'admin@maisondarin.com',
        password: 'SecurePass123!',
        role: 'admin'
      });
      console.log('✅ Created default admin user');
    }

    const contentCreator = adminUser || await User.findOne({ role: 'admin' });

    console.log('📄 Seeding real content sections from website migration...');
    console.log(`📊 Total sections to seed: ${realContent.length}`);
    
    // Clear existing content first
    console.log('🗑️  Clearing existing content...');
    await Content.deleteMany({});
    console.log('✅ Existing content cleared');

    let createdCount = 0;
    let updatedCount = 0;
    
    for (const contentData of realContent) {
      const existingContent = await Content.findOne({ 
        section: contentData.section,
        isActive: true 
      });
      
      try {
        if (existingContent) {
          console.log(`ℹ️  Content section ${contentData.section} already exists, updating...`);
          
          // Deactivate old version and create new one
          await Content.updateMany(
            { section: contentData.section },
            { isActive: false }
          );
          
          const updatedContent = await Content.create({
            ...contentData,
            updatedBy: contentCreator._id,
            changeLog: 'Updated via website migration'
          });
          
          console.log(`✅ Updated content section: ${updatedContent.section}`);
          updatedCount++;
        } else {
          const content = await Content.create({
            ...contentData,
            updatedBy: contentCreator._id,
            changeLog: 'Website migration - initial seed'
          });
          
          console.log(`✅ Created content section: ${content.section}`);
          createdCount++;
        }
      } catch (error) {
        console.error(`❌ Error seeding content section ${contentData.section}:`, error.message);
      }
    }
    
    console.log('\n📊 SEEDING SUMMARY:');
    console.log(`   Sections created: ${createdCount}`);
    console.log(`   Sections updated: ${updatedCount}`);
    console.log(`   Total processed: ${createdCount + updatedCount}`);
    console.log('✅ Real content seeded successfully from website migration!');
    
    // Display database summary
    const totalSections = await Content.countDocuments({ isActive: true });
    const sections = await Content.distinct('section', { isActive: true });
    
    console.log('\n📊 DATABASE SUMMARY:');
    console.log('==================');
    console.log(`Active Sections: ${totalSections}`);
    console.log(`Sections: ${sections.join(', ')}`);
    console.log(`Data Source: Website Migration (${realContentData.metadata.generatedAt})`);

  } catch (error) {
    console.error('❌ Error seeding content:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  seedContent();
}

module.exports = seedContent;