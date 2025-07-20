import { Event, EventStatus, EventType, EventStats, EventFeedback, UserEventTracking } from '../types/events';

// Interface for API responses
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// Interface for event filters
interface EventFilters {
  status?: EventStatus;
  category?: string;
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

class EventService {
  private baseUrl: string = 'https://api.mitconnect.com'; // Future API endpoint
  private useMockData: boolean = true; // Use mock data to avoid network failures - no backend API available yet
  private mockFeedback: EventFeedback[] = []; // Store mock feedback data
  private mockUserEventTracking: UserEventTracking[] = []; // Track user event status

  // MARK: - Event CRUD Operations

  /**
   * Fetch all events (will be replaced with API call)
   */
  async getAllEvents(): Promise<Event[]> {
    if (this.useMockData) {
      return this.getMockEvents();
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/events`);
      const result: ApiResponse<Event[]> = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching events:', error);
      return []; // Return empty array instead of mock data
    }
  }

  /**
   * Fetch events by filters (for admin dashboard)
   */
  async getEventsByFilters(filters: EventFilters): Promise<Event[]> {
    if (this.useMockData) {
      return this.getMockEvents().filter(event => {
        if (filters.status && event.status !== filters.status) return false;
        if (filters.category && event.category !== filters.category) return false;
        if (filters.location && !event.location.includes(filters.location)) return false;
        if (filters.search && !event.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
        return true;
      });
    }

    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const response = await fetch(`${this.baseUrl}/events?${queryParams}`);
      const result: ApiResponse<Event[]> = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching filtered events:', error);
      return [];
    }
  }

  /**
   * Fetch featured events for home screen
   */
  async getFeaturedEvents(): Promise<Event[]> {
    if (this.useMockData) {
      return this.getMockEvents().filter(event => event.featured);
    }

    try {
      const response = await fetch(`${this.baseUrl}/events/featured`);
      const result: ApiResponse<Event[]> = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching featured events:', error);
      return []; // Return empty array instead of mock data
    }
  }

  /**
   * Fetch upcoming events for home screen
   */
  async getUpcomingEvents(limit: number = 5): Promise<Event[]> {
    if (this.useMockData) {
      const futureEvents = this.getMockEvents().filter(event => {
        const eventDate = new Date(event.date);
        return eventDate > new Date();
      });
      return futureEvents.slice(0, limit);
    }

    try {
      const response = await fetch(`${this.baseUrl}/events/upcoming?limit=${limit}`);
      const result: ApiResponse<Event[]> = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      return [];
    }
  }

  /**
   * Fetch single event by ID
   */
  async getEventById(id: string): Promise<Event | null> {
    if (this.useMockData) {
      return this.getMockEvents().find(event => event.id === id) || null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/events/${id}`);
      const result: ApiResponse<Event> = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching event:', error);
      return null;
    }
  }

  // MARK: - User-Specific Operations

