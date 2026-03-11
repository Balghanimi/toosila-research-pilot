-- Migration: Add GPS coordinates to offers and demands
-- Date: 2026-03-10
-- Description: Adds optional lat/lng and address fields for precise location pinning

-- Offers table
ALTER TABLE offers
  ADD COLUMN IF NOT EXISTS from_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS from_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS to_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS to_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS from_address TEXT,
  ADD COLUMN IF NOT EXISTS to_address TEXT;

-- Demands table
ALTER TABLE demands
  ADD COLUMN IF NOT EXISTS from_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS from_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS to_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS to_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS from_address TEXT,
  ADD COLUMN IF NOT EXISTS to_address TEXT;

-- Indexes for proximity queries
CREATE INDEX IF NOT EXISTS idx_offers_from_coords ON offers(from_lat, from_lng) WHERE from_lat IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_offers_to_coords ON offers(to_lat, to_lng) WHERE to_lat IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_demands_from_coords ON demands(from_lat, from_lng) WHERE from_lat IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_demands_to_coords ON demands(to_lat, to_lng) WHERE to_lat IS NOT NULL;
