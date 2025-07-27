-- Create a function to delete books with proper cascade handling
-- This function will handle all foreign key constraints properly

CREATE OR REPLACE FUNCTION delete_book_cascade(book_id INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete from all related tables in the correct order
  
  -- 1. Delete from book_ratings_views (if it exists)
  BEGIN
    DELETE FROM book_ratings_views WHERE book_id = $1;
  EXCEPTION
    WHEN undefined_table THEN
      -- Table doesn't exist, continue
      NULL;
  END;
  
  -- 2. Delete from ratings table
  BEGIN
    DELETE FROM ratings WHERE book_id = $1;
  EXCEPTION
    WHEN undefined_table THEN
      -- Table doesn't exist, continue
      NULL;
  END;
  
  -- 3. Delete from comments table
  BEGIN
    DELETE FROM comments WHERE book_id = $1;
  EXCEPTION
    WHEN undefined_table THEN
      -- Table doesn't exist, continue
      NULL;
  END;
  
  -- 4. Delete from user_books table
  DELETE FROM user_books WHERE book_id = $1;
  
  -- 5. Finally delete the book itself
  DELETE FROM books WHERE id = $1;
  
  -- If we get here, the deletion was successful
  RAISE NOTICE 'Book % and all related data deleted successfully', book_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_book_cascade(INTEGER) TO authenticated; 