-- =============================================
-- COMPLETE POLLS SETUP FOR INSPIRE CORNER
-- Run this entire script in your Supabase SQL editor
-- =============================================

-- Step 1: Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Create polls tables if they don't exist
CREATE TABLE IF NOT EXISTS idea_polls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    idea_id UUID NOT NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT,
    is_active BOOLEAN DEFAULT true,
    total_votes INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS poll_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID NOT NULL REFERENCES idea_polls(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    selected_option INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(poll_id, user_id)
);

-- Step 3: Create/update the function that loads ideas with poll data
CREATE OR REPLACE FUNCTION get_ideas_with_votes()
RETURNS TABLE(
    id UUID,
    title VARCHAR(255),
    description TEXT,
    category VARCHAR(100),
    status VARCHAR(50),
    submitter_id TEXT,
    submitter_name VARCHAR(255),
    submitter_role VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE,
    yes_votes BIGINT,
    no_votes BIGINT,
    like_votes BIGINT,
    dislike_votes BIGINT,
    total_votes BIGINT,
    comment_count BIGINT,
    poll_id UUID,
    poll_question TEXT,
    poll_options JSONB,
    poll_total_responses BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.title,
        i.description,
        i.category,
        i.status,
        i.submitter_id,
        i.submitter_name,
        i.submitter_role,
        i.created_at,
        COALESCE(v.yes_votes, 0) as yes_votes,
        COALESCE(v.no_votes, 0) as no_votes,
        COALESCE(v.like_votes, 0) as like_votes,
        COALESCE(v.dislike_votes, 0) as dislike_votes,
        COALESCE(v.total_votes, 0) as total_votes,
        COALESCE(c.comment_count, 0) as comment_count,
        p.id as poll_id,
        p.question as poll_question,
        p.options as poll_options,
        COALESCE(pr.total_responses, 0) as poll_total_responses
    FROM ideas i
    LEFT JOIN (
        SELECT 
            idea_id,
            SUM(CASE WHEN vote_type = 'yes' THEN 1 ELSE 0 END) as yes_votes,
            SUM(CASE WHEN vote_type = 'no' THEN 1 ELSE 0 END) as no_votes,
            SUM(CASE WHEN vote_type = 'like' THEN 1 ELSE 0 END) as like_votes,
            SUM(CASE WHEN vote_type = 'dislike' THEN 1 ELSE 0 END) as dislike_votes,
            COUNT(*) as total_votes
        FROM idea_likes
        GROUP BY idea_id
    ) v ON i.id = v.idea_id
    LEFT JOIN (
        SELECT 
            idea_id,
            COUNT(*) as comment_count
        FROM comments
        GROUP BY idea_id
    ) c ON i.id = c.idea_id
    LEFT JOIN idea_polls p ON i.id = p.idea_id AND p.is_active = true
    LEFT JOIN (
        SELECT 
            poll_id,
            COUNT(*) as total_responses
        FROM poll_responses
        GROUP BY poll_id
    ) pr ON p.id = pr.poll_id
    ORDER BY i.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Set up RLS policies
ALTER TABLE idea_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_responses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view polls" ON idea_polls;
DROP POLICY IF EXISTS "Authenticated users can create polls" ON idea_polls;
DROP POLICY IF EXISTS "Anyone can view poll responses" ON poll_responses;
DROP POLICY IF EXISTS "Authenticated users can submit responses" ON poll_responses;

-- Create new policies
CREATE POLICY "Anyone can view polls" ON idea_polls
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create polls" ON idea_polls
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view poll responses" ON poll_responses
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can submit responses" ON poll_responses
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_idea_polls_idea_id ON idea_polls(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_polls_active ON idea_polls(is_active);
CREATE INDEX IF NOT EXISTS idx_poll_responses_poll_id ON poll_responses(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_responses_user_id ON poll_responses(user_id);

-- Step 6: Test the setup
SELECT 'Setup complete! Testing function...' as message;

-- Test the function
SELECT COUNT(*) as total_ideas_loaded FROM get_ideas_with_votes();

-- Show any existing polls
SELECT 'Existing polls:' as message;
SELECT p.question, p.options, i.title as idea_title
FROM idea_polls p 
JOIN ideas i ON p.idea_id = i.id 
LIMIT 5; 