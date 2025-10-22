import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface PayPalButtonsProps {
  amount: number;
  currency?: string;
  orderId?: string;
  orderNumber?: string;
  onSuccess?: (details: any) => void;
  onError?: (error: any) => void;
  onCancel?: () => void;
  disabled?: boolean;
  style?: {
    layout?: 'vertical' | 'horizontal';
    color?: 'gold' | 'blue' | 'silver' | 'white' | 'black';
    shape?: 'rect' | 'pill';
    label?: 'paypal' | 'checkout' | 'buynow' | 'pay' | 'installment' | 'subscribe' | 'donate';
    tagline?: boolean;
    height?: number;
  };
}

interface PayPalConfig {
  clientId: string;
  enabled: boolean;
}

declare global {
  interface Window {
    paypal?: any;
  }
}

export const PayPalButtons: React.FC<PayPalButtonsProps> = ({
  amount,
  currency = 'SAR',
  orderId,
  orderNumber,
  onSuccess,
  onError,
  onCancel,
  disabled = false,
  style = {
    layout: 'vertical',
    color: 'gold',
    shape: 'rect',
    label: 'paypal',
    tagline: false,
    height: 40
  }
}) => {
  const paypalRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<PayPalConfig | null>(null);

  // Fetch PayPal configuration from backend
  useEffect(() => {
    const fetchPayPalConfig = async () => {
      try {
        const response = await fetch('/api/paypal/config');
        if (response.ok) {
          const data = await response.json();
          if (data.enabled) {
            setConfig(data);
          } else {
            onError?.({ message: 'PayPal is not enabled' });
          }
        } else {
          onError?.({ message: 'Failed to load PayPal configuration' });
        }
      } catch (error) {
        console.error('Failed to fetch PayPal config:', error);
        onError?.({ message: 'Failed to load PayPal configuration' });
      } finally {
        setLoading(false);
      }
    };

    fetchPayPalConfig();
  }, []);

  useEffect(() => {
    if (!config || disabled) return;

    const loadPayPalScript = () => {
      // Check if PayPal script is already loaded
      if (window.paypal) {
        renderPayPalButtons();
        return;
      }

      // Load PayPal script with configuration from backend
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${config.clientId}&currency=USD`;
      script.async = true;
      script.onload = renderPayPalButtons;
      script.onerror = () => {
        console.error('Failed to load PayPal SDK');
        onError?.({ message: 'Failed to load PayPal SDK' });
      };
      
      document.body.appendChild(script);
    };

    const renderPayPalButtons = () => {
      if (!window.paypal || !paypalRef.current || disabled) {
        return;
      }

      // Clear existing buttons
      paypalRef.current.innerHTML = '';

      window.paypal.Buttons({
        style,
        createOrder: async (data: any, actions: any) => {
          try {
            // Create order through our backend API
            const response = await fetch('http://localhost:5000/api/paypal/orders', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                amount: amount,
                currency: currency, // سيتم تحويلها من SAR إلى USD في الباك إند
                orderData: {
                  customerInfo: {
                    firstName: 'عميل',
                    lastName: 'PayPal',
                    email: 'customer@example.com',
                    phone: '+966501234567',
                    address: 'عنوان العميل',
                    city: 'الرياض',
                    postalCode: '12345',
                    country: 'السعودية'
                  },
                  items: [{
                    productId: orderId || 'paypal-order',
                    productName: `طلب PayPal ${orderNumber || ''}`,
                    price: amount,
                    quantity: 1,
                    subtotal: amount
                  }],
                  subtotal: amount,
                  total: amount,
                  paymentMethod: 'paypal',
                  paymentStatus: 'pending',
                  status: 'pending'
                }
              })
            });

            const orderData = await response.json();
            
            if (response.ok && orderData.id) {
              return orderData.id;
            } else {
              throw new Error(orderData.message || 'Failed to create PayPal order');
            }
          } catch (error) {
            console.error('Error creating PayPal order:', error);
            onError?.(error);
            throw error;
          }
        },
        onApprove: async (data: any, actions: any) => {
          try {
            // Capture payment through our backend API
            const response = await fetch(`http://localhost:5000/api/paypal/orders/${data.orderID}/capture`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              }
            });

            const result = await response.json();
            
            if (response.ok) {
              onSuccess?.(result);
            } else {
              throw new Error(result.message || 'Payment execution failed');
            }
          } catch (error) {
            console.error('Error executing PayPal payment:', error);
            onError?.(error);
          }
        },
        onError: (error: any) => {
          console.error('PayPal button error:', error);
          onError?.(error);
        },
        onCancel: () => {
          console.log('PayPal payment cancelled');
          onCancel?.();
        }
      }).render(paypalRef.current);
    };

    loadPayPalScript();
  }, [config, amount, currency, orderId, orderNumber, disabled]);

  if (loading) {
    return (
      <div className="paypal-loading bg-gray-100 p-4 rounded-lg text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
        <span className="text-gray-600">Loading PayPal...</span>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="paypal-disabled bg-red-50 border border-red-200 p-4 rounded-lg text-center text-red-600">
        PayPal payment is currently unavailable
      </div>
    );
  }

  if (disabled) {
    return (
      <div className="paypal-disabled bg-gray-100 p-4 rounded-lg text-center text-gray-500">
        PayPal payment is currently disabled
      </div>
    );
  }

  return (
    <div className="paypal-container">
      <div ref={paypalRef} className="paypal-buttons" />
    </div>
  );
};
