-- Migration 024: Create fcm_tokens table for push notification device tokens
-- Stores FCM device tokens per user, supporting multiple devices

CREATE TABLE IF NOT EXISTS fcm_tokens (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_info VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- One token can only belong to one user (if device switches accounts, upsert reassigns)
CREATE UNIQUE INDEX IF NOT EXISTS idx_fcm_tokens_token ON fcm_tokens(token);

-- Fast lookup by user_id for sending pushes
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_active ON fcm_tokens(user_id) WHERE is_active = TRUE;
