import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Share, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEventContext } from '../components/EventContext';
import { Ionicons, Feather } from '@expo/vector-icons';
import EventsTabBar from '../components/EventsTabBar';
import eventService from '../services/EventService';
import { Event } from '../types/events';

export default function EventDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { registerEvent, registered, bookmarks, bookmarkEvent, unbookmarkEvent, getUserEventStatus, fetchUserEvents } = useEventContext();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch event data from database
  useEffect(() => {
    const fetchEventData = async () => {
      if (!id) {
        setError('No event ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // First check if event exists
        const eventExists = await eventService.eventExists(id as string);
        if (!eventExists) {
          setError('This event is no longer available');
          setLoading(false);
          return;
        }
        
        const eventData = await eventService.getEventById(id as string);
        
        if (eventData) {
          setEvent(eventData);
          setError(null);
        } else {
          setError('This event is no longer available');
        }
      } catch (err) {
        console.error('Error fetching event:', err);
        setError('This event is no longer available');
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [id]);

  // Show loading state
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#43C6AC" />
        <Text style={styles.loadingText}>Loading event details...</Text>
      </View>
    );
  }

  // Show error state
  if (error || !event) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={64} color="#ff6b6b" />
        <Text style={styles.errorText}>{error || 'Event not found'}</Text>
        <Text style={styles.errorText}>Event ID: {id}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isBookmarked = bookmarks.includes(event.id);
  const isRegistered = registered.includes(event.id);

  // Check if event is in the past (more lenient comparison)
  const isEventInPast = () => {
    try {
      const today = new Date();
      const eventDate = new Date(event.date);
      
      // Allow registration for events happening today or in the future
      // Only mark as past if the event date is before today
      today.setHours(0, 0, 0, 0);
      eventDate.setHours(0, 0, 0, 0);
      
      return eventDate < today;
    } catch (error) {
      console.error('Error parsing event date:', error);
      // If there's an error parsing the date, allow registration
      return false;
    }
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Get button state
  const getButtonState = () => {
    if (isRegistered) return { text: 'Registered', disabled: true };
    if (isEventInPast()) return { text: 'Event Passed', disabled: true };
    return { text: 'Register', disabled: false };
  };

  const buttonState = getButtonState();

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${event.title}\n${event.description}\n${formatDate(event.date)} ${event.time} @ ${event.location}`,
      });
    } catch (error) {}
  };

  const handleRegister = () => {
    console.log('Event Details: Register button pressed for event:', event.id);
    console.log('Current registered events:', registered);
    
    if (isEventInPast()) {
      console.log('Event has passed, showing alert');
      Alert.alert('Event Passed', 'You cannot register for events that have already passed.');
      return;
    }
    
    if (isRegistered) {
      console.log('Already registered, showing alert');
      Alert.alert('You\'re already registered');
      return;
    }
    
    console.log('Registering event...');
    registerEvent(event.id);
    console.log('After registration, navigating to success screen');
    router.push('registration-success' as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header with back and share */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.replace('/events')} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Details</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
          <Feather name="share-2" size={22} color="#222" />
        </TouchableOpacity>
      </View>
      {/* Event Image and Bookmark */}
      <View style={styles.imageContainer}>
        <Image 
          source={event.coverImage ? { uri: event.coverImage } : event.image} 
          style={styles.eventImage} 
        />
        <TouchableOpacity
          style={styles.bookmarkBtn}
          onPress={() => isBookmarked ? unbookmarkEvent(event.id) : bookmarkEvent(event.id)}
        >
          <Ionicons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={isBookmarked ? '#43C6AC' : '#888'}
          />
        </TouchableOpacity>
      </View>
      {/* Event Info */}
      <View style={{ paddingHorizontal: 20 }}>
        <Text style={styles.eventCategory}>{event.category}</Text>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.eventDesc}>{event.description}</Text>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={20} color="#43C6AC" style={styles.infoIcon} />
          <Text style={styles.infoText}>{formatDate(event.date)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={20} color="#43C6AC" style={styles.infoIcon} />
          <Text style={styles.infoText}>{event.time}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={20} color="#43C6AC" style={styles.infoIcon} />
          <Text style={styles.infoText}>{event.location}</Text>
        </View>
        
        {/* New Event Details */}
        {event.organizer && (
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color="#43C6AC" style={styles.infoIcon} />
            <Text style={styles.infoText}>Organizer: {event.organizer}</Text>
          </View>
        )}
        
        <View style={styles.infoRow}>
          <Ionicons name="flag-outline" size={20} color="#43C6AC" style={styles.infoIcon} />
          <Text style={styles.infoText}>Status: {event.status}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="globe-outline" size={20} color="#43C6AC" style={styles.infoIcon} />
          <Text style={styles.infoText}>Type: {event.type}</Text>
        </View>
        

        
        {event.maxCapacity && (
          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={20} color="#43C6AC" style={styles.infoIcon} />
            <Text style={styles.infoText}>Capacity: {event.maxCapacity} people</Text>
          </View>
        )}
        
        {event.featured && (
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.featuredText}>Featured Event</Text>
          </View>
        )}
        
        {event.tags && event.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            <Text style={styles.tagsTitle}>Tags:</Text>
            <View style={styles.tagsList}>
              {event.tags.map((tag, index) => (
                <View key={index} style={styles.tagItem}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {event.requirements && event.requirements.length > 0 && (
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>Requirements:</Text>
            {event.requirements.map((req, index) => (
              <View key={index} style={styles.requirementItem}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#43C6AC" />
                <Text style={styles.requirementText}>{req}</Text>
              </View>
            ))}
          </View>
        )}
        
        {event.materials && event.materials.length > 0 && (
          <View style={styles.materialsContainer}>
            <Text style={styles.materialsTitle}>Materials:</Text>
            {event.materials.map((material, index) => (
              <View key={index} style={styles.materialItem}>
                <Ionicons name="document-outline" size={16} color="#43C6AC" />
                <Text style={styles.materialText}>{material}</Text>
              </View>
            ))}
          </View>
        )}
        
        <TouchableOpacity
          style={[styles.registerBtn, buttonState.disabled && styles.registerBtnDisabled]}
          onPress={handleRegister}
          disabled={buttonState.disabled}
          activeOpacity={0.7}
        >
          <Text style={[styles.registerBtnText, buttonState.disabled && styles.registerBtnTextDisabled]}>
            {buttonState.text}
          </Text>
        </TouchableOpacity>
        
        {/* Temporary refresh button for debugging */}
        <TouchableOpacity
          style={[styles.registerBtn, { marginTop: 8, backgroundColor: '#666' }]}
          onPress={async () => {
            console.log('Refreshing user events...');
            // Force refresh user events by calling the context function
            await fetchUserEvents();
            Alert.alert('Refresh', 'User events refreshed. Check console for details.');
          }}
        >
          <Text style={styles.registerBtnText}>Refresh Status</Text>
        </TouchableOpacity>
      </View>
      <EventsTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 32,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  iconBtn: {
    padding: 8,
  },
  imageContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    position: 'relative',
  },
  eventImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
    marginBottom: 8,
  },
  bookmarkBtn: {
    position: 'absolute',
    top: 10,
    right: 30,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
    elevation: 2,
  },
  eventCategory: {
    backgroundColor: '#e0f7f4',
    color: '#222',
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 8,
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#222',
  },
  eventDesc: {
    fontSize: 15,
    color: '#444',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 15,
    color: '#222',
  },
  registerBtn: {
    backgroundColor: '#43C6AC',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 18,
  },
  registerBtnDisabled: {
    backgroundColor: '#ccc',
  },
  registerBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerBtnTextDisabled: {
    color: '#888',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8DC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 8,
  },
  featuredText: {
    color: '#DAA520',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  tagsContainer: {
    marginTop: 16,
  },
  tagsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagItem: {
    backgroundColor: '#e0f7f4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    color: '#222',
    fontSize: 12,
    fontWeight: '500',
  },
  requirementsContainer: {
    marginTop: 16,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 14,
    color: '#444',
    marginLeft: 8,
  },
  materialsContainer: {
    marginTop: 16,
  },
  materialsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  materialText: {
    fontSize: 14,
    color: '#444',
    marginLeft: 8,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#ff6b6b',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  retryBtn: {
    backgroundColor: '#43C6AC',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 