#!/usr/bin/env node

const os = require('os');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

class SystemMonitor {
  constructor() {
    this.thresholds = {
      cpu: 80,        // CPU usage percentage
      memory: 85,     // Memory usage percentage
      disk: 90,       // Disk usage percentage
      responseTime: 5000  // Response time in ms
    };
    
    this.logFile = path.join(__dirname, '../logs/monitor.log');
    this.alertFile = path.join(__dirname, '../logs/alerts.log');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}\n`;
    
    console.log(logEntry.trim());
    
    // Write to log file
    fs.appendFileSync(this.logFile, logEntry);
    
    // Write alerts to separate file
    if (type === 'alert' || type === 'error') {
      fs.appendFileSync(this.alertFile, logEntry);
    }
  }

  async checkSystemHealth() {
    const health = {
      timestamp: new Date().toISOString(),
      cpu: this.getCPUUsage(),
      memory: this.getMemoryUsage(),
      disk: this.getDiskUsage(),
      uptime: os.uptime(),
      loadAverage: os.loadavg(),
      processes: await this.checkProcesses(),
      database: await this.checkDatabase(),
      api: await this.checkAPI(),
      status: 'healthy'
    };

    // Check thresholds
    const alerts = [];
    
    if (health.cpu > this.thresholds.cpu) {
      alerts.push(`High CPU usage: ${health.cpu}%`);
    }
    
    if (health.memory.percentage > this.thresholds.memory) {
      alerts.push(`High memory usage: ${health.memory.percentage}%`);
    }
    
    if (health.disk.percentage > this.thresholds.disk) {
      alerts.push(`High disk usage: ${health.disk.percentage}%`);
    }
    
    if (health.api.responseTime > this.thresholds.responseTime) {
      alerts.push(`Slow API response: ${health.api.responseTime}ms`);
    }
    
    if (!health.database.connected) {
      alerts.push('Database connection failed');
    }
    
    if (!health.api.healthy) {
      alerts.push('API health check failed');
    }

    if (alerts.length > 0) {
      health.status = 'warning';
      health.alerts = alerts;
      
      alerts.forEach(alert => {
        this.log(alert, 'alert');
      });
    }

    return health;
  }

  getCPUUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);

    return usage;
  }

  getMemoryUsage() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const percentage = Math.round((used / total) * 100);

    return {
      total: Math.round(total / 1024 / 1024), // MB
      used: Math.round(used / 1024 / 1024),   // MB
      free: Math.round(free / 1024 / 1024),   // MB
      percentage
    };
  }

  getDiskUsage() {
    try {
      const output = execSync('df -h /', { encoding: 'utf8' });
      const lines = output.trim().split('\n');
      const data = lines[1].split(/\s+/);
      
      return {
        total: data[1],
        used: data[2],
        available: data[3],
        percentage: parseInt(data[4])
      };
    } catch (error) {
      return {
        total: 'unknown',
        used: 'unknown',
        available: 'unknown',
        percentage: 0
      };
    }
  }

  async checkProcesses() {
    try {
      // Check if PM2 processes are running
      const pm2Output = execSync('pm2 jlist', { encoding: 'utf8' });
      const processes = JSON.parse(pm2Output);
      
      const maisonDarinProcess = processes.find(p => p.name === 'maison-darin-api');
      
      if (maisonDarinProcess) {
        return {
          pm2: true,
          status: maisonDarinProcess.pm2_env.status,
          uptime: maisonDarinProcess.pm2_env.pm_uptime,
          restarts: maisonDarinProcess.pm2_env.restart_time,
          memory: Math.round(maisonDarinProcess.monit.memory / 1024 / 1024), // MB
          cpu: maisonDarinProcess.monit.cpu
        };
      } else {
        return {
          pm2: false,
          status: 'not found'
        };
      }
    } catch (error) {
      // Check if process is running without PM2
      try {
        execSync('pgrep -f "node.*server.js"', { encoding: 'utf8' });
        return {
          pm2: false,
          status: 'running',
          note: 'Running without PM2'
        };
      } catch (e) {
        return {
          pm2: false,
          status: 'not running'
        };
      }
    }
  }

  async checkDatabase() {
    try {
      const mongoose = require('mongoose');
      
      // Set a timeout for the connection
      const connectionPromise = mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000
      });
      
      await connectionPromise;
      
      // Test a simple query
      const startTime = Date.now();
      await mongoose.connection.db.admin().ping();
      const responseTime = Date.now() - startTime;
      
      await mongoose.connection.close();
      
      return {
        connected: true,
        responseTime,
        status: 'healthy'
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
        status: 'error'
      };
    }
  }

  async checkAPI() {
    try {
      const startTime = Date.now();
      
      // Use curl to check health endpoint
      execSync('curl -f http://localhost:5000/health', { 
        encoding: 'utf8',
        timeout: 10000
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        healthy: true,
        responseTime,
        status: 'healthy'
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        status: 'error',
        responseTime: null
      };
    }
  }

  generateReport(health) {
    const report = `
=== System Health Report ===
Timestamp: ${health.timestamp}
Status: ${health.status.toUpperCase()}

CPU Usage: ${health.cpu}%
Memory Usage: ${health.memory.used}MB / ${health.memory.total}MB (${health.memory.percentage}%)
Disk Usage: ${health.disk.used} / ${health.disk.total} (${health.disk.percentage}%)
System Uptime: ${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m
Load Average: ${health.loadAverage.map(l => l.toFixed(2)).join(', ')}

Process Status: ${health.processes.status}
${health.processes.pm2 ? `PM2 Restarts: ${health.processes.restarts}` : ''}
${health.processes.memory ? `Process Memory: ${health.processes.memory}MB` : ''}

Database: ${health.database.connected ? 'Connected' : 'Disconnected'}
${health.database.responseTime ? `DB Response Time: ${health.database.responseTime}ms` : ''}

API Health: ${health.api.healthy ? 'Healthy' : 'Unhealthy'}
${health.api.responseTime ? `API Response Time: ${health.api.responseTime}ms` : ''}

${health.alerts ? `\nALERTS:\n${health.alerts.map(a => `- ${a}`).join('\n')}` : ''}
`;

    return report;
  }

  async sendAlert(message) {
    // In a real implementation, you would send emails, Slack messages, etc.
    this.log(`ALERT: ${message}`, 'alert');
    
    // Example: Send to webhook (uncomment and configure)
    /*
    try {
      const webhook = process.env.ALERT_WEBHOOK_URL;
      if (webhook) {
        const response = await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 Maison Darin Backend Alert: ${message}`,
            timestamp: new Date().toISOString()
          })
        });
      }
    } catch (error) {
      this.log(`Failed to send webhook alert: ${error.message}`, 'error');
    }
    */
  }

  async monitor() {
    try {
      this.log('Starting system health check...');
      
      const health = await this.checkSystemHealth();
      const report = this.generateReport(health);
      
      console.log(report);
      
      // Send alerts if needed
      if (health.alerts && health.alerts.length > 0) {
        for (const alert of health.alerts) {
          await this.sendAlert(alert);
        }
      }
      
      this.log('Health check completed');
      
      return health;
      
    } catch (error) {
      this.log(`Health check failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async startContinuousMonitoring(intervalMinutes = 5) {
    this.log(`Starting continuous monitoring (every ${intervalMinutes} minutes)...`);
    
    const interval = intervalMinutes * 60 * 1000;
    
    // Initial check
    await this.monitor();
    
    // Set up interval
    setInterval(async () => {
      try {
        await this.monitor();
      } catch (error) {
        this.log(`Monitoring error: ${error.message}`, 'error');
      }
    }, interval);
    
    // Keep the process running
    process.on('SIGINT', () => {
      this.log('Monitoring stopped by user');
      process.exit(0);
    });
    
    this.log('Continuous monitoring started. Press Ctrl+C to stop.');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const monitor = new SystemMonitor();

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Maison Darin System Monitor

Usage: node scripts/monitor.js [command] [options]

Commands:
  check               Run single health check
  watch               Start continuous monitoring
  help                Show this help message

Options:
  --interval <minutes>  Monitoring interval in minutes (default: 5)

Examples:
  node scripts/monitor.js check           # Single health check
  node scripts/monitor.js watch           # Continuous monitoring
  node scripts/monitor.js watch --interval 10  # Monitor every 10 minutes
    `);
    return;
  }

  const command = args[0] || 'check';
  
  switch (command) {
    case 'check':
      await monitor.monitor();
      break;
      
    case 'watch':
      const intervalIndex = args.indexOf('--interval');
      const interval = intervalIndex !== -1 ? parseInt(args[intervalIndex + 1]) || 5 : 5;
      await monitor.startContinuousMonitoring(interval);
      break;
      
    default:
      console.error(`Unknown command: ${command}`);
      console.log('Use --help for usage information');
      process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Monitor script failed:', error);
    process.exit(1);
  });
}

module.exports = SystemMonitor;