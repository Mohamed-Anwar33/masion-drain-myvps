import { useState, useEffect, useCallback, useMemo } from 'react';
import homePageService, { HomePageContent, HeroSection } from '../services/homePageService';
// import { toast } from 'react-hot-toast';

interface UseHomePageReturn {
  content: HomePageContent | null;
  loading: boolean;
  error: string | null;
  updateContent: (data: Partial<HomePageContent>) => Promise<void>;
  updateSection: (section: string, data: any) => Promise<void>;
  resetToDefault: () => Promise<void>;
  refreshContent: () => Promise<void>;
  lastUpdated: Date | null;
  updatedBy: any;
}

export const useHomePage = (): UseHomePageReturn => {
  const [content, setContent] = useState<HomePageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [updatedBy, setUpdatedBy] = useState<any>(null);

  // Fetch homepage content
  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await homePageService.getContent();
      setContent(data);
      setLastUpdated(data.lastUpdated ? new Date(data.lastUpdated) : null);
      setUpdatedBy(data.updatedBy);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching homepage content:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update entire content
  const updateContent = useCallback(async (data: Partial<HomePageContent>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedContent = await homePageService.updateContent(data);
      setContent(updatedContent);
      setLastUpdated(updatedContent.lastUpdated ? new Date(updatedContent.lastUpdated) : null);
      setUpdatedBy(updatedContent.updatedBy);
      console.log('تم تحديث محتوى الصفحة الرئيسية بنجاح');
    } catch (err: any) {
      setError(err.message);
      console.error(`خطأ في تحديث المحتوى: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update specific section
  const updateSection = useCallback(async (section: string, data: any) => {
    try {
      setLoading(true);
      setError(null);
      const updatedContent = await homePageService.updateSection(section, data);
      setContent(updatedContent);
      setLastUpdated(updatedContent.lastUpdated ? new Date(updatedContent.lastUpdated) : null);
      setUpdatedBy(updatedContent.updatedBy);
      console.log(`تم تحديث قسم ${getSectionName(section)} بنجاح`);
    } catch (err: any) {
      setError(err.message);
      console.error(`خطأ في تحديث قسم ${getSectionName(section)}: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset to default
  const resetToDefault = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const defaultContent = await homePageService.resetToDefault();
      setContent(defaultContent);
      setLastUpdated(defaultContent.lastUpdated ? new Date(defaultContent.lastUpdated) : null);
      setUpdatedBy(defaultContent.updatedBy);
      console.log('تم إعادة تعيين المحتوى إلى الإعدادات الافتراضية');
    } catch (err: any) {
      setError(err.message);
      console.error(`خطأ في إعادة التعيين: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh content
  const refreshContent = useCallback(async () => {
    await fetchContent();
  }, [fetchContent]);

  // Get section name in Arabic
  const getSectionName = (section: string): string => {
    const sectionNames: { [key: string]: string } = {
      hero: 'البانر الرئيسي',
      about: 'نبذة عنا',
      featuredProducts: 'المنتجات المميزة',
      categories: 'الفئات',
      newsletter: 'النشرة الإخبارية',
      contact: 'التواصل',
      socialMedia: 'وسائل التواصل الاجتماعي',
      seo: 'إعدادات SEO',
      email: 'إعدادات البريد الإلكتروني',
      display: 'إعدادات العرض',
      maintenance: 'وضع الصيانة'
    };
    return sectionNames[section] || section;
  };

  // Load content on mount
  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  return {
    content,
    loading,
    error,
    updateContent,
    updateSection,
    resetToDefault,
    refreshContent,
    lastUpdated,
    updatedBy
  };
};

// Hook specifically for Hero Section
// Caching mechanism for API responses
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const API_CACHE: Record<string, CacheEntry<any>> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache duration

// Function to get cached data or fetch new data
const getOrFetchData = async <T,>(cacheKey: string, fetchFn: () => Promise<T>): Promise<T> => {
  const now = Date.now();
  const cachedItem = API_CACHE[cacheKey];

  // Return cached data if valid
  if (cachedItem && now < cachedItem.expiresAt) {
    return cachedItem.data;
  }

  // Otherwise fetch new data
  const data = await fetchFn();
  
  // Cache the result
  API_CACHE[cacheKey] = {
    data,
    timestamp: now,
    expiresAt: now + CACHE_DURATION
  };

  return data;
};

export const useHeroSection = () => {
  const [heroData, setHeroData] = useState<HeroSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch hero section data with caching
  const fetchHeroData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getOrFetchData<HeroSection>(
        'hero-section',
        async () => await homePageService.getHeroSection()
      );
      
      setHeroData(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching hero section:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update hero section
  const updateHero = useCallback(async (data: Partial<HeroSection>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedHero = await homePageService.updateHeroSection(data);
      setHeroData(updatedHero);
      console.log('تم تحديث البانر الرئيسي بنجاح');
    } catch (err: any) {
      setError(err.message);
      console.error(`خطأ في تحديث البانر الرئيسي: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Add image to slideshow
  const addImage = useCallback(async (imageData: {
    url: string;
    cloudinaryId?: string;
    alt?: { en: string; ar: string };
    order?: number;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const updatedSlideshow = await homePageService.addHeroImage(imageData);
      // Update local state
      if (heroData) {
        setHeroData({
          ...heroData,
          images: {
            ...heroData.images,
            slideshow: updatedSlideshow
          }
        });
      }
      console.log('تم إضافة الصورة بنجاح');
    } catch (err: any) {
      setError(err.message);
      console.error(`خطأ في إضافة الصورة: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [heroData]);

  // Remove image from slideshow
  const removeImage = useCallback(async (imageIndex: number) => {
    try {
      setLoading(true);
      setError(null);
      const updatedSlideshow = await homePageService.removeHeroImage(imageIndex);
      // Update local state
      if (heroData) {
        setHeroData({
          ...heroData,
          images: {
            ...heroData.images,
            slideshow: updatedSlideshow
          }
        });
      }
      console.log('تم حذف الصورة بنجاح');
    } catch (err: any) {
      setError(err.message);
      console.error(`خطأ في حذف الصورة: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [heroData]);

  // Load hero data on mount
  useEffect(() => {
    fetchHeroData();
  }, [fetchHeroData]);

  return {
    heroData,
    loading,
    error,
    updateHero,
    addImage,
    removeImage,
    refreshHero: fetchHeroData
  };
};

// Hook for specific sections
export const useHomePageSection = (section: string) => {
  const { content, loading, error, updateSection } = useHomePage();
  
  const updateThisSection = useCallback(async (data: any) => {
    return updateSection(section, data);
  }, [section, updateSection]);

  const sectionData = useMemo(() => {
    return content ? getSectionData(content, section) : null;
  }, [content, section]);

  return {
    data: sectionData,
    loading,
    error,
    updateSection: updateThisSection
  };
};

// Helper function to get section data
const getSectionData = (content: HomePageContent, section: string): any => {
  switch (section) {
    case 'hero':
      return content.hero;
    case 'about':
      return {
        aboutTitle: content.aboutTitle,
        aboutDescription: content.aboutDescription,
        aboutImage: content.aboutImage,
        showAboutSection: content.showAboutSection
      };
    case 'featuredProducts':
      return {
        featuredProductsTitle: content.featuredProductsTitle,
        featuredProductsSubtitle: content.featuredProductsSubtitle,
        showFeaturedProducts: content.showFeaturedProducts,
        featuredProductsLimit: content.featuredProductsLimit
      };
    case 'categories':
      return {
        categoriesTitle: content.categoriesTitle,
        categoriesSubtitle: content.categoriesSubtitle,
        showCategories: content.showCategories
      };
    case 'newsletter':
      return {
        newsletterTitle: content.newsletterTitle,
        newsletterDescription: content.newsletterDescription,
        newsletterButtonText: content.newsletterButtonText,
        showNewsletter: content.showNewsletter
      };
    case 'contact':
      return {
        contactTitle: content.contactTitle,
        contactDescription: content.contactDescription,
        contactEmail: content.contactEmail,
        contactPhone: content.contactPhone,
        contactAddress: content.contactAddress,
        showContact: content.showContact
      };
    case 'socialMedia':
      return {
        socialMedia: content.socialMedia
      };
    case 'seo':
      return {
        seoTitle: content.seoTitle,
        seoDescription: content.seoDescription,
        seoKeywords: content.seoKeywords
      };
    case 'email':
      return {
        contactFormEmail: content.contactFormEmail,
        newsletterEmail: content.newsletterEmail,
        orderNotificationEmail: content.orderNotificationEmail
      };
    case 'display':
      return {
        showHeroSection: content.hero?.showSection,
        showAboutSection: content.showAboutSection,
        showFeaturedProducts: content.showFeaturedProducts,
        showCategories: content.showCategories,
        showNewsletter: content.showNewsletter,
        showContact: content.showContact,
        showTestimonials: content.showTestimonials,
        showBlog: content.showBlog
      };
    case 'maintenance':
      return {
        maintenanceMode: content.maintenanceMode,
        maintenanceMessage: content.maintenanceMessage
      };
    default:
      return null;
  }
};
