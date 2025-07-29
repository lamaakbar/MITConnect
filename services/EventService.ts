import { Event, EventStatus, EventType, EventStats, EventFeedback, UserEventTracking, EventCategory } from '../types/events';
import { supabase, ensureAuthenticatedSession } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Interface for API responses
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// Interface for event filters
interface EventFilters {
  status?: EventStatus;
  category?: EventCategory;
  location?: string;
  search?: string;
}

// Interface for event registration
interface RegistrationData {
  eventId: string;
  userId: string;
  registrationDate: Date;
}

// Interface for event feedback
interface FeedbackData {
  eventId: string;
  userId: string;
  rating: number;
  comment: string;
  submittedAt: Date;
}

// Supabase table types
interface SupabaseEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  cover_image: string;
  category: EventCategory;
  featured: boolean;
  status: EventStatus;
  type: EventType;
  max_capacity?: number;
  organizer?: string;
  tags?: string[];
  requirements?: string[];
  materials?: string[];
  created_at: string;
  updated_at: string;
}

interface SupabaseEventAttendee {
  id: string;
  event_id: string;
  user_id: string;
  status: 'confirmed' | 'cancelled';
  created_at: string;
}

class EventService {
  private useMockData: boolean = false; // Now using Supabase

  /**
   * Cache for events to reduce API calls
   */
  private eventsCache: Event[] = [];
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached events if available and fresh
   */
  private getCachedEvents(): Event[] | null {
    const now = Date.now();
    if (this.eventsCache.length > 0 && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      console.log('📦 Using cached events');
      return this.eventsCache;
    }
    return null;
  }

  /**
   * Update cache with fresh data
   */
  private updateCache(events: Event[]): void {
    this.eventsCache = events;
    this.cacheTimestamp = Date.now();
    console.log('📦 Events cache updated');
  }

  /**
   * Clear cache (useful for admin operations)
   */
  public clearCache(): void {
    this.eventsCache = [];
    this.cacheTimestamp = 0;
    console.log('🗑️ Events cache cleared');
  }

  /**
   * Helper method to get authenticated user ID
   */
  private async getAuthenticatedUserId(): Promise<string | null> {
    try {
      console.log('🔍 Getting authenticated user ID...');
      
      // ALWAYS try getSession first (reads from AsyncStorage)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Session error:', sessionError);
      } else if (session?.user?.id) {
        console.log('✅ User found via getSession:', session.user.id);
        return session.user.id;
      } else {
        console.log('ℹ️ No session found, trying getUser...');
      }

      // Only try getUser if getSession failed or returned no user
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          if (authError.name === 'AuthSessionMissingError') {
            // Not an error, just means not logged in
            console.log('No session: user not logged in.');
          } else {
            console.error('❌ getUser error:', authError);
          }
          return null;
        }

