-- Add test data for debugging attendee names issue
-- Run this in Supabase SQL Editor

-- 1. Add a test user if none exist
INSERT INTO users (id, name, email, role) 
VALUES 
    (gen_random_uuid(), 'John Doe', 'john.doe@test.com', 'employee'),
    (gen_random_uuid(), 'Jane Smith', 'jane.smith@test.com', 'trainee'),
    (gen_random_uuid(), 'Admin User', 'admin@test.com', 'admin')
ON CONFLICT (email) DO NOTHING;

-- 2. Add a test event if none exist
INSERT INTO events (id, title, desc, date, time, location, category, status)
VALUES 
    (gen_random_uuid(), 'Test Event', 'This is a test event', '2024-12-20', '14:00', 'Test Location', 'Workshop', 'upcoming')
ON CONFLICT DO NOTHING;

-- 3. Get the IDs we just created
WITH test_user AS (
    SELECT id FROM users WHERE email = 'john.doe@test.com' LIMIT 1
),
test_event AS (
    SELECT id FROM events WHERE title = 'Test Event' LIMIT 1
)
-- 4. Add test attendees
INSERT INTO event_attendees (event_id, user_id, status)
SELECT 
    test_event.id,
    test_user.id,
    'confirmed'
FROM test_user, test_event
ON CONFLICT (event_id, user_id) DO NOTHING;

-- 5. Verify the test data
SELECT '=== TEST DATA VERIFICATION ===' as info;
SELECT 
    ea.id as attendee_id,
    ea.event_id,
    ea.user_id,
    ea.status,
    u.name,
    u.email,
    u.role
FROM event_attendees ea
LEFT JOIN users u ON ea.user_id = u.id
LEFT JOIN events e ON ea.event_id = e.id
WHERE e.title = 'Test Event'
ORDER BY ea.created_at ASC; 