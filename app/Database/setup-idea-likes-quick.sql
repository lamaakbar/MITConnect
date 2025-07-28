-- Quick Setup for Idea Likes System
-- Run this script in your Supabase SQL editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create idea_likes table
CREATE TABLE IF NOT EXISTS idea_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    liked BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, idea_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_idea_likes_user_id ON idea_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_idea_likes_idea_id ON idea_likes(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_likes_liked ON idea_likes(liked);

-- Enable Row Level Security
ALTER TABLE idea_likes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all idea likes" ON idea_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own idea likes" ON idea_likes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own idea likes" ON idea_likes
    FOR UPDATE USING (true);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_idea_likes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_idea_likes_updated_at 
    BEFORE UPDATE ON idea_likes
    FOR EACH ROW EXECUTE FUNCTION update_idea_likes_updated_at();

-- Create function to get idea like counts
CREATE OR REPLACE FUNCTION get_idea_like_counts(idea_uuid UUID)
RETURNS TABLE(
    likes_count BIGINT,
    dislikes_count BIGINT,
    total_reactions BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN liked = true THEN 1 ELSE 0 END), 0) as likes_count,
        COALESCE(SUM(CASE WHEN liked = false THEN 1 ELSE 0 END), 0) as dislikes_count,
        COUNT(*) as total_reactions
    FROM idea_likes 
    WHERE idea_id = idea_uuid;
END;
$$ LANGUAGE plpgsql;

-- Create function to get ideas with like counts
CREATE OR REPLACE FUNCTION get_ideas_with_likes()
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
    likes_count BIGINT,
    dislikes_count BIGINT,
    total_reactions BIGINT
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
        COALESCE(l.likes_count, 0) as likes_count,
        COALESCE(l.dislikes_count, 0) as dislikes_count,
        COALESCE(l.total_reactions, 0) as total_reactions
    FROM ideas i
    LEFT JOIN (
        SELECT 
            idea_id,
            SUM(CASE WHEN liked = true THEN 1 ELSE 0 END) as likes_count,
            SUM(CASE WHEN liked = false THEN 1 ELSE 0 END) as dislikes_count,
            COUNT(*) as total_reactions
        FROM idea_likes
        GROUP BY idea_id
    ) l ON i.id = l.idea_id
    ORDER BY i.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Insert some sample data for testing (optional)
INSERT INTO idea_likes (user_id, idea_id, liked) VALUES
('ec49c6ff-10f9-4eea-b54b-974b12ba984a', (SELECT id FROM ideas LIMIT 1), true)
ON CONFLICT (user_id, idea_id) DO NOTHING; 