#!/usr/bin/env node

/**
 * Frontend Integration Test Runner
 * This script runs comprehensive tests to verify frontend integration
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🧪 Starting Frontend Integration Tests...\n');

// Test configuration
const testConfig = {
  testFile: 'tests/integration/frontend-integration.test.js',
  timeout: 60000, // 60 seconds
  verbose: true
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function logSection(title) {
  console.log(`\n${colorize('='.repeat(60), 'cyan')}`);
  console.log(`${colorize(title, 'bright')}`);
  console.log(`${colorize('='.repeat(60), 'cyan')}\n`);
}

function logStep(step) {
  console.log(`${colorize('▶', 'blue')} ${step}`);
}

function logSuccess(message) {
  console.log(`${colorize('✅', 'green')} ${message}`);
}

function logError(message) {
  console.log(`${colorize('❌', 'red')} ${message}`);
}

function logWarning(message) {
  console.log(`${colorize('⚠️', 'yellow')} ${message}`);
}

// Check if test file exists
function checkTestFile() {
  const testPath = path.join(process.cwd(), testConfig.testFile);
  if (!fs.existsSync(testPath)) {
    logError(`Test file not found: ${testPath}`);
    process.exit(1);
  }
  logSuccess(`Test file found: ${testConfig.testFile}`);
}

// Run Jest tests
function runTests() {
  return new Promise((resolve, reject) => {
    logStep('Running Jest integration tests...');
    
    const jestArgs = [
      '--testPathPattern=frontend-integration',
      '--verbose',
      '--detectOpenHandles',
      '--forceExit',
      `--testTimeout=${testConfig.timeout}`
    ];

    const jest = spawn('npx', ['jest', ...jestArgs], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    jest.on('close', (code) => {
      if (code === 0) {
        logSuccess('All integration tests passed!');
        resolve();
      } else {
        logError(`Tests failed with exit code ${code}`);
        reject(new Error(`Jest exited with code ${code}`));
      }
    });

    jest.on('error', (error) => {
      logError(`Failed to start Jest: ${error.message}`);
      reject(error);
    });
  });
}

// Check server health
function checkServerHealth() {
  return new Promise((resolve, reject) => {
    logStep('Checking server health...');
    
    const healthCheck = spawn('node', ['-e', `
      const request = require('supertest');
      const app = require('./server');
      
      request(app)
        .get('/api/health')
        .expect(200)
        .end((err, res) => {
          if (err) {
            console.error('Health check failed:', err.message);
            process.exit(1);
          } else {
            console.log('Server health check passed');
            process.exit(0);
          }
        });
    `], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    healthCheck.on('close', (code) => {
      if (code === 0) {
        logSuccess('Server health check passed');
        resolve();
      } else {
        logError('Server health check failed');
        reject(new Error('Health check failed'));
      }
    });
  });
}

// Generate test report
function generateReport(results) {
  logSection('TEST REPORT');
  
  const report = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    testFile: testConfig.testFile,
    results: results
  };

  const reportPath = path.join(process.cwd(), 'test-reports', 'frontend-integration-report.json');
  
  // Ensure reports directory exists
  const reportsDir = path.dirname(reportPath);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  logSuccess(`Test report saved to: ${reportPath}`);
}

// Main execution
async function main() {
  try {
    logSection('FRONTEND INTEGRATION TEST SUITE');
    
    // Pre-flight checks
    logStep('Running pre-flight checks...');
    checkTestFile();
    
    // Check server health
    await checkServerHealth();
    
    // Run integration tests
    logSection('RUNNING INTEGRATION TESTS');
    await runTests();
    
    // Generate report
    generateReport({ status: 'passed', timestamp: new Date().toISOString() });
    
    logSection('INTEGRATION TESTS COMPLETED');
    logSuccess('All frontend integration tests completed successfully!');
    
    console.log(`\n${colorize('Next Steps:', 'bright')}`);
    console.log('1. Review test results above');
    console.log('2. Check test report in test-reports/frontend-integration-report.json');
    console.log('3. Verify CORS configuration for your frontend domain');
    console.log('4. Test with actual frontend application');
    
  } catch (error) {
    logSection('TEST EXECUTION FAILED');
    logError(`Error: ${error.message}`);
    
    generateReport({ 
      status: 'failed', 
      error: error.message, 
      timestamp: new Date().toISOString() 
    });
    
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  logWarning('Test execution interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  logWarning('Test execution terminated');
  process.exit(1);
});

// Run the main function
main();