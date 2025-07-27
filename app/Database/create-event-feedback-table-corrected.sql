-- إنشاء جدول feedback للفعاليات
-- Run this script in your Supabase SQL editor

-- إنشاء جدول feedback
CREATE TABLE IF NOT EXISTS event_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id) -- منع إضافة feedback متكرر لنفس المستخدم ونفس الفعالية
);

-- تفعيل RLS
ALTER TABLE event_feedback ENABLE ROW LEVEL SECURITY;

-- حذف السياسات الموجودة إذا كانت موجودة
DROP POLICY IF EXISTS "Allow insert for own feedback" ON event_feedback;
DROP POLICY IF EXISTS "Allow select for own feedback" ON event_feedback;
DROP POLICY IF EXISTS "Allow update for own feedback" ON event_feedback;
DROP POLICY IF EXISTS "Allow delete for own feedback" ON event_feedback;

-- سياسة: يسمح للمستخدم بإضافة feedback لنفسه فقط
CREATE POLICY "Allow insert for own feedback"
ON event_feedback
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- سياسة: يسمح للمستخدم بقراءة feedback الخاص فيه فقط
CREATE POLICY "Allow select for own feedback"
ON event_feedback
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- سياسة: يسمح للمستخدم بتحديث feedback الخاص فيه فقط
CREATE POLICY "Allow update for own feedback"
ON event_feedback
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- سياسة: يسمح للمستخدم بحذف feedback الخاص فيه فقط
CREATE POLICY "Allow delete for own feedback"
ON event_feedback
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- منح الصلاحيات
GRANT SELECT, INSERT, UPDATE, DELETE ON event_feedback TO authenticated;
GRANT SELECT ON event_feedback TO anon;

-- إنشاء indexes للأداء
CREATE INDEX IF NOT EXISTS idx_event_feedback_user_id ON event_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_event_id ON event_feedback(event_id);

-- التحقق من إنشاء الجدول
SELECT 'event_feedback table created successfully' as status; 