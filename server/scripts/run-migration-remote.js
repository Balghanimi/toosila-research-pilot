#!/usr/bin/env node

/**
 * Run Migration 009 on Remote Database
 *
 * Usage:
 *   1. Get DATABASE_URL from Railway dashboard
 *   2. Run: DATABASE_URL="your_url_here" node server/scripts/run-migration-remote.js
 */

const { Pool } = require('pg');

// Read DATABASE_URL from environment or command line
const DATABASE_URL = process.env.DATABASE_URL || process.argv[2];

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL not provided!');
  console.error('');
  console.error('Usage:');
  console.error('  Windows:');
  console.error('    set DATABASE_URL=postgresql://user:pass@host:port/db');
  console.error('    node server/scripts/run-migration-remote.js');
  console.error('');
  console.error('  Linux/Mac:');
  console.error(
    '    DATABASE_URL="postgresql://user:pass@host:port/db" node server/scripts/run-migration-remote.js'
  );
  console.error('');
  console.error('Or get it from Railway Dashboard → Database → Variables → DATABASE_URL');
  process.exit(1);
}

console.log('🚀 Starting remote migration...');
console.log(`📡 Connecting to database...`);

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Railway
  },
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('✅ Connected successfully!');
    console.log('');
    console.log('📝 Running Migration 009: Add read status tracking to messages...');
    console.log('');

    await client.query('BEGIN');

    // Check if columns already exist
    const checkColumns = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'messages'
        AND column_name IN ('is_read', 'read_at', 'read_by', 'updated_at')
    `);

    const existingColumns = checkColumns.rows.map((row) => row.column_name);
    console.log(`Found ${existingColumns.length} existing columns:`, existingColumns);
    console.log('');

    // Add is_read column
    if (!existingColumns.includes('is_read')) {
      console.log('  📌 Adding is_read column...');
      await client.query(`
        ALTER TABLE messages
        ADD COLUMN is_read BOOLEAN DEFAULT FALSE NOT NULL
      `);
      console.log('  ✅ is_read column added');
    } else {
      console.log('  ⏭️  is_read column already exists');
    }

    // Add read_at column
    if (!existingColumns.includes('read_at')) {
      console.log('  📌 Adding read_at column...');
      await client.query(`
        ALTER TABLE messages
        ADD COLUMN read_at TIMESTAMP NULL
      `);
      console.log('  ✅ read_at column added');
    } else {
      console.log('  ⏭️  read_at column already exists');
    }

    // Add read_by column
    if (!existingColumns.includes('read_by')) {
      console.log('  📌 Adding read_by column...');
      await client.query(`
        ALTER TABLE messages
        ADD COLUMN read_by UUID NULL REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log('  ✅ read_by column added');
    } else {
      console.log('  ⏭️  read_by column already exists');
    }

    // Add updated_at column
    if (!existingColumns.includes('updated_at')) {
      console.log('  📌 Adding updated_at column...');
      await client.query(`
        ALTER TABLE messages
        ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('  ✅ updated_at column added');
    } else {
      console.log('  ⏭️  updated_at column already exists');
    }

    console.log('');
    console.log('📊 Creating indexes...');

    // Create index for unread messages queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_unread
      ON messages(ride_type, ride_id, is_read)
      WHERE is_read = FALSE
    `);
    console.log('  ✅ idx_messages_unread created');

    // Create index for read_at queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_read_at
      ON messages(read_at)
      WHERE read_at IS NOT NULL
    `);
    console.log('  ✅ idx_messages_read_at created');

    // Create index for read_by queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_read_by
      ON messages(read_by)
      WHERE read_by IS NOT NULL
    `);
    console.log('  ✅ idx_messages_read_by created');

    console.log('');
    console.log('🔧 Creating trigger...');

    // Create trigger function
    await client.query(`
      CREATE OR REPLACE FUNCTION update_messages_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    console.log('  ✅ Trigger function created');

    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_messages_updated_at ON messages
    `);

    await client.query(`
      CREATE TRIGGER trigger_update_messages_updated_at
      BEFORE UPDATE ON messages
      FOR EACH ROW
      EXECUTE FUNCTION update_messages_updated_at()
    `);
    console.log('  ✅ Trigger created');

    await client.query('COMMIT');

    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('✅ Migration 009 completed successfully!');
    console.log('═══════════════════════════════════════════');
    console.log('');
    console.log('📋 Summary:');
    console.log('  ✓ Added is_read column (BOOLEAN)');
    console.log('  ✓ Added read_at column (TIMESTAMP)');
    console.log('  ✓ Added read_by column (UUID)');
    console.log('  ✓ Added updated_at column (TIMESTAMP)');
    console.log('  ✓ Created 3 performance indexes');
    console.log('  ✓ Created automatic update trigger');
    console.log('');
    console.log('🎉 Your application should now work without errors!');
    console.log('');

    // Verify the changes
    const verifyColumns = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'messages'
        AND column_name IN ('is_read', 'read_at', 'read_by', 'updated_at')
      ORDER BY ordinal_position
    `);

    console.log('✅ Verification:');
    verifyColumns.rows.forEach((row) => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('');
    console.error('═══════════════════════════════════════════');
    console.error('❌ Migration failed!');
    console.error('═══════════════════════════════════════════');
    console.error('Error:', error.message);
    console.error('');
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('✨ Migration script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error.message);
    process.exit(1);
  });
