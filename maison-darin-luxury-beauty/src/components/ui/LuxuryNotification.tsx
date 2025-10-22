import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Upload, X, Sparkles } from 'lucide-react';

export interface NotificationProps {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  info: Upload,
  warning: AlertCircle,
};

const colorMap = {
  success: {
    bg: 'from-emerald-600/90 via-green-600/80 to-emerald-700/90',
    border: 'border-emerald-300/60',
    icon: 'text-emerald-100',
    title: 'text-white',
    message: 'text-emerald-50',
    glow: 'shadow-emerald-500/40'
  },
  error: {
    bg: 'from-red-600/90 via-rose-600/80 to-red-700/90',
    border: 'border-red-300/60',
    icon: 'text-red-100',
    title: 'text-white',
    message: 'text-red-50',
    glow: 'shadow-red-500/40'
  },
  info: {
    bg: 'from-blue-600/90 via-cyan-600/80 to-blue-700/90',
    border: 'border-blue-300/60',
    icon: 'text-blue-100',
    title: 'text-white',
    message: 'text-blue-50',
    glow: 'shadow-blue-500/40'
  },
  warning: {
    bg: 'from-amber-600/90 via-yellow-600/80 to-amber-700/90',
    border: 'border-amber-300/60',
    icon: 'text-amber-100',
    title: 'text-white',
    message: 'text-amber-50',
    glow: 'shadow-amber-500/40'
  }
};

export const LuxuryNotification = React.forwardRef<HTMLDivElement, NotificationProps>(({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose
}, ref) => {
  const [progress, setProgress] = useState(100);
  const Icon = iconMap[type];
  const colors = colorMap[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    const progressTimer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - (100 / (duration / 100));
        return newProgress <= 0 ? 0 : newProgress;
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      clearInterval(progressTimer);
    };
  }, [id, duration, onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -100, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -100, scale: 0.8 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        duration: 0.6
      }}
      className={`
        relative overflow-hidden rounded-2xl backdrop-blur-xl
        bg-gradient-to-r ${colors.bg}
        border-2 ${colors.border}
        shadow-2xl ${colors.glow}
        min-w-[400px] max-w-[500px]
        bg-gray-900/95
      `}
    >
      {/* خلفية متحركة فخمة */}
      <div className="absolute inset-0 opacity-30">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ x: [-100, 400] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* شريط التقدم */}
      <div className="absolute top-0 left-0 h-2 bg-black/30 w-full">
        <motion.div
          className={`h-full bg-gradient-to-r ${colors.bg.replace('/90', '')}`}
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      <div className="relative p-6">
        <div className="flex items-start gap-4">
          {/* أيقونة فخمة */}
          <div className="relative">
            <motion.div
              className={`p-3 rounded-full bg-white/20 backdrop-blur-sm ${colors.icon}`}
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: type === 'success' ? [0, 360] : 0
              }}
              transition={{ 
                duration: type === 'success' ? 2 : 1,
                repeat: type === 'success' ? Infinity : 0,
                ease: "easeInOut"
              }}
            >
              <Icon className="w-6 h-6" />
            </motion.div>
            
            {/* تأثير البريق */}
            {type === 'success' && (
              <motion.div
                className="absolute -top-1 -right-1"
                animate={{ 
                  scale: [0, 1, 0],
                  rotate: [0, 180, 360]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Sparkles className="w-4 h-4 text-gold" />
              </motion.div>
            )}
          </div>

          {/* المحتوى */}
          <div className="flex-1 min-w-0">
            <motion.h4 
              className={`font-bold text-lg ${colors.title} mb-1`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {title}
            </motion.h4>
            <motion.p 
              className={`text-sm ${colors.message} leading-relaxed`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              {message}
            </motion.p>
          </div>

          {/* زر الإغلاق */}
          <motion.button
            onClick={() => onClose(id)}
            className="p-2 rounded-full hover:bg-white/20 transition-colors text-white/80 hover:text-white bg-black/20"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* تأثير الحواف المتوهجة */}
      <div className={`absolute inset-0 rounded-2xl border-2 ${colors.border} opacity-50 pointer-events-none`} />
    </motion.div>
  );
});

LuxuryNotification.displayName = 'LuxuryNotification';

// مكون الحاوية الرئيسية للإشعارات
export const NotificationContainer: React.FC<{
  notifications: NotificationProps[];
  onClose: (id: string) => void;
}> = ({ notifications, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <LuxuryNotification
            key={notification.id}
            {...notification}
            onClose={onClose}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
