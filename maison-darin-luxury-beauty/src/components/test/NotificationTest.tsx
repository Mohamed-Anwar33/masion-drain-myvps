import React from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationContainer } from '../ui/LuxuryNotification';

const NotificationTest: React.FC = () => {
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
    showSaveProgress
  } = useNotifications();

  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold mb-6">اختبار الإشعارات الفخمة</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => showSaveSuccess()}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          ✅ نجح الحفظ
        </button>
        
        <button
          onClick={() => showSaveError('فشل في الاتصال بالخادم')}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          ❌ فشل الحفظ
        </button>
        
        <button
          onClick={() => showUploadSuccess(3)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          🖼️ نجح رفع الصور
        </button>
        
        <button
          onClick={() => showUploadError('حجم الصورة كبير جداً')}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          📤 فشل رفع الصور
        </button>
        
        <button
          onClick={() => showDeleteSuccess()}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          🗑️ نجح الحذف
        </button>
        
        <button
          onClick={() => showUploadProgress()}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          ⏳ جاري الرفع
        </button>
      </div>

      {/* حاوية الإشعارات */}
      <NotificationContainer 
        notifications={notifications} 
        onClose={removeNotification} 
      />
    </div>
  );
};

export default NotificationTest;
