const products = [
  {
    name: {
      en: "Oud Royal",
      ar: "عود ملكي"
    },
    description: {
      en: "A luxurious blend of premium oud with rose and saffron, creating an opulent and sophisticated fragrance.",
      ar: "مزيج فاخر من العود الممتاز مع الورد والزعفران، يخلق عطراً فخماً ومتطوراً."
    },
    longDescription: {
      en: "Oud Royal represents the pinnacle of luxury perfumery. This exquisite fragrance opens with the rich, complex notes of aged oud wood, carefully sourced from the finest trees. The heart reveals delicate rose petals and precious saffron, while the base settles into warm amber and creamy sandalwood. Perfect for special occasions and evening wear.",
      ar: "يمثل عود ملكي قمة صناعة العطور الفاخرة. يبدأ هذا العطر الرائع بنفحات غنية ومعقدة من خشب العود المعتق، المصدر بعناية من أجود الأشجار. يكشف القلب عن بتلات الورد الرقيقة والزعفران الثمين، بينما تستقر القاعدة في العنبر الدافئ وخشب الصندل الكريمي."
    },
    price: 299.99,
    size: "50ml",
    category: "oriental",
    images: [
      {
        url: "https://res.cloudinary.com/demo/image/upload/v1/perfumes/oud-royal-1.jpg",
        cloudinaryId: "perfumes/oud-royal-1",
        alt: {
          en: "Oud Royal perfume bottle front view",
          ar: "زجاجة عطر عود ملكي من الأمام"
        },
        order: 0
      }
    ],
    featured: true,
    inStock: true,
    stock: 25,
    concentration: {
      en: "Eau de Parfum",
      ar: "أو دو بارفان"
    },
    notes: {
      top: {
        en: ["Oud", "Bergamot", "Pink Pepper"],
        ar: ["عود", "برغموت", "فلفل وردي"]
      },
      middle: {
        en: ["Rose", "Saffron", "Jasmine"],
        ar: ["ورد", "زعفران", "ياسمين"]
      },
      base: {
        en: ["Amber", "Sandalwood", "Musk"],
        ar: ["عنبر", "خشب الصندل", "مسك"]
      }
    },
    seo: {
      metaTitle: {
        en: "Oud Royal - Luxury Oriental Perfume | Maison Darin",
        ar: "عود ملكي - عطر شرقي فاخر | ميزون دارين"
      },
      metaDescription: {
        en: "Experience luxury with Oud Royal, a sophisticated blend of premium oud, rose, and saffron. Perfect for special occasions.",
        ar: "اختبر الفخامة مع عود ملكي، مزيج متطور من العود الممتاز والورد والزعفران."
      }
    }
  },
  {
    name: {
      en: "Rose Garden",
      ar: "حديقة الورود"
    },
    description: {
      en: "A romantic floral bouquet featuring Bulgarian rose, peony, and white musk for an elegant and feminine scent.",
      ar: "باقة زهور رومانسية تضم الورد البلغاري والفاوانيا والمسك الأبيض لعطر أنيق ونسائي."
    },
    longDescription: {
      en: "Rose Garden captures the essence of a blooming rose garden at dawn. This enchanting fragrance features the finest Bulgarian rose at its heart, complemented by soft peony petals and fresh green leaves. The composition is elevated with hints of bergamot and completed with a gentle base of white musk and cedar.",
      ar: "تلتقط حديقة الورود جوهر حديقة ورود متفتحة عند الفجر. يتميز هذا العطر الساحر بأجود الورد البلغاري في قلبه، مكملاً ببتلات الفاوانيا الناعمة والأوراق الخضراء الطازجة."
    },
    price: 189.99,
    size: "75ml",
    category: "floral",
    images: [
      {
        url: "https://res.cloudinary.com/demo/image/upload/v1/perfumes/rose-garden-1.jpg",
        cloudinaryId: "perfumes/rose-garden-1",
        alt: {
          en: "Rose Garden perfume bottle with floral background",
          ar: "زجاجة عطر حديقة الورود مع خلفية زهرية"
        },
        order: 0
      }
    ],
    featured: true,
    inStock: true,
    stock: 40,
    concentration: {
      en: "Eau de Parfum",
      ar: "أو دو بارفان"
    },
    notes: {
      top: {
        en: ["Bergamot", "Green Leaves", "Lemon"],
        ar: ["برغموت", "أوراق خضراء", "ليمون"]
      },
      middle: {
        en: ["Bulgarian Rose", "Peony", "Lily of the Valley"],
        ar: ["ورد بلغاري", "فاوانيا", "زنبق الوادي"]
      },
      base: {
        en: ["White Musk", "Cedar", "Soft Woods"],
        ar: ["مسك أبيض", "أرز", "أخشاب ناعمة"]
      }
    },
    seo: {
      metaTitle: {
        en: "Rose Garden - Elegant Floral Perfume | Maison Darin",
        ar: "حديقة الورود - عطر زهري أنيق | ميزون دارين"
      },
      metaDescription: {
        en: "Discover Rose Garden, a romantic floral fragrance with Bulgarian rose, peony, and white musk.",
        ar: "اكتشف حديقة الورود، عطر زهري رومانسي بالورد البلغاري والفاوانيا والمسك الأبيض."
      }
    }
  },
  {
    name: {
      en: "Ocean Breeze",
      ar: "نسيم المحيط"
    },
    description: {
      en: "A fresh aquatic fragrance with marine notes, citrus, and light woods for a clean and invigorating scent.",
      ar: "عطر مائي منعش بنفحات بحرية وحمضيات وأخشاب خفيفة لرائحة نظيفة ومنشطة."
    },
    longDescription: {
      en: "Ocean Breeze transports you to a pristine coastline where fresh sea air meets warm sand. This invigorating fragrance opens with crisp marine notes and zesty citrus, flows into a heart of sea salt and water lily, and settles into a base of driftwood and clean musk.",
      ar: "ينقلك نسيم المحيط إلى ساحل نقي حيث يلتقي الهواء البحري المنعش بالرمال الدافئة. يبدأ هذا العطر المنشط بنفحات بحرية منعشة وحمضيات لاذعة."
    },
    price: 149.99,
    size: "100ml",
    category: "aquatic",
    images: [
      {
        url: "https://res.cloudinary.com/demo/image/upload/v1/perfumes/ocean-breeze-1.jpg",
        cloudinaryId: "perfumes/ocean-breeze-1",
        alt: {
          en: "Ocean Breeze perfume bottle with ocean waves",
          ar: "زجاجة عطر نسيم المحيط مع أمواج البحر"
        },
        order: 0
      }
    ],
    featured: false,
    inStock: true,
    stock: 30,
    concentration: {
      en: "Eau de Toilette",
      ar: "أو دو تواليت"
    },
    notes: {
      top: {
        en: ["Marine Notes", "Bergamot", "Grapefruit"],
        ar: ["نفحات بحرية", "برغموت", "جريب فروت"]
      },
      middle: {
        en: ["Sea Salt", "Water Lily", "Cyclamen"],
        ar: ["ملح البحر", "زنبق الماء", "سيكلامين"]
      },
      base: {
        en: ["Driftwood", "Clean Musk", "Ambergris"],
        ar: ["خشب منجرف", "مسك نظيف", "عنبر رمادي"]
      }
    },
    seo: {
      metaTitle: {
        en: "Ocean Breeze - Fresh Aquatic Perfume | Maison Darin",
        ar: "نسيم المحيط - عطر مائي منعش | ميزون دارين"
      },
      metaDescription: {
        en: "Feel refreshed with Ocean Breeze, a clean aquatic fragrance with marine notes and citrus.",
        ar: "اشعر بالانتعاش مع نسيم المحيط، عطر مائي نظيف بنفحات بحرية وحمضيات."
      }
    }
  },
  {
    name: {
      en: "Amber Nights",
      ar: "ليالي العنبر"
    },
    description: {
      en: "A warm and sensual fragrance with rich amber, vanilla, and spices for evening elegance.",
      ar: "عطر دافئ وحسي بالعنبر الغني والفانيليا والتوابل للأناقة المسائية."
    },
    longDescription: {
      en: "Amber Nights embodies the mystery and allure of twilight hours. This captivating fragrance weaves together golden amber, creamy vanilla, and exotic spices to create a scent that's both comforting and seductive. Perfect for intimate evenings and special moments.",
      ar: "يجسد ليالي العنبر غموض وسحر ساعات الغسق. يجمع هذا العطر الآسر بين العنبر الذهبي والفانيليا الكريمية والتوابل الغريبة."
    },
    price: 219.99,
    size: "50ml",
    category: "oriental",
    images: [
      {
        url: "https://res.cloudinary.com/demo/image/upload/v1/perfumes/amber-nights-1.jpg",
        cloudinaryId: "perfumes/amber-nights-1",
        alt: {
          en: "Amber Nights perfume bottle in golden light",
          ar: "زجاجة عطر ليالي العنبر في ضوء ذهبي"
        },
        order: 0
      }
    ],
    featured: true,
    inStock: true,
    stock: 20,
    concentration: {
      en: "Eau de Parfum",
      ar: "أو دو بارفان"
    },
    notes: {
      top: {
        en: ["Cinnamon", "Orange Blossom", "Cardamom"],
        ar: ["قرفة", "زهر البرتقال", "هيل"]
      },
      middle: {
        en: ["Amber", "Rose", "Clove"],
        ar: ["عنبر", "ورد", "قرنفل"]
      },
      base: {
        en: ["Vanilla", "Sandalwood", "Benzoin"],
        ar: ["فانيليا", "خشب الصندل", "بنزوين"]
      }
    },
    seo: {
      metaTitle: {
        en: "Amber Nights - Warm Oriental Perfume | Maison Darin",
        ar: "ليالي العنبر - عطر شرقي دافئ | ميزون دارين"
      },
      metaDescription: {
        en: "Experience warmth with Amber Nights, a sensual oriental fragrance with amber, vanilla, and spices.",
        ar: "اختبر الدفء مع ليالي العنبر، عطر شرقي حسي بالعنبر والفانيليا والتوابل."
      }
    }
  },
  {
    name: {
      en: "Citrus Burst",
      ar: "انفجار الحمضيات"
    },
    description: {
      en: "An energizing citrus blend with lemon, orange, and grapefruit for a vibrant and uplifting experience.",
      ar: "مزيج حمضيات منشط بالليمون والبرتقال والجريب فروت لتجربة نابضة بالحياة ومرفعة للمعنويات."
    },
    longDescription: {
      en: "Citrus Burst is pure energy in a bottle. This vibrant fragrance combines the zest of fresh lemons, the sweetness of blood oranges, and the tang of pink grapefruit. Enhanced with mint and basil, it delivers an instant mood boost perfect for daytime wear.",
      ar: "انفجار الحمضيات هو طاقة خالصة في زجاجة. يجمع هذا العطر النابض بالحياة بين نكهة الليمون الطازج وحلاوة البرتقال الأحمر."
    },
    price: 129.99,
    size: "100ml",
    category: "citrus",
    images: [
      {
        url: "https://res.cloudinary.com/demo/image/upload/v1/perfumes/citrus-burst-1.jpg",
        cloudinaryId: "perfumes/citrus-burst-1",
        alt: {
          en: "Citrus Burst perfume bottle with fresh fruits",
          ar: "زجاجة عطر انفجار الحمضيات مع فواكه طازجة"
        },
        order: 0
      }
    ],
    featured: false,
    inStock: true,
    stock: 50,
    concentration: {
      en: "Eau de Toilette",
      ar: "أو دو تواليت"
    },
    notes: {
      top: {
        en: ["Lemon", "Orange", "Grapefruit"],
        ar: ["ليمون", "برتقال", "جريب فروت"]
      },
      middle: {
        en: ["Mint", "Basil", "Green Apple"],
        ar: ["نعناع", "ريحان", "تفاح أخضر"]
      },
      base: {
        en: ["White Musk", "Light Woods", "Vetiver"],
        ar: ["مسك أبيض", "أخشاب خفيفة", "فيتيفر"]
      }
    },
    seo: {
      metaTitle: {
        en: "Citrus Burst - Energizing Fresh Perfume | Maison Darin",
        ar: "انفجار الحمضيات - عطر منعش ومنشط | ميزون دارين"
      },
      metaDescription: {
        en: "Get energized with Citrus Burst, a vibrant blend of lemon, orange, and grapefruit.",
        ar: "احصل على الطاقة مع انفجار الحمضيات، مزيج نابض بالحياة من الليمون والبرتقال والجريب فروت."
      }
    }
  },
  {
    name: {
      en: "Mystic Woods",
      ar: "الغابات الغامضة"
    },
    description: {
      en: "A deep woody fragrance with cedar, patchouli, and smoky incense for a mysterious and sophisticated scent.",
      ar: "عطر خشبي عميق بالأرز والباتشولي والبخور المدخن لرائحة غامضة ومتطورة."
    },
    longDescription: {
      en: "Mystic Woods takes you on a journey through an ancient forest shrouded in mist. This complex fragrance layers rich cedar and earthy patchouli with smoky incense and leather, creating a scent that's both grounding and mysterious. Ideal for those who appreciate depth and complexity.",
      ar: "تأخذك الغابات الغامضة في رحلة عبر غابة قديمة محاطة بالضباب. يطبق هذا العطر المعقد الأرز الغني والباتشولي الترابي مع البخور المدخن والجلد."
    },
    price: 259.99,
    size: "75ml",
    category: "woody",
    images: [
      {
        url: "https://res.cloudinary.com/demo/image/upload/v1/perfumes/mystic-woods-1.jpg",
        cloudinaryId: "perfumes/mystic-woods-1",
        alt: {
          en: "Mystic Woods perfume bottle in forest setting",
          ar: "زجاجة عطر الغابات الغامضة في بيئة الغابة"
        },
        order: 0
      }
    ],
    featured: false,
    inStock: true,
    stock: 15,
    concentration: {
      en: "Eau de Parfum",
      ar: "أو دو بارفان"
    },
    notes: {
      top: {
        en: ["Black Pepper", "Juniper", "Bergamot"],
        ar: ["فلفل أسود", "عرعر", "برغموت"]
      },
      middle: {
        en: ["Cedar", "Patchouli", "Incense"],
        ar: ["أرز", "باتشولي", "بخور"]
      },
      base: {
        en: ["Leather", "Vetiver", "Dark Musk"],
        ar: ["جلد", "فيتيفر", "مسك داكن"]
      }
    },
    seo: {
      metaTitle: {
        en: "Mystic Woods - Deep Woody Perfume | Maison Darin",
        ar: "الغابات الغامضة - عطر خشبي عميق | ميزون دارين"
      },
      metaDescription: {
        en: "Explore mystery with Mystic Woods, a sophisticated woody fragrance with cedar, patchouli, and incense.",
        ar: "استكشف الغموض مع الغابات الغامضة، عطر خشبي متطور بالأرز والباتشولي والبخور."
      }
    }
  }
];

module.exports = {
  products
};