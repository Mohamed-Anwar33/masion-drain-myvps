import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  Upload, 
  X, 
  Plus, 
  ChevronUp, 
  ChevronDown, 
  Globe,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Trash2,
  Badge,
  Type,
  MousePointer,
  Clock,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useHeroSection } from '../../../hooks/useHomePage';
import { CLOUDINARY_CONFIG, getCloudinaryUploadUrl } from '../../../config/cloudinary';
import { useNotifications } from '../../../hooks/useNotifications';
import { NotificationContainer } from '../../ui/LuxuryNotification';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface LanguageTabProps {
  activeLanguage: 'en' | 'ar';
  onLanguageChange: (lang: 'en' | 'ar') => void;
}

const LanguageTab: React.FC<LanguageTabProps> = ({ activeLanguage, onLanguageChange }) => (
  <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
    <button
      onClick={() => onLanguageChange('ar')}
      className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        activeLanguage === 'ar'
          ? 'bg-white text-primary shadow-sm'
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      <Globe className="w-4 h-4 ml-2" />
      العربية
    </button>
    <button
      onClick={() => onLanguageChange('en')}
      className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        activeLanguage === 'en'
          ? 'bg-white text-primary shadow-sm'
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      <Globe className="w-4 h-4 ml-2" />
      English
    </button>
  </div>
);

// Upload function with fallback to local storage
const uploadImage = async (file: File): Promise<string> => {
  // Try Cloudinary first
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    
    const response = await fetch(getCloudinaryUploadUrl(), {
      method: 'POST',
      body: formData,
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.secure_url;
    } else {
      console.warn('Cloudinary upload failed, falling back to local storage');
      throw new Error('Cloudinary failed');
    }
  } catch (cloudinaryError) {
    console.warn('Cloudinary upload failed:', cloudinaryError);
    
    // Fallback to local backend upload
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/upload/image`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Local upload failed: ${response.status}`);
      }
      
      const data = await response.json();
      return data.url;
    } catch (localError) {
      console.error('Both Cloudinary and local upload failed:', localError);
      
      // Final fallback: create a data URL for preview (temporary)
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    }
  }
};

