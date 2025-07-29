-- Quick fix for missing idea_comments table
-- Run this in your Supabase SQL editor

-- Create idea_comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS idea_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL CHECK (user_role IN ('trainee', 'employee', 'admin')),
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE idea_comments ENABLE ROW LEVEL SECURITY;

-- Basic RLS policy to allow all operations (you can refine this later)
CREATE POLICY "Allow all operations on idea_comments" ON idea_comments
    FOR ALL USING (true);

-- Create basic index
CREATE INDEX IF NOT EXISTS idx_idea_comments_idea_id ON idea_comments(idea_id);