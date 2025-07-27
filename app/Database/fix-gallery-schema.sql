-- Fix Gallery Schema - Add Missing user_id Columns
-- Run these commands in your Supabase SQL Editor

-- 1. Add user_id column to gallery_albums table
ALTER TABLE gallery_albums 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) NOT NULL DEFAULT gen_random_uuid();

-- 2. Add user_id column to gallery_photos table  
ALTER TABLE gallery_photos 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) NOT NULL DEFAULT gen_random_uuid();

-- 3. Update existing records to have valid user_id (if any exist)
-- This sets a default user_id for existing records
UPDATE gallery_albums 
SET user_id = gen_random_uuid() 
WHERE user_id IS NULL;

UPDATE gallery_photos 
SET user_id = gen_random_uuid() 
WHERE user_id IS NULL;

-- 4. Remove the default constraint after updating existing records
ALTER TABLE gallery_albums 
ALTER COLUMN user_id DROP DEFAULT;

ALTER TABLE gallery_photos 
ALTER COLUMN user_id DROP DEFAULT;

-- 5. Verify the schema
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('gallery_albums', 'gallery_photos') 
AND column_name = 'user_id'
ORDER BY table_name;

-- 6. Check if RLS policies need to be updated
-- The existing policies should work, but let's verify
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('gallery_albums', 'gallery_photos')
ORDER BY tablename, policyname; 