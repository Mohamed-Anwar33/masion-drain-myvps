#!/usr/bin/env node

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config({ path: path.join(__dirname, '../.env') });

class DatabaseMigrator {
  constructor() {
    this.mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/maison-darin';
    this.migrationsPath = path.join(__dirname, 'migrations');
    this.isConnected = false;
  }

  async connect() {
    try {
      await mongoose.connect(this.mongoUri);
      this.isConnected = true;
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.isConnected) {
      await mongoose.connection.close();
      this.isConnected = false;
      console.log('🔌 Database connection closed');
    }
  }

  async createMigrationsCollection() {
    const db = mongoose.connection.db;
    const collections = await db.listCollections({ name: 'migrations' }).toArray();
    
    if (collections.length === 0) {
      await db.createCollection('migrations');
      console.log('✅ Created migrations collection');
    }
  }

  async getExecutedMigrations() {
    const db = mongoose.connection.db;
    const migrations = await db.collection('migrations').find({}).sort({ executedAt: 1 }).toArray();
    return migrations.map(m => m.name);
  }

  async markMigrationAsExecuted(migrationName) {
    const db = mongoose.connection.db;
    await db.collection('migrations').insertOne({
      name: migrationName,
      executedAt: new Date()
    });
  }

  async getMigrationFiles() {
    try {
      const files = await fs.readdir(this.migrationsPath);
      return files
        .filter(file => file.endsWith('.js'))
        .sort();
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('ℹ️  No migrations directory found, creating...');
        await fs.mkdir(this.migrationsPath, { recursive: true });
        return [];
      }
      throw error;
    }
  }

  async runMigration(migrationFile) {
    const migrationPath = path.join(this.migrationsPath, migrationFile);
    const migration = require(migrationPath);
    
    if (typeof migration.up !== 'function') {
      throw new Error(`Migration ${migrationFile} must export an 'up' function`);
    }

    console.log(`🔄 Running migration: ${migrationFile}`);
    await migration.up(mongoose.connection.db);
    await this.markMigrationAsExecuted(migrationFile);
    console.log(`✅ Completed migration: ${migrationFile}`);
  }

  async rollbackMigration(migrationFile) {
    const migrationPath = path.join(this.migrationsPath, migrationFile);
    const migration = require(migrationPath);
    
    if (typeof migration.down !== 'function') {
      throw new Error(`Migration ${migrationFile} must export a 'down' function for rollback`);
    }

    console.log(`🔄 Rolling back migration: ${migrationFile}`);
    await migration.down(mongoose.connection.db);
    
    const db = mongoose.connection.db;
    await db.collection('migrations').deleteOne({ name: migrationFile });
    console.log(`✅ Rolled back migration: ${migrationFile}`);
  }

  async migrate() {
    try {
      await this.connect();
      await this.createMigrationsCollection();

      const migrationFiles = await this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations();

      const pendingMigrations = migrationFiles.filter(
        file => !executedMigrations.includes(file)
      );

      if (pendingMigrations.length === 0) {
        console.log('ℹ️  No pending migrations');
        return;
      }

      console.log(`📋 Found ${pendingMigrations.length} pending migrations`);

      for (const migrationFile of pendingMigrations) {
        await this.runMigration(migrationFile);
      }

      console.log('🎉 All migrations completed successfully!');

    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async rollback(steps = 1) {
    try {
      await this.connect();
      await this.createMigrationsCollection();

      const executedMigrations = await this.getExecutedMigrations();
      
      if (executedMigrations.length === 0) {
        console.log('ℹ️  No migrations to rollback');
        return;
      }

      const migrationsToRollback = executedMigrations
        .slice(-steps)
        .reverse();

      console.log(`📋 Rolling back ${migrationsToRollback.length} migrations`);

      for (const migrationFile of migrationsToRollback) {
        await this.rollbackMigration(migrationFile);
      }

      console.log('🎉 Rollback completed successfully!');

    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async status() {
    try {
      await this.connect();
      await this.createMigrationsCollection();

      const migrationFiles = await this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations();

      console.log('\n📊 Migration Status:');
      console.log('===================');

      if (migrationFiles.length === 0) {
        console.log('No migration files found');
        return;
      }

      migrationFiles.forEach(file => {
        const status = executedMigrations.includes(file) ? '✅ Executed' : '⏳ Pending';
        console.log(`${status} - ${file}`);
      });

      console.log(`\nTotal: ${migrationFiles.length} migrations`);
      console.log(`Executed: ${executedMigrations.length}`);
      console.log(`Pending: ${migrationFiles.length - executedMigrations.length}`);

    } catch (error) {
      console.error('❌ Status check failed:', error.message);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const migrator = new DatabaseMigrator();

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Maison Darin Database Migrator

Usage: node scripts/migrate.js [command] [options]

Commands:
  migrate, up          Run pending migrations
  rollback, down       Rollback migrations (default: 1 step)
  status               Show migration status
  help                 Show this help message

Options:
  --steps <number>     Number of migrations to rollback (default: 1)

Examples:
  node scripts/migrate.js migrate         # Run all pending migrations
  node scripts/migrate.js rollback        # Rollback last migration
  node scripts/migrate.js rollback --steps 3  # Rollback last 3 migrations
  node scripts/migrate.js status          # Show migration status
    `);
    return;
  }

  const command = args[0] || 'migrate';
  const stepsIndex = args.indexOf('--steps');
  const steps = stepsIndex !== -1 ? parseInt(args[stepsIndex + 1]) || 1 : 1;

  switch (command) {
    case 'migrate':
    case 'up':
      await migrator.migrate();
      break;
    case 'rollback':
    case 'down':
      await migrator.rollback(steps);
      break;
    case 'status':
      await migrator.status();
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
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
}

module.exports = DatabaseMigrator;