-- Simple trainee feedback table creation
-- Copy and paste this into Supabase SQL Editor

-- Drop table if exists (for fresh start)
DROP TABLE IF EXISTS public.trainee_feedback CASCADE;

-- Create simple table
CREATE TABLE public.trainee_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trainee_id UUID NOT NULL,
    trainee_name TEXT NOT NULL,
    feedback_text TEXT NOT NULL,
    rating INTEGER NOT NULL,
    submission_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.trainee_feedback ENABLE ROW LEVEL SECURITY;

-- Simple policy - allow authenticated users to do everything for now
CREATE POLICY "Allow all for authenticated users" ON public.trainee_feedback
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON public.trainee_feedback TO authenticated;
GRANT ALL ON public.trainee_feedback TO service_role;

-- Test insert to verify table works
INSERT INTO public.trainee_feedback (
    trainee_id,
    trainee_name, 
    feedback_text, 
    rating
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'Test User',
    'This is a test feedback to verify the table works correctly',
    5
);

-- Check if insert worked
SELECT * FROM public.trainee_feedback WHERE trainee_name = 'Test User';

-- Clean up test data
DELETE FROM public.trainee_feedback WHERE trainee_name = 'Test User'; 