#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

class BackupManager {
  constructor() {
    this.mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/maison-darin';
    this.backupDir = path.join(__dirname, '../backups');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
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
        stdio: 'inherit',
        ...options
      });
      return result;
    } catch (error) {
      this.log(`Command failed: ${error.message}`, 'error');
      throw error;
    }
  }

  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      this.log(`Created backup directory: ${this.backupDir}`);
    }
  }

  async createDatabaseBackup() {
    this.log('Creating database backup...');
    
    const backupPath = path.join(this.backupDir, `db-backup-${this.timestamp}`);
    
    // Extract database name from URI
    const dbName = this.mongoUri.split('/').pop().split('?')[0];
    
    try {
      // Use mongodump to create backup
      this.exec(`mongodump --uri="${this.mongoUri}" --out="${backupPath}"`);
      
      // Create compressed archive
      const archivePath = `${backupPath}.tar.gz`;
      this.exec(`tar -czf "${archivePath}" -C "${this.backupDir}" "${path.basename(backupPath)}"`);
      
      // Remove uncompressed backup
      this.exec(`rm -rf "${backupPath}"`);
      
      this.log(`Database backup created: ${archivePath}`, 'success');
      return archivePath;
      
    } catch (error) {
      this.log('mongodump not found, trying alternative method...', 'warning');
      return await this.createJSONBackup();
    }
  }

  async createJSONBackup() {
    this.log('Creating JSON backup...');
    
    const mongoose = require('mongoose');
    await mongoose.connect(this.mongoUri);
    
    const backupPath = path.join(this.backupDir, `json-backup-${this.timestamp}`);
    fs.mkdirSync(backupPath, { recursive: true });
    
    const collections = ['users', 'products', 'contents', 'orders', 'samplerequests', 'contactmessages', 'media'];
    
    for (const collectionName of collections) {
      try {
        const collection = mongoose.connection.db.collection(collectionName);
        const documents = await collection.find({}).toArray();
        
        const filePath = path.join(backupPath, `${collectionName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));
        
        this.log(`Backed up ${documents.length} documents from ${collectionName}`);
      } catch (error) {
        this.log(`Failed to backup ${collectionName}: ${error.message}`, 'warning');
      }
    }
    
    await mongoose.connection.close();
    
    // Create compressed archive
    const archivePath = `${backupPath}.tar.gz`;
    this.exec(`tar -czf "${archivePath}" -C "${this.backupDir}" "${path.basename(backupPath)}"`);
    
    // Remove uncompressed backup
    this.exec(`rm -rf "${backupPath}"`);
    
    this.log(`JSON backup created: ${archivePath}`, 'success');
    return archivePath;
  }

  createApplicationBackup() {
    this.log('Creating application backup...');
    
    const backupPath = path.join(this.backupDir, `app-backup-${this.timestamp}.tar.gz`);
    const projectRoot = path.join(__dirname, '..');
    
    // Create backup excluding node_modules, logs, and other unnecessary files
    this.exec(`tar -czf "${backupPath}" -C "${path.dirname(projectRoot)}" --exclude="node_modules" --exclude="logs" --exclude="backups" --exclude=".git" "${path.basename(projectRoot)}"`);
    
    this.log(`Application backup created: ${backupPath}`, 'success');
    return backupPath;
  }

  async restoreDatabase(backupPath) {
    this.log(`Restoring database from: ${backupPath}`);
    
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }
    
    const tempDir = path.join(this.backupDir, 'temp-restore');
    
    try {
      // Extract backup
      this.exec(`mkdir -p "${tempDir}"`);
      this.exec(`tar -xzf "${backupPath}" -C "${tempDir}"`);
      
      // Find the backup directory
      const extractedDirs = fs.readdirSync(tempDir);
      const backupDir = path.join(tempDir, extractedDirs[0]);
      
      if (backupPath.includes('json-backup')) {
        await this.restoreFromJSON(backupDir);
      } else {
        await this.restoreFromMongoDump(backupDir);
      }
      
      this.log('Database restore completed', 'success');
      
    } finally {
      // Cleanup temp directory
      if (fs.existsSync(tempDir)) {
        this.exec(`rm -rf "${tempDir}"`);
      }
    }
  }

  async restoreFromMongoDump(backupDir) {
    const dbName = this.mongoUri.split('/').pop().split('?')[0];
    const dbBackupPath = path.join(backupDir, dbName);
    
    if (!fs.existsSync(dbBackupPath)) {
      throw new Error(`Database backup not found in: ${dbBackupPath}`);
    }
    
    this.exec(`mongorestore --uri="${this.mongoUri}" --drop "${dbBackupPath}"`);
  }

  async restoreFromJSON(backupDir) {
    const mongoose = require('mongoose');
    await mongoose.connect(this.mongoUri);
    
    const jsonFiles = fs.readdirSync(backupDir).filter(file => file.endsWith('.json'));
    
    for (const file of jsonFiles) {
      const collectionName = path.basename(file, '.json');
      const filePath = path.join(backupDir, file);
      
      try {
        const documents = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        if (documents.length > 0) {
          const collection = mongoose.connection.db.collection(collectionName);
          await collection.deleteMany({});
          await collection.insertMany(documents);
          
          this.log(`Restored ${documents.length} documents to ${collectionName}`);
        }
      } catch (error) {
        this.log(`Failed to restore ${collectionName}: ${error.message}`, 'error');
      }
    }
    
    await mongoose.connection.close();
  }

  listBackups() {
    this.log('Available backups:');
    
    if (!fs.existsSync(this.backupDir)) {
      this.log('No backups directory found');
      return [];
    }
    
    const backups = fs.readdirSync(this.backupDir)
      .filter(file => file.endsWith('.tar.gz'))
      .sort()
      .reverse();
    
    if (backups.length === 0) {
      this.log('No backups found');
      return [];
    }
    
    backups.forEach((backup, index) => {
      const filePath = path.join(this.backupDir, backup);
      const stats = fs.statSync(filePath);
      const size = (stats.size / 1024 / 1024).toFixed(2);
      
      console.log(`${index + 1}. ${backup} (${size} MB) - ${stats.mtime.toISOString()}`);
    });
    
    return backups;
  }

  cleanupOldBackups(keepCount = 10) {
    this.log(`Cleaning up old backups, keeping ${keepCount} most recent...`);
    
    const backups = this.listBackups();
    
    if (backups.length <= keepCount) {
      this.log('No cleanup needed');
      return;
    }
    
    const toDelete = backups.slice(keepCount);
    
    toDelete.forEach(backup => {
      const filePath = path.join(this.backupDir, backup);
      fs.unlinkSync(filePath);
      this.log(`Deleted old backup: ${backup}`);
    });
    
    this.log(`Cleanup completed, deleted ${toDelete.length} old backups`, 'success');
  }

  async verifyBackup(backupPath) {
    this.log(`Verifying backup: ${backupPath}`);
    
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }
    
    const stats = fs.statSync(backupPath);
    
    // Check file size (should be > 1KB)
    if (stats.size < 1024) {
      throw new Error('Backup file appears to be too small');
    }
    
    // Try to extract and verify structure
    const tempDir = path.join(this.backupDir, 'temp-verify');
    
    try {
      this.exec(`mkdir -p "${tempDir}"`);
      this.exec(`tar -tzf "${backupPath}" > /dev/null`); // Test archive integrity
      
      this.log('Backup verification passed', 'success');
      return {
        valid: true,
        size: stats.size,
        created: stats.mtime,
        verified: new Date()
      };
      
    } catch (error) {
      this.log(`Backup verification failed: ${error.message}`, 'error');
      return {
        valid: false,
        error: error.message,
        verified: new Date()
      };
    } finally {
      if (fs.existsSync(tempDir)) {
        this.exec(`rm -rf "${tempDir}"`);
      }
    }
  }

  async createScheduledBackup() {
    this.log('Starting scheduled backup...');
    
    try {
      const dbBackupPath = await this.createDatabaseBackup();
      const verification = await this.verifyBackup(dbBackupPath);
      
      if (!verification.valid) {
        throw new Error(`Backup verification failed: ${verification.error}`);
      }
      
      // Cleanup old backups
      this.cleanupOldBackups();
      
      this.log('Scheduled backup completed successfully', 'success');
      
      return {
        success: true,
        backupPath: dbBackupPath,
        verification
      };
      
    } catch (error) {
      this.log(`Scheduled backup failed: ${error.message}`, 'error');
      
      // Send alert about backup failure
      if (process.env.ALERT_WEBHOOK_URL) {
        try {
          const fetch = require('node-fetch');
          await fetch(process.env.ALERT_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: `🚨 Backup Failed: ${error.message}`,
              timestamp: new Date().toISOString()
            })
          });
        } catch (alertError) {
          this.log(`Failed to send backup failure alert: ${alertError.message}`, 'warning');
        }
      }
      
      throw error;
    }
  }

  async testRestore(backupPath) {
    this.log(`Testing restore from: ${backupPath}`);
    
    const testDbName = `${this.mongoUri.split('/').pop().split('?')[0]}_test_restore`;
    const testUri = this.mongoUri.replace(/\/[^\/]+(\?|$)/, `/${testDbName}$1`);
    
    try {
      // Create test database and restore
      const mongoose = require('mongoose');
      await mongoose.connect(testUri);
      
      // Drop test database if exists
      await mongoose.connection.db.dropDatabase();
      await mongoose.connection.close();
      
      // Restore to test database
      const tempDir = path.join(this.backupDir, 'temp-test-restore');
      this.exec(`mkdir -p "${tempDir}"`);
      this.exec(`tar -xzf "${backupPath}" -C "${tempDir}"`);
      
      const extractedDirs = fs.readdirSync(tempDir);
      const backupDir = path.join(tempDir, extractedDirs[0]);
      
      if (backupPath.includes('json-backup')) {
        await this.testRestoreFromJSON(backupDir, testUri);
      } else {
        await this.testRestoreFromMongoDump(backupDir, testUri);
      }
      
      // Verify restored data
      await mongoose.connect(testUri);
      const collections = await mongoose.connection.db.listCollections().toArray();
      const collectionCount = collections.length;
      
      // Get document counts
      const documentCounts = {};
      for (const collection of collections) {
        const count = await mongoose.connection.db.collection(collection.name).countDocuments();
        documentCounts[collection.name] = count;
      }
      
      await mongoose.connection.close();
      
      // Cleanup test database
      await mongoose.connect(testUri);
      await mongoose.connection.db.dropDatabase();
      await mongoose.connection.close();
      
      // Cleanup temp directory
      this.exec(`rm -rf "${tempDir}"`);
      
      this.log('Restore test completed successfully', 'success');
      
      return {
        success: true,
        collections: collectionCount,
        documents: documentCounts,
        testedAt: new Date().toISOString()
      };
      
    } catch (error) {
      this.log(`Restore test failed: ${error.message}`, 'error');
      
      // Cleanup on failure
      try {
        const mongoose = require('mongoose');
        await mongoose.connect(testUri);
        await mongoose.connection.db.dropDatabase();
        await mongoose.connection.close();
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      throw error;
    }
  }

  async testRestoreFromMongoDump(backupDir, testUri) {
    const dbName = testUri.split('/').pop().split('?')[0];
    const dbBackupPath = path.join(backupDir, dbName);
    
    if (!fs.existsSync(dbBackupPath)) {
      // Try to find any database backup directory
      const dirs = fs.readdirSync(backupDir).filter(item => 
        fs.statSync(path.join(backupDir, item)).isDirectory()
      );
      
      if (dirs.length > 0) {
        this.exec(`mongorestore --uri="${testUri}" --drop "${path.join(backupDir, dirs[0])}"`);
      } else {
        throw new Error('No database backup found in archive');
      }
    } else {
      this.exec(`mongorestore --uri="${testUri}" --drop "${dbBackupPath}"`);
    }
  }

  async testRestoreFromJSON(backupDir, testUri) {
    const mongoose = require('mongoose');
    await mongoose.connect(testUri);
    
    const jsonFiles = fs.readdirSync(backupDir).filter(file => file.endsWith('.json'));
    
    for (const file of jsonFiles) {
      const collectionName = path.basename(file, '.json');
      const filePath = path.join(backupDir, file);
      
      const documents = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      if (documents.length > 0) {
        const collection = mongoose.connection.db.collection(collectionName);
        await collection.insertMany(documents);
      }
    }
    
    await mongoose.connection.close();
  }

  getBackupStatus() {
    const backups = this.listBackups();
    const now = Date.now();
    
    if (backups.length === 0) {
      return {
        status: 'no_backups',
        message: 'No backups found',
        lastBackup: null,
        totalBackups: 0
      };
    }
    
    const latestBackup = backups[0];
    const latestBackupPath = path.join(this.backupDir, latestBackup);
    const stats = fs.statSync(latestBackupPath);
    const ageHours = (now - stats.mtime.getTime()) / (1000 * 60 * 60);
    
    let status = 'healthy';
    let message = 'Backups are up to date';
    
    if (ageHours > 48) {
      status = 'stale';
      message = `Latest backup is ${Math.round(ageHours)} hours old`;
    } else if (ageHours > 24) {
      status = 'warning';
      message = `Latest backup is ${Math.round(ageHours)} hours old`;
    }
    
    return {
      status,
      message,
      lastBackup: {
        filename: latestBackup,
        created: stats.mtime.toISOString(),
        size: Math.round(stats.size / 1024 / 1024 * 100) / 100, // MB
        ageHours: Math.round(ageHours * 100) / 100
      },
      totalBackups: backups.length
    };
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const backupManager = new BackupManager();

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Maison Darin Backup Manager

Usage: node scripts/backup.js [command] [options]

Commands:
  create              Create database and application backup
  create-db           Create database backup only
  create-app          Create application backup only
  restore <file>      Restore database from backup file
  list                List available backups
  cleanup             Remove old backups (keep 10 most recent)
  verify <file>       Verify backup integrity
  test-restore <file> Test restore process without affecting production
  scheduled           Create scheduled backup with verification
  status              Show backup status and health
  help                Show this help message

Options:
  --keep <number>     Number of backups to keep during cleanup (default: 10)

Examples:
  node scripts/backup.js create           # Create full backup
  node scripts/backup.js create-db        # Create database backup only
  node scripts/backup.js list             # List available backups
  node scripts/backup.js restore backup.tar.gz  # Restore from backup
  node scripts/backup.js cleanup --keep 5 # Keep only 5 most recent backups
    `);
    return;
  }

  const command = args[0] || 'create';
  
  try {
    backupManager.ensureBackupDirectory();
    
    switch (command) {
      case 'create':
        await backupManager.createDatabaseBackup();
        backupManager.createApplicationBackup();
        break;
        
      case 'create-db':
        await backupManager.createDatabaseBackup();
        break;
        
      case 'create-app':
        backupManager.createApplicationBackup();
        break;
        
      case 'restore':
        const backupFile = args[1];
        if (!backupFile) {
          console.error('Please specify backup file to restore from');
          process.exit(1);
        }
        await backupManager.restoreDatabase(backupFile);
        break;
        
      case 'list':
        backupManager.listBackups();
        break;
        
      case 'cleanup':
        const keepIndex = args.indexOf('--keep');
        const keepCount = keepIndex !== -1 ? parseInt(args[keepIndex + 1]) || 10 : 10;
        backupManager.cleanupOldBackups(keepCount);
        break;
        
      case 'verify':
        const verifyFile = args[1];
        if (!verifyFile) {
          console.error('Please specify backup file to verify');
          process.exit(1);
        }
        const verification = await backupManager.verifyBackup(verifyFile);
        console.log('Verification result:', verification);
        break;
        
      case 'test-restore':
        const testFile = args[1];
        if (!testFile) {
          console.error('Please specify backup file to test restore');
          process.exit(1);
        }
        const testResult = await backupManager.testRestore(testFile);
        console.log('Test restore result:', testResult);
        break;
        
      case 'scheduled':
        const scheduledResult = await backupManager.createScheduledBackup();
        console.log('Scheduled backup result:', scheduledResult);
        break;
        
      case 'status':
        const status = backupManager.getBackupStatus();
        console.log('Backup status:', status);
        break;
        
      default:
        console.error(`Unknown command: ${command}`);
        console.log('Use --help for usage information');
        process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Backup operation failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = BackupManager;