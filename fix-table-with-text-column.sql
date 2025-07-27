-- Fixed trainee feedback table with correct column name
-- Run this in Supabase SQL Editor to fix the column name issue

-- Drop existing table
DROP TABLE IF EXISTS public.trainee_feedback CASCADE;

-- Create table with 'text' column instead of 'feedback_text'
CREATE TABLE public.trainee_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trainee_id UUID NOT NULL,
    trainee_name TEXT NOT NULL,
    text TEXT NOT NULL,  -- Using 'text' instead of 'feedback_text'
    rating INTEGER NOT NULL,
    submission_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.trainee_feedback ENABLE ROW LEVEL SECURITY;

-- Simple policy
CREATE POLICY "Allow all for authenticated users" ON public.trainee_feedback
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON public.trainee_feedback TO authenticated;
GRANT ALL ON public.trainee_feedback TO service_role;

-- Test insert
INSERT INTO public.trainee_feedback (
    trainee_id,
    trainee_name, 
    text,  -- Using 'text' column
    rating
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'Test User',
    'This is a test feedback with text column',
    5
);

-- Verify
SELECT * FROM public.trainee_feedback WHERE trainee_name = 'Test User';

-- Clean up
DELETE FROM public.trainee_feedback WHERE trainee_name = 'Test User'; 