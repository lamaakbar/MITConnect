-- Create table for storing trainee checklist progress
CREATE TABLE IF NOT EXISTS public.trainee_checklist_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    checklist_item_index INTEGER NOT NULL,
    checklist_item_name TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure one record per user per checklist item
    UNIQUE(user_id, checklist_item_index)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_trainee_checklist_progress_user_id ON public.trainee_checklist_progress(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.trainee_checklist_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own checklist progress
CREATE POLICY "Users can view own checklist progress" ON public.trainee_checklist_progress
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own checklist progress
CREATE POLICY "Users can insert own checklist progress" ON public.trainee_checklist_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own checklist progress
CREATE POLICY "Users can update own checklist progress" ON public.trainee_checklist_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all checklist progress
CREATE POLICY "Admins can view all checklist progress" ON public.trainee_checklist_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_trainee_checklist_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_trainee_checklist_progress_updated_at
    BEFORE UPDATE ON public.trainee_checklist_progress
    FOR EACH ROW EXECUTE PROCEDURE update_trainee_checklist_progress_updated_at();

COMMENT ON TABLE public.trainee_checklist_progress IS 'Stores the completion progress of checklist items for each trainee';
COMMENT ON COLUMN public.trainee_checklist_progress.user_id IS 'Reference to the user who owns this checklist progress';
COMMENT ON COLUMN public.trainee_checklist_progress.checklist_item_index IS 'The index position of the checklist item (0-based)';
COMMENT ON COLUMN public.trainee_checklist_progress.checklist_item_name IS 'The name/title of the checklist item';
COMMENT ON COLUMN public.trainee_checklist_progress.is_completed IS 'Whether this checklist item is completed';
COMMENT ON COLUMN public.trainee_checklist_progress.completed_at IS 'Timestamp when the item was completed'; 