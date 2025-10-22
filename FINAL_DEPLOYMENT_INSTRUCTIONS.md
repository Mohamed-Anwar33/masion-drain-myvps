# تعليمات النشر النهائية - موقع ميزون دارين

## 🎯 ملخص سريع للنشر

### معلومات السيرفر:
- **IP**: 72.61.154.149
- **Domain**: https://maisondarin.com
- **SSH**: `ssh root@72.61.154.149`

### خطوات النشر السريع:

```bash
# 1. جعل سكريبت النشر قابل للتنفيذ
chmod +x deploy.sh

# 2. تشغيل النشر التلقائي
./deploy.sh production

# 3. اختبار النظام
chmod +x test-deployment.sh
./test-deployment.sh production
```

---

## 📋 قائمة مراجعة ما قبل النشر

### ✅ تم إنجازه:
- [x] **متغيرات البيئة للإنتاج** - `.env.production` للباك إند والفرونت إند
- [x] **إعدادات CORS** - تحديث للدومين الجديد `maisondarin.com`
- [x] **ملفات Docker** - Dockerfile للباك إند والفرونت إند + docker-compose.yml
- [x] **سكريبت النشر** - `deploy.sh` للنشر التلقائي
- [x] **سكريبت الاختبار** - `test-deployment.sh` للفحص الشامل
- [x] **إعدادات PayPal** - دعم بيئات متعددة (sandbox/live)
- [x] **قاعدة البيانات** - MongoDB Atlas مع جميع البيانات
- [x] **نظام الإيميلات** - Gmail SMTP مُعد ومُختبر
- [x] **إدارة الصور** - Cloudinary مُعد ويعمل
- [x] **نظام تحويل العملات** - SAR إلى USD للـ PayPal

