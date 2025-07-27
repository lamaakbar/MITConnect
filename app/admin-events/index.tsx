import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Pressable,
  ActivityIndicator,
  Platform,
  Alert,
  KeyboardAvoidingView,
  Keyboard,
  ToastAndroid,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTheme } from '../../components/ThemeContext';
import { useEventContext } from '../../components/EventContext';
import AdminTabBar from '../../components/AdminTabBar';
import AdminHeader from '../../components/AdminHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DatePickerModal from '../../components/DatePickerModal';
import TimePickerModal from '../../components/TimePickerModal';

// Import event service
import eventService, { EventService } from '../../services/EventService';

const FILTERS = ['All', 'Upcoming', 'Past'];

// Helper function to get the correct image source for an event
const getEventImageSource = (event: any) => {
  // If coverImage is a string (URI from database), use it
  if (event.coverImage && typeof event.coverImage === 'string' && event.coverImage.trim() !== '') {
    return { uri: event.coverImage };
  }
  
  // If coverImage is an object with uri property
  if (event.coverImage && typeof event.coverImage === 'object' && event.coverImage.uri) {
    return { uri: event.coverImage.uri };
  }
  
  // If image is a require() object, use it
  if (event.image && typeof event.image === 'object') {
    return event.image;
  }
  
  // Default placeholder image
  return require('../../assets/images/splash-icon.png');
};

