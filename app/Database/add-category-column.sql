-- Add category column to books table
ALTER TABLE books
ADD COLUMN category TEXT DEFAULT 'library' CHECK (category IN ('library', 'book_of_the_month'));

-- Update existing books to have 'library' as default category
UPDATE books SET category = 'library' WHERE category IS NULL; 