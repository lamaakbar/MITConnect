-- =====================================================
-- Event Images Storage Setup
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Step 1: Create the event-images bucket
-- Note: This needs to be done manually in the Storage section of Supabase dashboard
-- Go to Storage > Create a new bucket with:
-- - Name: event-images
-- - Public bucket: ✅ (checked)
-- - File size limit: 5MB
-- - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp

-- Step 2: Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS policies for event-images bucket

-- Policy for public read access to event-images bucket
-- This allows ALL authenticated users (admin, employee, trainee) to view images
CREATE POLICY "Public read access for event-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-images');

-- Policy for admin insert access to event-images bucket
-- This allows only admin users to upload images
CREATE POLICY "Admin insert access for event-images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'event-images' 
    AND auth.role() = 'authenticated'
    AND (
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
      )
    )
  );

-- Policy for admin update access to event-images bucket
-- This allows only admin users to update images
CREATE POLICY "Admin update access for event-images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'event-images' 
    AND auth.role() = 'authenticated'
    AND (
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
      )
    )
  );

-- Policy for admin delete access to event-images bucket
-- This allows only admin users to delete images
CREATE POLICY "Admin delete access for event-images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'event-images' 
    AND auth.role() = 'authenticated'
    AND (
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
      )
    )
  );

-- Step 4: Create a helper function to get public URLs for event images
CREATE OR REPLACE FUNCTION get_event_image_public_url(image_path TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Return the full public URL for an event image
  RETURN 'https://kiijnueatpbsenrtepxp.supabase.co/storage/v1/object/public/event-images/' || image_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create a view for events with properly formatted image URLs
CREATE OR REPLACE VIEW events_with_images AS
SELECT 
  e.*,
  CASE 
    WHEN e.cover_image IS NULL OR e.cover_image = '' THEN NULL
    WHEN e.cover_image LIKE 'http%' THEN e.cover_image
    WHEN e.cover_image LIKE 'event-covers/%' THEN get_event_image_public_url(e.cover_image)
    ELSE get_event_image_public_url('event-covers/' || e.cover_image)
  END AS formatted_cover_image
FROM events e;

-- Step 6: Verify the setup
-- Check if policies were created successfully
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
AND schemaname = 'storage'
AND policyname LIKE '%event-images%';

-- Check if the function was created
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'get_event_image_public_url';

-- Check if the view was created
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name = 'events_with_images';

-- =====================================================
-- Manual Steps Required:
-- =====================================================
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "Create a new bucket"
-- 3. Set bucket name: event-images
-- 4. Check "Public bucket" ✅
-- 5. Set file size limit: 5MB
-- 6. Set allowed MIME types: image/jpeg, image/png, image/gif, image/webp
-- 7. Click "Create bucket"
-- ===================================================== 