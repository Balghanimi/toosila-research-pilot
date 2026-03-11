# Toosila Database Schema

## Overview
PostgreSQL database hosted on Railway/Neon.
All IDs are UUIDs. All tables have `created_at` and `updated_at` timestamps.

---

## Tables

### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  role VARCHAR(20) DEFAULT 'passenger', -- passenger, driver, admin
  gender VARCHAR(10), -- male, female (for ladies-only feature)
  profile_image_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  language_preference VARCHAR(5) DEFAULT 'ar',
  rating_avg DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
```

### driver_profiles
```sql
CREATE TABLE driver_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  national_id VARCHAR(50),
  national_id_image_url TEXT,
  license_number VARCHAR(50),
  license_image_url TEXT,
  car_make VARCHAR(50),
  car_model VARCHAR(50),
  car_year INTEGER,
  car_color VARCHAR(30),
  car_plate VARCHAR(20),
  car_image_url TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### offers
```sql
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  from_city VARCHAR(50) NOT NULL,
  to_city VARCHAR(50) NOT NULL,
  departure_time TIMESTAMPTZ NOT NULL,
  seats INTEGER NOT NULL CHECK (seats > 0 AND seats <= 7),
  available_seats INTEGER NOT NULL,
  price INTEGER NOT NULL CHECK (price > 0), -- in IQD
  ladies_only BOOLEAN DEFAULT FALSE,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'active', -- active, completed, cancelled
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_offers_driver ON offers(driver_id);
CREATE INDEX idx_offers_cities ON offers(from_city, to_city);
CREATE INDEX idx_offers_departure ON offers(departure_time);
CREATE INDEX idx_offers_active ON offers(is_active) WHERE is_active = TRUE;
```

### demands
```sql
CREATE TABLE demands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id UUID REFERENCES users(id) ON DELETE CASCADE,
  from_city VARCHAR(50) NOT NULL,
  to_city VARCHAR(50) NOT NULL,
  earliest_time TIMESTAMPTZ NOT NULL,
  latest_time TIMESTAMPTZ NOT NULL,
  seats INTEGER DEFAULT 1 CHECK (seats > 0),
  budget_max INTEGER, -- in IQD
  ladies_only BOOLEAN DEFAULT FALSE,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_demands_passenger ON demands(passenger_id);
CREATE INDEX idx_demands_cities ON demands(from_city, to_city);
```

### bookings
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
  passenger_id UUID REFERENCES users(id) ON DELETE CASCADE,
  seats INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(20) DEFAULT 'pending', 
  -- pending, accepted, rejected, cancelled, completed
  price_snapshot INTEGER NOT NULL, -- price at booking time
  message TEXT, -- initial message from passenger
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(offer_id, passenger_id)
);

-- Indexes
CREATE INDEX idx_bookings_offer ON bookings(offer_id);
CREATE INDEX idx_bookings_passenger ON bookings(passenger_id);
CREATE INDEX idx_bookings_status ON bookings(status);
```

### messages
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_type VARCHAR(20) NOT NULL, -- offer, booking
  trip_id UUID NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_messages_trip ON messages(trip_type, trip_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_unread ON messages(receiver_id, read_at) 
  WHERE read_at IS NULL;
```

### ratings
```sql
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(booking_id, from_user_id)
);

-- Indexes
CREATE INDEX idx_ratings_to_user ON ratings(to_user_id);

-- Trigger to update user rating_avg
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users SET
    rating_avg = (SELECT AVG(rating) FROM ratings WHERE to_user_id = NEW.to_user_id),
    rating_count = (SELECT COUNT(*) FROM ratings WHERE to_user_id = NEW.to_user_id)
  WHERE id = NEW.to_user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rating
AFTER INSERT OR UPDATE ON ratings
FOR EACH ROW EXECUTE FUNCTION update_user_rating();
```

### audit_log
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(50),
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_created ON audit_log(created_at);
```

---

## Common Queries

### Get user's conversations
```sql
SELECT DISTINCT ON (conversation_partner)
  CASE 
    WHEN sender_id = $1 THEN receiver_id 
    ELSE sender_id 
  END as conversation_partner,
  *
FROM messages
WHERE sender_id = $1 OR receiver_id = $1
ORDER BY conversation_partner, created_at DESC;
```

### Get unread message count
```sql
SELECT COUNT(*) as unread_count
FROM messages
WHERE receiver_id = $1 AND read_at IS NULL;
```

### Get available offers for route
```sql
SELECT o.*, u.name as driver_name, u.rating_avg, u.rating_count
FROM offers o
JOIN users u ON o.driver_id = u.id
WHERE o.from_city = $1
  AND o.to_city = $2
  AND o.departure_time >= NOW()
  AND o.available_seats >= $3
  AND o.is_active = TRUE
ORDER BY o.departure_time ASC
LIMIT $4 OFFSET $5;
```

### Check if user can message
```sql
-- User can message if they have a booking or are the driver
SELECT EXISTS (
  SELECT 1 FROM bookings b
  JOIN offers o ON b.offer_id = o.id
  WHERE o.id = $1  -- offer_id
    AND (b.passenger_id = $2 OR o.driver_id = $2)  -- user_id
    AND b.status IN ('pending', 'accepted')
);
```
