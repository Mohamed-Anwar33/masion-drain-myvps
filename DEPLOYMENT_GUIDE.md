# دليل النشر - موقع ميزون دارين

## معلومات السيرفر
- **IP**: 72.61.154.149
- **Domain**: https://maisondarin.com
- **SSH**: `ssh root@72.61.154.149`

## متطلبات النشر

### على السيرفر:
```bash
# تثبيت Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# تثبيت Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# تثبيت Node.js (للأدوات المساعدة)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# تثبيت Git
apt-get update && apt-get install -y git
```

## طرق النشر

### 1. النشر التلقائي (الموصى به)
```bash
# جعل سكريبت النشر قابل للتنفيذ
chmod +x deploy.sh

# تشغيل النشر
./deploy.sh production
```

### 2. النشر اليدوي

#### أ. رفع الملفات للسيرفر:
```bash
# ضغط المشروع
tar -czf maison-darin.tar.gz maison-darin-backend maison-darin-luxury-beauty docker-compose.yml

# رفع للسيرفر
scp maison-darin.tar.gz root@72.61.154.149:/opt/

# الدخول للسيرفر
ssh root@72.61.154.149
```

#### ب. على السيرفر:
```bash
# إنشاء مجلد المشروع
mkdir -p /opt/maison-darin
cd /opt/maison-darin

# استخراج الملفات
tar -xzf /opt/maison-darin.tar.gz

# بناء وتشغيل الحاويات
docker-compose build
docker-compose up -d

# فحص الحالة
docker-compose ps
docker-compose logs
```

## إعداد SSL (اختياري)

### باستخدام Let's Encrypt:
```bash
# تثبيت Certbot
apt-get install -y certbot

# الحصول على شهادة SSL
certbot certonly --standalone -d maisondarin.com -d www.maisondarin.com

# إعداد التجديد التلقائي
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
```

### تحديث nginx.conf للـ SSL:
```nginx
server {
    listen 443 ssl http2;
    server_name maisondarin.com www.maisondarin.com;
    
    ssl_certificate /etc/letsencrypt/live/maisondarin.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/maisondarin.com/privkey.pem;
    
    # باقي الإعدادات...
}

server {
    listen 80;
    server_name maisondarin.com www.maisondarin.com;
    return 301 https://$server_name$request_uri;
}
```

## إعداد قاعدة البيانات

### MongoDB Atlas (الحالي):
- ✅ **مُعد بالفعل**: mongodb+srv://maisondarin:pjSZYpFRahUTeB81@cluster0.yanlxkn.mongodb.net/maison-darin
- ✅ **البيانات موجودة**: جميع المنتجات والطلبات والإعدادات

### تهيئة البيانات الأولية (إذا لزم الأمر):
```bash
# الدخول لحاوية الباك إند
docker exec -it maison-darin-backend bash

# تشغيل سكريبت التهيئة
npm run setup:email
npm run setup:paypal
npm run seed:users
```

## إعداد PayPal للإنتاج

### 1. إنشاء حساب PayPal Business
- الذهاب إلى: https://developer.paypal.com/
- إنشاء تطبيق جديد للإنتاج
- الحصول على Client ID و Client Secret

### 2. تحديث الإعدادات في لوحة التحكم:
- الدخول إلى: https://maisondarin.com/admin
- إعدادات PayPal > تبديل إلى "Live"
- إدخال بيانات الإنتاج

### 3. إعداد Webhook URLs:
```
Return URL: https://maisondarin.com/paypal/return
Cancel URL: https://maisondarin.com/paypal/cancel
Webhook URL: https://maisondarin.com/api/paypal/webhook
```

## مراقبة النظام

### فحص الحالة:
```bash
# حالة الحاويات
docker-compose ps

# سجلات النظام
docker-compose logs -f

# استخدام الموارد
docker stats

# فحص الصحة
curl https://maisondarin.com/health
curl https://maisondarin.com/api/status/health
```

### إعداد المراقبة التلقائية:
```bash
# إنشاء سكريبت المراقبة
cat > /opt/monitor.sh << 'EOF'
#!/bin/bash
if ! curl -f -s https://maisondarin.com/health > /dev/null; then
    echo "Website down! Restarting containers..."
    cd /opt/maison-darin
    docker-compose restart
    # إرسال تنبيه (اختياري)
    # curl -X POST "https://api.telegram.org/bot<TOKEN>/sendMessage" -d "chat_id=<CHAT_ID>&text=Maison Darin website restarted"
fi
EOF

chmod +x /opt/monitor.sh

# إضافة للـ crontab (فحص كل 5 دقائق)
echo "*/5 * * * * /opt/monitor.sh" | crontab -
```

## النسخ الاحتياطي

### نسخ احتياطي للبيانات:
```bash
# نسخ احتياطي لقاعدة البيانات (MongoDB Atlas يوفر نسخ تلقائية)
# نسخ احتياطي للصور المرفوعة
docker exec maison-darin-backend tar -czf /tmp/uploads-backup.tar.gz /app/uploads
docker cp maison-darin-backend:/tmp/uploads-backup.tar.gz ./uploads-backup-$(date +%Y%m%d).tar.gz

# نسخ احتياطي للإعدادات
docker exec maison-darin-backend node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);
// تصدير الإعدادات...
"
```

## استكشاف الأخطاء

### مشاكل شائعة:

#### 1. فشل في الاتصال بقاعدة البيانات:
```bash
# فحص متغيرات البيئة
docker exec maison-darin-backend env | grep MONGODB

# فحص الاتصال
docker exec maison-darin-backend node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected'))
  .catch(err => console.log('❌ Error:', err.message));
"
```

#### 2. مشاكل في الصور:
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
curl https://maisondarin.com/api/paypal/settings

# اختبار الاتصال
curl -X POST https://maisondarin.com/api/paypal/test
```

## التحديثات

### تحديث الكود:
```bash
# على الجهاز المحلي
git pull origin main
./deploy.sh production

# أو يدوياً على السيرفر
cd /opt/maison-darin
docker-compose pull
docker-compose up -d --build
```

### تحديث النظام:
```bash
# تحديث النظام
apt-get update && apt-get upgrade -y

# تحديث Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

## الأمان

### إعدادات الجدار الناري:
```bash
# تفعيل UFW
ufw enable

# السماح بـ SSH
ufw allow 22

# السماح بـ HTTP/HTTPS
ufw allow 80
ufw allow 443

# فحص الحالة
ufw status
```

### تحديث كلمات المرور:
- تغيير كلمة مرور root
- تحديث JWT secrets في .env.production
- تحديث كلمات مرور قاعدة البيانات

## جهات الاتصال

### الدعم الفني:
- **المطور**: متوفر للدعم
- **الاستضافة**: معلومات السيرفر متوفرة
- **النطاق**: maisondarin.com

### روابط مهمة:
- **الموقع**: https://maisondarin.com
- **لوحة التحكم**: https://maisondarin.com/admin
- **API Documentation**: https://maisondarin.com/api-docs (في بيئة التطوير)

---

## ملاحظات مهمة

⚠️ **تأكد من**:
- تحديث إعدادات PayPal للإنتاج
- إعداد SSL certificate
- تفعيل النسخ الاحتياطي التلقائي
- مراقبة الأداء والأخطاء

✅ **المشروع جاهز للنشر!**
