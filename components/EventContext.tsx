import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Event, EventContextType, UserEvent, UserEventTracking } from '../types/events';
import eventService from '../services/EventService';
import { supabase } from '../services/supabase';

// No longer needed - using authenticated user from Supabase

// Legacy interface for backward compatibility
interface LegacyEventContextType {
  events: Event[];
  bookmarks: string[];
  registered: string[];
  bookmarkEvent: (id: string) => Promise<boolean>;
  unbookmarkEvent: (id: string) => Promise<boolean>;
  registerEvent: (id: string) => Promise<{ success: boolean; message: string; alreadyRegistered?: boolean }>;
  unregisterEvent: (id: string) => Promise<boolean>;

  getUserEventStatus: (eventId: string) => Promise<UserEventTracking | null>;
  markUserAsAttended: (eventId: string) => Promise<boolean>;
  fetchUserEvents: () => Promise<void>;
  handleEventDeletion: (deletedEventId: string) => Promise<void>;
  updateEventInContext: (updatedEvent: Event) => Promise<void>;
  addEventToContext: (newEvent: Event) => Promise<void>;
  removeEventFromContext: (eventId: string) => Promise<void>;
  searchEvents: (searchText: string) => Promise<Event[]>;
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
    
    // Update event statuses automatically
    updateEventStatuses();
    
    // Set up Supabase Realtime subscription
    const channel = subscribeToEventChanges();
    
