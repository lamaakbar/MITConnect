-- Fix Feedback Issues in Supabase
-- Run this script in your Supabase SQL editor

-- 1. Ensure the correct table structure exists
-- Drop old table if it exists (event_registrations)
DROP TABLE IF EXISTS event_registrations CASCADE;

-- Create event_attendees table if it doesn't exist
CREATE TABLE IF NOT EXISTS event_attendees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'attended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Create event_feedback table if it doesn't exist
CREATE TABLE IF NOT EXISTS event_feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user_id ON event_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_event_id ON event_feedback(event_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_user_id ON event_feedback(user_id);

-- 3. Enable Row Level Security
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_feedback ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own event registrations" ON event_attendees;
DROP POLICY IF EXISTS "Users can register for events" ON event_attendees;
DROP POLICY IF EXISTS "Users can update their own registrations" ON event_attendees;
DROP POLICY IF EXISTS "Users can delete their own registrations" ON event_attendees;

DROP POLICY IF EXISTS "Feedback is viewable by everyone" ON event_feedback;
DROP POLICY IF EXISTS "Users can submit feedback" ON event_feedback;
DROP POLICY IF EXISTS "Users can update their own feedback" ON event_feedback;

-- 5. Create proper RLS policies for event_attendees
CREATE POLICY "Users can view their own event registrations" ON event_attendees 
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can register for events" ON event_attendees 
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own registrations" ON event_attendees 
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own registrations" ON event_attendees 
    FOR DELETE USING (auth.uid()::text = user_id);

-- 6. Create proper RLS policies for event_feedback
CREATE POLICY "Feedback is viewable by everyone" ON event_feedback 
    FOR SELECT USING (true);

CREATE POLICY "Users can submit feedback" ON event_feedback 
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own feedback" ON event_feedback 
    FOR UPDATE USING (auth.uid()::text = user_id);

-- 7. Create a function to check if user can submit feedback
CREATE OR REPLACE FUNCTION can_submit_feedback(event_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_registered BOOLEAN;
    event_date DATE;
    current_date DATE;
BEGIN
    -- Check if user is registered for the event
    SELECT EXISTS(
        SELECT 1 FROM event_attendees 
        WHERE event_id = event_id_param 
        AND user_id = auth.uid()::text
    ) INTO user_registered;
    
    IF NOT user_registered THEN
        RETURN FALSE;
    END IF;
    
    -- Check if event is in the past
    SELECT date FROM events WHERE id = event_id_param INTO event_date;
    SELECT CURRENT_DATE INTO current_date;
    
    IF event_date >= current_date THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user already submitted feedback
    IF EXISTS(
        SELECT 1 FROM event_feedback 
        WHERE event_id = event_id_param 
        AND user_id = auth.uid()::text
    ) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Insert sample data for testing (if needed)
-- Insert a test event if it doesn't exist
INSERT INTO events (id, title, desc, date, time, location, category, featured, status, type) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Test Past Event',
    'A test event that has already passed',
    CURRENT_DATE - INTERVAL '1 day',
    '09:00 AM - 11:00 AM',
    'Test Location',
    'Workshop',
    false,
    'completed',
    'MITC'
) ON CONFLICT (id) DO NOTHING;

-- 9. Create a view for easier feedback management
CREATE OR REPLACE VIEW event_feedback_summary AS
SELECT 
    e.id as event_id,
    e.title as event_title,
    e.date as event_date,
    COUNT(ef.id) as total_feedback,
    AVG(ef.rating) as average_rating,
    COUNT(CASE WHEN ef.rating = 1 THEN 1 END) as one_star,
    COUNT(CASE WHEN ef.rating = 2 THEN 1 END) as two_star,
    COUNT(CASE WHEN ef.rating = 3 THEN 1 END) as three_star,
    COUNT(CASE WHEN ef.rating = 4 THEN 1 END) as four_star,
    COUNT(CASE WHEN ef.rating = 5 THEN 1 END) as five_star
FROM events e
LEFT JOIN event_feedback ef ON e.id = ef.event_id
GROUP BY e.id, e.title, e.date;

-- 10. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON event_attendees TO authenticated;
GRANT SELECT, INSERT, UPDATE ON event_feedback TO authenticated;
GRANT SELECT ON event_feedback_summary TO authenticated;

-- 11. Create a trigger to automatically update attendance status for past events
CREATE OR REPLACE FUNCTION update_attendance_status()
RETURNS TRIGGER AS $$
BEGIN
    -- If event date has passed, mark all registrations as attended
    IF NEW.date < CURRENT_DATE THEN
        UPDATE event_attendees 
        SET status = 'attended' 
        WHERE event_id = NEW.id AND status = 'confirmed';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_attendance ON events;
CREATE TRIGGER trigger_update_attendance
    AFTER UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_attendance_status();

-- 12. Test the setup
-- This will show if the tables and policies are working correctly
SELECT 
    'event_attendees' as table_name,
    COUNT(*) as row_count
FROM event_attendees
UNION ALL
SELECT 
    'event_feedback' as table_name,
    COUNT(*) as row_count
FROM event_feedback; 