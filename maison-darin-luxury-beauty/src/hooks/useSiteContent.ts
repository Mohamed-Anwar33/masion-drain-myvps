import { useEffect, useState } from 'react';
import { contentService, SectionContentMap } from '@/services/contentService';
import { translations as staticTranslations } from '@/data/translations';

export function useSiteContent(currentLang: 'en' | 'ar') {
  const [content, setContent] = useState(staticTranslations[currentLang]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const remote = await contentService.getTranslations();
        if (!mounted) return;

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

        setContent(merged);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load content');
        setContent(staticTranslations[currentLang]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [currentLang]);

  return { content, loading, error };
}


