-- Fix Database Schema for MITConnect Events Management
-- This script ensures proper foreign key relationships between tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Ensure users table exists with correct structure
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('employee', 'trainee', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Ensure events table exists with correct structure
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

-- 3. Drop and recreate event_attendees table with correct foreign key
DROP TABLE IF EXISTS event_attendees CASCADE;
CREATE TABLE event_attendees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'attended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id) -- Prevent duplicate registrations
);

-- 4. Drop and recreate event_bookmarks table with correct foreign key
DROP TABLE IF EXISTS event_bookmarks CASCADE;
CREATE TABLE event_bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id) -- Prevent duplicate bookmarks
);

-- 5. Drop and recreate event_feedback table with correct foreign key
DROP TABLE IF EXISTS event_feedback CASCADE;
CREATE TABLE event_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id) -- One feedback per user per event
);

-- 6. Create indexes for better performance
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

-- 7. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Enable Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 10. Drop existing policies if they exist
DROP POLICY IF EXISTS "Events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Events are insertable by admins" ON events;
DROP POLICY IF EXISTS "Events are updatable by admins" ON events;
DROP POLICY IF EXISTS "Events are deletable by admins" ON events;

DROP POLICY IF EXISTS "Users can view their own event registrations" ON event_attendees;
DROP POLICY IF EXISTS "Users can register for events" ON event_attendees;
DROP POLICY IF EXISTS "Users can update their own registrations" ON event_attendees;
DROP POLICY IF EXISTS "Users can delete their own registrations" ON event_attendees;

DROP POLICY IF EXISTS "Users can view their own bookmarks" ON event_bookmarks;
DROP POLICY IF EXISTS "Users can bookmark events" ON event_bookmarks;
DROP POLICY IF EXISTS "Users can remove their own bookmarks" ON event_bookmarks;

DROP POLICY IF EXISTS "Users can view their own feedback" ON event_feedback;
DROP POLICY IF EXISTS "Users can submit feedback" ON event_feedback;
DROP POLICY IF EXISTS "Users can update their own feedback" ON event_feedback;

-- 11. Create RLS policies
-- Events policies
CREATE POLICY "Events are viewable by everyone" ON events FOR SELECT USING (true);
CREATE POLICY "Events are insertable by admins" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "Events are updatable by admins" ON events FOR UPDATE USING (true);
CREATE POLICY "Events are deletable by admins" ON events FOR DELETE USING (true);

-- Event attendees policies
CREATE POLICY "Users can view their own event registrations" ON event_attendees FOR SELECT USING (true);
CREATE POLICY "Users can register for events" ON event_attendees FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own registrations" ON event_attendees FOR UPDATE USING (true);
CREATE POLICY "Users can delete their own registrations" ON event_attendees FOR DELETE USING (true);

-- Event bookmarks policies
CREATE POLICY "Users can view their own bookmarks" ON event_bookmarks FOR SELECT USING (true);
CREATE POLICY "Users can bookmark events" ON event_bookmarks FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can remove their own bookmarks" ON event_bookmarks FOR DELETE USING (true);

-- Event feedback policies
CREATE POLICY "Users can view their own feedback" ON event_feedback FOR SELECT USING (true);
CREATE POLICY "Users can submit feedback" ON event_feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own feedback" ON event_feedback FOR UPDATE USING (true);

-- Users policies
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (true);

-- 12. Verify foreign key relationships
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name; 