const AdminEventListScreen: React.FC = () => {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { handleEventDeletion, updateEventInContext, addEventToContext } = useEventContext();
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  const borderColor = isDarkMode ? '#2A2A2A' : '#E0E0E0';
  const searchBackground = isDarkMode ? '#2A2A2A' : '#F2F4F7';
  const modalBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const overlayBackground = isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.3)';
  
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [events, setEvents] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  // Add Event form state
  const [addImage, setAddImage] = useState<string | null>(null);
  const [addTitle, setAddTitle] = useState('');
  const [addType, setAddType] = useState('');
  const [addDate, setAddDate] = useState('');
  const [addTime, setAddTime] = useState('');
  const [addLocation, setAddLocation] = useState('');
  const [addDescription, setAddDescription] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  // Date and Time Picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());

  // Add Edit Event modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editImage, setEditImage] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [showEditTypeDropdown, setShowEditTypeDropdown] = useState(false);

  const [showAttendeesModal, setShowAttendeesModal] = useState(false);

  // Fetch events on component mount
  useEffect(() => {
    fetchEvents();
  }, []);

  // Search effect
  useEffect(() => {
    const performSearch = async () => {
      if (search.trim()) {
        setIsSearching(true);
        try {
          const results = await eventService.searchEvents(search);
          setSearchResults(results);
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    };

    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const fetchedEvents = await eventService.getAllEvents();
      setEvents(fetchedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };


  const [attendeesSearch, setAttendeesSearch] = useState('');
  // Add state for attendeeStatus
  const [attendeeStatus, setAttendeeStatus] = useState<'Confirmed' | 'Canceled'>('Confirmed');
  // Add state to track which event's attendees are being shown
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);

  // Helper function to check if event is in the past
  const isEventInPast = (eventDate: string, eventTime: string) => {
    try {
      const today = new Date();
      const eventDateTime = new Date(`${eventDate} ${eventTime}`);
      return eventDateTime < today;
    } catch (error) {
      console.error('Error parsing event date/time:', error);
      return false;
    }
  };

  // Use search results if searching, otherwise use all events
  const eventsToUse = search.trim() ? searchResults : events;
  
  // Categorize events into upcoming and past
  const upcomingEvents = eventsToUse.filter((e) => !isEventInPast(e.date, e.time));
  const pastEvents = eventsToUse.filter((e) => isEventInPast(e.date, e.time));
  
  // Filter events based on selected filter
  let filteredEvents: any[] = [];
  let featuredEvent: any = null;
  
  switch (selectedFilter) {
    case 'Upcoming':
      filteredEvents = upcomingEvents.filter((e) => !e.featured);
      featuredEvent = upcomingEvents.find((e) => e.featured);
      break;
    case 'Past':
      filteredEvents = pastEvents.filter((e) => !e.featured);
      featuredEvent = pastEvents.find((e) => e.featured);
      break;
    case 'All':
    default:
      filteredEvents = eventsToUse.filter((e) => !e.featured);
      featuredEvent = eventsToUse.find((e) => e.featured);
      break;
  }

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      setAddImage(result.assets[0].uri);
    }
  };

  // Date Picker Functions
  const openDatePicker = () => {
    setShowDatePicker(true);
  };

  const onDateConfirm = (date: Date) => {
    setSelectedDate(date);
    // Format date as YYYY-MM-DD for better compatibility with validation
    const formattedDate = date.toISOString().split('T')[0];
    
    // Update the appropriate date field based on which modal is open
    if (showEditModal) {
      setEditDate(formattedDate);
    } else {
      setAddDate(formattedDate);
    }
    setShowDatePicker(false);
  };

  const onDateCancel = () => {
    setShowDatePicker(false);
  };

  // Time Picker Functions
  const openTimePicker = () => {
    setShowTimePicker(true);
  };

  const onTimeConfirm = (time: Date) => {
    setSelectedTime(time);
    const formattedTime = time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    // Update the appropriate time field based on which modal is open
    if (showEditModal) {
      setEditTime(formattedTime);
    } else {
      setAddTime(formattedTime);
    }
    setShowTimePicker(false);
  };

  const onTimeCancel = () => {
    setShowTimePicker(false);
  };

  const handleAddEvent = async () => {
    setAddLoading(true);
    try {
      if (!addTitle || !addType || !addDate || !addTime || !addLocation || !addDescription) {
        alert('Please fill in all fields.');
        return;
      }

      // Validate date format
      const formattedDate = EventService.validateAndFormatDate(addDate);
      if (!formattedDate) {
        alert('Invalid date format. Please use a valid date.');
        return;
      }

      // Validate event type (now allows any text)
      if (!addType.trim()) {
        alert('Please enter an event type.');
        return;
      }

      // Validate time format
      if (!EventService.validateTimeFormat(addTime)) {
        alert('Invalid time format. Please use HH:MM or HH:MM AM/PM format (e.g., 14:30 or 2:30 PM).');
        return;
      }

      // Normalize time to 24-hour format
      const normalizedTime = EventService.normalizeTimeFormat(addTime);
      if (!normalizedTime) {
        alert('Could not process time format. Please check your input.');
        return;
      }

      const newEvent = await eventService.createEvent({
        title: addTitle,
        description: addDescription,
        date: formattedDate,
        time: normalizedTime,
        location: addLocation,
        image: addImage,
        category: addType as any,
        registeredCount: 0,
        featured: false,
        status: 'upcoming',
        type: 'MITC'
      });

      if (newEvent) {
        // Add the new event to the global context
        await addEventToContext(newEvent);
        
        // Also update local state for immediate UI update
        setEvents(prev => [...prev, newEvent]);
        setShowAddModal(false);
        
        // Reset form
        setAddImage(null);
        setAddTitle('');
        setAddType('');
        setAddDate('');
        setAddTime('');
        setAddLocation('');
        setAddDescription('');
      } else {
        alert('Failed to create event. Please check the console for details.');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. Please try again.');
    } finally {
      setAddLoading(false);
    }
  };

  // Open Edit Modal and populate fields
  const openEditModal = (idx: number) => {
    const e = filteredEvents[idx];
    
    setEditIndex(idx);
    
    // Handle different image source formats
    if (e.coverImage && typeof e.coverImage === 'string') {
      setEditImage(e.coverImage);
    } else if (e.coverImage && e.coverImage.uri) {
      setEditImage(e.coverImage.uri);
    } else {
      setEditImage(null);
    }
    
    setEditTitle(e.title || '');
    setEditType(e.type || '');
    setEditDate(e.date || '');
    setEditTime(e.time || '');
    setEditLocation(e.location || '');
    setEditDescription(e.description || '');
    
    setShowEditModal(true);
  };

  // Handle Edit Save
  const handleEditSave = async () => {
    setEditLoading(true);
    try {
      if (!editTitle || !editType || !editDate || !editTime || !editLocation || !editDescription) {
        Alert.alert('Validation Error', 'Please fill in all fields.');
        return;
      }

      if (editIndex !== null) {
        const eventToUpdate = filteredEvents[editIndex];
        
        // Validate date format
        const formattedDate = EventService.validateAndFormatDate(editDate);
        if (!formattedDate) {
          Alert.alert('Date Error', 'Invalid date format. Please use a valid date.');
          return;
        }

        // Validate time format
        if (!EventService.validateTimeFormat(editTime)) {
          Alert.alert('Time Error', 'Invalid time format. Please use HH:MM or HH:MM AM/PM format (e.g., 14:30 or 2:30 PM).');
          return;
        }

        // Normalize time to 24-hour format
        const normalizedTime = EventService.normalizeTimeFormat(editTime);
        if (!normalizedTime) {
          Alert.alert('Time Error', 'Could not process time format. Please check your input.');
          return;
        }

        const updateSuccess = await eventService.updateEvent(eventToUpdate.id, {
          title: editTitle,
          description: editDescription,
          date: formattedDate,
          time: normalizedTime,
          location: editLocation,
          coverImage: editImage || undefined,
          category: editType as any,
          type: 'MITC'
        });

        if (updateSuccess) {
          // Fetch the updated event data to ensure we have the latest version
          const updatedEventData = await eventService.getEventById(eventToUpdate.id);
          
          if (updatedEventData) {
            // Update the event in the global context
            await updateEventInContext(updatedEventData);
          }
          
          // Also refresh the local events list for immediate UI update
          await fetchEvents();
          
          // Show success message
          if (Platform.OS === 'android') {
            ToastAndroid.show('Event updated successfully', ToastAndroid.SHORT);
          } else {
            Alert.alert('Success', 'Event updated successfully');
          }
        } else {
          Alert.alert('Error', 'Failed to update event. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error updating event:', error);
      Alert.alert('Error', 'An error occurred while updating the event.');
    } finally {
      setEditLoading(false);
      setShowEditModal(false);
      setEditIndex(null);
      setEditImage(null);
      setEditTitle('');
      setEditType('');
      setEditDate('');
      setEditTime('');
      setEditLocation('');
      setEditDescription('');
    }
  };

  // Handle Edit Delete
  const handleEditDelete = async () => {
    if (editIndex !== null) {
      const eventToDelete = filteredEvents[editIndex];
      
      // Show confirmation dialog
      Alert.alert(
        'Delete Event',
        `Are you sure you want to delete "${eventToDelete.title}"? This action cannot be undone and will remove all registrations and bookmarks for this event.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                setEditLoading(true);
                
                // Delete from database
                const success = await eventService.deleteEvent(eventToDelete.id);
                
                if (success) {
                  // Remove from local state
                  setEvents(prev => prev.filter(e => e.id !== eventToDelete.id));
                  
                  // Clean up from all user contexts
                  await handleEventDeletion(eventToDelete.id);
                  
                  // Show success message
                  if (Platform.OS === 'android') {
                    ToastAndroid.show('Event deleted successfully', ToastAndroid.SHORT);
                  } else {
                    Alert.alert('Success', 'Event deleted successfully');
                  }
                } else {
                  Alert.alert('Error', 'Failed to delete event. Please try again.');
                }
              } catch (error) {
                console.error('Error deleting event:', error);
                Alert.alert('Error', 'An error occurred while deleting the event.');
              } finally {
                setEditLoading(false);
                setShowEditModal(false);
                setEditIndex(null);
              }
            },
          },
        ]
      );
    }
  };

  // Open Attendees Modal
  const openAttendeesModal = async (eventId: string) => {
    setCurrentEventId(eventId);
    setAttendeesSearch('');
    setShowAttendeesModal(true);
  };

  // Get current event's attendees
  const [currentEventAttendees, setCurrentEventAttendees] = useState<any[]>([]);

  useEffect(() => {
    if (currentEventId) {
      fetchEventAttendees(currentEventId);
    }
  }, [currentEventId]);

  const fetchEventAttendees = async (eventId: string) => {
    try {
      console.log('🔍 Modal - Fetching attendees for event:', eventId);
      const attendees = await eventService.getEventAttendees(eventId);
      console.log('📊 Modal - Raw attendees data:', attendees);
      console.log('📊 Modal - Processed data:', {
        eventId,
        attendeeCount: attendees.length,
        attendees: attendees.map(a => ({
          id: a.id,
          user_id: a.user_id,
          name: a.users?.name || a.name,
          email: a.users?.email || a.email,
          role: a.users?.role || a.role,
          status: a.status,
          hasUsersData: !!a.users
        }))
      });
      setCurrentEventAttendees(attendees);
    } catch (error) {
      console.error('Error fetching attendees:', error);
    }
  };

  const filteredAttendees = currentEventAttendees.filter((a: any) => {
    const name = a.users?.name || a.name || '';
    const email = a.users?.email || a.email || '';
    const role = a.users?.role || a.role || '';
    const searchTerm = attendeesSearch.toLowerCase();
    
    return name.toLowerCase().includes(searchTerm) ||
           email.toLowerCase().includes(searchTerm) ||
           role.toLowerCase().includes(searchTerm) ||
           a.user_id?.toLowerCase().includes(searchTerm);
  }) || [];

  // Floating action button for adding event (FAB)
  const AddEventFAB = (
    <TouchableOpacity
      onPress={() => setShowAddModal(true)}
      style={{
        position: 'absolute',
        right: 20,
        bottom: 84,
        backgroundColor: '#3CB371',
        borderRadius: 30,
        width: 60,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 10,
        zIndex: 100,
      }}
      accessibilityLabel="Add Event"
      activeOpacity={0.85}
    >
      <Ionicons name="add" size={34} color="#fff" />
    </TouchableOpacity>
  );

  const insets = useSafeAreaInsets();
  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor }}>
      {/* Unified Admin Header */}
      <AdminHeader 
        title=""
      />

      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: searchBackground }]}>
        <Ionicons name="search" size={20} color={secondaryTextColor} style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          placeholder="Search events"
          placeholderTextColor={secondaryTextColor}
          value={search}
          onChangeText={setSearch}
        />
        {isSearching && (
          <ActivityIndicator size="small" color="#43C6AC" style={{ marginLeft: 8 }} />
        )}
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { backgroundColor: cardBackground, borderBottomColor: borderColor }]}>
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              { backgroundColor: searchBackground },
              selectedFilter === filter && styles.activeFilterTab
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={[
              styles.filterText,
              { color: textColor },
              selectedFilter === filter && styles.activeFilterText
            ]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Empty State */}
        {(search.trim() ? searchResults.length === 0 : events.length === 0) ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={[styles.emptyStateTitle, { color: textColor }]}>
              {search.trim() ? 'No Events Found' : 'No Events Created'}
            </Text>
            <Text style={[styles.emptyStateText, { color: secondaryTextColor }]}>
              {search.trim() 
                ? `No events found matching "${search}". Try a different search term.`
                : 'Start by creating your first event to manage activities and track attendees.'
              }
            </Text>
          </View>
        ) : (
          <>
            {/* Featured Event */}
            {featuredEvent && (
              <TouchableOpacity 
                style={styles.featuredCard}
                onPress={() => router.push(`/admin-events/${featuredEvent.id}/details`)}
                activeOpacity={0.8}
              >
                <Image 
                  source={getEventImageSource(featuredEvent)} 
                  style={styles.featuredImage}
                  resizeMode="cover"
                  onError={() => console.log('Failed to load featured event image:', featuredEvent.id)}
                />
                <View style={styles.featuredOverlay}>
                  <View style={styles.featuredBadge}>
                    <Text style={styles.featuredText}>Featured</Text>
                  </View>
                  <Text style={styles.featuredTitle}>{featuredEvent.title}</Text>
                  <Text style={styles.featuredSubtitle}>{featuredEvent.type} • {formatDate(featuredEvent.date)}</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Show categorized events when "All" is selected */}
            {selectedFilter === 'All' ? (
              <>
                {/* Upcoming Events Section */}
                {upcomingEvents.length > 0 && (
                  <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="calendar-outline" size={20} color="#3CB371" />
                      <Text style={[styles.sectionTitle, { color: textColor }]}>Upcoming Events ({upcomingEvents.length})</Text>
                    </View>
                    {upcomingEvents.map((event, index) => (
                      <TouchableOpacity 
                        key={event.id}
                        style={[styles.eventCard, { backgroundColor: cardBackground, borderColor }]}
                        onPress={() => router.push(`/admin-events/${event.id}/details`)}
                        activeOpacity={0.8}
                      >
                        <Image 
                          source={getEventImageSource(event)} 
                          style={styles.eventImage}
                          resizeMode="cover"
                          onError={() => console.log('Failed to load image for event:', event.id)}
                        />
                        <View style={styles.eventInfo}>
                          <Text style={[styles.eventTitle, { color: textColor }]}>{event.title}</Text>
                          <Text style={[styles.eventType, { color: '#3CB371' }]}>{event.type}</Text>
                          <Text style={[styles.eventDate, { color: secondaryTextColor }]}>{formatDate(event.date)} • {event.time}</Text>
                          <Text style={[styles.eventLocation, { color: secondaryTextColor }]}>{event.location}</Text>
                        </View>
                        <View style={styles.eventActions}>
                          <TouchableOpacity 
                            style={styles.actionBtn}
                            onPress={() => openAttendeesModal(event.id)}
                          >
                            <Ionicons name="people" size={20} color="#3CB371" />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.actionBtn}
                            onPress={() => openEditModal(events.findIndex(e => e.id === event.id))}
                          >
                            <Ionicons name="create" size={20} color="#4A90E2" />
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Past Events Section */}
                {pastEvents.length > 0 && (
                  <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="time-outline" size={20} color="#888" />
                      <Text style={[styles.sectionTitle, { color: textColor }]}>Past Events ({pastEvents.length})</Text>
                    </View>
                    {pastEvents.map((event, index) => (
                      <TouchableOpacity 
                        key={event.id}
                        style={[styles.eventCard, { backgroundColor: cardBackground, borderColor, opacity: 0.7 }]}
                        onPress={() => router.push(`/admin-events/${event.id}/details`)}
                        activeOpacity={0.8}
                      >
                        <Image 
                          source={getEventImageSource(event)} 
                          style={styles.eventImage}
                          resizeMode="cover"
                          onError={() => console.log('Failed to load image for event:', event.id)}
                        />
                        <View style={styles.eventInfo}>
                          <Text style={[styles.eventTitle, { color: textColor }]}>{event.title}</Text>
                          <Text style={[styles.eventType, { color: '#888' }]}>{event.type}</Text>
                          <Text style={[styles.eventDate, { color: secondaryTextColor }]}>{formatDate(event.date)} • {event.time}</Text>
                          <Text style={[styles.eventLocation, { color: secondaryTextColor }]}>{event.location}</Text>
                        </View>
                        <View style={styles.eventActions}>
                          <TouchableOpacity 
                            style={styles.actionBtn}
                            onPress={() => openAttendeesModal(event.id)}
                          >
                            <Ionicons name="people" size={20} color="#888" />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.actionBtn}
                            onPress={() => openEditModal(events.findIndex(e => e.id === event.id))}
                          >
                            <Ionicons name="create" size={20} color="#888" />
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            ) : (
              /* Show filtered events for specific tabs */
              filteredEvents.map((event, index) => (
                <TouchableOpacity 
                  key={event.id}
                  style={[styles.eventCard, { backgroundColor: cardBackground, borderColor }]}
                  onPress={() => router.push(`/admin-events/${event.id}/details`)}
                  activeOpacity={0.8}
                >
                  <Image 
                    source={getEventImageSource(event)} 
                    style={styles.eventImage}
                    resizeMode="cover"
                    onError={() => console.log('Failed to load image for event:', event.id)}
                  />
                  <View style={styles.eventInfo}>
                    <Text style={[styles.eventTitle, { color: textColor }]}>{event.title}</Text>
                    <Text style={[styles.eventType, { color: '#3CB371' }]}>{event.type}</Text>
                    <Text style={[styles.eventDate, { color: secondaryTextColor }]}>{formatDate(event.date)} • {event.time}</Text>
                    <Text style={[styles.eventLocation, { color: secondaryTextColor }]}>{event.location}</Text>
                  </View>
                  <View style={styles.eventActions}>
                    <TouchableOpacity 
                      style={styles.actionBtn}
                      onPress={() => openAttendeesModal(event.id)}
                    >
                      <Ionicons name="people" size={20} color="#3CB371" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionBtn}
                      onPress={() => openEditModal(index)}
                    >
                      <Ionicons name="create" size={20} color="#4A90E2" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Bottom Tab Bar */}
      <AdminTabBar activeTab="events" isDarkMode={isDarkMode} />
      {AddEventFAB}

      {/* Add Event Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={[styles.modalOverlay, { backgroundColor: overlayBackground }]}>
            <View style={[styles.modalContent, { backgroundColor: modalBackground }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: textColor }]}>Add New Event</Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Ionicons name="close" size={24} color={secondaryTextColor} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
                <Text style={[styles.modalLabel, { color: textColor }]}>Event Title</Text>
                <TextInput
                  style={[styles.modalInput, { color: textColor, backgroundColor: searchBackground }]}
                  value={addTitle}
                  onChangeText={setAddTitle}
                  placeholder="Enter event title..."
                  placeholderTextColor={secondaryTextColor}
                />
                <Text style={[styles.modalLabel, { color: textColor }]}>Event Type</Text>
                <TextInput
                  style={[styles.modalInput, { color: textColor, backgroundColor: searchBackground }]}
                  value={addType}
                  onChangeText={setAddType}
                  placeholder="Enter event type (e.g., Workshop, Seminar, Conference, etc.)"
                  placeholderTextColor={secondaryTextColor}
                />
                <Text style={[styles.modalLabel, { color: textColor }]}>Date</Text>
                <TouchableOpacity
                  style={[styles.pickerButton, { backgroundColor: searchBackground, borderColor }]}
                  onPress={openDatePicker}
                >
                  <View style={styles.pickerButtonContent}>
                    <Ionicons name="calendar-outline" size={20} color="#3CB371" />
                    <Text style={[styles.pickerButtonText, { color: addDate ? textColor : secondaryTextColor }]}>
                      {addDate || 'Select Date'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={16} color={secondaryTextColor} />
                </TouchableOpacity>

                <Text style={[styles.modalLabel, { color: textColor }]}>Time</Text>
                <TouchableOpacity
                  style={[styles.pickerButton, { backgroundColor: searchBackground, borderColor }]}
                  onPress={openTimePicker}
                >
                  <View style={styles.pickerButtonContent}>
                    <Ionicons name="time-outline" size={20} color="#3CB371" />
                    <Text style={[styles.pickerButtonText, { color: addTime ? textColor : secondaryTextColor }]}>
                      {addTime || 'Select Time'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={16} color={secondaryTextColor} />
                </TouchableOpacity>
                <Text style={[styles.modalLabel, { color: textColor }]}>Location</Text>
                <TextInput
                  style={[styles.modalInput, { color: textColor, backgroundColor: searchBackground }]}
                  value={addLocation}
                  onChangeText={setAddLocation}
                  placeholder="Enter location..."
                  placeholderTextColor={secondaryTextColor}
                />
                <Text style={[styles.modalLabel, { color: textColor }]}>Description</Text>
                <TextInput
                  style={[styles.modalInput, styles.textArea, { color: textColor, backgroundColor: searchBackground }]}
                  value={addDescription}
                  onChangeText={setAddDescription}
                  placeholder="Enter event description..."
                  placeholderTextColor={secondaryTextColor}
                  multiline
                  numberOfLines={4}
                />
                <TouchableOpacity
                  style={[styles.addImageBtn, { backgroundColor: searchBackground, borderColor }]}
                  onPress={pickImage}
                >
                  <Ionicons name="image" size={20} color="#3CB371" />
                  <Text style={[styles.addImageText, { color: '#3CB371' }]}>Add Cover Image</Text>
                </TouchableOpacity>
                {addImage && (
                  <Image source={{ uri: addImage }} style={styles.previewImage} />
                )}
                <TouchableOpacity
                  style={[styles.saveBtn, addLoading && styles.saveBtnDisabled]}
                  onPress={handleAddEvent}
                  disabled={addLoading}
                >
                  {addLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Add Event</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
        
        {/* Date Picker Modal - Inside Add Event Modal */}
        <DatePickerModal
          visible={showDatePicker}
          onClose={onDateCancel}
          onConfirm={onDateConfirm}
          initialDate={selectedDate}
          title="Select Event Date"
        />

        {/* Time Picker Modal - Inside Add Event Modal */}
        <TimePickerModal
          visible={showTimePicker}
          onClose={onTimeCancel}
          onConfirm={onTimeConfirm}
          initialTime={selectedTime}
          title="Select Event Time"
        />
      </Modal>

      {/* Edit Event Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={[styles.modalOverlay, { backgroundColor: overlayBackground }]}>
            <View style={[styles.modalContent, { backgroundColor: modalBackground }]}>
              <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
                <Text style={[styles.modalTitle, { color: textColor }]}>Edit Event</Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <Ionicons name="close" size={24} color={secondaryTextColor} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
                <Text style={[styles.modalLabel, { color: textColor }]}>Event Title</Text>
                <TextInput
                  style={[styles.modalInput, { color: textColor, backgroundColor: searchBackground, borderColor }]}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Enter event title..."
                  placeholderTextColor={secondaryTextColor}
                />
                <Text style={[styles.modalLabel, { color: textColor }]}>Event Type</Text>
                <TextInput
                  style={[styles.modalInput, { color: textColor, backgroundColor: searchBackground, borderColor }]}
                  value={editType}
                  onChangeText={setEditType}
                  placeholder="Workshop, Seminar, etc."
                  placeholderTextColor={secondaryTextColor}
                />
                <Text style={[styles.modalLabel, { color: textColor }]}>Date</Text>
                <TouchableOpacity
                  style={[styles.pickerButton, { backgroundColor: searchBackground, borderColor }]}
                  onPress={() => {
                    // Parse the current date string to set initial date
                    if (editDate) {
                      try {
                        const [year, month, day] = editDate.split('-').map(Number);
                        const initialDate = new Date(year, month - 1, day);
                        setSelectedDate(initialDate);
                      } catch (error) {
                        setSelectedDate(new Date());
                      }
                    } else {
                      setSelectedDate(new Date());
                    }
                    setShowDatePicker(true);
                  }}
                >
                  <View style={styles.pickerButtonContent}>
                    <Ionicons name="calendar-outline" size={20} color={secondaryTextColor} />
                    <Text style={[styles.pickerButtonText, { color: textColor }]}>
                      {editDate || 'Select Date'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={20} color={secondaryTextColor} />
                </TouchableOpacity>

                <Text style={[styles.modalLabel, { color: textColor }]}>Time</Text>
                <TouchableOpacity
                  style={[styles.pickerButton, { backgroundColor: searchBackground, borderColor }]}
                  onPress={() => {
                    // Parse the current time string to set initial time
                    if (editTime) {
                      try {
                        const timeMatch = editTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                        if (timeMatch) {
                          let [_, hours, minutes, period] = timeMatch;
                          let hour = parseInt(hours);
                          if (period.toUpperCase() === 'PM' && hour !== 12) hour += 12;
                          if (period.toUpperCase() === 'AM' && hour === 12) hour = 0;
                          const initialTime = new Date(new Date().setHours(hour, parseInt(minutes), 0, 0));
                          setSelectedTime(initialTime);
                        } else {
                          setSelectedTime(new Date());
                        }
                      } catch (error) {
                        setSelectedTime(new Date());
                      }
                    } else {
                      setSelectedTime(new Date());
                    }
                    setShowTimePicker(true);
                  }}
                >
                  <View style={styles.pickerButtonContent}>
                    <Ionicons name="time-outline" size={20} color={secondaryTextColor} />
                    <Text style={[styles.pickerButtonText, { color: textColor }]}>
                      {editTime || 'Select Time'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={20} color={secondaryTextColor} />
                </TouchableOpacity>
                <Text style={[styles.modalLabel, { color: textColor }]}>Location</Text>
                <TextInput
                  style={[styles.modalInput, { color: textColor, backgroundColor: searchBackground, borderColor }]}
                  value={editLocation}
                  onChangeText={setEditLocation}
                  placeholder="Enter location..."
                  placeholderTextColor={secondaryTextColor}
                />
                <Text style={[styles.modalLabel, { color: textColor }]}>Description</Text>
                <TextInput
                  style={[styles.modalInput, styles.textArea, { color: textColor, backgroundColor: searchBackground, borderColor }]}
                  value={editDescription}
                  onChangeText={setEditDescription}
                  placeholder="Enter event description..."
                  placeholderTextColor={secondaryTextColor}
                  multiline
                  numberOfLines={4}
                />
                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={[styles.deleteBtn, { backgroundColor: '#E74C3C' }]}
                    onPress={handleEditDelete}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={[styles.deleteBtnText, { color: '#fff', fontWeight: '600' }]}>Delete Event</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: '#3CB371' }, editLoading && styles.saveBtnDisabled]}
                    onPress={handleEditSave}
                    disabled={editLoading}
                    activeOpacity={0.8}
                  >
                    {editLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={[styles.saveBtnText, { color: '#fff', fontWeight: '600' }]}>Save Changes</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
                
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
        
        {/* Date Picker Modal - Inside Edit Event Modal */}
        <DatePickerModal
          visible={showDatePicker}
          onClose={onDateCancel}
          onConfirm={onDateConfirm}
          initialDate={selectedDate}
          title="Select Event Date"
        />

        {/* Time Picker Modal - Inside Edit Event Modal */}
        <TimePickerModal
          visible={showTimePicker}
          onClose={onTimeCancel}
          onConfirm={onTimeConfirm}
          initialTime={selectedTime}
          title="Select Event Time"
        />
      </Modal>

      {/* Attendees Modal */}
      <Modal
        visible={showAttendeesModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAttendeesModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: overlayBackground }]}>
          <View style={[styles.modalContent, { backgroundColor: modalBackground }]}>
            <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Event Attendees</Text>
              <TouchableOpacity onPress={() => setShowAttendeesModal(false)}>
                <Ionicons name="close" size={24} color={secondaryTextColor} />
              </TouchableOpacity>
            </View>
            <View style={[styles.attendeesHeader, { borderBottomColor: borderColor }]}>
              <View style={[styles.searchRow, { backgroundColor: searchBackground }]}>
                <Ionicons name="search" size={18} color={secondaryTextColor} style={{ marginRight: 6 }} />
                <TextInput
                  style={[styles.attendeesSearchInput, { color: textColor }]}
                  placeholder="Search attendees"
                  placeholderTextColor={secondaryTextColor}
                  value={attendeesSearch}
                  onChangeText={setAttendeesSearch}
                />
              </View>
              <View style={styles.statusFilter}>
                <TouchableOpacity
                  style={[
                    styles.statusBtn,
                    { backgroundColor: searchBackground },
                    attendeeStatus === 'Confirmed' && styles.activeStatusBtn
                  ]}
                  onPress={() => setAttendeeStatus('Confirmed')}
                >
                  <Text style={[
                    styles.statusBtnText,
                    { color: textColor },
                    attendeeStatus === 'Confirmed' && styles.activeStatusBtnText
                  ]}>
                    Confirmed
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusBtn,
                    { backgroundColor: searchBackground },
                    attendeeStatus === 'Canceled' && styles.activeStatusBtn
                  ]}
                  onPress={() => setAttendeeStatus('Canceled')}
                >
                  <Text style={[
                    styles.statusBtnText,
                    { color: textColor },
                    attendeeStatus === 'Canceled' && styles.activeStatusBtnText
                  ]}>
                    Canceled
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView style={styles.attendeesList}>
              {filteredAttendees.map((attendee: any, index: any) => (
                <View key={attendee.id || index} style={[styles.attendeeItem, { borderBottomColor: borderColor }]}>
                  <View style={styles.attendeeInfo}>
                    <Text style={[styles.attendeeName, { color: textColor }]}>
                      {attendee.users?.name || attendee.name || `User ${attendee.user_id?.substring(0, 8)}`}
                    </Text>
                    <Text style={[styles.attendeeEmail, { color: secondaryTextColor }]}>
                      {attendee.users?.email || attendee.email || 'No email available'}
                    </Text>
                    <View style={styles.attendeeMeta}>
                      <Text style={[styles.attendeeRole, { color: secondaryTextColor }]}>
                        {(attendee.users?.role || attendee.role || 'Unknown')?.charAt(0).toUpperCase() + (attendee.users?.role || attendee.role || 'Unknown')?.slice(1)}
                      </Text>
                      <Text style={[styles.attendeeDate, { color: secondaryTextColor }]}>
                        Registered: {new Date(attendee.registration_date || attendee.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: attendee.status === 'confirmed' ? '#4CAF50' : '#FF9800' }
                  ]}>
                    <Text style={styles.statusBadgeText}>
                      {attendee.status?.charAt(0).toUpperCase() + attendee.status?.slice(1) || 'Registered'}
                    </Text>
                  </View>
                </View>
              ))}
              {filteredAttendees.length === 0 && (
                <View style={styles.emptyAttendees}>
                  <Text style={[styles.emptyAttendeesText, { color: secondaryTextColor }]}>
                    No attendees found for this event
                  </Text>
                </View>
              )}
            </ScrollView>
                     </View>
         </View>
       </Modal>

     </SafeAreaView>
     </>
   );
 };

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  addBtn: {
    backgroundColor: '#3CB371',
    borderRadius: 20,
    padding: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeFilterTab: {
    backgroundColor: '#3CB371',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Extra padding for tab bar
  },
  featuredCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  featuredImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    backgroundColor: '#F3F5F2', // Light background for better visibility
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#3CB371',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  featuredText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  featuredTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  featuredSubtitle: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
  eventCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
  },
  eventImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F3F5F2', // Light background for better visibility
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  eventType: {
    fontSize: 12,
    color: '#3CB371',
    fontWeight: '500',
    marginBottom: 2,
  },
  eventDate: {
    fontSize: 12,
    marginBottom: 2,
  },
  eventLocation: {
    fontSize: 12,
  },
  eventActions: {
    justifyContent: 'space-between',
  },
  actionBtn: {
    padding: 8,
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalScroll: {
    padding: 20,
    paddingBottom: 40,
  },
  modalLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  modalInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  addImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  addImageText: {
    marginLeft: 8,
    color: '#3CB371',
    fontWeight: '500',
  },
  previewImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 16,
    resizeMode: 'cover',
  },
  saveBtn: {
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    minHeight: 56,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
    gap: 12,
  },
  deleteBtn: {
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    minHeight: 56,
  },
  deleteBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  attendeesHeader: {
    padding: 20,
    borderBottomWidth: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  attendeesSearchInput: {
    flex: 1,
    fontSize: 14,
  },
  statusFilter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  activeStatusBtn: {
    backgroundColor: '#3CB371',
  },
  statusBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeStatusBtnText: {
    color: '#fff',
  },
  attendeesList: {
    padding: 20,
  },
  attendeeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  attendeeEmail: {
    fontSize: 14,
  },
  attendeeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 12,
  },
  attendeeRole: {
    fontSize: 12,
    fontWeight: '500',
  },
  attendeeDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#3CB371',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyAttendees: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyAttendeesText: {
    fontSize: 16,
    textAlign: 'center',
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
  },
  dropdownOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
    borderRadius: 8,
    borderWidth: 1,
    maxHeight: 200,
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  dropdownOptionText: {
    fontSize: 16,
  },
  // Picker Button Styles
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    minHeight: 48,
  },
  pickerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pickerButtonText: {
    fontSize: 16,
    marginLeft: 8,
    flex: 1,
  },
  // Picker Modal Styles
  pickerModalContent: {
    borderRadius: 16,
    width: '90%',
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 10,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  pickerContainer: {
    padding: 20,
    alignItems: 'center',
  },
  datePicker: {
    width: 300,
    height: 200,
  },
  timePicker: {
    width: 300,
    height: 200,
  },
  // Section Styles
  sectionContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  });
  
  export default AdminEventListScreen; 