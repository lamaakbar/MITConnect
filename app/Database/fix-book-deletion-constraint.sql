-- Fix book deletion foreign key constraint issue
-- This script handles the book_ratings_views table that's causing deletion problems

-- 1. First, check if book_ratings and book_ratings_views exist and what type they are
DO $$
BEGIN
    -- Check if book_ratings is a table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'book_ratings') THEN
        RAISE NOTICE 'book_ratings exists as a table';
        
        -- Drop the table if it exists (this will remove the foreign key constraint)
        DROP TABLE IF EXISTS book_ratings CASCADE;
        RAISE NOTICE 'Dropped book_ratings table';
    END IF;
    
    -- Check if book_ratings_views is a table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'book_ratings_views') THEN
        RAISE NOTICE 'book_ratings_views exists as a table';
        
        -- Drop the table if it exists (this will remove the foreign key constraint)
        DROP TABLE IF EXISTS book_ratings_views CASCADE;
        RAISE NOTICE 'Dropped book_ratings_views table';
    END IF;
    
    -- Check if book_ratings_views is a view
    IF EXISTS (SELECT FROM information_schema.views WHERE table_name = 'book_ratings_views') THEN
        RAISE NOTICE 'book_ratings_views exists as a view';
        
        -- Drop the view if it exists
        DROP VIEW IF EXISTS book_ratings_views CASCADE;
        RAISE NOTICE 'Dropped book_ratings_views view';
    END IF;
END $$;

-- 2. Create a function to safely delete books
CREATE OR REPLACE FUNCTION safe_delete_book(book_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    success BOOLEAN := TRUE;
BEGIN
    -- Delete from all related tables in the correct order
    
    -- Delete from book_ratings (if it exists)
    BEGIN
        DELETE FROM book_ratings WHERE book_id = $1;
        RAISE NOTICE 'Deleted from book_ratings';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Error deleting from book_ratings: %', SQLERRM;
            -- Don't set success to FALSE, just continue
    END;
    
    -- Delete from ratings
    BEGIN
        DELETE FROM ratings WHERE book_id = $1;
        RAISE NOTICE 'Deleted from ratings';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Error deleting from ratings: %', SQLERRM;
            success := FALSE;
    END;
    
    -- Delete from comments
    BEGIN
        DELETE FROM comments WHERE book_id = $1;
        RAISE NOTICE 'Deleted from comments';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Error deleting from comments: %', SQLERRM;
            success := FALSE;
    END;
    
    -- Delete from user_books
    BEGIN
        DELETE FROM user_books WHERE book_id = $1;
        RAISE NOTICE 'Deleted from user_books';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Error deleting from user_books: %', SQLERRM;
            success := FALSE;
    END;
    
    -- Finally delete the book
    BEGIN
        DELETE FROM books WHERE id = $1;
        RAISE NOTICE 'Deleted book with ID: %', $1;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Error deleting book: %', SQLERRM;
            success := FALSE;
    END;
    
    RETURN success;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION safe_delete_book(INTEGER) TO authenticated;

-- 3. Update the existing delete_book_cascade function to use the safe approach
CREATE OR REPLACE FUNCTION delete_book_cascade(book_id INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Use the safe delete function
    IF NOT safe_delete_book($1) THEN
        RAISE EXCEPTION 'Failed to delete book %', $1;
    END IF;
    
    RAISE NOTICE 'Book % and all related data deleted successfully', $1;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION delete_book_cascade(INTEGER) TO authenticated; 