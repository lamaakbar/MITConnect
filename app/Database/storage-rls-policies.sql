-- Storage RLS Policies for book-covers bucket
-- Run this script in your Supabase SQL editor

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to upload images to book-covers bucket
CREATE POLICY "Allow authenticated users to upload book covers" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'book-covers' 
  AND auth.role() = 'authenticated'
);

-- Policy to allow public read access to book covers
CREATE POLICY "Allow public read access to book covers" ON storage.objects
FOR SELECT USING (
  bucket_id = 'book-covers'
);

-- Policy to allow authenticated users to update their uploaded book covers
CREATE POLICY "Allow authenticated users to update book covers" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'book-covers' 
  AND auth.role() = 'authenticated'
);

-- Policy to allow authenticated users to delete book covers
CREATE POLICY "Allow authenticated users to delete book covers" ON storage.objects
FOR DELETE USING (
  bucket_id = 'book-covers' 
  AND auth.role() = 'authenticated'
);

-- Verify the policies were created
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
AND schemaname = 'storage'; 