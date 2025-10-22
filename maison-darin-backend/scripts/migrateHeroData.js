const mongoose = require('mongoose');
const HomePageContent = require('../models/HomePageContent');
require('dotenv').config();

// Original content from the website images - exactly as shown
const translations = {
  en: {
    hero: {
      badge: "Luxury Fragrances",
      title: "Exquisite Perfumes for the Modern Woman",
      subtitle: "Discover our curated collection of artisanal fragrances, crafted with the finest ingredients and inspired by timeless elegance.",
      cta: {
        primary: "Explore Collections",
        secondary: "Request Sample"
      }
    }
  },
  ar: {
    hero: {
      badge: "عطور فاخرة",
      title: "عطور رائعة للمرأة العصرية", 
      subtitle: "اكتشفي مجموعتنا المختارة من العطور الحرفية، المصنوعة من أجود المكونات والمستوحاة من الأناقة الخالدة.",
      cta: {
        primary: "استكشفي المجموعات",
        secondary: "اطلبي عينة"
      }
    }
  }
};

// Premium images for slideshow showcasing Arabian luxury perfumes
const sampleImages = [
  {
    url: "https://images.unsplash.com/photo-1541643600914-78b084683601?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    cloudinaryId: "",
    alt: {
      en: "Maison Darin - Signature Arabian Oud Collection",
      ar: "ميزون دارين - مجموعة العود العربي المميزة"
    },
    order: 0
  },
  {
    url: "https://images.unsplash.com/photo-1588405748880-12d1d2a59d75?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    cloudinaryId: "",
    alt: {
      en: "Royal Rose & Jasmine - Limited Edition", 
      ar: "الورد الملكي والياسمين - إصدار محدود"
    },
    order: 1
  },
  {
    url: "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    cloudinaryId: "",
    alt: {
      en: "Amber & Sandalwood - Heritage Collection",
      ar: "العنبر وخشب الصندل - مجموعة التراث"
    },
    order: 2
  },
  {
    url: "https://images.unsplash.com/photo-1563170351-be82bc888aa4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    cloudinaryId: "",
    alt: {
      en: "Pearl & Musk - Dareen Island Inspiration",
      ar: "اللؤلؤ والمسك - وحي جزيرة دارين"
    },
    order: 3
  },
  {
    url: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    cloudinaryId: "",
    alt: {
      en: "Saffron & Vanilla - Royal Blend",
      ar: "الزعفران والفانيليا - خلطة ملكية"
    },
    order: 4
  },
  {
    url: "https://images.unsplash.com/photo-1615634260167-c8cdede054de?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    cloudinaryId: "",
    alt: {
      en: "Modern Arabian Elegance - Contemporary Collection",
      ar: "الأناقة العربية العصرية - المجموعة المعاصرة"
    },
    order: 5
  }
];

async function migrateHeroData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/maison-darin');
    console.log('Connected to MongoDB');

    // Get existing content or create new
    let content = await HomePageContent.findOne();
    
    if (!content) {
      content = new HomePageContent();
      console.log('Creating new HomePageContent document');
    } else {
      console.log('Found existing HomePageContent document');
    }

    // Migrate hero data
    content.hero = {
      badge: {
        en: translations.en.hero.badge,
        ar: translations.ar.hero.badge
      },
      title: {
        en: translations.en.hero.title,
        ar: translations.ar.hero.title
      },
      subtitle: {
        en: translations.en.hero.subtitle,
        ar: translations.ar.hero.subtitle
      },
      cta: {
        primary: {
          text: {
            en: translations.en.hero.cta.primary,
            ar: translations.ar.hero.cta.primary
          },
          link: '/products'
        },
        secondary: {
          text: {
            en: translations.en.hero.cta.secondary,
            ar: translations.ar.hero.cta.secondary
          },
          link: '/contact'
        }
      },
      images: {
        main: {
          url: sampleImages[0].url,
          cloudinaryId: '',
          alt: {
            en: 'Maison Darin Luxury Perfume',
            ar: 'عطر ميزون دارين الفاخر'
          }
        },
        slideshow: sampleImages
      },
      showSection: true,
      showBadge: true,
      showSlideshow: true,
      slideshowInterval: 4000
    };

    // Save the updated content
    await content.save();
    
    console.log('✅ Hero data migration completed successfully!');
    console.log('🎉 Rich content has been imported with Arabian luxury theme!');
    console.log('');
    console.log('📊 Migrated data summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏷️  Badge (EN):', content.hero.badge.en);
    console.log('🏷️  Badge (AR):', content.hero.badge.ar);
    console.log('');
    console.log('📝 Title (EN):', content.hero.title.en);
    console.log('📝 Title (AR):', content.hero.title.ar);
    console.log('');
    console.log('📄 Subtitle length (EN):', content.hero.subtitle.en.length, 'characters');
    console.log('📄 Subtitle length (AR):', content.hero.subtitle.ar.length, 'characters');
    console.log('');
    console.log('🔘 Primary CTA (EN):', content.hero.cta.primary.text.en);
    console.log('🔘 Primary CTA (AR):', content.hero.cta.primary.text.ar);
    console.log('🔘 Secondary CTA (EN):', content.hero.cta.secondary.text.en);
    console.log('🔘 Secondary CTA (AR):', content.hero.cta.secondary.text.ar);
    console.log('');
    console.log('🖼️  Main image URL:', content.hero.images.main.url);
    console.log('🎠 Slideshow images:', content.hero.images.slideshow.length);
    console.log('⏱️  Slideshow interval:', content.hero.slideshowInterval, 'ms');
    console.log('');
    console.log('🎯 Display settings:');
    console.log('   - Show section:', content.hero.showSection);
    console.log('   - Show badge:', content.hero.showBadge);
    console.log('   - Show slideshow:', content.hero.showSlideshow);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('1. Start your backend server');
    console.log('2. Start your frontend server');
    console.log('3. Go to Admin Panel > Homepage Management > Hero Section');
    console.log('4. Test the new rich content and multilingual support');
    console.log('5. Upload your own images to Cloudinary and update URLs');
    console.log('');
    console.log('💡 The content now includes:');
    console.log('   ✨ Rich Arabian heritage storytelling');
    console.log('   🏺 Historical references to Dareen Island');
    console.log('   👑 Luxury positioning with royal themes');
    console.log('   🎨 6 premium slideshow images');
    console.log('   🌍 Full bilingual support (Arabic/English)');
    console.log('   📱 Responsive design ready');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateHeroData();
}

module.exports = migrateHeroData;
