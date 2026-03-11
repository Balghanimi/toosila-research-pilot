-- Migration 021: Add Ladies-Only Option to Offers and Demands
-- Purpose: Allow users to create ladies-only trips for safety and preference
-- Created: 2026-01-12

-- ============================================================================
-- OFFERS TABLE
-- ============================================================================

-- Add is_ladies_only column to offers table
ALTER TABLE offers ADD COLUMN IF NOT EXISTS is_ladies_only BOOLEAN DEFAULT false;

-- Create index for filtering ladies-only offers
CREATE INDEX IF NOT EXISTS idx_offers_ladies_only ON offers(is_ladies_only) WHERE is_active = true;

-- ============================================================================
-- DEMANDS TABLE
-- ============================================================================

-- Add is_ladies_only column to demands table
ALTER TABLE demands ADD COLUMN IF NOT EXISTS is_ladies_only BOOLEAN DEFAULT false;

-- Create index for filtering ladies-only demands
CREATE INDEX IF NOT EXISTS idx_demands_ladies_only ON demands(is_ladies_only) WHERE is_active = true;

-- ============================================================================
-- NOTES
-- ============================================================================

/*
Usage:
- Female users (gender = 'female') can see ALL offers/demands
- Male users (gender = 'male') can only see offers/demands where is_ladies_only = false
- When filter ladies_only = true is applied, show only ladies-only trips
*/
