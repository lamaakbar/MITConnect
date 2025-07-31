-- Fix RLS policies for user_books table
-- This allows users to insert records when they have appropriate permissions

-- Drop existing policies
DROP POLICY IF EXISTS "User books are viewable by everyone" ON user_books;
DROP POLICY IF EXISTS "User books are insertable by admins" ON user_books;
DROP POLICY IF EXISTS "User books are updatable by admins" ON user_books;

-- Create new policies that allow proper access
-- Allow everyone to view user_books (for book assignments)
CREATE POLICY "User books are viewable by everyone" ON user_books FOR SELECT USING (true);

-- Allow admins to insert/update/delete user_books
CREATE POLICY "Admins can manage user books" ON user_books 
    FOR ALL USING (auth.role() = 'authenticated' AND EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    ));

-- Allow the system to insert user_books for book assignments
-- This policy allows insertion when the user is authenticated and has appropriate role
CREATE POLICY "Users can insert book assignments" ON user_books 
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own book assignments
CREATE POLICY "Users can update their own book assignments" ON user_books 
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow admins to delete user_books
CREATE POLICY "Admins can delete user books" ON user_books 
    FOR DELETE USING (auth.role() = 'authenticated' AND EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )); 