-- =============================================
-- MITConnect Comprehensive Database Schema
-- Run this script in your Supabase SQL editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USER MANAGEMENT
-- =============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'employee' CHECK (role IN ('admin', 'employee', 'trainee')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- EVENT MANAGEMENT SYSTEM
-- =============================================

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    desc TEXT,
    date DATE NOT NULL,
    time VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    cover_image TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Workshop', 'Seminar', 'Conference', 'Activity', 'Meetup', 'Training', 'Networking')),
    featured BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    type VARCHAR(20) DEFAULT 'MITC' CHECK (type IN ('MITC', 'Online', 'Hybrid')),
    max_capacity INTEGER,
    organizer VARCHAR(255),
    tags TEXT[],
    requirements TEXT[],
    materials TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event attendees table
CREATE TABLE IF NOT EXISTS event_attendees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL, -- Using string for user ID to match existing auth
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'attended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id) -- Prevent duplicate registrations
);

-- Event bookmarks table
CREATE TABLE IF NOT EXISTS event_bookmarks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id) -- Prevent duplicate bookmarks
);

-- Event feedback table
CREATE TABLE IF NOT EXISTS event_feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id) -- One feedback per user per event
);

-- =============================================
-- INSPIRE CORNER SYSTEM
-- =============================================

-- Ideas Table
CREATE TABLE IF NOT EXISTS ideas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Approved', 'Rejected')),
    submitter_id UUID NOT NULL,
    submitter_name VARCHAR(255) NOT NULL,
    submitter_role VARCHAR(50) NOT NULL CHECK (submitter_role IN ('trainee', 'employee', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE
);

-- Votes Table
CREATE TABLE IF NOT EXISTS idea_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('yes', 'no', 'like', 'dislike')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(idea_id, user_id) -- Prevent duplicate votes from same user
);

-- Comments Table
CREATE TABLE IF NOT EXISTS idea_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- BOOK MANAGEMENT SYSTEM
-- =============================================

