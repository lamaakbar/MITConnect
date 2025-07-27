-- user_books.sql
CREATE TABLE IF NOT EXISTS user_books (
  user_id UUID NOT NULL,
  book_id INTEGER NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'assigned',
  notes TEXT,
  PRIMARY KEY (user_id, book_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

ALTER TABLE user_books ENABLE ROW LEVEL SECURITY;
-- Add RLS policies as needed 