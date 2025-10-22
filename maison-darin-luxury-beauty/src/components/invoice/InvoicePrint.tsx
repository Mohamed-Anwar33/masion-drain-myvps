import { useState } from 'react';
import { Download, Printer, Mail } from 'lucide-react';
import { Order } from '@/services/orderService';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import InvoiceTemplate from './InvoiceTemplate';
import { useToast } from '@/hooks/use-toast';

interface InvoicePrintProps {
  order: Order;
  currentLang: 'en' | 'ar';
  trigger?: React.ReactNode;
}

export default function InvoicePrint({ order, currentLang, trigger }: InvoicePrintProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: currentLang === 'ar' ? "خطأ" : "Error",
        description: currentLang === 'ar' ? "فشل في فتح نافذة الطباعة" : "Failed to open print window",
        variant: "destructive",
      });
      return;
    }

    const printContent = document.getElementById('invoice-content');
    if (!printContent) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="${currentLang === 'ar' ? 'rtl' : 'ltr'}" lang="${currentLang}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice ${order.orderNumber}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
          }
          
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            border-bottom: 2px solid #8B5CF6;
            padding-bottom: 20px;
          }
          
          .company-info h1 {
            color: #8B5CF6;
            font-size: 2rem;
            margin-bottom: 5px;
          }
          
          .company-info p {
            color: #666;
            margin-bottom: 15px;
          }
          
          .company-details {
            font-size: 0.9rem;
            color: #666;
          }
          
          .invoice-info h2 {
            font-size: 1.5rem;
            margin-bottom: 10px;
          }
          
          .invoice-details {
            font-size: 0.9rem;
            color: #666;
          }
          
          .billing-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
          }
          
          .billing-section h3 {
            font-size: 1.1rem;
            margin-bottom: 10px;
            color: #333;
          }
          
          .billing-section p {
            margin-bottom: 5px;
            color: #666;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          
          .items-table th,
          .items-table td {
            padding: 12px;
            text-align: ${currentLang === 'ar' ? 'right' : 'left'};
            border-bottom: 1px solid #ddd;
          }
          
          .items-table th {
            background-color: #f8f9fa;
            font-weight: 600;
            border-bottom: 2px solid #ddd;
          }
          
          .totals-section {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
          }
          
          .totals-table {
            width: 300px;
          }
          
          .totals-table tr {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
          }
          
          .totals-table .total-row {
            border-top: 2px solid #333;
            font-weight: bold;
            font-size: 1.1rem;
            padding-top: 12px;
          }
          
          .footer {
            text-align: center;
            border-top: 1px solid #ddd;
            padding-top: 20px;
            color: #666;
            font-size: 0.9rem;
          }
          
          .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: 500;
          }
          
          .status-paid {
            background-color: #d1fae5;
            color: #065f46;
          }
          
          .status-pending {
            background-color: #fef3c7;
            color: #92400e;
          }
          
          .status-failed {
            background-color: #fee2e2;
            color: #991b1b;
          }
          
          @media print {
            body { margin: 0; }
            .invoice-container { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          ${printContent.innerHTML}
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);

    toast({
      title: currentLang === 'ar' ? "تم" : "Success",
      description: currentLang === 'ar' ? "تم فتح نافذة الطباعة" : "Print window opened",
    });
  };

  const handleDownloadPDF = () => {
    // This would integrate with a PDF generation service
    toast({
      title: currentLang === 'ar' ? "قريباً" : "Coming Soon",
      description: currentLang === 'ar' ? "ميزة تحميل PDF ستكون متاحة قريباً" : "PDF download feature coming soon",
    });
  };

  const handleEmailInvoice = () => {
    // This would integrate with email service
    toast({
      title: currentLang === 'ar' ? "قريباً" : "Coming Soon",
      description: currentLang === 'ar' ? "ميزة إرسال الفاتورة بالإيميل ستكون متاحة قريباً" : "Email invoice feature coming soon",
    });
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Download className={`h-4 w-4 ${currentLang === 'ar' ? 'ml-2' : 'mr-2'}`} />
      {currentLang === 'ar' ? 'طباعة الفاتورة' : 'Print Invoice'}
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" dir={currentLang === 'ar' ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>
              {currentLang === 'ar' ? 'فاتورة الطلب' : 'Order Invoice'} {order.orderNumber}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleEmailInvoice}>
                <Mail className={`h-4 w-4 ${currentLang === 'ar' ? 'ml-2' : 'mr-2'}`} />
                {currentLang === 'ar' ? 'إرسال' : 'Email'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className={`h-4 w-4 ${currentLang === 'ar' ? 'ml-2' : 'mr-2'}`} />
                {currentLang === 'ar' ? 'تحميل PDF' : 'Download PDF'}
              </Button>
              <Button onClick={handlePrint}>
                <Printer className={`h-4 w-4 ${currentLang === 'ar' ? 'ml-2' : 'mr-2'}`} />
                {currentLang === 'ar' ? 'طباعة' : 'Print'}
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div id="invoice-content" className="mt-4">
          <InvoiceTemplate order={order} currentLang={currentLang} />
        </div>
      </DialogContent>
    </Dialog>
  );
}