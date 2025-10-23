// Cache Cleaner Service Worker
// يقوم هذا العامل الخدمي (Service Worker) بمسح التخزين المؤقت للمتصفح
// ويساعد في ضمان أن المستخدمين يرون دائمًا أحدث إصدار من الموقع

// إصدار التخزين المؤقت - قم بتغييره عند كل نشر جديد
const CACHE_VERSION = 'v1.0.1-' + new Date().toISOString().split('T')[0];

// اسم التخزين المؤقت
const CACHE_NAME = 'maison-darin-cache-' + CACHE_VERSION;

// الموارد التي لا ينبغي تخزينها مؤقتًا
const EXCLUDE_FROM_CACHE = [
  '/api/',
  'analytics',
  'sockjs-node'
];

// عند تثبيت Service Worker
self.addEventListener('install', event => {
  console.log('🔧 تم تثبيت Service Worker', CACHE_VERSION);
  
  // تخطي مرحلة الانتظار والانتقال مباشرة إلى التفعيل
  event.waitUntil(self.skipWaiting());
});

// عند تفعيل Service Worker
self.addEventListener('activate', event => {
  console.log('🚀 تم تفعيل Service Worker', CACHE_VERSION);

  // حذف جميع التخزينات المؤقتة القديمة
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName.includes('maison-darin-cache')) {
            console.log('🧹 جاري حذف التخزين المؤقت القديم:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ تم مسح التخزين المؤقت القديم بنجاح!');
      // أخذ السيطرة على العملاء بدون إعادة تحميل
      return self.clients.claim();
    })
  );
});

// التعامل مع طلبات الشبكة
self.addEventListener('fetch', event => {
  // تجاهل الطلبات غير GET
  if (event.request.method !== 'GET') return;
  
  // تجاهل الطلبات المستثناة
  const url = new URL(event.request.url);
  if (EXCLUDE_FROM_CACHE.some(item => url.pathname.includes(item))) {
    return;
  }

  // استراتيجية "الشبكة أولاً ثم التخزين المؤقت"
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // نسخة من الاستجابة للتخزين في الكاش
        const responseClone = response.clone();
        
        // تخزين الاستجابة في الكاش إذا كانت ناجحة
        if (response.status === 200) {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        
        return response;
      })
      .catch(() => {
        // عند فشل الشبكة، محاولة استرداد من التخزين المؤقت
        return caches.match(event.request);
      })
  );
});

// استقبال رسائل من صفحة الويب
self.addEventListener('message', event => {
  if (event.data && event.data.action === 'clearCache') {
    console.log('🧹 تم استلام طلب لمسح التخزين المؤقت');
    
    // مسح كل التخزين المؤقت
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName.includes('maison-darin')) {
              return caches.delete(cacheName);
            }
          })
        );
      }).then(() => {
        // إرسال رسالة تأكيد إلى الصفحة
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              action: 'cacheCleared',
              timestamp: new Date().toISOString()
            });
          });
        });
      })
    );
  }
});

// معالجة التحديثات عند وجود تحديثات جديدة
self.addEventListener('updatefound', () => {
  console.log('🔄 تم العثور على تحديث جديد للـ Service Worker');
});

// إرسال رسالة للتأكيد على الجاهزية
self.addEventListener('message', event => {
  if (event.data && event.data.action === 'checkActivation') {
    event.source.postMessage({
      action: 'serviceWorkerActive',
      version: CACHE_VERSION
    });
  }
});
