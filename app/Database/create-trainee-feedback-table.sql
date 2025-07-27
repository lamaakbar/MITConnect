-- Create trainee_feedback table
CREATE TABLE IF NOT EXISTS public.trainee_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trainee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trainee_name TEXT NOT NULL,
    feedback_text TEXT NOT NULL CHECK (char_length(feedback_text) >= 10 AND char_length(feedback_text) <= 2000),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    submission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trainee_feedback_trainee_id ON public.trainee_feedback(trainee_id);
CREATE INDEX IF NOT EXISTS idx_trainee_feedback_submission_date ON public.trainee_feedback(submission_date);
CREATE INDEX IF NOT EXISTS idx_trainee_feedback_rating ON public.trainee_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_trainee_feedback_created_at ON public.trainee_feedback(created_at);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row updates
DROP TRIGGER IF EXISTS trigger_trainee_feedback_updated_at ON public.trainee_feedback;
CREATE TRIGGER trigger_trainee_feedback_updated_at
    BEFORE UPDATE ON public.trainee_feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.trainee_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own feedback and all users can read others' feedback (for the "Previous Feedbacks" section)
-- But we'll separate read and write permissions

-- Policy 1: Allow users to insert their own feedback
CREATE POLICY "Users can insert their own feedback" ON public.trainee_feedback
    FOR INSERT WITH CHECK (auth.uid() = trainee_id);

-- Policy 2: Allow users to read all feedback (for previous feedbacks section)
CREATE POLICY "Authenticated users can read all feedback" ON public.trainee_feedback
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy 3: Allow users to update only their own feedback (if needed)
CREATE POLICY "Users can update their own feedback" ON public.trainee_feedback
    FOR UPDATE USING (auth.uid() = trainee_id) WITH CHECK (auth.uid() = trainee_id);

-- Policy 4: Allow admins to read/write all feedback
CREATE POLICY "Admins can manage all feedback" ON public.trainee_feedback
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Grant necessary permissions
GRANT ALL ON public.trainee_feedback TO authenticated;
GRANT ALL ON public.trainee_feedback TO service_role;

-- Add comments for documentation
COMMENT ON TABLE public.trainee_feedback IS 'Stores feedback submitted by trainees after completing their checklist';
COMMENT ON COLUMN public.trainee_feedback.id IS 'Primary key - unique identifier for each feedback entry';
COMMENT ON COLUMN public.trainee_feedback.trainee_id IS 'Foreign key reference to the user who submitted the feedback';
COMMENT ON COLUMN public.trainee_feedback.trainee_name IS 'Display name of the trainee (for easy viewing without joins)';
COMMENT ON COLUMN public.trainee_feedback.feedback_text IS 'The actual feedback content (10-2000 characters)';
COMMENT ON COLUMN public.trainee_feedback.rating IS 'Star rating from 1-5';
COMMENT ON COLUMN public.trainee_feedback.submission_date IS 'Date when the feedback was submitted';
COMMENT ON COLUMN public.trainee_feedback.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN public.trainee_feedback.updated_at IS 'Timestamp when the record was last updated'; 