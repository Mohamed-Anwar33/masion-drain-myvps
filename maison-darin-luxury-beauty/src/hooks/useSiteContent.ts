import { useEffect, useState, useCallback, useRef } from 'react';
import { contentService, SectionContentMap } from '@/services/contentService';
import { translations as staticTranslations } from '@/data/translations';

// Cache for translations to avoid unnecessary API calls
interface TranslationCacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

const translationsCache: Record<string, TranslationCacheEntry> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useSiteContent(currentLang: 'en' | 'ar') {
  const [content, setContent] = useState(staticTranslations[currentLang]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Normalized fetch translations with caching
  const fetchTranslations = useCallback(async (signal?: AbortSignal) => {
    // Check cache first
    const cacheKey = `translations-${currentLang}`;
    const now = Date.now();
    const cached = translationsCache[cacheKey];
    
    if (cached && now < cached.expiresAt) {
      setContent(cached.data);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // استخدام contentService بدون signal لأنه غير موجود في التعريف
      const remote = await contentService.getTranslations();
      const base = staticTranslations[currentLang] as any;
      const sections = ['nav', 'hero', 'about', 'collections', 'contact', 'footer'] as const;
      const merged: any = { ...base };

      const normalize = (value: any): any => {
        if (value === null || value === undefined) return value;
        if (Array.isArray(value)) return value.map(normalize);
        if (typeof value === 'object') {
          // If it's a rich-text/link object, prefer its text field
          if (typeof (value as any).text === 'string') return (value as any).text;
          // Otherwise, recursively normalize each key
          const out: any = {};
          for (const [k, v] of Object.entries(value)) out[k] = normalize(v);
          return out;
        }
        return value;
      };

      for (const section of sections) {
        const remoteSection: any = (remote as any)?.[section];
        // Support both shapes: { en, ar } or { content: { en, ar } }
        const byLang = remoteSection?.[currentLang] || remoteSection?.content?.[currentLang];
        if (!byLang) continue;

        // Shallow merge per section to preserve expected keys
        merged[section] = normalize({
          ...(base?.[section] || {}),
          ...byLang,
        });
      }

      // Save to cache
      translationsCache[cacheKey] = {
        data: merged,
        timestamp: now,
        expiresAt: now + CACHE_DURATION
      };

      setContent(merged);
    } catch (e: any) {
      // Don't set error if aborted
      if (signal?.aborted) return;
      
      setError(e?.message || 'Failed to load content');
      setContent(staticTranslations[currentLang]);
    } finally {
      setLoading(false);
    }
  }, [currentLang]);

  useEffect(() => {
    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create a new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    fetchTranslations(signal);
    
    return () => {
      // Clean up by aborting any in-flight requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [currentLang, fetchTranslations]);

  return { content, loading, error };
}


