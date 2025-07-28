-- Add pdf_path column to books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS pdf_path TEXT;

-- Add comment to document the column purpose
COMMENT ON COLUMN books.pdf_path IS 'Full path to PDF file in Supabase Storage (e.g., book-pdfs/filename.pdf)'; 