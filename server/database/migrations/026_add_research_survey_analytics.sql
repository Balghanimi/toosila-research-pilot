-- Migration 026: Research pilot - survey responses and analytics events
-- Supports the campus ride-sharing adoption study

-- ============================================================
-- 1. Survey responses table (pre-survey and post-survey)
-- ============================================================
CREATE TABLE IF NOT EXISTS survey_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    survey_type VARCHAR(20) NOT NULL CHECK (survey_type IN ('pre', 'post', 'weekly')),

    -- Commute profile
    commute_mode VARCHAR(30),                    -- private_car, taxi, minibus, walking, motorcycle, other
    daily_cost_iqd INTEGER,                      -- daily commute cost in IQD
    commute_time_minutes INTEGER,                -- one-way commute time
    commute_days_per_week INTEGER,               -- days commuting to campus

    -- Likert scales (1-7) stored as JSONB for flexibility
    willingness_to_share JSONB,                  -- 5 items
    interpersonal_trust JSONB,                   -- 6 items (Gefen et al. 2003)
    platform_trust JSONB,                        -- 5 items (McKnight et al. 2002)
    gender_comfort JSONB,                        -- 4 items
    technology_readiness JSONB,                  -- 8 items (Parasuraman & Colby 2015)

    -- Post-survey only
    satisfaction JSONB,                          -- 6 items (post only)
    nps_score INTEGER CHECK (nps_score BETWEEN 0 AND 10),           -- Net Promoter Score
    sus_score JSONB,                             -- System Usability Scale, 10 items (post only)
    willingness_to_continue INTEGER CHECK (willingness_to_continue BETWEEN 1 AND 7),
    open_feedback TEXT,                          -- free-text barriers/suggestions

    -- Metadata
    study_group VARCHAR(20) DEFAULT 'treatment' CHECK (study_group IN ('treatment', 'control')),
    study_week INTEGER,                          -- for weekly check-ins
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Prevent duplicate survey submissions per type per user (allow weekly repeats)
CREATE UNIQUE INDEX IF NOT EXISTS idx_survey_unique_pre_post
    ON survey_responses(user_id, survey_type)
    WHERE survey_type IN ('pre', 'post');

CREATE UNIQUE INDEX IF NOT EXISTS idx_survey_unique_weekly
    ON survey_responses(user_id, survey_type, study_week)
    WHERE survey_type = 'weekly';

CREATE INDEX IF NOT EXISTS idx_survey_user ON survey_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_survey_type ON survey_responses(survey_type);
CREATE INDEX IF NOT EXISTS idx_survey_group ON survey_responses(study_group);

-- ============================================================
-- 2. Analytics events table (behavioral tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    event_category VARCHAR(30) NOT NULL,         -- ride, search, feature, engagement, survey

    -- Event data (flexible)
    properties JSONB DEFAULT '{}',

    -- Context
    session_id VARCHAR(64),
    platform VARCHAR(20),                        -- web, android, ios
    app_version VARCHAR(20),

    -- Anonymized location (grid cell, not exact)
    grid_cell VARCHAR(20),                       -- e.g., "32.03_44.40" (500m grid)

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_category ON analytics_events(event_category);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events(session_id);

-- ============================================================
-- 3. Add research consent flag to users
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS research_consent BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS research_consent_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS study_group VARCHAR(20) CHECK (study_group IN ('treatment', 'control'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS survey_completed_pre BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS survey_completed_post BOOLEAN DEFAULT false;

-- ============================================================
-- 4. Auto-update updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_survey_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_survey_updated_at ON survey_responses;
CREATE TRIGGER trigger_survey_updated_at
    BEFORE UPDATE ON survey_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_survey_updated_at();
