const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting migration 009: Add read status tracking to messages...');

    await client.query('BEGIN');

    // Check if columns already exist
    const checkColumns = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'messages'
        AND column_name IN ('is_read', 'read_at', 'read_by', 'updated_at')
    `);

    const existingColumns = checkColumns.rows.map((row) => row.column_name);

    // Add is_read column
    if (!existingColumns.includes('is_read')) {
      console.log('📝 Adding is_read column...');
      await client.query(`
        ALTER TABLE messages
        ADD COLUMN is_read BOOLEAN DEFAULT FALSE NOT NULL
      `);
      console.log('✅ is_read column added');
    } else {
      console.log('⏭️  is_read column already exists');
    }

    // Add read_at column
    if (!existingColumns.includes('read_at')) {
      console.log('📝 Adding read_at column...');
      await client.query(`
        ALTER TABLE messages
        ADD COLUMN read_at TIMESTAMP NULL
      `);
      console.log('✅ read_at column added');
    } else {
      console.log('⏭️  read_at column already exists');
    }

    // Add read_by column (UUID of user who read it)
    if (!existingColumns.includes('read_by')) {
      console.log('📝 Adding read_by column...');
      await client.query(`
        ALTER TABLE messages
        ADD COLUMN read_by UUID NULL REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log('✅ read_by column added');
    } else {
      console.log('⏭️  read_by column already exists');
    }

    // Add updated_at column
    if (!existingColumns.includes('updated_at')) {
      console.log('📝 Adding updated_at column...');
      await client.query(`
        ALTER TABLE messages
        ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('✅ updated_at column added');
    } else {
      console.log('⏭️  updated_at column already exists');
    }

    // Create index for unread messages queries
    console.log('📝 Creating index for unread messages...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_unread
      ON messages(ride_type, ride_id, is_read)
      WHERE is_read = FALSE
    `);
    console.log('✅ Index created');

    // Create index for read_at queries
    console.log('📝 Creating index for read_at...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_read_at
      ON messages(read_at)
      WHERE read_at IS NOT NULL
    `);
    console.log('✅ Index created');

    // Create trigger to update updated_at
    console.log('📝 Creating trigger for updated_at...');
    await client.query(`
      CREATE OR REPLACE FUNCTION update_messages_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_messages_updated_at ON messages
    `);

    await client.query(`
      CREATE TRIGGER trigger_update_messages_updated_at
      BEFORE UPDATE ON messages
      FOR EACH ROW
      EXECUTE FUNCTION update_messages_updated_at()
    `);
    console.log('✅ Trigger created');

    await client.query('COMMIT');

    console.log('\n✅ Migration 009 completed successfully!');
    console.log('\n📊 Summary:');
    console.log('  - Added is_read column (BOOLEAN)');
    console.log('  - Added read_at column (TIMESTAMP)');
    console.log('  - Added read_by column (UUID)');
    console.log('  - Added updated_at column (TIMESTAMP)');
    console.log('  - Created indexes for performance');
    console.log('  - Created trigger for automatic updated_at');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('\n✨ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = runMigration;
