/**
 * وظيفة لمسح التخزين المؤقت في المتصفح
 * تستخدم للتأكد من أن المستخدم يرى دائماً أحدث نسخة من الموقع
 * مفيدة بشكل خاص في متصفح كروم الذي يميل لتخزين الملفات بشكل مكثف
 */

interface CacheCleanerOptions {
  cacheStorage?: boolean; // مسح Cache Storage API
  serviceWorker?: boolean; // مسح Service Workers
  appCache?: boolean; // مسح AppCache
  localStorage?: boolean; // مسح localStorage
  sessionStorage?: boolean; // مسح sessionStorage
  clearOn?: 'startup' | 'reload' | 'both'; // متى يتم مسح التخزين المؤقت
}

class CacheCleaner {
  private options: CacheCleanerOptions = {
    cacheStorage: true,
    serviceWorker: true,
    appCache: true,
    localStorage: false,
    sessionStorage: false,
    clearOn: 'both'
  };

  private readonly VERSION_KEY = 'maison_darin_version';
  private readonly LAST_CLEARED_KEY = 'maison_darin_cache_cleared';
  private currentVersion: string = '';
  private hasCleanedOnStartup: boolean = false;

  constructor(options?: CacheCleanerOptions, version?: string) {
    if (options) {
      this.options = { ...this.options, ...options };
    }
    
    this.currentVersion = version || this.getCurrentBuildVersion();
    this.setupEventListeners();
  }

  /**
   * الحصول على نسخة البناء الحالية
   * يمكن تحديثها مع كل نشر جديد لضمان مسح التخزين المؤقت
   */
  private getCurrentBuildVersion(): string {
    // يمكن تغيير هذه القيمة مع كل نشر جديد
    return import.meta.env.VITE_APP_VERSION || new Date().toISOString().split('T')[0];
  }

  /**
   * إعداد مستمعي الأحداث
   */
  private setupEventListeners(): void {
    // مسح التخزين المؤقت عند بدء التشغيل
    if (this.options.clearOn === 'startup' || this.options.clearOn === 'both') {
      this.clearOnStartup();
    }

    // مسح التخزين المؤقت عند إعادة التحميل
    if (this.options.clearOn === 'reload' || this.options.clearOn === 'both') {
      window.addEventListener('beforeunload', () => {
        localStorage.setItem(this.LAST_CLEARED_KEY, new Date().toISOString());
      });
    }
  }

  /**
   * مسح التخزين المؤقت عند بدء التشغيل
   */
  private clearOnStartup(): void {
    if (this.hasCleanedOnStartup) return;

    const storedVersion = localStorage.getItem(this.VERSION_KEY);
    
    // إذا تغيرت النسخة أو لم يتم مسح التخزين المؤقت من قبل
    if (!storedVersion || storedVersion !== this.currentVersion) {
      this.clearAllCaches();
      localStorage.setItem(this.VERSION_KEY, this.currentVersion);
      console.log('🧹 تم مسح التخزين المؤقت - نسخة الموقع الجديدة:', this.currentVersion);
    } else {
      console.log('✅ التخزين المؤقت محدث - نسخة الموقع الحالية:', this.currentVersion);
    }

    this.hasCleanedOnStartup = true;
  }

  /**
   * مسح جميع أنواع التخزين المؤقت المحددة في الخيارات
   */
  public clearAllCaches(): void {
    if (this.options.cacheStorage) {
      this.clearCacheStorage();
    }

    if (this.options.serviceWorker) {
      this.unregisterServiceWorkers();
    }

    if (this.options.appCache && 'applicationCache' in window) {
      // طريقة قديمة لمسح تخزين التطبيق المؤقت
      try {
        // @ts-ignore - كود لدعم المتصفحات القديمة
        window.applicationCache.swapCache();
      } catch (e) {
        // تجاهل الأخطاء لأن هذه الميزة مهملة
      }
    }

    if (this.options.localStorage) {
      // حفظ بعض القيم المهمة
      const lang = localStorage.getItem('lang');
      const token = localStorage.getItem('auth_token');
      
      localStorage.clear();
      
      // استعادة القيم المهمة
      if (lang) localStorage.setItem('lang', lang);
      if (token) localStorage.setItem('auth_token', token);
      localStorage.setItem(this.VERSION_KEY, this.currentVersion);
    }

    if (this.options.sessionStorage) {
      sessionStorage.clear();
    }

    // حذف الكوكيز المرتبطة بالتخزين المؤقت
    this.clearCacheCookies();

    // محاولة تحديث الأصول المحلية
    this.refreshAssets();
  }

