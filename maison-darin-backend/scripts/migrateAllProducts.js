const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

// كل المنتجات العشرة من الموقع
const allProducts = [
  {
    name: { en: "Floral Symphony", ar: "سيمفونية الأزهار" },
    description: { en: "A delicate blend of jasmine, rose, and white lily", ar: "مزيج رقيق من الياسمين والورد وزنبق أبيض" },
    longDescription: { 
      en: "Floral Symphony is a masterpiece of olfactory artistry, carefully crafted to capture the essence of a blooming garden at dawn.",
      ar: "سيمفونية الأزهار تحفة فنية عطرية، صُنعت بعناية فائقة لتلتقط جوهر حديقة متفتحة عند الفجر."
    },
    price: 150, size: "100ml", category: "floral",
    images: [{ url: "/api/placeholder/400/600", cloudinaryId: "floral_symphony_1", alt: { en: "Floral Symphony", ar: "سيمفونية الأزهار" }, order: 0 }],
    featured: true, inStock: true, stock: 50,
    concentration: { en: "Eau de Parfum", ar: "ماء العطر" },
    notes: {
      top: { en: ["Bergamot", "Lemon", "Pink Pepper"], ar: ["البرغموت", "الليمون", "الفلفل الوردي"] },
      middle: { en: ["Jasmine", "Rose", "White Lily"], ar: ["الياسمين", "الورد", "زنبق أبيض"] },
      base: { en: ["Sandalwood", "Musk", "Vanilla"], ar: ["خشب الصندل", "المسك", "الفانيليا"] }
    }
  },
  {
    name: { en: "Oriental Mystique", ar: "الغموض الشرقي" },
    description: { en: "Rich amber and vanilla with hints of sandalwood", ar: "العنبر الغني والفانيليا مع لمسات من خشب الصندل" },
    longDescription: { 
      en: "Oriental Mystique transports you to ancient spice markets and opulent palaces.",
      ar: "الغموض الشرقي ينقلك إلى أسواق التوابل القديمة والقصور الفاخرة."
    },
    price: 180, size: "100ml", category: "oriental",
    images: [{ url: "/api/placeholder/400/600", cloudinaryId: "oriental_mystique_1", alt: { en: "Oriental Mystique", ar: "الغموض الشرقي" }, order: 0 }],
    featured: true, inStock: true, stock: 30,
    concentration: { en: "Eau de Parfum", ar: "ماء العطر" },
    notes: {
      top: { en: ["Cardamom", "Cinnamon", "Orange"], ar: ["الهيل", "القرفة", "البرتقال"] },
      middle: { en: ["Amber", "Oud", "Rose"], ar: ["العنبر", "العود", "الورد"] },
      base: { en: ["Sandalwood", "Vanilla", "Patchouli"], ar: ["خشب الصندل", "الفانيليا", "الباتشولي"] }
    }
  },
  {
    name: { en: "Fresh Breeze", ar: "النسيم المنعش" },
    description: { en: "Citrus top notes with marine and green accords", ar: "نوتات حمضية علوية مع نفحات بحرية وخضراء" },
    longDescription: { 
      en: "Fresh Breeze captures the invigorating essence of a coastal morning.",
      ar: "النسيم المنعش يلتقط الجوهر المنشط لصباح ساحلي."
    },
    price: 120, size: "100ml", category: "fresh",
    images: [{ url: "/api/placeholder/400/600", cloudinaryId: "fresh_breeze_1", alt: { en: "Fresh Breeze", ar: "النسيم المنعش" }, order: 0 }],
    featured: false, inStock: true, stock: 40,
    concentration: { en: "Eau de Toilette", ar: "ماء التواليت" },
    notes: {
      top: { en: ["Grapefruit", "Marine", "Mint"], ar: ["الجريب فروت", "البحري", "النعناع"] },
      middle: { en: ["Green Leaves", "Sea Salt", "Lavender"], ar: ["الأوراق الخضراء", "ملح البحر", "اللافندر"] },
      base: { en: ["Cedar", "White Musk", "Driftwood"], ar: ["الأرز", "المسك الأبيض", "خشب البحر"] }
    }
  },
  {
    name: { en: "Royal Garden", ar: "الحديقة الملكية" },
    description: { en: "Elegant peony and iris with woody undertones", ar: "الفاوانيا الأنيقة والسوسن مع نفحات خشبية" },
    longDescription: { 
      en: "Royal Garden is an ode to timeless elegance and regal sophistication.",
      ar: "الحديقة الملكية قصيدة للأناقة الخالدة والرقي الملكي."
    },
    price: 200, size: "100ml", category: "floral",
    images: [{ url: "/api/placeholder/400/600", cloudinaryId: "royal_garden_1", alt: { en: "Royal Garden", ar: "الحديقة الملكية" }, order: 0 }],
    featured: true, inStock: false, stock: 0,
    concentration: { en: "Extrait de Parfum", ar: "خلاصة العطر" },
    notes: {
      top: { en: ["Pear", "Black Currant", "Mandarin"], ar: ["الكمثرى", "الكشمش الأسود", "اليوسفي"] },
      middle: { en: ["Peony", "Iris", "Freesia"], ar: ["الفاوانيا", "السوسن", "الفريزيا"] },
      base: { en: ["Cedarwood", "White Musk", "Amber"], ar: ["خشب الأرز", "المسك الأبيض", "العنبر"] }
    }
  },
  {
    name: { en: "Midnight Rose", ar: "وردة منتصف الليل" },
    description: { en: "Dark and mysterious rose with smoky undertones", ar: "وردة داكنة وغامضة مع نفحات دخانية" },
    longDescription: { 
      en: "Midnight Rose unveils the darker side of romance.",
      ar: "وردة منتصف الليل تكشف الجانب الأكثر ظلاماً من الرومانسية."
    },
    price: 220, size: "100ml", category: "oriental",
    images: [{ url: "/api/placeholder/400/600", cloudinaryId: "midnight_rose_1", alt: { en: "Midnight Rose", ar: "وردة منتصف الليل" }, order: 0 }],
    featured: true, inStock: true, stock: 25,
    concentration: { en: "Eau de Parfum", ar: "ماء العطر" },
    notes: {
      top: { en: ["Black Pepper", "Bergamot", "Pink Grapefruit"], ar: ["الفلفل الأسود", "البرغموت", "الجريب فروت الوردي"] },
      middle: { en: ["Dark Rose", "Violet", "Geranium"], ar: ["الوردة الداكنة", "البنفسج", "الغرنوقي"] },
      base: { en: ["Patchouli", "Incense", "Dark Chocolate"], ar: ["الباتشولي", "البخور", "الشوكولاتة الداكنة"] }
    }
  },
  {
    name: { en: "Golden Sands", ar: "الرمال الذهبية" },
    description: { en: "Warm and luxurious with golden amber and precious woods", ar: "دافئ وفاخر مع العنبر الذهبي والأخشاب الثمينة" },
    longDescription: { 
      en: "Golden Sands captures the essence of luxury and warmth.",
      ar: "الرمال الذهبية تلتقط جوهر الفخامة والدفء."
    },
    price: 250, size: "100ml", category: "oriental",
    images: [{ url: "/api/placeholder/400/600", cloudinaryId: "golden_sands_1", alt: { en: "Golden Sands", ar: "الرمال الذهبية" }, order: 0 }],
    featured: true, inStock: true, stock: 20,
    concentration: { en: "Extrait de Parfum", ar: "خلاصة العطر" },
    notes: {
      top: { en: ["Saffron", "Cardamom", "Bergamot"], ar: ["الزعفران", "الهيل", "البرغموت"] },
      middle: { en: ["Amber", "Sandalwood", "Ylang-Ylang"], ar: ["العنبر", "خشب الصندل", "الإيلنغ إيلنغ"] },
      base: { en: ["Agarwood", "Vanilla", "White Musk"], ar: ["خشب العود", "الفانيليا", "المسك الأبيض"] }
    }
  },
  {
    name: { en: "Citrus Burst", ar: "انفجار الحمضيات" },
    description: { en: "Energizing blend of lemon, lime, and orange", ar: "مزيج منشط من الليمون والليم والبرتقال" },
    longDescription: { 
      en: "Citrus Burst is pure energy in a bottle.",
      ar: "انفجار الحمضيات هو طاقة خالصة في زجاجة."
    },
    price: 95, size: "100ml", category: "citrus",
    images: [{ url: "/api/placeholder/400/600", cloudinaryId: "citrus_burst_1", alt: { en: "Citrus Burst", ar: "انفجار الحمضيات" }, order: 0 }],
    featured: false, inStock: true, stock: 60,
    concentration: { en: "Eau de Toilette", ar: "ماء التواليت" },
    notes: {
      top: { en: ["Lemon", "Lime", "Orange"], ar: ["الليمون", "الليم", "البرتقال"] },
      middle: { en: ["Neroli", "Petitgrain", "Mint"], ar: ["النيرولي", "البيتيتغرين", "النعناع"] },
      base: { en: ["White Musk", "Cedar", "Vetiver"], ar: ["المسك الأبيض", "الأرز", "الفيتيفر"] }
    }
  },
  {
    name: { en: "Spice Market", ar: "سوق التوابل" },
    description: { en: "Warm spices with cardamom and cinnamon", ar: "توابل دافئة مع الهيل والقرفة" },
    longDescription: { 
      en: "Spice Market transports you to the bustling souks of ancient trade routes.",
      ar: "سوق التوابل ينقلك إلى الأسواق الصاخبة لطرق التجارة القديمة."
    },
    price: 175, size: "100ml", category: "spicy",
    images: [{ url: "/api/placeholder/400/600", cloudinaryId: "spice_market_1", alt: { en: "Spice Market", ar: "سوق التوابل" }, order: 0 }],
    featured: false, inStock: true, stock: 35,
    concentration: { en: "Eau de Parfum", ar: "ماء العطر" },
    notes: {
      top: { en: ["Cardamom", "Cinnamon", "Nutmeg"], ar: ["الهيل", "القرفة", "جوزة الطيب"] },
      middle: { en: ["Saffron", "Clove", "Black Pepper"], ar: ["الزعفران", "القرنفل", "الفلفل الأسود"] },
      base: { en: ["Amber", "Oud", "Vanilla"], ar: ["العنبر", "العود", "الفانيليا"] }
    }
  },
  {
    name: { en: "Ocean Breeze", ar: "نسيم المحيط" },
    description: { en: "Aquatic freshness with marine notes", ar: "انتعاش مائي مع نوتات بحرية" },
    longDescription: { 
      en: "Ocean Breeze captures the essence of endless summer days by the sea.",
      ar: "نسيم المحيط يلتقط جوهر أيام الصيف اللانهائية بجانب البحر."
    },
    price: 130, size: "100ml", category: "aquatic",
    images: [{ url: "/api/placeholder/400/600", cloudinaryId: "ocean_breeze_1", alt: { en: "Ocean Breeze", ar: "نسيم المحيط" }, order: 0 }],
    featured: false, inStock: true, stock: 45,
    concentration: { en: "Eau de Toilette", ar: "ماء التواليت" },
    notes: {
      top: { en: ["Sea Air", "Marine Algae", "Salt Spray"], ar: ["هواء البحر", "الطحالب البحرية", "رذاذ الملح"] },
      middle: { en: ["Water Lily", "Sea Grass", "Driftwood"], ar: ["زنبق الماء", "عشب البحر", "خشب البحر"] },
      base: { en: ["Ambergris", "White Sand", "Clean Musk"], ar: ["العنبر الرمادي", "الرمل الأبيض", "المسك النظيف"] }
    }
  },
  {
    name: { en: "Vanilla Dreams", ar: "أحلام الفانيليا" },
    description: { en: "Sweet gourmand with vanilla and caramel", ar: "حلو مع الفانيليا والكراميل" },
    longDescription: { 
      en: "Vanilla Dreams is a delectable journey into the world of sweet indulgence.",
      ar: "أحلام الفانيليا رحلة لذيذة إلى عالم الانغماس الحلو."
    },
    price: 140, size: "100ml", category: "gourmand",
    images: [{ url: "/api/placeholder/400/600", cloudinaryId: "vanilla_dreams_1", alt: { en: "Vanilla Dreams", ar: "أحلام الفانيليا" }, order: 0 }],
    featured: true, inStock: true, stock: 55,
    concentration: { en: "Eau de Parfum", ar: "ماء العطر" },
    notes: {
      top: { en: ["Caramel", "Honey", "Pink Pepper"], ar: ["الكراميل", "العسل", "الفلفل الوردي"] },
      middle: { en: ["Vanilla", "Tonka Bean", "Praline"], ar: ["الفانيليا", "حبة التونكا", "البرالين"] },
      base: { en: ["Sandalwood", "Benzoin", "White Musk"], ar: ["خشب الصندل", "البنزوين", "المسك الأبيض"] }
    }
  },
  {
    name: { en: "Forest Walk", ar: "نزهة الغابة" },
    description: { en: "Woody blend with cedar and pine", ar: "مزيج خشبي مع الأرز والصنوبر" },
    longDescription: { 
      en: "Forest Walk invites you on a journey through ancient woodlands.",
      ar: "نزهة الغابة تدعوك في رحلة عبر الغابات القديمة."
    },
    price: 160, size: "100ml", category: "woody",
    images: [{ url: "/api/placeholder/400/600", cloudinaryId: "forest_walk_1", alt: { en: "Forest Walk", ar: "نزهة الغابة" }, order: 0 }],
    featured: false, inStock: true, stock: 30,
    concentration: { en: "Eau de Parfum", ar: "ماء العطر" },
    notes: {
      top: { en: ["Pine Needles", "Juniper", "Eucalyptus"], ar: ["إبر الصنوبر", "العرعر", "الأوكالبتوس"] },
      middle: { en: ["Cedar", "Fir Balsam", "Cypress"], ar: ["الأرز", "بلسم التنوب", "السرو"] },
      base: { en: ["Oakmoss", "Patchouli", "Vetiver"], ar: ["طحلب البلوط", "الباتشولي", "الفيتيفر"] }
    }
  }
];

async function migrateAllProducts() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🗑️ Clearing existing products...');
    await Product.deleteMany({});
    console.log('✅ Existing products cleared');

    console.log(`📦 Inserting ${allProducts.length} products...`);
    const insertedProducts = await Product.insertMany(allProducts);
    console.log(`✅ Inserted ${insertedProducts.length} products successfully!`);

    console.log('\n📊 Products Summary:');
    allProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name.ar} - ${product.price} ريال - ${product.inStock ? '✅ متوفر' : '❌ غير متوفر'}`);
    });

    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateAllProducts();
