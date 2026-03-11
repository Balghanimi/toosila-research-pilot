-- Add is_ladies_only column to offers table
-- This allows drivers to specify if their trip is for ladies only

ALTER TABLE offers 
ADD COLUMN IF NOT EXISTS is_ladies_only BOOLEAN DEFAULT FALSE;

-- Add is_ladies_only column to demands table
-- This allows passengers to specify if they want ladies-only trips

ALTER TABLE demands 
ADD COLUMN IF NOT EXISTS is_ladies_only BOOLEAN DEFAULT FALSE;

-- Create index for better query performance on ladies_only filter
CREATE INDEX IF NOT EXISTS idx_offers_ladies_only ON offers (is_ladies_only) WHERE is_ladies_only = TRUE;
CREATE INDEX IF NOT EXISTS idx_demands_ladies_only ON demands (is_ladies_only) WHERE is_ladies_only = TRUE;

-- Comment
COMMENT ON COLUMN offers.is_ladies_only IS 'Whether this trip is for ladies only';
COMMENT ON COLUMN demands.is_ladies_only IS 'Whether this request is for ladies only';
