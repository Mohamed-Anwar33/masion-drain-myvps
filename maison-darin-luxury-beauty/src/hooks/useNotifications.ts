import { useState, useCallback } from 'react';
import { NotificationProps } from '@/components/ui/LuxuryNotification';

export interface NotificationOptions {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);

  const addNotification = useCallback((options: NotificationOptions) => {
    const id = Math.random().toString(36).substr(2, 9);
    const notification: NotificationProps = {
      id,
      ...options,
      duration: options.duration || 5000,
      onClose: (id: string) => removeNotification(id)
    };

    setNotifications(prev => [...prev, notification]);
    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // رسائل مخصصة للعمليات المختلفة
  const showSuccess = useCallback((title: string, message: string, duration?: number) => {
    return addNotification({ type: 'success', title, message, duration });
  }, [addNotification]);

  const showError = useCallback((title: string, message: string, duration?: number) => {
    return addNotification({ type: 'error', title, message, duration });
  }, [addNotification]);

  const showInfo = useCallback((title: string, message: string, duration?: number) => {
    return addNotification({ type: 'info', title, message, duration });
  }, [addNotification]);

  const showWarning = useCallback((title: string, message: string, duration?: number) => {
    return addNotification({ type: 'warning', title, message, duration });
  }, [addNotification]);

  // رسائل مخصصة للعمليات الشائعة
  const showSaveSuccess = useCallback(() => {
    return showSuccess(
      '✨ تم الحفظ بنجاح',
      'تم حفظ التغييرات بنجاح وسيتم تطبيقها على الموقع فوراً'
    );
  }, [showSuccess]);

  const showSaveError = useCallback((error?: string) => {
    return showError(
      '❌ فشل في الحفظ',
      error || 'حدث خطأ أثناء حفظ التغييرات. يرجى المحاولة مرة أخرى'
    );
  }, [showError]);

  const showUploadSuccess = useCallback((count: number = 1) => {
    return showSuccess(
      '🖼️ تم رفع الصور بنجاح',
      `تم رفع ${count} ${count === 1 ? 'صورة' : 'صور'} بنجاح وإضافتها للمعرض`
    );
  }, [showSuccess]);

  const showUploadError = useCallback((error?: string) => {
    return showError(
      '📤 فشل في رفع الصور',
      error || 'حدث خطأ أثناء رفع الصور. تأكد من اتصال الإنترنت وحجم الصور'
    );
  }, [showError]);

  const showDeleteSuccess = useCallback(() => {
    return showSuccess(
      '🗑️ تم الحذف بنجاح',
      'تم حذف الصورة من المعرض بنجاح'
    );
  }, [showSuccess]);

  const showDeleteError = useCallback((error?: string) => {
    return showError(
      '❌ فشل في الحذف',
      error || 'حدث خطأ أثناء حذف الصورة. يرجى المحاولة مرة أخرى'
    );
  }, [showError]);

  const showUploadProgress = useCallback(() => {
    return showInfo(
      '⏳ جاري رفع الصور...',
      'يرجى الانتظار حتى اكتمال رفع الصور'
    );
  }, [showInfo]);

  const showSaveProgress = useCallback(() => {
    return showInfo(
      '💾 جاري الحفظ...',
      'يرجى الانتظار حتى اكتمال حفظ التغييرات'
    );
  }, [showInfo]);

  const showDeleteProgress = useCallback(() => {
    return showInfo(
      '🗑️ جاري الحذف...',
      'يرجى الانتظار حتى اكتمال حذف الصورة'
    );
  }, [showInfo]);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    // رسائل مخصصة
    showSaveSuccess,
    showSaveError,
    showUploadSuccess,
    showUploadError,
    showDeleteSuccess,
    showDeleteError,
    showUploadProgress,
    showSaveProgress,
    showDeleteProgress
  };
};
