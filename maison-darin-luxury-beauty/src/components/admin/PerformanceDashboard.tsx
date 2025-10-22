import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Clock, 
  MemoryStick, 
  Wifi, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  Download
} from 'lucide-react';
import performanceMonitor, { type PerformanceReport } from '@/utils/performanceMonitor';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  category: 'load' | 'runtime' | 'memory' | 'network';
  threshold?: number;
  status: 'good' | 'warning' | 'error';
}

const PerformanceDashboard: React.FC = () => {
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);

  useEffect(() => {
    // تحديث التقرير كل 5 ثواني
    const interval = setInterval(() => {
      if (isMonitoring) {
        updateReport();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isMonitoring]);

  const updateReport = () => {
    const newReport = performanceMonitor.generateReport();
    setReport(newReport);
    
    // تحويل المقاييس إلى تنسيق العرض
    const displayMetrics: PerformanceMetric[] = newReport.metrics
      .slice(-20) // آخر 20 مقياس
      .map(metric => ({
        ...metric,
        status: getMetricStatus(metric.value, metric.threshold)
      }));
    
    setMetrics(displayMetrics);
  };

  const getMetricStatus = (value: number, threshold?: number): 'good' | 'warning' | 'error' => {
    if (!threshold) return 'good';
    
    if (value > threshold * 1.5) return 'error';
    if (value > threshold) return 'warning';
    return 'good';
  };

  const startMonitoring = () => {
    performanceMonitor.startMonitoring();
    setIsMonitoring(true);
    updateReport();
  };

  const stopMonitoring = () => {
    performanceMonitor.stopMonitoring();
    setIsMonitoring(false);
  };

  const downloadReport = () => {
    if (!report) return;
    
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'load': return <Clock className="h-4 w-4" />;
      case 'runtime': return <Activity className="h-4 w-4" />;
      case 'memory': return <MemoryStick className="h-4 w-4" />;
      case 'network': return <Wifi className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const categoryMetrics = {
    load: metrics.filter(m => m.category === 'load'),
    runtime: metrics.filter(m => m.category === 'runtime'),
    memory: metrics.filter(m => m.category === 'memory'),
    network: metrics.filter(m => m.category === 'network')
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">مراقب الأداء</h2>
        <div className="flex gap-2">
          <Button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            variant={isMonitoring ? "destructive" : "default"}
            size="sm"
          >
            {isMonitoring ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                إيقاف المراقبة
              </>
            ) : (
              <>
                <Activity className="h-4 w-4 mr-2" />
                بدء المراقبة
              </>
            )}
          </Button>
          
          {report && (
            <Button onClick={downloadReport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              تحميل التقرير
            </Button>
          )}
        </div>
      </div>

      {report && (
        <>
          {/* النقاط الإجمالية */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                النقاط الإجمالية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold">
                  <span className={getScoreColor(report.overallScore)}>
                    {report.overallScore}
                  </span>
                  <span className="text-2xl text-gray-500">/100</span>
                </div>
                <Badge variant={getScoreBadgeVariant(report.overallScore)}>
                  {report.overallScore >= 80 ? 'ممتاز' : 
                   report.overallScore >= 60 ? 'جيد' : 'يحتاج تحسين'}
                </Badge>
              </div>
              <Progress value={report.overallScore} className="mt-4" />
            </CardContent>
          </Card>

          {/* التحذيرات والتوصيات */}
          {(report.warnings.length > 0 || report.recommendations.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.warnings.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-600">
                      <AlertTriangle className="h-5 w-5" />
                      تحذيرات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {report.warnings.map((warning, index) => (
                        <li key={index} className="text-sm text-gray-600">
                          • {warning}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {report.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-600">
                      <CheckCircle className="h-5 w-5" />
                      توصيات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {report.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-gray-600">
                          • {rec}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* مقاييس الأداء حسب الفئة */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(categoryMetrics).map(([category, categoryData]) => (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    {getCategoryIcon(category)}
                    {category === 'load' && 'التحميل'}
                    {category === 'runtime' && 'وقت التشغيل'}
                    {category === 'memory' && 'الذاكرة'}
                    {category === 'network' && 'الشبكة'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categoryData.slice(-3).map((metric, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(metric.status)}
                          <span className="truncate" title={metric.name}>
                            {metric.name.length > 15 
                              ? `${metric.name.substring(0, 15)}...` 
                              : metric.name}
                          </span>
                        </div>
                        <span className="font-mono text-xs">
                          {metric.value.toFixed(1)}{metric.unit}
                        </span>
                      </div>
                    ))}
                    {categoryData.length === 0 && (
                      <div className="text-gray-500 text-sm text-center py-2">
                        لا توجد بيانات
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* جدول المقاييس التفصيلي */}
          {metrics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>المقاييس التفصيلية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right p-2">الحالة</th>
                        <th className="text-right p-2">الفئة</th>
                        <th className="text-right p-2">المقياس</th>
                        <th className="text-right p-2">القيمة</th>
                        <th className="text-right p-2">العتبة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.slice(-10).map((metric, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            {getStatusIcon(metric.status)}
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-1">
                              {getCategoryIcon(metric.category)}
                              <span className="text-xs">
                                {metric.category === 'load' && 'تحميل'}
                                {metric.category === 'runtime' && 'تشغيل'}
                                {metric.category === 'memory' && 'ذاكرة'}
                                {metric.category === 'network' && 'شبكة'}
                              </span>
                            </div>
                          </td>
                          <td className="p-2">{metric.name}</td>
                          <td className="p-2 font-mono">
                            {metric.value.toFixed(2)}{metric.unit}
                          </td>
                          <td className="p-2 font-mono text-gray-500">
                            {metric.threshold ? `${metric.threshold}${metric.unit}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!report && !isMonitoring && (
        <Card>
          <CardContent className="text-center py-12">
            <Activity className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">مراقب الأداء غير نشط</h3>
            <p className="text-gray-600 mb-4">
              اضغط على "بدء المراقبة" لبدء مراقبة أداء النظام
            </p>
            <Button onClick={startMonitoring}>
              <Activity className="h-4 w-4 mr-2" />
              بدء المراقبة
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PerformanceDashboard;