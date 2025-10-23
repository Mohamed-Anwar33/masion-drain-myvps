import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/rtl-fixes.css";
import performanceMonitor from "./utils/performanceMonitor";
import cacheCleaner from "./utils/cacheCleaner";

// تفعيل مسح التخزين المؤقت قبل تحميل التطبيق
// هذا يضمن أن المستخدم يرى دائماً أحدث نسخة من الموقع، خاصة في متصفح كروم
console.log('🧹 جاري التحقق من التخزين المؤقت...');

// بدء مراقبة الأداء في بيئة التطوير (معطل مؤقتاً لتحسين الأداء)
// if (import.meta.env.DEV) {
//   performanceMonitor.startMonitoring();
//   console.log('🚀 تم تفعيل مراقب الأداء');
// }

// تأخير طفيف قبل عرض التطبيق لضمان مسح التخزين المؤقت
setTimeout(() => {
  createRoot(document.getElementById("root")!).render(<App />);
}, 10); // تأخير بسيط جداً لن يؤثر على تجربة المستخدم
