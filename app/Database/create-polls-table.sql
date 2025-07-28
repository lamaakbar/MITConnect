-- Create polls table for ideas
-- Run this script in your Supabase SQL editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create polls table
CREATE TABLE IF NOT EXISTS idea_polls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of poll options
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(idea_id) -- One poll per idea
);

-- Create poll responses table
CREATE TABLE IF NOT EXISTS poll_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID NOT NULL REFERENCES idea_polls(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    selected_option INTEGER NOT NULL, -- Index of the selected option
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(poll_id, user_id) -- One response per user per poll
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_idea_polls_idea_id ON idea_polls(idea_id);
CREATE INDEX IF NOT EXISTS idx_poll_responses_poll_id ON poll_responses(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_responses_user_id ON poll_responses(user_id);

-- Enable Row Level Security
ALTER TABLE idea_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_responses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for idea_polls
CREATE POLICY "Polls are viewable by everyone" ON idea_polls
    FOR SELECT USING (true);

CREATE POLICY "Admins can create polls" ON idea_polls
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update polls" ON idea_polls
    FOR UPDATE USING (true);

CREATE POLICY "Admins can delete polls" ON idea_polls
    FOR DELETE USING (true);

-- Create RLS policies for poll_responses
CREATE POLICY "Poll responses are viewable by everyone" ON poll_responses
    FOR SELECT USING (true);

CREATE POLICY "Users can submit poll responses" ON poll_responses
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own poll responses" ON poll_responses
    FOR UPDATE USING (true);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_idea_polls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_idea_polls_updated_at 
    BEFORE UPDATE ON idea_polls
    FOR EACH ROW EXECUTE FUNCTION update_idea_polls_updated_at();

-- Create function to get poll with response counts
CREATE OR REPLACE FUNCTION get_poll_with_responses(poll_uuid UUID)
RETURNS TABLE(
    id UUID,
    idea_id UUID,
    question TEXT,
    options JSONB,
    total_responses BIGINT,
    option_counts JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.idea_id,
        p.question,
        p.options,
        COALESCE(COUNT(pr.id), 0) as total_responses,
        COALESCE(
            jsonb_object_agg(
                (pr.selected_option)::text, 
                COUNT(pr.selected_option)
            ) FILTER (WHERE pr.selected_option IS NOT NULL),
            '{}'::jsonb
        ) as option_counts
    FROM idea_polls p
    LEFT JOIN poll_responses pr ON p.id = pr.poll_id
    WHERE p.id = poll_uuid
    GROUP BY p.id, p.idea_id, p.question, p.options;
END;
$$ LANGUAGE plpgsql;

-- Create function to get ideas with polls
CREATE OR REPLACE FUNCTION get_ideas_with_polls()
RETURNS TABLE(
    id UUID,
    title VARCHAR(255),
    description TEXT,
    category VARCHAR(100),
    status VARCHAR(50),
    submitter_id UUID,
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
        FROM idea_votes
        GROUP BY idea_id
    ) v ON i.id = v.idea_id
    LEFT JOIN (
        SELECT 
            idea_id,
            COUNT(*) as comment_count
        FROM idea_comments
        GROUP BY idea_id
    ) c ON i.id = c.idea_id
    LEFT JOIN idea_polls p ON i.id = p.idea_id
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