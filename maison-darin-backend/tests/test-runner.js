#!/usr/bin/env node

/**
 * Test Runner Script
 * Provides organized test execution with different modes
 */

const { execSync } = require('child_process');
const path = require('path');

class TestRunner {
  constructor() {
    this.baseCommand = 'npx jest';
    this.options = {
      coverage: false,
      watch: false,
      verbose: false,
      silent: false,
      maxWorkers: 1
    };
  }

  /**
   * Run unit tests only
   */
  runUnitTests() {
    console.log('🧪 Running Unit Tests...\n');
    return this.executeTests([
      'tests/models/',
      'tests/services/',
      'tests/controllers/',
      'tests/middleware/',
      'tests/utils/',
      'tests/validation/'
    ]);
  }

  /**
   * Run integration tests only
   */
  runIntegrationTests() {
    console.log('🔗 Running Integration Tests...\n');
    return this.executeTests(['tests/integration/']);
  }

  /**
   * Run all tests
   */
  runAllTests() {
    console.log('🚀 Running All Tests...\n');
    return this.executeTests(['tests/']);
  }

  /**
   * Run tests with coverage
   */
  runWithCoverage() {
    console.log('📊 Running Tests with Coverage...\n');
    this.options.coverage = true;
    return this.runAllTests();
  }

  /**
   * Run specific test file or pattern
   */
  runSpecific(pattern) {
    console.log(`🎯 Running Specific Tests: ${pattern}\n`);
    return this.executeTests([pattern]);
  }

  /**
   * Run tests in watch mode
   */
  runWatch() {
    console.log('👀 Running Tests in Watch Mode...\n');
    this.options.watch = true;
    return this.runAllTests();
  }

  /**
   * Execute tests with given patterns
   */
  executeTests(patterns) {
    let command = this.baseCommand;

    // Add patterns
    if (patterns && patterns.length > 0) {
      command += ` ${patterns.join(' ')}`;
    }

    // Add options
    if (this.options.coverage) {
      command += ' --coverage';
    }

    if (this.options.watch) {
      command += ' --watch';
    }

    if (this.options.verbose) {
      command += ' --verbose';
    }

    if (this.options.silent) {
      command += ' --silent';
    }

    command += ` --maxWorkers=${this.options.maxWorkers}`;
    command += ' --forceExit';
    command += ' --detectOpenHandles';

    try {
      console.log(`Executing: ${command}\n`);
      execSync(command, { 
        stdio: 'inherit', 
        cwd: path.join(__dirname, '..') 
      });
      return true;
    } catch (error) {
      console.error('❌ Tests failed');
      return false;
    }
  }

  /**
   * Set options
   */
  setOptions(options) {
    this.options = { ...this.options, ...options };
    return this;
  }

  /**
   * Display help
   */
  showHelp() {
    console.log(`
🧪 Maison Darin Backend Test Runner

Usage: node tests/test-runner.js [command] [options]

Commands:
  unit          Run unit tests only
  integration   Run integration tests only
  all           Run all tests (default)
  coverage      Run all tests with coverage
  watch         Run tests in watch mode
  specific      Run specific test file or pattern

Options:
  --verbose     Verbose output
  --silent      Silent output
  --workers=N   Number of worker processes (default: 1)

Examples:
  node tests/test-runner.js unit
  node tests/test-runner.js integration --verbose
  node tests/test-runner.js coverage
  node tests/test-runner.js specific "auth.test.js"
  node tests/test-runner.js watch
    `);
  }
}

// CLI Interface
function main() {
  const args = process.argv.slice(2);
  const runner = new TestRunner();

  // Parse options
  const options = {};
  const commands = [];

  args.forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      if (key === 'workers') {
        options.maxWorkers = parseInt(value) || 1;
      } else {
        options[key] = value || true;
      }
    } else {
      commands.push(arg);
    }
  });

  runner.setOptions(options);

  const command = commands[0] || 'all';

  switch (command) {
    case 'unit':
      return runner.runUnitTests();
    
    case 'integration':
      return runner.runIntegrationTests();
    
    case 'all':
      return runner.runAllTests();
    
    case 'coverage':
      return runner.runWithCoverage();
    
    case 'watch':
      return runner.runWatch();
    
    case 'specific':
      const pattern = commands[1];
      if (!pattern) {
        console.error('❌ Please provide a test pattern for specific command');
        return false;
      }
      return runner.runSpecific(pattern);
    
    case 'help':
    case '--help':
    case '-h':
      return runner.showHelp();
    
    default:
      console.error(`❌ Unknown command: ${command}`);
      runner.showHelp();
      return false;
  }
}

// Run if called directly
if (require.main === module) {
  const success = main();
  process.exit(success ? 0 : 1);
}

module.exports = TestRunner;