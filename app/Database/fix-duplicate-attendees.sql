-- Fix duplicate event attendees entries
-- This script will identify and clean up duplicate registrations

-- First, let's see what duplicates exist
SELECT 
    event_id,
    user_id,
    COUNT(*) as duplicate_count
FROM event_attendees
GROUP BY event_id, user_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Show the actual duplicate rows
WITH duplicates AS (
    SELECT 
        event_id,
        user_id,
        COUNT(*) as duplicate_count
    FROM event_attendees
    GROUP BY event_id, user_id
    HAVING COUNT(*) > 1
)
SELECT ea.*
FROM event_attendees ea
INNER JOIN duplicates d ON ea.event_id = d.event_id AND ea.user_id = d.user_id
ORDER BY ea.event_id, ea.user_id, ea.created_at;

-- Delete duplicate entries, keeping only the most recent one
DELETE FROM event_attendees 
WHERE id IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY event_id, user_id 
                   ORDER BY created_at DESC
               ) as rn
        FROM event_attendees
    ) t
    WHERE t.rn > 1
);

-- Verify the cleanup worked
SELECT 
    event_id,
    user_id,
    COUNT(*) as count_after_cleanup
FROM event_attendees
GROUP BY event_id, user_id
HAVING COUNT(*) > 1;

-- Show final count of attendees
SELECT 
    'Total attendees after cleanup' as status,
    COUNT(*) as total_attendees
FROM event_attendees; 