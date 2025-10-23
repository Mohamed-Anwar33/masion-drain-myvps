/**
 * CacheManager
 * 
 * وظيفة هذا الملف هي إدارة التخزين المؤقت للمتصفح بشكل يدوي
 * يتم استخدامه للتأكد من تحميل أحدث الأصول دائمًا
 */

interface CacheManagerOptions {
  cacheBusterParam?: string;
  forceReload?: boolean;
  clearLocalStorage?: boolean;
  clearSessionStorage?: boolean;
  clearCookies?: boolean;
  reloadAfterClear?: boolean;
}

/**
 * مدير التخزين المؤقت - يمكن استدعاؤه من أي مكان في التطبيق
 */
class CacheManager {
  private readonly VERSION_KEY = 'maison_darin_app_version';
  private readonly CACHE_TIMESTAMP_KEY = 'maison_darin_cache_timestamp';
  private readonly CACHE_BUSTING_KEY = 'v';
  private readonly COOKIE_EXPIRY_DAYS = 30;

  constructor() {
    // يتم تسجيل مستمع الأحداث لتنظيف التخزين المؤقت عند إعادة تحميل الصفحة
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.setCacheTimestamp();
      });

      // إضافة معلمة التخزين المؤقت لجميع الروابط
      this.addCacheBustingToLinks();
    }
  }

  /**
   * تنظيف التخزين المؤقت للمتصفح بناءً على الخيارات المحددة
   */
  public clearBrowserCache(options: CacheManagerOptions = {}): void {
    const defaultOptions: CacheManagerOptions = {
      cacheBusterParam: this.CACHE_BUSTING_KEY,
      forceReload: false,
      clearLocalStorage: false,
      clearSessionStorage: false,
      clearCookies: false,
      reloadAfterClear: false
    };

    const opts = { ...defaultOptions, ...options };

    try {
      // حفظ البيانات المهمة التي نريد الاحتفاظ بها
      const token = localStorage.getItem('auth_token');
      const lang = localStorage.getItem('lang');
      const theme = localStorage.getItem('theme');

      // مسح التخزين المحلي إذا تم اختيار ذلك
      if (opts.clearLocalStorage) {
        localStorage.clear();
        
        // استعادة البيانات المهمة
        if (token) localStorage.setItem('auth_token', token);
        if (lang) localStorage.setItem('lang', lang);
        if (theme) localStorage.setItem('theme', theme);
      }

      // مسح تخزين الجلسة إذا تم اختيار ذلك
      if (opts.clearSessionStorage) {
        sessionStorage.clear();
      }

      // مسح الكوكيز إذا تم اختيار ذلك
      if (opts.clearCookies) {
        this.clearAllCookies();
      }

      // تحديث طابع الوقت للتخزين المؤقت
      this.setCacheTimestamp();

      // مسح ذاكرة التخزين المؤقت للصور والأصول
      this.clearImageCache();

      // تحديث أرقام نسخ الأصول على الصفحة
      this.refreshAssets(opts.cacheBusterParam || this.CACHE_BUSTING_KEY);

      console.log('✅ تم تنظيف التخزين المؤقت للمتصفح بنجاح');

      // إعادة تحميل الصفحة إذا تم اختيار ذلك
      if (opts.reloadAfterClear || opts.forceReload) {
        window.location.reload();
      }
    } catch (error) {
      console.error('❌ خطأ أثناء مسح التخزين المؤقت للمتصفح:', error);
    }
  }

  /**
   * تحديث جميع الأصول على الصفحة بمعلمة التخزين المؤقت الجديدة
   */
  public refreshAssets(paramName: string = this.CACHE_BUSTING_KEY): void {
    const timestamp = new Date().getTime();
    
    // تحديث ملفات CSS
    document.querySelectorAll('link[rel="stylesheet"]').forEach((linkEl) => {
      const link = linkEl as HTMLLinkElement;
      if (link.href && !link.href.includes('fonts.googleapis')) {
        link.href = this.addOrUpdateQueryParam(link.href, paramName, timestamp.toString());
      }
    });
    
    // تحديث ملفات JavaScript
    document.querySelectorAll('script[src]').forEach((scriptEl) => {
      const script = scriptEl as HTMLScriptElement;
      if (script.src && script.src.includes(window.location.origin)) {
        const newSrc = this.addOrUpdateQueryParam(script.src, paramName, timestamp.toString());
        
        // لا يمكن تحديث src مباشرة، لذلك نستبدل العنصر
        if (script.src !== newSrc) {
          const newScript = document.createElement('script');
          Array.from(script.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
          });
          newScript.src = newSrc;
          script.parentNode?.replaceChild(newScript, script);
        }
      }
    });
    
    // تحديث الصور
    document.querySelectorAll('img[src]').forEach((imgEl) => {
      const img = imgEl as HTMLImageElement;
      if (img.src && !img.src.includes('data:') && img.src.includes(window.location.origin)) {
        img.src = this.addOrUpdateQueryParam(img.src, paramName, timestamp.toString());
      }
    });
  }

  /**
   * إضافة معلمة التخزين المؤقت إلى كل روابط الصفحة
   */
  private addCacheBustingToLinks(): void {
    // إضافة معلمة التخزين المؤقت لجميع الروابط عند النقر عليها
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href && link.href.startsWith(window.location.origin) && 
          !link.href.includes('#') && !link.getAttribute('data-no-cache-busting')) {
        
        // التحقق من أن هذا ليس رابط تحميل
        const download = link.getAttribute('download');
        if (!download) {
          // منع السلوك الافتراضي
          event.preventDefault();
          
          // إضافة معلمة التخزين المؤقت إلى الرابط
          const cacheBustedUrl = this.addOrUpdateQueryParam(
            link.href, 
            this.CACHE_BUSTING_KEY, 
            new Date().getTime().toString()
          );
          
          // الانتقال إلى الرابط الجديد
          window.location.href = cacheBustedUrl;
        }
      }
    });
  }

  /**
   * إضافة أو تحديث معلمة في عنوان URL
   */
  private addOrUpdateQueryParam(url: string, param: string, value: string): string {
    const urlObj = new URL(url);
    urlObj.searchParams.set(param, value);
    return urlObj.toString();
  }

  /**
   * مسح جميع الكوكيز باستثناء الكوكيز المهمة
   */
  private clearAllCookies(): void {
    const cookies = document.cookie.split(";");
    const importantCookies = ['auth_token', 'lang', 'theme'];
    
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
      
      // عدم حذف الكوكيز المهمة
      if (!importantCookies.includes(name)) {
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;";
      }
    }
  }

  /**
   * مسح ذاكرة التخزين المؤقت للصور
   */
  private clearImageCache(): void {
    // محاولة مسح ذاكرة التخزين المؤقت للصور عن طريق إعادة تحميل الصور بمعلمة جديدة
    const images = document.querySelectorAll('img');
    images.forEach((img: HTMLImageElement) => {
      if (img.src && !img.src.startsWith('data:') && !img.src.includes('?') && img.complete) {
        img.src = img.src + '?t=' + new Date().getTime();
      }
    });
  }

  /**
   * تعيين طابع زمني للتخزين المؤقت
   */
  private setCacheTimestamp(): void {
    localStorage.setItem(this.CACHE_TIMESTAMP_KEY, new Date().toISOString());
  }

  /**
   * التحقق مما إذا كان التخزين المؤقت منتهي الصلاحية
   * يمكن استخدامه لتحديد متى يجب تنظيف التخزين المؤقت
   */
  public isCacheExpired(maxAgeInHours: number = 24): boolean {
    const cachedTimestamp = localStorage.getItem(this.CACHE_TIMESTAMP_KEY);
    
    if (!cachedTimestamp) {
      return true;
    }
    
    const cachedDate = new Date(cachedTimestamp);
    const currentDate = new Date();
    const diffInHours = (currentDate.getTime() - cachedDate.getTime()) / (1000 * 60 * 60);
    
    return diffInHours > maxAgeInHours;
  }

  /**
   * مسح التخزين المؤقت للمتصفح في متصفح Chrome باستخدام API الخاصة بـ Chrome
   * تعمل فقط في متصفح Chrome
   */
  public clearChromeCache(): void {
    // التحقق مما إذا كان هذا متصفح Chrome
    const isChrome = navigator.userAgent.indexOf("Chrome") !== -1;
    
    if (isChrome) {
      console.log('🧹 جاري محاولة مسح التخزين المؤقت الخاص بمتصفح Chrome...');
      
      // إعادة تحميل الصفحة مع إجبار مسح التخزين المؤقت
      const reloadOptions = {
        bypassCache: true,
        hardReload: true
      };
      
      try {
        // @ts-ignore - هذا API غير قياسي وموجود فقط في Chrome
        if (window.location.reload && reloadOptions) {
          // @ts-ignore
          window.location.reload(reloadOptions);
        } else {
          // استخدم هذا الحل البديل إذا كان API غير مدعوم
          window.location.reload();
        }
      } catch (e) {
        // إذا فشلت المحاولة، نستخدم الطريقة التقليدية
        window.location.reload();
      }
    } else {
      // إذا لم يكن Chrome، استخدم الطريقة العادية
      this.clearBrowserCache({ forceReload: true });
    }
  }

  /**
   * التحقق من وجود تحديث وتنظيف التخزين المؤقت إذا لزم الأمر
   * يمكن استدعاء هذه الوظيفة عند بدء التطبيق
   */
  public checkForUpdates(): void {
    const currentVersion = import.meta.env.VITE_APP_VERSION || new Date().toISOString().split('T')[0];
    const storedVersion = localStorage.getItem(this.VERSION_KEY);
    
    // إذا كانت النسخة مختلفة، قم بتنظيف التخزين المؤقت
    if (!storedVersion || storedVersion !== currentVersion) {
      console.log('🔄 تم اكتشاف إصدار جديد! جاري مسح التخزين المؤقت...');
      
      // تنظيف التخزين المؤقت مع خيارات أكثر شمولاً للتحديث
      this.clearBrowserCache({
        clearLocalStorage: true,
        clearSessionStorage: true,
        clearCookies: false, // عادة لا نحذف الكوكيز مع التحديثات
        reloadAfterClear: false
      });
      
      // حفظ النسخة الجديدة
      localStorage.setItem(this.VERSION_KEY, currentVersion);
    }
  }
}

// تصدير نسخة واحدة من الفئة للاستخدام في التطبيق
const cacheManager = new CacheManager();
export default cacheManager;
