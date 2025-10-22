# 🎯 دليل اختبار لوحة التحكم الشامل
# Comprehensive Admin Dashboard Testing Guide

## 🚀 البدء السريع / Quick Start

### 1. تشغيل الخادم / Start Backend Server
```bash
cd maison-darin-backend
npm run dev
# الخادم يعمل على localhost:5000
```

### 2. تشغيل الواجهة الأمامية / Start Frontend
```bash
cd maison-darin-luxury-beauty
npm run dev
# الواجهة تعمل على localhost:5173
```

### 3. اختبار سريع من سطر الأوامر / Quick Command Line Test
```bash
npm run test:admin
```

## 🧪 طرق الاختبار المختلفة / Different Testing Methods

### 1️⃣ اختبار من سطر الأوامر / Command Line Testing

#### اختبار سريع / Quick Test (30 ثانية)
```bash
npm run test:admin
```
يختبر:
- الاتصال بالخادم
- تسجيل الدخول
- قراءة المنتجات والطلبات
- لوحة التحكم

#### اختبار شامل / Full Test (2-3 دقائق)
```bash
npm run test:admin:full
```
يختبر كل شيء + عمليات الإنشاء والتحديث

#### مساعدة / Help
```bash
npm run test:admin:help
```

### 2️⃣ اختبار من لوحة التحكم / Dashboard Testing

1. اذهب إلى: `http://localhost:5173/admin/login`
2. سجل دخول بالبيانات:
   - **Email:** `admin@maisondarin.com`
   - **Password:** `Admin123456#`
3. اذهب إلى تبويب "اختبار شامل" / "Full System Test"
4. اضغط "اختبار سريع" أو "اختبار شامل"

### 3️⃣ اختبار من كونسول المتصفح / Browser Console Testing

افتح Developer Tools واكتب:
```javascript
// اختبار شامل
runAdminTest()

// اختبار سريع  
runQuickAdminTest()
```

## 📋 قائمة الاختبارات الشاملة / Comprehensive Test Checklist

### ✅ اختبارات الأساسيات / Basic Tests
- [ ] **الاتصال بالخادم** - `GET /health`
- [ ] **إعدادات API** - التحقق من `VITE_API_URL`
- [ ] **المصادقة** - تسجيل دخول المسؤول

### ✅ اختبارات المنتجات / Product Tests
- [ ] **قراءة المنتجات** - `GET /api/products`
- [ ] **إنشاء منتج** - `POST /api/products`
- [ ] **تحديث منتج** - `PUT /api/products/:id`
- [ ] **البحث في المنتجات** - `GET /api/products?search=...`
- [ ] **فلترة المنتجات** - `GET /api/products?category=...`
- [ ] **قراءة الفئات** - `GET /api/categories/active`
- [ ] **إحصائيات الفئات** - `GET /api/products/categories/stats`

### ✅ اختبارات الطلبات / Order Tests  
- [ ] **قراءة الطلبات** - `GET /api/orders`
- [ ] **إحصائيات الطلبات** - `GET /api/orders/stats`
- [ ] **الطلبات الأخيرة** - `GET /api/orders?sortBy=createdAt&limit=5`
- [ ] **تحديث حالة الطلب** - `PUT /api/orders/:id/status`

### ✅ اختبارات لوحة التحكم / Dashboard Tests
- [ ] **إحصائيات لوحة التحكم** - `GET /api/admin/dashboard`
- [ ] **نظرة عامة** - `GET /api/admin/dashboard/overview`
- [ ] **الطلبات الأخيرة** - `GET /api/admin/dashboard/recent-orders`

## 🔍 فحص مفصل للوظائف / Detailed Function Testing

### 1. إدارة المنتجات / Products Management

#### ✅ قراءة المنتجات / Read Products
```javascript
// من الكونسول
fetch('/api/products?limit=5', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
})
.then(r => r.json())
.then(console.log)
```

#### ✅ إنشاء منتج / Create Product
```javascript
const testProduct = {
  name: { en: 'Test Product', ar: 'منتج تجريبي' },
  description: { en: 'Test description', ar: 'وصف تجريبي' },
  price: 99.99,
  size: '50ml',
  category: 'floral',
  stock: 10,
  inStock: true
};

fetch('/api/products', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(testProduct)
})
.then(r => r.json())
.then(console.log)
```

### 2. إدارة الطلبات / Orders Management

#### ✅ قراءة الطلبات / Read Orders
```javascript
fetch('/api/orders?limit=5', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
})
.then(r => r.json())
.then(console.log)
```

