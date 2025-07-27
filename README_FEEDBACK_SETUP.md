# 🎯 Trainee Feedback Database Setup Guide

## 📖 Overview
This guide will help you set up the trainee feedback system in Supabase, including the database table, security policies, and integration with your React Native app.

## 🗄️ Step 1: Create Database Table

1. **Open Supabase Dashboard**
   - Go to [supabase.com](https://supabase.com)
   - Navigate to your project dashboard
   - Click on "SQL Editor" in the left sidebar

2. **Run the SQL Schema**
   - Copy the entire contents of `app/Database/create-trainee-feedback-table.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the script

   This will create:
   - ✅ `trainee_feedback` table with proper structure
   - ✅ Performance indexes for faster queries
   - ✅ Row Level Security (RLS) policies
   - ✅ Automatic timestamp management
   - ✅ Data validation constraints

## 🔑 Step 2: Verify Table Structure

After running the SQL, you should see the following table structure:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `trainee_id` | UUID | Foreign key to auth.users |
| `trainee_name` | TEXT | Display name of trainee |
| `feedback_text` | TEXT | Feedback content (10-2000 chars) |
| `rating` | INTEGER | Star rating (1-5) |
| `submission_date` | DATE | Date feedback was submitted |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

## 🛡️ Step 3: Security Policies (Already Applied)

The following Row Level Security policies are automatically applied:

1. **Insert Policy**: Users can only insert their own feedback
2. **Read Policy**: All authenticated users can read all feedback
3. **Update Policy**: Users can only update their own feedback
4. **Admin Policy**: Admins can manage all feedback

## 🔗 Step 4: Integration with Your App

The feedback system is already integrated in your app through:

### Service File: `services/FeedbackService.ts`
- ✅ Complete CRUD operations
- ✅ Input validation
- ✅ Error handling
- ✅ Type safety

### Component: `app/trainee-checklist.tsx`
- ✅ Real-time data loading
- ✅ Form submission to database
- ✅ Loading and error states
- ✅ Previous feedbacks display

## 🚀 Step 5: Testing the System

### 1. Complete Checklist
- Open the app as a trainee
- Complete all 6 checklist items sequentially
- Feedback form should appear after 100% completion

### 2. Submit Feedback
- Rate your experience (1-5 stars)
- Write feedback text (minimum 10 characters)
- Submit feedback
- Should see success message

### 3. View Previous Feedbacks
- Tap "Previous Feedbacks" section
- Should see all submitted feedback from all users
- Each feedback shows: name, date, rating, text

### 4. Verify in Database
- Go back to Supabase dashboard
- Navigate to "Table Editor"
- Select "trainee_feedback" table
- Should see your submitted feedback

## 📊 Step 6: Admin Features (Future Enhancement)

The service includes admin methods for:
- `getFeedbackStats()` - Get feedback statistics
- Complete feedback management
- Rating distribution analytics

## 🐛 Troubleshooting

### Common Issues:

1. **"User not authenticated" Error**
   - Ensure user is logged in
   - Check Supabase auth configuration

2. **"Failed to submit feedback" Error**
   - Check network connection
   - Verify Supabase project URL and API key
   - Check browser console for detailed errors

3. **Empty Previous Feedbacks**
   - Verify RLS policies are applied correctly
   - Check if feedback exists in database
   - Ensure user has 'authenticated' role

4. **Validation Errors**
   - Feedback text: 10-2000 characters required
   - Rating: Must be 1-5 stars
   - Check database constraints

## 🔄 Step 7: Database Maintenance

### Regular Tasks:
1. **Monitor feedback volume**
2. **Review feedback content periodically**
3. **Analyze rating trends**
4. **Backup feedback data**

### Performance:
- Indexes are automatically created for optimal performance
- Consider archiving old feedback after 1-2 years

## 📈 Step 8: Analytics Queries

Here are some useful queries for feedback analysis:

```sql
-- Average rating by month
SELECT 
  DATE_TRUNC('month', submission_date) as month,
  AVG(rating) as avg_rating,
  COUNT(*) as feedback_count
FROM trainee_feedback 
GROUP BY month 
ORDER BY month DESC;

-- Rating distribution
SELECT 
  rating,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM trainee_feedback 
GROUP BY rating 
ORDER BY rating;

-- Recent feedback (last 7 days)
SELECT 
  trainee_name,
  rating,
  LEFT(feedback_text, 100) as preview,
  submission_date
FROM trainee_feedback 
WHERE submission_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY created_at DESC;
```

## ✅ Success Checklist

- [ ] SQL schema executed successfully
- [ ] Table visible in Supabase dashboard
- [ ] App compiles without errors
- [ ] Trainee can complete checklist
- [ ] Feedback form appears after completion
- [ ] Feedback submits successfully
- [ ] Previous feedbacks load correctly
- [ ] Data appears in Supabase table

## 🎉 Congratulations!

Your trainee feedback system is now fully operational with:
- ✅ Secure database storage
- ✅ Real-time data synchronization
- ✅ Complete CRUD operations
- ✅ User authentication integration
- ✅ Error handling and validation
- ✅ Beautiful UI with loading states

The system is ready for production use and can handle multiple trainees submitting feedback simultaneously! 