-- Fix foreign key relationship between event_attendees and users tables
-- This script updates the event_attendees table to properly reference the users table

-- First, drop the existing foreign key constraint if it exists
ALTER TABLE event_attendees 
DROP CONSTRAINT IF EXISTS event_attendees_user_id_fkey;

-- Add the correct foreign key constraint to reference the users table
ALTER TABLE event_attendees 
ADD CONSTRAINT event_attendees_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Verify the constraint was added
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='event_attendees'
    AND kcu.column_name = 'user_id'; 