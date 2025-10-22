import { useState, useEffect } from 'react';

interface BreakpointConfig {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

interface ResponsiveState {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  breakpoint: string;
  orientation: 'portrait' | 'landscape';
  isTouch: boolean;
  pixelRatio: number;
}

const defaultBreakpoints: BreakpointConfig = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400
};

/**
 * Custom hook for responsive design and device detection
 */
export const useResponsive = (breakpoints: BreakpointConfig = defaultBreakpoints) => {
  const [state, setState] = useState<ResponsiveState>(() => {
    if (typeof window === 'undefined') {
      return {
        width: 1200,
        height: 800,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isLargeDesktop: false,
        breakpoint: 'lg',
        orientation: 'landscape',
        isTouch: false,
        pixelRatio: 1
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    
    return {
      width,
      height,
      isMobile: width < breakpoints.md,
      isTablet: width >= breakpoints.md && width < breakpoints.lg,
      isDesktop: width >= breakpoints.lg && width < breakpoints.xl,
      isLargeDesktop: width >= breakpoints.xl,
      breakpoint: getBreakpoint(width, breakpoints),
      orientation: width > height ? 'landscape' : 'portrait',
      isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      pixelRatio: window.devicePixelRatio || 1
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setState({
        width,
        height,
        isMobile: width < breakpoints.md,
        isTablet: width >= breakpoints.md && width < breakpoints.lg,
        isDesktop: width >= breakpoints.lg && width < breakpoints.xl,
        isLargeDesktop: width >= breakpoints.xl,
        breakpoint: getBreakpoint(width, breakpoints),
        orientation: width > height ? 'landscape' : 'portrait',
        isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        pixelRatio: window.devicePixelRatio || 1
      });
    };

    // Debounce resize events
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };

    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(timeoutId);
    };
  }, [breakpoints]);

  return state;
};

/**
 * Get current breakpoint name based on width
 */
function getBreakpoint(width: number, breakpoints: BreakpointConfig): string {
  if (width >= breakpoints.xxl) return 'xxl';
  if (width >= breakpoints.xl) return 'xl';
  if (width >= breakpoints.lg) return 'lg';
  if (width >= breakpoints.md) return 'md';
  if (width >= breakpoints.sm) return 'sm';
  return 'xs';
}

/**
 * Hook for media query matching
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    setMatches(mediaQuery.matches);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
};

/**
 * Hook for detecting touch devices
 */
export const useTouch = () => {
  const [isTouch, setIsTouch] = useState(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  });

  useEffect(() => {
    const handleTouchStart = () => setIsTouch(true);
    const handleMouseDown = () => setIsTouch(false);

    window.addEventListener('touchstart', handleTouchStart, { once: true });
    window.addEventListener('mousedown', handleMouseDown, { once: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return isTouch;
};

/**
 * Hook for detecting device orientation
 */
export const useOrientation = () => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(() => {
    if (typeof window === 'undefined') return 'landscape';
    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  });

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
    };

    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return orientation;
};

/**
 * Hook for detecting network connection
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  });

  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Detect connection type if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setConnectionType(connection.effectiveType || 'unknown');
      
      const handleConnectionChange = () => {
        setConnectionType(connection.effectiveType || 'unknown');
      };
      
      connection.addEventListener('change', handleConnectionChange);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', handleConnectionChange);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, connectionType };
};

/**
 * Hook for detecting reduced motion preference
 */
export const useReducedMotion = (): boolean => {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
};

/**
 * Hook for detecting dark mode preference
 */
export const useDarkMode = (): boolean => {
  return useMediaQuery('(prefers-color-scheme: dark)');
};

/**
 * Hook for detecting high contrast preference
 */
export const useHighContrast = (): boolean => {
  return useMediaQuery('(prefers-contrast: high)');
};

/**
 * Responsive utilities
 */
export const ResponsiveUtils = {
  /**
   * Get responsive class names based on breakpoint
   */
  getResponsiveClasses: (
    baseClass: string,
    responsive: Partial<Record<string, string>>
  ): string => {
    const classes = [baseClass];
    
    Object.entries(responsive).forEach(([breakpoint, className]) => {
      if (className) {
        classes.push(`${breakpoint}:${className}`);
      }
    });
    
    return classes.join(' ');
  },

  /**
   * Get grid columns based on breakpoint
   */
  getGridColumns: (breakpoint: string): number => {
    switch (breakpoint) {
      case 'xs':
      case 'sm':
        return 1;
      case 'md':
        return 2;
      case 'lg':
        return 3;
      case 'xl':
      case 'xxl':
        return 4;
      default:
        return 2;
    }
  },

  /**
   * Get container padding based on breakpoint
   */
  getContainerPadding: (breakpoint: string): string => {
    switch (breakpoint) {
      case 'xs':
        return '0.5rem';
      case 'sm':
        return '1rem';
      case 'md':
      case 'lg':
        return '1.5rem';
      case 'xl':
      case 'xxl':
        return '2rem';
      default:
        return '1rem';
    }
  },

  /**
   * Get font size based on breakpoint
   */
  getFontSize: (breakpoint: string, size: 'sm' | 'md' | 'lg'): string => {
    const sizes = {
      xs: { sm: '0.75rem', md: '0.875rem', lg: '1rem' },
      sm: { sm: '0.875rem', md: '1rem', lg: '1.125rem' },
      md: { sm: '0.875rem', md: '1rem', lg: '1.25rem' },
      lg: { sm: '1rem', md: '1.125rem', lg: '1.5rem' },
      xl: { sm: '1rem', md: '1.25rem', lg: '1.75rem' },
      xxl: { sm: '1.125rem', md: '1.5rem', lg: '2rem' }
    };
    
    return sizes[breakpoint as keyof typeof sizes]?.[size] || sizes.md[size];
  }
};