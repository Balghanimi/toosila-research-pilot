-- Migration 023: Fix bookings table column names
-- The code references "seats_booked" but the column is named "seats"
-- Also adds missing "price_at_booking" column

-- Rename seats → seats_booked to match model code
ALTER TABLE bookings RENAME COLUMN seats TO seats_booked;

-- Add price_at_booking column if missing
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS price_at_booking DECIMAL;
