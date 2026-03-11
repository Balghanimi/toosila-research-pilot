-- Toosila Database Health Check
-- Run with: psql $DATABASE_URL -f check-db.sql

\echo '🔍 Toosila Database Health Check'
\echo '================================='
\echo ''

-- Table counts
\echo '📊 Table Row Counts:'
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'offers', COUNT(*) FROM offers
UNION ALL
SELECT 'demands', COUNT(*) FROM demands
UNION ALL
SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL
SELECT 'messages', COUNT(*) FROM messages
UNION ALL
SELECT 'ratings', COUNT(*) FROM ratings;

\echo ''
\echo '👥 Users by Role:'
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role 
ORDER BY count DESC;

\echo ''
\echo '🚗 Active Offers (next 7 days):'
SELECT 
  o.id,
  u.name as driver,
  o.from_city,
  o.to_city,
  o.departure_time,
  o.available_seats,
  o.price
FROM offers o
JOIN users u ON o.driver_id = u.id
WHERE o.is_active = TRUE 
  AND o.departure_time >= NOW()
  AND o.departure_time <= NOW() + INTERVAL '7 days'
ORDER BY o.departure_time
LIMIT 10;

\echo ''
\echo '📨 Recent Messages (last 24h):'
SELECT 
  m.id,
  sender.name as sender,
  receiver.name as receiver,
  LEFT(m.content, 50) as content_preview,
  m.created_at
FROM messages m
JOIN users sender ON m.sender_id = sender.id
JOIN users receiver ON m.receiver_id = receiver.id
WHERE m.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY m.created_at DESC
LIMIT 10;

\echo ''
\echo '📝 Pending Bookings:'
SELECT 
  b.id,
  passenger.name as passenger,
  driver.name as driver,
  o.from_city,
  o.to_city,
  b.seats,
  b.created_at
FROM bookings b
JOIN users passenger ON b.passenger_id = passenger.id
JOIN offers o ON b.offer_id = o.id
JOIN users driver ON o.driver_id = driver.id
WHERE b.status = 'pending'
ORDER BY b.created_at DESC
LIMIT 10;

\echo ''
\echo '⭐ Top Rated Users:'
SELECT 
  name,
  role,
  rating_avg,
  rating_count
FROM users
WHERE rating_count > 0
ORDER BY rating_avg DESC, rating_count DESC
LIMIT 10;

\echo ''
\echo '🔴 Unread Messages by User:'
SELECT 
  u.name,
  COUNT(*) as unread_count
FROM messages m
JOIN users u ON m.receiver_id = u.id
WHERE m.read_at IS NULL
GROUP BY u.id, u.name
HAVING COUNT(*) > 0
ORDER BY unread_count DESC
LIMIT 10;

\echo ''
\echo '📈 Bookings by Status:'
SELECT 
  status,
  COUNT(*) as count
FROM bookings
GROUP BY status
ORDER BY count DESC;

\echo ''
\echo '🏙️ Most Popular Routes:'
SELECT 
  from_city,
  to_city,
  COUNT(*) as ride_count
FROM offers
WHERE is_active = TRUE
GROUP BY from_city, to_city
ORDER BY ride_count DESC
LIMIT 10;

\echo ''
\echo '✅ Health check complete!'
