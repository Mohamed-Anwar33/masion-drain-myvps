const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const Product = require('../models/Product');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Sample product images to upload
const sampleImages = [
  {
    name: 'collection-1',
    url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&h=800&fit=crop',
    alt: { en: 'Luxury Perfume Collection 1', ar: 'مجموعة العطور الفاخرة 1' }
  },
  {
    name: 'hero-perfume',
    url: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59d75?w=800&h=800&fit=crop',
    alt: { en: 'Hero Perfume Bottle', ar: 'زجاجة العطر الرئيسية' }
  },
  {
    name: 'floral-symphony',
    url: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=800&h=800&fit=crop',
    alt: { en: 'Floral Symphony Perfume', ar: 'عطر سيمفونية الأزهار' }
  },
  {
    name: 'oriental-mystique',
    url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&h=800&fit=crop',
    alt: { en: 'Oriental Mystique Perfume', ar: 'عطر الغموض الشرقي' }
  },
  {
    name: 'fresh-breeze',
    url: 'https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=800&h=800&fit=crop',
    alt: { en: 'Fresh Breeze Perfume', ar: 'عطر النسيم المنعش' }
  },
  {
    name: 'royal-garden',
    url: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&h=800&fit=crop',
    alt: { en: 'Royal Garden Perfume', ar: 'عطر الحديقة الملكية' }
  },
  {
    name: 'midnight-rose',
    url: 'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=800&h=800&fit=crop',
    alt: { en: 'Midnight Rose Perfume', ar: 'عطر وردة منتصف الليل' }
  },
  {
    name: 'golden-sands',
    url: 'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=800&h=800&fit=crop',
    alt: { en: 'Golden Sands Perfume', ar: 'عطر الرمال الذهبية' }
  }
];

class ImageUploader {
  constructor() {
    this.mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/maison-darin';
  }

  async connect() {
    try {
      await mongoose.connect(this.mongoUri);
      console.log('✅ متصل بقاعدة البيانات');
    } catch (error) {
      console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error.message);
      throw error;
    }
  }

  async uploadImage(imageData) {
    try {
      console.log(`📤 رفع صورة: ${imageData.name}...`);
      
      const result = await cloudinary.uploader.upload(imageData.url, {
        folder: 'maison-darin/products',
        public_id: imageData.name,
        overwrite: true,
        transformation: [
          { width: 800, height: 800, crop: 'fill', quality: 'auto' },
          { format: 'webp' }
        ]
      });

      console.log(`✅ تم رفع ${imageData.name}: ${result.secure_url}`);
      
      return {
        url: result.secure_url,
        cloudinaryId: result.public_id,
        alt: imageData.alt,
        order: 0,
        optimizedUrls: {
          small: cloudinary.url(result.public_id, {
            width: 400, height: 400, crop: 'fill', quality: 'auto', format: 'webp'
          }),
          medium: cloudinary.url(result.public_id, {
            width: 800, height: 800, crop: 'fill', quality: 'auto', format: 'webp'
          }),
          large: cloudinary.url(result.public_id, {
            width: 1200, height: 1200, crop: 'limit', quality: 'auto', format: 'webp'
          })
        }
      };
    } catch (error) {
      console.error(`❌ خطأ في رفع ${imageData.name}:`, error.message);
      return null;
    }
  }

  async updateProductImages() {
    try {
      const products = await Product.find({});
      console.log(`📦 وجدت ${products.length} منتج`);

      for (let i = 0; i < products.length && i < sampleImages.length; i++) {
        const product = products[i];
        const imageData = sampleImages[i % sampleImages.length];
        
        console.log(`\n🔄 تحديث صور المنتج: ${product.name.ar}`);
        
        const uploadedImage = await this.uploadImage(imageData);
        if (uploadedImage) {
          product.images = [uploadedImage];
          await product.save();
          console.log(`✅ تم تحديث صور ${product.name.ar}`);
        }
      }

      console.log('\n🎉 تم الانتهاء من رفع جميع الصور!');
    } catch (error) {
      console.error('❌ خطأ في تحديث صور المنتجات:', error.message);
    }
  }

  async run() {
    try {
      await this.connect();
      await this.updateProductImages();
    } catch (error) {
      console.error('❌ خطأ عام:', error.message);
    } finally {
      await mongoose.disconnect();
      console.log('👋 تم قطع الاتصال بقاعدة البيانات');
    }
  }
}

// تشغيل السكريبت
const uploader = new ImageUploader();
uploader.run();
