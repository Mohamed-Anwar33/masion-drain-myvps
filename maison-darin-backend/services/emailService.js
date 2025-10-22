const nodemailer = require('nodemailer');
const SiteSettings = require('../models/SiteSettings');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.config = null;
    this.settings = null;
  }

  async initializeTransporter(emailSettings = null) {
    try {
      // Use provided settings or get from database
      if (emailSettings) {
        this.settings = emailSettings;
      } else {
        const siteSettings = await SiteSettings.getSiteSettings();
        this.settings = siteSettings.emailSettings;
      }
      
      // Debug logging
      console.log('🔍 Email settings from database:', {
        adminEmail: this.settings.adminEmail,
        smtpHost: this.settings.smtpHost,
        smtpPort: this.settings.smtpPort,
        smtpUser: this.settings.smtpUser,
        hasPassword: !!this.settings.smtpPass
      });
      
      // Use environment variable as fallback for SMTP password
      const smtpPassword = this.settings.smtpPass || process.env.EMAIL_APP_PASSWORD;
      
      if (!smtpPassword) {
        logger.error('SMTP password not found in database or environment variables');
        throw new Error('SMTP password is required');
      }

      this.transporter = nodemailer.createTransport({
        host: this.settings.smtpHost || 'smtp.gmail.com',
        port: this.settings.smtpPort || 587,
        secure: false,
        auth: {
          user: this.settings.smtpUser || this.settings.adminEmail || 'maisondarin2025@gmail.com',
          pass: smtpPassword
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      logger.info('Email transporter initialized successfully with database settings');
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
      throw error;
    }
  }

  /**
   * Update email configuration
   */
  async updateConfig(emailSettings) {
    logger.info('Email configuration update requested', {
      enableNotifications: emailSettings?.enableNotifications,
      enableCustomerConfirmation: emailSettings?.enableCustomerConfirmation
    });
    
    // Re-initialize transporter with new settings
    try {
      await this.initializeTransporter(emailSettings);
      logger.info('Email configuration updated successfully');
    } catch (error) {
      logger.error('Failed to update email configuration:', error);
    }
  }
  
  /**
   * Test email configuration
   */
  async testEmailConfiguration() {
    try {
      console.log('🧪 Testing email configuration...');
      console.log('🔍 Transporter exists:', !!this.transporter);
      console.log('🔍 Config pass:', this.config.smtp.auth.pass ? 'SET' : 'NOT SET');
      
      if (!this.transporter) {
        console.log('❌ Email transporter not initialized');
        throw new Error('Email transporter not initialized');
      }
      
      // Verify SMTP connection
      console.log('🔍 Verifying SMTP connection...');
      await this.transporter.verify();
      console.log('✅ SMTP verification successful');
      return true;
    } catch (error) {
      console.log('❌ Email test failed:', error.message);
      logger.error('Email configuration test failed:', error);
      return false;
    }
  }

  /**
   * Send contact form notification to admin
   */
  async sendContactNotificationToAdmin(contactData) {
    try {
      const { customerInfo, message, category, priority, messageNumber } = contactData;
      
      // Ensure we have valid settings
      if (!this.settings || !this.settings.adminEmail) {
        throw new Error('Email settings not configured');
      }
      
      const htmlContent = this.generateAdminNotificationHTML(contactData);
      const textContent = this.generateAdminNotificationText(contactData);

      const mailOptions = {
        from: `"${this.settings.fromName || 'ميزون دارين'}" <${this.settings.fromEmail || this.settings.adminEmail}>`,
        to: this.settings.adminEmail,
        subject: `🔔 رسالة جديدة من العميل - ${customerInfo.firstName} ${customerInfo.lastName} | ${messageNumber}`,
        text: textContent,
        html: htmlContent,
        priority: priority === 'urgent' ? 'high' : 'normal'
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Admin notification email sent successfully', {
        messageId: result.messageId,
        messageNumber,
        customerEmail: customerInfo.email
      });

      return result;
    } catch (error) {
      logger.error('Failed to send admin notification email:', error);
      throw error;
    }
  }

  /**
   * Send confirmation email to customer
   */
  async sendCustomerConfirmation(contactData) {
    try {
      const { customerInfo, messageNumber } = contactData;
      
      // Ensure we have valid settings
      if (!this.settings || !this.settings.adminEmail) {
        throw new Error('Email settings not configured');
      }
      
      const htmlContent = this.generateCustomerConfirmationHTML(contactData);
      const textContent = this.generateCustomerConfirmationText(contactData);

      const mailOptions = {
        from: `"${this.settings.fromName || 'ميزون دارين'}" <${this.settings.fromEmail || this.settings.adminEmail}>`,
        to: customerInfo.email,
        subject: `✅ تم استلام رسالتك - شكراً لتواصلك معنا | ${messageNumber}`,
        text: textContent,
        html: htmlContent
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Customer confirmation email sent successfully', {
        messageId: result.messageId,
        messageNumber,
        customerEmail: customerInfo.email
      });

      return result;
    } catch (error) {
      logger.error('Failed to send customer confirmation email:', error);
      throw error;
    }
  }

  /**
   * Generate elegant HTML email for admin notification
   */
  generateAdminNotificationHTML(contactData) {
    const { customerInfo, message, category, priority, messageNumber, createdAt } = contactData;
    
    const priorityColor = {
      low: '#10B981',
      medium: '#F59E0B', 
      high: '#EF4444',
      urgent: '#DC2626'
    };

    const categoryEmoji = {
      general: '💬',
      product: '🛍️',
      support: '🛠️',
      complaint: '⚠️',
      suggestion: '💡',
      partnership: '🤝'
    };

    return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>رسالة جديدة من العميل</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                padding: 20px;
                direction: rtl;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                font-size: 28px;
                margin-bottom: 10px;
                font-weight: 700;
            }
            .header p {
                font-size: 16px;
                opacity: 0.9;
            }
            .content {
                padding: 30px;
            }
            .message-info {
                background: #f8fafc;
                border-radius: 15px;
                padding: 20px;
                margin-bottom: 25px;
                border-right: 4px solid #667eea;
            }
            .info-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                padding: 10px 0;
                border-bottom: 1px solid #e2e8f0;
            }
            .info-row:last-child {
                border-bottom: none;
                margin-bottom: 0;
            }
            .info-label {
                font-weight: 600;
                color: #4a5568;
                font-size: 14px;
            }
            .info-value {
                color: #2d3748;
                font-size: 14px;
            }
            .priority-badge {
                padding: 6px 12px;
                border-radius: 20px;
                color: white;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
            }
            .message-content {
                background: white;
                border: 2px solid #e2e8f0;
                border-radius: 15px;
                padding: 25px;
                margin: 25px 0;
                line-height: 1.8;
                font-size: 16px;
                color: #2d3748;
            }
            .footer {
                background: #f7fafc;
                padding: 25px;
                text-align: center;
                border-top: 1px solid #e2e8f0;
            }
            .footer p {
                color: #718096;
                font-size: 14px;
                margin-bottom: 10px;
            }
            .action-button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px 25px;
                text-decoration: none;
                border-radius: 25px;
                font-weight: 600;
                margin-top: 15px;
                transition: transform 0.2s;
            }
            .action-button:hover {
                transform: translateY(-2px);
            }
            .logo {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 5px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🌸 ميزون دارين</div>
                <h1>رسالة جديدة من العميل</h1>
                <p>تم استلام رسالة جديدة عبر نموذج التواصل</p>
            </div>
            
            <div class="content">
                <div class="message-info">
                    <div class="info-row">
                        <span class="info-label">📧 رقم الرسالة:</span>
                        <span class="info-value"><strong>${messageNumber}</strong></span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">👤 اسم العميل:</span>
                        <span class="info-value">${customerInfo.firstName} ${customerInfo.lastName}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">📧 البريد الإلكتروني:</span>
                        <span class="info-value">${customerInfo.email}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">📱 رقم الهاتف:</span>
                        <span class="info-value">${customerInfo.phone || 'غير محدد'}</span>
                    </div>
                    ${contactData.subject ? `
                    <div class="info-row">
                        <span class="info-label">📝 الموضوع:</span>
                        <span class="info-value">${contactData.subject}</span>
                    </div>
                    ` : ''}
                    <div class="info-row">
                        <span class="info-label">${categoryEmoji[category] || '📂'} التصنيف:</span>
                        <span class="info-value">${this.getCategoryName(category)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">⚡ الأولوية:</span>
                        <span class="priority-badge" style="background-color: ${priorityColor[priority] || '#6B7280'}">
                            ${this.getPriorityName(priority)}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">🕐 وقت الإرسال:</span>
                        <span class="info-value">${new Date(createdAt).toLocaleString('ar-SA')}</span>
                    </div>
                </div>

                <div class="message-content">
                    <h3 style="color: #4a5568; margin-bottom: 15px; font-size: 18px;">💬 نص الرسالة:</h3>
                    <p>${message.replace(/\n/g, '<br>')}</p>
                </div>
            </div>

            <div class="footer">
                <p>يرجى الرد على هذه الرسالة في أقرب وقت ممكن</p>
                <a href="mailto:${customerInfo.email}" class="action-button">
                    📧 الرد على العميل
                </a>
                <p style="margin-top: 20px; font-size: 12px;">
                    هذا إشعار تلقائي من نظام ميزون دارين لإدارة الرسائل
                </p>
            </div>
        </div>
    </body>
    </html>`;
  }

  /**
   * Generate elegant HTML email for customer confirmation
   */
  generateCustomerConfirmationHTML(contactData) {
    const { customerInfo, messageNumber, createdAt } = contactData;
    
    return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تأكيد استلام رسالتك</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
                padding: 20px;
                direction: rtl;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%);
                color: #2d3748;
                padding: 40px 30px;
                text-align: center;
            }
            .header h1 {
                font-size: 32px;
                margin-bottom: 15px;
                font-weight: 700;
            }
            .header p {
                font-size: 18px;
                opacity: 0.8;
            }
            .content {
                padding: 40px 30px;
            }
            .welcome-message {
                text-align: center;
                margin-bottom: 30px;
            }
            .welcome-message h2 {
                color: #2d3748;
                font-size: 24px;
                margin-bottom: 15px;
            }
            .welcome-message p {
                color: #4a5568;
                font-size: 16px;
                line-height: 1.6;
            }
            .message-details {
                background: #f7fafc;
                border-radius: 15px;
                padding: 25px;
                margin: 30px 0;
                border-right: 4px solid #ff9a9e;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                padding: 8px 0;
            }
            .detail-row:last-child {
                margin-bottom: 0;
            }
            .detail-label {
                font-weight: 600;
                color: #4a5568;
            }
            .detail-value {
                color: #2d3748;
                font-weight: 500;
            }
            .next-steps {
                background: white;
                border: 2px solid #e2e8f0;
                border-radius: 15px;
                padding: 25px;
                margin: 25px 0;
            }
            .next-steps h3 {
                color: #2d3748;
                margin-bottom: 15px;
                font-size: 20px;
            }
            .next-steps ul {
                list-style: none;
                padding: 0;
            }
            .next-steps li {
                padding: 10px 0;
                border-bottom: 1px solid #f1f5f9;
                color: #4a5568;
                line-height: 1.6;
            }
            .next-steps li:last-child {
                border-bottom: none;
            }
            .next-steps li::before {
                content: "✨ ";
                margin-left: 10px;
            }
            .footer {
                background: #f7fafc;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #e2e8f0;
            }
            .footer p {
                color: #718096;
                font-size: 14px;
                margin-bottom: 15px;
                line-height: 1.5;
            }
            .contact-info {
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
            }
            .contact-info p {
                margin-bottom: 8px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            .checkmark {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: #10B981;
                margin: 0 auto 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 30px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🌸 ميزون دارين</div>
                <div class="checkmark">✅</div>
                <h1>تم استلام رسالتك بنجاح</h1>
                <p>شكراً لتواصلك معنا، عزيز/ة ${customerInfo.firstName} ${customerInfo.lastName}</p>
            </div>
            
            <div class="content">
                <div class="welcome-message">
                    <h2>مرحباً ${customerInfo.firstName} ${customerInfo.lastName} 👋</h2>
                    <p>
                        نشكرك على تواصلك مع ميزون دارين. لقد تم استلام رسالتك بنجاح وسيقوم فريقنا 
                        بمراجعتها والرد عليك في أقرب وقت ممكن.
                    </p>
                </div>

                <div class="message-details">
                    <div class="detail-row">
                        <span class="detail-label">📧 رقم الرسالة:</span>
                        <span class="detail-value">${messageNumber}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">📅 تاريخ الإرسال:</span>
                        <span class="detail-value">${new Date(createdAt).toLocaleString('ar-SA')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">📧 البريد الإلكتروني:</span>
                        <span class="detail-value">${customerInfo.email}</span>
                    </div>
                </div>

                <div class="next-steps">
                    <h3>🚀 الخطوات التالية:</h3>
                    <ul>
                        <li>سيقوم فريق خدمة العملاء بمراجعة رسالتك خلال 24 ساعة</li>
                        <li>ستتلقى رداً مفصلاً على بريدك الإلكتروني المسجل</li>
                        <li>في حالة الاستعجال، يمكنك التواصل معنا هاتفياً</li>
                        <li>احتفظ برقم الرسالة ${messageNumber} للمتابعة</li>
                    </ul>
                </div>
            </div>

            <div class="footer">
                <p>
                    <strong>ميزون دارين</strong> - وجهتك المثالية للعطور الفاخرة والأصيلة
                </p>
                <p>
                    نحن ملتزمون بتقديم أفضل خدمة عملاء وأجود المنتجات لعملائنا الكرام
                </p>
                
                <div class="contact-info">
                    <p><strong>📧 البريد الإلكتروني:</strong> info@maison-darin.com</p>
                    <p><strong>📱 الهاتف:</strong> +966 50 123 4567</p>
                    <p><strong>🌐 الموقع الإلكتروني:</strong> www.maison-darin.com</p>
                </div>
                
                <p style="margin-top: 25px; font-size: 12px; opacity: 0.7;">
                    هذا إشعار تلقائي، يرجى عدم الرد على هذا البريد الإلكتروني
                </p>
            </div>
        </div>
    </body>
    </html>`;
  }

  /**
   * Generate plain text versions
   */
  generateAdminNotificationText(contactData) {
    const { customerInfo, message, category, priority, messageNumber, createdAt } = contactData;
    
    return `
🔔 رسالة جديدة من العميل - ميزون دارين

رقم الرسالة: ${messageNumber}
اسم العميل: ${customerInfo.firstName} ${customerInfo.lastName}
البريد الإلكتروني: ${customerInfo.email}
رقم الهاتف: ${customerInfo.phone || 'غير محدد'}${contactData.subject ? `
الموضوع: ${contactData.subject}` : ''}
التصنيف: ${this.getCategoryName(category)}
الأولوية: ${this.getPriorityName(priority)}
وقت الإرسال: ${new Date(createdAt).toLocaleString('ar-SA')}

نص الرسالة:
${message}

يرجى الرد على هذه الرسالة في أقرب وقت ممكن.
    `;
  }

  generateCustomerConfirmationText(contactData) {
    const { customerInfo, messageNumber, createdAt } = contactData;
    
    return `
✅ تم استلام رسالتك بنجاح - ميزون دارين

مرحباً ${customerInfo.firstName} ${customerInfo.lastName}،

شكراً لتواصلك مع ميزون دارين. لقد تم استلام رسالتك بنجاح.

تفاصيل الرسالة:
- رقم الرسالة: ${messageNumber}
- تاريخ الإرسال: ${new Date(createdAt).toLocaleString('ar-SA')}
- البريد الإلكتروني: ${customerInfo.email}

سيقوم فريقنا بمراجعة رسالتك والرد عليك خلال 24 ساعة.

للتواصل السريع:
📧 info@maison-darin.com
📱 +966 50 123 4567

مع تحيات فريق ميزون دارين
    `;
  }

  /**
   * Helper methods
   */
  getCategoryName(category) {
    const categories = {
      general: 'استفسار عام',
      product: 'استفسار عن منتج',
      support: 'دعم فني',
      complaint: 'شكوى',
      suggestion: 'اقتراح',
      partnership: 'شراكة'
    };
    return categories[category] || category;
  }

  getPriorityName(priority) {
    const priorities = {
      low: 'منخفضة',
      medium: 'متوسطة',
      high: 'عالية',
      urgent: 'عاجلة'
    };
    return priorities[priority] || priority;
  }

  /**
   * Send test email
   */
  async sendTestEmail(toEmail) {
    try {
      // Ensure we have valid settings
      if (!this.settings || !this.settings.adminEmail) {
        throw new Error('Email settings not configured');
      }
      
      const mailOptions = {
        from: `"${this.settings.fromName || 'ميزون دارين'}" <${this.settings.fromEmail || this.settings.adminEmail}>`,
        to: toEmail,
        subject: '🧪 اختبار إعدادات البريد الإلكتروني - ميزون دارين',
        html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>اختبار البريد الإلكتروني</title>
            <style>
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 20px;
                    direction: rtl;
                }
                .container {
                    max-width: 500px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 15px;
                    padding: 30px;
                    text-align: center;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                }
                .success-icon {
                    font-size: 48px;
                    margin-bottom: 20px;
                }
                h1 {
                    color: #2d3748;
                    margin-bottom: 15px;
                }
                p {
                    color: #4a5568;
                    line-height: 1.6;
                    margin-bottom: 15px;
                }
                .footer {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #e2e8f0;
                    font-size: 14px;
                    color: #718096;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="success-icon">✅</div>
                <h1>تم الاختبار بنجاح!</h1>
                <p>
                    تهانينا! إعدادات البريد الإلكتروني تعمل بشكل صحيح.
                </p>
                <p>
                    يمكنك الآن استقبال رسائل العملاء وإرسال الردود التلقائية.
                </p>
                <div class="footer">
                    <p><strong>🌸 ميزون دارين</strong></p>
                    <p>نظام إدارة البريد الإلكتروني</p>
                </div>
            </div>
        </body>
        </html>`,
        text: `
✅ تم الاختبار بنجاح!

تهانينا! إعدادات البريد الإلكتروني تعمل بشكل صحيح.
يمكنك الآن استقبال رسائل العملاء وإرسال الردود التلقائية.

🌸 ميزون دارين
نظام إدارة البريد الإلكتروني
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Test email sent successfully', {
        messageId: result.messageId,
        toEmail
      });

      return result;
    } catch (error) {
      logger.error('Failed to send test email:', error);
      throw error;
    }
  }

  /**
   * Send payment confirmation email to customer
   */
  async sendPaymentConfirmationEmail(paymentData) {
    try {
      const settings = await this.getEmailSettings();
      
      if (!settings.enabled) {
        logger.info('Email service is disabled');
        return;
      }

      await this.ensureTransporter();

      const customerEmailHtml = this.generatePaymentConfirmationEmail(paymentData);

      // Send to customer
      const customerMailOptions = {
        from: `"${settings.fromName}" <${settings.fromEmail}>`,
        to: paymentData.customerEmail,
        subject: `تأكيد الدفع - طلب رقم ${paymentData.orderNumber}`,
        html: customerEmailHtml
      };

      await this.transporter.sendMail(customerMailOptions);
      logger.info('Payment confirmation email sent to customer:', paymentData.customerEmail);

      // Send notification to admin
      const adminEmailHtml = this.generatePaymentNotificationEmail(paymentData);
      
      const adminMailOptions = {
        from: `"${settings.fromName}" <${settings.fromEmail}>`,
        to: settings.adminEmail,
        subject: `💰 دفعة جديدة - طلب رقم ${paymentData.orderNumber}`,
        html: adminEmailHtml
      };

      await this.transporter.sendMail(adminMailOptions);
      logger.info('Payment notification sent to admin:', settings.adminEmail);

    } catch (error) {
      logger.error('Error sending payment confirmation email:', error);
      throw error;
    }
  }

  /**
   * Generate payment confirmation email HTML for customer
   */
  generatePaymentConfirmationEmail(paymentData) {
    const itemsHtml = paymentData.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          ${item.name?.ar || item.name || 'منتج'}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
          $${item.price}
        </td>
      </tr>
    `).join('');

    return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تأكيد الدفع</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 20px;
                direction: rtl;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .success-icon {
                font-size: 48px;
                margin-bottom: 15px;
            }
            .content {
                padding: 30px;
            }
            .order-info {
                background: #f0fdf4;
                border-radius: 15px;
                padding: 20px;
                margin-bottom: 25px;
                border-right: 4px solid #10b981;
            }
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }
            .items-table th {
                background: #f8fafc;
                padding: 12px;
                text-align: right;
                border-bottom: 2px solid #e2e8f0;
            }
            .footer {
                background: #f8fafc;
                padding: 20px;
                text-align: center;
                color: #64748b;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="success-icon">✅</div>
                <h1>تم الدفع بنجاح!</h1>
                <p>شكراً لك على ثقتك في ميزون دارين</p>
            </div>
            
            <div class="content">
                <div class="order-info">
                    <h3 style="color: #059669; margin-bottom: 15px;">تفاصيل الطلب</h3>
                    <p><strong>رقم الطلب:</strong> ${paymentData.orderNumber}</p>
                    <p><strong>رقم PayPal:</strong> ${paymentData.paypalOrderId}</p>
                    <p><strong>المبلغ المدفوع:</strong> ${paymentData.amount} ${paymentData.currency}</p>
                    <p><strong>تاريخ الدفع:</strong> ${new Date().toLocaleDateString('ar-SA')}</p>
                </div>

                ${paymentData.items.length > 0 ? `
                <h3 style="margin-bottom: 15px;">المنتجات المطلوبة:</h3>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>المنتج</th>
                            <th>الكمية</th>
                            <th>السعر</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
                ` : ''}

                <div style="background: #fef3c7; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <h4 style="color: #92400e; margin-bottom: 10px;">الخطوات التالية:</h4>
                    <ul style="color: #92400e; padding-right: 20px;">
                        <li>سيتم تحضير طلبك خلال 1-2 يوم عمل</li>
                        <li>سيتم التواصل معك لتأكيد موعد التسليم</li>
                        <li>يمكنك تتبع حالة الطلب من خلال رقم الطلب</li>
                    </ul>
                </div>
            </div>
            
            <div class="footer">
                <p>ميزون دارين - عطور فاخرة</p>
                <p>للاستفسارات: maisondarin2025@gmail.com</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate payment notification email HTML for admin
   */
  generatePaymentNotificationEmail(paymentData) {
    const itemsHtml = paymentData.items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">
          ${item.name?.ar || item.name || 'منتج'}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">
          $${item.price}
        </td>
      </tr>
    `).join('');

    return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>إشعار دفعة جديدة</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: #f1f5f9;
                padding: 20px;
                direction: rtl;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                color: white;
                padding: 25px;
                text-align: center;
            }
            .content {
                padding: 25px;
            }
            .payment-info {
                background: #fef3c7;
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 20px;
                border-right: 4px solid #f59e0b;
            }
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin: 15px 0;
            }
            .items-table th {
                background: #f8fafc;
                padding: 10px;
                text-align: right;
                border-bottom: 2px solid #e2e8f0;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>💰 دفعة جديدة!</h1>
                <p>تم استلام دفعة جديدة من العميل</p>
            </div>
            
            <div class="content">
                <div class="payment-info">
                    <h3 style="color: #d97706; margin-bottom: 15px;">تفاصيل الدفعة</h3>
                    <p><strong>رقم الطلب:</strong> ${paymentData.orderNumber}</p>
                    <p><strong>بريد العميل:</strong> ${paymentData.customerEmail}</p>
                    <p><strong>رقم PayPal:</strong> ${paymentData.paypalOrderId}</p>
                    <p><strong>المبلغ:</strong> ${paymentData.amount} ${paymentData.currency}</p>
                    <p><strong>وقت الدفع:</strong> ${new Date().toLocaleString('ar-SA')}</p>
                </div>

                ${paymentData.items.length > 0 ? `
                <h3 style="margin-bottom: 15px;">المنتجات:</h3>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>المنتج</th>
                            <th>الكمية</th>
                            <th>السعر</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
                ` : ''}

                <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin-top: 20px;">
                    <p style="color: #1e40af; margin: 0;">
                        <strong>إجراء مطلوب:</strong> يرجى تحضير الطلب والتواصل مع العميل لتأكيد التسليم.
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Send order confirmation email to customer
   */
  async sendOrderConfirmation(order) {
    try {
      if (!this.transporter) {
        await this.initializeTransporter();
      }

      const mailOptions = {
        from: {
          name: 'ميزون دارين - Maison Darin',
          address: this.settings.adminEmail || 'maisondarin2025@gmail.com'
        },
        to: order.customerInfo.email,
        subject: `تأكيد طلبك رقم ${order.orderNumber} - Maison Darin`,
        html: this.generateOrderConfirmationHTML(order)
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Order confirmation email sent to ${order.customerInfo.email}`, {
        orderNumber: order.orderNumber,
        messageId: result.messageId
      });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error('Failed to send order confirmation email:', error);
      throw error;
    }
  }

  /**
   * Generate order confirmation email HTML
   */
  generateOrderConfirmationHTML(order) {
    const customerName = `${order.customerInfo.firstName} ${order.customerInfo.lastName}`;
    const orderDate = new Date(order.orderDate).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <div style="display: flex; align-items: center; gap: 10px;">
            ${item.productImage ? `<img src="${item.productImage}" alt="${item.productName}" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;">` : ''}
            <span style="font-weight: 500;">${item.productName}</span>
          </div>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.price} ج.م</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: 600;">${item.subtotal} ج.م</td>
      </tr>
    `).join('');

    const paymentStatusArabic = {
      'pending': 'في انتظار الدفع',
      'paid': 'تم الدفع',
      'failed': 'فشل الدفع',
      'refunded': 'مُسترد'
    };

    const orderStatusArabic = {
      'pending': 'قيد المراجعة',
      'confirmed': 'مؤكد',
      'processing': 'قيد التحضير',
      'shipped': 'تم الشحن',
      'delivered': 'تم التسليم',
      'cancelled': 'ملغي'
    };

    const paymentMethodArabic = {
      'cash_on_delivery': 'الدفع عند الاستلام',
      'bank_transfer': 'تحويل بنكي',
      'credit_card': 'بطاقة ائتمان',
      'paypal': 'PayPal'
    };

    return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تأكيد طلبك - ميزون دارين</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                padding: 20px;
                direction: rtl;
                line-height: 1.6;
            }
            .container {
                max-width: 650px;
                margin: 0 auto;
                background: white;
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #d4af37 0%, #b8860b 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }
            .header h1 {
                font-size: 32px;
                margin-bottom: 10px;
                font-weight: 700;
            }
            .header .order-number {
                font-size: 20px;
                background: rgba(255,255,255,0.2);
                padding: 10px 20px;
                border-radius: 25px;
                display: inline-block;
                margin-top: 15px;
            }
            .content {
                padding: 40px 30px;
            }
            .greeting {
                font-size: 18px;
                margin-bottom: 25px;
                color: #374151;
            }
            .order-details {
                background: #f9fafb;
                border-radius: 15px;
                padding: 25px;
                margin-bottom: 30px;
                border: 1px solid #e5e7eb;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid #e5e7eb;
            }
            .detail-row:last-child {
                border-bottom: none;
            }
            .detail-label {
                font-weight: 600;
                color: #374151;
            }
            .detail-value {
                color: #6b7280;
            }
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                background: white;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .items-table th {
                background: #d4af37;
                color: white;
                padding: 15px 12px;
                text-align: center;
                font-weight: 600;
            }
            .items-table td {
                padding: 12px;
                border-bottom: 1px solid #e5e7eb;
                text-align: center;
            }
            .total-section {
                background: #f0f9ff;
                border: 2px solid #0ea5e9;
                border-radius: 15px;
                padding: 20px;
                margin: 25px 0;
                text-align: center;
            }
            .total-amount {
                font-size: 28px;
                font-weight: 700;
                color: #0369a1;
                margin-bottom: 5px;
            }
            .payment-status {
                display: inline-block;
                padding: 8px 16px;
                border-radius: 20px;
                font-weight: 600;
                margin: 10px 0;
            }
            .status-pending { background: #fef3c7; color: #92400e; }
            .status-paid { background: #d1fae5; color: #047857; }
            .status-failed { background: #fee2e2; color: #dc2626; }
            .footer {
                background: #f9fafb;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
            }
            .contact-info {
                margin: 20px 0;
                color: #6b7280;
            }
            .social-links {
                margin-top: 20px;
            }
            .social-links a {
                display: inline-block;
                margin: 0 10px;
                color: #d4af37;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🌸 ميزون دارين</h1>
                <p>شكراً لك على طلبك!</p>
                <div class="order-number">
                    رقم الطلب: ${order.orderNumber}
                </div>
            </div>

            <div class="content">
                <div class="greeting">
                    مرحباً ${customerName}، 👋
                    <br><br>
                    تم استلام طلبك بنجاح وسيتم معالجته في أقرب وقت ممكن.
                </div>

                <div class="order-details">
                    <h3 style="margin-bottom: 20px; color: #d4af37;">تفاصيل الطلب:</h3>
                    
                    <div class="detail-row">
                        <span class="detail-label">📅 تاريخ الطلب:</span>
                        <span class="detail-value">${orderDate}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">💳 طريقة الدفع:</span>
                        <span class="detail-value">${paymentMethodArabic[order.paymentMethod] || order.paymentMethod}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">📍 عنوان التسليم:</span>
                        <span class="detail-value">${order.customerInfo.address}, ${order.customerInfo.city}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">📱 رقم الهاتف:</span>
                        <span class="detail-value">${order.customerInfo.phone}</span>
                    </div>
                </div>

                <h3 style="margin: 25px 0 15px 0; color: #374151;">المنتجات المطلوبة:</h3>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>المنتج</th>
                            <th>الكمية</th>
                            <th>سعر الوحدة</th>
                            <th>المجموع</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                <div class="total-section">
                    <div style="color: #6b7280; margin-bottom: 10px;">المبلغ الإجمالي:</div>
                    <div class="total-amount">${order.total} جنيه مصري</div>
                    
                    <div class="payment-status status-${order.paymentStatus}">
                        حالة الدفع: ${paymentStatusArabic[order.paymentStatus] || order.paymentStatus}
                    </div>
                    <br>
                    <div class="payment-status status-${order.status}">
                        حالة الطلب: ${orderStatusArabic[order.status] || order.status}
                    </div>
                </div>

                <div style="background: #fef7cd; border: 1px solid #f59e0b; border-radius: 10px; padding: 20px; margin: 25px 0;">
                    <h4 style="color: #92400e; margin-bottom: 10px;">📋 ما التالي؟</h4>
                    <ul style="color: #92400e; margin-right: 20px;">
                        <li>سيتم التواصل معك قريباً لتأكيد الطلب</li>
                        <li>يتم تحضير طلبك خلال 1-2 يوم عمل</li>
                        <li>ستصلك رسالة عند شحن الطلب</li>
                        ${order.paymentMethod === 'cash_on_delivery' ? '<li>الدفع عند استلام الطلب</li>' : ''}
                    </ul>
                </div>
            </div>

            <div class="footer">
                <h3 style="color: #d4af37; margin-bottom: 15px;">تواصل معنا</h3>
                <div class="contact-info">
                    📧 maisondarin2025@gmail.com<br>
                    📱 للاستفسارات: اتصل بنا عبر الواتساب<br>
                    🌐 www.maisondarin.com
                </div>
                
                <p style="margin-top: 20px; color: #9ca3af; font-size: 14px;">
                    شكراً لاختيارك ميزون دارين لعطورك المميزة 🌹
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Send order status update email to customer
   */
  async sendOrderStatusUpdate(order, newStatus) {
    try {
      if (!this.transporter) {
        await this.initializeTransporter();
      }

      const statusMessages = {
        'confirmed': {
          subject: `تم تأكيد طلبك رقم ${order.orderNumber} - Maison Darin`,
          title: '✅ تم تأكيد طلبك',
          message: 'تم تأكيد طلبك وسيتم تحضيره قريباً'
        },
        'processing': {
          subject: `جاري تحضير طلبك رقم ${order.orderNumber} - Maison Darin`,
          title: '🔄 جاري تحضير طلبك',
          message: 'نحن نعمل على تحضير طلبك الآن'
        },
        'shipped': {
          subject: `تم شحن طلبك رقم ${order.orderNumber} - Maison Darin`,
          title: '🚚 تم شحن طلبك',
          message: 'تم شحن طلبك وسيصل إليك قريباً'
        },
        'delivered': {
          subject: `تم تسليم طلبك رقم ${order.orderNumber} - Maison Darin`,
          title: '🎉 تم تسليم طلبك',
          message: 'تم تسليم طلبك بنجاح، نتمنى أن تكون راضياً عن منتجاتنا'
        }
      };

      const statusInfo = statusMessages[newStatus];
      if (!statusInfo) return;

      const customerName = `${order.customerInfo.firstName} ${order.customerInfo.lastName}`;

      const mailOptions = {
        from: {
          name: 'ميزون دارين - Maison Darin',
          address: this.settings.adminEmail || 'maisondarin2025@gmail.com'
        },
        to: order.customerInfo.email,
        subject: statusInfo.subject,
        html: this.generateStatusUpdateHTML(order, customerName, statusInfo)
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Order status update email sent to ${order.customerInfo.email}`, {
        orderNumber: order.orderNumber,
        newStatus,
        messageId: result.messageId
      });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error('Failed to send order status update email:', error);
      throw error;
    }
  }

  /**
   * Generate status update email HTML
   */
  generateStatusUpdateHTML(order, customerName, statusInfo) {
    return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تحديث الطلب - ميزون دارين</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                padding: 20px;
                direction: rtl;
                line-height: 1.6;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #d4af37 0%, #b8860b 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                font-size: 28px;
                margin-bottom: 10px;
                font-weight: 700;
            }
            .status-badge {
                background: rgba(255,255,255,0.2);
                padding: 10px 20px;
                border-radius: 25px;
                display: inline-block;
                margin-top: 15px;
                font-size: 18px;
            }
            .content {
                padding: 30px;
                text-align: center;
            }
            .status-icon {
                font-size: 60px;
                margin-bottom: 20px;
            }
            .message {
                font-size: 18px;
                color: #374151;
                margin-bottom: 30px;
            }
            .order-info {
                background: #f9fafb;
                border-radius: 10px;
                padding: 20px;
                margin: 20px 0;
                text-align: right;
            }
            .info-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #e5e7eb;
            }
            .info-row:last-child { border-bottom: none; }
            .info-label { font-weight: 600; color: #374151; }
            .info-value { color: #6b7280; }
            .footer {
                background: #f9fafb;
                padding: 20px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🌸 ميزون دارين</h1>
                <div class="status-badge">
                    ${statusInfo.title}
                </div>
            </div>

            <div class="content">
                <div class="message">
                    مرحباً ${customerName}، 👋
                    <br><br>
                    ${statusInfo.message}
                </div>

                <div class="order-info">
                    <div class="info-row">
                        <span class="info-label">رقم الطلب:</span>
                        <span class="info-value">${order.orderNumber}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">المبلغ الإجمالي:</span>
                        <span class="info-value">${order.total} جنيه مصري</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">تاريخ الطلب:</span>
                        <span class="info-value">${new Date(order.orderDate).toLocaleDateString('ar-EG')}</span>
                    </div>
                    ${order.trackingNumber ? `
                    <div class="info-row">
                        <span class="info-label">رقم التتبع:</span>
                        <span class="info-value">${order.trackingNumber}</span>
                    </div>
                    ` : ''}
                </div>

                <p style="color: #6b7280; margin-top: 20px;">
                    شكراً لاختيارك ميزون دارين 🌹
                </p>
            </div>

            <div class="footer">
                تواصل معنا: maisondarin2025@gmail.com
                <br>
                للاستفسارات: اتصل بنا عبر الواتساب
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration() {
    try {
      await this.transporter.verify();
      logger.info('Email configuration is valid');
      return true;
    } catch (error) {
      logger.error('Email configuration test failed:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
