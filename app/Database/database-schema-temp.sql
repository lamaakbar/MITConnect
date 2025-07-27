-- =============================================
-- TEMPORARY FIX: More Permissive RLS Policies for Testing
-- Run this in Supabase SQL Editor to temporarily allow submissions without auth
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own ideas" ON ideas;
DROP POLICY IF EXISTS "Users can update their own ideas, admins can update any" ON ideas;
DROP POLICY IF EXISTS "Users can insert their own votes" ON idea_votes;
DROP POLICY IF EXISTS "Users can update their own votes" ON idea_votes;
DROP POLICY IF EXISTS "Users can insert their own comments" ON idea_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON idea_comments;

-- Create more permissive policies for testing
-- Ideas policies (allow all operations for testing)
CREATE POLICY "Allow all idea insertions for testing" ON ideas
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all idea updates for testing" ON ideas
    FOR UPDATE USING (true);

-- Votes policies (allow all operations for testing)
CREATE POLICY "Allow all vote insertions for testing" ON idea_votes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all vote updates for testing" ON idea_votes
    FOR UPDATE USING (true);

-- Comments policies (allow all operations for testing)
CREATE POLICY "Allow all comment insertions for testing" ON idea_comments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all comment updates for testing" ON idea_comments
    FOR UPDATE USING (true); 