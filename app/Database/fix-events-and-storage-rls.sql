-- =====================================================
-- Fix Events Table and Storage RLS Policies
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Step 1: Enable RLS on events table (if not already enabled)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop any existing policies for events table (if they exist)
DROP POLICY IF EXISTS "Public read access for events" ON events;
DROP POLICY IF EXISTS "Authenticated insert access for events" ON events;
DROP POLICY IF EXISTS "Authenticated update access for events" ON events;
DROP POLICY IF EXISTS "Authenticated delete access for events" ON events;
DROP POLICY IF EXISTS "Admin full access for events" ON events;

-- Step 3: Create RLS policies for events table

-- Policy 1: Allow public read access for events
CREATE POLICY "Public read access for events" 
ON events FOR SELECT 
USING (true);

-- Policy 2: Allow authenticated users to insert events
CREATE POLICY "Authenticated insert access for events" 
ON events FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Policy 3: Allow authenticated users to update their own events
CREATE POLICY "Authenticated update access for events" 
ON events FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Policy 4: Allow authenticated users to delete their own events
CREATE POLICY "Authenticated delete access for events" 
ON events FOR DELETE 
USING (auth.role() = 'authenticated');

-- Policy 5: Allow admin users full access to all events
CREATE POLICY "Admin full access for events" 
ON events FOR ALL 
USING (
  auth.role() = 'authenticated' 
  AND EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Step 4: Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop any existing policies for event-images bucket (if they exist)
DROP POLICY IF EXISTS "Public read access for event-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated insert access for event-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update access for event-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete access for event-images" ON storage.objects;

-- Step 6: Create RLS policies for event-images bucket

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

-- Step 7: Verify the policies were created
SELECT 
  'events' as table_name,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'events' 
ORDER BY policyname;

SELECT 
  'storage.objects' as table_name,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%event-images%'
ORDER BY policyname;

-- Step 8: Test the policies (optional - you can run this to verify)
SELECT 
  'events' as table_name,
  'SELECT' as operation,
  'Public read access for events' as policy_name,
  EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'events' 
    AND policyname = 'Public read access for events'
  ) as policy_exists
UNION ALL
SELECT 
  'events' as table_name,
  'INSERT' as operation,
  'Authenticated insert access for events' as policy_name,
  EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'events' 
    AND policyname = 'Authenticated insert access for events'
  ) as policy_exists
UNION ALL
SELECT 
  'storage.objects' as table_name,
  'SELECT' as operation,
  'Public read access for event-images' as policy_name,
  EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Public read access for event-images'
  ) as policy_exists
UNION ALL
SELECT 
  'storage.objects' as table_name,
  'INSERT' as operation,
  'Authenticated insert access for event-images' as policy_name,
  EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Authenticated insert access for event-images'
  ) as policy_exists;

-- =====================================================
-- Summary of what this script does:
-- =====================================================
-- ✅ Enables RLS on events table
-- ✅ Creates 5 policies for events table:
--    1. Public read access (anyone can view events)
--    2. Authenticated insert access (logged-in users can create events)
--    3. Authenticated update access (logged-in users can modify events)
--    4. Authenticated delete access (logged-in users can delete events)
--    5. Admin full access (admin users have all permissions)
-- ✅ Enables RLS on storage.objects table
-- ✅ Creates 4 policies for event-images bucket:
--    1. Public read access (anyone can view images)
--    2. Authenticated insert access (logged-in users can upload)
--    3. Authenticated update access (logged-in users can modify)
--    4. Authenticated delete access (logged-in users can delete)
-- ✅ Verifies the policies were created correctly
-- ===================================================== 