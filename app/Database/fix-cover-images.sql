-- Fix cover_image issues in events table
-- Run this in your Supabase SQL editor

-- 1. Convert empty strings to NULL for better handling
UPDATE events 
SET cover_image = NULL 
WHERE cover_image = '' OR cover_image IS NULL;

-- 2. Check the current status of cover_image fields
SELECT 
  id,
  title,
  CASE 
    WHEN cover_image IS NULL THEN 'NULL'
    WHEN cover_image = '' THEN 'EMPTY STRING'
    WHEN cover_image LIKE 'http%' THEN 'VALID URL'
    ELSE 'OTHER'
  END as image_status,
  cover_image
FROM events 
ORDER BY created_at DESC;

-- 3. Count events by image status
SELECT 
  CASE 
    WHEN cover_image IS NULL THEN 'No Image (NULL)'
    WHEN cover_image = '' THEN 'Empty String'
    WHEN cover_image LIKE 'http%' THEN 'Has Valid URL'
    ELSE 'Other'
  END as status,
  COUNT(*) as count
FROM events 
GROUP BY 
  CASE 
    WHEN cover_image IS NULL THEN 'No Image (NULL)'
    WHEN cover_image = '' THEN 'Empty String'
    WHEN cover_image LIKE 'http%' THEN 'Has Valid URL'
    ELSE 'Other'
  END
ORDER BY count DESC; 