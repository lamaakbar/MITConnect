import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Share, Alert, ActivityIndicator, ScrollView, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEventContext } from '../components/EventContext';
import { useUserContext } from '../components/UserContext';
import { useTheme } from '../components/ThemeContext';
import { Colors } from '../constants/Colors';
import { Ionicons, Feather } from '@expo/vector-icons';
import eventService from '../services/EventService';
import { Event } from '../types/events';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EventDetailsScreen() {
  const router = useRouter();
  const { id, from } = useLocalSearchParams();
  const { registerEvent, registered, bookmarks, bookmarkEvent, unbookmarkEvent, getUserEventStatus, fetchUserEvents } = useEventContext();
  const { userRole, viewAs, setViewAs } = useUserContext();
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug viewAs state
  console.log('EventDetails: viewAs state:', viewAs);
  console.log('EventDetails: userRole:', userRole);
  console.log('EventDetails: from parameter:', from);

  // Theme-aware colors
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const textColor = colors.text;
  const secondaryTextColor = isDarkMode ? '#B0B0B0' : '#666666';
  const borderColor = isDarkMode ? '#333333' : '#E5E5E5';

  // Handle back navigation based on 'from' parameter
  const handleBackNavigation = () => {
    if (viewAs) {
      // If in preview mode, return to admin home
      setViewAs(null);
      router.replace('/admin-home');
    } else if (from === 'home') {
      // If came from home page, go back to home
      router.back();
    } else if (from === 'trainee-home') {
      // If came from trainee home, go back to trainee home
      router.replace('/trainee-home');
    } else if (from === 'employee-home') {
      // If came from employee home, go back to employee home
      router.replace('/employee-home');
    } else if (from === 'admin-home') {
      // If came from admin home, go back to admin home
      router.replace('/admin-home');
    } else if (from === 'my-events') {
      // If came from my events, go back to my events
      router.replace('/my-events');
    } else if (from === 'events') {
      // If came from events page, go back to events page
      router.replace('/events');
    } else {
      // Default fallback to events page
      router.replace('/events');
    }
  };

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
        
        // Update event status first
        await eventService.updateEventStatus(id as string);
        
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
      <View style={[styles.center, { backgroundColor: cardBackground }]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <ActivityIndicator size="large" color="#43C6AC" />
        <Text style={[styles.loadingText, { color: secondaryTextColor }]}>Loading event details...</Text>
      </View>
    );
  }

  // Show error state
  if (error || !event) {
    return (
      <View style={[styles.center, { backgroundColor: cardBackground }]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <Ionicons name="alert-circle-outline" size={64} color="#F44336" />
        <Text style={[styles.errorText, { color: textColor }]}>{error || 'Event not found'}</Text>
        <TouchableOpacity 
          style={styles.retryBtn} 
          onPress={() => router.push('/events')}
        >
          <Text style={styles.retryBtnText}>Go Back to Events</Text>
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
    if (isRegistered) return { text: 'Registered', disabled: true, color: '#4CAF50' };
    if (isEventInPast()) return { text: 'Event Passed', disabled: true, color: '#FF9800' };
    return { text: 'Register Now', disabled: false, color: '#43C6AC' };
  };

  const buttonState = getButtonState();

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🎉 ${event.title}\n\n${event.description}\n\n📅 ${formatDate(event.date)} at ${event.time}\n📍 ${event.location}\n\nJoin us for this amazing event!`,
        title: event.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleRegister = () => {
    // Prevent registration in "View As" mode
    if (viewAs) {
      Alert.alert('Preview Mode', 'You are in preview mode. Please return to Admin view to register for events.');
      return;
    }
    
    if (isEventInPast()) {
      Alert.alert('Event Passed', 'You cannot register for events that have already passed.');
      return;
    }
    
    if (isRegistered) {
      Alert.alert('Already Registered', 'You\'re already registered for this event!');
      return;
    }
    
    registerEvent(event.id);
    router.push('registration-success' as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: cardBackground }}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={[styles.headerRow, { borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={handleBackNavigation} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          Event Details
          {viewAs && (
            <Text style={{ color: '#FF6B6B', fontSize: 12, fontWeight: 'normal' }}> (Preview Mode)</Text>
          )}
        </Text>
        <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
          <Feather name="share-2" size={22} color={textColor} />
        </TouchableOpacity>
      </View>
      
      {/* Content */}
      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Event Image and Bookmark */}
        <View style={styles.imageContainer}>
          <Image 
            source={event.coverImage ? { uri: event.coverImage } : event.image} 
            style={styles.eventImage} 
            resizeMode="cover"
          />
          {userRole !== 'admin' && (
            <TouchableOpacity
              style={[styles.bookmarkBtn, { backgroundColor: cardBackground }]}
              onPress={() => isBookmarked ? unbookmarkEvent(event.id) : bookmarkEvent(event.id)}
            >
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={24}
                color={isBookmarked ? '#43C6AC' : secondaryTextColor}
              />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Event Info */}
        <View style={styles.contentContainer}>
          {/* Category Badge */}
          <View style={[styles.categoryBadge, { backgroundColor: isDarkMode ? '#2A3A2A' : '#e0f7f4' }]}>
            <Text style={[styles.categoryText, { color: '#43C6AC' }]}>{event.category}</Text>
          </View>
          
          {/* Event Title */}
          <Text style={[styles.eventTitle, { color: textColor }]}>{event.title}</Text>
          
          {/* Event Description */}
          <Text style={[styles.eventDesc, { color: secondaryTextColor }]}>{event.description}</Text>
          
          {/* Event Details */}
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#43C6AC" style={styles.infoIcon} />
              <Text style={[styles.infoText, { color: textColor }]}>{formatDate(event.date)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color="#43C6AC" style={styles.infoIcon} />
              <Text style={[styles.infoText, { color: textColor }]}>{event.time}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#43C6AC" style={styles.infoIcon} />
              <Text style={[styles.infoText, { color: textColor }]}>{event.location}</Text>
            </View>
          </View>
          
          {/* Additional Event Details */}
          {event.organizer && (
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={18} color="#43C6AC" style={styles.infoIcon} />
              <Text style={[styles.infoText, { color: secondaryTextColor }]}>Organizer: </Text>
              <Text style={[styles.infoText, { color: textColor }]}>{event.organizer}</Text>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <Ionicons name="flag-outline" size={18} color="#43C6AC" style={styles.infoIcon} />
            <Text style={[styles.infoText, { color: secondaryTextColor }]}>Status: </Text>
            <View style={[
              styles.statusBadge, 
              { 
                backgroundColor: event.status === 'upcoming' 
                  ? (isDarkMode ? '#2A3A2A' : '#E8F5E8') 
                  : (isDarkMode ? '#3A2A2A' : '#F5E8E8')
              }
            ]}>
              <Text style={[
                styles.statusText, 
                { 
                  color: event.status === 'upcoming' 
                    ? (isDarkMode ? '#4CAF50' : '#2E7D32') 
                    : (isDarkMode ? '#F44336' : '#D32F2F')
                }
              ]}>
                {event.status === 'upcoming' ? 'Upcoming' : 'Completed'}
              </Text>
            </View>
          </View>
          
          {event.maxCapacity && (
            <View style={styles.infoRow}>
              <Ionicons name="people-outline" size={18} color="#43C6AC" style={styles.infoIcon} />
              <Text style={[styles.infoText, { color: secondaryTextColor }]}>Capacity: </Text>
              <Text style={[styles.infoText, { color: textColor }]}>{event.maxCapacity} people</Text>
            </View>
          )}
          
          {/* Featured Badge */}
          {event.featured && (
            <View style={[styles.featuredBadge, { backgroundColor: isDarkMode ? '#2A3A2A' : '#fff3cd' }]}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={[styles.featuredText, { color: '#FFD700' }]}>Featured Event</Text>
            </View>
          )}
          
          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              <Text style={[styles.tagsTitle, { color: textColor }]}>Tags</Text>
              <View style={styles.tagsList}>
                {event.tags.map((tag, index) => (
                  <View key={index} style={[styles.tagItem, { backgroundColor: isDarkMode ? '#2A2A2A' : '#f0f0f0' }]}>
                    <Text style={[styles.tagText, { color: textColor }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {/* Requirements */}
          {event.requirements && event.requirements.length > 0 && (
            <View style={styles.requirementsContainer}>
              <Text style={[styles.requirementsTitle, { color: textColor }]}>Requirements</Text>
              {event.requirements.map((req, index) => (
                <View key={index} style={styles.requirementItem}>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#4CAF50" />
                  <Text style={[styles.requirementText, { color: textColor }]}>{req}</Text>
                </View>
              ))}
            </View>
          )}
          
          {/* Materials */}
          {event.materials && event.materials.length > 0 && (
            <View style={styles.materialsContainer}>
              <Text style={[styles.materialsTitle, { color: textColor }]}>Materials</Text>
              {event.materials.map((material, index) => (
                <View key={index} style={styles.materialItem}>
                  <Ionicons name="document-outline" size={16} color="#43C6AC" />
                  <Text style={[styles.materialText, { color: textColor }]}>{material}</Text>
                </View>
              ))}
            </View>
          )}
          
          {/* Register Button */}
          <TouchableOpacity
            style={[
              styles.registerBtn, 
              { 
                backgroundColor: buttonState.color,
                shadowColor: buttonState.color,
                borderColor: 'rgba(67, 198, 172, 0.2)'
              },
              buttonState.disabled && styles.registerBtnDisabled
            ]}
            onPress={handleRegister}
            disabled={buttonState.disabled}
          >
            <Text style={styles.registerBtnText}>{buttonState.text}</Text>
          </TouchableOpacity>

          {/* Return to Admin Button - Only show in View As mode */}
          {viewAs && (
            <TouchableOpacity
              style={[
                styles.returnToAdminBtn,
                { 
                  backgroundColor: '#FF6B6B',
                  borderColor: '#FF6B6B'
                }
              ]}
                             onPress={() => {
                 // Reset viewAs and navigate back to admin
                 setViewAs(null);
                 router.replace('/admin-home');
               }}
            >
              <Ionicons name="arrow-back-circle" size={20} color="#fff" />
              <Text style={styles.returnToAdminBtnText}>
                Return to Admin View
              </Text>
            </TouchableOpacity>
          )}


        </View>
      </ScrollView>
      
      {/* EventsTabBar at the very bottom */}
      {/* Removed EventsTabBar import, so this section is removed */}
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
    paddingTop: 80,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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
    width: 320,
    height: 200,
    marginBottom: 8,
  },
  bookmarkBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 20,
    padding: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  eventDesc: {
    fontSize: 15,
    marginBottom: 16,
  },
  infoContainer: {
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
  },
  registerBtn: {
    backgroundColor: '#43C6AC',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#43C6AC',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(67, 198, 172, 0.2)',
  },
  registerBtnDisabled: {
    backgroundColor: '#E0E0E0',
    shadowColor: '#E0E0E0',
    shadowOpacity: 0.2,
    borderColor: 'rgba(224, 224, 224, 0.3)',
  },
  registerBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 8,
  },
  featuredText: {
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
    marginBottom: 8,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagItem: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  requirementsContainer: {
    marginTop: 16,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 14,
    marginLeft: 8,
  },
  materialsContainer: {
    marginTop: 16,
  },
  materialsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  materialText: {
    fontSize: 14,
    marginLeft: 8,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
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
  scrollContent: {
    paddingBottom: 10, // Reduced from 20 to move tab bar even higher for better UX
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  returnToAdminBtn: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  returnToAdminBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
}); 