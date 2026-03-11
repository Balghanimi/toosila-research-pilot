/**
 * Run Migration 011: Driver Vehicles System
 * Adds vehicle information for drivers
 */

const fs = require('fs');
const path = require('path');
const { query } = require('../config/db');

async function runMigration() {
  try {
    console.log('🚀 Starting Migration 011: Driver Vehicles System...\n');

    // Read migration file
    const migrationPath = path.join(
      __dirname,
      '../database/migrations/011_add_driver_vehicles.sql'
    );
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    console.log('📝 Creating driver_vehicles table...');
    console.log('📝 Adding vehicle_id to offers table...');
    console.log('📝 Creating indexes...');

    await query(migrationSQL);

    console.log('\n✅ Migration 011 completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   - driver_vehicles table created');
    console.log('   - offers.vehicle_id column added');
    console.log('   - 6 indexes created for performance');
    console.log('\n🎉 Driver vehicles system is ready!');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
