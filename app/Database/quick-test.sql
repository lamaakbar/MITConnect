-- Quick test to diagnose the attendee names issue
-- Run this in Supabase SQL Editor

-- 1. Check if we have any data at all
SELECT '=== DATABASE STATUS ===' as info;
SELECT 'Events:', COUNT(*) FROM events;
SELECT 'Users:', COUNT(*) FROM users;
SELECT 'Event Attendees:', COUNT(*) FROM event_attendees;

-- 2. Show sample data
SELECT '=== SAMPLE EVENTS ===' as info;
SELECT id, title, date FROM events ORDER BY created_at DESC LIMIT 3;

SELECT '=== SAMPLE USERS ===' as info;
SELECT id, name, email, role FROM users ORDER BY created_at DESC LIMIT 3;

SELECT '=== SAMPLE ATTENDEES ===' as info;
SELECT id, event_id, user_id, status FROM event_attendees ORDER BY created_at DESC LIMIT 3;

-- 3. Test the join manually
SELECT '=== JOIN TEST ===' as info;
SELECT 
    ea.id as attendee_id,
    ea.user_id,
    ea.status,
    u.name,
    u.email,
    u.role
FROM event_attendees ea
LEFT JOIN users u ON ea.user_id = u.id
ORDER BY ea.created_at DESC
LIMIT 5;

-- 4. Check for specific event (replace with your event ID)
SELECT '=== SPECIFIC EVENT TEST ===' as info;
-- Replace 'your-event-id' with an actual event ID from your database
SELECT 
    ea.id,
    ea.user_id,
    ea.status,
    u.name,
    u.email,
    u.role
FROM event_attendees ea
LEFT JOIN users u ON ea.user_id = u.id
WHERE ea.event_id = 'your-event-id'  -- Replace this!
ORDER BY ea.created_at ASC; 