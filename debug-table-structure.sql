-- Quick debug queries to check table structure and permissions

-- 1. Check if table exists
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'trainee_feedback';

-- 2. Check table structure (columns and types)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'trainee_feedback'
ORDER BY ordinal_position;

-- 3. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'trainee_feedback';

-- 4. Check current user authentication
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role;

-- 5. Try a simple insert test (replace with actual values)
-- INSERT INTO trainee_feedback (trainee_id, trainee_name, feedback_text, rating) 
-- VALUES (auth.uid(), 'Test User', 'This is a test feedback', 5);

-- 6. Check existing records
SELECT COUNT(*) as total_records FROM trainee_feedback;

-- 7. Check recent records (if any)
SELECT * FROM trainee_feedback ORDER BY created_at DESC LIMIT 3; 