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
  private useMockData: boolean = true; // Toggle between mock and real API
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
      return this.getMockEvents(); // Fallback to mock data
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
      return this.getMockEvents().filter(event => event.featured);
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
      // Get the event to check its date
      const event = this.getMockEvents().find(e => e.id === registrationData.eventId);
      if (!event) {
        console.log('Event not found - registration blocked');
        return false;
      }

      // Check if event date has passed
      const eventDate = new Date(event.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
      
      if (eventDate < today) {
        console.log('Event date has passed - registration blocked');
        return false;
      }

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
      // For API version, we'll rely on the backend to validate dates
      // But we can add client-side validation as well
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
   * Bookmark/unbookmark an event
   */
  async toggleEventBookmark(eventId: string, userId: string, isBookmarked: boolean): Promise<boolean> {
    if (this.useMockData) {
      console.log('Mock bookmark toggle:', { eventId, userId, isBookmarked });
      return true;
    }

    try {
      const method = isBookmarked ? 'POST' : 'DELETE';
      const response = await fetch(`${this.baseUrl}/events/${eventId}/bookmark`, {
        method,
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
      // Check if user has attended this event
      const userTracking = this.mockUserEventTracking.find(
        tracking => tracking.eventId === feedbackData.eventId && 
                   tracking.userId === feedbackData.userId
      );
      
      if (!userTracking || userTracking.status !== 'attended') {
        console.log('User has not attended this event - feedback submission blocked');
        return false;
      }
      
      // Store feedback in mock data for demo purposes
      this.mockFeedback.push({
        id: Date.now().toString(),
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
   * Get event statistics including ratings and feedback
   */
  async getEventStats(eventId: string): Promise<EventStats | null> {
    if (this.useMockData) {
      // Calculate stats from mock feedback data
      const eventFeedback = this.mockFeedback.filter(f => f.eventId === eventId);
      
      if (eventFeedback.length === 0) {
        // Return default stats for events with no feedback
        return {
          totalRegistrations: 0,
          totalAttendees: 0,
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
      }

      const totalReviews = eventFeedback.length;
      const totalRating = eventFeedback.reduce((sum, f) => sum + f.rating, 0);
      const averageRating = totalRating / totalReviews;

      // Calculate rating distribution
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      eventFeedback.forEach(f => {
        distribution[f.rating as keyof typeof distribution]++;
      });

      // Convert to percentages
      const ratingDistribution = {
        1: Math.round((distribution[1] / totalReviews) * 100),
        2: Math.round((distribution[2] / totalReviews) * 100),
        3: Math.round((distribution[3] / totalReviews) * 100),
        4: Math.round((distribution[4] / totalReviews) * 100),
        5: Math.round((distribution[5] / totalReviews) * 100),
      };

      return {
        totalRegistrations: 0, // Would come from registration data
        totalAttendees: 0, // Would come from attendance data
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalReviews,
        ratingDistribution,
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
   * Get all feedback for an event
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
   * Get user's event status for a specific event
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
   * Mark user as attended for an event (simulate attendance)
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
        console.log('User marked as attended for event:', eventId);
        return true;
      }
      return false;
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

  // MARK: - Mock Data (Temporary)

  private getMockEvents(): Event[] {
    return [
      {
        id: '1',
        title: 'Technology Table Tennis',
        desc: 'Innovation meets friendly competition. Connect with fellow tech enthusiasts, enjoy some fast-paced fun, and take a well-deserved break while rallying around the spirit of technology and teamwork.',
        date: 'July 22, 2025',
        time: '12:00 PM - 1:00 PM',
        location: 'MITC, Jeddah',
        image: require('../assets/images/react-logo.png'),
        category: 'Activity',
        registeredCount: 47,
        featured: true,
        status: 'upcoming',
        type: 'MITC',
      },
      {
        id: '2',
        title: 'Future of Tech',
        desc: 'A look into the future of technology and innovation.',
        date: 'Nov 15, 2025',
        time: '10:00 AM - 12:00 PM',
        location: 'Online',
        image: require('../assets/images/partial-react-logo.png'),
        category: 'Seminar',
        registeredCount: 120,
        featured: false,
        status: 'upcoming',
        type: 'Online',
      },
      {
        id: '3',
        title: 'Startup Strategies',
        desc: 'Learn how to launch and grow your startup.',
        date: 'Dec 5, 2025',
        time: '2:00 PM - 4:00 PM',
        location: 'MITC, Jeddah',
        image: require('../assets/images/icon.png'),
        category: 'Workshop',
        registeredCount: 80,
        featured: false,
        status: 'upcoming',
        type: 'MITC',
      },
      {
        id: '4',
        title: 'Design Thinking Workshop',
        desc: 'Hands-on workshop on design thinking methodologies.',
        date: '2024-02-10',
        time: '9:00 AM - 11:00 AM',
        location: 'MITC, Jeddah',
        image: require('../assets/images/splash-icon.png'),
        category: 'Workshop',
        registeredCount: 45,
        featured: false,
        status: 'completed',
        type: 'MITC',
      },
      {
        id: '5',
        title: 'AI in Business Conference',
        desc: 'Explore the future of AI in business applications.',
        date: '2024-01-20',
        time: '8:00 AM - 5:00 PM',
        location: 'Online',
        image: require('../assets/images/react-logo.png'),
        category: 'Conference',
        registeredCount: 200,
        featured: false,
        status: 'completed',
        type: 'Online',
      },
    ];
  }
}

// Export singleton instance
export const eventService = new EventService();
export default eventService; 