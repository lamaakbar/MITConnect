-- Clean Feedback Policies - Remove ALL old policies and create new ones
-- This script completely cleans up and recreates all trainee_feedback policies

-- 1. COMPLETELY DROP ALL EXISTING POLICIES for trainee_feedback
DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.trainee_feedback;
DROP POLICY IF EXISTS "Authenticated users can read all feedback" ON public.trainee_feedback;
DROP POLICY IF EXISTS "All authenticated users can read all feedback" ON public.trainee_feedback;
DROP POLICY IF EXISTS "Users can update their own feedback" ON public.trainee_feedback;
DROP POLICY IF EXISTS "Users can delete their own feedback" ON public.trainee_feedback;
DROP POLICY IF EXISTS "Admins can manage all feedback" ON public.trainee_feedback;
DROP POLICY IF EXISTS "Admins can delete any feedback" ON public.trainee_feedback;
DROP POLICY IF EXISTS "Admins can update any feedback" ON public.trainee_feedback;
DROP POLICY IF EXISTS "Delete feedback policy" ON public.trainee_feedback;
DROP POLICY IF EXISTS "Update feedback policy" ON public.trainee_feedback;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.trainee_feedback;

-- 2. Verify all policies are removed
SELECT 
    'Checking for remaining policies...' as status,
    COUNT(*) as remaining_policies
FROM pg_policies 
WHERE tablename = 'trainee_feedback';

-- 3. Create new clean policies that ONLY use JWT data (no users table access)

-- Policy 1: Anyone can read all feedback
CREATE POLICY "Read all feedback" ON public.trainee_feedback
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy 2: Users can insert their own feedback
CREATE POLICY "Insert own feedback" ON public.trainee_feedback
    FOR INSERT WITH CHECK (auth.uid() = trainee_id);

-- Policy 3: Delete policy - own feedback OR admin (using only JWT)
CREATE POLICY "Delete feedback" ON public.trainee_feedback
    FOR DELETE USING (
        -- Own feedback
        auth.uid() = trainee_id 
        OR 
        -- OR admin (check only JWT, NO users table)
        (auth.jwt() ->> 'email') = 'admin@company.com'
        OR 
        (auth.jwt() ->> 'email') LIKE '%admin%'
        OR
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

-- Policy 4: Update policy - own feedback OR admin (using only JWT)
CREATE POLICY "Update feedback" ON public.trainee_feedback
    FOR UPDATE USING (
        -- Own feedback
        auth.uid() = trainee_id 
        OR 
        -- OR admin (check only JWT, NO users table)
        (auth.jwt() ->> 'email') = 'admin@company.com'
        OR 
        (auth.jwt() ->> 'email') LIKE '%admin%'
        OR
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    ) WITH CHECK (true);

-- 4. Verify new policies are created correctly
SELECT 
    policyname,
    cmd,
    permissive,
    qual
FROM pg_policies 
WHERE tablename = 'trainee_feedback'
ORDER BY cmd, policyname;

-- 5. Test current user info (to help debug admin detection)
SELECT 
    auth.jwt() ->> 'email' as current_email,
    auth.jwt() -> 'user_metadata' ->> 'role' as metadata_role,
    auth.role() as auth_role,
    'Policies cleaned successfully!' as status; 