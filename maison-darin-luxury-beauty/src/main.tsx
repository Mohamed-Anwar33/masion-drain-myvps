import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/rtl-fixes.css";
import performanceMonitor from "./utils/performanceMonitor";

// بدء مراقبة الأداء في بيئة التطوير (معطل مؤقتاً لتحسين الأداء)
// if (import.meta.env.DEV) {
//   performanceMonitor.startMonitoring();
//   console.log('🚀 تم تفعيل مراقب الأداء');
// }

createRoot(document.getElementById("root")!).render(<App />);
