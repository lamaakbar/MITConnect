-- Check what columns actually exist in your trainee_feedback table
-- Run this in Supabase SQL Editor

SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'trainee_feedback' 
AND table_schema = 'public'
ORDER BY ordinal_position; 