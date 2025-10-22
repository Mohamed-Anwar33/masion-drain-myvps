import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

interface SessionWarningProps {
  currentLang: 'en' | 'ar';
}

export const SessionWarning = ({ currentLang }: SessionWarningProps) => {
  const { state, checkAuth } = useAuth();
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (state.sessionWarning && state.timeUntilExpiry > 0) {
      setTimeLeft(state.timeUntilExpiry);
      
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1000) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [state.sessionWarning, state.timeUntilExpiry]);

  const formatTime = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleExtendSession = async () => {
    try {
      await checkAuth();
    } catch (error) {
      console.error('Failed to extend session:', error);
    }
  };

  const translations = {
    en: {
      title: 'Session Expiring Soon',
      message: 'Your session will expire in',
      extendButton: 'Extend Session',
      extending: 'Extending...',
    },
    ar: {
      title: 'ستنتهي الجلسة قريباً',
      message: 'ستنتهي جلستك خلال',
      extendButton: 'تمديد الجلسة',
      extending: 'جاري التمديد...',
    },
  };

  const t = translations[currentLang];

  if (!state.sessionWarning || timeLeft <= 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Alert className="border-warning bg-warning/10">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <AlertDescription className={`${currentLang === 'ar' ? 'text-right' : 'text-left'}`}>
          <div className={`flex items-center gap-2 mb-3 ${currentLang === 'ar' ? 'flex-row-reverse' : ''}`}>
            <strong>{t.title}</strong>
          </div>
          <div className={`flex items-center gap-2 mb-3 ${currentLang === 'ar' ? 'flex-row-reverse' : ''}`}>
            <Clock className="h-4 w-4" />
            <span>{t.message} {formatTime(timeLeft)}</span>
          </div>
          <Button
            onClick={handleExtendSession}
            size="sm"
            variant="outline"
            className={`w-full ${currentLang === 'ar' ? 'flex-row-reverse' : ''}`}
            disabled={state.isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${state.isLoading ? 'animate-spin' : ''} ${currentLang === 'ar' ? 'ml-2' : 'mr-2'}`} />
            {state.isLoading ? t.extending : t.extendButton}
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
};