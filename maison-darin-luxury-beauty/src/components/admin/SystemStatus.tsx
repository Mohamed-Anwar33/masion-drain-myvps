import React, { useState, useEffect } from 'react';
import { RefreshCw, Server, Database, CreditCard, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface SystemStatus {
  backend: 'online' | 'offline' | 'checking';
  database: 'connected' | 'disconnected' | 'checking';
  paypal: 'configured' | 'not-configured' | 'error' | 'checking';
  lastCheck: string;
}

const SystemStatus: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus>({
    backend: 'checking',
    database: 'checking', 
    paypal: 'checking',
    lastCheck: ''
  });

  const [checking, setChecking] = useState(false);

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    setChecking(true);
    setStatus(prev => ({
      ...prev,
      backend: 'checking',
      database: 'checking',
      paypal: 'checking'
    }));

    try {
      // Test Backend Connection
      const backendStatus = await testBackend();
      
      // Test Database Connection (via backend)
      const databaseStatus = await testDatabase();
      
      // Test PayPal Configuration
      const paypalStatus = await testPayPal();

      setStatus({
        backend: backendStatus,
        database: databaseStatus,
        paypal: paypalStatus,
        lastCheck: new Date().toLocaleTimeString('ar-SA')
      });

    } catch (error) {
      console.error('System check failed:', error);
      setStatus({
        backend: 'offline',
        database: 'disconnected',
        paypal: 'error',
        lastCheck: new Date().toLocaleTimeString('ar-SA')
      });
    } finally {
      setChecking(false);
    }
  };

  const testBackend = async (): Promise<'online' | 'offline'> => {
    try {
      const response = await fetch('/api/health', { timeout: 5000 } as any);
      return response.ok ? 'online' : 'offline';
    } catch {
      return 'offline';
    }
  };

  const testDatabase = async (): Promise<'connected' | 'disconnected'> => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch('/api/orders', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        timeout: 5000
      } as any);
      
      return response.status !== 500 ? 'connected' : 'disconnected';
    } catch {
      return 'disconnected';
    }
  };

  const testPayPal = async (): Promise<'configured' | 'not-configured' | 'error'> => {
    try {
      const response = await fetch('/api/paypal/config', { timeout: 5000 } as any);
      if (response.ok) {
        const data = await response.json();
        return data.enabled && data.clientId ? 'configured' : 'not-configured';
      }
      return 'error';
    } catch {
      return 'error';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'connected':
      case 'configured':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'offline':
      case 'disconnected':
      case 'not-configured':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      default:
        return <RefreshCw className="w-5 h-5 text-beige/60 animate-spin" />;
    }
  };

  const getStatusText = (component: string, status: string) => {
    const statusMap: Record<string, Record<string, string>> = {
      backend: {
        online: 'متصل',
        offline: 'غير متصل',
        checking: 'فحص...'
      },
      database: {
        connected: 'متصل',
        disconnected: 'غير متصل',
        checking: 'فحص...'
      },
      paypal: {
        configured: 'مُعد',
        'not-configured': 'غير مُعد',
        error: 'خطأ',
        checking: 'فحص...'
      }
    };

    return statusMap[component]?.[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'connected':
      case 'configured':
        return 'text-green-400';
      case 'offline':
      case 'disconnected':
      case 'not-configured':
        return 'text-red-400';
      case 'error':
        return 'text-yellow-400';
      default:
        return 'text-beige/60';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-off-white">
            حالة النظام
          </h2>
          <p className="text-beige/80 mt-2">
            مراقبة حالة جميع مكونات النظام
          </p>
        </div>
        <button
          onClick={checkSystemStatus}
          disabled={checking}
          className="flex items-center gap-2 bg-gold hover:bg-gold/90 disabled:bg-gold/50 text-dark-brown font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
          فحص النظام
        </button>
      </div>

      <div className="bg-dark-brown/50 rounded-lg border border-gold/20 p-6">
        <div className="space-y-6">
          {/* System Components */}
          <div className="grid gap-4">
            {/* Backend Status */}
            <div className="flex items-center justify-between p-4 bg-dark-brown/30 rounded-lg border border-gold/10">
              <div className="flex items-center gap-3">
                <Server className="w-6 h-6 text-gold" />
                <div>
                  <h3 className="text-off-white font-medium">الباك إند</h3>
                  <p className="text-beige/60 text-sm">Backend Server (Port 5000)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(status.backend)}
                <span className={`font-medium ${getStatusColor(status.backend)}`}>
                  {getStatusText('backend', status.backend)}
                </span>
              </div>
            </div>

            {/* Database Status */}
            <div className="flex items-center justify-between p-4 bg-dark-brown/30 rounded-lg border border-gold/10">
              <div className="flex items-center gap-3">
                <Database className="w-6 h-6 text-gold" />
                <div>
                  <h3 className="text-off-white font-medium">قاعدة البيانات</h3>
                  <p className="text-beige/60 text-sm">MongoDB Connection</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(status.database)}
                <span className={`font-medium ${getStatusColor(status.database)}`}>
                  {getStatusText('database', status.database)}
                </span>
              </div>
            </div>

            {/* PayPal Status */}
            <div className="flex items-center justify-between p-4 bg-dark-brown/30 rounded-lg border border-gold/10">
              <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-gold" />
                <div>
                  <h3 className="text-off-white font-medium">PayPal</h3>
                  <p className="text-beige/60 text-sm">Payment Gateway</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(status.paypal)}
                <span className={`font-medium ${getStatusColor(status.paypal)}`}>
                  {getStatusText('paypal', status.paypal)}
                </span>
              </div>
            </div>
          </div>

          {/* Last Check Info */}
          <div className="pt-4 border-t border-gold/20">
            <p className="text-beige/60 text-sm">
              آخر فحص: {status.lastCheck || 'لم يتم الفحص بعد'}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <h3 className="text-off-white font-medium">إجراءات سريعة:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {status.backend === 'offline' && (
                <div className="p-3 bg-red-900/20 border border-red-400/20 rounded-lg">
                  <p className="text-red-400 font-medium mb-1">الباك إند غير متصل</p>
                  <p className="text-red-300/80 text-sm">تأكد من تشغيل الباك إند على البورت 5000</p>
                </div>
              )}
              
              {status.paypal === 'not-configured' && (
                <div className="p-3 bg-yellow-900/20 border border-yellow-400/20 rounded-lg">
                  <p className="text-yellow-400 font-medium mb-1">PayPal غير مُعد</p>
                  <p className="text-yellow-300/80 text-sm">اذهب لإعدادات PayPal لتكوين النظام</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;
