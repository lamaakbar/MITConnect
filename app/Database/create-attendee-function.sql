-- Create a SQL function to get event attendees with user data
-- Run this in Supabase SQL Editor

-- Drop the function if it exists
DROP FUNCTION IF EXISTS get_event_attendees_with_users(UUID);

-- Create the function
CREATE OR REPLACE FUNCTION get_event_attendees_with_users(event_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    name TEXT,
    email TEXT,
    role TEXT,
    status TEXT,
    registration_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ea.id,
        ea.user_id,
        COALESCE(u.name, 'User ' || substring(ea.user_id::text, 1, 8)) as name,
        COALESCE(u.email, 'No email available') as email,
        COALESCE(u.role, 'Unknown') as role,
        ea.status,
        ea.created_at as registration_date
    FROM event_attendees ea
    LEFT JOIN users u ON ea.user_id = u.id
    WHERE ea.event_id = get_event_attendees_with_users.event_id
    ORDER BY ea.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT '=== FUNCTION CREATED ===' as info;

-- Test with a sample event (replace with actual event ID)
-- SELECT * FROM get_event_attendees_with_users('your-event-id-here'); 