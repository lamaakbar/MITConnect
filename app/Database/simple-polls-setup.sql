-- =============================================
-- SIMPLE POLLS SETUP - Just the essentials
-- Copy and paste this entire script into Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS poll_responses CASCADE;
DROP TABLE IF EXISTS idea_polls CASCADE;

-- Create idea_polls table
CREATE TABLE idea_polls (
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

-- Create poll_responses table
CREATE TABLE poll_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID NOT NULL REFERENCES idea_polls(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    selected_option INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(poll_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_idea_polls_idea_id ON idea_polls(idea_id);
CREATE INDEX idx_poll_responses_poll_id ON poll_responses(poll_id);

-- Enable Row Level Security
ALTER TABLE idea_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_responses ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies
CREATE POLICY "Anyone can view polls" ON idea_polls
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create polls" ON idea_polls
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view poll responses" ON poll_responses
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can submit responses" ON poll_responses
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Test the setup
SELECT 'Setup complete! Tables created:' as message;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('idea_polls', 'poll_responses'); 