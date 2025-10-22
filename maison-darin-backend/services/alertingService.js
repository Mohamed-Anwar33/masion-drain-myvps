const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class AlertingService extends EventEmitter {
  constructor() {
    super();
    this.alertChannels = [];
    this.alertHistory = [];
    this.maxHistorySize = 1000;
    this.setupDefaultChannels();
  }

  /**
   * Setup default alert channels
   */
  setupDefaultChannels() {
    // File logging channel (always enabled)
    this.addChannel(new FileAlertChannel());
    
    // Console channel for development
    if (process.env.NODE_ENV === 'development') {
      this.addChannel(new ConsoleAlertChannel());
    }
    
    // Email channel if configured
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      this.addChannel(new EmailAlertChannel());
    }
    
    // Webhook channel if configured
    if (process.env.ALERT_WEBHOOK_URL) {
      this.addChannel(new WebhookAlertChannel());
    }
    
    // Slack channel if configured
    if (process.env.SLACK_WEBHOOK_URL) {
      this.addChannel(new SlackAlertChannel());
    }
  }

  /**
   * Add alert channel
   */
  addChannel(channel) {
    this.alertChannels.push(channel);
    logger.info(`Alert channel added: ${channel.constructor.name}`);
  }

  /**
   * Send alert through all configured channels
   */
  async sendAlert(alert) {
    try {
      // Add to history
      this.addToHistory(alert);
      
      // Send through all channels
      const promises = this.alertChannels.map(channel => 
        this.sendThroughChannel(channel, alert)
      );
      
      await Promise.allSettled(promises);
      
      logger.info('Alert sent through all channels', { 
        type: alert.type, 
        severity: alert.severity 
      });
      
    } catch (error) {
      logger.error('Failed to send alert', { 
        error: error.message, 
        alert: alert.type 
      });
    }
  }

  /**
   * Send alert through specific channel with error handling
   */
  async sendThroughChannel(channel, alert) {
    try {
      await channel.send(alert);
    } catch (error) {
      logger.error(`Failed to send alert through ${channel.constructor.name}`, {
        error: error.message,
        alert: alert.type
      });
    }
  }

  /**
   * Add alert to history
   */
  addToHistory(alert) {
    this.alertHistory.push({
      ...alert,
      id: this.generateAlertId(),
      receivedAt: new Date().toISOString()
    });
    
    // Maintain history size
    if (this.alertHistory.length > this.maxHistorySize) {
      this.alertHistory.shift();
    }
  }

  /**
   * Generate unique alert ID
   */
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit = 50, severity = null) {
    let history = [...this.alertHistory].reverse();
    
    if (severity) {
      history = history.filter(alert => alert.severity === severity);
    }
    
    return history.slice(0, limit);
  }

  /**
   * Get alert statistics
   */
  getAlertStats() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;
    
    const recentAlerts = this.alertHistory.filter(alert => 
      now - new Date(alert.timestamp).getTime() < oneDay
    );
    
    const hourlyAlerts = this.alertHistory.filter(alert => 
      now - new Date(alert.timestamp).getTime() < oneHour
    );
    
    const severityCounts = recentAlerts.reduce((counts, alert) => {
      counts[alert.severity] = (counts[alert.severity] || 0) + 1;
      return counts;
    }, {});
    
    const typeCounts = recentAlerts.reduce((counts, alert) => {
      counts[alert.type] = (counts[alert.type] || 0) + 1;
      return counts;
    }, {});
    
    return {
      total: this.alertHistory.length,
      last24Hours: recentAlerts.length,
      lastHour: hourlyAlerts.length,
      bySeverity: severityCounts,
      byType: typeCounts,
      channels: this.alertChannels.length
    };
  }
}

/**
 * Base alert channel class
 */
class AlertChannel {
  constructor(name) {
    this.name = name;
  }

  async send(alert) {
    throw new Error('send method must be implemented by subclass');
  }

  formatAlert(alert) {
    return {
      title: this.getAlertTitle(alert),
      message: this.getAlertMessage(alert),
      severity: alert.severity,
      timestamp: alert.timestamp
    };
  }

  getAlertTitle(alert) {
    const severityEmoji = {
      'info': 'ℹ️',
      'warning': '⚠️',
      'error': '❌',
      'critical': '🚨'
    };
    
    return `${severityEmoji[alert.severity] || '📢'} ${alert.type.replace(/_/g, ' ')}`;
  }

  getAlertMessage(alert) {
    let message = alert.message || 'No message provided';
    
    if (alert.current !== undefined && alert.threshold !== undefined) {
      message += `\nCurrent: ${alert.current}`;
      message += `\nThreshold: ${alert.threshold}`;
    }
    
    if (alert.context && Object.keys(alert.context).length > 0) {
      message += `\nContext: ${JSON.stringify(alert.context, null, 2)}`;
    }
    
    return message;
  }
}

/**
 * File alert channel
 */
