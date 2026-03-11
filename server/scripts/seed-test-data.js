/**
 * Seed Test Data for Toosila
 * Run: node scripts/seed-test-data.js
 *
 * Creates:
 * - 2 test users (1 driver, 1 passenger) with password: Test1234!
 * - 4 ride offers from the driver
 * - 2 demands from the passenger
 *
 * Safe to re-run: uses ON CONFLICT to skip existing records
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('../config/db');

const DRIVER_ID = '11111111-1111-1111-1111-111111111111';
const PASSENGER_ID = '22222222-2222-2222-2222-222222222222';
const PASSWORD = 'Test1234!';

async function seed() {
  console.log('🌱 Seeding test data...\n');

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // 1. Create test users
  console.log('👤 Creating test users...');

  await db.query(
    `
    INSERT INTO users (id, name, email, password_hash, password, is_driver, role, is_verified, email_verified, language_preference)
    VALUES ($1, $2, $3, $4, $4, $5, $6, true, true, 'ar')
    ON CONFLICT (id) DO UPDATE SET
      password_hash = $4, password = $4, is_driver = $5, is_verified = true, email_verified = true
  `,
    [DRIVER_ID, 'حسين السائق', 'driver@test.com', passwordHash, true, 'user']
  );
  console.log('  ✅ Driver: driver@test.com / Test1234!');

  await db.query(
    `
    INSERT INTO users (id, name, email, password_hash, password, is_driver, role, is_verified, email_verified, language_preference)
    VALUES ($1, $2, $3, $4, $4, $5, $6, true, true, 'ar')
    ON CONFLICT (id) DO UPDATE SET
      password_hash = $4, password = $4, is_driver = $5, is_verified = true, email_verified = true
  `,
    [PASSENGER_ID, 'فاطمة الراكبة', 'passenger@test.com', passwordHash, false, 'user']
  );
  console.log('  ✅ Passenger: passenger@test.com / Test1234!');

  // 2. Create ride offers
  console.log('\n🚗 Creating ride offers...');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const offers = [
    {
      id: 'aaaa0001-0001-0001-0001-000000000001',
      fromCity: 'بغداد',
      toCity: 'كربلاء',
      departureTime: new Date(tomorrow.setHours(6, 0, 0)).toISOString(),
      seats: 3,
      price: 15000,
      isLadiesOnly: false,
    },
    {
      id: 'aaaa0002-0002-0002-0002-000000000002',
      fromCity: 'بغداد',
      toCity: 'البصرة',
      departureTime: new Date(tomorrow.setHours(8, 0, 0)).toISOString(),
      seats: 4,
      price: 25000,
      isLadiesOnly: false,
    },
    {
      id: 'aaaa0003-0003-0003-0003-000000000003',
      fromCity: 'النجف',
      toCity: 'بغداد',
      departureTime: new Date(tomorrow.setHours(10, 0, 0)).toISOString(),
      seats: 2,
      price: 20000,
      isLadiesOnly: false,
    },
    {
      id: 'aaaa0004-0004-0004-0004-000000000004',
      fromCity: 'كربلاء',
      toCity: 'النجف',
      departureTime: new Date(tomorrow.setHours(14, 0, 0)).toISOString(),
      seats: 3,
      price: 10000,
      isLadiesOnly: true,
    },
  ];

  for (const o of offers) {
    await db.query(
      `
      INSERT INTO offers (id, driver_id, from_city, to_city, departure_time, seats, price, is_active, is_ladies_only)
      VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)
      ON CONFLICT (id) DO UPDATE SET
        from_city = $3, to_city = $4, departure_time = $5, seats = $6, price = $7, is_active = true, is_ladies_only = $8
    `,
      [o.id, DRIVER_ID, o.fromCity, o.toCity, o.departureTime, o.seats, o.price, o.isLadiesOnly]
    );
    console.log(
      `  ✅ ${o.fromCity} → ${o.toCity} | ${o.price} د.ع | ${o.seats} seats${o.isLadiesOnly ? ' (Ladies Only)' : ''}`
    );
  }

  // 3. Create demands
  console.log('\n🙋 Creating ride demands...');

  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);

  const demands = [
    {
      id: 'bbbb0001-0001-0001-0001-000000000001',
      fromCity: 'البصرة',
      toCity: 'بغداد',
      earliestTime: new Date(dayAfter.setHours(7, 0, 0)).toISOString(),
      latestTime: new Date(dayAfter.setHours(12, 0, 0)).toISOString(),
      seats: 2,
      budgetMax: 30000,
      isLadiesOnly: false,
    },
    {
      id: 'bbbb0002-0002-0002-0002-000000000002',
      fromCity: 'بغداد',
      toCity: 'أربيل',
      earliestTime: new Date(dayAfter.setHours(6, 0, 0)).toISOString(),
      latestTime: new Date(dayAfter.setHours(10, 0, 0)).toISOString(),
      seats: 1,
      budgetMax: 50000,
      isLadiesOnly: false,
    },
  ];

  for (const d of demands) {
    await db.query(
      `
      INSERT INTO demands (id, passenger_id, from_city, to_city, earliest_time, latest_time, seats, budget_max, is_active, is_ladies_only)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9)
      ON CONFLICT (id) DO UPDATE SET
        from_city = $3, to_city = $4, earliest_time = $5, latest_time = $6, seats = $7, budget_max = $8, is_active = true, is_ladies_only = $9
    `,
      [
        d.id,
        PASSENGER_ID,
        d.fromCity,
        d.toCity,
        d.earliestTime,
        d.latestTime,
        d.seats,
        d.budgetMax,
        d.isLadiesOnly,
      ]
    );
    console.log(`  ✅ ${d.fromCity} → ${d.toCity} | budget ${d.budgetMax} د.ع | ${d.seats} seats`);
  }

  console.log('\n✨ Seed complete!\n');
  console.log('📋 Test Credentials:');
  console.log('   Driver:    driver@test.com / Test1234!');
  console.log('   Passenger: passenger@test.com / Test1234!');
  console.log('');

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
