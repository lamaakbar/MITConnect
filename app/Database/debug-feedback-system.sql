-- Debug script for trainee feedback system
-- Run this in your Supabase SQL Editor to check the current state

-- 1. Check if trainee_feedback table exists and its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'trainee_feedback' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check current data in the table
SELECT 
    id,
    trainee_name,
    feedback_text,
    rating,
    submission_date,
    created_at,
    CASE 
        WHEN file_name IS NOT NULL THEN 'Has file'
        ELSE 'No file'
    END as file_status
FROM public.trainee_feedback 
ORDER BY submission_date DESC, created_at DESC
LIMIT 10;

-- 3. Check RLS policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'trainee_feedback';

-- 4. Test if you can insert data (this will show permission issues)
-- Uncomment the lines below to test insertion:
-- INSERT INTO public.trainee_feedback (
--     trainee_id,
--     trainee_name, 
--     feedback_text, 
--     rating
-- ) VALUES (
--     auth.uid(),
--     'Debug Test User',
--     'This is a test feedback to verify the system works correctly with the fixed field names',
--     5
-- );

-- 5. Count total feedbacks
SELECT 
    COUNT(*) as total_feedbacks,
    COUNT(DISTINCT trainee_id) as unique_trainees,
    AVG(rating) as average_rating,
    MIN(submission_date) as oldest_feedback,
    MAX(submission_date) as newest_feedback
FROM public.trainee_feedback;

-- 6. Rating distribution
SELECT 
    rating,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM public.trainee_feedback 
GROUP BY rating
ORDER BY rating;

-- 7. Check for any data with old field names (if table was created incorrectly)
-- This will error if the old field names don't exist (which is good!)
-- Uncomment to test:
-- SELECT text, date FROM public.trainee_feedback LIMIT 1;

-- 8. Check storage bucket for feedback files
SELECT 
    name,
    created_at,
    updated_at,
    last_accessed_at
FROM storage.objects 
WHERE bucket_id = 'trainee-feedback-files'
ORDER BY created_at DESC
LIMIT 5; 