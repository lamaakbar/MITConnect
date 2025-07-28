-- Check and fix polls table structure
-- Run this in your Supabase SQL editor

-- First, let's see what we have
SELECT 'Current idea_polls table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'idea_polls' 
ORDER BY ordinal_position;

-- Check if the table exists at all
SELECT 'Table exists check:' as info;
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'idea_polls'
) as table_exists;

-- If table doesn't exist or has wrong structure, recreate it
DO $$
BEGIN
    -- Drop dependent tables first
    DROP TABLE IF EXISTS poll_responses CASCADE;
    DROP TABLE IF EXISTS idea_polls CASCADE;
    
    -- Recreate idea_polls table with correct structure
    CREATE TABLE idea_polls (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        options JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(idea_id)
    );
    
    -- Recreate poll_responses table
    CREATE TABLE poll_responses (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        poll_id UUID NOT NULL REFERENCES idea_polls(id) ON DELETE CASCADE,
        user_id VARCHAR(255) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        user_role VARCHAR(50) NOT NULL,
        selected_option INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(poll_id, user_id)
    );
    
    -- Create indexes
    CREATE INDEX idx_idea_polls_idea_id ON idea_polls(idea_id);
    CREATE INDEX idx_poll_responses_poll_id ON poll_responses(poll_id);
    CREATE INDEX idx_poll_responses_user_id ON poll_responses(user_id);
    
    -- Enable RLS
    ALTER TABLE idea_polls ENABLE ROW LEVEL SECURITY;
    ALTER TABLE poll_responses ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policies
    CREATE POLICY "Polls are viewable by everyone" ON idea_polls FOR SELECT USING (true);
    CREATE POLICY "Admins can create polls" ON idea_polls FOR INSERT WITH CHECK (true);
    CREATE POLICY "Admins can update polls" ON idea_polls FOR UPDATE USING (true);
    CREATE POLICY "Admins can delete polls" ON idea_polls FOR DELETE USING (true);
    
    CREATE POLICY "Poll responses are viewable by everyone" ON poll_responses FOR SELECT USING (true);
    CREATE POLICY "Users can submit poll responses" ON poll_responses FOR INSERT WITH CHECK (true);
    CREATE POLICY "Users can update their own poll responses" ON poll_responses FOR UPDATE USING (true);
    
    -- Create updated_at trigger function
    CREATE OR REPLACE FUNCTION update_idea_polls_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';
    
    -- Create trigger
    CREATE TRIGGER update_idea_polls_updated_at 
        BEFORE UPDATE ON idea_polls
        FOR EACH ROW EXECUTE FUNCTION update_idea_polls_updated_at();
    
    -- Grant permissions
    GRANT SELECT, INSERT, UPDATE, DELETE ON idea_polls TO authenticated;
    GRANT SELECT ON idea_polls TO anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON poll_responses TO authenticated;
    GRANT SELECT ON poll_responses TO anon;
    
    RAISE NOTICE 'Tables recreated successfully!';
END $$;

-- Verify the new structure
SELECT 'New idea_polls table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'idea_polls' 
ORDER BY ordinal_position;

-- Test inserting a sample poll to verify it works
INSERT INTO idea_polls (idea_id, question, options) 
VALUES (
    (SELECT id FROM ideas LIMIT 1), 
    'Test question?', 
    '["Option 1", "Option 2"]'::jsonb
) ON CONFLICT (idea_id) DO NOTHING;

SELECT 'Sample poll inserted successfully!' as status; 