-- Test script to verify attendee query with user names
-- Run this in Supabase SQL Editor to test the JOIN query

-- First, let's see what events we have
SELECT 
    id,
    title,
    date,
    status
FROM events 
ORDER BY created_at DESC 
LIMIT 5;

-- Then, let's see what users we have
SELECT 
    id,
    name,
    email,
    role
FROM users 
ORDER BY created_at DESC 
LIMIT 5;

-- Now, let's see what event registrations we have
SELECT 
    ea.id,
    ea.event_id,
    ea.user_id,
    ea.status,
    ea.created_at,
    e.title as event_title,
    u.name as user_name,
    u.email as user_email,
    u.role as user_role
FROM event_attendees ea
JOIN events e ON ea.event_id = e.id
JOIN users u ON ea.user_id = u.id
ORDER BY ea.created_at DESC
LIMIT 10;

-- Test the exact query that the EventService uses
-- Replace 'your-event-id-here' with an actual event ID from your database
SELECT 
    ea.id,
    ea.event_id,
    ea.user_id,
    ea.status,
    ea.created_at,
    u.id as user_id,
    u.name,
    u.email,
    u.role
FROM event_attendees ea
LEFT JOIN users u ON ea.user_id = u.id
WHERE ea.event_id = 'your-event-id-here'  -- Replace with actual event ID
ORDER BY ea.created_at ASC;

-- Alternative: Test with a LEFT JOIN to see all attendees even if user data is missing
SELECT 
    ea.id,
    ea.event_id,
    ea.user_id,
    ea.status,
    ea.created_at,
    u.id as user_id,
    u.name,
    u.email,
    u.role,
    CASE 
        WHEN u.name IS NULL THEN 'User ' || substring(ea.user_id::text, 1, 8)
        ELSE u.name 
    END as display_name
FROM event_attendees ea
LEFT JOIN users u ON ea.user_id = u.id
ORDER BY ea.created_at DESC
LIMIT 10; 