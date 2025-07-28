# PDF Upload Setup Guide

## Overview
The Admin book form now supports PDF upload functionality. PDFs are stored in Supabase Storage and the file path is saved in the `books` table.

## Database Setup

### 1. Add PDF Path Column
Run the following SQL migration to add the `pdf_path` column to the books table:

```sql
-- Add pdf_path column to books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS pdf_path TEXT;

-- Add comment to document the column purpose
COMMENT ON COLUMN books.pdf_path IS 'Full path to PDF file in Supabase Storage (e.g., book-pdfs/filename.pdf)';
```

### 2. Create Supabase Storage Bucket
Create a new storage bucket named `book-pdfs` in your Supabase project:

1. Go to your Supabase dashboard
2. Navigate to Storage
3. Click "Create a new bucket"
4. Name: `book-pdfs`
5. Make it public (uncheck "Private bucket")
6. Click "Create bucket"

### 3. Set Storage Policies
Add the following RLS policies to allow public access to PDF files:

```sql
-- Allow public read access to PDF files
CREATE POLICY "Public read access to book PDFs" ON storage.objects
FOR SELECT USING (bucket_id = 'book-pdfs');

-- Allow authenticated users to upload PDFs
CREATE POLICY "Authenticated users can upload PDFs" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'book-pdfs' AND auth.role() = 'authenticated');

-- Allow authenticated users to update PDFs
CREATE POLICY "Authenticated users can update PDFs" ON storage.objects
FOR UPDATE USING (bucket_id = 'book-pdfs' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete PDFs
CREATE POLICY "Authenticated users can delete PDFs" ON storage.objects
FOR DELETE USING (bucket_id = 'book-pdfs' AND auth.role() = 'authenticated');
```

## Features

### PDF Upload
- Users can upload PDF files up to 50MB
- Files are stored in the `book-pdfs/pdfs/` folder
- Unique filenames are generated to prevent conflicts
- Both primary and fallback upload methods are available

### PDF Management
- PDFs can be replaced/updated from the same form
- File paths are stored in the database for easy retrieval
- Public URLs are generated for direct access
- PDFs are displayed in book details page with download functionality

### File Structure
```
book-pdfs/
└── pdfs/
    ├── book-1234567890-abc123.pdf
    ├── book-1234567891-def456.pdf
    └── ...
```

## Usage

### Adding a Book with PDF
1. Navigate to the Add Book form
2. Fill in book information (title, author, genre, etc.)
3. Upload a book cover image (required)
4. Optionally upload a PDF file
5. Click "Add Book"

### Viewing and Downloading PDFs
1. Navigate to any book details page
2. Look for the "Book PDF" section under "About This Book"
3. If a PDF is available, click "Download" to open it
4. If no PDF is available, it will show "No PDF available for this book"

### Replacing a PDF
1. In the PDF upload section, click "Replace PDF"
2. Select a new PDF file
3. The old PDF will be replaced with the new one

## Technical Details

### Dependencies
- `expo-document-picker`: For selecting PDF files
- `expo-file-system`: For reading file data
- `base64-arraybuffer`: For file conversion
- `buffer`: For fallback file handling

### Services
- `pdfUploadService.ts`: Handles PDF upload to Supabase Storage
- `supabase.ts`: Database and storage client

### Error Handling
- Timeout protection for large files
- Fallback upload methods
- Network error detection
- User-friendly error messages

## Security Considerations

1. **File Size Limits**: PDFs are limited to 50MB
2. **File Type Validation**: Only PDF files are accepted
3. **Authentication**: Upload requires authenticated users
4. **Public Access**: PDFs are publicly readable for easy access
5. **Unique Filenames**: Prevents filename conflicts

## Troubleshooting

### Common Issues

1. **Upload Fails**: Check internet connection and file size
2. **File Not Found**: Verify the storage bucket exists and is public
3. **Permission Errors**: Ensure RLS policies are correctly configured
4. **Timeout Errors**: Try uploading a smaller file or check network speed
5. **RLS Policy Violation**: The most common issue - see detailed steps below

### RLS Policy Violation Fix

If you see the error "new row violates row-level security policy", follow these steps:

1. **Check Bucket Exists**: Run this in Supabase SQL editor:
   ```sql
   SELECT * FROM storage.buckets WHERE id = 'book-pdfs';
   ```

2. **Create Bucket if Missing**: In Supabase Dashboard → Storage → Create bucket:
   - Name: `book-pdfs`
   - Public: ✅ (uncheck "Private bucket")

3. **Apply Updated Policies**: Run the updated `setup-pdf-storage-policies.sql` script

4. **Verify Policies**: Run this to check current policies:
   ```sql
   SELECT policyname, cmd, qual, with_check
   FROM pg_policies 
   WHERE tablename = 'objects' AND schemaname = 'storage';
   ```

5. **Test Authentication**: Ensure user is properly authenticated before upload

### Debug Information
The upload service includes comprehensive logging:
- File selection and processing
- Upload progress and completion
- Error details and fallback attempts
- Network and timeout information
- Authentication status checks
- RLS policy error detection 