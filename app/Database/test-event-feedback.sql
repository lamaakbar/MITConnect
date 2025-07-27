-- Test script for Event Feedback functionality
-- Run this in Supabase SQL Editor to verify the setup

-- 1. Check if we have the required tables
SELECT '=== CHECKING TABLES ===' as info;
SELECT 'Users table exists:', COUNT(*) FROM information_schema.tables WHERE table_name = 'users';
SELECT 'Events table exists:', COUNT(*) FROM information_schema.tables WHERE table_name = 'events';
SELECT 'Event attendees table exists:', COUNT(*) FROM information_schema.tables WHERE table_name = 'event_attendees';
SELECT 'Event feedback table exists:', COUNT(*) FROM information_schema.tables WHERE table_name = 'event_feedback';

-- 2. Check current data counts
SELECT '=== DATA COUNTS ===' as info;
SELECT 'Users:', COUNT(*) FROM users;
SELECT 'Events:', COUNT(*) FROM events;
SELECT 'Event Attendees:', COUNT(*) FROM event_attendees;
SELECT 'Event Feedback:', COUNT(*) FROM event_feedback;

-- 3. Show sample data
SELECT '=== SAMPLE DATA ===' as info;
SELECT 'Users:' as table_name, id, name, email FROM users ORDER BY created_at DESC LIMIT 3;
SELECT 'Events:' as table_name, id, title, date, status FROM events ORDER BY created_at DESC LIMIT 3;
SELECT 'Attendees:' as table_name, id, event_id, user_id, status FROM event_attendees ORDER BY created_at DESC LIMIT 3;

-- 4. Create test data if needed
INSERT INTO users (id, name, email, role) 
VALUES 
    (gen_random_uuid(), 'Test User 1', 'test1@example.com', 'employee'),
    (gen_random_uuid(), 'Test User 2', 'test2@example.com', 'trainee')
ON CONFLICT (email) DO NOTHING;

-- Create a past event for testing
INSERT INTO events (id, title, desc, date, time, location, category, status)
VALUES 
    (gen_random_uuid(), 'Past Test Event', 'Testing feedback functionality', '2024-01-15', '14:00', 'Test Hall', 'Workshop', 'completed')
ON CONFLICT DO NOTHING;

-- 5. Add test attendee
WITH test_user AS (
    SELECT id FROM users WHERE email = 'test1@example.com' LIMIT 1
),
test_event AS (
    SELECT id FROM events WHERE title = 'Past Test Event' LIMIT 1
)
INSERT INTO event_attendees (event_id, user_id, status)
SELECT 
    test_event.id,
    test_user.id,
    'confirmed'
FROM test_user, test_event
ON CONFLICT (event_id, user_id) DO NOTHING;

-- 6. Test the exact queries that the app uses
SELECT '=== TESTING APP QUERIES ===' as info;

-- Test getUserEventStatus query
SELECT 'getUserEventStatus query:' as query_name;
WITH test_user AS (
    SELECT id FROM users WHERE email = 'test1@example.com' LIMIT 1
),
test_event AS (
    SELECT id FROM events WHERE title = 'Past Test Event' LIMIT 1
)
SELECT 
    ea.id,
    ea.event_id,
    ea.user_id,
    ea.status,
    ea.created_at,
    u.name as user_name,
    u.email as user_email,
    e.title as event_title,
    e.date as event_date,
    CASE 
        WHEN e.date < CURRENT_DATE THEN 'attended'
        ELSE 'registered'
    END as calculated_status
FROM event_attendees ea
JOIN users u ON ea.user_id = u.id
JOIN events e ON ea.event_id = e.id
WHERE ea.user_id = (SELECT id FROM test_user)
AND ea.event_id = (SELECT id FROM test_event);

-- Test submitEventFeedback query (check if user can submit)
SELECT 'submitEventFeedback validation:' as query_name;
WITH test_user AS (
    SELECT id FROM users WHERE email = 'test1@example.com' LIMIT 1
),
test_event AS (
    SELECT id FROM events WHERE title = 'Past Test Event' LIMIT 1
)
SELECT 
    'User registered:' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM event_attendees 
            WHERE user_id = (SELECT id FROM test_user) 
            AND event_id = (SELECT id FROM test_event)
        ) THEN 'YES'
        ELSE 'NO'
    END as result
UNION ALL
SELECT 
    'Event in past:' as check_type,
    CASE 
        WHEN (SELECT date FROM test_event) < CURRENT_DATE THEN 'YES'
        ELSE 'NO'
    END as result
UNION ALL
SELECT 
    'Feedback already submitted:' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM event_feedback 
            WHERE user_id = (SELECT id FROM test_user) 
            AND event_id = (SELECT id FROM test_event)
        ) THEN 'YES'
        ELSE 'NO'
    END as result;

-- Test actual feedback submission
SELECT '=== TEST FEEDBACK SUBMISSION ===' as info;
WITH test_user AS (
    SELECT id FROM users WHERE email = 'test1@example.com' LIMIT 1
),
test_event AS (
    SELECT id FROM events WHERE title = 'Past Test Event' LIMIT 1
)
INSERT INTO event_feedback (user_id, event_id, rating, comment)
SELECT 
    test_user.id,
    test_event.id,
    5,
    'This is a test feedback submission'
FROM test_user, test_event
ON CONFLICT (event_id, user_id) DO UPDATE SET
    rating = EXCLUDED.rating,
    comment = EXCLUDED.comment,
    created_at = NOW();

-- Show the submitted feedback
SELECT '=== SUBMITTED FEEDBACK ===' as info;
SELECT 
    u.name,
    e.title,
    ef.rating,
    ef.comment,
    ef.created_at
FROM event_feedback ef
JOIN users u ON ef.user_id = u.id
JOIN events e ON ef.event_id = e.id
WHERE u.email = 'test1@example.com'
ORDER BY ef.created_at DESC;

-- 7. Show final test data
SELECT '=== FINAL TEST DATA ===' as info;
SELECT 
    u.name,
    u.email,
    e.title,
    e.date,
    ea.status as registration_status,
    CASE 
        WHEN e.date < CURRENT_DATE THEN 'attended'
        ELSE 'registered'
    END as calculated_status,
    CASE 
        WHEN ef.id IS NOT NULL THEN 'YES'
        ELSE 'NO'
    END as has_feedback
FROM users u
JOIN event_attendees ea ON u.id = ea.user_id
JOIN events e ON ea.event_id = e.id
LEFT JOIN event_feedback ef ON u.id = ef.user_id AND e.id = ef.event_id
WHERE u.email = 'test1@example.com'
ORDER BY e.date DESC; 