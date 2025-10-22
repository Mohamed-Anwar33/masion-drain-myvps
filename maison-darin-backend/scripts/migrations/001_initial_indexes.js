/**
 * Migration: Create initial database indexes
 * Created: 2024-01-15
 * Description: Creates essential indexes for better query performance
 */

async function up(db) {
  console.log('Creating indexes for users collection...');
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('users').createIndex({ isActive: 1 });
  await db.collection('users').createIndex({ role: 1 });

  console.log('Creating indexes for products collection...');
  await db.collection('products').createIndex({ category: 1 });
  await db.collection('products').createIndex({ price: 1 });
  await db.collection('products').createIndex({ inStock: 1 });
  await db.collection('products').createIndex({ featured: 1 });
  await db.collection('products').createIndex({ createdAt: -1 });
  
  // Text indexes for search
  await db.collection('products').createIndex({
    'name.en': 'text',
    'description.en': 'text',
    'longDescription.en': 'text'
  }, { name: 'products_text_en' });
  
  await db.collection('products').createIndex({
    'name.ar': 'text',
    'description.ar': 'text',
    'longDescription.ar': 'text'
  }, { name: 'products_text_ar' });

  console.log('Creating indexes for content collection...');
  await db.collection('contents').createIndex({ section: 1 });
  await db.collection('contents').createIndex({ isActive: 1 });
  await db.collection('contents').createIndex({ section: 1, isActive: 1 });
  await db.collection('contents').createIndex({ section: 1, version: -1 });

  console.log('Creating indexes for orders collection...');
  await db.collection('orders').createIndex({ orderNumber: 1 }, { unique: true });
  await db.collection('orders').createIndex({ 'customerInfo.email': 1 });
  await db.collection('orders').createIndex({ orderStatus: 1 });
  await db.collection('orders').createIndex({ paymentStatus: 1 });
  await db.collection('orders').createIndex({ createdAt: -1 });

  console.log('Creating indexes for sample requests collection...');
  await db.collection('samplerequests').createIndex({ 'customerInfo.email': 1 });
  await db.collection('samplerequests').createIndex({ status: 1 });
  await db.collection('samplerequests').createIndex({ createdAt: -1 });

  console.log('Creating indexes for contact messages collection...');
  await db.collection('contactmessages').createIndex({ email: 1 });
  await db.collection('contactmessages').createIndex({ status: 1 });
  await db.collection('contactmessages').createIndex({ createdAt: -1 });

  console.log('Creating indexes for media collection...');
  await db.collection('media').createIndex({ cloudinaryId: 1 }, { unique: true });
  await db.collection('media').createIndex({ uploadedBy: 1 });
  await db.collection('media').createIndex({ uploadedAt: -1 });

  console.log('✅ All indexes created successfully');
}

async function down(db) {
  console.log('Dropping indexes...');
  
  // Drop custom indexes (keep _id indexes)
  const collections = ['users', 'products', 'contents', 'orders', 'samplerequests', 'contactmessages', 'media'];
  
  for (const collectionName of collections) {
    try {
      const indexes = await db.collection(collectionName).indexes();
      for (const index of indexes) {
        if (index.name !== '_id_') {
          await db.collection(collectionName).dropIndex(index.name);
          console.log(`Dropped index ${index.name} from ${collectionName}`);
        }
      }
    } catch (error) {
      console.log(`Collection ${collectionName} might not exist: ${error.message}`);
    }
  }

  console.log('✅ All custom indexes dropped');
}

module.exports = { up, down };