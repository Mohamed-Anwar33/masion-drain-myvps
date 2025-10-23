import React, { useState, useEffect, useCallback } from "react";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderColor?: string;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  onLoad?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({ 
  src, 
  alt, 
  className = "", 
  placeholderColor = "#f8f8f4",
  objectFit = "cover",
  onLoad
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState("");
  
  // هنا نضيف رابط لصورة placeholder بديلة في حالة وجود 404
  const getValidImageSrc = useCallback((originalSrc: string) => {
    // إذا كان الرابط يحتوي على /api/placeholder/ استخدم رابط بديل
    if (originalSrc.includes('/api/placeholder')) {
      // استخرج العرض والارتفاع من الرابط إذا أمكن
      const dimensions = originalSrc.match(/\/placeholder\/(\d+)\/(\d+)/)
      const width = dimensions?.[1] || '400'
      const height = dimensions?.[2] || '600'
      
      // استخدم خدمة مجانية للصور الاحتياطية
      return `https://via.placeholder.com/${width}x${height}/CCCCCC/333333?text=Maison+Darin`
    }
    
    return originalSrc
  }, [])
  
  useEffect(() => {
    // Reset state when src changes
    setIsLoaded(false);
    
    let isMounted = true;
    const img = new Image();
    
    // استخدم رابط الصورة الصحيح
    const validSrc = getValidImageSrc(src);
    
    img.onload = () => {
      if (isMounted) {
        setImageSrc(validSrc);
        setIsLoaded(true);
        if (onLoad) onLoad();
      }
    };
    
    img.onerror = () => {
      if (isMounted) {
        // إذا فشل تحميل الصورة حتى البديلة، استخدم صورة احتياطية عامة
        setImageSrc('https://via.placeholder.com/400x600/CCCCCC/333333?text=Image+Not+Found');
        setIsLoaded(true);
      }
    };
    
    img.src = validSrc;
    
    return () => {
      isMounted = false;
      img.onload = null;
      img.onerror = null;
    };
  }, [src, onLoad, getValidImageSrc]);
  
  return (
    <div 
      className={`relative overflow-hidden ${className}`} 
      style={{ backgroundColor: placeholderColor }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      )}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={`w-full h-full transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"} optimized-image`}
          style={{ objectFit }}
          loading="lazy"
        />
      )}
    </div>
  );
};

export default React.memo(LazyImage);
