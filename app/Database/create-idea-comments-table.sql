-- Create idea_comments table
CREATE TABLE IF NOT EXISTS idea_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL CHECK (user_role IN ('trainee', 'employee', 'admin')),
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_idea_comments_idea_id ON idea_comments(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_comments_user_id ON idea_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_idea_comments_created_at ON idea_comments(created_at);

-- Enable Row Level Security
ALTER TABLE idea_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view comments on approved ideas" ON idea_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ideas 
            WHERE ideas.id = idea_comments.idea_id 
            AND ideas.status IN ('Approved', 'In Progress')
        )
    );

CREATE POLICY "Users can insert comments on approved ideas" ON idea_comments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM ideas 
            WHERE ideas.id = idea_comments.idea_id 
            AND ideas.status IN ('Approved', 'In Progress')
        )
        AND auth.uid() = user_id
    );

CREATE POLICY "Users can update their own comments" ON idea_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON idea_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_idea_comments_updated_at 
    BEFORE UPDATE ON idea_comments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();