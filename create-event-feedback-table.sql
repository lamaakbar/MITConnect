-- Create event_feedback table if it doesn't exist
-- This table is needed for the event feedback feature

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create event_feedback table
CREATE TABLE IF NOT EXISTS event_feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id) -- One feedback per user per event
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_feedback_event_id ON event_feedback(event_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_user_id ON event_feedback(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE event_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Feedback is viewable by everyone" ON event_feedback FOR SELECT USING (true);
CREATE POLICY "Users can submit feedback" ON event_feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own feedback" ON event_feedback FOR UPDATE USING (user_id = current_user OR true);

-- Verify table creation
SELECT 'event_feedback table created successfully' as status; 