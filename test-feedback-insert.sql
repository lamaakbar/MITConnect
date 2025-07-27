-- Test insert for your exact table structure
-- Run this in Supabase SQL Editor to test

-- Test insert with your exact column names
INSERT INTO public.trainee_feedback (
    trainee_id,
    trainee_name, 
    text,
    rating
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'Test User',
    'This is a test feedback message',
    5
);

-- Check if it worked
SELECT * FROM public.trainee_feedback WHERE trainee_name = 'Test User';

-- Clean up test data
DELETE FROM public.trainee_feedback WHERE trainee_name = 'Test User'; 