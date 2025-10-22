#!/usr/bin/env node

const http = require('http');
const https = require('https');
const { URL } = require('url');
require('dotenv').config();

class DeploymentHealthCheck {
  constructor() {
    this.checks = [];
    this.results = [];
    this.timeout = 10000; // 10 seconds
  }

  addCheck(name, checkFunction, critical = true) {
    this.checks.push({
      name,
      checkFunction,
      critical
    });
  }

  async runCheck(check) {
    const startTime = Date.now();
    
    try {
      const result = await Promise.race([
        check.checkFunction(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Check timeout')), this.timeout)
        )
      ]);
      
      const duration = Date.now() - startTime;
      
      return {
        name: check.name,
        status: 'pass',
        critical: check.critical,
        duration,
        result,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        name: check.name,
        status: 'fail',
        critical: check.critical,
        duration,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async runAllChecks() {
    console.log('🔍 Running deployment health checks...\n');
    
    this.results = [];
    
    for (const check of this.checks) {
      process.stdout.write(`   ${check.name}... `);
      
      const result = await this.runCheck(check);
      this.results.push(result);
      
      if (result.status === 'pass') {
        console.log(`✅ PASS (${result.duration}ms)`);
      } else {
        console.log(`❌ FAIL (${result.duration}ms)`);
        if (result.error) {
          console.log(`      Error: ${result.error}`);
        }
      }
    }
    
    return this.generateReport();
  }

  generateReport() {
    const totalChecks = this.results.length;
    const passedChecks = this.results.filter(r => r.status === 'pass').length;
    const failedChecks = totalChecks - passedChecks;
    const criticalFailures = this.results.filter(r => r.status === 'fail' && r.critical).length;
    
    const overallStatus = criticalFailures > 0 ? 'CRITICAL' : 
                         failedChecks > 0 ? 'WARNING' : 'HEALTHY';
    
    const report = {
      timestamp: new Date().toISOString(),
      overallStatus,
      summary: {
        total: totalChecks,
        passed: passedChecks,
        failed: failedChecks,
        criticalFailures
      },
      checks: this.results
    };
    
    console.log('\n📊 HEALTH CHECK REPORT');
    console.log('═'.repeat(50));
    console.log(`Overall Status: ${this.getStatusIcon(overallStatus)} ${overallStatus}`);
    console.log(`Total Checks: ${totalChecks}`);
    console.log(`Passed: ${passedChecks}`);
    console.log(`Failed: ${failedChecks}`);
    if (criticalFailures > 0) {
      console.log(`Critical Failures: ${criticalFailures}`);
    }
    
    if (failedChecks > 0) {
      console.log('\n❌ FAILED CHECKS:');
      this.results
        .filter(r => r.status === 'fail')
        .forEach(result => {
          const criticalMark = result.critical ? ' (CRITICAL)' : '';
          console.log(`   • ${result.name}${criticalMark}: ${result.error}`);
        });
    }
    
    return report;
  }

  getStatusIcon(status) {
    const icons = {
      'HEALTHY': '✅',
      'WARNING': '⚠️',
      'CRITICAL': '🚨'
    };
    return icons[status] || '❓';
  }

  // HTTP/HTTPS request helper
  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: options.headers || {},
        timeout: this.timeout
      };
      
      const req = client.request(requestOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  }
}

// Setup standard health checks
function setupStandardChecks(healthCheck) {
  const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  
  // Basic server connectivity
  healthCheck.addCheck('Server Connectivity', async () => {
    const response = await healthCheck.makeRequest(`${baseUrl}/health`);
    if (response.statusCode !== 200) {
      throw new Error(`Server returned ${response.statusCode}`);
    }
    return { statusCode: response.statusCode };
  }, true);
  
  // API health endpoint
  healthCheck.addCheck('API Health Endpoint', async () => {
    const response = await healthCheck.makeRequest(`${baseUrl}/api/health`);
    if (response.statusCode !== 200) {
      throw new Error(`Health endpoint returned ${response.statusCode}`);
    }
    
    const data = JSON.parse(response.body);
    if (!data.success || data.data.status !== 'healthy') {
      throw new Error(`API reports unhealthy status: ${data.data.status}`);
    }
    
    return {
      status: data.data.status,
      responseTime: data.data.responseTime
    };
  }, true);
  
  // Database connectivity
  healthCheck.addCheck('Database Connectivity', async () => {
    const response = await healthCheck.makeRequest(`${baseUrl}/api/health/database`);
    if (response.statusCode !== 200) {
      throw new Error(`Database health check returned ${response.statusCode}`);
    }
    
    const data = JSON.parse(response.body);
    if (!data.success) {
      throw new Error('Database health check failed');
    }
    
    return {
      connected: data.data.health.status === 'healthy',
      circuitBreaker: data.data.circuitBreaker.state
    };
  }, true);
  
  // API endpoints accessibility
  healthCheck.addCheck('API Endpoints', async () => {
    const endpoints = [
      '/api',
      '/api/products',
      '/api/content/translations'
    ];
    
    const results = {};
    
    for (const endpoint of endpoints) {
      try {
        const response = await healthCheck.makeRequest(`${baseUrl}${endpoint}`);
        results[endpoint] = {
          statusCode: response.statusCode,
          accessible: response.statusCode < 500
        };
      } catch (error) {
        results[endpoint] = {
          statusCode: null,
          accessible: false,
          error: error.message
        };
      }
    }
    
    const failedEndpoints = Object.entries(results)
      .filter(([, result]) => !result.accessible)
      .map(([endpoint]) => endpoint);
    
    if (failedEndpoints.length > 0) {
      throw new Error(`Endpoints not accessible: ${failedEndpoints.join(', ')}`);
    }
    
    return results;
  }, false);
  
  // Environment configuration
  healthCheck.addCheck('Environment Configuration', async () => {
    const requiredEnvVars = [
      'MONGODB_URI',
      'JWT_SECRET',
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET'
    ];
    
    const missing = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }
    
    return {
      configured: requiredEnvVars.length,
      missing: missing.length
    };
  }, true);
  
  // SSL/TLS configuration (if HTTPS)
  if (baseUrl.startsWith('https://')) {
    healthCheck.addCheck('SSL/TLS Certificate', async () => {
      const response = await healthCheck.makeRequest(baseUrl);
      return {
        secure: true,
        statusCode: response.statusCode
      };
    }, false);
  }
  
  // Performance check
  healthCheck.addCheck('Response Performance', async () => {
    const startTime = Date.now();
    const response = await healthCheck.makeRequest(`${baseUrl}/api/health`);
    const responseTime = Date.now() - startTime;
    
    if (responseTime > 5000) {
      throw new Error(`Slow response time: ${responseTime}ms`);
    }
    
    return {
      responseTime,
      acceptable: responseTime < 5000
    };
  }, false);
  
  // Memory usage check (if metrics available)
  healthCheck.addCheck('System Resources', async () => {
    try {
      const response = await healthCheck.makeRequest(`${baseUrl}/api/health/detailed`);
      
      if (response.statusCode === 401) {
        // Skip if authentication required
        return { skipped: true, reason: 'Authentication required' };
      }
      
      if (response.statusCode !== 200) {
        throw new Error(`Metrics endpoint returned ${response.statusCode}`);
      }
      
      const data = JSON.parse(response.body);
      const memory = data.data.services.system.memory;
      
      if (memory && memory.percentage > 90) {
        throw new Error(`High memory usage: ${memory.percentage}%`);
      }
      
      return {
        memoryUsage: memory?.percentage || 'unknown',
        uptime: data.data.services.system.uptime
      };
      
    } catch (error) {
      if (error.message.includes('Authentication required')) {
        return { skipped: true, reason: 'Authentication required' };
      }
      throw error;
    }
  }, false);
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Deployment Health Check

Usage: node scripts/deployment-health-check.js [options]

Options:
  --url <url>         Base URL for health checks (default: from env)
  --timeout <ms>      Request timeout in milliseconds (default: 10000)
  --json              Output results in JSON format
  --exit-code         Exit with non-zero code on failures
  --help              Show this help message

Environment Variables:
  API_BASE_URL        Base URL for the API (e.g., https://api.example.com)
  PORT               Port number if using localhost (default: 5000)

Examples:
  node scripts/deployment-health-check.js
  node scripts/deployment-health-check.js --url https://api.example.com
  node scripts/deployment-health-check.js --json --exit-code
    `);
    return;
  }
  
  const healthCheck = new DeploymentHealthCheck();
  
  // Handle options
  const urlIndex = args.indexOf('--url');
  if (urlIndex !== -1) {
    process.env.API_BASE_URL = args[urlIndex + 1];
  }
  
  const timeoutIndex = args.indexOf('--timeout');
  if (timeoutIndex !== -1) {
    healthCheck.timeout = parseInt(args[timeoutIndex + 1]) || 10000;
  }
  
  const jsonOutput = args.includes('--json');
  const exitOnFailure = args.includes('--exit-code');
  
  try {
    // Setup standard checks
    setupStandardChecks(healthCheck);
    
    // Run all checks
    const report = await healthCheck.runAllChecks();
    
    if (jsonOutput) {
      console.log('\n' + JSON.stringify(report, null, 2));
    }
    
    // Exit with appropriate code
    if (exitOnFailure) {
      const exitCode = report.summary.criticalFailures > 0 ? 2 : 
                      report.summary.failed > 0 ? 1 : 0;
      process.exit(exitCode);
    }
    
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    
    if (exitOnFailure) {
      process.exit(2);
    }
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = DeploymentHealthCheck;