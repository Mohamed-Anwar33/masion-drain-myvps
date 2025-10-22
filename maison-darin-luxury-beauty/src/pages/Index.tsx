import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/sections/hero-section";
import { AboutSection } from "@/components/sections/about-section";
import { CollectionsSection } from "@/components/sections/collections-section";
import { ContactSection } from "@/components/sections/contact-section";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useHomePage } from "@/hooks/useHomePage";
import { useLocation } from "react-router-dom";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const Index = () => {
  const [currentLang, setCurrentLang] = useState<'en' | 'ar'>(
    () => (localStorage.getItem('lang') as 'en' | 'ar') || 'en'
  );

  // Handle language change and update document direction
  const handleLanguageChange = (lang: 'en' | 'ar') => {
    setCurrentLang(lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
    try {
      localStorage.setItem('lang', lang);
    } catch {}
    try {
      window.dispatchEvent(new CustomEvent<'en' | 'ar'>('lang:change', { detail: lang }));
    } catch {}
  };

  // Set initial direction
  useEffect(() => {
    document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', currentLang);
    try {
      localStorage.setItem('lang', currentLang);
    } catch {}
  }, [currentLang]);

  const { content: t } = useSiteContent(currentLang);
  const { content: homePageContent, loading: homePageLoading } = useHomePage();

  // Smooth scroll to section when hash exists
  const location = useLocation();
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.substring(1);
      const el = document.getElementById(id);
      if (el) {
        // small timeout to ensure layout is ready
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 0);
      }
    }
  }, [location]);

  // Show maintenance page if maintenance mode is enabled
  if (homePageContent?.maintenanceMode) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center" dir={currentLang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-16 h-16 mx-auto mb-6 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {currentLang === 'ar' ? 'الموقع تحت الصيانة' : 'Site Under Maintenance'}
          </h1>
          <p className="text-gray-600 mb-6">
            {homePageContent.maintenanceMessage || (
              currentLang === 'ar' 
                ? 'نحن نقوم حالياً بأعمال صيانة لتحسين تجربتكم. يرجى المحاولة مرة أخرى قريباً!'
                : 'We are currently performing maintenance to improve your experience. Please try again soon!'
            )}
          </p>
          <p className="text-sm text-gray-500">
            {currentLang === 'ar' ? 'شكراً لصبركم وتفهمكم' : 'Thank you for your patience and understanding'}
          </p>
        </div>
      </div>
    );
  }

  // Show loading spinner while content is loading
  if (homePageLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div id="top" className="min-h-screen bg-background">
      <Header 
        currentLang={currentLang}
        onLanguageChange={handleLanguageChange}
        translations={t}
      />
      
      <main>
        {homePageContent?.hero?.showSection !== false && (
          <HeroSection 
            translations={t}
            currentLang={currentLang}
          />
        )}
        
        {homePageContent?.showAboutSection !== false && (
          <AboutSection 
            currentLang={currentLang}
          />
        )}
        
        {homePageContent?.showCategories !== false && (
          <CollectionsSection 
            currentLang={currentLang}
          />
        )}
        
        {homePageContent?.showContact !== false && (
          <ContactSection 
            translations={t}
            currentLang={currentLang}
          />
        )}
      </main>

      <Footer currentLang={currentLang} translations={t} />
    </div>
  );
};

export default Index;
