-- Fix script for trainee_feedback table
-- Run this in your Supabase SQL Editor to ensure proper setup

-- 1. Drop the table if it exists (to start fresh with correct structure)
DROP TABLE IF EXISTS public.trainee_feedback CASCADE;

-- 2. Create the table with correct field names
CREATE TABLE public.trainee_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trainee_id UUID NOT NULL,
    trainee_name TEXT NOT NULL,
    feedback_text TEXT NOT NULL CHECK (char_length(feedback_text) >= 10 AND char_length(feedback_text) <= 2000),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    submission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- File support fields (optional)
    file_name TEXT NULL,
    file_path TEXT NULL,
    file_size INTEGER NULL,
    file_type TEXT NULL,
    storage_path TEXT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE NULL
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trainee_feedback_trainee_id ON public.trainee_feedback(trainee_id);
CREATE INDEX IF NOT EXISTS idx_trainee_feedback_submission_date ON public.trainee_feedback(submission_date);
CREATE INDEX IF NOT EXISTS idx_trainee_feedback_rating ON public.trainee_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_trainee_feedback_created_at ON public.trainee_feedback(created_at);

-- 4. Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger to automatically update updated_at on row updates
DROP TRIGGER IF EXISTS trigger_trainee_feedback_updated_at ON public.trainee_feedback;
CREATE TRIGGER trigger_trainee_feedback_updated_at
    BEFORE UPDATE ON public.trainee_feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.trainee_feedback ENABLE ROW LEVEL SECURITY;

-- 7. Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.trainee_feedback;
DROP POLICY IF EXISTS "Authenticated users can read all feedback" ON public.trainee_feedback;
DROP POLICY IF EXISTS "Users can update their own feedback" ON public.trainee_feedback;
DROP POLICY IF EXISTS "Admins can manage all feedback" ON public.trainee_feedback;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.trainee_feedback;

-- 8. Create proper RLS policies
-- Policy 1: Allow users to insert their own feedback
CREATE POLICY "Users can insert their own feedback" ON public.trainee_feedback
    FOR INSERT WITH CHECK (auth.uid() = trainee_id);

-- Policy 2: Allow all authenticated users to read all feedback (for previous feedbacks section)
CREATE POLICY "Authenticated users can read all feedback" ON public.trainee_feedback
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy 3: Allow users to update only their own feedback
CREATE POLICY "Users can update their own feedback" ON public.trainee_feedback
    FOR UPDATE USING (auth.uid() = trainee_id) WITH CHECK (auth.uid() = trainee_id);

-- Policy 4: Allow users to delete their own feedback
CREATE POLICY "Users can delete their own feedback" ON public.trainee_feedback
    FOR DELETE USING (auth.uid() = trainee_id);

-- 9. Grant necessary permissions
GRANT ALL ON public.trainee_feedback TO authenticated;
GRANT ALL ON public.trainee_feedback TO service_role;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- 10. Create storage bucket for feedback files if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('trainee-feedback-files', 'trainee-feedback-files', false)
ON CONFLICT (id) DO NOTHING;

-- 11. Set up storage policies for feedback files
DROP POLICY IF EXISTS "Users can upload their own feedback files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own feedback files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own feedback files" ON storage.objects;

CREATE POLICY "Users can upload their own feedback files" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'trainee-feedback-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view their own feedback files" ON storage.objects
    FOR SELECT USING (bucket_id = 'trainee-feedback-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own feedback files" ON storage.objects
    FOR DELETE USING (bucket_id = 'trainee-feedback-files' AND auth.role() = 'authenticated');

-- 12. Test the setup by inserting sample data
INSERT INTO public.trainee_feedback (
    trainee_id,
    trainee_name, 
    feedback_text, 
    rating,
    submission_date
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'Test User',
    'This is a test feedback to verify the table works correctly with proper field names',
    5,
    CURRENT_DATE
);

-- 13. Verify the setup worked
SELECT 
    'Setup completed successfully!' as status,
    COUNT(*) as test_records
FROM public.trainee_feedback 
WHERE trainee_name = 'Test User';

-- 14. Clean up test data
DELETE FROM public.trainee_feedback WHERE trainee_name = 'Test User';

-- 15. Final verification - show table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'trainee_feedback' 
    AND table_schema = 'public'
ORDER BY ordinal_position; 