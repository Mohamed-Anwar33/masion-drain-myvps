import { Product } from '@/contexts/CartContext';
import heroImage from "@/assets/hero-perfume.jpg";
import collection1 from "@/assets/collection-1.jpg";
import collection2 from "@/assets/collection-2.jpg";
import collection3 from "@/assets/collection-3.jpg";

// Categories definition
export const categories = {
  floral: { en: "Floral", ar: "زهري" },
  oriental: { en: "Oriental", ar: "شرقي" },
  fresh: { en: "Fresh", ar: "منعش" },
  woody: { en: "Woody", ar: "خشبي" },
  citrus: { en: "Citrus", ar: "حمضي" },
  spicy: { en: "Spicy", ar: "حار" },
  aquatic: { en: "Aquatic", ar: "مائي" },
  gourmand: { en: "Gourmand", ar: "حلو" }
};

export const products: Product[] = [
  {
    id: 1,
    name: { en: "Floral Symphony", ar: "سيمفونية الأزهار" },
    description: { en: "A delicate blend of jasmine, rose, and white lily", ar: "مزيج رقيق من الياسمين والورد وزنبق أبيض" },
    longDescription: { 
      en: "Floral Symphony is a masterpiece of olfactory artistry, carefully crafted to capture the essence of a blooming garden at dawn. This exquisite fragrance opens with a burst of fresh bergamot and zesty lemon, awakened by a subtle hint of pink pepper that adds depth and intrigue. The heart reveals a luxurious bouquet of jasmine, rose, and white lily, each note harmoniously balanced to create a symphony of floral elegance. The base notes of sandalwood, musk, and vanilla provide a warm, sensual foundation that lingers beautifully on the skin.",
      ar: "سيمفونية الأزهار تحفة فنية عطرية، صُنعت بعناية فائقة لتلتقط جوهر حديقة متفتحة عند الفجر. يبدأ هذا العطر الرائع بانفجار من البرغموت المنعش والليمون المنعش، مع لمسة خفيفة من الفلفل الوردي التي تضيف عمقاً وإثارة. يكشف القلب عن باقة فاخرة من الياسمين والورد وزنبق أبيض، كل نوتة متوازنة بانسجام لتخلق سيمفونية من الأناقة الزهرية."
    },
    price: 150,
    size: "100ml",
    category: "floral",
    image: collection1,
    images: [collection1, heroImage, collection2],
    featured: true,
    inStock: true,
    concentration: { en: "Eau de Parfum", ar: "ماء العطر" },
    notes: {
      top: { en: ["Bergamot", "Lemon", "Pink Pepper"], ar: ["البرغموت", "الليمون", "الفلفل الوردي"] },
      middle: { en: ["Jasmine", "Rose", "White Lily"], ar: ["الياسمين", "الورد", "زنبق أبيض"] },
      base: { en: ["Sandalwood", "Musk", "Vanilla"], ar: ["خشب الصندل", "المسك", "الفانيليا"] }
    }
  },
  {
    id: 2,
    name: { en: "Oriental Mystique", ar: "الغموض الشرقي" },
    description: { en: "Rich amber and vanilla with hints of sandalwood", ar: "العنبر الغني والفانيليا مع لمسات من خشب الصندل" },
    longDescription: { 
      en: "Oriental Mystique transports you to ancient spice markets and opulent palaces. This captivating fragrance begins with the warm embrace of cardamom and cinnamon, complemented by the bright zest of orange. The heart unfolds with rich amber, precious oud, and delicate rose, creating an intoxicating blend that speaks of luxury and mystery. The base notes of sandalwood, vanilla, and patchouli provide a deep, sensual finish that evolves beautifully throughout the day.",
      ar: "الغموض الشرقي ينقلك إلى أسواق التوابل القديمة والقصور الفاخرة. يبدأ هذا العطر الآسر بعناق دافئ من الهيل والقرفة، مكملاً بنكهة البرتقال المشرقة. يتكشف القلب بالعنبر الغني والعود الثمين والورد الرقيق، مما يخلق مزيجاً مسكراً يتحدث عن الفخامة والغموض."
    },
    price: 180,
    size: "100ml",
    category: "oriental",
    image: collection2,
    images: [collection2, collection3, heroImage],
    featured: true,
    inStock: true,
    concentration: { en: "Eau de Parfum", ar: "ماء العطر" },
    notes: {
      top: { en: ["Cardamom", "Cinnamon", "Orange"], ar: ["الهيل", "القرفة", "البرتقال"] },
      middle: { en: ["Amber", "Oud", "Rose"], ar: ["العنبر", "العود", "الورد"] },
      base: { en: ["Sandalwood", "Vanilla", "Patchouli"], ar: ["خشب الصندل", "الفانيليا", "الباتشولي"] }
    }
  },
  {
    id: 3,
    name: { en: "Fresh Breeze", ar: "النسيم المنعش" },
    description: { en: "Citrus top notes with marine and green accords", ar: "نوتات حمضية علوية مع نفحات بحرية وخضراء" },
    longDescription: { 
      en: "Fresh Breeze captures the invigorating essence of a coastal morning. This refreshing fragrance opens with the vibrant energy of grapefruit and marine notes, enhanced by the cooling touch of mint. The heart reveals the natural beauty of green leaves, sea salt, and lavender, evoking memories of seaside gardens. The base notes of cedar, white musk, and driftwood create a clean, modern finish that embodies freedom and vitality.",
      ar: "النسيم المنعش يلتقط الجوهر المنشط لصباح ساحلي. يبدأ هذا العطر المنعش بالطاقة النابضة بالحياة للجريب فروت والنوتات البحرية، معززة باللمسة المبردة للنعناع. يكشف القلب عن الجمال الطبيعي للأوراق الخضراء وملح البحر واللافندر."
    },
    price: 120,
    size: "100ml",
    category: "fresh",
    image: collection3,
    images: [collection3, collection1, heroImage],
    featured: false,
    inStock: true,
    concentration: { en: "Eau de Toilette", ar: "ماء التواليت" },
    notes: {
      top: { en: ["Grapefruit", "Marine", "Mint"], ar: ["الجريب فروت", "البحري", "النعناع"] },
      middle: { en: ["Green Leaves", "Sea Salt", "Lavender"], ar: ["الأوراق الخضراء", "ملح البحر", "اللافندر"] },
      base: { en: ["Cedar", "White Musk", "Driftwood"], ar: ["الأرز", "المسك الأبيض", "خشب البحر"] }
    }
  },
  {
    id: 4,
    name: { en: "Royal Garden", ar: "الحديقة الملكية" },
    description: { en: "Elegant peony and iris with woody undertones", ar: "الفاوانيا الأنيقة والسوسن مع نفحات خشبية" },
    longDescription: { 
      en: "Royal Garden is an ode to timeless elegance and regal sophistication. This noble fragrance opens with the crisp sweetness of pear, the tartness of black currant, and the sunny warmth of mandarin. The heart blooms with the majestic beauty of peony, the powdery elegance of iris, and the delicate charm of freesia. The base notes of cedarwood, white musk, and amber create a refined, lasting impression that speaks of luxury and grace.",
      ar: "الحديقة الملكية قصيدة للأناقة الخالدة والرقي الملكي. يبدأ هذا العطر النبيل بحلاوة الكمثرى المقرمشة، وحموضة الكشمش الأسود، ودفء اليوسفي المشمس. يتفتح القلب بالجمال المهيب للفاوانيا والأناقة البودرية للسوسن."
    },
    price: 200,
    size: "100ml",
    category: "floral",
    image: heroImage,
    images: [heroImage, collection1, collection2],
    featured: true,
    inStock: false,
    concentration: { en: "Extrait de Parfum", ar: "خلاصة العطر" },
    notes: {
      top: { en: ["Pear", "Black Currant", "Mandarin"], ar: ["الكمثرى", "الكشمش الأسود", "اليوسفي"] },
      middle: { en: ["Peony", "Iris", "Freesia"], ar: ["الفاوانيا", "السوسن", "الفريزيا"] },
      base: { en: ["Cedarwood", "White Musk", "Amber"], ar: ["خشب الأرز", "المسك الأبيض", "العنبر"] }
    }
  },
  {
    id: 5,
    name: { en: "Midnight Rose", ar: "وردة منتصف الليل" },
    description: { en: "Dark and mysterious rose with smoky undertones", ar: "وردة داكنة وغامضة مع نفحات دخانية" },
    longDescription: { 
      en: "Midnight Rose unveils the darker side of romance. This enigmatic fragrance opens with the intoxicating blend of black pepper and bergamot, setting the stage for mystery. The heart reveals a dramatic bouquet of dark rose, violet, and geranium, creating an alluring and sophisticated composition. The base notes of patchouli, incense, and dark chocolate provide a rich, seductive finish that lingers long into the night.",
      ar: "وردة منتصف الليل تكشف الجانب الأكثر ظلاماً من الرومانسية. يبدأ هذا العطر الغامض بمزيج مسكر من الفلفل الأسود والبرغموت، مما يمهد للغموض. يكشف القلب عن باقة درامية من الوردة الداكنة والبنفسج والغرنوقي."
    },
    price: 220,
    size: "100ml",
    category: "oriental",
    image: collection1,
    images: [collection1, collection2, heroImage],
    featured: true,
    inStock: true,
    concentration: { en: "Eau de Parfum", ar: "ماء العطر" },
    notes: {
      top: { en: ["Black Pepper", "Bergamot", "Pink Grapefruit"], ar: ["الفلفل الأسود", "البرغموت", "الجريب فروت الوردي"] },
      middle: { en: ["Dark Rose", "Violet", "Geranium"], ar: ["الوردة الداكنة", "البنفسج", "الغرنوقي"] },
      base: { en: ["Patchouli", "Incense", "Dark Chocolate"], ar: ["الباتشولي", "البخور", "الشوكولاتة الداكنة"] }
    }
  },
  {
    id: 6,
    name: { en: "Golden Sands", ar: "الرمال الذهبية" },
    description: { en: "Warm and luxurious with golden amber and precious woods", ar: "دافئ وفاخر مع العنبر الذهبي والأخشاب الثمينة" },
    longDescription: { 
      en: "Golden Sands captures the essence of luxury and warmth. This opulent fragrance opens with the radiant glow of saffron and cardamom, evoking images of golden desert landscapes. The heart unfolds with precious amber, creamy sandalwood, and exotic ylang-ylang, creating a rich and captivating blend. The base notes of agarwood, vanilla, and white musk provide a sophisticated, long-lasting finish that embodies pure elegance.",
      ar: "الرمال الذهبية تلتقط جوهر الفخامة والدفء. يبدأ هذا العطر الفاخر بالتوهج المشع للزعفران والهيل، مما يستحضر صور المناظر الطبيعية الصحراوية الذهبية. يتكشف القلب بالعنبر الثمين وخشب الصندل الكريمي."
    },
    price: 250,
    size: "100ml",
    category: "oriental",
    image: collection2,
    images: [collection2, heroImage, collection3],
    featured: true,
    inStock: true,
    concentration: { en: "Extrait de Parfum", ar: "خلاصة العطر" },
    notes: {
      top: { en: ["Saffron", "Cardamom", "Bergamot"], ar: ["الزعفران", "الهيل", "البرغموت"] },
      middle: { en: ["Amber", "Sandalwood", "Ylang-Ylang"], ar: ["العنبر", "خشب الصندل", "الإيلنغ إيلنغ"] },
      base: { en: ["Agarwood", "Vanilla", "White Musk"], ar: ["خشب العود", "الفانيليا", "المسك الأبيض"] }
    }
  },
  {
    id: 6,
    name: { en: "Citrus Burst", ar: "انفجار الحمضيات" },
    description: { en: "Energizing blend of lemon, lime, and orange", ar: "مزيج منشط من الليمون والليم والبرتقال" },
    longDescription: { 
      en: "Citrus Burst is pure energy in a bottle. This invigorating fragrance captures the essence of a Mediterranean summer with its vibrant blend of fresh citrus fruits. Opening with zesty lemon, tangy lime, and sweet orange, it awakens the senses with its effervescent personality. The heart adds depth with neroli and petitgrain, while the base of white musk and cedar provides a clean, lasting finish.",
      ar: "انفجار الحمضيات هو طاقة خالصة في زجاجة. يلتقط هذا العطر المنشط جوهر صيف البحر المتوسط بمزيجه النابض بالحياة من الفواكه الحمضية الطازجة."
    },
    price: 95,
    size: "100ml",
    category: "citrus",
    image: collection2,
    images: [collection2, heroImage, collection3],
    featured: false,
    inStock: true,
    concentration: { en: "Eau de Toilette", ar: "ماء التواليت" },
    notes: {
      top: { en: ["Lemon", "Lime", "Orange"], ar: ["الليمون", "الليم", "البرتقال"] },
      middle: { en: ["Neroli", "Petitgrain", "Mint"], ar: ["النيرولي", "البيتيتغرين", "النعناع"] },
      base: { en: ["White Musk", "Cedar", "Vetiver"], ar: ["المسك الأبيض", "الأرز", "الفيتيفر"] }
    }
  },
  {
    id: 7,
    name: { en: "Spice Market", ar: "سوق التوابل" },
    description: { en: "Warm spices with cardamom and cinnamon", ar: "توابل دافئة مع الهيل والقرفة" },
    longDescription: { 
      en: "Spice Market transports you to the bustling souks of ancient trade routes. This captivating fragrance opens with the warm embrace of cardamom, cinnamon, and nutmeg, creating an intoxicating spice blend. The heart reveals precious saffron, clove, and black pepper, while the base of amber, oud, and vanilla provides a rich, luxurious foundation.",
      ar: "سوق التوابل ينقلك إلى الأسواق الصاخبة لطرق التجارة القديمة. يبدأ هذا العطر الآسر بعناق دافئ من الهيل والقرفة وجوزة الطيب."
    },
    price: 175,
    size: "100ml",
    category: "spicy",
    image: collection3,
    images: [collection3, collection1, heroImage],
    featured: false,
    inStock: true,
    concentration: { en: "Eau de Parfum", ar: "ماء العطر" },
    notes: {
      top: { en: ["Cardamom", "Cinnamon", "Nutmeg"], ar: ["الهيل", "القرفة", "جوزة الطيب"] },
      middle: { en: ["Saffron", "Clove", "Black Pepper"], ar: ["الزعفران", "القرنفل", "الفلفل الأسود"] },
      base: { en: ["Amber", "Oud", "Vanilla"], ar: ["العنبر", "العود", "الفانيليا"] }
    }
  },
  {
    id: 8,
    name: { en: "Ocean Breeze", ar: "نسيم المحيط" },
    description: { en: "Aquatic freshness with marine notes", ar: "انتعاش مائي مع نوتات بحرية" },
    longDescription: { 
      en: "Ocean Breeze captures the essence of endless summer days by the sea. This refreshing fragrance opens with crisp sea air, marine algae, and salt spray. The heart blooms with water lily, sea grass, and driftwood, while the base of ambergris, white sand, and clean musk creates a serene, oceanic finish.",
      ar: "نسيم المحيط يلتقط جوهر أيام الصيف اللانهائية بجانب البحر. يبدأ هذا العطر المنعش بهواء البحر المقرمش والطحالب البحرية ورذاذ الملح."
    },
    price: 130,
    size: "100ml",
    category: "aquatic",
    image: heroImage,
    images: [heroImage, collection2, collection3],
    featured: false,
    inStock: true,
    concentration: { en: "Eau de Toilette", ar: "ماء التواليت" },
    notes: {
      top: { en: ["Sea Air", "Marine Algae", "Salt Spray"], ar: ["هواء البحر", "الطحالب البحرية", "رذاذ الملح"] },
      middle: { en: ["Water Lily", "Sea Grass", "Driftwood"], ar: ["زنبق الماء", "عشب البحر", "خشب البحر"] },
      base: { en: ["Ambergris", "White Sand", "Clean Musk"], ar: ["العنبر الرمادي", "الرمل الأبيض", "المسك النظيف"] }
    }
  },
  {
    id: 9,
    name: { en: "Vanilla Dreams", ar: "أحلام الفانيليا" },
    description: { en: "Sweet gourmand with vanilla and caramel", ar: "حلو مع الفانيليا والكراميل" },
    longDescription: { 
      en: "Vanilla Dreams is a delectable journey into the world of sweet indulgence. This gourmand masterpiece opens with the warm sweetness of caramel and honey, enhanced by a touch of pink pepper. The heart reveals creamy vanilla, tonka bean, and praline, creating an irresistible gourmand bouquet. The base of sandalwood, benzoin, and white musk provides a comforting, cozy finish.",
      ar: "أحلام الفانيليا رحلة لذيذة إلى عالم الانغماس الحلو. تبدأ هذه التحفة الحلوة بحلاوة الكراميل والعسل الدافئة، معززة بلمسة من الفلفل الوردي."
    },
    price: 140,
    size: "100ml",
    category: "gourmand",
    image: collection1,
    images: [collection1, collection3, heroImage],
    featured: true,
    inStock: true,
    concentration: { en: "Eau de Parfum", ar: "ماء العطر" },
    notes: {
      top: { en: ["Caramel", "Honey", "Pink Pepper"], ar: ["الكراميل", "العسل", "الفلفل الوردي"] },
      middle: { en: ["Vanilla", "Tonka Bean", "Praline"], ar: ["الفانيليا", "حبة التونكا", "البرالين"] },
      base: { en: ["Sandalwood", "Benzoin", "White Musk"], ar: ["خشب الصندل", "البنزوين", "المسك الأبيض"] }
    }
  },
  {
    id: 10,
    name: { en: "Forest Walk", ar: "نزهة الغابة" },
    description: { en: "Woody blend with cedar and pine", ar: "مزيج خشبي مع الأرز والصنوبر" },
    longDescription: { 
      en: "Forest Walk invites you on a journey through ancient woodlands. This earthy fragrance opens with the crisp freshness of pine needles and juniper, complemented by the green vitality of eucalyptus. The heart reveals the noble strength of cedar, fir balsam, and cypress, while the base of oakmoss, patchouli, and vetiver creates a grounding, natural finish.",
      ar: "نزهة الغابة تدعوك في رحلة عبر الغابات القديمة. يبدأ هذا العطر الترابي بانتعاش إبر الصنوبر والعرعر المقرمش، مكملاً بالحيوية الخضراء للأوكالبتوس."
    },
    price: 160,
    size: "100ml",
    category: "woody",
    image: collection2,
    images: [collection2, collection1, heroImage],
    featured: false,
    inStock: true,
    concentration: { en: "Eau de Parfum", ar: "ماء العطر" },
    notes: {
      top: { en: ["Pine Needles", "Juniper", "Eucalyptus"], ar: ["إبر الصنوبر", "العرعر", "الأوكالبتوس"] },
      middle: { en: ["Cedar", "Fir Balsam", "Cypress"], ar: ["الأرز", "بلسم التنوب", "السرو"] },
      base: { en: ["Oakmoss", "Patchouli", "Vetiver"], ar: ["طحلب البلوط", "الباتشولي", "الفيتيفر"] }
    }
  }
];
