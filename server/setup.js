// server/setup.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up your backend environment...\n');

// 1. Check if .env already exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (fs.existsSync(envPath)) {
  console.log('✅ .env file already exists. Skipping creation.');
} else {
  if (!fs.existsSync(envExamplePath)) {
    console.error('❌ .env.example not found! Please create it first.');
    process.exit(1);
  }

  // Copy .env.example to .env
  fs.copyFileSync(envExamplePath, envPath);
  console.log('✅ Created .env from .env.example');
  console.log('👉 Please review and update credentials in .env if needed.\n');
}

// 2. Install dependencies
console.log('📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed.\n');
} catch (err) {
  console.error('❌ Failed to install dependencies. Make sure Node.js and npm are installed.');
  process.exit(1);
}

// 3. Check if PostgreSQL is running (optional but helpful)
try {
  console.log('🔍 Checking if PostgreSQL is running...');
  const result = execSync('pg_isready', { encoding: 'utf8' });
  if (result.includes('accepting connections')) {
    console.log('✅ PostgreSQL is running.');
  }
} catch (e) {
  console.warn('⚠️  PostgreSQL check failed. Make sure it’s installed and running.');
  console.log('   Tip: On macOS: `brew services start postgresql`');
  console.log('   On Linux: `sudo systemctl start postgresql`\n');
}

// 4. Try to create database (using values from .env)
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const getEnvVar = (key) => {
    const match = envContent.match(new RegExp(`${key}=([^\n\r]*)`));
    return match ? match[1].trim() : null;
  };

  const DB_NAME = getEnvVar('DB_NAME') || 'iraq_rides';
  const DB_USER = getEnvVar('DB_USER') || 'postgres';

  console.log(`🗃️  Ensuring database "${DB_NAME}" exists...`);

  // Use psql to create DB if not exists
  execSync(`psql -U ${DB_USER} -d postgres -c "CREATE DATABASE \\\"${DB_NAME}\\\";"`, {
    stdio: 'pipe',
    env: { ...process.env, PGPASSWORD: getEnvVar('DB_PASSWORD') || 'password' },
  });
  console.log(`✅ Database "${DB_NAME}" created.\n`);
} catch (err) {
  if (err.message.includes('already exists')) {
    console.log(`✅ Database "${DB_NAME}" already exists. Skipping.\n`);
  } else {
    console.warn('⚠️  Could not create database. You may need to do this manually.');
    console.log('   Run in terminal:');
    console.log(`   createdb -U postgres ${getEnvVar('DB_NAME') || 'iraq_rides'}\n`);
  }
}

console.log('🎉 Setup complete!');
console.log('👉 Run `npm start` to launch your server.');
