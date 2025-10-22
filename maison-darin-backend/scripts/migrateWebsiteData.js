const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

// البيانات الحالية من الموقع
const websiteProducts = [
  {
    name: { en: "Floral Symphony", ar: "سيمفونية الأزهار" },
    description: { en: "A delicate blend of jasmine, rose, and white lily", ar: "مزيج رقيق من الياسمين والورد وزنبق أبيض" },
    longDescription: { 
      en: "Floral Symphony is a masterpiece of olfactory artistry, carefully crafted to capture the essence of a blooming garden at dawn. This exquisite fragrance opens with a burst of fresh bergamot and zesty lemon, awakened by a subtle hint of pink pepper that adds depth and intrigue. The heart reveals a luxurious bouquet of jasmine, rose, and white lily, each note harmoniously balanced to create a symphony of floral elegance. The base notes of sandalwood, musk, and vanilla provide a warm, sensual foundation that lingers beautifully on the skin.",
      ar: "سيمفونية الأزهار تحفة فنية عطرية، صُنعت بعناية فائقة لتلتقط جوهر حديقة متفتحة عند الفجر. يبدأ هذا العطر الرائع بانفجار من البرغموت المنعش والليمون المنعش، مع لمسة خفيفة من الفلفل الوردي التي تضيف عمقاً وإثارة. يكشف القلب عن باقة فاخرة من الياسمين والورد وزنبق أبيض، كل نوتة متوازنة بانسجام لتخلق سيمفونية من الأناقة الزهرية."
    },
    price: 150,
    size: "100ml",
    category: "floral",
    images: [
      { url: "/api/placeholder/400/600", cloudinaryId: "floral_symphony_1", alt: { en: "Floral Symphony perfume bottle", ar: "زجاجة عطر سيمفونية الأزهار" }, order: 0 },
      { url: "/api/placeholder/400/600", cloudinaryId: "floral_symphony_2", alt: { en: "Floral Symphony detail", ar: "تفاصيل سيمفونية الأزهار" }, order: 1 }
    ],
    featured: true,
    inStock: true,
    stock: 50,
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
      en: "Oriental Mystique transports you to ancient spice markets and opulent palaces. This captivating fragrance begins with the warm embrace of cardamom and cinnamon, complemented by the bright zest of orange. The heart unfolds with rich amber, precious oud, and delicate rose, creating an intoxicating blend that speaks of luxury and mystery. The base notes of sandalwood, vanilla, and patchouli provide a deep, sensual finish that evolves beautifully throughout the day.",
      ar: "الغموض الشرقي ينقلك إلى أسواق التوابل القديمة والقصور الفاخرة. يبدأ هذا العطر الآسر بعناق دافئ من الهيل والقرفة، مكملاً بنكهة البرتقال المشرقة. يتكشف القلب بالعنبر الغني والعود الثمين والورد الرقيق، مما يخلق مزيجاً مسكراً يتحدث عن الفخامة والغموض."
    },
    price: 180,
    size: "100ml",
    category: "oriental",
    images: [
      { url: "/api/placeholder/400/600", cloudinaryId: "oriental_mystique_1", alt: { en: "Oriental Mystique perfume", ar: "عطر الغموض الشرقي" }, order: 0 }
    ],
    featured: true,
    inStock: true,
    stock: 30,
    concentration: { en: "Eau de Parfum", ar: "ماء العطر" },
    notes: {
      top: { en: ["Cardamom", "Cinnamon", "Orange"], ar: ["الهيل", "القرفة", "البرتقال"] },
      middle: { en: ["Amber", "Oud", "Rose"], ar: ["العنبر", "العود", "الورد"] },
      base: { en: ["Sandalwood", "Vanilla", "Patchouli"], ar: ["خشب الصندل", "الفانيليا", "الباتشولي"] }
    }
  }
];

async function migrateData() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🗑️ Clearing existing products...');
    await Product.deleteMany({});
    console.log('✅ Existing products cleared');

    console.log('📦 Inserting new products...');
    const insertedProducts = await Product.insertMany(websiteProducts);
    console.log(`✅ Inserted ${insertedProducts.length} products`);

    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateData();
