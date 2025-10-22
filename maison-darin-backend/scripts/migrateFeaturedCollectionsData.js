const mongoose = require('mongoose');
const HomePageContent = require('../models/HomePageContent');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/maison-darin');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Featured Collections data
const featuredCollectionsData = {
  title: {
    en: 'Featured Collections',
    ar: 'المجموعات المميزة'
  },
  subtitle: {
    en: 'Discover our most exclusive and beloved fragrance collections',
    ar: 'اكتشف أكثر مجموعات العطور حصرية وحباً'
  },
  collections: [
    {
      name: {
        en: 'Floral Elegance',
        ar: 'الأناقة الزهرية'
      },
      description: {
        en: 'A sophisticated blend of rose, jasmine, and peony that captures the essence of a blooming garden.',
        ar: 'مزيج راقي من الورد والياسمين والفاوانيا يأسر جوهر الحديقة المزهرة.'
      },
      image: {
        url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500',
        alt: {
          en: 'Floral Elegance Collection',
          ar: 'مجموعة الأناقة الزهرية'
        }
      },
      category: {
        en: 'Floral',
        ar: 'زهري'
      },
      price: {
        value: 299,
        currency: 'SAR',
        displayPrice: {
          en: '299 SAR',
          ar: '299 ريال'
        }
      },
      slug: 'floral-elegance',
      featured: true,
      order: 1,
      isActive: true,
      rating: 4.8,
      link: '/products'
    },
    {
      name: {
        en: 'Oriental Mystique',
        ar: 'الغموض الشرقي'
      },
      description: {
        en: 'Rich and mysterious blend of oud, amber, and exotic spices that tells stories of ancient Arabia.',
        ar: 'مزيج غني وغامض من العود والعنبر والتوابل الغريبة يحكي قصص الجزيرة العربية القديمة.'
      },
      image: {
        url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500',
        alt: {
          en: 'Oriental Mystique Collection',
          ar: 'مجموعة الغموض الشرقي'
        }
      },
      category: {
        en: 'Oriental',
        ar: 'شرقي'
      },
      price: {
        value: 399,
        currency: 'SAR',
        displayPrice: {
          en: '399 SAR',
          ar: '399 ريال'
        }
      },
      slug: 'oriental-mystique',
      featured: true,
      order: 2,
      isActive: true,
      rating: 4.9,
      link: '/products'
    },
    {
      name: {
        en: 'Fresh Breeze',
        ar: 'النسيم المنعش'
      },
      description: {
        en: 'Light and refreshing fragrance with citrus notes and marine accords, perfect for everyday wear.',
        ar: 'عطر خفيف ومنعش بنفحات الحمضيات ولمسات بحرية، مثالي للاستخدام اليومي.'
      },
      image: {
        url: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59d32?w=500',
        alt: {
          en: 'Fresh Breeze Collection',
          ar: 'مجموعة النسيم المنعش'
        }
      },
      category: {
        en: 'Fresh',
        ar: 'منعش'
      },
      price: {
        value: 249,
        currency: 'SAR',
        displayPrice: {
          en: '249 SAR',
          ar: '249 ريال'
        }
      },
      slug: 'fresh-breeze',
      featured: true,
      order: 3,
      isActive: true,
      rating: 4.7,
      link: '/products'
    }
  ],
  showSection: true,
  maxCollections: 3,
  showPrices: true,
  showRatings: true,
  showViewAllButton: true,
  viewAllButtonText: {
    en: 'View All Collections',
    ar: 'عرض جميع المجموعات'
  },
  viewAllButtonLink: '/products'
};

// Migration function
const migrateFeaturedCollectionsData = async () => {
  try {
    console.log('Starting Featured Collections data migration...');

    // Get existing content or create new
    let content = await HomePageContent.findOne();
    
    if (!content) {
      console.log('No existing content found, creating new document...');
      content = new HomePageContent();
    } else {
      console.log('Found existing content, updating Featured Collections section...');
    }

    // Update featured collections section
    content.featuredCollections = featuredCollectionsData;
    content.lastUpdated = new Date();
    content.updatedBy = 'migration-script';

    // Save to database
    await content.save();

    console.log('✅ Featured Collections data migration completed successfully!');
    console.log('📊 Migrated data:');
    console.log(`   - Title: ${featuredCollectionsData.title.ar} / ${featuredCollectionsData.title.en}`);
    console.log(`   - Collections: ${featuredCollectionsData.collections.length} items`);
    console.log(`   - Max collections to display: ${featuredCollectionsData.maxCollections}`);
    console.log(`   - Show section: ${featuredCollectionsData.showSection}`);
    console.log(`   - Show prices: ${featuredCollectionsData.showPrices}`);
    console.log(`   - Show ratings: ${featuredCollectionsData.showRatings}`);
    console.log(`   - Show view all button: ${featuredCollectionsData.showViewAllButton}`);

    // Log collection details
    featuredCollectionsData.collections.forEach((collection, index) => {
      console.log(`   Collection ${index + 1}: ${collection.name.ar} (${collection.category.ar}) - ${collection.price.displayPrice.ar}`);
    });

  } catch (error) {
    console.error('❌ Error during Featured Collections migration:', error);
    throw error;
  }
};

// Run migration
const runMigration = async () => {
  try {
    await connectDB();
    await migrateFeaturedCollectionsData();
    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('💥 Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Database connection closed');
    process.exit(0);
  }
};

// Execute if run directly
if (require.main === module) {
  runMigration();
}

module.exports = { migrateFeaturedCollectionsData, featuredCollectionsData };
