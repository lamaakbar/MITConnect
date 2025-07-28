-- Fix trainee feedback visibility issue
-- This script ensures all trainees can see all previous feedbacks

-- 1. Check current policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'trainee_feedback';

-- 2. Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.trainee_feedback;
DROP POLICY IF EXISTS "Authenticated users can read all feedback" ON public.trainee_feedback;
DROP POLICY IF EXISTS "Users can read their own feedback" ON public.trainee_feedback;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.trainee_feedback;

-- 3. Create proper policies for the "Previous Feedbacks" section

-- Policy: ALL authenticated users can READ ALL feedback (for Previous Feedbacks section)
CREATE POLICY "All authenticated users can read all feedback" ON public.trainee_feedback
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Users can only INSERT their own feedback
CREATE POLICY "Users can insert their own feedback" ON public.trainee_feedback
    FOR INSERT WITH CHECK (auth.uid() = trainee_id);

-- Policy: Users can only UPDATE their own feedback
CREATE POLICY "Users can update their own feedback" ON public.trainee_feedback
    FOR UPDATE USING (auth.uid() = trainee_id) WITH CHECK (auth.uid() = trainee_id);

-- Policy: Users can only DELETE their own feedback
CREATE POLICY "Users can delete their own feedback" ON public.trainee_feedback
    FOR DELETE USING (auth.uid() = trainee_id);

-- 4. Verify the policies are correct
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'trainee_feedback'
ORDER BY cmd;

-- 5. Test the visibility with a sample query (this should return ALL feedback)
SELECT 
    trainee_name,
    feedback_text,
    rating,
    submission_date,
    'Should be visible to all users' as visibility_test
FROM public.trainee_feedback 
ORDER BY submission_date DESC
LIMIT 5;

-- 6. Test user-specific query (this should only return current user's feedback)
SELECT 
    trainee_name,
    feedback_text,
    rating,
    submission_date,
    'Should only show current user feedback' as visibility_test
FROM public.trainee_feedback 
WHERE trainee_id = auth.uid()
ORDER BY submission_date DESC;

-- 7. Show the difference in what each function should return
SELECT 'Policy fix completed! All users should now see all previous feedbacks.' as status; 