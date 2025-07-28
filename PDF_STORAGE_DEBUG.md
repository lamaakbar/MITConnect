# PDF Storage Debug Guide

## Issue: PDF URLs Not Accessible

If you're getting "Unable to open URL" errors when trying to access PDFs, follow these debugging steps:

### 1. Check Supabase Storage Buckets

Run these SQL queries in your Supabase SQL editor:

```sql
-- Check if buckets exist
SELECT * FROM storage.buckets WHERE id IN ('images', 'book-pdfs');

-- Check bucket permissions
SELECT 
    bucket_id,
    name,
    owner,
    public
FROM storage.buckets 
WHERE id IN ('images', 'book-pdfs');

-- Check RLS policies on storage.objects
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
WHERE tablename = 'objects' AND schemaname = 'storage';
```

### 2. Check PDF Files in Storage

```sql
-- List all PDF files in images bucket
SELECT 
    name,
    bucket_id,
    created_at,
    updated_at,
    metadata
FROM storage.objects 
WHERE bucket_id = 'images' 
AND name LIKE '%.pdf' OR name LIKE '%pdfs/%';

-- List all PDF files in book-pdfs bucket
SELECT 
    name,
    bucket_id,
    created_at,
    updated_at,
    metadata
FROM storage.objects 
WHERE bucket_id = 'book-pdfs' 
AND name LIKE '%.pdf';
```

### 3. Check Books Table for PDF Paths

```sql
-- Check which books have PDF paths
SELECT 
    id,
    title,
    pdf_path,
    created_at
FROM books 
WHERE pdf_path IS NOT NULL
ORDER BY created_at DESC;
```

### 4. Test PDF URLs Manually

For each PDF path found, test the URL manually:

1. **Images bucket**: `https://[YOUR_PROJECT_REF].supabase.co/storage/v1/object/public/images/[pdf_path]`
2. **Book-pdfs bucket**: `https://[YOUR_PROJECT_REF].supabase.co/storage/v1/object/public/book-pdfs/[pdf_path]`

### 5. Common Issues and Solutions

#### Issue 1: Bucket Doesn't Exist
**Solution**: Create the missing bucket in Supabase Dashboard:
1. Go to Storage in Supabase Dashboard
2. Click "Create a new bucket"
3. Name: `book-pdfs` (if missing)
4. Make it public (uncheck "Private bucket")
5. Click "Create bucket"

#### Issue 2: RLS Policies Blocking Access
**Solution**: Run this SQL to disable RLS temporarily for testing:
```sql
-- Temporary fix: Disable RLS on storage.objects
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

#### Issue 3: Files Not Actually Uploaded
**Solution**: Check if files exist in storage:
```sql
-- Count files in each bucket
SELECT 
    bucket_id,
    COUNT(*) as file_count
FROM storage.objects 
GROUP BY bucket_id;
```

#### Issue 4: Wrong Path Format
**Solution**: Check the path format in the database:
```sql
-- Check PDF path formats
SELECT 
    id,
    title,
    pdf_path,
    CASE 
        WHEN pdf_path LIKE 'pdfs/%' THEN 'images bucket'
        WHEN pdf_path LIKE '%/%' THEN 'book-pdfs bucket'
        ELSE 'unknown format'
    END as bucket_guess
FROM books 
WHERE pdf_path IS NOT NULL;
```

### 6. Fix Upload Service

If the issue persists, the problem might be in the upload service. Check:

1. **Bucket Selection**: Make sure PDFs are being uploaded to the correct bucket
2. **Path Format**: Ensure paths are stored consistently
3. **File Permissions**: Verify files are uploaded with public access

### 7. Manual File Upload Test

To test if the issue is with the upload service:

1. Go to Supabase Dashboard → Storage
2. Navigate to the `images` bucket
3. Create a `pdfs` folder if it doesn't exist
4. Upload a test PDF manually
5. Try accessing it via the public URL

### 8. Console Debugging

The updated `openPDF` function now includes extensive logging. Check the console for:

- `📄 Attempting to open PDF with path: [path]`
- `🔍 Trying bucket: [bucket] with path: [path]`
- `📄 Generated PDF URL: [url]`
- `✅ PDF URL is accessible` or `❌ PDF URL not accessible`

This will help identify exactly where the issue occurs.

### 9. Quick Fix Commands

If you need to quickly fix the issue, run these in order:

```sql
-- 1. Ensure buckets exist and are public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('book-pdfs', 'book-pdfs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Disable RLS temporarily
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 3. Check results
SELECT * FROM storage.buckets WHERE id IN ('images', 'book-pdfs');
```

After running these, try accessing the PDF again. If it works, the issue was with bucket configuration or RLS policies. 