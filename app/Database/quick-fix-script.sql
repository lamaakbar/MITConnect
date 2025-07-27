-- Quick fix script for attendee names issue
-- Run this in Supabase SQL Editor

-- 1. Check existing data
SELECT '=== EXISTING DATA ===' as info;
SELECT 'Events count:', COUNT(*) FROM events;
SELECT 'Users count:', COUNT(*) FROM users;
SELECT 'Attendees count:', COUNT(*) FROM event_attendees;

-- 2. Add test data
INSERT INTO users (id, name, email, role) 
VALUES 
    (gen_random_uuid(), 'John Doe', 'john.doe@test.com', 'employee'),
    (gen_random_uuid(), 'Jane Smith', 'jane.smith@test.com', 'trainee')
ON CONFLICT (email) DO NOTHING;

INSERT INTO events (id, title, desc, date, time, location, category, status)
VALUES 
    (gen_random_uuid(), 'Test Event', 'Testing attendee names display', '2024-12-20', '14:00', 'Main Hall', 'Workshop', 'upcoming')
ON CONFLICT DO NOTHING;

-- 3. Add attendees to the event
WITH test_user AS (
    SELECT id FROM users WHERE email = 'john.doe@test.com' LIMIT 1
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

-- 4. Show final result
SELECT '=== FINAL RESULT ===' as info;
SELECT 
    ea.id as attendee_id,
    ea.user_id,
    ea.status,
    u.name as user_name,
    u.email as user_email,
    u.role as user_role,
    ea.created_at as registration_date
FROM event_attendees ea
LEFT JOIN users u ON ea.user_id = u.id
LEFT JOIN events e ON ea.event_id = e.id
WHERE e.title = 'Test Event'
ORDER BY ea.created_at ASC; 