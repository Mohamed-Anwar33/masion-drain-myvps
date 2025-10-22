// إعدادات Cloudinary
export const CLOUDINARY_CONFIG = {
  cloudName: 'dbixjzxgp', // Cloud Name الفعلي
  uploadPreset: 'maison_darin', // Upload Preset - يجب إنشاؤه في Cloudinary كـ Unsigned
  apiUrl: 'https://api.cloudinary.com/v1_1'
};

// للحصول على إعدادات Cloudinary الصحيحة:
// 1. اذهب إلى cloudinary.com وأنشئ حساب
// 2. من Dashboard، انسخ Cloud Name
// 3. من Settings > Upload، أنشئ Upload Preset جديد
// 4. اختر Signing Mode: Unsigned
// 5. استبدل القيم أعلاه

export const getCloudinaryUploadUrl = () => {
  return `${CLOUDINARY_CONFIG.apiUrl}/${CLOUDINARY_CONFIG.cloudName}/image/upload`;
};
