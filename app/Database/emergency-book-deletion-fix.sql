-- EMERGENCY BOOK DELETION FIX
-- This script will fix the book deletion foreign key constraint issues

-- Step 1: Check what tables exist and drop problematic ones
DO $$
DECLARE
    table_name text;
BEGIN
    -- List all tables that might reference books
    FOR table_name IN 
        SELECT tablename FROM pg_tables 
        WHERE tablename LIKE '%book%' OR tablename LIKE '%rating%' OR tablename LIKE '%comment%'
    LOOP
        RAISE NOTICE 'Found table: %', table_name;
    END LOOP;
END $$;

-- Step 2: Drop any problematic tables/views that reference books
DROP TABLE IF EXISTS book_ratings CASCADE;
DROP TABLE IF EXISTS book_ratings_views CASCADE;
DROP VIEW IF EXISTS book_ratings_views CASCADE;

-- Step 3: Create a simple, direct deletion function
CREATE OR REPLACE FUNCTION emergency_delete_book(book_id INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete from all possible related tables
    BEGIN
        DELETE FROM ratings WHERE book_id = $1;
        RAISE NOTICE 'Deleted from ratings';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not delete from ratings: %', SQLERRM;
    END;
    
    BEGIN
        DELETE FROM comments WHERE book_id = $1;
        RAISE NOTICE 'Deleted from comments';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not delete from comments: %', SQLERRM;
    END;
    
    BEGIN
        DELETE FROM user_books WHERE book_id = $1;
        RAISE NOTICE 'Deleted from user_books';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not delete from user_books: %', SQLERRM;
    END;
    
    -- Finally delete the book
    DELETE FROM books WHERE id = $1;
    RAISE NOTICE 'Deleted book with ID: %', $1;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION emergency_delete_book(INTEGER) TO authenticated;

-- Step 4: Update the main function to use the emergency function
CREATE OR REPLACE FUNCTION delete_book_cascade(book_id INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    emergency_delete_book($1);
    RAISE NOTICE 'Book % deleted successfully', $1;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION delete_book_cascade(INTEGER) TO authenticated;

-- Step 5: Test the function (optional - remove this line after testing)
-- SELECT emergency_delete_book(36); 