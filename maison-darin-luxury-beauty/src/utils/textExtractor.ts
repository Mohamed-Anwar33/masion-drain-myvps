/**
 * Extract string value from various data structures
 * Handles nested objects, text fields, and multi-language objects
 */
export function extractString(value: any, currentLang?: 'en' | 'ar'): string {
  if (!value) return '';
  
  // Direct string
  if (typeof value === 'string') return value;
  
  // Object with text field
  if (value?.text) return String(value.text);
  
  // Multi-language object
  if (typeof value === 'object') {
    // Try current language first
    if (currentLang && value[currentLang]) {
      return String(value[currentLang]);
    }
    // Fallback to available languages
    if (value.en) return String(value.en);
    if (value.ar) return String(value.ar);
  }
  
  // Last resort: convert to string
  return String(value);
}

/**
 * Extract nested translation value safely
 */
export function getTranslation(
  translations: any,
  path: string,
  currentLang: 'en' | 'ar',
  fallback: string = ''
): string {
  const keys = path.split('.');
  let value = translations;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return fallback;
    }
  }
  
  return extractString(value, currentLang) || fallback;
}
