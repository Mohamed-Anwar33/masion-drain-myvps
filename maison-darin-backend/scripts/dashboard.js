#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

class MonitoringDashboard {
  constructor() {
    this.apiUrl = `http://localhost:${process.env.PORT || 5000}`;
    this.refreshInterval = 5000; // 5 seconds
    this.isRunning = false;
  }

  async fetchHealthData() {
    return new Promise((resolve, reject) => {
      const req = http.get(`${this.apiUrl}/api/health/detailed`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error('Invalid JSON response'));
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  async fetchMetrics() {
    return new Promise((resolve, reject) => {
      const req = http.get(`${this.apiUrl}/api/health/metrics`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error('Invalid JSON response'));
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  clearScreen() {
    process.stdout.write('\x1b[2J\x1b[0f');
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  getStatusColor(status) {
    const colors = {
      healthy: '\x1b[32m',    // Green
      unhealthy: '\x1b[31m',  // Red
      warning: '\x1b[33m',    // Yellow
      error: '\x1b[31m',      // Red
      info: '\x1b[36m'        // Cyan
    };
    return colors[status] || '\x1b[0m';
  }

  getProgressBar(percentage, width = 20) {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    
    let color = '\x1b[32m'; // Green
    if (percentage > 80) color = '\x1b[31m'; // Red
    else if (percentage > 60) color = '\x1b[33m'; // Yellow
    
    return `${color}${'█'.repeat(filled)}${'░'.repeat(empty)}\x1b[0m ${percentage.toFixed(1)}%`;
  }

  renderDashboard(healthData, metricsData) {
    const timestamp = new Date().toLocaleString();
    
    console.log('\x1b[1m╔══════════════════════════════════════════════════════════════════════════════╗\x1b[0m');
    console.log('\x1b[1m║                          MAISON DARIN API DASHBOARD                          ║\x1b[0m');
    console.log('\x1b[1m╚══════════════════════════════════════════════════════════════════════════════╝\x1b[0m');
    console.log(`\x1b[90mLast Updated: ${timestamp}\x1b[0m\n`);

    // System Status
    if (healthData.success) {
      const health = healthData.data;
      const statusColor = this.getStatusColor(health.status);
      
      console.log('\x1b[1m🖥️  SYSTEM STATUS\x1b[0m');
      console.log(`   Status: ${statusColor}${health.status.toUpperCase()}\x1b[0m`);
      console.log(`   Response Time: ${health.responseTime}ms`);
      console.log(`   Uptime: ${this.formatUptime(health.services.system.uptime)}`);
      console.log(`   Environment: ${health.environment}\n`);

      // System Resources
      console.log('\x1b[1m📊 SYSTEM RESOURCES\x1b[0m');
      const cpu = health.services.system.cpu?.usage ? 
        (health.services.system.cpu.usage.user + health.services.system.cpu.usage.system) / 1000000 : 0;
      const memory = health.services.system.memory;
      
      if (memory) {
        const memUsedGB = memory.used / 1024 / 1024 / 1024;
        const memTotalGB = memory.total / 1024 / 1024 / 1024;
        const memPercentage = (memory.used / memory.total) * 100;
        
        console.log(`   Memory: ${this.getProgressBar(memPercentage)}`);
        console.log(`           ${memUsedGB.toFixed(2)}GB / ${memTotalGB.toFixed(2)}GB`);
      }
      
      if (health.services.system.loadAverage) {
        console.log(`   Load Avg: ${health.services.system.loadAverage.map(l => l.toFixed(2)).join(', ')}`);
      }
      
      console.log();

      // Database Status
      console.log('\x1b[1m🗄️  DATABASE STATUS\x1b[0m');
      const dbHealth = health.services.database.health;
      const dbStatusColor = this.getStatusColor(dbHealth.status);
      
      console.log(`   Status: ${dbStatusColor}${dbHealth.status.toUpperCase()}\x1b[0m`);
      if (dbHealth.responseTime) {
        console.log(`   Response Time: ${dbHealth.responseTime}ms`);
      }
      
      if (dbHealth.circuitBreaker) {
        const cbColor = dbHealth.circuitBreaker.state === 'CLOSED' ? '\x1b[32m' : '\x1b[31m';
        console.log(`   Circuit Breaker: ${cbColor}${dbHealth.circuitBreaker.state}\x1b[0m`);
        if (dbHealth.circuitBreaker.failures > 0) {
          console.log(`   Failures: ${dbHealth.circuitBreaker.failures}`);
        }
      }
      
      console.log();
    } else {
      console.log('\x1b[31m❌ SYSTEM UNAVAILABLE\x1b[0m');
      console.log(`   Error: ${healthData.error?.message || 'Unknown error'}\n`);
    }

    // Performance Metrics
    if (metricsData?.success) {
      const metrics = metricsData.data;
      
      console.log('\x1b[1m📈 PERFORMANCE METRICS\x1b[0m');
      
      if (metrics.summary?.requests) {
        const requests = metrics.summary.requests;
        console.log(`   Total Requests: ${requests.total}`);
        console.log(`   Success Rate: ${requests.successRate}`);
        console.log(`   Avg Response: ${requests.averageResponseTime}`);
        console.log(`   P95 Response: ${requests.p95ResponseTime}`);
        console.log(`   P99 Response: ${requests.p99ResponseTime}`);
      }
      
      if (metrics.summary?.database) {
        const db = metrics.summary.database;
        console.log(`   DB Queries: ${db.totalQueries}`);
        console.log(`   Avg Query Time: ${db.averageQueryTime}`);
        console.log(`   P95 Query Time: ${db.p95QueryTime}`);
      }
      
      if (metrics.summary?.errors) {
        const errors = metrics.summary.errors;
        console.log(`   Total Errors: ${errors.total}`);
        console.log(`   Error Rate: ${errors.errorRate}`);
      }
      
      console.log();

      // Recent Alerts
      if (metrics.alerts?.last24Hours > 0) {
        console.log('\x1b[1m🚨 RECENT ALERTS (24h)\x1b[0m');
        console.log(`   Total: ${metrics.alerts.last24Hours}`);
        console.log(`   Last Hour: ${metrics.alerts.lastHour}`);
        
        if (metrics.alerts.bySeverity) {
          Object.entries(metrics.alerts.bySeverity).forEach(([severity, count]) => {
            const color = this.getStatusColor(severity);
            console.log(`   ${color}${severity.toUpperCase()}: ${count}\x1b[0m`);
          });
        }
        
        console.log();
      }
    }

    // Instructions
    console.log('\x1b[90m─────────────────────────────────────────────────────────────────────────────\x1b[0m');
    console.log('\x1b[90mPress Ctrl+C to exit | Refreshes every 5 seconds\x1b[0m');
  }

  async displaySnapshot() {
    try {
      console.log('Fetching system data...\n');
      
      const [healthData, metricsData] = await Promise.allSettled([
        this.fetchHealthData(),
        this.fetchMetrics()
      ]);
      
      this.clearScreen();
      this.renderDashboard(
        healthData.status === 'fulfilled' ? healthData.value : { success: false, error: healthData.reason },
        metricsData.status === 'fulfilled' ? metricsData.value : null
      );
      
    } catch (error) {
      console.error('❌ Failed to fetch dashboard data:', error.message);
    }
  }

  async startLiveDashboard() {
    this.isRunning = true;
    
    console.log('🚀 Starting Maison Darin API Dashboard...\n');
    
    // Initial display
    await this.displaySnapshot();
    
    // Set up refresh interval
    const interval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(interval);
        return;
      }
      
      await this.displaySnapshot();
    }, this.refreshInterval);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      this.isRunning = false;
      clearInterval(interval);
      console.log('\n\n👋 Dashboard stopped');
      process.exit(0);
    });
    
    // Keep process alive
    process.stdin.resume();
  }

  async generateReport() {
    try {
      console.log('📊 Generating system report...\n');
      
      const [healthData, metricsData] = await Promise.allSettled([
        this.fetchHealthData(),
        this.fetchMetrics()
      ]);
      
      const timestamp = new Date().toISOString();
      const report = {
        timestamp,
        health: healthData.status === 'fulfilled' ? healthData.value : { error: healthData.reason?.message },
        metrics: metricsData.status === 'fulfilled' ? metricsData.value : { error: metricsData.reason?.message }
      };
      
      // Save report to file
      const reportPath = path.join(__dirname, '../logs', `system-report-${timestamp.replace(/[:.]/g, '-')}.json`);
      
      // Ensure logs directory exists
      const logsDir = path.dirname(reportPath);
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      
      console.log(`✅ Report saved to: ${reportPath}`);
      console.log('\n📋 SYSTEM REPORT SUMMARY');
      console.log('─'.repeat(50));
      
      if (report.health.success) {
        const health = report.health.data;
        console.log(`System Status: ${health.status.toUpperCase()}`);
        console.log(`Response Time: ${health.responseTime}ms`);
        console.log(`Uptime: ${this.formatUptime(health.services.system.uptime)}`);
        console.log(`Database: ${health.services.database.health.status.toUpperCase()}`);
      } else {
        console.log('❌ System health check failed');
      }
      
      if (report.metrics.success) {
        const summary = report.metrics.data.summary;
        if (summary?.requests) {
          console.log(`Total Requests: ${summary.requests.total}`);
          console.log(`Success Rate: ${summary.requests.successRate}`);
          console.log(`Avg Response: ${summary.requests.averageResponseTime}`);
        }
        if (summary?.errors) {
          console.log(`Error Rate: ${summary.errors.errorRate}`);
        }
      }
      
      return reportPath;
      
    } catch (error) {
      console.error('❌ Failed to generate report:', error.message);
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const dashboard = new MonitoringDashboard();

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Maison Darin Monitoring Dashboard

Usage: node scripts/dashboard.js [command] [options]

Commands:
  live                Start live dashboard (default)
  snapshot            Show single snapshot of system status
  report              Generate detailed system report
  help                Show this help message

Options:
  --refresh <seconds> Set refresh interval for live dashboard (default: 5)

Examples:
  node scripts/dashboard.js                    # Start live dashboard
  node scripts/dashboard.js live               # Start live dashboard
  node scripts/dashboard.js snapshot          # Single snapshot
  node scripts/dashboard.js report            # Generate report
  node scripts/dashboard.js live --refresh 10 # Refresh every 10 seconds
    `);
    return;
  }

  const command = args[0] || 'live';
  
  // Handle refresh interval option
  const refreshIndex = args.indexOf('--refresh');
  if (refreshIndex !== -1) {
    const refreshSeconds = parseInt(args[refreshIndex + 1]);
    if (refreshSeconds && refreshSeconds > 0) {
      dashboard.refreshInterval = refreshSeconds * 1000;
    }
  }
  
  try {
    switch (command) {
      case 'live':
        await dashboard.startLiveDashboard();
        break;
        
      case 'snapshot':
        await dashboard.displaySnapshot();
        break;
        
      case 'report':
        await dashboard.generateReport();
        break;
        
      default:
        console.error(`Unknown command: ${command}`);
        console.log('Use --help for usage information');
        process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Dashboard failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = MonitoringDashboard;