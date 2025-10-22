const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
  initializeTransporter() {
    try {
      // Configure email transporter based on environment
      if (process.env.NODE_ENV === 'production') {
        // Production email configuration
        this.transporter = nodemailer.createTransport({
          service: 'gmail', // or your email service
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });
      } else {
        // Development/test configuration (using Ethereal Email)
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          auth: {
            user: 'ethereal.user@ethereal.email',
            pass: 'ethereal.pass'
          }
        });
      }
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
    }
  }

  /**
   * Send order status update notification to customer
   * @param {Object} order - Order object
   * @param {string} previousStatus - Previous order status
   */
  async sendOrderStatusNotification(order, previousStatus) {
    try {
      if (!this.transporter) {
        logger.warn('Email transporter not initialized');
        return;
      }

      const statusMessages = {
        ar: {
          pending: 'في الانتظار',
          confirmed: 'مؤكد',
          processing: 'قيد المعالجة',
          shipped: 'تم الشحن',
          delivered: 'تم التسليم',
          cancelled: 'ملغي'
        },
        en: {
          pending: 'Pending',
          confirmed: 'Confirmed',
          processing: 'Processing',
          shipped: 'Shipped',
          delivered: 'Delivered',
          cancelled: 'Cancelled'
        }
      };

      const currentStatusAr = statusMessages.ar[order.orderStatus];
      const currentStatusEn = statusMessages.en[order.orderStatus];

      const emailContent = this.generateOrderStatusEmailContent(order, currentStatusAr, currentStatusEn);

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@maisondarin.com',
        to: order.customerInfo.email,
        subject: `تحديث حالة الطلب ${order.orderNumber} - Order Status Update`,
        html: emailContent
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Order status notification sent to ${order.customerInfo.email}`, {
        orderId: order._id,
        orderNumber: order.orderNumber,
        newStatus: order.orderStatus,
        messageId: result.messageId
      });

      return result;
    } catch (error) {
      logger.error('Failed to send order status notification:', error);
      throw error;
    }
  }

  /**
   * Send order confirmation notification
   * @param {Object} order - Order object
   */
  async sendOrderConfirmationNotification(order) {
    try {
      if (!this.transporter) {
        logger.warn('Email transporter not initialized');
        return;
      }

      const emailContent = this.generateOrderConfirmationEmailContent(order);

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@maisondarin.com',
        to: order.customerInfo.email,
        subject: `تأكيد الطلب ${order.orderNumber} - Order Confirmation`,
        html: emailContent
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Order confirmation sent to ${order.customerInfo.email}`, {
        orderId: order._id,
        orderNumber: order.orderNumber,
        messageId: result.messageId
      });

      return result;
    } catch (error) {
      logger.error('Failed to send order confirmation:', error);
      throw error;
    }
  }

  /**
   * Send order cancellation notification
   * @param {Object} order - Order object
   * @param {string} reason - Cancellation reason
   */
  async sendOrderCancellationNotification(order, reason) {
    try {
      if (!this.transporter) {
        logger.warn('Email transporter not initialized');
        return;
      }

      const emailContent = this.generateOrderCancellationEmailContent(order, reason);

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@maisondarin.com',
        to: order.customerInfo.email,
        subject: `إلغاء الطلب ${order.orderNumber} - Order Cancellation`,
        html: emailContent
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Order cancellation notification sent to ${order.customerInfo.email}`, {
        orderId: order._id,
        orderNumber: order.orderNumber,
        messageId: result.messageId
      });

      return result;
    } catch (error) {
      logger.error('Failed to send order cancellation notification:', error);
      throw error;
    }
  }

  /**
   * Generate order status update email content
   * @param {Object} order - Order object
   * @param {string} statusAr - Status in Arabic
   * @param {string} statusEn - Status in English
   * @returns {string} HTML email content
   */
  generateOrderStatusEmailContent(order, statusAr, statusEn) {
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تحديث حالة الطلب</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background-color: #8B5CF6; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
          .status-confirmed { background-color: #10B981; color: white; }
          .status-processing { background-color: #F59E0B; color: white; }
          .status-shipped { background-color: #3B82F6; color: white; }
          .status-delivered { background-color: #059669; color: white; }
          .order-details { background-color: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { background-color: #F3F4F6; padding: 20px; text-align: center; color: #6B7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ميزون دارين</h1>
            <h2>تحديث حالة الطلب</h2>
          </div>
          <div class="content">
            <p>عزيزي/عزيزتي ${order.customerInfo.firstName} ${order.customerInfo.lastName}،</p>
            
            <p>نود إعلامك بأن حالة طلبك قد تم تحديثها:</p>
            
            <div class="order-details">
              <h3>تفاصيل الطلب</h3>
              <p><strong>رقم الطلب:</strong> ${order.orderNumber}</p>
              <p><strong>الحالة الجديدة:</strong> <span class="status-badge status-${order.orderStatus}">${statusAr}</span></p>
              <p><strong>تاريخ التحديث:</strong> ${new Date().toLocaleDateString('ar-EG')}</p>
              <p><strong>المجموع:</strong> ${order.total.toFixed(2)} جنيه</p>
            </div>

            <div class="order-details">
              <h3>المنتجات</h3>
              ${order.items.map(item => `
                <p>• ${item.name.ar} - الكمية: ${item.quantity} - السعر: ${item.price.toFixed(2)} جنيه</p>
              `).join('')}
            </div>

            ${order.orderStatus === 'shipped' ? `
              <div style="background-color: #EBF8FF; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>🚚 تم شحن طلبك!</strong></p>
                <p>سيصلك الطلب خلال 2-3 أيام عمل.</p>
              </div>
            ` : ''}

            ${order.orderStatus === 'delivered' ? `
              <div style="background-color: #F0FDF4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>✅ تم تسليم طلبك بنجاح!</strong></p>
                <p>نشكرك لاختيارك ميزون دارين. نتطلع لخدمتك مرة أخرى.</p>
              </div>
            ` : ''}

            <p>إذا كان لديك أي استفسارات، لا تتردد في التواصل معنا.</p>
            
            <p>مع أطيب التحيات،<br>فريق ميزون دارين</p>
          </div>
          <div class="footer">
            <p>© 2024 ميزون دارين. جميع الحقوق محفوظة.</p>
            <p>هذا إيميل تلقائي، يرجى عدم الرد عليه.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate order confirmation email content
   * @param {Object} order - Order object
   * @returns {string} HTML email content
   */
  generateOrderConfirmationEmailContent(order) {
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تأكيد الطلب</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background-color: #10B981; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .order-details { background-color: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { background-color: #F3F4F6; padding: 20px; text-align: center; color: #6B7280; }
          .success-badge { background-color: #10B981; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ميزون دارين</h1>
            <h2>✅ تم تأكيد طلبك!</h2>
          </div>
          <div class="content">
            <p>عزيزي/عزيزتي ${order.customerInfo.firstName} ${order.customerInfo.lastName}،</p>
            
            <p>شكراً لك! تم تأكيد طلبك بنجاح وسنبدأ في معالجته قريباً.</p>
            
            <div class="order-details">
              <h3>تفاصيل الطلب</h3>
              <p><strong>رقم الطلب:</strong> ${order.orderNumber}</p>
              <p><strong>الحالة:</strong> <span class="success-badge">مؤكد</span></p>
              <p><strong>تاريخ الطلب:</strong> ${new Date(order.createdAt).toLocaleDateString('ar-EG')}</p>
              <p><strong>المجموع:</strong> ${order.total.toFixed(2)} جنيه</p>
            </div>

            <div class="order-details">
              <h3>المنتجات المطلوبة</h3>
              ${order.items.map(item => `
                <p>• ${item.name.ar} - الكمية: ${item.quantity} - السعر: ${item.price.toFixed(2)} جنيه</p>
              `).join('')}
            </div>

            <div class="order-details">
              <h3>عنوان التسليم</h3>
              <p>${order.customerInfo.address}</p>
              <p>${order.customerInfo.city}, ${order.customerInfo.postalCode}</p>
              <p>${order.customerInfo.country}</p>
            </div>

            <div style="background-color: #EBF8FF; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>📦 الخطوات التالية:</strong></p>
              <p>• سنقوم بمعالجة طلبك خلال 24 ساعة</p>
              <p>• ستتلقى إشعار عند شحن الطلب</p>
              <p>• التسليم خلال 2-3 أيام عمل</p>
            </div>

            <p>إذا كان لديك أي استفسارات، لا تتردد في التواصل معنا.</p>
            
            <p>مع أطيب التحيات،<br>فريق ميزون دارين</p>
          </div>
          <div class="footer">
            <p>© 2024 ميزون دارين. جميع الحقوق محفوظة.</p>
            <p>هذا إيميل تلقائي، يرجى عدم الرد عليه.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate order cancellation email content
   * @param {Object} order - Order object
   * @param {string} reason - Cancellation reason
   * @returns {string} HTML email content
   */
  generateOrderCancellationEmailContent(order, reason) {
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>إلغاء الطلب</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background-color: #EF4444; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .order-details { background-color: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { background-color: #F3F4F6; padding: 20px; text-align: center; color: #6B7280; }
          .cancelled-badge { background-color: #EF4444; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ميزون دارين</h1>
            <h2>❌ تم إلغاء طلبك</h2>
          </div>
          <div class="content">
            <p>عزيزي/عزيزتي ${order.customerInfo.firstName} ${order.customerInfo.lastName}،</p>
            
            <p>نأسف لإبلاغك بأنه تم إلغاء طلبك.</p>
            
            <div class="order-details">
              <h3>تفاصيل الطلب الملغي</h3>
              <p><strong>رقم الطلب:</strong> ${order.orderNumber}</p>
              <p><strong>الحالة:</strong> <span class="cancelled-badge">ملغي</span></p>
              <p><strong>تاريخ الإلغاء:</strong> ${new Date().toLocaleDateString('ar-EG')}</p>
              <p><strong>المجموع:</strong> ${order.total.toFixed(2)} جنيه</p>
              ${reason ? `<p><strong>سبب الإلغاء:</strong> ${reason}</p>` : ''}
            </div>

            <div style="background-color: #FEF3C7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>💰 استرداد المبلغ:</strong></p>
              <p>إذا كنت قد دفعت مقدماً، سيتم استرداد المبلغ خلال 3-5 أيام عمل.</p>
            </div>

            <p>نعتذر عن أي إزعاج قد يكون سببه هذا الإلغاء. نتطلع لخدمتك في المستقبل.</p>
            
            <p>إذا كان لديك أي استفسارات، لا تتردد في التواصل معنا.</p>
            
            <p>مع أطيب التحيات،<br>فريق ميزون دارين</p>
          </div>
          <div class="footer">
            <p>© 2024 ميزون دارين. جميع الحقوق محفوظة.</p>
            <p>هذا إيميل تلقائي، يرجى عدم الرد عليه.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send SMS notification (placeholder for future implementation)
   * @param {string} phoneNumber - Customer phone number
   * @param {string} message - SMS message
   */
  async sendSMSNotification(phoneNumber, message) {
    // Placeholder for SMS service integration
    logger.info(`SMS notification would be sent to ${phoneNumber}: ${message}`);
    return { success: true, message: 'SMS notification logged (not implemented)' };
  }

  /**
   * Send push notification (placeholder for future implementation)
   * @param {string} userId - User ID
   * @param {Object} notification - Notification data
   */
  async sendPushNotification(userId, notification) {
    // Placeholder for push notification service integration
    logger.info(`Push notification would be sent to user ${userId}:`, notification);
    return { success: true, message: 'Push notification logged (not implemented)' };
  }
}

module.exports = new NotificationService();