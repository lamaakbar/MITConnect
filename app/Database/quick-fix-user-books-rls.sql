-- Quick fix for user_books RLS policy
-- This allows authenticated users to insert records (temporary solution)

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "User books are insertable by admins" ON user_books;
DROP POLICY IF EXISTS "User books are updatable by admins" ON user_books;

-- Create a more permissive policy for now
CREATE POLICY "Authenticated users can insert user books" ON user_books 
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update user books" ON user_books 
    FOR UPDATE USING (auth.role() = 'authenticated'); 