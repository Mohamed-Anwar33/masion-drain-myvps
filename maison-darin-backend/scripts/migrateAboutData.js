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

// About section data from translations
const aboutData = {
  title: {
    en: 'Our Story',
    ar: 'قصتنا'
  },
  subtitle: {
    en: 'WHEN HISTORY TURNS INTO TIMELESS FRAGRANCE..',
    ar: 'عندما يتحول التاريخ إلى عطر خالد..'
  },
  description: {
    en: 'On the shores of the Arabian Gulf lies Dareen Island, where waves meet heritage and history whispers through every breeze. For centuries, Dareen stood as a global gateway of trade, a thriving port that welcomed fleets from India and East Asia. It became renowned for its musk, perfumes, and pearls, a destination where merchants and royalty alike found treasures beyond compare.',
    ar: 'على شواطئ الخليج العربي تقع جزيرة دارين، حيث تلتقي الأمواج بالتراث والتاريخ يهمس عبر كل نسمة. لقرون، وقفت دارين كبوابة عالمية للتجارة، ميناء مزدهر رحب بالأساطيل من الهند وشرق آسيا. أصبحت مشهورة بالمسك والعطور واللؤلؤ، وجهة حيث وجد التجار والملوك كنوزاً لا تُضاهى.'
  },
  legacy: {
    en: 'Inspired by this legacy, Dareen Perfumes was born — redefining luxury with a modern touch while preserving the soul of tradition. Each fragrance is more than a scent; it is a journey through time, carrying the essence of ancient souks, the aroma of incense, and the elegance of the Arabian Gulf adorned with pearls. Dareen… where history transforms into a timeless fragrance, creating unforgettable moments of elegance and distinction.',
    ar: 'مستوحاة من هذا الإرث، وُلدت عطور دارين — إعادة تعريف الفخامة بلمسة عصرية مع الحفاظ على روح التقليد. كل عطر أكثر من مجرد رائحة؛ إنه رحلة عبر الزمن، يحمل جوهر الأسواق القديمة، وعبق البخور، وأناقة الخليج العربي المزين باللؤلؤ. دارين... حيث يتحول التاريخ إلى عطر خالد، خالقاً لحظات لا تُنسى من الأناقة والتميز.'
  },
  values: {
    craftsmanship: {
      title: {
        en: 'Artisanal Craftsmanship',
        ar: 'الحرفية الفنية'
      },
      description: {
        en: 'Every perfume is meticulously crafted using traditional techniques and the finest ingredients sourced globally.',
        ar: 'كل عطر مصنوع بعناية فائقة باستخدام تقنيات تقليدية وأجود المكونات المصدرة عالمياً.'
      }
    },
    elegance: {
      title: {
        en: 'Timeless Elegance',
        ar: 'الأناقة الخالدة'
      },
      description: {
        en: 'Our designs reflect sophistication and grace, creating pieces that transcend trends and seasons.',
        ar: 'تصاميمنا تعكس الرقي والنعومة، وتخلق قطعاً تتجاوز الصيحات والمواسم.'
      }
    },
    exclusivity: {
      title: {
        en: 'Exclusive Collections',
        ar: 'مجموعات حصرية'
      },
      description: {
        en: 'Limited edition fragrances that offer unique scent profiles for the discerning woman.',
        ar: 'عطور إصدار محدود تقدم ملامح عطرية فريدة للمرأة المميزة.'
      }
    }
  },
  statistics: {
    collections: {
      value: '15+',
      label: {
        en: 'Collections',
        ar: 'مجموعة'
      }
    },
    clients: {
      value: '5K+',
      label: {
        en: 'Happy Clients',
        ar: 'عميلة سعيدة'
      }
    },
    countries: {
      value: '25+',
      label: {
        en: 'Countries',
        ar: 'دولة'
      }
    }
  },
  showSection: true,
  showStatistics: true,
  showValues: true
};

// Migration function
const migrateAboutData = async () => {
  try {
    console.log('Starting About section data migration...');

    // Get existing content or create new
    let content = await HomePageContent.findOne();
    
    if (!content) {
      console.log('No existing content found, creating new document...');
      content = new HomePageContent();
    } else {
      console.log('Found existing content, updating About section...');
    }

    // Update about section
    content.about = aboutData;
    content.lastUpdated = new Date();
    content.updatedBy = 'migration-script';

    // Save to database
    await content.save();

    console.log('✅ About section data migration completed successfully!');
    console.log('📊 Migrated data:');
    console.log(`   - Title: ${aboutData.title.ar} / ${aboutData.title.en}`);
    console.log(`   - Values: ${Object.keys(aboutData.values).length} items`);
    console.log(`   - Statistics: ${Object.keys(aboutData.statistics).length} items`);
    console.log(`   - Show section: ${aboutData.showSection}`);
    console.log(`   - Show values: ${aboutData.showValues}`);
    console.log(`   - Show statistics: ${aboutData.showStatistics}`);

  } catch (error) {
    console.error('❌ Error during About section migration:', error);
    throw error;
  }
};

// Run migration
const runMigration = async () => {
  try {
    await connectDB();
    await migrateAboutData();
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

module.exports = { migrateAboutData, aboutData };
