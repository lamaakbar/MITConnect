import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    View,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import AdminHeader from '../../../components/AdminHeader';
import eventService from '../../../services/EventService';
import { Event } from '../../../types/events';
import { useTheme } from '../../../components/ThemeContext';
import { Colors } from '../../../constants/Colors';

const EventDetailsScreen: React.FC = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isDarkMode } = useTheme();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Theme-aware colors
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const textColor = colors.text;
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#666';
  const borderColor = isDarkMode ? '#2A2A2A' : '#D6E3D7';
  const iconBackground = isDarkMode ? '#2A2A2A' : '#F3F5F2';
  const statsBackground = isDarkMode ? '#2A2A2A' : '#f8f9fa';

  // Debug theme state
  console.log('🎨 Admin Event Details - Theme Debug:', {
    isDarkMode,
    cardBackground,
    textColor,
    secondaryTextColor
  });

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
          setError('This event has been deleted');
          setLoading(false);
          return;
        }
        
        const eventData = await eventService.getEventById(id as string);
        
        if (eventData) {
          setEvent(eventData);
          
          // Fetch attendees for this event
          const eventAttendees = await eventService.getEventAttendees(id as string);
          setAttendees(eventAttendees);
          
          setError(null);
        } else {
          setError('This event has been deleted');
        }
      } catch (err) {
        console.error('Error fetching event:', err);
        setError('This event has been deleted');
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [id]);

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: cardBackground }]}>
        <AdminHeader title="" backDestination="/admin-events" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#43C6AC" />
          <Text style={[styles.loadingText, { color: secondaryTextColor }]}>Loading event details...</Text>
        </View>
      </View>
    );
  }

  // Show error state
  if (error || !event) {
    return (
      <View style={[styles.container, { backgroundColor: cardBackground }]}>
        <AdminHeader title="" backDestination="/admin-events" />
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={64} color="#ff6b6b" />
          <Text style={[styles.errorText, { color: '#ff6b6b' }]}>{error || 'Event not found'}</Text>
          <Text style={[styles.errorText, { color: '#ff6b6b' }]}>Event ID: {id}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.push('/admin-events')}>
            <Text style={styles.retryBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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

  return (
    <View style={[styles.container, { backgroundColor: cardBackground }]}>
      <AdminHeader title="" backDestination="/admin-events" />
      
      {/* Event Details Title */}
      <View style={styles.titleContainer}>
        <Text style={[styles.pageTitle, { color: textColor }]}>Event Details</Text>
      </View>
      
      <ScrollView style={[styles.scroll, { backgroundColor: cardBackground }]} contentContainerStyle={styles.scrollContent}>
        <Image 
          source={event.coverImage ? { uri: event.coverImage } : event.image} 
          style={styles.coverImage} 
        />
        {/* REMOVED BOOKMARK ICON */}
        <Text style={[styles.title, { color: textColor }]}>{event.title}</Text>
        
        {/* Event Description */}
        {event.description && (
          <Text style={[styles.description, { color: secondaryTextColor }]}>{event.description}</Text>
        )}
        
        {/* Date, Time, Location */}
        <View style={styles.infoRow}>
          <View style={[styles.infoIconBox, { backgroundColor: iconBackground }]}><MaterialIcons name="calendar-today" size={20} color="#43C6AC" /></View>
          <Text style={[styles.infoText, { color: textColor }]}>{formatDate(event.date)}</Text>
        </View>
        <View style={styles.infoRow}>
          <View style={[styles.infoIconBox, { backgroundColor: iconBackground }]}><Ionicons name="time-outline" size={20} color="#43C6AC" /></View>
          <Text style={[styles.infoText, { color: textColor }]}>{event.time}</Text>
        </View>
        <View style={styles.infoRow}>
          <View style={[styles.infoIconBox, { backgroundColor: iconBackground }]}><Ionicons name="location-outline" size={20} color="#43C6AC" /></View>
          <Text style={[styles.infoText, { color: textColor }]}>{event.location}</Text>
        </View>
        
        {/* Additional Event Details */}
        {event.category && (
          <View style={styles.infoRow}>
            <View style={[styles.infoIconBox, { backgroundColor: iconBackground }]}><Ionicons name="pricetag-outline" size={20} color="#43C6AC" /></View>
            <Text style={[styles.infoText, { color: textColor }]}>Category: {event.category}</Text>
          </View>
        )}
        
        {event.organizer && (
          <View style={styles.infoRow}>
            <View style={[styles.infoIconBox, { backgroundColor: iconBackground }]}><Ionicons name="person-outline" size={20} color="#43C6AC" /></View>
            <Text style={[styles.infoText, { color: textColor }]}>Organizer: {event.organizer}</Text>
          </View>
        )}
        
        {event.maxCapacity && (
          <View style={styles.infoRow}>
            <View style={[styles.infoIconBox, { backgroundColor: iconBackground }]}><Ionicons name="people-outline" size={20} color="#43C6AC" /></View>
            <Text style={[styles.infoText, { color: textColor }]}>Capacity: {event.maxCapacity} people</Text>
          </View>
        )}
        
        <View style={styles.infoRow}>
          <View style={[styles.infoIconBox, { backgroundColor: iconBackground }]}><Ionicons name="flag-outline" size={20} color="#43C6AC" /></View>
          <Text style={[styles.infoText, { color: textColor }]}>Status: {event.status}</Text>
        </View>
        
        {/* REMOVED TYPE FIELD */}
        {/* <View style={styles.infoRow}>
          <View style={styles.infoIconBox}><Ionicons name="globe-outline" size={20} color="#222" /></View>
          <Text style={styles.infoText}>Type: {event.type}</Text>
        </View> */}
        
        {/* REMOVED ATTENDEES SECTION */}
        {/* <Text style={styles.attendeeTitle}>Event Attendees ({attendees.length})</Text>
        {attendees.length > 0 ? (
          <FlatList
            data={attendees}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.attendeeRow}>
                <View style={styles.attendeeInfo}>
                  <Text style={styles.attendeeName}>{item.name}</Text>
                  <Text style={styles.attendeeEmail}>{item.email}</Text>
                  <Text style={styles.attendeeDate}>
                    Registered: {new Date(item.registration_date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.attendeeStatus}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>
            )}
            scrollEnabled={false}
            style={{ marginBottom: 24 }}
          />
        ) : (
          <View style={styles.emptyAttendees}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text style={styles.emptyAttendeesText}>No attendees registered yet</Text>
          </View>
        )} */}
        
        {/* Registration Statistics */}
        <View style={[styles.statsContainer, { backgroundColor: statsBackground }]}>
          <Text style={[styles.statsTitle, { color: textColor }]}>Registration Statistics</Text>
          <View style={styles.statsRow}>
                         <View style={styles.statItem}>
               <Text style={[styles.statNumber, { color: '#43C6AC' }]}>{attendees.length}</Text>
               <Text style={[styles.statLabel, { color: secondaryTextColor }]}>Registered</Text>
             </View>
                         {event.maxCapacity && (
               <View style={styles.statItem}>
                 <Text style={[styles.statNumber, { color: '#43C6AC' }]}>{event.maxCapacity - attendees.length}</Text>
                 <Text style={[styles.statLabel, { color: secondaryTextColor }]}>Available</Text>
               </View>
             )}
                         {event.maxCapacity && (
               <View style={styles.statItem}>
                 <Text style={[styles.statNumber, { color: '#43C6AC' }]}>{Math.round((attendees.length / event.maxCapacity) * 100)}%</Text>
                 <Text style={[styles.statLabel, { color: secondaryTextColor }]}>Filled</Text>
               </View>
             )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 0,
    alignItems: 'stretch',
  },
  container: {
    flex: 1,
  },
  coverImage: {
    width: '100%',
    height: 180,
    resizeMode: 'contain',
    marginBottom: 8,
    marginTop: 8,
  },
  bookmarkIconBox: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  infoIconBox: {
    borderRadius: 8,
    padding: 6,
    marginRight: 10,
  },
  infoText: {
    fontSize: 15,
  },
  attendeeTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  attendeeRow: {
    borderTopWidth: 1,
    borderTopColor: '#D6E3D7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  attendeeEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  attendeeDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  attendeeStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
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
  description: {
    fontSize: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    lineHeight: 24,
  },
  emptyAttendees: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    marginHorizontal: 16,
  },
  emptyAttendeesText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  statsContainer: {
    marginTop: 24,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  titleContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default EventDetailsScreen; 