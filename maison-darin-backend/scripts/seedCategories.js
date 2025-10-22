const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

const sampleCategories = [
  {
    name: {
      en: 'Floral Fragrances',
      ar: 'العطور الزهرية'
    },
    description: {
      en: 'Delicate and romantic fragrances inspired by blooming flowers',
      ar: 'عطور رقيقة ورومانسية مستوحاة من الزهور المتفتحة'
    },
    slug: 'floral-fragrances',
    isActive: true,
    sortOrder: 1
  },
  {
    name: {
      en: 'Oriental Scents',
      ar: 'العطور الشرقية'
    },
    description: {
      en: 'Rich and exotic fragrances with warm spices and precious woods',
      ar: 'عطور غنية وغريبة بالتوابل الدافئة والأخشاب الثمينة'
    },
    slug: 'oriental-scents',
    isActive: true,
    sortOrder: 2
  },
  {
    name: {
      en: 'Fresh & Citrus',
      ar: 'العطور المنعشة والحمضية'
    },
    description: {
      en: 'Light and refreshing fragrances perfect for everyday wear',
      ar: 'عطور خفيفة ومنعشة مثالية للاستخدام اليومي'
    },
    slug: 'fresh-citrus',
    isActive: true,
    sortOrder: 3
  },
  {
    name: {
      en: 'Woody & Amber',
      ar: 'العطور الخشبية والعنبرية'
    },
    description: {
      en: 'Sophisticated fragrances with deep woody and amber notes',
      ar: 'عطور راقية بنفحات خشبية وعنبرية عميقة'
    },
    slug: 'woody-amber',
    isActive: true,
    sortOrder: 4
  },
  {
    name: {
      en: 'Luxury Collection',
      ar: 'المجموعة الفاخرة'
    },
    description: {
      en: 'Premium and exclusive fragrances for special occasions',
      ar: 'عطور فاخرة وحصرية للمناسبات الخاصة'
    },
    slug: 'luxury-collection',
    isActive: true,
    sortOrder: 5
  }
];

async function seedCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/maison-darin');
    console.log('Connected to MongoDB');

    // Check if categories already exist
    const existingCategories = await Category.find();
    
    if (existingCategories.length > 0) {
      console.log(`Found ${existingCategories.length} existing categories. Skipping seed.`);
      process.exit(0);
    }

    // Create categories
    console.log('Creating sample categories...');
    
    for (const categoryData of sampleCategories) {
      const category = new Category(categoryData);
      await category.save();
      console.log(`✓ Created category: ${category.name.en} (${category.name.ar})`);
    }

    console.log('\n🎉 Successfully seeded categories!');
    console.log(`Created ${sampleCategories.length} categories.`);
    
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seed function
if (require.main === module) {
  seedCategories();
}

module.exports = { seedCategories, sampleCategories };
