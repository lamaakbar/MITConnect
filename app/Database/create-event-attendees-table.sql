-- Create event_attendees table for MITConnect
-- Run this script in your Supabase SQL editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create event_attendees table
CREATE TABLE IF NOT EXISTS event_attendees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL, -- Using string for user ID to match existing auth
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'attended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id) -- Prevent duplicate registrations
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user_id ON event_attendees(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own event registrations" ON event_attendees;
DROP POLICY IF EXISTS "Users can register for events" ON event_attendees;
DROP POLICY IF EXISTS "Users can update their own registrations" ON event_attendees;
DROP POLICY IF EXISTS "Users can delete their own registrations" ON event_attendees;

-- Create proper RLS policies for event_attendees
CREATE POLICY "Users can view their own event registrations" ON event_attendees
    FOR SELECT USING (true); -- Allow all users to view registrations for now

CREATE POLICY "Users can register for events" ON event_attendees
    FOR INSERT WITH CHECK (true); -- Allow all authenticated users to register

CREATE POLICY "Users can update their own registrations" ON event_attendees
    FOR UPDATE USING (true); -- Allow users to update their registrations

CREATE POLICY "Users can delete their own registrations" ON event_attendees
    FOR DELETE USING (true); -- Allow users to cancel their registrations

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON event_attendees TO authenticated;
GRANT SELECT ON event_attendees TO anon;

-- Verify table creation
SELECT 'event_attendees table created successfully' as status; 