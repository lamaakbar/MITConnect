-- Update the existing get_ideas_with_votes function to include poll data
-- Run this in your Supabase SQL editor

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