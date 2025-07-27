-- Debug script to troubleshoot attendee data issues
-- Run this in Supabase SQL Editor to check your data

-- 1. Check if we have any events
SELECT 'Events count:' as info, COUNT(*) as count FROM events
UNION ALL
SELECT 'Users count:', COUNT(*) FROM users
UNION ALL
SELECT 'Event attendees count:', COUNT(*) FROM event_attendees;

-- 2. Check the latest events
SELECT 
    id,
    title,
    date,
    created_at
FROM events 
ORDER BY created_at DESC 
LIMIT 3;

-- 3. Check the latest users
SELECT 
    id,
    name,
    email,
    role,
    created_at
FROM users 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Check event attendees with user data
SELECT 
    ea.id as attendee_id,
    ea.event_id,
    ea.user_id,
    ea.status,
    ea.created_at as registration_date,
    e.title as event_title,
    u.name as user_name,
    u.email as user_email,
    u.role as user_role,
    CASE 
        WHEN u.name IS NULL THEN '❌ Missing user data'
        ELSE '✅ User data found'
    END as status_check
FROM event_attendees ea
LEFT JOIN events e ON ea.event_id = e.id
LEFT JOIN users u ON ea.user_id = u.id
ORDER BY ea.created_at DESC
LIMIT 10;

-- 5. Check for orphaned attendee records (no matching user)
SELECT 
    'Orphaned attendees:' as info,
    COUNT(*) as count
FROM event_attendees ea
LEFT JOIN users u ON ea.user_id = u.id
WHERE u.id IS NULL
UNION ALL
SELECT 
    'Valid attendees:',
    COUNT(*)
FROM event_attendees ea
INNER JOIN users u ON ea.user_id = u.id;

-- 6. Show sample data for the first event with attendees
WITH event_with_attendees AS (
    SELECT DISTINCT event_id 
    FROM event_attendees 
    LIMIT 1
)
SELECT 
    ea.id as attendee_id,
    ea.event_id,
    ea.user_id,
    ea.status,
    ea.created_at,
    u.name,
    u.email,
    u.role
FROM event_attendees ea
LEFT JOIN users u ON ea.user_id = u.id
WHERE ea.event_id IN (SELECT event_id FROM event_with_attendees)
ORDER BY ea.created_at ASC; 