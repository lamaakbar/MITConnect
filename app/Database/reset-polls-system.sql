-- =============================================
-- COMPLETE POLLS SYSTEM RESET
-- This script will completely remove and recreate the polls system
-- Run this in your Supabase SQL editor
-- =============================================

-- Step 1: Drop existing poll-related tables and dependencies
DROP TABLE IF EXISTS poll_responses CASCADE;
DROP TABLE IF EXISTS idea_polls CASCADE;

-- Step 2: Drop any existing functions related to polls
DROP FUNCTION IF EXISTS get_ideas_with_polls() CASCADE;
DROP FUNCTION IF EXISTS get_poll_results(UUID) CASCADE;
DROP FUNCTION IF EXISTS submit_poll_response(UUID, VARCHAR, VARCHAR, VARCHAR, INTEGER) CASCADE;

-- Step 3: Drop any existing views
DROP VIEW IF EXISTS poll_results_view CASCADE;

-- Step 4: Clean up any orphaned data or references
-- (This ensures a completely clean slate)

-- Step 5: Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- RECREATE POLLS SYSTEM FROM SCRATCH
-- =============================================

-- Create idea_polls table
CREATE TABLE idea_polls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of poll options: ["Option 1", "Option 2", "Option 3"]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255), -- Admin who created the poll
    is_active BOOLEAN DEFAULT true,
    total_votes INTEGER DEFAULT 0,
    UNIQUE(idea_id) -- One poll per idea
);

-- Create poll_responses table
CREATE TABLE poll_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID NOT NULL REFERENCES idea_polls(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NOT NULL CHECK (user_role IN ('admin', 'employee', 'trainee')),
    selected_option INTEGER NOT NULL, -- Index of the selected option (0-based)
    response_text TEXT, -- Optional text response
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(poll_id, user_id) -- One response per user per poll
);

-- =============================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_idea_polls_idea_id ON idea_polls(idea_id);
CREATE INDEX idx_idea_polls_active ON idea_polls(is_active);
CREATE INDEX idx_idea_polls_created_at ON idea_polls(created_at DESC);

CREATE INDEX idx_poll_responses_poll_id ON poll_responses(poll_id);
CREATE INDEX idx_poll_responses_user_id ON poll_responses(user_id);
CREATE INDEX idx_poll_responses_created_at ON poll_responses(created_at DESC);

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE idea_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_responses ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CREATE RLS POLICIES FOR idea_polls
-- =============================================

-- Everyone can view polls
CREATE POLICY "Anyone can view polls" ON idea_polls
    FOR SELECT USING (true);

-- Only admins can create polls
CREATE POLICY "Admins can create polls" ON idea_polls
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Only admins can update polls
CREATE POLICY "Admins can update polls" ON idea_polls
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Only admins can delete polls
CREATE POLICY "Admins can delete polls" ON idea_polls
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- =============================================
-- CREATE RLS POLICIES FOR poll_responses
-- =============================================

-- Everyone can view poll responses (for results)
CREATE POLICY "Anyone can view poll responses" ON poll_responses
    FOR SELECT USING (true);

-- Authenticated users can submit responses
CREATE POLICY "Authenticated users can submit responses" ON poll_responses
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own responses
CREATE POLICY "Users can update own responses" ON poll_responses
    FOR UPDATE USING (user_id = auth.uid()::text);

-- Users can delete their own responses
CREATE POLICY "Users can delete own responses" ON poll_responses
    FOR DELETE USING (user_id = auth.uid()::text);

-- =============================================
-- CREATE HELPER FUNCTIONS
-- =============================================