  /**
   * مسح التخزين المؤقت باستخدام Cache API
   */
  private async clearCacheStorage(): Promise<void> {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('🧹 تم مسح Cache Storage');
      } catch (e) {
        console.error('❌ خطأ في مسح Cache Storage:', e);
      }
    }
  }

  /**
   * إلغاء تسجيل Service Workers
   */
  private async unregisterServiceWorkers(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(registration => registration.unregister())
        );
        console.log('🧹 تم إلغاء تسجيل Service Workers');
      } catch (e) {
        console.error('❌ خطأ في إلغاء تسجيل Service Workers:', e);
      }
    }
  }

  /**
   * مسح الكوكيز المرتبطة بالتخزين المؤقت
   */
  private clearCacheCookies(): void {
    const cookies = document.cookie.split(';');
    
    for (const cookie of cookies) {
      const cookieName = cookie.split('=')[0].trim();
      
      // حذف الكوكيز المرتبطة بالتخزين المؤقت فقط
      if (cookieName.includes('cache') || cookieName.includes('CACHE')) {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      }
    }
  }

  /**
   * محاولة تحديث الأصول المحلية عن طريق إضافة علامة زمنية للروابط
   */
  private refreshAssets(): void {
    // تطبيق طريقة بسيطة لتحديث الأصول المحلية من خلال إضافة بارامتر إلى الروابط
    const timestamp = new Date().getTime();
    
    const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
    const scriptElements = document.querySelectorAll('script[src]');
    const imageElements = document.querySelectorAll('img[src]');
    
    // تحديث ملفات CSS
    linkElements.forEach(link => {
      if (link.getAttribute('href') && !link.getAttribute('href')?.includes('fonts.googleapis')) {
        const href = link.getAttribute('href')?.split('?')[0];
        if (href) link.setAttribute('href', `${href}?v=${timestamp}`);
      }
    });
    
    // تحديث ملفات JavaScript
    scriptElements.forEach(script => {
      if (script.getAttribute('src')) {
        const src = script.getAttribute('src')?.split('?')[0];
        if (src) script.setAttribute('src', `${src}?v=${timestamp}`);
      }
    });
    
    // تحديث الصور من الخادم المحلي (وليس الصور الخارجية)
    imageElements.forEach(img => {
      const src = img.getAttribute('src');
      if (src && !src.includes('http') && !src.includes('data:')) {
        img.setAttribute('src', `${src.split('?')[0]}?v=${timestamp}`);
      }
    });
  }

  /**
   * مسح التخزين المؤقت يدوياً
   */
  public forceClearCache(): void {
    this.clearAllCaches();
    window.location.reload();
  }

  /**
   * إعداد مسح التخزين المؤقت لنموذج Progressive Web App
   */
  public setupPWACacheBuster(): void {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          // التحقق من النسخة الحالية مقابل النسخة المخزنة
          const storedVersion = localStorage.getItem(this.VERSION_KEY);
          
          if (!storedVersion || storedVersion !== this.currentVersion) {
            // إلغاء تسجيل Service Workers إذا تغيرت النسخة
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(
              registrations.map(registration => registration.unregister())
            );
            
            // تحديث النسخة المخزنة
            localStorage.setItem(this.VERSION_KEY, this.currentVersion);
            
            // إعادة تحميل الصفحة لتطبيق التغييرات
            window.location.reload();
          }
        } catch (e) {
          console.error('❌ خطأ في إعداد PWA Cache Buster:', e);
        }
      });
    }
  }
}

// تصدير نسخة واحدة للاستخدام في جميع أنحاء التطبيق
const cacheCleaner = new CacheCleaner({
  cacheStorage: true,
  serviceWorker: true,
  appCache: true,
  localStorage: false, // لا نريد مسح localStorage تلقائياً لأنها تحتوي على بيانات المستخدم
  sessionStorage: false, // لا نريد مسح sessionStorage تلقائياً لنفس السبب
  clearOn: 'both'
});

export default cacheCleaner;
