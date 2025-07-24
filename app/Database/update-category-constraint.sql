-- Update the events table to allow any text for category field
-- Run this script in your Supabase SQL editor

-- First, drop the existing constraint
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_category_check;

-- Update the category column to allow any text (remove the CHECK constraint)
ALTER TABLE events ALTER COLUMN category TYPE VARCHAR(100);

-- Add a comment to document the change
COMMENT ON COLUMN events.category IS 'Event category - now allows any text input';

-- Verify the change
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'events' AND column_name = 'category'; 