-- Function to get poll results with vote counts
CREATE OR REPLACE FUNCTION get_poll_results(poll_uuid UUID)
RETURNS TABLE (
    option_index INTEGER,
    option_text TEXT,
    vote_count BIGINT,
    percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH poll_info AS (
        SELECT p.options, 
               COALESCE(p.total_votes, 0) as total
        FROM idea_polls p 
        WHERE p.id = poll_uuid
    ),
    vote_counts AS (
        SELECT pr.selected_option,
               COUNT(*) as votes
        FROM poll_responses pr
        WHERE pr.poll_id = poll_uuid
        GROUP BY pr.selected_option
    ),
    option_series AS (
        SELECT generate_series(0, jsonb_array_length((SELECT options FROM poll_info)) - 1) as idx
    )
    SELECT 
        os.idx as option_index,
        (SELECT options->os.idx->>0 FROM poll_info) as option_text,
        COALESCE(vc.votes, 0) as vote_count,
        CASE 
            WHEN (SELECT total FROM poll_info) = 0 THEN 0
            ELSE ROUND((COALESCE(vc.votes, 0) * 100.0) / (SELECT total FROM poll_info), 1)
        END as percentage
    FROM option_series os
    LEFT JOIN vote_counts vc ON os.idx = vc.selected_option
    ORDER BY os.idx;
END;
$$ LANGUAGE plpgsql;

-- Function to submit a poll response
CREATE OR REPLACE FUNCTION submit_poll_response(
    poll_uuid UUID,
    user_uuid VARCHAR(255),
    user_display_name VARCHAR(255),
    user_user_role VARCHAR(50),
    selected_option_index INTEGER,
    response_comment TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    poll_exists BOOLEAN;
    max_option_index INTEGER;
BEGIN
    -- Check if poll exists and is active
    SELECT EXISTS(
        SELECT 1 FROM idea_polls 
        WHERE id = poll_uuid AND is_active = true
    ) INTO poll_exists;
    
    IF NOT poll_exists THEN
        RAISE EXCEPTION 'Poll not found or inactive';
    END IF;
    
    -- Check if option index is valid
    SELECT jsonb_array_length(options) - 1 INTO max_option_index
    FROM idea_polls WHERE id = poll_uuid;
    
    IF selected_option_index < 0 OR selected_option_index > max_option_index THEN
        RAISE EXCEPTION 'Invalid option index';
    END IF;
    
    -- Insert or update response
    INSERT INTO poll_responses (
        poll_id, user_id, user_name, user_role, 
        selected_option, response_text
    ) VALUES (
        poll_uuid, user_uuid, user_display_name, user_user_role,
        selected_option_index, response_comment
    )
    ON CONFLICT (poll_id, user_id) 
    DO UPDATE SET 
        selected_option = EXCLUDED.selected_option,
        response_text = EXCLUDED.response_text,
        created_at = NOW();
    
    -- Update total votes count
    UPDATE idea_polls 
    SET total_votes = (
        SELECT COUNT(*) FROM poll_responses 
        WHERE poll_id = poll_uuid
    )
    WHERE id = poll_uuid;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- CREATE TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Update timestamp trigger for idea_polls
CREATE OR REPLACE FUNCTION update_idea_polls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_idea_polls_updated_at_trigger
    BEFORE UPDATE ON idea_polls
    FOR EACH ROW
    EXECUTE FUNCTION update_idea_polls_updated_at();

-- =============================================
-- VERIFICATION AND SAMPLE DATA
-- =============================================

-- Verify tables were created
SELECT 'idea_polls table created' as status, COUNT(*) as row_count FROM idea_polls;
SELECT 'poll_responses table created' as status, COUNT(*) as row_count FROM poll_responses;

-- Show table structures
SELECT 'idea_polls structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'idea_polls' 
ORDER BY ordinal_position;

SELECT 'poll_responses structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'poll_responses' 
ORDER BY ordinal_position;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

SELECT '🎉 POLLS SYSTEM RESET COMPLETE! 🎉' as status;
SELECT 'You can now use the poll features in your app.' as message;
SELECT 'Tables created: idea_polls, poll_responses' as tables;
SELECT 'Functions created: get_poll_results(), submit_poll_response()' as functions; 