class FileAlertChannel extends AlertChannel {
  constructor() {
    super('File');
    this.alertLogPath = path.join(__dirname, '../logs/alerts.log');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    const logDir = path.dirname(this.alertLogPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  async send(alert) {
    const formatted = this.formatAlert(alert);
    const logEntry = {
      timestamp: alert.timestamp,
      severity: alert.severity,
      type: alert.type,
      title: formatted.title,
      message: formatted.message,
      data: alert
    };
    
    fs.appendFileSync(
      this.alertLogPath, 
      JSON.stringify(logEntry) + '\n'
    );
  }
}

/**
 * Console alert channel
 */
class ConsoleAlertChannel extends AlertChannel {
  constructor() {
    super('Console');
  }

  async send(alert) {
    const formatted = this.formatAlert(alert);
    const color = this.getSeverityColor(alert.severity);
    
    console.log(`\n${color}${formatted.title}${this.colors.reset}`);
    console.log(`${formatted.message}\n`);
  }

  getSeverityColor(severity) {
    return this.colors[severity] || this.colors.reset;
  }

  get colors() {
    return {
      info: '\x1b[36m',     // Cyan
      warning: '\x1b[33m',  // Yellow
      error: '\x1b[31m',    // Red
      critical: '\x1b[41m', // Red background
      reset: '\x1b[0m'      // Reset
    };
  }
}

/**
 * Email alert channel
 */
class EmailAlertChannel extends AlertChannel {
  constructor() {
    super('Email');
    this.setupTransporter();
  }

  setupTransporter() {
    try {
      const nodemailer = require('nodemailer');
      
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } catch (error) {
      logger.warn('Email alerting not available - nodemailer not installed');
      this.transporter = null;
    }
  }

  async send(alert) {
    if (!this.transporter) {
      return;
    }

    const formatted = this.formatAlert(alert);
    const recipients = process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || [];
    
    if (recipients.length === 0) {
      return;
    }

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: recipients.join(','),
      subject: `[Maison Darin API] ${formatted.title}`,
      text: formatted.message,
      html: this.formatEmailHTML(formatted, alert)
    };

    await this.transporter.sendMail(mailOptions);
  }

  formatEmailHTML(formatted, alert) {
    const severityColor = {
      'info': '#17a2b8',
      'warning': '#ffc107',
      'error': '#dc3545',
      'critical': '#721c24'
    };

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <div style="background-color: ${severityColor[alert.severity]}; color: white; padding: 15px; border-radius: 5px 5px 0 0;">
          <h2 style="margin: 0;">${formatted.title}</h2>
        </div>
        <div style="border: 1px solid #ddd; border-top: none; padding: 20px; border-radius: 0 0 5px 5px;">
          <p><strong>Timestamp:</strong> ${alert.timestamp}</p>
          <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 3px; margin: 15px 0;">
            <pre style="margin: 0; white-space: pre-wrap;">${formatted.message}</pre>
          </div>
          <p style="color: #6c757d; font-size: 12px;">
            This alert was generated by the Maison Darin API monitoring system.
          </p>
        </div>
      </div>
    `;
  }
}

/**
 * Webhook alert channel
 */
class WebhookAlertChannel extends AlertChannel {
  constructor() {
    super('Webhook');
    this.webhookUrl = process.env.ALERT_WEBHOOK_URL;
  }

  async send(alert) {
    if (!this.webhookUrl) {
      return;
    }

    const formatted = this.formatAlert(alert);
    const payload = {
      alert_type: alert.type,
      severity: alert.severity,
      title: formatted.title,
      message: formatted.message,
      timestamp: alert.timestamp,
      data: alert
    };

    try {
      const fetch = require('node-fetch');
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      logger.error('Webhook alert failed', { error: error.message });
    }
  }
}

/**
 * Slack alert channel
 */
class SlackAlertChannel extends AlertChannel {
  constructor() {
    super('Slack');
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL;
  }

  async send(alert) {
    if (!this.webhookUrl) {
      return;
    }

    const formatted = this.formatAlert(alert);
    const color = this.getSeverityColor(alert.severity);
    
    const payload = {
      text: formatted.title,
      attachments: [{
        color: color,
        fields: [
          {
            title: 'Severity',
            value: alert.severity.toUpperCase(),
            short: true
          },
          {
            title: 'Timestamp',
            value: alert.timestamp,
            short: true
          },
          {
            title: 'Details',
            value: formatted.message,
            short: false
          }
        ]
      }]
    };

    try {
      const fetch = require('node-fetch');
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Slack webhook returned ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      logger.error('Slack alert failed', { error: error.message });
    }
  }

  getSeverityColor(severity) {
    const colors = {
      'info': '#36a64f',     // Green
      'warning': '#ff9500',  // Orange
      'error': '#ff0000',    // Red
      'critical': '#8B0000'  // Dark red
    };
    
    return colors[severity] || '#808080';
  }
}

// Create singleton instance
const alertingService = new AlertingService();

module.exports = alertingService;