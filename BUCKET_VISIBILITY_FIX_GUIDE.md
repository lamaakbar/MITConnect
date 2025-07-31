# 🔍 Supabase Storage Bucket Visibility Issue - Complete Guide

## 🚨 **Issue Summary**

You're experiencing a common Supabase Storage issue where:
- ✅ Buckets exist in Supabase dashboard
- ✅ Buckets are marked as Public
- ❌ `supabase.storage.listBuckets()` returns 0 buckets
- ❌ Uploads fail with "new row violates row-level security policy"

## 🎯 **Root Cause**

This is **NOT a bug** - it's expected behavior due to Supabase's Row Level Security (RLS) policies:

1. **`listBuckets()` requires bucket listing permissions** that anon keys don't have
2. **Direct bucket access works fine** without listing permissions
3. **Uploads are blocked** by missing RLS policies for the `event-images` bucket

## ✅ **What's Working Correctly**

Based on our tests:
- ✅ `event-images` bucket exists and is accessible
- ✅ Direct bucket access: `supabase.storage.from('event-images').list()`
- ✅ Public URL generation: `supabase.storage.from('event-images').getPublicUrl()`
- ✅ Bucket is properly configured as public

## 🔧 **The Solution**

### Step 1: Run RLS Policies SQL Script

Go to your **Supabase Dashboard → SQL Editor** and run the contents of `app/Database/fix-event-images-rls-policies.sql`:

```sql
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for event-images bucket
CREATE POLICY "Public read access for event-images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'event-images');

CREATE POLICY "Authenticated insert access for event-images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'event-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated update access for event-images" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'event-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated delete access for event-images" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'event-images' 
  AND auth.role() = 'authenticated'
);
```

### Step 2: Test the Fix

After running the SQL, test with:

```bash
node test-rls-after-fix.js
```

### Step 3: Your App Will Work

Once RLS policies are in place:
- ✅ `uploadImageFromLibrary` will upload to `event-images/event-covers/`
- ✅ Returns proper Supabase public URLs
- ✅ Images visible to all users across all devices
- ✅ No more local file URIs in database

## 📚 **Technical Explanation**

### Why `listBuckets()` Returns 0

```javascript
// This will return 0 buckets (NORMAL)
const { data: buckets } = await supabase.storage.listBuckets();
console.log(buckets.length); // 0

// But direct access works fine
const { data: files } = await supabase.storage.from('event-images').list();
console.log(files.length); // Shows actual files
```

**Reason**: `listBuckets()` requires bucket listing permissions that anon keys don't have by default. This is a security feature, not a bug.

### Why Uploads Fail

```javascript
// This fails with RLS error
const { error } = await supabase.storage
  .from('event-images')
  .upload('test.jpg', fileData);
// Error: "new row violates row-level security policy"
```

**Reason**: Missing RLS policies that allow authenticated users to insert into the `event-images` bucket.

## 🎉 **Expected Results After Fix**

### Before Fix:
```javascript
// ❌ Upload fails
const { error } = await supabase.storage
  .from('event-images')
  .upload('image.jpg', data);
// Error: "new row violates row-level security policy"

// ❌ App falls back to local URIs
coverImage: "file:///var/mobile/Containers/..."
```

### After Fix:
```javascript
// ✅ Upload succeeds
const { data } = await supabase.storage
  .from('event-images')
  .upload('event-covers/image.jpg', data);
// Success!

// ✅ Returns public URL
coverImage: "https://kiijnueatpbsenrtepxp.supabase.co/storage/v1/object/public/event-images/event-covers/image.jpg"
```

## 🔍 **Verification Steps**

1. **Run the SQL script** in Supabase SQL Editor
2. **Test uploads** with `node test-rls-after-fix.js`
3. **Test your app** - upload an image for an event
4. **Verify** the image appears for all users

## 📋 **Common Questions**

### Q: Why does `listBuckets()` return 0 even though buckets exist?
**A**: This is normal behavior. Anon keys don't have bucket listing permissions due to RLS. Direct bucket access works fine.

### Q: Is this a Supabase bug?
**A**: No, this is expected security behavior. RLS policies protect your storage by default.

### Q: Will this affect other buckets?
**A**: No, the policies are specific to the `event-images` bucket only.

### Q: Do I need to change my app code?
**A**: No, your `uploadImageFromLibrary` function is already correct. Just need the RLS policies.

## 🚀 **Summary**

- ✅ Your bucket exists and is accessible
- ✅ `listBuckets()` returning 0 is **NORMAL**
- ✅ The issue is missing RLS policies for uploads
- ✅ Run the SQL script to fix uploads
- ✅ Your app will work perfectly after the fix

**The `listBuckets()` issue is just a permissions limitation and doesn't affect functionality. Your bucket is working correctly - it just needs the proper RLS policies!** 🎯 