-- Quick fix to rename columns without losing data
-- Run this in Supabase SQL Editor if you want to keep existing feedback

-- Check current table structure first
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'trainee_feedback' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Rename columns to match the code expectations
-- Only run these if the columns exist with the old names

-- If you have 'text' column, rename it to 'feedback_text'
DO $$ 
BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'trainee_feedback' 
              AND column_name = 'text' 
              AND table_schema = 'public') THEN
        ALTER TABLE public.trainee_feedback RENAME COLUMN text TO feedback_text;
        RAISE NOTICE 'Renamed text column to feedback_text';
    END IF;
END $$;

-- If you have 'date' column, rename it to 'submission_date'
DO $$ 
BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'trainee_feedback' 
              AND column_name = 'date' 
              AND table_schema = 'public') THEN
        ALTER TABLE public.trainee_feedback RENAME COLUMN date TO submission_date;
        RAISE NOTICE 'Renamed date column to submission_date';
    END IF;
END $$;

-- Add missing file support columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'trainee_feedback' 
                  AND column_name = 'file_name' 
                  AND table_schema = 'public') THEN
        ALTER TABLE public.trainee_feedback 
        ADD COLUMN file_name TEXT NULL,
        ADD COLUMN file_path TEXT NULL,
        ADD COLUMN file_size INTEGER NULL,
        ADD COLUMN file_type TEXT NULL,
        ADD COLUMN storage_path TEXT NULL,
        ADD COLUMN uploaded_at TIMESTAMP WITH TIME ZONE NULL;
        RAISE NOTICE 'Added file support columns';
    END IF;
END $$;

-- Verify the fix worked
SELECT 
    'Columns fixed successfully!' as status,
    COUNT(*) as existing_records
FROM public.trainee_feedback;

-- Show final table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'trainee_feedback' 
    AND table_schema = 'public'
ORDER BY ordinal_position; 