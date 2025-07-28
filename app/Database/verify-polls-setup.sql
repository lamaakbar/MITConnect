-- Verify polls setup
-- Run this in your Supabase SQL editor to check if everything is set up correctly

-- Check if idea_polls table exists and has correct structure
SELECT 
    'idea_polls table structure:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'idea_polls' 
ORDER BY ordinal_position;

-- Check if poll_responses table exists and has correct structure
SELECT 
    'poll_responses table structure:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'poll_responses' 
ORDER BY ordinal_position;

-- Check if get_ideas_with_votes function exists
SELECT 
    'Functions:' as info,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name IN ('get_ideas_with_votes', 'get_ideas_with_polls')
AND routine_schema = 'public';

-- Check if there are any polls in the database
SELECT 
    'Polls count:' as info,
    COUNT(*) as total_polls
FROM idea_polls;

-- Check if there are any poll responses
SELECT 
    'Poll responses count:' as info,
    COUNT(*) as total_responses
FROM poll_responses; 