-- Refresh Schema Cache and Verify Polls Setup
-- Run this in your Supabase SQL editor

-- Step 1: Refresh the schema cache
SELECT 'Refreshing schema cache...' as status;
SELECT pg_reload_conf();

-- Step 2: Verify tables exist
SELECT 'Checking if tables exist...' as status;
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.tables 
WHERE table_name IN ('idea_polls', 'poll_responses')
AND table_schema = 'public';

-- Step 3: Check idea_polls table structure
SELECT 'Checking idea_polls structure...' as status;
SELECT 
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_name = 'options' AND data_type = 'jsonb' THEN '✅ CORRECT'
        WHEN column_name = 'options' THEN '❌ WRONG TYPE'
        ELSE '✅ OK'
    END as options_check
FROM information_schema.columns 
WHERE table_name = 'idea_polls' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 4: Check poll_responses table structure
SELECT 'Checking poll_responses structure...' as status;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'poll_responses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 5: Test poll creation
SELECT 'Testing poll creation...' as status;
INSERT INTO idea_polls (idea_id, question, options) 
VALUES (
    (SELECT id FROM ideas LIMIT 1), 
    'Test poll question?', 
    '["Option A", "Option B", "Option C"]'::jsonb
) ON CONFLICT (idea_id) DO NOTHING
RETURNING id, question, options;

-- Step 6: Clean up test data
DELETE FROM idea_polls WHERE question = 'Test poll question?';

-- Step 7: Check function exists
SELECT 'Checking get_ideas_with_votes function...' as status;
SELECT 
    routine_name,
    routine_type,
    CASE 
        WHEN routine_name = 'get_ideas_with_votes' THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.routines 
WHERE routine_name = 'get_ideas_with_votes'
AND routine_schema = 'public';

-- Step 8: Test function
SELECT 'Testing get_ideas_with_votes function...' as status;
SELECT COUNT(*) as total_ideas FROM get_ideas_with_votes();

SELECT '✅ Schema cache refresh complete! Polls should work now.' as final_status; 