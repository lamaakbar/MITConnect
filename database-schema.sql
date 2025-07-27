-- =============================================
-- MITConnect Inspire Corner Database Schema
-- =============================================

-- 1. Ideas Table
CREATE TABLE ideas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Approved', 'Rejected')),
    submitter_id UUID NOT NULL,
    submitter_name VARCHAR(255) NOT NULL,
    submitter_role VARCHAR(50) NOT NULL CHECK (submitter_role IN ('trainee', 'employee', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE
);

-- 2. Votes Table
CREATE TABLE idea_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('yes', 'no', 'like', 'dislike')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(idea_id, user_id) -- Prevent duplicate votes from same user
);

-- 3. Comments Table
CREATE TABLE idea_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX idx_ideas_status ON ideas(status);
CREATE INDEX idx_ideas_submitter ON ideas(submitter_id);
CREATE INDEX idx_ideas_created_at ON ideas(created_at DESC);
CREATE INDEX idx_votes_idea_id ON idea_votes(idea_id);
CREATE INDEX idx_comments_idea_id ON idea_comments(idea_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_comments ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies
-- Ideas policies
CREATE POLICY "Users can view approved ideas and their own ideas" ON ideas
    FOR SELECT USING (
        status = 'Approved' OR 
        submitter_id = auth.uid() OR 
        auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Users can insert their own ideas" ON ideas
    FOR INSERT WITH CHECK (submitter_id = auth.uid());

CREATE POLICY "Users can update their own ideas, admins can update any" ON ideas
    FOR UPDATE USING (
        submitter_id = auth.uid() OR 
        auth.jwt() ->> 'role' = 'admin'
    );

-- Votes policies
CREATE POLICY "Users can view all votes" ON idea_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own votes" ON idea_votes
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own votes" ON idea_votes
    FOR UPDATE USING (user_id = auth.uid());

-- Comments policies
CREATE POLICY "Users can view all comments" ON idea_comments
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own comments" ON idea_comments
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own comments" ON idea_comments
    FOR UPDATE USING (user_id = auth.uid());

-- 7. Create functions for vote counting
CREATE OR REPLACE FUNCTION get_idea_vote_counts(idea_uuid UUID)
RETURNS TABLE(
    yes_votes BIGINT,
    no_votes BIGINT,
    like_votes BIGINT,
    dislike_votes BIGINT,
    total_votes BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN vote_type = 'yes' THEN 1 ELSE 0 END), 0) as yes_votes,
        COALESCE(SUM(CASE WHEN vote_type = 'no' THEN 1 ELSE 0 END), 0) as no_votes,
        COALESCE(SUM(CASE WHEN vote_type = 'like' THEN 1 ELSE 0 END), 0) as like_votes,
        COALESCE(SUM(CASE WHEN vote_type = 'dislike' THEN 1 ELSE 0 END), 0) as dislike_votes,
        COUNT(*) as total_votes
    FROM idea_votes 
    WHERE idea_id = idea_uuid;
END;
$$ LANGUAGE plpgsql;

-- 8. Create function to get ideas with vote counts
CREATE OR REPLACE FUNCTION get_ideas_with_votes()
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
    comment_count BIGINT
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
        COALESCE(c.comment_count, 0) as comment_count
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
    ORDER BY i.created_at DESC;
END;
$$ LANGUAGE plpgsql; 

-- Disable RLS for testing
ALTER TABLE ideas DISABLE ROW LEVEL SECURITY;
ALTER TABLE idea_votes DISABLE ROW LEVEL SECURITY;  
ALTER TABLE idea_comments DISABLE ROW LEVEL SECURITY; 