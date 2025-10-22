#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class DeploymentManager {
  constructor() {
    this.environment = process.env.NODE_ENV || 'production';
    this.projectRoot = path.join(__dirname, '..');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  exec(command, options = {}) {
    this.log(`Executing: ${command}`);
    try {
      const result = execSync(command, {
        cwd: this.projectRoot,
        stdio: 'inherit',
        ...options
      });
      return result;
    } catch (error) {
      this.log(`Command failed: ${error.message}`, 'error');
      throw error;
    }
  }

  checkPrerequisites() {
    this.log('Checking deployment prerequisites...');
    
    // Check if required files exist
    const requiredFiles = [
      'package.json',
      'server.js',
      '.env.production',
      'ecosystem.config.js',
      'Dockerfile'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Required file missing: ${file}`);
      }
    }

    // Check if Docker is available
    try {
      this.exec('docker --version', { stdio: 'pipe' });
    } catch (error) {
      this.log('Docker not found. Please install Docker for containerized deployment.', 'warning');
    }

    // Check if PM2 is available
    try {
      this.exec('pm2 --version', { stdio: 'pipe' });
    } catch (error) {
      this.log('PM2 not found. Installing PM2...', 'warning');
      this.exec('npm install -g pm2');
    }

    this.log('Prerequisites check completed', 'success');
  }

  buildApplication() {
    this.log('Building application...');
    
    // Install production dependencies
    this.exec('npm ci --only=production');
    
    // Run tests
    this.log('Running tests...');
    this.exec('npm test');
    
    this.log('Application build completed', 'success');
  }

  deployDocker() {
    this.log('Deploying with Docker...');
    
    // Build Docker image
    this.exec('docker build -t maison-darin-api .');
    
    // Stop existing containers
    try {
      this.exec('docker-compose down');
    } catch (error) {
      this.log('No existing containers to stop', 'warning');
    }
    
    // Start new containers
    this.exec('docker-compose up -d');
    
    // Wait for services to be ready
    this.log('Waiting for services to start...');
    setTimeout(() => {
      this.exec('docker-compose ps');
    }, 10000);
    
    this.log('Docker deployment completed', 'success');
  }

  deployPM2() {
    this.log('Deploying with PM2...');
    
    // Stop existing PM2 processes
    try {
      this.exec('pm2 stop maison-darin-api');
      this.exec('pm2 delete maison-darin-api');
    } catch (error) {
      this.log('No existing PM2 processes to stop', 'warning');
    }
    
    // Start with PM2
    this.exec(`pm2 start ecosystem.config.js --env ${this.environment}`);
    
    // Save PM2 configuration
    this.exec('pm2 save');
    
    this.log('PM2 deployment completed', 'success');
  }

  runMigrations() {
    this.log('Running database migrations...');
    this.exec('npm run migrate');
    this.log('Migrations completed', 'success');
  }

  seedDatabase() {
    this.log('Seeding database...');
    this.exec('npm run seed');
    this.log('Database seeding completed', 'success');
  }

  healthCheck() {
    this.log('Performing health check...');
    
    const maxRetries = 10;
    const retryDelay = 5000;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        this.exec('node scripts/healthcheck.js', { stdio: 'pipe' });
        this.log('Health check passed', 'success');
        return;
      } catch (error) {
        if (i === maxRetries - 1) {
          throw new Error('Health check failed after maximum retries');
        }
        this.log(`Health check failed, retrying in ${retryDelay/1000}s... (${i + 1}/${maxRetries})`, 'warning');
        this.sleep(retryDelay);
      }
    }
  }

  sleep(ms) {
    execSync(`node -e "setTimeout(() => {}, ${ms})"`);
  }

  generateDeploymentReport() {
    const report = {
      timestamp: new Date().toISOString(),
      environment: this.environment,
      version: require('../package.json').version,
      nodeVersion: process.version,
      deployment: 'successful'
    };

    const reportPath = path.join(this.projectRoot, 'deployment-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`Deployment report generated: ${reportPath}`, 'success');
  }

  async deploy(options = {}) {
    try {
      this.log(`Starting deployment for ${this.environment} environment...`);
      
      // Pre-deployment checks
      this.checkPrerequisites();
      
      // Build application
      if (!options.skipBuild) {
        this.buildApplication();
      }
      
      // Run migrations
      if (!options.skipMigrations) {
        this.runMigrations();
      }
      
      // Deploy based on method
      if (options.method === 'docker') {
        this.deployDocker();
      } else {
        this.deployPM2();
      }
      
      // Seed database if requested
      if (options.seed) {
        this.seedDatabase();
      }
      
      // Health check
      if (!options.skipHealthCheck) {
        this.healthCheck();
      }
      
      // Generate report
      this.generateDeploymentReport();
      
      this.log('🎉 Deployment completed successfully!', 'success');
      
    } catch (error) {
      this.log(`Deployment failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const deployer = new DeploymentManager();

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Maison Darin Deployment Script

Usage: node scripts/deploy.js [options]

Options:
  --method <docker|pm2>    Deployment method (default: pm2)
  --skip-build            Skip application build
  --skip-migrations       Skip database migrations
  --skip-health-check     Skip health check
  --seed                  Seed database after deployment
  --help, -h              Show this help message

Examples:
  node scripts/deploy.js                    # Deploy with PM2
  node scripts/deploy.js --method docker    # Deploy with Docker
  node scripts/deploy.js --seed             # Deploy and seed database
    `);
    return;
  }

  const options = {
    method: args.includes('--method') ? args[args.indexOf('--method') + 1] : 'pm2',
    skipBuild: args.includes('--skip-build'),
    skipMigrations: args.includes('--skip-migrations'),
    skipHealthCheck: args.includes('--skip-health-check'),
    seed: args.includes('--seed')
  };

  await deployer.deploy(options);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Deployment script failed:', error);
    process.exit(1);
  });
}

module.exports = DeploymentManager;