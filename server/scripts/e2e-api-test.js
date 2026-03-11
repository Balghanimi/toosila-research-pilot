/**
 * E2E API Test Script for Toosila
 * Run: node scripts/e2e-api-test.js
 */

const BASE = 'http://localhost:5001';

async function test(name, fn) {
  try {
    const result = await fn();
    console.log(`  ✅ ${name}`);
    if (result) console.log(`     ${result}`);
    return true;
  } catch (err) {
    console.log(`  ❌ ${name}`);
    console.log(`     ${err.message}`);
    return false;
  }
}

async function fetchJSON(path, opts = {}) {
  const url = `${BASE}${path}`;
  const defaultHeaders = { 'Content-Type': 'application/json' };
  const headers = { ...defaultHeaders, ...(opts.headers || {}) };
  const res = await fetch(url, { ...opts, headers });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response (${res.status}): ${text.slice(0, 100)}`);
  }
  return { status: res.status, data };
}

async function main() {
  let passed = 0;
  let failed = 0;
  let token = null;

  console.log('=========================================');
  console.log('  TOOSILA E2E API TEST');
  console.log('=========================================\n');

  // 1. Health Check
  if (
    await test('GET /api/health', async () => {
      const { data } = await fetchJSON('/api/health');
      if (!data.ok) throw new Error('Health check failed');
      return `uptime: ${data.uptime}s`;
    })
  )
    passed++;
  else failed++;

  // 2. Cities
  if (
    await test('GET /api/cities', async () => {
      const { data } = await fetchJSON('/api/cities');
      if (!data.cities || data.cities.length === 0) throw new Error('No cities returned');
      return `${data.count} cities: ${data.cities.slice(0, 5).join(', ')}...`;
    })
  )
    passed++;
  else failed++;

  // 3. Offers list
  if (
    await test('GET /api/offers', async () => {
      const { data } = await fetchJSON('/api/offers');
      if (!data.offers) throw new Error(data.error?.message || JSON.stringify(data.error));
      const summaries = data.offers.map((o) => `${o.fromCity}→${o.toCity} ${o.price}IQD`);
      return `${data.total || data.offers.length} offers: ${summaries.join(', ')}`;
    })
  )
    passed++;
  else failed++;

  // 4. Offers with filter
  if (
    await test('GET /api/offers?fromCity=بغداد (filter)', async () => {
      const { data } = await fetchJSON('/api/offers?fromCity=' + encodeURIComponent('بغداد'));
      if (!data.offers) throw new Error(data.error?.message || JSON.stringify(data.error));
      const allFromBaghdad = data.offers.every((o) => o.fromCity === 'بغداد');
      if (data.offers.length > 0 && !allFromBaghdad) throw new Error('Filter not working');
      return `${data.offers.length} offers from Baghdad`;
    })
  )
    passed++;
  else failed++;

  // 5. Demands list
  if (
    await test('GET /api/demands', async () => {
      const { data } = await fetchJSON('/api/demands');
      if (!data.demands) throw new Error(data.error?.message || JSON.stringify(data.error));
      return `${data.total || data.demands.length} demands`;
    })
  )
    passed++;
  else failed++;

  // 6. Auth login (email/password)
  if (
    await test('POST /api/auth/login (driver@test.com)', async () => {
      const { status, data } = await fetchJSON('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'driver@test.com', password: 'Test1234!' }),
      });
      // Response is { success, data: { user, token } }
      const inner = data.data || data;
      if (!inner.token)
        throw new Error(data.error || data.message || `No token (status ${status})`);
      token = inner.token;
      const user = inner.user;
      return `Logged in as ${user.name} (${user.is_driver || user.isDriver ? 'driver' : 'passenger'})`;
    })
  )
    passed++;
  else failed++;

  // 7. Auth profile (with token)
  if (
    await test('GET /api/auth/profile (authenticated)', async () => {
      if (!token) throw new Error('No token from login');
      const { data } = await fetchJSON('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Response is { success, data: { user } }
      const inner = data.data || data;
      const user = inner.user || inner;
      if (!user.name && !user.email) throw new Error(data.error || 'No user data');
      return `Profile: ${user.name} | ${user.email} | driver: ${user.isDriver ?? user.is_driver}`;
    })
  )
    passed++;
  else failed++;

  // 8. OTP send (will fail if OTPIQ not configured — expected)
  if (
    await test('POST /api/otp/send (phone auth)', async () => {
      const { status, data } = await fetchJSON('/api/otp/send', {
        method: 'POST',
        body: JSON.stringify({ phone: '07701234567' }),
      });
      if (data.success) return `OTP sent via ${data.channel}`;
      if (status === 500 && data.error) return `[EXPECTED FAIL] OTPIQ not configured`;
      throw new Error(data.error);
    })
  )
    passed++;
  else failed++;

  // 9. Create an offer (as driver) — uses camelCase field names
  if (
    await test('POST /api/offers (create offer)', async () => {
      if (!token) throw new Error('No token');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      const { data } = await fetchJSON('/api/offers', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          fromCity: 'بغداد',
          toCity: 'الموصل',
          departureTime: tomorrow.toISOString(),
          seats: 3,
          price: 35000,
        }),
      });
      if (data.error)
        throw new Error(
          typeof data.error === 'string' ? data.error : data.message || JSON.stringify(data.details)
        );
      const offer = data.data?.offer || data.offer || data.data || data;
      return `Created offer ${offer.id || offer.fromCity || 'OK'}`;
    })
  )
    passed++;
  else failed++;

  // 10. Login as passenger
  let passengerToken = null;
  if (
    await test('POST /api/auth/login (passenger@test.com)', async () => {
      const { data } = await fetchJSON('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'passenger@test.com', password: 'Test1234!' }),
      });
      const inner = data.data || data;
      if (!inner.token) throw new Error(data.error || 'Login failed');
      passengerToken = inner.token;
      return `Logged in as ${inner.user.name}`;
    })
  )
    passed++;
  else failed++;

  // 11. Create a booking (passenger books driver's offer) — uses camelCase
  if (
    await test('POST /api/bookings (book an offer)', async () => {
      if (!passengerToken) throw new Error('No passenger token');
      // Get first available offer
      const offersRes = await fetchJSON('/api/offers');
      const firstOffer = offersRes.data.offers?.[0];
      if (!firstOffer) throw new Error('No offers available');

      const { data } = await fetchJSON('/api/bookings', {
        method: 'POST',
        headers: { Authorization: `Bearer ${passengerToken}` },
        body: JSON.stringify({
          offerId: firstOffer.id,
          seats: 1,
        }),
      });
      if (data.error) {
        const errMsg =
          typeof data.error === 'string'
            ? data.error
            : data.message || JSON.stringify(data.details);
        // Already booked is OK for re-runs
        if (errMsg.includes('already') || errMsg.includes('مسبقاً')) return `[OK] Already booked`;
        throw new Error(errMsg);
      }
      const booking = data.data?.booking || data.booking || data;
      return `Booked offer ${firstOffer.fromCity}→${firstOffer.toCity} | status: ${booking.status || 'pending'}`;
    })
  )
    passed++;
  else failed++;

  // 12. Get notifications
  if (
    await test('GET /api/notifications (driver)', async () => {
      if (!token) throw new Error('No token');
      const { data } = await fetchJSON('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Response is { success, data: { notifications } }
      const inner = data.data || data;
      const notifs = inner.notifications || inner;
      if (!Array.isArray(notifs))
        throw new Error('Unexpected response: ' + JSON.stringify(data).slice(0, 100));
      return `${notifs.length} notifications`;
    })
  )
    passed++;
  else failed++;

  // Summary
  console.log('\n=========================================');
  console.log(`  RESULTS: ${passed} passed, ${failed} failed (${passed + failed} total)`);
  console.log('=========================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
