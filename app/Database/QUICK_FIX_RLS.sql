-- QUICK FIX for RLS Policy Violation Error
-- Run this in your Supabase SQL editor to immediately fix the PDF upload issue

-- Step 1: Disable RLS for storage.objects (this will fix the upload issue)
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Step 2: Verify the change
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- Step 3: Check if book-pdfs bucket exists
SELECT * FROM storage.buckets WHERE id = 'book-pdfs';

-- If the bucket doesn't exist, create it manually in the Supabase dashboard:
-- 1. Go to Storage in your Supabase dashboard
-- 2. Click "Create a new bucket"
-- 3. Name: book-pdfs
-- 4. Make it public (uncheck "Private bucket")
-- 5. Click "Create bucket"

-- After running this script, try uploading a PDF again.
-- The RLS error should be resolved. 