#### ✅ تحديث حالة الطلب / Update Order Status
```javascript
// احصل على معرف طلب أولاً
const orderId = 'ORDER_ID_HERE';
fetch(`/api/orders/${orderId}/status`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ status: 'confirmed', statusType: 'order' })
})
.then(r => r.json())
.then(console.log)
```

## 🚨 استكشاف الأخطاء / Troubleshooting

### مشكلة: خطأ في الاتصال / Connection Error
```
❌ Server connection failed: connect ECONNREFUSED 127.0.0.1:5000
```
**الحل:**
1. تأكد من تشغيل الخادم: `cd maison-darin-backend && npm run dev`
2. تحقق من المنفذ في `.env`: `VITE_API_URL=http://localhost:5000/api`

### مشكلة: خطأ في المصادقة / Authentication Error
```
❌ Login failed: Invalid credentials
```
**الحل:**
1. تأكد من البيانات: `admin@maisondarin.com` / `Admin123456#`
2. تحقق من وجود المستخدم في قاعدة البيانات
3. تأكد من تشغيل MongoDB

### مشكلة: خطأ في قاعدة البيانات / Database Error
```
❌ Products test failed: Database connection error
```
**الحل:**
1. تشغيل MongoDB: `mongod` أو `brew services start mongodb-community`
2. تحقق من إعدادات قاعدة البيانات في `maison-darin-backend/config/database.js`

### مشكلة: خطأ CORS / CORS Error
```
❌ Access to fetch blocked by CORS policy
```
**الحل:**
1. تحقق من إعدادات CORS في الخادم
2. تأكد من أن Frontend و Backend يعملان على المنافذ الصحيحة

## 📊 تفسير النتائج / Interpreting Results

### ✅ نتيجة ناجحة / Successful Result
```
✅ Products - Read - Passed in 245ms
   Data: { totalProducts: 15, pagination: {...} }
```

### ❌ نتيجة فاشلة / Failed Result  
```
❌ Products - Read - Failed: Unauthorized
   Error: No valid authentication token
```

### ⚠️ تحذير / Warning
```
⚠️ Products - Create - Warning: Slow response time
   Duration: 3500ms (threshold: 2000ms)
```

## 🎯 معايير النجاح / Success Criteria

### اختبار سريع / Quick Test
- **الهدف:** 100% نجاح في الاختبارات الأساسية
- **الوقت المتوقع:** < 30 ثانية
- **الاختبارات:** 4 اختبارات أساسية

### اختبار شامل / Full Test  
- **الهدف:** > 90% نجاح في جميع الاختبارات
- **الوقت المتوقع:** 1-3 دقائق
- **الاختبارات:** 15+ اختبار شامل

## 📈 تحسين الأداء / Performance Optimization

### زمن الاستجابة المقبول / Acceptable Response Times
- **قراءة البيانات:** < 500ms
- **إنشاء/تحديث:** < 1000ms  
- **عمليات معقدة:** < 2000ms

### نصائح التحسين / Optimization Tips
1. **فهرسة قاعدة البيانات** - تأكد من وجود فهارس على الحقول المستخدمة في البحث
2. **تخزين مؤقت** - استخدم Redis للبيانات المتكررة
3. **ضغط الاستجابات** - فعّل gzip compression
4. **تحسين الاستعلامات** - استخدم projection لتقليل البيانات المُرسلة

## 🔄 الاختبار المستمر / Continuous Testing

### اختبار يومي / Daily Testing
```bash
# إضافة إلى crontab للاختبار اليومي
0 9 * * * cd /path/to/project && npm run test:admin
```

### اختبار قبل النشر / Pre-deployment Testing
```bash
# سكريبت ما قبل النشر
npm run test:admin:full
if [ $? -eq 0 ]; then
  echo "✅ All tests passed, ready to deploy"
  npm run build
else
  echo "❌ Tests failed, deployment cancelled"
  exit 1
fi
```

## 📞 الدعم والمساعدة / Support & Help

### 🔗 روابط مفيدة / Useful Links
- **Frontend:** http://localhost:5173/admin
- **Backend API:** http://localhost:5000/api
- **API Documentation:** http://localhost:5000/api-docs (إذا كان متوفراً)

### 📧 بيانات الاتصال / Contact Information
- **المطور:** Maison Darin Development Team
- **البريد الإلكتروني:** admin@maisondarin.com

### 🆘 الحصول على المساعدة / Getting Help
1. تحقق من هذا الدليل أولاً
2. راجع ملفات السجل (logs) في الخادم
3. استخدم Developer Tools في المتصفح
4. تشغيل الاختبار التشخيصي: `npm run test:admin:full`

---

**آخر تحديث / Last Updated:** 2024  
**الإصدار / Version:** 1.0.0  
**الحالة / Status:** ✅ جاهز للاستخدام / Ready for Production
