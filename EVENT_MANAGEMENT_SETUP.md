# Event Management System Setup Guide

## Overview
This guide explains how to set up the event management system that connects admin-created events with employees and trainees using Supabase as the backend.

## Features Implemented

### ✅ Admin Features
- **Create Events**: Admins can create new events with full details
- **Edit Events**: Modify existing event information
- **Delete Events**: Remove events from the system
- **View Attendees**: See all registered users for each event
- **Filter Attendees**: Filter between confirmed and cancelled attendees
- **Event Management**: Full CRUD operations for events

### ✅ User Features (Employees & Trainees)
- **View Events**: See all events created by admin
- **Register for Events**: One-click registration with duplicate prevention
- **My Events**: View registered events
- **Event Details**: Full event information display

### ✅ Backend Features
- **Supabase Integration**: Real database storage
- **User Registration Tracking**: Prevent duplicate registrations
- **Event Status Management**: Track event lifecycle
- **Attendee Management**: Complete attendee tracking

## Database Schema

### Tables Created
1. **events** - Main event information
2. **event_attendees** - User registrations for events
3. **event_bookmarks** - User bookmarks for events
4. **event_feedback** - User feedback for events
5. **users** - User information

### Key Relationships
- `event_attendees.event_id` → `events.id`
- `event_bookmarks.event_id` → `events.id`
- `event_feedback.event_id` → `events.id`

## Setup Instructions

### 1. Supabase Setup

1. **Run Database Schema**
   ```sql
   -- Copy and paste the contents of database-schema.sql
   -- into your Supabase SQL editor and execute
   ```

2. **Verify Tables Created**
   - Check that all 5 tables are created in your Supabase dashboard
   - Verify that sample data is inserted

### 2. App Configuration

The app is already configured to use Supabase. The connection details are in:
```
services/supabase.ts
```

### 3. Testing the System

#### Admin Testing
1. **Login as Admin**
   - Use email: `admin@company.com`
   - Navigate to Admin Events section

2. **Create an Event**
   - Click the "+" button
   - Fill in all required fields
   - Save the event

3. **View Event Details**
   - Click on any event to see details
   - Check attendees list

#### User Testing
1. **Login as Employee/Trainee**
   - Use any user account
   - Navigate to Events section

2. **Register for Event**
   - Click "Register" on any event
   - Verify registration is saved

3. **View My Events**
   - Check that registered events appear

## Code Structure

### Key Files Modified/Created

#### Services
- `services/EventService.ts` - Complete Supabase integration
- `services/supabase.ts` - Supabase client configuration

#### Components
- `app/admin-events/index.tsx` - Admin event management
- `app/events.tsx` - User events display
- `components/EventContext.tsx` - Event state management

#### Database
- `database-schema.sql` - Complete database setup

### Event Flow

1. **Admin Creates Event**
   ```
   Admin Form → EventService.createEvent() → Supabase events table
   ```

2. **User Views Events**
   ```
   Events Screen → EventContext → EventService.getAllEvents() → Supabase
   ```

3. **User Registers**
   ```
   Register Button → EventService.registerForEvent() → Supabase event_attendees table
   ```

4. **Admin Views Attendees**
   ```
   Admin Event Details → EventService.getEventAttendees() → Supabase
   ```

## API Endpoints Used

### Events
- `GET /events` - Get all events
- `POST /events` - Create new event (admin)
- `PUT /events/:id` - Update event (admin)
- `DELETE /events/:id` - Delete event (admin)

### Event Attendees
- `GET /event_attendees?event_id=:id` - Get event attendees
- `POST /event_attendees` - Register for event
- `DELETE /event_attendees` - Unregister from event

### Event Bookmarks
- `GET /event_bookmarks?user_id=:id` - Get user bookmarks
- `POST /event_bookmarks` - Add bookmark
- `DELETE /event_bookmarks` - Remove bookmark

## Security Features

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- Admins have broader access

### Data Validation
- Event dates prevent past registrations
- Duplicate registration prevention
- Required field validation

## Troubleshooting

### Common Issues

1. **Events Not Showing**
   - Check Supabase connection
   - Verify tables are created
   - Check console for errors

2. **Registration Fails**
   - Verify user ID is correct
   - Check for duplicate registrations
   - Ensure event date is in future

3. **Admin Can't Create Events**
   - Check admin permissions
   - Verify all required fields
   - Check Supabase policies

### Debug Steps

1. **Check Console Logs**
   ```javascript
   // Add to EventService methods
   console.log('Supabase response:', data, error);
   ```

2. **Verify Database**
   ```sql
   -- Check if events exist
   SELECT * FROM events;
   
   -- Check if attendees exist
   SELECT * FROM event_attendees;
   ```

3. **Test Connection**
   ```javascript
   // Test Supabase connection
   const { data, error } = await supabase.from('events').select('*');
   console.log('Connection test:', data, error);
   ```

## Future Enhancements

### Planned Features
- [ ] Real-time notifications
- [ ] Event reminders
- [ ] Advanced filtering
- [ ] Event analytics
- [ ] Email notifications
- [ ] Calendar integration

### Performance Optimizations
- [ ] Event caching
- [ ] Pagination for large datasets
- [ ] Image optimization
- [ ] Offline support

## Support

For issues or questions:
1. Check the console logs
2. Verify database setup
3. Test with sample data
4. Review error messages

The system is now fully functional with real database storage and proper user management! 