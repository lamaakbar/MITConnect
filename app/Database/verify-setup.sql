-- Verify polls setup is complete
-- Run this in your Supabase SQL editor

-- Check if idea_polls table exists and has correct structure
SELECT 'Checking idea_polls table...' as status;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'idea_polls' 
ORDER BY ordinal_position;

-- Check if poll_responses table exists
SELECT 'Checking poll_responses table...' as status;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'poll_responses' 
ORDER BY ordinal_position;

-- Check if function exists and works
SELECT 'Testing get_ideas_with_votes function...' as status;

SELECT COUNT(*) as total_ideas FROM get_ideas_with_votes();

-- Test poll creation
SELECT 'Testing poll creation...' as status;

INSERT INTO idea_polls (idea_id, question, options) 
VALUES (
    (SELECT id FROM ideas LIMIT 1), 
    'Test question?', 
    '["Option 1", "Option 2"]'::jsonb
) ON CONFLICT (idea_id) DO NOTHING
RETURNING id, question, options;

-- Clean up test data
DELETE FROM idea_polls WHERE question = 'Test question?';

SELECT '✅ Setup verification complete! Polls should work now.' as status; 