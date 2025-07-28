-- Fix Admin Feedback Permissions
-- This script ensures admins can delete any trainee feedback using a simpler approach

-- 1. Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can delete their own feedback" ON public.trainee_feedback;
DROP POLICY IF EXISTS "Admins can delete any feedback" ON public.trainee_feedback;
DROP POLICY IF EXISTS "Users can update their own feedback" ON public.trainee_feedback;
DROP POLICY IF EXISTS "Admins can update any feedback" ON public.trainee_feedback;

-- 2. Create a simplified admin detection approach
-- Check for admin in multiple ways: email domain, user metadata, or specific admin emails

-- Policy: Allow deletion for own feedback OR if user is admin
CREATE POLICY "Delete feedback policy" ON public.trainee_feedback
    FOR DELETE USING (
        -- User can delete their own feedback
        auth.uid() = trainee_id 
        OR
        -- OR user is admin (check multiple ways)
        (
            -- Check email for admin pattern
            (auth.jwt() ->> 'email') LIKE '%admin%'
            OR
            -- Check user metadata for admin role
            (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
            OR
            -- Check app metadata for admin role
            (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
            OR
            -- Specific admin emails (update these with your actual admin emails)
            (auth.jwt() ->> 'email') IN ('admin@company.com', 'admin@mitconnect.com')
        )
    );

-- Policy: Allow updates for own feedback OR if user is admin
CREATE POLICY "Update feedback policy" ON public.trainee_feedback
    FOR UPDATE USING (
        -- User can update their own feedback
        auth.uid() = trainee_id 
        OR
        -- OR user is admin (same admin detection as above)
        (
            (auth.jwt() ->> 'email') LIKE '%admin%'
            OR
            (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
            OR
            (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
            OR
            (auth.jwt() ->> 'email') IN ('admin@company.com', 'admin@mitconnect.com')
        )
    ) WITH CHECK (true);

-- 3. Verify the policies are created
SELECT 
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'trainee_feedback'
AND cmd IN ('DELETE', 'UPDATE')
ORDER BY cmd, policyname;

-- 4. Test query to verify admin detection (optional)
-- SELECT 
--     auth.jwt() ->> 'email' as user_email,
--     auth.jwt() -> 'user_metadata' ->> 'role' as user_role,
--     auth.jwt() -> 'app_metadata' ->> 'role' as app_role,
--     CASE 
--         WHEN (auth.jwt() ->> 'email') LIKE '%admin%' 
--              OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
--              OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
--              OR (auth.jwt() ->> 'email') IN ('admin@company.com', 'admin@mitconnect.com')
--         THEN 'Admin detected'
--         ELSE 'Regular user'
--     END as user_type;

SELECT 'Admin feedback permissions fixed successfully!' as status; 