const HeroSectionEditorNew: React.FC = () => {
  const { heroData, loading, updateHero, addImage, removeImage, refreshHero } = useHeroSection();
  const { 
    notifications, 
    removeNotification,
    showSaveSuccess,
    showSaveError,
    showUploadSuccess,
    showUploadError,
    showDeleteSuccess,
    showDeleteError,
    showUploadProgress,
    showSaveProgress,
    showDeleteProgress
  } = useNotifications();
  
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'ar'>('ar');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mainImageInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    badge: { en: '', ar: '' },
    title: { en: '', ar: '' },
    subtitle: { en: '', ar: '' },
    cta: {
      primary: {
        text: { en: '', ar: '' },
        link: ''
      },
      secondary: {
        text: { en: '', ar: '' },
        link: ''
      }
    },
    images: {
      main: {
        url: '',
        cloudinaryId: '',
        alt: { en: '', ar: '' }
      },
      slideshow: [] as Array<{
        url: string;
        cloudinaryId: string;
        alt: { en: string; ar: string };
        order: number;
      }>
    },
    showSection: true,
    showBadge: true,
    showSlideshow: true,
    slideshowInterval: 4000
  });

  useEffect(() => {
    if (heroData && !loading) {
      setFormData({
        badge: heroData.badge || { en: '', ar: '' },
        title: heroData.title || { en: '', ar: '' },
        subtitle: heroData.subtitle || { en: '', ar: '' },
        cta: {
          primary: {
            text: heroData.cta?.primary?.text || { en: '', ar: '' },
            link: heroData.cta?.primary?.link || ''
          },
          secondary: {
            text: heroData.cta?.secondary?.text || { en: '', ar: '' },
            link: heroData.cta?.secondary?.link || ''
          }
        },
        images: {
          main: {
            url: heroData.images?.main?.url || '',
            cloudinaryId: heroData.images?.main?.cloudinaryId || '',
            alt: heroData.images?.main?.alt || { en: '', ar: '' }
          },
          slideshow: heroData.images?.slideshow || []
        },
        showSection: heroData.showSection ?? true,
        showBadge: heroData.showBadge ?? true,
        showSlideshow: heroData.showSlideshow ?? true,
        slideshowInterval: heroData.slideshowInterval || 4000
      });
    }
  }, [heroData, loading]);

  const handleInputChange = (field: string, value: any, language?: 'en' | 'ar') => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = field.split('.');
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      if (language) {
        if (!current[keys[keys.length - 1]]) current[keys[keys.length - 1]] = {};
        current[keys[keys.length - 1]][language] = value;
      } else {
        current[keys[keys.length - 1]] = value;
      }
      
      return newData;
    });
  };

  // Handle save - فقط البيانات النصية، مش الصور
  const handleSave = async () => {
    setSaving(true);
    const progressId = showSaveProgress();
    
    try {
      // حفظ بس البيانات النصية والإعدادات - مش الصور!
      const textUpdate = {
        badge: formData.badge,
        title: formData.title,
        subtitle: formData.subtitle,
        cta: formData.cta,
        showSection: formData.showSection,
        showBadge: formData.showBadge,
        showSlideshow: formData.showSlideshow,
        slideshowInterval: formData.slideshowInterval
      };
      
      await updateHero(textUpdate);
      removeNotification(progressId);
      showSaveSuccess();
    } catch (error) {
      console.error('Error updating hero section:', error);
      removeNotification(progressId);
      showSaveError('حدث خطأ أثناء حفظ البيانات. يرجى التحقق من الاتصال والمحاولة مرة أخرى.');
    } finally {
      setSaving(false);
    }
  };
  // Handle file upload for slideshow
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    // حدود النظام
    const MAX_FILES = 10; // أقصى عدد صور
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB لكل صورة
    const MAX_TOTAL_IMAGES = 15; // أقصى عدد صور في المعرض
    
    // التحقق من العدد الحالي
    const currentImagesCount = formData.images.slideshow.length;
    if (currentImagesCount >= MAX_TOTAL_IMAGES) {
      showUploadError(`لا يمكن إضافة المزيد من الصور. الحد الأقصى ${MAX_TOTAL_IMAGES} صورة`);
      return;
    }
    
    // التحقق من عدد الملفات المحددة
    if (files.length > MAX_FILES) {
      showUploadError(`يمكنك رفع ${MAX_FILES} صور كحد أقصى في المرة الواحدة`);
      return;
    }
    
    // التحقق من أن العدد الإجمالي لن يتجاوز الحد
    if (currentImagesCount + files.length > MAX_TOTAL_IMAGES) {
      const allowedCount = MAX_TOTAL_IMAGES - currentImagesCount;
      showUploadError(`يمكنك إضافة ${allowedCount} صور فقط. لديك ${currentImagesCount} صور من أصل ${MAX_TOTAL_IMAGES}`);
      return;
    }
    
    // التحقق من حجم كل ملف
    const oversizedFiles = [];
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > MAX_FILE_SIZE) {
        oversizedFiles.push(files[i].name);
      }
    }
    
    if (oversizedFiles.length > 0) {
      showUploadError(`الصور التالية تتجاوز الحد المسموح (5MB):\n${oversizedFiles.join(', ')}`);
      return;
    }
    
    // التحقق من نوع الملفات
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidFiles = [];
    for (let i = 0; i < files.length; i++) {
      if (!allowedTypes.includes(files[i].type)) {
        invalidFiles.push(files[i].name);
      }
    }
    
    if (invalidFiles.length > 0) {
      showUploadError(`أنواع الملفات التالية غير مدعومة:\n${invalidFiles.join(', ')}\nالأنواع المدعومة: JPG, PNG, WebP`);
      return;
    }
    
    setUploading(true);
    const progressId = showUploadProgress();
    
    try {
      const updatedData = { ...formData };
      let successCount = 0;
      let failedFiles = [];
      
      for (let i = 0; i < files.length; i++) {
        try {
          const file = files[i];
          const imageUrl = await uploadImage(file);
          
          // إضافة الصورة للبيانات المحلية
          const newImage = {
            url: imageUrl,
            cloudinaryId: '', // Will be extracted from URL if needed
            alt: { 
              en: `Luxury Perfume Collection ${updatedData.images.slideshow.length + 1}`, 
              ar: `مجموعة العطور الفاخرة ${updatedData.images.slideshow.length + 1}` 
            },
            order: updatedData.images.slideshow.length
          };
          
          updatedData.images.slideshow.push(newImage);
          successCount++;
        } catch (fileError) {
          console.error(`Error uploading ${files[i].name}:`, fileError);
          failedFiles.push(files[i].name);
        }
      }
      
      // تحديث البيانات المحلية
      setFormData(updatedData);
      
      // حفظ بس الصور الجديدة - مش كل البيانات!
      const slideshowUpdate = {
        images: {
          main: updatedData.images.main,
          slideshow: [...updatedData.images.slideshow]
        }
      };
      
      await updateHero(slideshowUpdate);
      
      removeNotification(progressId);
      
      // عرض النتائج
      if (successCount > 0 && failedFiles.length === 0) {
        showUploadSuccess(successCount);
      } else if (successCount > 0 && failedFiles.length > 0) {
        showUploadSuccess(successCount);
        showUploadError(`فشل في رفع: ${failedFiles.join(', ')}`);
      } else {
        showUploadError('فشل في رفع جميع الصور');
      }
      
    } catch (error) {
      console.error('Error uploading images:', error);
      removeNotification(progressId);
      showUploadError('فشل في رفع الصور. تأكد من إعدادات Cloudinary واتصال الإنترنت');
    } finally {
      setUploading(false);
    }
  };

  // Handle main image upload
  const handleMainImageUpload = async (file: File) => {
    // حدود النظام
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    // التحقق من حجم الملف
    if (file.size > MAX_FILE_SIZE) {
      showUploadError(`حجم الصورة كبير جداً. الحد الأقصى 5MB\nحجم الصورة الحالي: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }
    
    // التحقق من نوع الملف
    if (!allowedTypes.includes(file.type)) {
      showUploadError(`نوع الملف غير مدعوم: ${file.type}\nالأنواع المدعومة: JPG, PNG, WebP`);
      return;
    }
    
    setUploading(true);
    const progressId = showUploadProgress();
    
    try {
      const imageUrl = await uploadImage(file);
      
      // تحديث البيانات المحلية
      const updatedData = { ...formData };
      
      // إضافة الصورة للعرض التلقائي
      const newImage = {
        url: imageUrl,
        cloudinaryId: '',
        alt: { 
          en: `Luxury Perfume Collection ${updatedData.images.slideshow.length + 1}`, 
          ar: `مجموعة العطور الفاخرة ${updatedData.images.slideshow.length + 1}` 
        },
        order: updatedData.images.slideshow.length
      };
      
      updatedData.images.slideshow.push(newImage);
      
      // تحديث الصورة الرئيسية أيضاً
      updatedData.images.main.url = imageUrl;
      
      setFormData(updatedData);
      
      // حفظ بس التعديل الجديد - مش كل البيانات!
      const imageUpdate = {
        images: {
          main: {
            url: imageUrl,
            cloudinaryId: updatedData.images.main.cloudinaryId || '',
            alt: updatedData.images.main.alt || { en: 'Main Hero Image', ar: 'الصورة الرئيسية' }
          },
          slideshow: [...updatedData.images.slideshow]
        }
      };
      
      await updateHero(imageUpdate);
      
      removeNotification(progressId);
      showUploadSuccess(1);
    } catch (error) {
      console.error('Error uploading main image:', error);
      removeNotification(progressId);
      showUploadError('فشل في رفع الصورة الرئيسية. تأكد من إعدادات Cloudinary واتصال الإنترنت وحجم الصورة');
    } finally {
      setUploading(false);
    }
  };

  // Move image up in order
  const moveImageUp = async (index: number) => {
    if (index === 0) return;
    
    const updatedData = { ...formData };
    const newSlideshow = [...updatedData.images.slideshow];
    [newSlideshow[index], newSlideshow[index - 1]] = [newSlideshow[index - 1], newSlideshow[index]];
    
    // Update order values
    newSlideshow.forEach((img, i) => {
      img.order = i;
    });
    
    updatedData.images.slideshow = newSlideshow;
    setFormData(updatedData);
    
    // حفظ في الباك إند فوراً
    await updateHero(updatedData);
    await refreshHero();
  };

  // Move image down in order
  const moveImageDown = async (index: number) => {
    if (index === formData.images.slideshow.length - 1) return;
    
    const updatedData = { ...formData };
    const newSlideshow = [...updatedData.images.slideshow];
    [newSlideshow[index], newSlideshow[index + 1]] = [newSlideshow[index + 1], newSlideshow[index]];
    
    // Update order values
    newSlideshow.forEach((img, i) => {
      img.order = i;
    });
    
    updatedData.images.slideshow = newSlideshow;
    setFormData(updatedData);
    
    // حفظ في الباك إند فوراً
    await updateHero(updatedData);
    await refreshHero();
  };

  const handleRemoveImage = async (index: number) => {
    setDeletingIndex(index);
    const progressId = showDeleteProgress();
    
    try {
      const updatedData = { ...formData };
      const removedImage = updatedData.images.slideshow[index];
      updatedData.images.slideshow.splice(index, 1);
      
      // Update order values
      updatedData.images.slideshow.forEach((img, i) => {
        img.order = i;
      });
      
      setFormData(updatedData);
      
      // حفظ بس الصور المحدثة - مش كل البيانات!
      const slideshowUpdate = {
        images: {
          main: updatedData.images.main,
          slideshow: [...updatedData.images.slideshow]
        }
      };
      
      await updateHero(slideshowUpdate);
      
      removeNotification(progressId);
      showDeleteSuccess();
    } catch (error) {
      console.error('Error removing image:', error);
      removeNotification(progressId);
      showDeleteError('فشل في حذف الصورة. يرجى المحاولة مرة أخرى.');
    } finally {
      setDeletingIndex(null);
    }
  };

  if (loading && !heroData) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8" dir="rtl">
      {/* Language Selector */}
      <LanguageTab activeLanguage={activeLanguage} onLanguageChange={setActiveLanguage} />

      {/* Section Visibility Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center">
          {formData.showSection ? (
            <Eye className="w-5 h-5 text-green-500 ml-2" />
          ) : (
            <EyeOff className="w-5 h-5 text-gray-400 ml-2" />
          )}
          <span className="font-medium text-gray-900">عرض القسم الرئيسي</span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={formData.showSection}
            onChange={(e) => handleInputChange('showSection', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
      </div>

      {/* Badge Section */}
      <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Badge className="w-4 h-4 ml-2" />
            شارة الفخامة
          </label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.showBadge}
              onChange={(e) => handleInputChange('showBadge', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
        <input
          type="text"
          value={formData.badge[activeLanguage]}
          onChange={(e) => handleInputChange('badge', e.target.value, activeLanguage)}
          placeholder={activeLanguage === 'ar' ? 'عطور فاخرة' : 'Luxury Fragrances'}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        />
      </div>

      {/* Title Section */}
      <div className="space-y-2">
        <label className="flex items-center text-sm font-medium text-gray-700">
          <Type className="w-4 h-4 ml-2" />
          العنوان الرئيسي ({activeLanguage === 'ar' ? 'العربية' : 'English'})
        </label>
        <input
          type="text"
          value={formData.title[activeLanguage]}
          onChange={(e) => handleInputChange('title', e.target.value, activeLanguage)}
          placeholder={activeLanguage === 'ar' ? 'عطور رائعة للمرأة العصرية' : 'Exquisite Perfumes for the Modern Woman'}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        />
      </div>

      {/* Subtitle Section */}
      <div className="space-y-2">
        <label className="flex items-center text-sm font-medium text-gray-700">
          <Type className="w-4 h-4 ml-2" />
          العنوان الفرعي ({activeLanguage === 'ar' ? 'العربية' : 'English'})
        </label>
        <textarea
          value={formData.subtitle[activeLanguage]}
          onChange={(e) => handleInputChange('subtitle', e.target.value, activeLanguage)}
          placeholder={activeLanguage === 'ar' ? 'اكتشفي مجموعتنا المختارة من العطور الحرفية...' : 'Discover our curated collection of artisanal fragrances...'}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
        />
      </div>

      {/* CTA Buttons */}
      <div className="space-y-6 p-4 bg-green-50 rounded-lg">
        <h3 className="flex items-center text-lg font-semibold text-gray-900">
          <MousePointer className="w-5 h-5 ml-2" />
          أزرار الإجراء
        </h3>
        
        {/* Primary CTA */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-700">الزر الأساسي</h4>
          <div className="grid grid-cols-1 gap-4">
            <input
              type="text"
              value={formData.cta.primary.text[activeLanguage]}
              onChange={(e) => handleInputChange('cta.primary.text', e.target.value, activeLanguage)}
              placeholder={activeLanguage === 'ar' ? 'استكشفي المجموعات' : 'Explore Collections'}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
            {/* مخفي مؤقتاً - حقل الرابط */}
            {/* <input
              type="text"
              value={formData.cta.primary.link}
              onChange={(e) => handleInputChange('cta.primary.link', e.target.value)}
              placeholder="/products"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            /> */}
          </div>
        </div>

        {/* Secondary CTA */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-700">الزر الثانوي</h4>
          <div className="grid grid-cols-1 gap-4">
            <input
              type="text"
              value={formData.cta.secondary.text[activeLanguage]}
              onChange={(e) => handleInputChange('cta.secondary.text', e.target.value, activeLanguage)}
              placeholder={activeLanguage === 'ar' ? 'اطلبي عينة' : 'Request Sample'}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
            {/* مخفي مؤقتاً - حقل الرابط */}
            {/* <input
              type="text"
              value={formData.cta.secondary.link}
              onChange={(e) => handleInputChange('cta.secondary.link', e.target.value)}
              placeholder="/contact"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            /> */}
          </div>
        </div>
      </div>

      {/* Images Section */}
      <div className="space-y-6 p-4 bg-purple-50 rounded-lg">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center text-lg font-semibold text-gray-900">
            <ImageIcon className="w-5 h-5 ml-2" />
            إدارة الصور
          </h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.showSlideshow}
              onChange={(e) => handleInputChange('showSlideshow', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        {/* Slideshow Interval */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Clock className="w-4 h-4 ml-2" />
            مدة عرض كل صورة (بالميلي ثانية)
          </label>
          <input
            type="number"
            value={formData.slideshowInterval}
            onChange={(e) => handleInputChange('slideshowInterval', parseInt(e.target.value))}
            min="1000"
            max="10000"
            step="500"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>

        {/* Main Image */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-700">الصورة الرئيسية</h4>
          
          <div className="flex gap-4">
            <button
              onClick={() => mainImageInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              <Upload className="w-4 h-4 ml-2" />
              {uploading ? 'جاري الرفع...' : 'رفع صورة'}
            </button>
            
            <input
              ref={mainImageInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={(e) => e.target.files?.[0] && handleMainImageUpload(e.target.files[0])}
              className="hidden"
            />
          </div>
          
          {formData.images.main.url && (
            <div className="relative">
              <img
                src={formData.images.main.url}
                alt="الصورة الرئيسية"
                className="w-full h-48 object-contain bg-gray-50 rounded-lg border"
              />
              <button
                onClick={async () => {
                  const updatedData = { ...formData };
                  updatedData.images.main.url = '';
                  setFormData(updatedData);
                  await updateHero(updatedData);
                  await refreshHero();
                  showDeleteSuccess();
                }}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Slideshow Images */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-700">صور العرض التلقائي</h4>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1">
                  <div className="flex justify-between text-sm text-gray-500 mb-1">
                    <span>{formData.images.slideshow.length}/15 صور</span>
                    <span>{Math.round((formData.images.slideshow.length / 15) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        formData.images.slideshow.length >= 15 
                          ? 'bg-red-500' 
                          : formData.images.slideshow.length >= 12 
                          ? 'bg-yellow-500' 
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${(formData.images.slideshow.length / 15) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                حد أقصى 5MB لكل صورة • يمكن رفع 10 صور في المرة الواحدة
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || formData.images.slideshow.length >= 15}
              className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4 ml-2" />
              {uploading ? 'جاري الرفع...' : 'إضافة صور'}
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />

          {uploading && (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
              <span className="mr-3 text-gray-600">جاري رفع الصور...</span>
            </div>
          )}

          <div className="space-y-3">
            {formData.images.slideshow
              .sort((a, b) => a.order - b.order)
              .map((image, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-white rounded-lg border">
                <img
                  src={image.url}
                  alt={`صورة ${index + 1}`}
                  className="w-20 h-20 object-contain bg-gray-50 rounded-lg border"
                />
                
                <div className="flex-1">
                  <p className="font-medium text-gray-900">صورة رقم {index + 1}</p>
                  <p className="text-sm text-gray-500">الترتيب: {image.order + 1}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => moveImageUp(index)}
                    disabled={index === 0}
                    className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="تحريك لأعلى"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => moveImageDown(index)}
                    disabled={index === formData.images.slideshow.length - 1}
                    className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="تحريك لأسفل"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  
                  <div className="w-px h-6 bg-gray-300 mx-2"></div>
                  
                  <button
                    onClick={() => handleRemoveImage(index)}
                    disabled={deletingIndex === index}
                    className={`p-2 transition-colors ${
                      deletingIndex === index 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-red-500 hover:text-red-700'
                    }`}
                    title={deletingIndex === index ? "جاري الحذف..." : "حذف الصورة"}
                  >
                    {deletingIndex === index ? (
                      <div className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin"></div>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
            
            {formData.images.slideshow.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>لا توجد صور في العرض التلقائي</p>
                <p className="text-sm">اضغط "إضافة صور" لرفع صور من جهازك</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Section */}
      {formData.showSection && (
        <div className="border-t pt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">معاينة القسم</h3>
          <div className="relative bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-8 md:p-12 text-center overflow-hidden">
            <div className="relative z-10">
              {formData.showBadge && formData.badge[activeLanguage] && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 border border-primary/20 mb-4">
                  <span className="text-sm font-medium text-primary">
                    {formData.badge[activeLanguage]}
                  </span>
                </div>
              )}
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
                {formData.title[activeLanguage] || 'العنوان الرئيسي'}
              </h1>
              <p className="text-lg mb-8 max-w-2xl mx-auto text-gray-600">
                {formData.subtitle[activeLanguage] || 'الوصف الفرعي للصفحة الرئيسية'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {formData.cta.primary.text[activeLanguage] && (
                  <button className="bg-primary text-white px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                    {formData.cta.primary.text[activeLanguage]}
                  </button>
                )}
                {formData.cta.secondary.text[activeLanguage] && (
                  <button className="border-2 border-primary text-primary px-8 py-3 rounded-lg font-medium hover:bg-primary/10 transition-colors">
                    {formData.cta.secondary.text[activeLanguage]}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          className="flex items-center px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <LoadingSpinner size="sm" className="ml-2" />
          ) : (
            <Save className="w-5 h-5 ml-2" />
          )}
          {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </motion.button>
      </div>

      {/* حاوية الإشعارات الفخمة */}
      <NotificationContainer 
        notifications={notifications} 
        onClose={removeNotification} 
      />
    </div>
  );
};

export default HeroSectionEditorNew;