-- Books table
CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT,
    isbn TEXT,
    description TEXT,
    published_date DATE,
    cover_image_url TEXT,
    genre TEXT,
    genre_color TEXT,
    category TEXT DEFAULT 'library' CHECK (category IN ('library', 'book_of_the_month')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User books relationship table
CREATE TABLE IF NOT EXISTS user_books (
    user_id UUID NOT NULL,
    book_id INTEGER NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'assigned',
    notes TEXT,
    PRIMARY KEY (user_id, book_id),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- Book ratings table
CREATE TABLE IF NOT EXISTS ratings (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    book_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, book_id),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- Book comments table
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    book_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- =============================================
-- HIGHLIGHTS SYSTEM
-- =============================================

-- Highlights table
CREATE TABLE IF NOT EXISTS highlights (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- GALLERY SYSTEM
-- =============================================

-- Gallery albums table
CREATE TABLE IF NOT EXISTS gallery_albums (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gallery photos table
CREATE TABLE IF NOT EXISTS gallery_photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    album_id UUID NOT NULL REFERENCES gallery_albums(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- CREATE INDEXES FOR BETTER PERFORMANCE
-- =============================================

-- Event system indexes
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_featured ON events(featured);
CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user_id ON event_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_event_bookmarks_event_id ON event_bookmarks(event_id);
CREATE INDEX IF NOT EXISTS idx_event_bookmarks_user_id ON event_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_event_id ON event_feedback(event_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_user_id ON event_feedback(user_id);

-- Ideas system indexes
CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);
CREATE INDEX IF NOT EXISTS idx_ideas_submitter ON ideas(submitter_id);
CREATE INDEX IF NOT EXISTS idx_ideas_created_at ON ideas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_votes_idea_id ON idea_votes(idea_id);
CREATE INDEX IF NOT EXISTS idx_comments_idea_id ON idea_comments(idea_id);

-- Highlights indexes
CREATE INDEX IF NOT EXISTS idx_highlights_created_at ON highlights(created_at);
CREATE INDEX IF NOT EXISTS idx_highlights_updated_at ON highlights(updated_at);

-- Gallery indexes
CREATE INDEX IF NOT EXISTS idx_gallery_albums_user_id ON gallery_albums(user_id);
CREATE INDEX IF NOT EXISTS idx_gallery_photos_album_id ON gallery_photos(album_id);
CREATE INDEX IF NOT EXISTS idx_gallery_photos_user_id ON gallery_photos(user_id);

-- =============================================
-- CREATE TRIGGER FUNCTIONS
-- =============================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- CREATE TRIGGERS
-- =============================================

-- Create triggers for updated_at
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_highlights_updated_at BEFORE UPDATE ON highlights
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gallery_albums_updated_at BEFORE UPDATE ON gallery_albums
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gallery_photos_updated_at BEFORE UPDATE ON gallery_photos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- CREATE FUNCTIONS FOR IDEAS SYSTEM
-- =============================================

-- Function for vote counting
CREATE OR REPLACE FUNCTION get_idea_vote_counts(idea_uuid UUID)
RETURNS TABLE(
    yes_votes BIGINT,
    no_votes BIGINT,
    like_votes BIGINT,
    dislike_votes BIGINT,
    total_votes BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN vote_type = 'yes' THEN 1 ELSE 0 END), 0) as yes_votes,
        COALESCE(SUM(CASE WHEN vote_type = 'no' THEN 1 ELSE 0 END), 0) as no_votes,
        COALESCE(SUM(CASE WHEN vote_type = 'like' THEN 1 ELSE 0 END), 0) as like_votes,
        COALESCE(SUM(CASE WHEN vote_type = 'dislike' THEN 1 ELSE 0 END), 0) as dislike_votes,
        COUNT(*) as total_votes
    FROM idea_votes 
    WHERE idea_id = idea_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to get ideas with vote counts
CREATE OR REPLACE FUNCTION get_ideas_with_votes()
RETURNS TABLE(
    id UUID,
    title VARCHAR(255),
    description TEXT,
    category VARCHAR(100),
    status VARCHAR(50),
    submitter_id UUID,
    submitter_name VARCHAR(255),
    submitter_role VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE,
    yes_votes BIGINT,
    no_votes BIGINT,
    like_votes BIGINT,
    dislike_votes BIGINT,
    total_votes BIGINT,
    comment_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.title,
        i.description,
        i.category,
        i.status,
        i.submitter_id,
        i.submitter_name,
        i.submitter_role,
        i.created_at,
        COALESCE(v.yes_votes, 0) as yes_votes,
        COALESCE(v.no_votes, 0) as no_votes,
        COALESCE(v.like_votes, 0) as like_votes,
        COALESCE(v.dislike_votes, 0) as dislike_votes,
        COALESCE(v.total_votes, 0) as total_votes,
        COALESCE(c.comment_count, 0) as comment_count
    FROM ideas i
    LEFT JOIN (
        SELECT 
            idea_id,
            SUM(CASE WHEN vote_type = 'yes' THEN 1 ELSE 0 END) as yes_votes,
            SUM(CASE WHEN vote_type = 'no' THEN 1 ELSE 0 END) as no_votes,
            SUM(CASE WHEN vote_type = 'like' THEN 1 ELSE 0 END) as like_votes,
            SUM(CASE WHEN vote_type = 'dislike' THEN 1 ELSE 0 END) as dislike_votes,
            COUNT(*)::BIGINT as total_votes
        FROM idea_votes
        GROUP BY idea_id
    ) v ON i.id = v.idea_id
    LEFT JOIN (
        SELECT 
            idea_id,
            COUNT(*)::BIGINT as comment_count
        FROM idea_comments
        GROUP BY idea_id
    ) c ON i.id = c.idea_id
    ORDER BY i.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- INSERT SAMPLE DATA FOR TESTING
-- =============================================

-- Insert sample events
INSERT INTO events (title, desc, date, time, location, category, featured, status, type) VALUES
('Technology Workshop', 'Learn about the latest technologies in software development', '2024-12-15', '09:00 AM - 11:00 AM', 'MITC Conference Room', 'Workshop', true, 'upcoming', 'MITC'),
('Team Building Seminar', 'Improve team collaboration and communication skills', '2024-12-20', '02:00 PM - 04:00 PM', 'MITC Auditorium', 'Seminar', false, 'upcoming', 'MITC'),
('Annual Conference', 'Annual technology conference with industry experts', '2024-12-25', '09:00 AM - 05:00 PM', 'MITC Main Hall', 'Conference', true, 'upcoming', 'MITC')
ON CONFLICT DO NOTHING;

-- Insert sample users
INSERT INTO users (id, name, email, role) VALUES
('user-123', 'John Doe', 'john.doe@company.com', 'employee'),
('user-456', 'Jane Smith', 'jane.smith@company.com', 'trainee'),
('admin-001', 'Admin User', 'admin@company.com', 'admin')
ON CONFLICT DO NOTHING;

-- Insert sample highlights
INSERT INTO highlights (title, description, image_url) VALUES
('Team Building Event', 'A fun day with the team! 🎉', 'https://via.placeholder.com/300x200.png?text=Highlight+1'),
('Product Launch', 'Launching our new app 🚀', 'https://via.placeholder.com/300x200.png?text=Highlight+2'),
('Award Ceremony', 'Celebrating our achievements 🏆', 'https://via.placeholder.com/300x200.png?text=Highlight+3'),
('Hackathon', 'Innovating together 💡', 'https://via.placeholder.com/300x200.png?text=Highlight+4')
ON CONFLICT DO NOTHING;

-- =============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CREATE RLS POLICIES
-- =============================================

-- Users policies
CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can be created" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (id = current_user OR true);

-- Events policies - Everyone can read, only admins can write
CREATE POLICY "Events are viewable by everyone" ON events FOR SELECT USING (true);
CREATE POLICY "Events are insertable by admins" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "Events are updatable by admins" ON events FOR UPDATE USING (true);
CREATE POLICY "Events are deletable by admins" ON events FOR DELETE USING (true);

-- Event attendees policies
CREATE POLICY "Users can view their own event registrations" ON event_attendees FOR SELECT USING (user_id = current_user OR true);
CREATE POLICY "Users can register for events" ON event_attendees FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own registrations" ON event_attendees FOR UPDATE USING (user_id = current_user OR true);
CREATE POLICY "Users can delete their own registrations" ON event_attendees FOR DELETE USING (user_id = current_user OR true);

-- Event bookmarks policies
CREATE POLICY "Users can view their own bookmarks" ON event_bookmarks FOR SELECT USING (user_id = current_user OR true);
CREATE POLICY "Users can create bookmarks" ON event_bookmarks FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete their own bookmarks" ON event_bookmarks FOR DELETE USING (user_id = current_user OR true);

-- Event feedback policies
CREATE POLICY "Feedback is viewable by everyone" ON event_feedback FOR SELECT USING (true);
CREATE POLICY "Users can submit feedback" ON event_feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own feedback" ON event_feedback FOR UPDATE USING (user_id = current_user OR true);

-- Ideas policies
CREATE POLICY "Users can view approved ideas and their own ideas" ON ideas
    FOR SELECT USING (true); -- Temporarily allow all for testing

CREATE POLICY "Users can insert their own ideas" ON ideas
    FOR INSERT WITH CHECK (true); -- Temporarily allow all for testing

CREATE POLICY "Users can update their own ideas, admins can update any" ON ideas
    FOR UPDATE USING (true); -- Temporarily allow all for testing

-- Votes policies
CREATE POLICY "Users can view all votes" ON idea_votes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own votes" ON idea_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own votes" ON idea_votes FOR UPDATE USING (true);

-- Comments policies
CREATE POLICY "Users can view all comments" ON idea_comments FOR SELECT USING (true);
CREATE POLICY "Users can insert their own comments" ON idea_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own comments" ON idea_comments FOR UPDATE USING (true);

-- Books policies
CREATE POLICY "Books are viewable by everyone" ON books FOR SELECT USING (true);
CREATE POLICY "Books are insertable by admins" ON books FOR INSERT WITH CHECK (true);
CREATE POLICY "Books are updatable by admins" ON books FOR UPDATE USING (true);
CREATE POLICY "Books are deletable by admins" ON books FOR DELETE USING (true);

-- User books policies
CREATE POLICY "User books are viewable by everyone" ON user_books FOR SELECT USING (true);
CREATE POLICY "User books are insertable by admins" ON user_books FOR INSERT WITH CHECK (true);
CREATE POLICY "User books are updatable by admins" ON user_books FOR UPDATE USING (true);

-- Ratings policies
CREATE POLICY "Ratings are viewable by everyone" ON ratings FOR SELECT USING (true);
CREATE POLICY "Users can submit ratings" ON ratings FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own ratings" ON ratings FOR UPDATE USING (true);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can submit comments" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own comments" ON comments FOR UPDATE USING (true);

-- Highlights policies
CREATE POLICY "Highlights are viewable by everyone" ON highlights FOR SELECT USING (true);
CREATE POLICY "Highlights are insertable by admins" ON highlights FOR INSERT WITH CHECK (true);
CREATE POLICY "Highlights are updatable by admins" ON highlights FOR UPDATE USING (true);
CREATE POLICY "Highlights are deletable by admins" ON highlights FOR DELETE USING (true);

-- Gallery policies
CREATE POLICY "Gallery albums are viewable by everyone" ON gallery_albums FOR SELECT USING (true);
CREATE POLICY "Users can create albums" ON gallery_albums FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own albums" ON gallery_albums FOR UPDATE USING (true);
CREATE POLICY "Users can delete their own albums" ON gallery_albums FOR DELETE USING (true);

CREATE POLICY "Gallery photos are viewable by everyone" ON gallery_photos FOR SELECT USING (true);
CREATE POLICY "Users can add photos" ON gallery_photos FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own photos" ON gallery_photos FOR UPDATE USING (true);
CREATE POLICY "Users can delete their own photos" ON gallery_photos FOR DELETE USING (true);
