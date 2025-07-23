-- MITConnect Event Management Database Schema
-- Run this script in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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

-- Event attendees table
CREATE TABLE IF NOT EXISTS event_attendees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL, -- Using string for user ID to match existing auth
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'attended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id) -- Prevent duplicate registrations
);

-- Event bookmarks table
CREATE TABLE IF NOT EXISTS event_bookmarks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id) -- Prevent duplicate bookmarks
);

-- Event feedback table
CREATE TABLE IF NOT EXISTS event_feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id) -- One feedback per user per event
);

-- Users table (if not already exists)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'employee' CHECK (role IN ('admin', 'employee', 'trainee')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO events (title, desc, date, time, location, category, featured, status, type) VALUES
('Technology Workshop', 'Learn about the latest technologies in software development', '2024-12-15', '09:00 AM - 11:00 AM', 'MITC Conference Room', 'Workshop', true, 'upcoming', 'MITC'),
('Team Building Seminar', 'Improve team collaboration and communication skills', '2024-12-20', '02:00 PM - 04:00 PM', 'MITC Auditorium', 'Seminar', false, 'upcoming', 'MITC'),
('Annual Conference', 'Annual technology conference with industry experts', '2024-12-25', '09:00 AM - 05:00 PM', 'MITC Main Hall', 'Conference', true, 'upcoming', 'MITC')
ON CONFLICT DO NOTHING;

-- Insert sample users
INSERT INTO users (id, name, email, role) VALUES
('user-123', 'John Doe', 'john.doe@company.com', 'employee'),
('user-456', 'Jane Smith', 'jane.smith@company.com', 'trainee'),
('admin-001', 'Admin User', 'admin@company.com', 'admin')
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Events: Everyone can read, only admins can write
CREATE POLICY "Events are viewable by everyone" ON events FOR SELECT USING (true);
CREATE POLICY "Events are insertable by admins" ON events FOR INSERT WITH CHECK (true); -- In real app, check user role
CREATE POLICY "Events are updatable by admins" ON events FOR UPDATE USING (true); -- In real app, check user role
CREATE POLICY "Events are deletable by admins" ON events FOR DELETE USING (true); -- In real app, check user role

-- Event attendees: Users can read their own registrations, admins can read all
CREATE POLICY "Users can view their own event registrations" ON event_attendees FOR SELECT USING (user_id = current_user OR true); -- In real app, use proper auth
CREATE POLICY "Users can register for events" ON event_attendees FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own registrations" ON event_attendees FOR UPDATE USING (user_id = current_user OR true);
CREATE POLICY "Users can delete their own registrations" ON event_attendees FOR DELETE USING (user_id = current_user OR true);

-- Event bookmarks: Users can manage their own bookmarks
CREATE POLICY "Users can view their own bookmarks" ON event_bookmarks FOR SELECT USING (user_id = current_user OR true);
CREATE POLICY "Users can create bookmarks" ON event_bookmarks FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete their own bookmarks" ON event_bookmarks FOR DELETE USING (user_id = current_user OR true);

-- Event feedback: Users can read all feedback, users can submit their own
CREATE POLICY "Feedback is viewable by everyone" ON event_feedback FOR SELECT USING (true);
CREATE POLICY "Users can submit feedback" ON event_feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own feedback" ON event_feedback FOR UPDATE USING (user_id = current_user OR true);

-- Users: Basic policies
CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can be created" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (id = current_user OR true); 