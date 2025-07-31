-- =====================================================
-- Fix Event Images RLS Policies
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Step 1: Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop any existing policies for event-images bucket (if they exist)
DROP POLICY IF EXISTS "Public read access for event-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated insert access for event-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update access for event-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete access for event-images" ON storage.objects;

-- Step 3: Create new RLS policies for event-images bucket

-- Policy 1: Allow public read access for event-images bucket
CREATE POLICY "Public read access for event-images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'event-images');

-- Policy 2: Allow authenticated users to insert into event-images bucket
CREATE POLICY "Authenticated insert access for event-images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'event-images' 
  AND auth.role() = 'authenticated'
);

-- Policy 3: Allow authenticated users to update files in event-images bucket
CREATE POLICY "Authenticated update access for event-images" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'event-images' 
  AND auth.role() = 'authenticated'
);

-- Policy 4: Allow authenticated users to delete files in event-images bucket
CREATE POLICY "Authenticated delete access for event-images" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'event-images' 
  AND auth.role() = 'authenticated'
);

-- Step 4: Verify the policies were created
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
WHERE tablename = 'objects' 
AND policyname LIKE '%event-images%'
ORDER BY policyname;

-- Step 5: Test the policies (optional - you can run this to verify)
-- This will show if the policies are working correctly
SELECT 
  'event-images' as bucket_name,
  'SELECT' as operation,
  'Public read access for event-images' as policy_name,
  EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Public read access for event-images'
  ) as policy_exists
UNION ALL
SELECT 
  'event-images' as bucket_name,
  'INSERT' as operation,
  'Authenticated insert access for event-images' as policy_name,
  EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Authenticated insert access for event-images'
  ) as policy_exists
UNION ALL
SELECT 
  'event-images' as bucket_name,
  'UPDATE' as operation,
  'Authenticated update access for event-images' as policy_name,
  EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Authenticated update access for event-images'
  ) as policy_exists
UNION ALL
SELECT 
  'event-images' as bucket_name,
  'DELETE' as operation,
  'Authenticated delete access for event-images' as policy_name,
  EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Authenticated delete access for event-images'
  ) as policy_exists;

-- =====================================================
-- Summary of what this script does:
-- =====================================================
-- ✅ Enables RLS on storage.objects table
-- ✅ Creates 4 policies for event-images bucket:
--    1. Public read access (anyone can view images)
--    2. Authenticated insert access (logged-in users can upload)
--    3. Authenticated update access (logged-in users can modify)
--    4. Authenticated delete access (logged-in users can delete)
-- ✅ Verifies the policies were created correctly
-- ===================================================== 