### 🔧 يحتاج إعداد على السيرفر:
- [ ] **تثبيت Docker & Docker Compose**
- [ ] **إعداد SSL Certificate** (Let's Encrypt)
- [ ] **إعداد Firewall** (UFW)
- [ ] **تكوين PayPal للإنتاج** (Live Environment)

---

## 🚀 خطوات النشر التفصيلية

### 1. تحضير السيرفر:

```bash
# الاتصال بالسيرفر
ssh root@72.61.154.149

# تحديث النظام
apt update && apt upgrade -y

# تثبيت Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# تثبيت Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# تثبيت أدوات إضافية
apt install -y git curl wget nginx certbot
```

### 2. إعداد الجدار الناري:

```bash
# تفعيل UFW
ufw enable

# السماح بالاتصالات الأساسية
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS

# فحص الحالة
ufw status
```

### 3. نشر المشروع:

```bash
# على الجهاز المحلي - تشغيل النشر
./deploy.sh production

# أو النشر اليدوي:
# رفع الملفات
scp -r maison-darin-backend maison-darin-luxury-beauty docker-compose.yml root@72.61.154.149:/opt/maison-darin/

# على السيرفر
ssh root@72.61.154.149
cd /opt/maison-darin
docker-compose up -d --build
```

### 4. إعداد SSL:

```bash
# على السيرفر
certbot certonly --standalone -d maisondarin.com -d www.maisondarin.com

# إعداد التجديد التلقائي
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
```

### 5. اختبار النظام:

```bash
# على الجهاز المحلي
./test-deployment.sh production

# أو اختبار يدوي:
curl https://maisondarin.com/health
curl https://maisondarin.com/api/status/health
```

---

## 🔧 إعدادات ما بعد النشر

### 1. إعداد PayPal للإنتاج:

1. **إنشاء تطبيق PayPal Live**:
   - الذهاب إلى: https://developer.paypal.com/
   - إنشاء تطبيق جديد للإنتاج
   - الحصول على Live Client ID و Client Secret

2. **تحديث الإعدادات في لوحة التحكم**:
   - الدخول إلى: https://maisondarin.com/admin
   - إعدادات PayPal > تبديل إلى "Live"
   - إدخال بيانات الإنتاج

3. **إعداد Webhook URLs**:
   ```
   Return URL: https://maisondarin.com/paypal/return
   Cancel URL: https://maisondarin.com/paypal/cancel
   Webhook URL: https://maisondarin.com/api/paypal/webhook
   ```

### 2. فحص الإعدادات:

```bash
# فحص حالة الحاويات
docker-compose ps

# فحص السجلات
docker-compose logs -f

# فحص استخدام الموارد
docker stats

# فحص الصحة
curl https://maisondarin.com/health
curl https://maisondarin.com/api/status/health
```

### 3. إعداد المراقبة:

```bash
# إنشاء سكريبت المراقبة
cat > /opt/monitor.sh << 'EOF'
#!/bin/bash
if ! curl -f -s https://maisondarin.com/health > /dev/null; then
    echo "Website down! Restarting containers..."
    cd /opt/maison-darin
    docker-compose restart
fi
EOF

chmod +x /opt/monitor.sh

# إضافة للـ crontab (فحص كل 5 دقائق)
echo "*/5 * * * * /opt/monitor.sh" | crontab -
```

---

## 📊 معلومات النظام

### بيانات الدخول:
- **Admin Email**: admin@maisondarin.com
- **Admin Password**: Admin123456#
- **Database**: MongoDB Atlas (مُعد مسبقاً)
- **Email**: maisondarin2025@gmail.com
- **Email App Password**: cnzs qjfg mxzg pkmb

### URLs المهمة:
- **الموقع الرئيسي**: https://maisondarin.com
- **لوحة التحكم**: https://maisondarin.com/admin
- **API Health**: https://maisondarin.com/api/status/health
- **Frontend Health**: https://maisondarin.com/health

### الخدمات المُعدة:
- ✅ **MongoDB Atlas** - قاعدة البيانات السحابية
- ✅ **Cloudinary** - إدارة الصور
- ✅ **Gmail SMTP** - نظام الإيميلات
- ✅ **PayPal API** - نظام الدفع (يحتاج إعداد Live)
- ✅ **Currency API** - تحويل العملات

---

## 🛠️ استكشاف الأخطاء

### مشاكل شائعة وحلولها:

#### 1. فشل في الاتصال بقاعدة البيانات:
```bash
# فحص متغيرات البيئة
docker exec maison-darin-backend env | grep MONGODB

# اختبار الاتصال
docker exec maison-darin-backend node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected'))
  .catch(err => console.log('❌ Error:', err.message));
"
```

#### 2. مشاكل في رفع الصور:
```bash
# فحص إعدادات Cloudinary
docker exec maison-darin-backend env | grep CLOUDINARY

# اختبار رفع صورة
curl -X POST https://maisondarin.com/api/media/upload \
  -H "Authorization: Bearer <TOKEN>" \
  -F "image=@test.jpg"
```

#### 3. مشاكل PayPal:
```bash
# فحص إعدادات PayPal
curl https://maisondarin.com/api/paypal/settings \
  -H "Authorization: Bearer <TOKEN>"

# اختبار تحويل العملة
curl https://maisondarin.com/api/paypal/currency-rates
```

#### 4. مشاكل الإيميل:
```bash
# اختبار إرسال إيميل
curl -X POST https://maisondarin.com/api/site-settings/email/test \
  -H "Authorization: Bearer <TOKEN>"
```

### سجلات النظام:
```bash
# سجلات جميع الحاويات
docker-compose logs

# سجلات الباك إند فقط
docker-compose logs backend

# سجلات الفرونت إند فقط
docker-compose logs frontend

# متابعة السجلات المباشرة
docker-compose logs -f
```

---

## 🔄 التحديثات المستقبلية

### تحديث الكود:
```bash
# على الجهاز المحلي
git pull origin main
./deploy.sh production

# أو على السيرفر مباشرة
cd /opt/maison-darin
git pull origin main
docker-compose up -d --build
```

### النسخ الاحتياطي:
```bash
# نسخ احتياطي للصور المرفوعة
docker exec maison-darin-backend tar -czf /tmp/uploads-backup.tar.gz /app/uploads
docker cp maison-darin-backend:/tmp/uploads-backup.tar.gz ./uploads-backup-$(date +%Y%m%d).tar.gz

# MongoDB Atlas يوفر نسخ احتياطية تلقائية
```

---

## 📞 الدعم والتواصل

### في حالة المشاكل:
1. **فحص السجلات**: `docker-compose logs`
2. **إعادة تشغيل**: `docker-compose restart`
3. **فحص الصحة**: تشغيل `./test-deployment.sh`
4. **التواصل**: maisondarin2025@gmail.com

### معلومات مهمة:
- **جميع كلمات المرور** محفوظة في ملفات `.env.production`
- **قاعدة البيانات** في MongoDB Atlas (آمنة ومحمية)
- **الصور** في Cloudinary (نسخ احتياطي تلقائي)
- **الإيميلات** تعمل عبر Gmail SMTP

---

## ✅ التحقق النهائي

بعد النشر، تأكد من:

- [ ] **الموقع يعمل**: https://maisondarin.com
- [ ] **لوحة التحكم تعمل**: https://maisondarin.com/admin
- [ ] **تسجيل الدخول يعمل**: admin@maisondarin.com
- [ ] **المنتجات تظهر**: صفحة المنتجات
- [ ] **الصور تعمل**: صور المنتجات والصفحة الرئيسية
- [ ] **نموذج الاتصال يعمل**: إرسال رسالة تجريبية
- [ ] **PayPal مُعد**: (يحتاج إعداد Live بعد النشر)
- [ ] **SSL يعمل**: شهادة أمان صحيحة
- [ ] **سرعة الموقع جيدة**: تحميل سريع

---

## 🎉 تهانينا!

**موقع ميزون دارين جاهز للعمل!** 🚀

- 🌐 **الموقع**: https://maisondarin.com
- 🛡️ **لوحة التحكم**: https://maisondarin.com/admin
- 📧 **البريد الإلكتروني**: maisondarin2025@gmail.com

**المشروع مُعد بأحدث التقنيات ويوفر تجربة استثنائية للعملاء!** ✨
