-- Fix event_feedback table schema
-- Run this in Supabase SQL Editor

-- 1. Check current schema
SELECT '=== CURRENT SCHEMA ===' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'event_feedback' 
ORDER BY ordinal_position;

-- 2. Drop and recreate the table with correct schema
DROP TABLE IF EXISTS event_feedback CASCADE;

CREATE TABLE event_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id) -- One feedback per user per event
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_event_feedback_event_id ON event_feedback(event_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_user_id ON event_feedback(user_id);

-- 4. Enable RLS
ALTER TABLE event_feedback ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
DROP POLICY IF EXISTS "Users can view their own feedback" ON event_feedback;
DROP POLICY IF EXISTS "Users can submit feedback" ON event_feedback;
DROP POLICY IF EXISTS "Users can update their own feedback" ON event_feedback;

CREATE POLICY "Users can view their own feedback" ON event_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can submit feedback" ON event_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own feedback" ON event_feedback FOR UPDATE USING (auth.uid() = user_id);

-- 6. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON event_feedback TO authenticated;
GRANT SELECT ON event_feedback TO anon;

-- 7. Verify the new schema
SELECT '=== NEW SCHEMA ===' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'event_feedback' 
ORDER BY ordinal_position;

-- 8. Test insert
SELECT '=== TESTING INSERT ===' as info;
-- This will only work if you have test data
-- INSERT INTO event_feedback (user_id, event_id, rating, comment) 
-- VALUES ('test-user-id', 'test-event-id', 5, 'Test feedback')
-- ON CONFLICT (event_id, user_id) DO NOTHING;

SELECT 'event_feedback table schema fixed successfully' as status; 