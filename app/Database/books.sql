-- books.sql
CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  isbn TEXT,
  description TEXT,
  published_date DATE,
  cover_image_url TEXT,
  genre TEXT,
  genre_color TEXT,
  category TEXT DEFAULT 'library' CHECK (category IN ('library', 'book_of_the_month')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;
-- Add RLS policies as needed 