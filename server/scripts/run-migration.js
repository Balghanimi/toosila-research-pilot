#!/usr/bin/env node

/**
 * Migration Script: Add email verification to users table
 * Run this with: node server/scripts/run-migration.js
 * Or with Railway: railway run node server/scripts/run-migration.js
 */

const { Client } = require('pg');

async function runMigration() {
  // Get database URL from environment (prefer PUBLIC for external connections)
  const databaseUrl =
    process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL || process.env.DATABASE_PRIVATE_URL;

  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL not found in environment variables');
    console.log('Please run with: railway run node server/scripts/run-migration.js');
    process.exit(1);
  }

  console.log('🔗 Using database URL:', databaseUrl.replace(/:[^:]*@/, ':****@'));

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }, // Always use SSL for Railway
  });

  try {
    console.log('🔌 Connecting to PostgreSQL database...');
    await client.connect();
    console.log('✅ Connected successfully!');

    // Migration 007: Add email verification columns
    console.log('\n📝 Adding email verification columns to users table...');

    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP,
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;
    `);
    console.log('✅ Email verification columns added successfully!');

    // Create indexes
    console.log('\n📝 Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token) WHERE verification_token IS NOT NULL;
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
    `);
    console.log('✅ Indexes created successfully!');

    // Update existing users to be verified
    console.log('\n📝 Updating existing users to verified status...');
    const updateResult = await client.query(`
      UPDATE users SET email_verified = true, email_verified_at = CURRENT_TIMESTAMP
      WHERE email_verified IS NULL OR email_verified = false;
    `);
    console.log(`✅ Updated ${updateResult.rowCount} existing user(s) to verified`);

    // Verify columns exist
    console.log('\n🔍 Verifying migration...');
    const verifyResult = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
        AND column_name IN ('verification_token', 'verification_token_expires', 'email_verified', 'email_verified_at')
      ORDER BY column_name;
    `);

    console.log('\n✅ Migration 007 completed successfully!');
    console.log('\nColumns added to users table:');
    verifyResult.rows.forEach((row) => {
      console.log(
        `  - ${row.column_name} (${row.data_type}): default = ${row.column_default || 'NULL'}`
      );
    });
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run migration
runMigration();
