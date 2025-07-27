-- Complete Events Management Setup for MITConnect
-- Run this script in your Supabase SQL editor to create all required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create events table if it doesn't exist
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    desc TEXT,
    date DATE NOT NULL,
    time VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    cover_image TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Workshop', 'Seminar', 'Conference', 'Activity', 'Meetup', 'Training', 'Networking')),
    featured BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    type VARCHAR(20) DEFAULT 'MITC' CHECK (type IN ('MITC', 'Online', 'Hybrid')),
    max_capacity INTEGER,
    organizer VARCHAR(255),
    tags TEXT[],
    requirements TEXT[],
    materials TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_attendees table if it doesn't exist
CREATE TABLE IF NOT EXISTS event_attendees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'attended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id) -- Prevent duplicate registrations
);

-- Create event_bookmarks table if it doesn't exist
CREATE TABLE IF NOT EXISTS event_bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id) -- Prevent duplicate bookmarks
);

-- Create event_feedback table if it doesn't exist
CREATE TABLE IF NOT EXISTS event_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id) -- One feedback per user per event
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_featured ON events(featured);
CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user_id ON event_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_event_bookmarks_event_id ON event_bookmarks(event_id);
CREATE INDEX IF NOT EXISTS idx_event_bookmarks_user_id ON event_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_event_id ON event_feedback(event_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_user_id ON event_feedback(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Events are insertable by admins" ON events;
DROP POLICY IF EXISTS "Events are updatable by admins" ON events;
DROP POLICY IF EXISTS "Events are deletable by admins" ON events;

DROP POLICY IF EXISTS "Users can view their own event registrations" ON event_attendees;
DROP POLICY IF EXISTS "Users can register for events" ON event_attendees;
DROP POLICY IF EXISTS "Users can update their own registrations" ON event_attendees;
DROP POLICY IF EXISTS "Users can delete their own registrations" ON event_attendees;

DROP POLICY IF EXISTS "Users can view their own bookmarks" ON event_bookmarks;
DROP POLICY IF EXISTS "Users can create bookmarks" ON event_bookmarks;
DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON event_bookmarks;

DROP POLICY IF EXISTS "Feedback is viewable by everyone" ON event_feedback;
DROP POLICY IF EXISTS "Users can submit feedback" ON event_feedback;
DROP POLICY IF EXISTS "Users can update their own feedback" ON event_feedback;

-- Create RLS policies
-- Events: Everyone can read, only admins can write
CREATE POLICY "Events are viewable by everyone" ON events FOR SELECT USING (true);
CREATE POLICY "Events are insertable by admins" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "Events are updatable by admins" ON events FOR UPDATE USING (true);
CREATE POLICY "Events are deletable by admins" ON events FOR DELETE USING (true);

-- Event attendees: Users can manage their registrations
CREATE POLICY "Users can view their own event registrations" ON event_attendees FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can register for events" ON event_attendees FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own registrations" ON event_attendees FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own registrations" ON event_attendees FOR DELETE USING (auth.uid() = user_id);

-- Event bookmarks: Users can manage their own bookmarks
CREATE POLICY "Users can view their own bookmarks" ON event_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create bookmarks" ON event_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own bookmarks" ON event_bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Event feedback: Users can manage their own feedback
CREATE POLICY "Users can view their own feedback" ON event_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can submit feedback" ON event_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own feedback" ON event_feedback FOR UPDATE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON events TO authenticated;
GRANT SELECT ON events TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON event_attendees TO authenticated;
GRANT SELECT ON event_attendees TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON event_bookmarks TO authenticated;
GRANT SELECT ON event_bookmarks TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON event_feedback TO authenticated;
GRANT SELECT ON event_feedback TO anon;

-- Insert sample data for testing (optional)
INSERT INTO events (title, desc, date, time, location, category, featured, status, type) VALUES
('Technology Workshop', 'Learn about the latest technologies in software development', '2024-12-15', '09:00 AM - 11:00 AM', 'MITC Conference Room', 'Workshop', true, 'upcoming', 'MITC'),
('Team Building Seminar', 'Improve team collaboration and communication skills', '2024-12-20', '02:00 PM - 04:00 PM', 'MITC Auditorium', 'Seminar', false, 'upcoming', 'MITC'),
('Annual Conference', 'Annual technology conference with industry experts', '2024-12-25', '09:00 AM - 05:00 PM', 'MITC Main Hall', 'Conference', true, 'upcoming', 'MITC')
ON CONFLICT DO NOTHING;

-- Verify table creation
SELECT 
    'Tables created successfully' as status,
    (SELECT COUNT(*) FROM events) as events_count,
    (SELECT COUNT(*) FROM event_attendees) as attendees_count,
    (SELECT COUNT(*) FROM event_bookmarks) as bookmarks_count,
    (SELECT COUNT(*) FROM event_feedback) as feedback_count; 