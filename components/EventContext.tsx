import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Event, EventContextType, UserEvent, EventFeedback, EventStats, UserEventTracking } from '../types/events';
import eventService from '../services/EventService';

// Mock user ID (will be replaced with actual auth)
const MOCK_USER_ID = 'user-123';

// Legacy interface for backward compatibility
interface LegacyEventContextType {
  events: Event[];
  bookmarks: string[];
  registered: string[];
  bookmarkEvent: (id: string) => Promise<boolean>;
  unbookmarkEvent: (id: string) => Promise<boolean>;
  registerEvent: (id: string) => Promise<boolean>;
  unregisterEvent: (id: string) => Promise<boolean>;
  submitFeedback: (feedback: Omit<EventFeedback, 'id' | 'submittedAt'>) => Promise<boolean>;
  getEventStats: (eventId: string) => Promise<EventStats | null>;
  getEventFeedback: (eventId: string) => Promise<EventFeedback[]>;
  getUserEventStatus: (eventId: string, userId: string) => Promise<UserEventTracking | null>;
  markUserAsAttended: (eventId: string, userId: string) => Promise<boolean>;
}

const EventContext = createContext<LegacyEventContextType | undefined>(undefined);

export const EventProvider = ({ children }: { children: ReactNode }) => {
  // State
  const [events, setEvents] = useState<Event[]>([]);
  const [userEvents, setUserEvents] = useState<UserEvent[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [registered, setRegistered] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize data on mount
  useEffect(() => {
    fetchEvents();
    fetchUserEvents(MOCK_USER_ID);
  }, []);

  // Event operations
  const fetchEvents = async (): Promise<void> => {
    setLoading(true);
    try {
      const fetchedEvents = await eventService.getAllEvents();
      setEvents(fetchedEvents);
      setError(null);
    } catch (err) {
      setError('Failed to fetch events');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserEvents = async (userId: string): Promise<void> => {
    setLoading(true);
    try {
      const userRegisteredEvents = await eventService.getUserRegisteredEvents(userId);
      const userBookmarkedEvents = await eventService.getUserBookmarkedEvents(userId);
      
      console.log('Fetched user registered events:', userRegisteredEvents.length);
      console.log('Fetched user bookmarked events:', userBookmarkedEvents.length);
      
      // Combine and process user events
      const combinedUserEvents: UserEvent[] = userRegisteredEvents.map(event => ({
        ...event,
        userStatus: 'registered' as const,
      }));
      
      setUserEvents(combinedUserEvents);
      
      // Update local state for backward compatibility
      setRegistered(userRegisteredEvents.map(e => e.id));
      setBookmarks(userBookmarkedEvents.map(e => e.id));
      
      console.log('Updated registered events:', userRegisteredEvents.map(e => e.id));
      
      setError(null);
    } catch (err) {
      setError('Failed to fetch user events');
      console.error('Error fetching user events:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventById = async (id: string): Promise<Event | null> => {
    try {
      return await eventService.getEventById(id);
    } catch (err) {
      setError('Failed to fetch event details');
      console.error('Error fetching event:', err);
      return null;
    }
  };

  // User operations
  const registerEvent = async (eventId: string, userId: string): Promise<boolean> => {
    try {
      console.log('Registering for event:', eventId, 'User:', userId);
      
      const success = await eventService.registerForEvent({
        eventId,
        userId,
        registrationDate: new Date(),
      });
      
      console.log('Registration result:', success);
      
      if (success) {
        setRegistered(prev => {
          const newState = prev.includes(eventId) ? prev : [...prev, eventId];
          console.log('Updated registered state:', newState);
          return newState;
        });
        // Refresh user events
        await fetchUserEvents(userId);
      }
      
      return success;
    } catch (err) {
      setError('Failed to register for event');
      console.error('Error registering for event:', err);
      return false;
    }
  };

  const unregisterEvent = async (eventId: string, userId: string): Promise<boolean> => {
    try {
      const success = await eventService.unregisterFromEvent(eventId, userId);
      
      if (success) {
        setRegistered(prev => prev.filter(id => id !== eventId));
        // Refresh user events
        await fetchUserEvents(userId);
      }
      
      return success;
    } catch (err) {
      setError('Failed to unregister from event');
      console.error('Error unregistering from event:', err);
      return false;
    }
  };

  const bookmarkEvent = async (eventId: string, userId: string): Promise<boolean> => {
    try {
      const success = await eventService.toggleEventBookmark(eventId, userId, true);
      
      if (success) {
        setBookmarks(prev => prev.includes(eventId) ? prev : [...prev, eventId]);
      }
      
      return success;
    } catch (err) {
      setError('Failed to bookmark event');
      console.error('Error bookmarking event:', err);
      return false;
    }
  };

  const unbookmarkEvent = async (eventId: string, userId: string): Promise<boolean> => {
    try {
      const success = await eventService.toggleEventBookmark(eventId, userId, false);
      
      if (success) {
        setBookmarks(prev => prev.filter(id => id !== eventId));
      }
      
      return success;
    } catch (err) {
      setError('Failed to remove bookmark');
      console.error('Error removing bookmark:', err);
      return false;
    }
  };

  const submitFeedback = async (feedback: Omit<EventFeedback, 'id' | 'submittedAt'>): Promise<boolean> => {
    try {
      return await eventService.submitEventFeedback({
        ...feedback,
        submittedAt: new Date(),
      });
    } catch (err) {
      setError('Failed to submit feedback');
      console.error('Error submitting feedback:', err);
      return false;
    }
  };

  const getEventStats = async (eventId: string): Promise<EventStats | null> => {
    try {
      return await eventService.getEventStats(eventId);
    } catch (err) {
      setError('Failed to fetch event stats');
      console.error('Error fetching event stats:', err);
      return null;
    }
  };

  const getEventFeedback = async (eventId: string): Promise<EventFeedback[]> => {
    try {
      return await eventService.getEventFeedback(eventId);
    } catch (err) {
      setError('Failed to fetch event feedback');
      console.error('Error fetching event feedback:', err);
      return [];
    }
  };

  const getUserEventStatus = async (eventId: string, userId: string): Promise<UserEventTracking | null> => {
    try {
      return await eventService.getUserEventStatus(eventId, userId);
    } catch (err) {
      setError('Failed to fetch user event status');
      console.error('Error fetching user event status:', err);
      return null;
    }
  };

  const markUserAsAttended = async (eventId: string, userId: string): Promise<boolean> => {
    try {
      return await eventService.markUserAsAttended(eventId, userId);
    } catch (err) {
      setError('Failed to mark user as attended');
      console.error('Error marking user as attended:', err);
      return false;
    }
  };

  // Local state management
  const setLoadingState = (loadingState: boolean) => setLoading(loadingState);
  const setErrorState = (errorState: string | null) => setError(errorState);
  const clearErrorState = () => setError(null);

  // Backward compatibility methods (for existing components)
  const bookmarkEventLegacy = async (id: string) => {
    return await bookmarkEvent(id, MOCK_USER_ID);
  };

  const unbookmarkEventLegacy = async (id: string) => {
    return await unbookmarkEvent(id, MOCK_USER_ID);
  };

  const registerEventLegacy = async (id: string) => {
    return await registerEvent(id, MOCK_USER_ID);
  };

  const unregisterEventLegacy = async (id: string) => {
    return await unregisterEvent(id, MOCK_USER_ID);
  };

  return (
    <EventContext.Provider
      value={{
        events,
        bookmarks,
        registered,
        bookmarkEvent: bookmarkEventLegacy,
        unbookmarkEvent: unbookmarkEventLegacy,
        registerEvent: registerEventLegacy,
        unregisterEvent: unregisterEventLegacy,
        submitFeedback,
        getEventStats,
        getEventFeedback,
        getUserEventStatus,
        markUserAsAttended,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export const useEventContext = () => {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error('useEventContext must be used within EventProvider');
  return ctx;
}; 