-- Test script to verify attendee display works
-- Run this in Supabase SQL Editor

-- 1. Check if we have any data
SELECT '=== CHECKING DATA ===' as info;
SELECT 'Events:', COUNT(*) FROM events;
SELECT 'Users:', COUNT(*) FROM users;
SELECT 'Attendees:', COUNT(*) FROM event_attendees;

-- 2. Show sample data
SELECT '=== SAMPLE DATA ===' as info;
SELECT 'Events:' as table_name, id, title FROM events ORDER BY created_at DESC LIMIT 2;
SELECT 'Users:' as table_name, id, name, email FROM users ORDER BY created_at DESC LIMIT 2;
SELECT 'Attendees:' as table_name, id, event_id, user_id FROM event_attendees ORDER BY created_at DESC LIMIT 2;

-- 3. Test the exact JOIN query that the app uses
SELECT '=== JOIN TEST ===' as info;
SELECT 
    ea.id,
    ea.user_id,
    ea.status,
    u.name,
    u.email,
    u.role,
    ea.created_at
FROM event_attendees ea
LEFT JOIN users u ON ea.user_id = u.id
ORDER BY ea.created_at DESC
LIMIT 5;

-- 4. If no data exists, create test data
INSERT INTO users (id, name, email, role) 
VALUES 
    (gen_random_uuid(), 'John Doe', 'john@test.com', 'employee'),
    (gen_random_uuid(), 'Jane Smith', 'jane@test.com', 'trainee')
ON CONFLICT (email) DO NOTHING;

INSERT INTO events (id, title, desc, date, time, location, category, status)
VALUES 
    (gen_random_uuid(), 'Test Event', 'Testing attendee display', '2024-12-20', '14:00', 'Main Hall', 'Workshop', 'upcoming')
ON CONFLICT DO NOTHING;

-- 5. Add test attendees
WITH test_user AS (
    SELECT id FROM users WHERE email = 'john@test.com' LIMIT 1
),
test_event AS (
    SELECT id FROM events WHERE title = 'Test Event' LIMIT 1
)
INSERT INTO event_attendees (event_id, user_id, status)
SELECT 
    test_event.id,
    test_user.id,
    'confirmed'
FROM test_user, test_event
ON CONFLICT (event_id, user_id) DO NOTHING;

-- 6. Final test with the exact query
SELECT '=== FINAL TEST ===' as info;
SELECT 
    ea.id,
    ea.user_id,
    ea.status,
    u.name,
    u.email,
    u.role,
    ea.created_at
FROM event_attendees ea
LEFT JOIN users u ON ea.user_id = u.id
LEFT JOIN events e ON ea.event_id = e.id
WHERE e.title = 'Test Event'
ORDER BY ea.created_at ASC; 