  /**
   * Get user's registered events with proper status tracking
   */
  async getUserRegisteredEvents(userId: string): Promise<Event[]> {
    if (this.useMockData) {
      const mockEvents = this.getMockEvents();
      
      // Only return events that the user has actually registered for
      const userRegisteredEventIds = this.mockUserEventTracking
        .filter(tracking => tracking.userId === userId && 
                           (tracking.status === 'registered' || tracking.status === 'attended' || tracking.status === 'completed'))
        .map(tracking => tracking.eventId);
      
      // For demo purposes, let's simulate that event 5 (past event) has been attended
      // but only if user has registered for it
      const event5Tracking = this.mockUserEventTracking.find(
        tracking => tracking.eventId === '5' && tracking.userId === userId
      );
      if (event5Tracking && event5Tracking.status === 'registered') {
        event5Tracking.status = 'attended';
        event5Tracking.attendanceDate = new Date();
        userRegisteredEventIds.push('5'); // Add to registered list since it's now attended
      }
      
      // Return only events the user has actually registered for
      return mockEvents.filter(event => userRegisteredEventIds.includes(event.id));
    }

    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}/events/registered`);
      const result: ApiResponse<Event[]> = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching user events:', error);
      return [];
    }
  }

  /**
   * Get user's bookmarked events
   */
  async getUserBookmarkedEvents(userId: string): Promise<Event[]> {
    if (this.useMockData) {
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}/events/bookmarked`);
      const result: ApiResponse<Event[]> = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching bookmarked events:', error);
      return [];
    }
  }

  /**
   * Register user for an event
   */
  async registerForEvent(registrationData: RegistrationData): Promise<boolean> {
    if (this.useMockData) {
      // Check if user has already completed this event (attended + feedback)
      const existingTracking = this.mockUserEventTracking.find(
        tracking => tracking.eventId === registrationData.eventId && 
                   tracking.userId === registrationData.userId
      );
      
      if (existingTracking && existingTracking.status === 'completed') {
        console.log('User has already completed this event - registration blocked');
        return false;
      }
      
      // Create or update user event tracking
      const trackingIndex = this.mockUserEventTracking.findIndex(
        tracking => tracking.eventId === registrationData.eventId && 
                   tracking.userId === registrationData.userId
      );
      
      if (trackingIndex >= 0) {
        // Update existing tracking
        this.mockUserEventTracking[trackingIndex] = {
          ...this.mockUserEventTracking[trackingIndex],
          status: 'registered',
          registrationDate: registrationData.registrationDate,
        };
      } else {
        // Create new tracking
        this.mockUserEventTracking.push({
          eventId: registrationData.eventId,
          userId: registrationData.userId,
          status: 'registered',
          registrationDate: registrationData.registrationDate,
          feedbackSubmitted: false,
        });
      }
      
      console.log('Mock registration:', registrationData);
      return true;
    }

    try {
      const response = await fetch(`${this.baseUrl}/events/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });
      const result: ApiResponse<boolean> = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error registering for event:', error);
      return false;
    }
  }

  /**
   * Unregister user from an event
   */
  async unregisterFromEvent(eventId: string, userId: string): Promise<boolean> {
    if (this.useMockData) {
      console.log('Mock unregistration:', { eventId, userId });
      return true;
    }

    try {
      const response = await fetch(`${this.baseUrl}/events/${eventId}/unregister`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      const result: ApiResponse<boolean> = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error unregistering from event:', error);
      return false;
    }
  }

  /**
   * Toggle event bookmark
   */
  async toggleEventBookmark(eventId: string, userId: string, isBookmarked: boolean): Promise<boolean> {
    if (this.useMockData) {
      console.log('Mock bookmark toggle:', { eventId, userId, isBookmarked });
      return true;
    }

    try {
      const response = await fetch(`${this.baseUrl}/events/${eventId}/bookmark`, {
        method: isBookmarked ? 'POST' : 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      const result: ApiResponse<boolean> = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      return false;
    }
  }

  /**
   * Submit event feedback
   */
  async submitEventFeedback(feedbackData: FeedbackData): Promise<boolean> {
    if (this.useMockData) {
      // Find user's tracking for this event
      const userTracking = this.mockUserEventTracking.find(
        tracking => tracking.eventId === feedbackData.eventId && 
                   tracking.userId === feedbackData.userId
      );
      
      if (!userTracking) {
        console.log('User not registered for this event');
        return false;
      }
      
      // Store feedback in mock data for demo purposes
      this.mockFeedback.push({
        id: `feedback-${Date.now()}`,
        eventId: feedbackData.eventId,
        userId: feedbackData.userId,
        rating: feedbackData.rating,
        comment: feedbackData.comment,
        submittedAt: feedbackData.submittedAt,
      });
      
      // Update user tracking to mark as completed
      const trackingIndex = this.mockUserEventTracking.findIndex(
        tracking => tracking.eventId === feedbackData.eventId && 
                   tracking.userId === feedbackData.userId
      );
      
      if (trackingIndex >= 0) {
        this.mockUserEventTracking[trackingIndex] = {
          ...this.mockUserEventTracking[trackingIndex],
          status: 'completed',
          feedbackSubmitted: true,
          feedbackDate: feedbackData.submittedAt,
        };
      }
      
      console.log('Mock feedback submission:', feedbackData);
      return true;
    }

    try {
      const response = await fetch(`${this.baseUrl}/events/${feedbackData.eventId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      });
      const result: ApiResponse<boolean> = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      return false;
    }
  }

  /**
   * Get event statistics
   */
  async getEventStats(eventId: string): Promise<EventStats | null> {
    if (this.useMockData) {
      // Calculate stats from mock feedback data
      const eventFeedback = this.mockFeedback.filter(f => f.eventId === eventId);
      
      if (eventFeedback.length === 0) {
        return null;
      }
      
      const totalRating = eventFeedback.reduce((sum, f) => sum + f.rating, 0);
      const averageRating = totalRating / eventFeedback.length;
      
              return {
          totalRegistrations: 0, // Would need to track this separately
          totalAttendees: 0, // Would need to track this separately
          averageRating,
          totalReviews: eventFeedback.length,
          ratingDistribution: {
            1: eventFeedback.filter(f => f.rating === 1).length,
            2: eventFeedback.filter(f => f.rating === 2).length,
            3: eventFeedback.filter(f => f.rating === 3).length,
            4: eventFeedback.filter(f => f.rating === 4).length,
            5: eventFeedback.filter(f => f.rating === 5).length,
          },
        };
    }

    try {
      const response = await fetch(`${this.baseUrl}/events/${eventId}/stats`);
      const result: ApiResponse<EventStats> = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching event stats:', error);
      return null;
    }
  }

  /**
   * Get event feedback
   */
  async getEventFeedback(eventId: string): Promise<EventFeedback[]> {
    if (this.useMockData) {
      return this.mockFeedback.filter(f => f.eventId === eventId);
    }

    try {
      const response = await fetch(`${this.baseUrl}/events/${eventId}/feedback`);
      const result: ApiResponse<EventFeedback[]> = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching event feedback:', error);
      return [];
    }
  }

  /**
   * Get user's status for a specific event
   */
  async getUserEventStatus(eventId: string, userId: string): Promise<UserEventTracking | null> {
    if (this.useMockData) {
      return this.mockUserEventTracking.find(
        tracking => tracking.eventId === eventId && tracking.userId === userId
      ) || null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}/events/${eventId}/status`);
      const result: ApiResponse<UserEventTracking> = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching user event status:', error);
      return null;
    }
  }

  /**
   * Mark user as attended for an event
   */
  async markUserAsAttended(eventId: string, userId: string): Promise<boolean> {
    if (this.useMockData) {
      const trackingIndex = this.mockUserEventTracking.findIndex(
        tracking => tracking.eventId === eventId && tracking.userId === userId
      );
      
      if (trackingIndex >= 0) {
        this.mockUserEventTracking[trackingIndex] = {
          ...this.mockUserEventTracking[trackingIndex],
          status: 'attended',
          attendanceDate: new Date(),
        };
      }
      
      return true;
    }

    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}/events/${eventId}/attend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result: ApiResponse<boolean> = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error marking user as attended:', error);
      return false;
    }
  }

  // MARK: - Admin Operations (Future)

  /**
   * Create new event (Admin only)
   */
  async createEvent(eventData: Omit<Event, 'id'>): Promise<Event | null> {
    if (this.useMockData) {
      console.log('Mock event creation:', eventData);
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/admin/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAdminToken()}`,
        },
        body: JSON.stringify(eventData),
      });
      const result: ApiResponse<Event> = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error creating event:', error);
      return null;
    }
  }

  /**
   * Update event (Admin only)
   */
  async updateEvent(id: string, eventData: Partial<Event>): Promise<boolean> {
    if (this.useMockData) {
      console.log('Mock event update:', { id, eventData });
      return true;
    }

    try {
      const response = await fetch(`${this.baseUrl}/admin/events/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAdminToken()}`,
        },
        body: JSON.stringify(eventData),
      });
      const result: ApiResponse<boolean> = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error updating event:', error);
      return false;
    }
  }

  /**
   * Delete event (Admin only)
   */
  async deleteEvent(id: string): Promise<boolean> {
    if (this.useMockData) {
      console.log('Mock event deletion:', id);
      return true;
    }

    try {
      const response = await fetch(`${this.baseUrl}/admin/events/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.getAdminToken()}`,
        },
      });
      const result: ApiResponse<boolean> = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error deleting event:', error);
      return false;
    }
  }

  // MARK: - Helper Methods

  /**
   * Toggle between mock data and real API
   */
  setUseMockData(useMock: boolean): void {
    this.useMockData = useMock;
  }

  /**
   * Set API base URL
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Get admin token (placeholder for future auth)
   */
  private getAdminToken(): string {
    // This will be replaced with actual auth token management
    return 'mock-admin-token';
  }

  // MARK: - Mock Data (Temporary) - Returns empty arrays to avoid network failures

  private getMockEvents(): Event[] {
    return []; // Return empty array - no mock data
  }
}

// Export singleton instance
export const eventService = new EventService();
export default eventService; 