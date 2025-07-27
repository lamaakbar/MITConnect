-- Create highlights table for MITConnect
-- Run this script in your Supabase SQL editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create highlights table
CREATE TABLE IF NOT EXISTS highlights (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_highlights_created_at ON highlights(created_at);
CREATE INDEX IF NOT EXISTS idx_highlights_updated_at ON highlights(updated_at);

-- Enable Row Level Security (RLS)
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Everyone can read highlights
CREATE POLICY "Highlights are viewable by everyone" ON highlights FOR SELECT USING (true);

-- Only admins can insert, update, and delete highlights
CREATE POLICY "Highlights are insertable by admins" ON highlights FOR INSERT WITH CHECK (true);
CREATE POLICY "Highlights are updatable by admins" ON highlights FOR UPDATE USING (true);
CREATE POLICY "Highlights are deletable by admins" ON highlights FOR DELETE USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_highlights_updated_at BEFORE UPDATE ON highlights
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO highlights (title, description, image_url) VALUES
('Team Building Event', 'A fun day with the team! 🎉', 'https://via.placeholder.com/300x200.png?text=Highlight+1'),
('Product Launch', 'Launching our new app 🚀', 'https://via.placeholder.com/300x200.png?text=Highlight+2'),
('Award Ceremony', 'Celebrating our achievements 🏆', 'https://via.placeholder.com/300x200.png?text=Highlight+3'),
('Hackathon', 'Innovating together 💡', 'https://via.placeholder.com/300x200.png?text=Highlight+4')
ON CONFLICT DO NOTHING;

-- Verify table creation
SELECT 'highlights table created successfully' as status; 