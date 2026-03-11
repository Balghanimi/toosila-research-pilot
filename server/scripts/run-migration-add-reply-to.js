#!/usr/bin/env node

/**
 * Migration: Add reply_to_id column to messages table
 * Enables WhatsApp-like reply-to-message feature
 *
 * Usage:
 *   node server/scripts/run-migration-add-reply-to.js
 *   # OR with DATABASE_URL:
 *   DATABASE_URL="your_url" node server/scripts/run-migration-add-reply-to.js
 */

const { Pool } = require('pg');

// Get database config
const DATABASE_URL = process.env.DATABASE_URL;

let pool;

if (DATABASE_URL) {
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
  });
} else {
  // Use local config
  require('dotenv').config();
  pool = require('../config/db').pool;
}

async function runMigration() {
  console.log('🚀 Starting migration: Add reply_to_id to messages table');
  console.log('');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if column already exists
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'messages' AND column_name = 'reply_to_id'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('✅ Column reply_to_id already exists. Skipping.');
      await client.query('COMMIT');
      return;
    }

    // Add reply_to_id column (same type as id - UUID)
    console.log('📝 Adding reply_to_id column...');
    await client.query(`
      ALTER TABLE messages 
      ADD COLUMN reply_to_id UUID NULL
    `);
    console.log('  ✅ Column added');

    // Add foreign key constraint (self-referencing)
    console.log('📝 Adding foreign key constraint...');
    await client.query(`
      ALTER TABLE messages 
      ADD CONSTRAINT fk_messages_reply_to 
      FOREIGN KEY (reply_to_id) 
      REFERENCES messages(id) 
      ON DELETE SET NULL
    `);
    console.log('  ✅ Foreign key constraint added');

    // Add index for faster lookups
    console.log('📝 Creating index on reply_to_id...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id 
      ON messages(reply_to_id) 
      WHERE reply_to_id IS NOT NULL
    `);
    console.log('  ✅ Index created');

    // Add comment for documentation
    await client.query(`
      COMMENT ON COLUMN messages.reply_to_id IS 
        'ID of the message this is replying to (self-referencing FK for WhatsApp-like replies)'
    `);

    await client.query('COMMIT');

    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('✅ Migration completed successfully!');
    console.log('═══════════════════════════════════════════');
    console.log('');
    console.log('📋 Changes made:');
    console.log('  ✓ Added reply_to_id UUID column (nullable)');
    console.log('  ✓ Added foreign key to messages(id)');
    console.log('  ✓ Added partial index for non-null values');
    console.log('');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('');
    console.error('❌ Migration failed!');
    console.error('Error:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed:', error.message);
    process.exit(1);
  });