    // Cleanup subscription on unmount
    return () => {
      console.log('🔌 Cleaning up Supabase Realtime subscription');
      channel.unsubscribe();
    };
  }, []);

  // Update event statuses based on current date/time
  const updateEventStatuses = async () => {
    try {
      console.log('🔄 Updating event statuses...');
      const updatedCount = await eventService.updateAllEventStatuses();
      if (updatedCount > 0) {
        console.log(`✅ Updated ${updatedCount} event statuses`);
        // Refresh events to show updated statuses
        await fetchEvents();
      }
    } catch (error) {
      console.error('Error updating event statuses:', error);
    }
  };

  // Supabase Realtime subscription for events table
  const subscribeToEventChanges = () => {
    console.log('📡 Setting up Supabase Realtime subscription for events table');
    
    const channel = supabase
      .channel('realtime-events')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'events' }, 
        (payload) => {
          console.log('📡 Realtime Event Change:', payload);
          
          if (payload.eventType === 'INSERT') {
            console.log('📡 Realtime: New event added');
            const newEvent = mapSupabaseEventToEvent(payload.new);
            addEventToContext(newEvent);
          } else if (payload.eventType === 'UPDATE') {
            console.log('♻️ Realtime: Event updated');
            const updatedEvent = mapSupabaseEventToEvent(payload.new);
            updateEventInContext(updatedEvent);
          } else if (payload.eventType === 'DELETE') {
            console.log('❌ Realtime: Event deleted');
            removeEventFromContext(payload.old.id);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Supabase Realtime subscription status:', status);
      });

    return channel;
  };

  // Helper function to map Supabase event to Event interface
  const mapSupabaseEventToEvent = (supabaseEvent: any): Event => {
    return {
      id: supabaseEvent.id,
      title: supabaseEvent.title,
      description: supabaseEvent.description,
      date: supabaseEvent.date,
      time: supabaseEvent.time,
      location: supabaseEvent.location,
      image: supabaseEvent.cover_image ? { uri: supabaseEvent.cover_image } : require('../assets/images/splash-icon.png'),
      coverImage: supabaseEvent.cover_image,
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
  };

  // Event operations
  const fetchEvents = async (): Promise<void> => {
    setLoading(true);
    try {
      console.log('🔄 EventContext: Fetching events...');
      const fetchedEvents = await eventService.getAllEvents();
      console.log('✅ EventContext: Fetched', fetchedEvents.length, 'events');
      
      // Debug each event's image data
      fetchedEvents.forEach((event, index) => {
        console.log(`📸 Event ${index + 1} image data:`, {
          title: event.title,
          coverImage: event.coverImage,
          image: event.image,
          hasCoverImage: !!event.coverImage,
          hasImage: !!event.image
        });
      });
      
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
      
      // Remove from events list
      setEvents(prev => prev.filter(event => event.id !== deletedEventId));
      
      // Remove from user events
      setUserEvents(prev => prev.filter(event => event.id !== deletedEventId));
      
      // Remove from registered and bookmarked lists
      setRegistered(prev => prev.filter(id => id !== deletedEventId));
      setBookmarks(prev => prev.filter(id => id !== deletedEventId));
      
      // Clear cache to ensure fresh data
      eventService.clearCache();
      
      console.log('✅ Successfully removed event from context:', deletedEventId);
    } catch (err) {
      console.error('❌ Error handling event deletion:', err);
    }
  };

  // Function to handle event updates in context
  const updateEventInContext = async (updatedEvent: Event): Promise<void> => {
    try {
      console.log('🔄 Updating event in context:', updatedEvent.id);
      console.log('🔄 Updated event data:', {
        id: updatedEvent.id,
        title: updatedEvent.title,
        date: updatedEvent.date,
        time: updatedEvent.time,
        location: updatedEvent.location
      });
      
      // Update the event in local state immediately
      setEvents(prev => {
        const updatedEvents = prev.map(event => 
          event.id === updatedEvent.id ? updatedEvent : event
        );
        console.log('🔄 Updated events array length:', updatedEvents.length);
        return updatedEvents;
      });
      
      // Update in userEvents if it exists there
      setUserEvents(prev => {
        const updatedUserEvents = prev.map(event => 
          event.id === updatedEvent.id ? { ...event, ...updatedEvent } : event
        );
        console.log('🔄 Updated userEvents array length:', updatedUserEvents.length);
        return updatedUserEvents;
      });
      
      // Clear cache and refresh to ensure consistency with database
      console.log('🔄 Clearing cache and refreshing data...');
      eventService.clearCache();
      await fetchEvents();
      await fetchUserEvents();
      
      console.log('✅ Successfully updated event in context:', updatedEvent.id);
    } catch (err) {
      console.error('❌ Error updating event in context:', err);
      // Fallback: refresh all data
      await fetchEvents();
      await fetchUserEvents();
    }
  };

  // Function to add new events to context
  const addEventToContext = async (newEvent: Event): Promise<void> => {
    try {
      console.log('➕ Adding new event to context:', newEvent.id);
      console.log('➕ New event data:', {
        id: newEvent.id,
        title: newEvent.title,
        date: newEvent.date,
        time: newEvent.time,
        location: newEvent.location
      });
      
      // Add the event to local state immediately
      setEvents(prev => {
        const updatedEvents = [...prev, newEvent];
        console.log('➕ Updated events array length:', updatedEvents.length);
        return updatedEvents;
      });
      
      // Clear cache and refresh to ensure consistency with database
      console.log('➕ Clearing cache and refreshing data...');
      eventService.clearCache();
      await fetchEvents();
      await fetchUserEvents();
      
      console.log('✅ Successfully added new event to context:', newEvent.id);
    } catch (err) {
      console.error('❌ Error adding new event to context:', err);
      // Fallback: refresh all data
      await fetchEvents();
      await fetchUserEvents();
    }
  };

  // Function to remove events from context
  const removeEventFromContext = async (eventId: string): Promise<void> => {
    try {
      console.log('🗑️ Removing event from context:', eventId);
      
      // Remove from events list
      setEvents(prev => {
        const updatedEvents = prev.filter(event => event.id !== eventId);
        console.log('🗑️ Updated events array length:', updatedEvents.length);
        return updatedEvents;
      });
      
      // Remove from user events
      setUserEvents(prev => {
        const updatedUserEvents = prev.filter(event => event.id !== eventId);
        console.log('🗑️ Updated userEvents array length:', updatedUserEvents.length);
        return updatedUserEvents;
      });
      
      // Remove from registered and bookmarked lists
      setRegistered(prev => prev.filter(id => id !== eventId));
      setBookmarks(prev => prev.filter(id => id !== eventId));
      
      // Clear cache to ensure fresh data
      eventService.clearCache();
      
      console.log('✅ Successfully removed event from context:', eventId);
    } catch (err) {
      console.error('❌ Error removing event from context:', err);
    }
  };

  const searchEvents = async (searchText: string): Promise<Event[]> => {
    try {
      console.log('🔍 Searching events with text:', searchText);
      const searchResults = await eventService.searchEvents(searchText);
      console.log('🔍 Search results:', searchResults.length, 'events found');
      return searchResults;
    } catch (error) {
      console.error('🔍 Error searching events:', error);
      return [];
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
  const registerEvent = async (eventId: string): Promise<{ success: boolean; message: string; alreadyRegistered?: boolean }> => {
    try {
      console.log('🟡 EventContext: Registering for event:', eventId);
      
      const result = await eventService.registerForEvent(eventId);
      
      console.log('🟡 EventContext: Registration result:', result);
      
      if (result.success) {
        console.log('🟡 EventContext: Registration successful, updating state');
        setRegistered(prev => {
          const newState = prev.includes(eventId) ? prev : [...prev, eventId];
          console.log('🟡 EventContext: Updated registered state:', newState);
          return newState;
        });
        // Refresh user events
        console.log('🟡 EventContext: Refreshing user events');
        await fetchUserEvents();
        
        console.log('🟡 EventContext: Returning success for registration');
        return result;
      }
      
      console.log('🟡 EventContext: Registration failed, returning result');
      return result;
    } catch (err) {
      console.error('🟡 EventContext: Error registering for event:', err);
      setError('Failed to register for event');
      return { success: false, message: 'Failed to register for event' };
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

        getUserEventStatus,
        markUserAsAttended,
        fetchUserEvents,
        handleEventDeletion,
        updateEventInContext,
        addEventToContext,
        removeEventFromContext,
        searchEvents,
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