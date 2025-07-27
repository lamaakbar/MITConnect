-- Check the structure of your existing "feedbacks" table
-- Run this in Supabase SQL Editor to see what columns you have

-- 1. Check if feedbacks table exists
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'feedbacks';

-- 2. Check the column structure of feedbacks table
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'feedbacks'
ORDER BY ordinal_position;

-- 3. Check existing data (first 3 rows)
SELECT * FROM feedbacks ORDER BY created_at DESC LIMIT 3;

-- 4. Check total record count
SELECT COUNT(*) as total_records FROM feedbacks; 