/**
 * Setup Email Configuration Script
 * This script helps add EMAIL_APP_PASSWORD to .env file
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.join(__dirname, '..', '.env');

console.log('🔧 إعداد كلمة مرور الإيميل - Maison Darin');
console.log('=====================================');
console.log('');
console.log('لإعداد كلمة مرور الإيميل، تحتاج إلى:');
console.log('1. تسجيل الدخول إلى Gmail: maisondarin2025@gmail.com');
console.log('2. تفعيل التحقق بخطوتين');
console.log('3. إنشاء كلمة مرور تطبيق (App Password)');
console.log('4. نسخ كلمة المرور (16 رقم)');
console.log('');

rl.question('هل حصلت على كلمة مرور التطبيق؟ (y/n): ', (answer) => {
  if (answer.toLowerCase() !== 'y') {
    console.log('');
    console.log('📋 خطوات الحصول على كلمة مرور التطبيق:');
    console.log('1. اذهب إلى: https://myaccount.google.com');
    console.log('2. سجل دخول بحساب: maisondarin2025@gmail.com');
    console.log('3. اذهب إلى "الأمان" > "التحقق بخطوتين"');
    console.log('4. فعل التحقق بخطوتين إذا لم يكن مفعل');
    console.log('5. اذهب إلى "كلمات مرور التطبيقات"');
    console.log('6. اختر "تطبيق آخر" واكتب "Maison Darin Website"');
    console.log('7. انسخ كلمة المرور المُنشأة (16 رقم)');
    console.log('');
    console.log('ثم شغل هذا السكريپت مرة أخرى.');
    rl.close();
    return;
  }

  rl.question('أدخل كلمة مرور التطبيق (16 رقم): ', (password) => {
    if (!password || password.length !== 16) {
      console.log('❌ كلمة المرور يجب أن تكون 16 رقم بالضبط');
      rl.close();
      return;
    }

    try {
      let envContent = '';
      
      // Read existing .env file if it exists
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }

      // Check if EMAIL_APP_PASSWORD already exists
      if (envContent.includes('EMAIL_APP_PASSWORD=')) {
        // Replace existing password
        envContent = envContent.replace(/EMAIL_APP_PASSWORD=.*/, `EMAIL_APP_PASSWORD=${password}`);
        console.log('🔄 تم تحديث كلمة مرور الإيميل الموجودة');
      } else {
        // Add new password
        if (envContent && !envContent.endsWith('\n')) {
          envContent += '\n';
        }
        envContent += `\n# Email Configuration\nEMAIL_APP_PASSWORD=${password}\n`;
        console.log('✅ تم إضافة كلمة مرور الإيميل');
      }

      // Write to .env file
      fs.writeFileSync(envPath, envContent);
      
      console.log('');
      console.log('🎉 تم إعداد كلمة مرور الإيميل بنجاح!');
      console.log('');
      console.log('الخطوات التالية:');
      console.log('1. أعد تشغيل الخادم: npm run dev');
      console.log('2. اذهب إلى لوحة التحكم > إعدادات الموقع');
      console.log('3. اضغط على "اختبار الإيميل"');
      console.log('');
      
    } catch (error) {
      console.error('❌ خطأ في كتابة ملف .env:', error.message);
    }

    rl.close();
  });
});
