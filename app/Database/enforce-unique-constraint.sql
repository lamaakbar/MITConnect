-- Enforce unique constraint on event_attendees
-- This script ensures no duplicate registrations can be created

-- First, let's check if the unique constraint exists
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE' 
    AND tc.table_name = 'event_attendees';

-- Drop the existing unique constraint if it exists (to recreate it)
ALTER TABLE event_attendees 
DROP CONSTRAINT IF EXISTS event_attendees_event_id_user_id_key;

-- Create a new unique constraint with a proper name
ALTER TABLE event_attendees 
ADD CONSTRAINT event_attendees_event_id_user_id_unique 
UNIQUE (event_id, user_id);

-- Verify the constraint was created
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE' 
    AND tc.table_name = 'event_attendees';

-- Test the constraint by trying to insert a duplicate (this should fail)
-- Uncomment the lines below to test, but be careful as it will cause an error
/*
INSERT INTO event_attendees (event_id, user_id, status)
SELECT event_id, user_id, 'confirmed'
FROM event_attendees
LIMIT 1;
*/

-- Show current attendees count
SELECT 
    'Unique constraint enforced' as status,
    COUNT(*) as total_attendees,
    COUNT(DISTINCT (event_id, user_id)) as unique_registrations
FROM event_attendees; 