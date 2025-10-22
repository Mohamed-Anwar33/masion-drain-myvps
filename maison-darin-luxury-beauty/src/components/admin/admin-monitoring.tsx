import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Activity, Server, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dashboardService } from '@/services/dashboardService';

interface AdminMonitoringProps {
  currentLang: 'en' | 'ar';
}

export function AdminMonitoring({ currentLang }: AdminMonitoringProps) {
  const [cacheStatus, setCacheStatus] = useState<{ size: number; timeout: number; entries: Array<{ key: string; age: number; expired: boolean; }> } | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const status = await dashboardService.getCacheStatus();
      setCacheStatus(status);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6" dir={currentLang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">
            {currentLang === 'ar' ? 'المراقبة والنشاط' : 'Monitoring & Activity'}
          </h2>
          <p className="text-muted-foreground">
            {currentLang === 'ar' ? 'حالة النظام وذاكرة التخزين المؤقت' : 'System status and cache'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''} ${currentLang === 'ar' ? 'ml-2' : 'mr-2'}`} />
            {currentLang === 'ar' ? 'تحديث' : 'Refresh'}
          </Button>
          <Button onClick={() => dashboardService.clearCache()} disabled={loading}>
            <Server className={`${currentLang === 'ar' ? 'ml-2' : 'mr-2'} h-4 w-4`} />
            {currentLang === 'ar' ? 'مسح الكاش' : 'Clear Cache'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {currentLang === 'ar' ? 'حالة ذاكرة التخزين المؤقت' : 'Cache Status'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!cacheStatus ? (
            <div className="text-sm text-muted-foreground">
              {currentLang === 'ar' ? 'لا توجد بيانات بعد.' : 'No data yet.'}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{currentLang === 'ar' ? 'الحجم' : 'Size'}:</span>{' '}
                  <span className="font-medium">{cacheStatus.size}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{currentLang === 'ar' ? 'المهلة' : 'Timeout'}:</span>{' '}
                  <span className="font-medium">{cacheStatus.timeout} ms</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{currentLang === 'ar' ? 'الإدخالات' : 'Entries'}:</span>{' '}
                  <span className="font-medium">{cacheStatus.entries.length}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cacheStatus.entries.map((e) => (
                  <Card key={e.key}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-sm truncate">{e.key}</div>
                        {e.expired ? (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {currentLang === 'ar' ? 'منتهي' : 'Expired'}
                          </Badge>
                        ) : (
                          <Badge variant="outline">{currentLang === 'ar' ? 'صالح' : 'Valid'}</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {currentLang === 'ar' ? 'العمر' : 'Age'}: {Math.round(e.age / 1000)}s
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminMonitoring;


