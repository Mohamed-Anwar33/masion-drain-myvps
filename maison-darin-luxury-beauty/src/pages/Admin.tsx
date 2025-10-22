import { useState, useEffect } from "react";
import { LazyWrapper } from "@/components/common/LazyWrapper";
import { LazyAdminPanel } from "@/components/admin/LazyAdminComponents";

const Admin = () => {
  const [currentLang, setCurrentLang] = useState<'en' | 'ar'>('ar');

  useEffect(() => {
    document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', currentLang);
  }, [currentLang]);

  return (
    <div className={`min-h-screen ${currentLang === 'ar' ? 'rtl' : 'ltr'}`}>
      <LazyWrapper>
        <LazyAdminPanel 
          currentLang={currentLang} 
          onLanguageChange={setCurrentLang}
        />
      </LazyWrapper>
    </div>
  );
};

export default Admin;