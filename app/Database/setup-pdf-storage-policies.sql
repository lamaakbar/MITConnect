-- Setup PDF Storage Policies for book-pdfs bucket
-- Run this after creating the book-pdfs bucket in Supabase Storage

-- First, drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public read access to book PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Allow all operations on book PDFs" ON storage.objects;

-- Option 1: Disable RLS for the storage.objects table (most permissive)
-- This allows all operations without any restrictions
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Option 2: If you prefer to keep RLS enabled, use these very permissive policies
-- Uncomment the following lines and comment out the ALTER TABLE line above if you want RLS

-- CREATE POLICY "Allow all operations on book PDFs" ON storage.objects
-- FOR ALL USING (bucket_id = 'book-pdfs');

-- CREATE POLICY "Allow all operations on storage" ON storage.objects
-- FOR ALL USING (true);

-- Option 3: If you want more specific policies, use these:
-- CREATE POLICY "Public read access to book PDFs" ON storage.objects
-- FOR SELECT USING (bucket_id = 'book-pdfs');

-- CREATE POLICY "Allow uploads to book PDFs" ON storage.objects
-- FOR INSERT WITH CHECK (bucket_id = 'book-pdfs');

-- CREATE POLICY "Allow updates to book PDFs" ON storage.objects
-- FOR UPDATE USING (bucket_id = 'book-pdfs');

-- CREATE POLICY "Allow deletes from book PDFs" ON storage.objects
-- FOR DELETE USING (bucket_id = 'book-pdfs');

-- Verify the bucket exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'book-pdfs') THEN
        RAISE EXCEPTION 'Bucket "book-pdfs" does not exist. Please create it first in the Supabase dashboard.';
    END IF;
END $$;

-- Show current RLS status
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects'; 