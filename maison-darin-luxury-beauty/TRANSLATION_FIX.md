# Translation Text Extraction Fix

## Problem
النصوص الإنجليزية لم تكن تظهر في بعض الأقسام عند التبديل من العربية إلى الإنجليزية.

## Root Cause
البيانات القادمة من `useSiteContent` hook يمكن أن تكون بأشكال متعددة:
- `string` مباشرة
- `{ text: string }` - object يحتوي على حقل text
- `{ en: string, ar: string }` - object متعدد اللغات
- `{ [key: string]: any }` - nested objects

الكود القديم كان يفترض أن البيانات دائماً strings مباشرة، مما تسبب في عدم ظهور النصوص.

## Solution

### 1. Created Utility Function
أنشأنا utility function في `src/utils/textExtractor.ts`:

```typescript
export function extractString(value: any, currentLang?: 'en' | 'ar'): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value?.text) return String(value.text);
  if (typeof value === 'object') {
    if (currentLang && value[currentLang]) return String(value[currentLang]);
    if (value.en) return String(value.en);
    if (value.ar) return String(value.ar);
  }
  return String(value);
}
```

### 2. Updated Components
تم تحديث جميع الكومبوننتات التالية لاستخدام `extractString` function:

#### Frontend Components:
- ✅ `src/components/sections/hero-section.tsx`
- ✅ `src/components/sections/about-section.tsx`
- ✅ `src/components/sections/collections-section.tsx`
- ✅ `src/components/sections/contact-section.tsx`
- ✅ `src/components/layout/header.tsx`
- ✅ `src/components/layout/footer.tsx`

#### Changes Applied:
1. إضافة helper function `extractString` في كل component
2. تحديث كل استخدامات `translations.X.Y` إلى `extractString(translations?.X?.Y)`
3. إضافة fallback values للعناصر الحساسة (مثل about section values)

### 3. Example Usage

**Before (Old Code):**
```typescript
<h1>{translations.hero.title}</h1>
```

**After (Fixed Code):**
```typescript
const extractString = (value: any): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value?.text) return String(value.text);
  if (typeof value === 'object') {
    if (value[currentLang]) return String(value[currentLang]);
    if (value.en) return String(value.en);
    if (value.ar) return String(value.ar);
  }
  return String(value);
};

<h1>{extractString(translations?.hero?.title)}</h1>
```

## Testing
بعد التحديثات:
1. افتح الموقع على `http://localhost:5173`
2. قم بالتبديل بين الإنجليزية والعربية
3. تأكد من ظهور جميع النصوص في كلا اللغتين
4. تحقق من الأقسام التالية:
   - Hero Section (الصفحة الرئيسية)
   - About Section (من نحن - القيم الثلاث)
   - Collections Section (المجموعات)
   - Contact Section (اتصل بنا)
   - Header Navigation (القائمة العلوية)
   - Footer (التذييل)

## Future Improvements

### Option 1: Centralized Utility (Recommended)
يمكن استخدام utility function المشتركة بدلاً من تكرار الدالة:

```typescript
import { extractString } from '@/utils/textExtractor';

// Then use directly:
<h1>{extractString(translations?.hero?.title, currentLang)}</h1>
```

### Option 2: Custom Hook
إنشاء custom hook للتعامل مع الترجمات:

```typescript
import { useTranslation } from '@/hooks/useTranslation';

const { t } = useTranslation(currentLang);
<h1>{t('hero.title')}</h1>
```

### Option 3: Improve useSiteContent Hook
تحسين `useSiteContent` hook لإرجاع strings دائماً بدلاً من objects معقدة.

## Notes
- الإصلاح الحالي يعمل بشكل صحيح لكن يحتوي على تكرار للكود
- يُفضل استخدام utility function المشتركة في المستقبل
- تأكد من اختبار جميع الصفحات بعد أي تغيير في نظام الترجمة