        if (user?.id) {
          console.log('✅ User found via getUser:', user.id);
          return user.id;
        }
      } catch (getUserError) {
        console.error('❌ getUser exception:', getUserError);
      }

      // Try refresh session as last resort
      try {
        console.log('🔄 Trying session refresh...');
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('❌ Session refresh error:', refreshError);
        } else if (refreshedSession?.user?.id) {
          console.log('✅ User found via session refresh:', refreshedSession.user.id);
          return refreshedSession.user.id;
        }
      } catch (refreshError) {
        console.error('❌ Session refresh exception:', refreshError);
      }

      console.error('❌ No authenticated user found after all attempts');
      return null;
    } catch (error) {
      console.error('❌ Error getting authenticated user:', error);
      return null;
    }
  }

  /**
   * Helper method to validate and format date
   */
  static validateAndFormatDate(dateString: string): string | null {
    try {
      // Handle various date formats
      let dateObj: Date;
      
      // If it's already in YYYY-MM-DD format, use it directly
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        dateObj = new Date(dateString + 'T00:00:00');
      } else {
        dateObj = new Date(dateString);
      }
      
      if (isNaN(dateObj.getTime())) {
        console.error('Invalid date format:', dateString);
        return null;
      }
      
      // Ensure date is not in the past (optional validation)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dateObj < today) {
        console.warn('Date is in the past:', dateString);
        // You can return null here if you want to prevent past dates
      }
      
      // Format as YYYY-MM-DD for PostgreSQL
      return dateObj.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error parsing date:', error);
      return null;
    }
  }

  /**
   * Helper method to validate time format
   */
  static validateTimeFormat(timeString: string): boolean {
    // Accept both HH:MM and HH:MM AM/PM formats
    const timeRegex24 = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    const timeRegex12 = /^(1[0-2]|0?[1-9]):[0-5][0-9]\s?(AM|PM|am|pm)$/;
    
    return timeRegex24.test(timeString) || timeRegex12.test(timeString);
  }

  /**
   * Helper method to normalize time to 24-hour format
   */
  static normalizeTimeFormat(timeString: string): string | null {
    try {
      // If already in 24-hour format
      if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeString)) {
        return timeString;
      }
      
      // Convert 12-hour format to 24-hour
      const timeRegex12 = /^(1[0-2]|0?[1-9]):([0-5][0-9])\s?(AM|PM|am|pm)$/;
      const match = timeString.match(timeRegex12);
      
      if (match) {
        let hours = parseInt(match[1]);
        const minutes = match[2];
        const period = match[3].toUpperCase();
        
        if (period === 'PM' && hours !== 12) {
          hours += 12;
        } else if (period === 'AM' && hours === 12) {
          hours = 0;
        }
        
        return `${hours.toString().padStart(2, '0')}:${minutes}`;
      }
      
      return null;
    } catch (error) {
      console.error('Error normalizing time:', error);
      return null;
    }
  }

  /**
   * Calculate event status based on current date/time
   */
  static calculateEventStatus(eventDate: string, eventTime: string): EventStatus {
    const now = new Date();
    const eventDateTime = new Date(`${eventDate}T${eventTime}`);
    
    // If event date/time is in the past, it's 'completed'
    if (eventDateTime < now) {
      return 'completed';
    }
    
    // If event date/time is in the future, it's 'upcoming'
    return 'upcoming';
  }

  /**
   * Update event status in database based on current date/time
   */
  async updateEventStatus(eventId: string): Promise<boolean> {
    try {
      const event = await this.getEventById(eventId);
      if (!event) return false;
      
      const newStatus = EventService.calculateEventStatus(event.date, event.time);
      
      // Only update if status has changed
      if (event.status !== newStatus) {
        const { error } = await supabase
          .from('events')
          .update({ status: newStatus })
          .eq('id', eventId);
        
        if (error) {
          console.error('Error updating event status:', error);
          return false;
        }
        
        // Clear cache to ensure fresh data
        this.clearCache();
        return true;
      }
      
      return true;
    } catch (error) {
      console.error('Error updating event status:', error);
      return false;
    }
  }

  /**
   * Update all events statuses based on current date/time
   */
  async updateAllEventStatuses(): Promise<number> {
    try {
      const events = await this.getAllEvents();
      let updatedCount = 0;
      
      for (const event of events) {
        const newStatus = EventService.calculateEventStatus(event.date, event.time);
        if (event.status !== newStatus) {
          const success = await this.updateEventStatus(event.id);
          if (success) updatedCount++;
        }
      }
      
      return updatedCount;
    } catch (error) {
      console.error('Error updating all event statuses:', error);
      return 0;
    }
  }

  // MARK: - Event CRUD Operations

  /**
   * Fetch all events from Supabase
   */
  async getAllEvents(): Promise<Event[]> {
    // Check cache first
    const cachedEvents = this.getCachedEvents();
    if (cachedEvents) {
      return cachedEvents;
    }

    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
        return [];
      }

      const events = data?.map(this.mapSupabaseEventToEvent) || [];
      this.updateCache(events);
      return events;
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  }

  /**
   * Fetch events by filters (for admin dashboard)
   */
  async getEventsByFilters(filters: EventFilters): Promise<Event[]> {
    try {
      let query = supabase.from('events').select('*');

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('date', { ascending: true });

      if (error) {
        console.error('Error fetching filtered events:', error);
        return [];
      }

      return data?.map(this.mapSupabaseEventToEvent) || [];
    } catch (error) {
      console.error('Error fetching filtered events:', error);
      return [];
    }
  }

  /**
   * Fetch featured events for home screen
   */
  async getFeaturedEvents(): Promise<Event[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('featured', true)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching featured events:', error);
        return [];
      }

      return data?.map(this.mapSupabaseEventToEvent) || [];
    } catch (error) {
      console.error('Error fetching featured events:', error);
      return [];
    }
  }

  /**
   * Search events by title and description
   */
  async searchEvents(searchText: string): Promise<Event[]> {
    try {
      console.log('🔍 Searching events with text:', searchText);
      
      if (!searchText.trim()) {
        // If search is empty, return all events
        console.log('🔍 Search text is empty, returning all events');
        return this.getAllEvents();
      }

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .or(`title.ilike.%${searchText}%,description.ilike.%${searchText}%`)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error searching events:', error);
        return [];
      }

      console.log('🔍 Search results found:', data?.length || 0, 'events');
      if (data && data.length > 0) {
        console.log('🔍 First few results:');
        data.slice(0, 3).forEach((event, index) => {
          console.log(`  ${index + 1}. Title: "${event.title}", Description: "${event.description?.substring(0, 50)}..."`);
        });
      }

      return data?.map(this.mapSupabaseEventToEvent) || [];
    } catch (error) {
      console.error('Error searching events:', error);
      return [];
    }
  }

  /**
   * Fetch upcoming events for home screen
   */
  async getUpcomingEvents(limit: number = 5): Promise<Event[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching upcoming events:', error);
        return [];
      }

      return data?.map(this.mapSupabaseEventToEvent) || [];
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      return [];
    }
  }

  /**
   * Fetch single event by ID
   */
  async getEventById(id: string): Promise<Event | null> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching event:', error);
        return null;
      }

      return data ? this.mapSupabaseEventToEvent(data) : null;
    } catch (error) {
      console.error('Error fetching event:', error);
      return null;
    }
  }

  // MARK: - User-Specific Operations

  /**
   * Get user's registered events
   */
  async getUserRegisteredEvents(): Promise<Event[]> {
    try {
      const userId = await this.getAuthenticatedUserId();
      if (!userId) {
        return [];
      }

      console.log('Fetching events for user:', userId);

      const { data, error } = await supabase
        .from('event_attendees')
        .select(`
          event_id,
          events (*)
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user registered events:', error);
        return [];
      }

      return data?.map(item => this.mapSupabaseEventToEvent(item.events as unknown as SupabaseEvent)) || [];
    } catch (error) {
      console.error('Error fetching user registered events:', error);
      return [];
    }
  }

  /**
   * Get user's bookmarked events
   */
  async getUserBookmarkedEvents(): Promise<Event[]> {
    try {
      const userId = await this.getAuthenticatedUserId();
      if (!userId) {
        return [];
      }

      const { data, error } = await supabase
        .from('event_bookmarks')
        .select(`
          event_id,
          events (*)
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user bookmarked events:', error);
        return [];
      }

      return data?.map(item => this.mapSupabaseEventToEvent(item.events as unknown as SupabaseEvent)) || [];
    } catch (error) {
      console.error('Error fetching user bookmarked events:', error);
      return [];
    }
  }

  /**
   * Register user for an event
   */
  async registerForEvent(eventId: string): Promise<boolean> {
    try {
      // Get the authenticated user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user?.id) {
        console.error('User not authenticated');
        return false;
      }

      // Check if user is already registered
      const { data: existingRegistration, error: checkError } = await supabase
        .from('event_attendees')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing registration:', checkError);
        return false;
      }

      if (existingRegistration) {
        console.log('User already registered for this event');
        return false;
      }

      // Register user for the event
      const { error } = await supabase
        .from('event_attendees')
        .insert({
          event_id: eventId,
          user_id: user.id,
          status: 'confirmed'
        });

      if (error) {
        console.error('Error registering for event:', error);
        return false;
      }

      console.log('Successfully registered for event:', { eventId, userId: user.id });
      return true;
    } catch (error) {
      console.error('Error registering for event:', error);
      return false;
    }
  }

  /**
   * Unregister user from an event
   */
  async unregisterFromEvent(eventId: string): Promise<boolean> {
    try {
      // Get the authenticated user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user?.id) {
        console.error('User not authenticated');
        return false;
      }

      // Remove registration
      const { error } = await supabase
        .from('event_attendees')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error unregistering from event:', error);
        return false;
      }

      console.log('Successfully unregistered from event:', { eventId, userId: user.id });
      return true;
    } catch (error) {
      console.error('Error unregistering from event:', error);
      return false;
    }
  }

  /**
   * Toggle event bookmark
   */
  async toggleEventBookmark(eventId: string, isBookmarked: boolean): Promise<boolean> {
    try {
      // Get the authenticated user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user?.id) {
        console.error('User not authenticated');
        return false;
      }

      if (isBookmarked) {
        // Add bookmark
        const { error } = await supabase
          .from('event_bookmarks')
          .insert({
            event_id: eventId,
            user_id: user.id
          });

        if (error) {
          console.error('Error adding bookmark:', error);
          return false;
        }
      } else {
        // Remove bookmark
        const { error } = await supabase
          .from('event_bookmarks')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error removing bookmark:', error);
          return false;
        }
      }

      console.log('Successfully toggled bookmark:', { eventId, userId: user.id, isBookmarked });
      return true;
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      return false;
    }
  }

  /**
   * Get event attendees for admin with user names
   */
  async getEventAttendees(eventId: string): Promise<any[]> {
    try {
      console.log('🔍 Fetching attendees for event:', eventId);
      
      // Try JOIN query first
      const { data: attendees, error } = await supabase
        .from('event_attendees')
        .select(`
          id,
          event_id,
          user_id,
          status,
          created_at,
          users (
            id,
            name,
            email,
            role
          )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error with JOIN query, falling back to manual query:', error);
        return await this.getEventAttendeesManual(eventId);
      }

      if (!attendees || attendees.length === 0) {
        console.log('No attendees found for event:', eventId);
        return [];
      }

      console.log('✅ Found', attendees.length, 'attendees with JOIN:', attendees);
      return attendees;
    } catch (error) {
      console.error('Error fetching event attendees:', error);
      return await this.getEventAttendeesManual(eventId);
    }
  }

  /**
   * Manual fallback method for getting attendees
   */
  private async getEventAttendeesManual(eventId: string): Promise<any[]> {
    try {
      console.log('🔄 Using manual fallback method');
      
      // Get all registrations for this event
      const { data: registrations, error: regError } = await supabase
        .from('event_attendees')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (regError) {
        console.error('Error fetching registrations:', regError);
        return [];
      }

      if (!registrations || registrations.length === 0) {
        return [];
      }

      // Get all user IDs
      const userIds = registrations.map(r => r.user_id);
      console.log('👥 User IDs to fetch:', userIds);

      // Get all users in one query
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, role')
        .in('id', userIds);

      if (usersError) {
        console.error('Error fetching users:', usersError);
        return [];
      }

      console.log('👤 Found users:', users);

      // Create a map for quick lookup
      const userMap = new Map();
      users?.forEach(user => userMap.set(user.id, user));

      // Combine the data
      const formattedAttendees = registrations.map(registration => {
        const user = userMap.get(registration.user_id);
        return {
          id: registration.id,
          user_id: registration.user_id,
          name: user?.name || `User ${registration.user_id.substring(0, 8)}`,
          email: user?.email || 'No email available',
          role: user?.role || 'Unknown',
          registration_date: registration.created_at,
          status: registration.status || 'confirmed'
        };
      });

      console.log('✅ Manual method result:', formattedAttendees);
      return formattedAttendees;
    } catch (error) {
      console.error('Error in manual method:', error);
      return [];
    }
  }

  /**
   * Get user's status for a specific event
   */
  async getUserEventStatus(eventId: string): Promise<UserEventTracking | null> {
    try {
      // Get the authenticated user using the robust method
      const userId = await this.getAuthenticatedUserId();
      
      if (!userId) {
        console.error('User not authenticated');
        return null;
      }

      // Check event_attendees table (correct table name from schema)
      const { data, error } = await supabase
        .from('event_attendees')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user event status:', error);
        return null;
      }

      // If no registration found, return null
      if (!data) {
        console.log('No registration found for user:', userId, 'event:', eventId);
        return null;
      }

      // Check if event is in the past to determine if user "attended"
      const event = await this.getEventById(eventId);
      const isEventInPast = event ? new Date(event.date) < new Date() : false;

      // Check if user already submitted feedback
      let feedbackSubmitted = false;
      try {
        const { data: existingFeedback } = await supabase
          .from('event_feedback')
          .select('id')
          .eq('event_id', eventId)
          .eq('user_id', userId)
          .maybeSingle();
        
        feedbackSubmitted = !!existingFeedback;
      } catch (feedbackError) {
        console.log('Could not check existing feedback:', feedbackError);
      }

      const status = isEventInPast ? 'attended' : 'registered';
      console.log('User event status:', { userId, eventId, status, feedbackSubmitted });

      return {
        eventId: data.event_id,
        userId: data.user_id,
        status: status,
        registrationDate: new Date(data.created_at),
        feedbackSubmitted: feedbackSubmitted
      };
    } catch (error) {
      console.error('Error fetching user event status:', error);
      return null;
    }
  }

  // MARK: - Admin Operations

  /**
   * Create new event (Admin only)
   */
  async createEvent(eventData: Omit<Event, 'id'>): Promise<Event | null> {
    try {
      // Validate required fields
      if (!eventData.title || !eventData.description || !eventData.date || !eventData.time || !eventData.location) {
        console.error('Missing required fields for event creation');
        return null;
      }

      // Validate and format date
      let formattedDate: string;
      try {
        const dateObj = new Date(eventData.date);
        if (isNaN(dateObj.getTime())) {
          console.error('Invalid date format:', eventData.date);
          return null;
        }
        // Format as YYYY-MM-DD for PostgreSQL
        formattedDate = dateObj.toISOString().split('T')[0];
      } catch (error) {
        console.error('Error parsing date:', error);
        return null;
      }

      // Validate and format time
      let formattedTime: string;
      try {
        if (!EventService.validateTimeFormat(eventData.time)) {
          console.error('Invalid time format. Expected HH:MM or HH:MM AM/PM format:', eventData.time);
          return null;
        }
        
        // Normalize to 24-hour format
        const normalizedTime = EventService.normalizeTimeFormat(eventData.time);
        if (!normalizedTime) {
          console.error('Could not normalize time format:', eventData.time);
          return null;
        }
        formattedTime = normalizedTime;
      } catch (error) {
        console.error('Error parsing time:', error);
        return null;
      }

      console.log('Formatted date:', formattedDate);
      console.log('Formatted time:', formattedTime);

      const supabaseEvent = {
        title: eventData.title.trim(),
        description: eventData.description.trim(),
        date: formattedDate,
        time: formattedTime,
        location: eventData.location.trim(),
        cover_image: eventData.coverImage || null,
        category: eventData.category,
        featured: eventData.featured,
        status: eventData.status,
        type: eventData.type,
        max_capacity: eventData.maxCapacity,
        organizer: eventData.organizer,
        tags: eventData.tags,
        requirements: eventData.requirements,
        materials: eventData.materials
      };

      console.log('Inserting event data:', supabaseEvent);
      console.log('Cover image being saved:', supabaseEvent.cover_image);

      const { data, error } = await supabase
        .from('events')
        .insert(supabaseEvent)
        .select()
        .single();

      if (error) {
        console.error('Error creating event:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        return null;
      }

      console.log('Successfully created event:', data);
      // Clear cache since we added a new event
      this.clearCache();
      return this.mapSupabaseEventToEvent(data);
    } catch (error) {
      console.error('Error creating event:', error);
      return null;
    }
  }

  /**
   * Update event (Admin only)
   */
  async updateEvent(id: string, eventData: Partial<Event>): Promise<boolean> {
    try {
      const updateData: any = {};
      
      if (eventData.title) updateData.title = eventData.title;
      if (eventData.description) updateData.description = eventData.description;
      if (eventData.date) updateData.date = eventData.date;
      if (eventData.time) updateData.time = eventData.time;
      if (eventData.location) updateData.location = eventData.location;
      if (eventData.coverImage) updateData.cover_image = eventData.coverImage;
      if (eventData.category) updateData.category = eventData.category;
      if (eventData.featured !== undefined) updateData.featured = eventData.featured;
      if (eventData.status) updateData.status = eventData.status;
      if (eventData.type) updateData.type = eventData.type;
      if (eventData.maxCapacity) updateData.max_capacity = eventData.maxCapacity;
      if (eventData.organizer) updateData.organizer = eventData.organizer;
      if (eventData.tags) updateData.tags = eventData.tags;
      if (eventData.requirements) updateData.requirements = eventData.requirements;
      if (eventData.materials) updateData.materials = eventData.materials;

      const { error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating event:', error);
        return false;
      }

      console.log('Successfully updated event:', id);
      return true;
    } catch (error) {
      console.error('Error updating event:', error);
      return false;
    }
  }

  /**
   * Delete event (Admin only) - Comprehensive cleanup
   */
  async deleteEvent(id: string): Promise<boolean> {
    try {
      console.log('Starting comprehensive deletion of event:', id);
      
      // Delete all related records in the correct order
      // 1. Delete event feedback first (if table exists)
      try {
        const { error: feedbackError } = await supabase
          .from('event_feedback')
          .delete()
          .eq('event_id', id);
        
        if (feedbackError) {
          console.error('Error deleting event feedback:', feedbackError);
        }
      } catch (error) {
        console.log('Event feedback table may not exist, skipping feedback deletion');
      }

      // 2. Delete event registrations
      const { error: regError } = await supabase
        .from('event_attendees')
        .delete()
        .eq('event_id', id);
      
      if (regError) {
        console.error('Error deleting event registrations:', regError);
      }

      // 3. Delete event bookmarks
      const { error: bookmarkError } = await supabase
        .from('event_bookmarks')
        .delete()
        .eq('event_id', id);
      
      if (bookmarkError) {
        console.error('Error deleting event bookmarks:', bookmarkError);
      }

      // 4. Finally delete the event itself
      const { error: eventError } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (eventError) {
        console.error('Error deleting event:', eventError);
        return false;
      }

      // Clear cache to ensure fresh data
      this.clearCache();
      
      console.log('Successfully deleted event and all related data:', id);
      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      return false;
    }
  }

  /**
   * Check if event exists
   */
  async eventExists(id: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id')
        .eq('id', id)
        .single();

      if (error) {
        return false;
      }

      return !!data;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clean up orphaned records (for maintenance)
   */
  async cleanupOrphanedRecords(): Promise<{
    deletedRegistrations: number;
    deletedBookmarks: number;
    deletedFeedback: number;
  }> {
    try {
      console.log('Starting orphaned records cleanup...');
      
      // Get all event IDs that exist
      const { data: existingEvents } = await supabase
        .from('events')
        .select('id');
      
      const existingEventIds = existingEvents?.map(e => e.id) || [];
      
      // Delete orphaned registrations
      const { data: orphanedRegistrations } = await supabase
        .from('event_attendees')
        .delete()
        .not('event_id', 'in', `(${existingEventIds.map(id => `'${id}'`).join(',')})`)
        .select();
      
      // Delete orphaned bookmarks
      const { data: orphanedBookmarks } = await supabase
        .from('event_bookmarks')
        .delete()
        .not('event_id', 'in', `(${existingEventIds.map(id => `'${id}'`).join(',')})`)
        .select();
      
      // Delete orphaned feedback (if table exists)
      let orphanedFeedback = null;
      try {
        const { data } = await supabase
          .from('event_feedback')
          .delete()
          .not('event_id', 'in', `(${existingEventIds.map(id => `'${id}'`).join(',')})`)
          .select();
        orphanedFeedback = data;
      } catch (error) {
        console.log('Event feedback table may not exist, skipping feedback cleanup');
      }
      
      const result = {
        deletedRegistrations: orphanedRegistrations?.length || 0,
        deletedBookmarks: orphanedBookmarks?.length || 0,
        deletedFeedback: orphanedFeedback?.length || 0,
      };
      
      console.log('Orphaned records cleanup completed:', result);
      return result;
    } catch (error) {
      console.error('Error cleaning up orphaned records:', error);
      return {
        deletedRegistrations: 0,
        deletedBookmarks: 0,
        deletedFeedback: 0,
      };
    }
  }

  // MARK: - Helper Methods

  /**
   * Map Supabase event to Event interface
   */
  private mapSupabaseEventToEvent(supabaseEvent: SupabaseEvent): Event {
    // Ensure cover_image is a valid URL or undefined
    let coverImageUrl: string | undefined = undefined;
    if (supabaseEvent.cover_image && supabaseEvent.cover_image.trim() !== '') {
      // Check if it's already a full URL
      if (supabaseEvent.cover_image.startsWith('http')) {
        coverImageUrl = supabaseEvent.cover_image;
        console.log('✅ Event image URL found:', coverImageUrl);
      } else {
        // If it's a relative path, construct full URL
        coverImageUrl = supabaseEvent.cover_image;
        console.log('✅ Event image path found:', coverImageUrl);
      }
    } else {
      console.log('❌ No cover image found for event:', supabaseEvent.title, 'cover_image value:', supabaseEvent.cover_image);
    }

    return {
      id: supabaseEvent.id,
      title: supabaseEvent.title,
      description: supabaseEvent.description,
      date: supabaseEvent.date,
      time: supabaseEvent.time,
      location: supabaseEvent.location,
      image: coverImageUrl ? { uri: coverImageUrl } : require('../assets/images/splash-icon.png'),
      coverImage: coverImageUrl,
      category: supabaseEvent.category,
      registeredCount: 0, // Will be calculated separately
      featured: supabaseEvent.featured,
      status: supabaseEvent.status,
      type: supabaseEvent.type,
      maxCapacity: supabaseEvent.max_capacity,
      organizer: supabaseEvent.organizer,
      tags: supabaseEvent.tags,
      requirements: supabaseEvent.requirements,
      materials: supabaseEvent.materials,
      createdAt: new Date(supabaseEvent.created_at),
      updatedAt: new Date(supabaseEvent.updated_at)
    };
  }

  /**
   * Submit event feedback
   */
  async submitEventFeedback(feedbackData: Omit<FeedbackData, 'userId' | 'submittedAt'>): Promise<boolean> {
    try {
      // Get the authenticated user using the robust method
      const userId = await this.getAuthenticatedUserId();
      
      if (!userId) {
        console.error('User not authenticated');
        return false;
      }

      // Check if user is registered for this event (using correct table name)
      const { data: existingRegistration, error: checkError } = await supabase
        .from('event_attendees')
        .select('*')
        .eq('event_id', feedbackData.eventId)
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking registration for feedback:', checkError);
        return false;
      }

      if (!existingRegistration) {
        console.log('User not registered for this event');
        return false;
      }

      // Check if event is in the past (users can only submit feedback for past events)
      const event = await this.getEventById(feedbackData.eventId);
      if (!event) {
        console.error('Event not found');
        return false;
      }

      const eventDate = new Date(event.date);
      const today = new Date();
      if (eventDate >= today) {
        console.log('Cannot submit feedback for future events');
        return false;
      }

      // Check if user already submitted feedback
      const { data: existingFeedback, error: feedbackCheckError } = await supabase
        .from('event_feedback')
        .select('*')
        .eq('event_id', feedbackData.eventId)
        .eq('user_id', userId)
        .maybeSingle();

      if (feedbackCheckError) {
        console.error('Error checking existing feedback:', feedbackCheckError);
        return false;
      }

      if (existingFeedback) {
        console.log('User already submitted feedback for this event');
        return false;
      }

      // Get user info for username (required by database schema)
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        console.error('Error getting user data:', userError);
        return false;
      }

      // Get username from metadata or use email as fallback
      const username = userData.user.user_metadata?.username || 
                      userData.user.email || 
                      'Anonymous User';

      // Store feedback in event_feedback table
      try {
        const { error } = await supabase
          .from('event_feedback')
          .insert({
            event_id: feedbackData.eventId,
            user_id: userId,
            username: username,
            rating: feedbackData.rating,
            comment: feedbackData.comment,
            feedback_text: feedbackData.comment || ''
            // created_at will be automatically set by DEFAULT NOW()
          });

        if (error) {
          console.error('Error submitting feedback:', error);
          return false;
        }
      } catch (error) {
        console.error('Error submitting feedback (table may not exist):', error);
        return false;
      }

              console.log('Successfully submitted feedback:', { ...feedbackData, userId: userId, username });
      return true;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      return false;
    }
  }

  /**
   * Get event statistics
   */
  async getEventStats(eventId: string): Promise<EventStats | null> {
    try {
      // Get total registrations (using correct table name)
      const { count: totalRegistrations } = await supabase
        .from('event_attendees')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);

      // Get feedback data
      let feedbackData: any[] = [];
      try {
        const { data } = await supabase
          .from('event_feedback')
          .select('rating')
          .eq('event_id', eventId);
        feedbackData = data || [];
      } catch (error) {
        console.log('Event feedback table may not exist, using empty feedback data');
        feedbackData = [];
      }

      if (!feedbackData || feedbackData.length === 0) {
        return {
          totalRegistrations: totalRegistrations || 0,
          totalAttendees: 0,
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
      }

      const totalRating = feedbackData.reduce((sum, f) => sum + f.rating, 0);
      const averageRating = totalRating / feedbackData.length;

      return {
        totalRegistrations: totalRegistrations || 0,
        totalAttendees: 0, // Would need separate attendance tracking
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalReviews: feedbackData.length,
        ratingDistribution: {
          1: feedbackData.filter(f => f.rating === 1).length,
          2: feedbackData.filter(f => f.rating === 2).length,
          3: feedbackData.filter(f => f.rating === 3).length,
          4: feedbackData.filter(f => f.rating === 4).length,
          5: feedbackData.filter(f => f.rating === 5).length
        }
      };
    } catch (error) {
      console.error('Error getting event stats:', error);
      return null;
    }
  }

  /**
   * Get event feedback
   */
  async getEventFeedback(eventId: string): Promise<EventFeedback[]> {
    try {
      const { data, error } = await supabase
        .from('event_feedback')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching event feedback:', error);
        return [];
      }

      return data?.map(feedback => ({
        id: feedback.id,
        eventId: feedback.event_id,
        userId: feedback.user_id,
        username: feedback.username || 'Anonymous User',
        rating: feedback.rating,
        comment: feedback.comment || feedback.feedback_text || '',
        feedbackText: feedback.feedback_text || feedback.comment || '',
        tags: feedback.tags || [],
        submittedAt: new Date(feedback.created_at),
        updatedAt: feedback.updated_at ? new Date(feedback.updated_at) : undefined
      })) || [];
    } catch (error) {
      console.error('Error fetching event feedback (table may not exist):', error);
      return [];
    }
  }

  /**
   * Mark user as attended for an event
   */
  async markUserAsAttended(eventId: string): Promise<boolean> {
    try {
      // Get the authenticated user using the robust method
      const userId = await this.getAuthenticatedUserId();
      
      if (!userId) {
        console.error('User not authenticated');
        return false;
      }

      // Since your event_attendees table doesn't have a status field,
      // we'll just return true if the user is registered
      const { data, error } = await supabase
        .from('event_attendees')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error checking registration for attendance:', error);
        return false;
      }

      if (data) {
        console.log('User is registered for event:', { eventId, userId: userId });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking user attendance:', error);
      return false;
    }
  }

  /**
   * Toggle between mock data and real API
   */
  setUseMockData(useMock: boolean): void {
    this.useMockData = useMock;
  }

  /**
   * Debug session and authentication state
   */
  async debugSessionState(): Promise<void> {
    console.log('🔍 Debugging Session State...');
    
    try {
      // Test AsyncStorage
      console.log('📦 Testing AsyncStorage...');
      const testKey = 'debug-test';
      const testValue = 'debug-value-' + Date.now();
      await AsyncStorage.setItem(testKey, testValue);
      const retrieved = await AsyncStorage.getItem(testKey);
      console.log('AsyncStorage test:', retrieved === testValue ? '✅ PASSED' : '❌ FAILED');
      await AsyncStorage.removeItem(testKey);
      
      // Test getSession
      console.log('🔐 Testing getSession...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.log('getSession error:', sessionError);
      } else if (session) {
        console.log('✅ getSession found user:', session.user.email);
      } else {
        console.log('ℹ️ getSession: no session found');
      }
      
      // Test getUser
      console.log('👤 Testing getUser...');
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.log('getUser error:', userError);
        } else if (user) {
          console.log('✅ getUser found user:', user.email);
        } else {
          console.log('ℹ️ getUser: no user found');
        }
      } catch (getUserError) {
        console.log('getUser exception:', getUserError);
      }
      
      // Test our method
      console.log('🔍 Testing getAuthenticatedUserId...');
      const userId = await this.getAuthenticatedUserId();
      console.log('getAuthenticatedUserId result:', userId || 'null');
      
    } catch (error) {
      console.error('❌ Debug failed:', error);
    }
  }

  /**
   * Test method to verify all functionality
   */
  async testAllFunctionality(): Promise<{
    authentication: boolean;
    dateValidation: boolean;
    timeValidation: boolean;
    eventCreation: boolean;
    userEvents: boolean;
  }> {
    const results = {
      authentication: false,
      dateValidation: false,
      timeValidation: false,
      eventCreation: false,
      userEvents: false,
    };

    try {
      // Test 1: Authentication
      const userId = await this.getAuthenticatedUserId();
      results.authentication = !!userId;
      console.log('✅ Authentication test:', results.authentication ? 'PASSED' : 'FAILED', userId);

      // Test 2: Date Validation
      const validDate = EventService.validateAndFormatDate('2024-12-25');
      const invalidDate = EventService.validateAndFormatDate('invalid-date');
      results.dateValidation = !!validDate && !invalidDate;
      console.log('✅ Date validation test:', results.dateValidation ? 'PASSED' : 'FAILED');

      // Test 3: Time Validation
      const validTime24 = EventService.validateTimeFormat('14:30');
      const validTime12 = EventService.validateTimeFormat('2:30 PM');
      const invalidTime = EventService.validateTimeFormat('25:70');
      results.timeValidation = validTime24 && validTime12 && !invalidTime;
      console.log('✅ Time validation test:', results.timeValidation ? 'PASSED' : 'FAILED');

      // Test 4: Time Normalization
      const normalized24 = EventService.normalizeTimeFormat('14:30');
      const normalized12 = EventService.normalizeTimeFormat('2:30 PM');
      results.timeValidation = results.timeValidation && normalized24 === '14:30' && normalized12 === '14:30';
      console.log('✅ Time normalization test:', results.timeValidation ? 'PASSED' : 'FAILED');

      // Test 5: User Events (if authenticated)
      if (results.authentication) {
        try {
          const userEvents = await this.getUserRegisteredEvents();
          const bookmarkedEvents = await this.getUserBookmarkedEvents();
          results.userEvents = true;
          console.log('✅ User events test: PASSED', {
            registered: userEvents.length,
            bookmarked: bookmarkedEvents.length
          });
        } catch (error) {
          console.log('⚠️ User events test: FAILED', error);
        }
      }

      // Test 6: Event Creation (mock test)
      const testEventData = {
        title: 'Test Event',
        desc: 'Test Description',
        date: '2024-12-25',
        time: '14:30',
        location: 'Test Location',
        image: null,
        category: 'Workshop' as any,
        registeredCount: 0,
        featured: false,
        status: 'upcoming' as any,
        type: 'MITC' as any
      };

      // Don't actually create the event, just test validation
      const formattedDate = EventService.validateAndFormatDate(testEventData.date);
      const normalizedTime = EventService.normalizeTimeFormat(testEventData.time);
      results.eventCreation = !!formattedDate && !!normalizedTime;
      console.log('✅ Event creation validation test:', results.eventCreation ? 'PASSED' : 'FAILED');

    } catch (error) {
      console.error('❌ Test suite error:', error);
    }

    console.log('📊 Test Results Summary:', results);
    return results;
  }
}

// Export singleton instance
export const eventService = new EventService();
export { EventService };
export default eventService; 