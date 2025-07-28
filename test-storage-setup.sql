-- Test script to verify Supabase storage setup
-- Run this in your Supabase SQL editor to check storage configuration

-- 1. Check if the book-pdfs bucket exists
SELECT * FROM storage.buckets WHERE id = 'book-pdfs';

-- 2. Check current storage policies
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

-- 3. Check if RLS is enabled on storage.objects
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 4. List all storage buckets
SELECT * FROM storage.buckets;

-- 5. Check current user and role
SELECT current_user, current_setting('role');

-- 6. Test if we can insert into storage (this will help identify the exact issue)
-- Note: This is just a test query, don't run in production
-- INSERT INTO storage.objects (bucket_id, name, owner, metadata) 
-- VALUES ('book-pdfs', 'test-file.pdf', auth.uid(), '{"mimetype": "application/pdf"}'); 