const { Client } = require('pg');
require('dotenv').config();

async function createDatabase() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres' // Connect to default postgres database
  };

  const client = new Client(config);

  try {
    await client.connect();
    console.log('✅ Connected to postgres default database');

    await client.query('CREATE DATABASE toosila');
    console.log('✅ Database "toosila" created successfully');
  } catch (error) {
    if (error.code === '42P04') {
      console.log('ℹ️ Database "toosila" already exists');
    } else {
      console.error('❌ Error creating database:', error.message);
    }
  } finally {
    await client.end();
  }
}

createDatabase();
