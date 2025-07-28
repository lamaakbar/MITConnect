-- Enable Admin Feedback Management
-- This script allows admins to delete any trainee feedback

-- 1. Check current policies
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'trainee_feedback'
ORDER BY cmd;

-- 2. Drop existing restrictive delete policy
DROP POLICY IF EXISTS "Users can delete their own feedback" ON public.trainee_feedback;

-- 3. Create separate policies for regular users and admins

-- Policy: Regular users can only delete their own feedback
CREATE POLICY "Users can delete their own feedback" ON public.trainee_feedback
    FOR DELETE USING (
        auth.uid() = trainee_id 
        AND auth.uid() NOT IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Policy: Admins can delete ANY feedback
CREATE POLICY "Admins can delete any feedback" ON public.trainee_feedback
    FOR DELETE USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

-- 4. Also ensure admins can update any feedback if needed
DROP POLICY IF EXISTS "Users can update their own feedback" ON public.trainee_feedback;

-- Policy: Regular users can only update their own feedback  
CREATE POLICY "Users can update their own feedback" ON public.trainee_feedback
    FOR UPDATE USING (
        auth.uid() = trainee_id 
        AND auth.uid() NOT IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    ) WITH CHECK (
        auth.uid() = trainee_id
    );

-- Policy: Admins can update ANY feedback
CREATE POLICY "Admins can update any feedback" ON public.trainee_feedback
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    ) WITH CHECK (true);

-- 5. Verify the new policies
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'trainee_feedback'
ORDER BY cmd, policyname;

-- 6. Test admin permissions (optional - uncomment to test)
-- SELECT 
--     id,
--     trainee_name,
--     feedback_text,
--     'Admin should be able to delete this' as admin_test
-- FROM public.trainee_feedback 
-- LIMIT 3;

SELECT 'Admin feedback management enabled successfully!' as status; 