-- Complete test script for attendee names solution
-- Run this in Supabase SQL Editor step by step

-- Step 1: Check current data
SELECT '=== STEP 1: CURRENT DATA STATUS ===' as info;
SELECT 'Events:', COUNT(*) FROM events;
SELECT 'Users:', COUNT(*) FROM users;
SELECT 'Event Attendees:', COUNT(*) FROM event_attendees;

-- Step 2: Show sample data
SELECT '=== STEP 2: SAMPLE DATA ===' as info;
SELECT 'Events:' as table_name, id, title FROM events ORDER BY created_at DESC LIMIT 3;
SELECT 'Users:' as table_name, id, name, email FROM users ORDER BY created_at DESC LIMIT 3;
SELECT 'Attendees:' as table_name, id, event_id, user_id FROM event_attendees ORDER BY created_at DESC LIMIT 3;

-- Step 3: Test the manual JOIN
SELECT '=== STEP 3: MANUAL JOIN TEST ===' as info;
SELECT 
    ea.id as attendee_id,
    ea.user_id,
    ea.status,
    u.name,
    u.email,
    u.role,
    CASE 
        WHEN u.name IS NULL THEN '❌ Missing user data'
        ELSE '✅ User data found'
    END as status_check
FROM event_attendees ea
LEFT JOIN users u ON ea.user_id = u.id
ORDER BY ea.created_at DESC
LIMIT 5;

-- Step 4: Create test data if needed
SELECT '=== STEP 4: CREATING TEST DATA ===' as info;

-- Add test users
INSERT INTO users (id, name, email, role) 
VALUES 
    (gen_random_uuid(), 'أحمد محمد', 'ahmed@test.com', 'employee'),
    (gen_random_uuid(), 'فاطمة علي', 'fatima@test.com', 'trainee'),
    (gen_random_uuid(), 'محمد أحمد', 'mohamed@test.com', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Add test event
INSERT INTO events (id, title, desc, date, time, location, category, status)
VALUES 
    (gen_random_uuid(), 'فعالية تجريبية', 'هذه فعالية تجريبية للاختبار', '2024-12-20', '14:00', 'موقع تجريبي', 'Workshop', 'upcoming')
ON CONFLICT DO NOTHING;

-- Step 5: Add test attendees
WITH test_user AS (
    SELECT id FROM users WHERE email = 'ahmed@test.com' LIMIT 1
),
test_event AS (
    SELECT id FROM events WHERE title = 'فعالية تجريبية' LIMIT 1
)
INSERT INTO event_attendees (event_id, user_id, status)
SELECT 
    test_event.id,
    test_user.id,
    'confirmed'
FROM test_user, test_event
ON CONFLICT (event_id, user_id) DO NOTHING;

-- Step 6: Test the SQL function
SELECT '=== STEP 6: TESTING SQL FUNCTION ===' as info;

-- Get the test event ID
WITH test_event AS (
    SELECT id FROM events WHERE title = 'فعالية تجريبية' LIMIT 1
)
SELECT 
    'Test Event ID:' as info,
    id as event_id
FROM test_event;

-- Test the function with the test event
WITH test_event AS (
    SELECT id FROM events WHERE title = 'فعالية تجريبية' LIMIT 1
)
SELECT 
    ea.id,
    ea.user_id,
    u.name,
    u.email,
    u.role,
    ea.status,
    ea.created_at
FROM event_attendees ea
LEFT JOIN users u ON ea.user_id = u.id
LEFT JOIN test_event te ON ea.event_id = te.id
WHERE ea.event_id = te.id
ORDER BY ea.created_at ASC;

-- Step 7: Final verification
SELECT '=== STEP 7: FINAL VERIFICATION ===' as info;
SELECT 
    'Total attendees with user data:' as info,
    COUNT(*) as count
FROM event_attendees ea
INNER JOIN users u ON ea.user_id = u.id
UNION ALL
SELECT 
    'Total attendees without user data:',
    COUNT(*)
FROM event_attendees ea
LEFT JOIN users u ON ea.user_id = u.id
WHERE u.id IS NULL; 