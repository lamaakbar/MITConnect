import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Event, EventContextType, UserEvent, EventFeedback, EventStats, UserEventTracking } from '../types/events';
import eventService from '../services/EventService';

// No longer needed - using authenticated user from Supabase

// Legacy interface for backward compatibility
interface LegacyEventContextType {
  events: Event[];
  bookmarks: string[];
  registered: string[];
  bookmarkEvent: (id: string) => Promise<boolean>;
  unbookmarkEvent: (id: string) => Promise<boolean>;
  registerEvent: (id: string) => Promise<boolean>;
  unregisterEvent: (id: string) => Promise<boolean>;
  submitFeedback: (feedback: Omit<EventFeedback, 'id' | 'submittedAt' | 'userId'>) => Promise<boolean>;
  getEventStats: (eventId: string) => Promise<EventStats | null>;
  getEventFeedback: (eventId: string) => Promise<EventFeedback[]>;
  getUserEventStatus: (eventId: string) => Promise<UserEventTracking | null>;
  markUserAsAttended: (eventId: string) => Promise<boolean>;
  fetchUserEvents: () => Promise<void>;
  handleEventDeletion: (deletedEventId: string) => Promise<void>;
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
    fetchUserEvents();
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

  const fetchUserEvents = async (): Promise<void> => {
    setLoading(true);
    try {
      const userRegisteredEvents = await eventService.getUserRegisteredEvents();
      const userBookmarkedEvents = await eventService.getUserBookmarkedEvents();
      
      console.log('Fetched user registered events:', userRegisteredEvents.length);
      console.log('Fetched user bookmarked events:', userBookmarkedEvents.length);
      
      // Filter out any events that might have been deleted
      const validRegisteredEvents = userRegisteredEvents.filter(event => event.id);
      const validBookmarkedEvents = userBookmarkedEvents.filter(event => event.id);
      
      // Combine and process user events
      const combinedUserEvents: UserEvent[] = validRegisteredEvents.map(event => ({
        ...event,
        userStatus: 'registered' as const,
      }));
      
      setUserEvents(combinedUserEvents);
      
      // Update local state for backward compatibility
      setRegistered(validRegisteredEvents.map(e => e.id));
      setBookmarks(validBookmarkedEvents.map(e => e.id));
      
      console.log('Updated registered events:', validRegisteredEvents.map(e => e.id));
      console.log('Updated bookmarked events:', validBookmarkedEvents.map(e => e.id));
      
      setError(null);
    } catch (err) {
      setError('Failed to fetch user events');
      console.error('Error fetching user events:', err);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle event deletion cleanup
  const handleEventDeletion = async (deletedEventId: string): Promise<void> => {
    try {
      console.log('Handling deletion of event:', deletedEventId);
      
      // Remove from local state immediately
      setRegistered(prev => prev.filter(id => id !== deletedEventId));
      setBookmarks(prev => prev.filter(id => id !== deletedEventId));
      setEvents(prev => prev.filter(event => event.id !== deletedEventId));
      setUserEvents(prev => prev.filter(event => event.id !== deletedEventId));
      
      // Refresh all data to ensure consistency
      await fetchEvents();
      await fetchUserEvents();
      
      console.log('Successfully cleaned up deleted event from all user states');
    } catch (err) {
      console.error('Error handling event deletion cleanup:', err);
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
  const registerEvent = async (eventId: string): Promise<boolean> => {
    try {
      console.log('Registering for event:', eventId);
      
      const success = await eventService.registerForEvent(eventId);
      
      console.log('Registration result:', success);
      
      if (success) {
        setRegistered(prev => {
          const newState = prev.includes(eventId) ? prev : [...prev, eventId];
          console.log('Updated registered state:', newState);
          return newState;
        });
        // Refresh user events
        await fetchUserEvents();
      }
      
      return success;
    } catch (err) {
      setError('Failed to register for event');
      console.error('Error registering for event:', err);
      return false;
    }
  };

  const unregisterEvent = async (eventId: string): Promise<boolean> => {
    try {
      const success = await eventService.unregisterFromEvent(eventId);
      
      if (success) {
        setRegistered(prev => prev.filter(id => id !== eventId));
        // Refresh user events
        await fetchUserEvents();
      }
      
      return success;
    } catch (err) {
      setError('Failed to unregister from event');
      console.error('Error unregistering from event:', err);
      return false;
    }
  };

  const bookmarkEvent = async (eventId: string): Promise<boolean> => {
    try {
      const success = await eventService.toggleEventBookmark(eventId, true);
      
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

  const unbookmarkEvent = async (eventId: string): Promise<boolean> => {
    try {
      const success = await eventService.toggleEventBookmark(eventId, false);
      
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

  const submitFeedback = async (feedback: Omit<EventFeedback, 'id' | 'submittedAt' | 'userId'>): Promise<boolean> => {
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

  const getUserEventStatus = async (eventId: string): Promise<UserEventTracking | null> => {
    try {
      return await eventService.getUserEventStatus(eventId);
    } catch (err) {
      setError('Failed to fetch user event status');
      console.error('Error fetching user event status:', err);
      return null;
    }
  };

  const markUserAsAttended = async (eventId: string): Promise<boolean> => {
    try {
      return await eventService.markUserAsAttended(eventId);
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
    return await bookmarkEvent(id);
  };

  const unbookmarkEventLegacy = async (id: string) => {
    return await unbookmarkEvent(id);
  };

  const registerEventLegacy = async (id: string) => {
    return await registerEvent(id);
  };

  const unregisterEventLegacy = async (id: string) => {
    return await unregisterEvent(id);
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
        fetchUserEvents,
        handleEventDeletion,
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