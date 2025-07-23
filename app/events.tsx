import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useEventContext } from '../components/EventContext';
import { Ionicons } from '@expo/vector-icons';
import EventsTabBar from '../components/EventsTabBar';
import { useTheme } from '../components/ThemeContext';
import { useThemeColor } from '../hooks/useThemeColor';
import { useUserContext } from '../components/UserContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EventCard from '../components/EventCard';

const EVENT_TABS = ['All', 'Upcoming', 'My Events'];

export default function EventsScreen() {
  const router = useRouter();
  const { events, bookmarks, bookmarkEvent, unbookmarkEvent, registered, registerEvent, getUserEventStatus } = useEventContext();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [userEventStatuses, setUserEventStatuses] = useState<{[key: string]: any}>({});
  const [myEventsTab, setMyEventsTab] = useState<'Registered' | 'Bookmarked'>('Registered');
  const { isDarkMode } = useTheme();
  const textColor = useThemeColor({}, 'text');
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  const borderColor = isDarkMode ? '#2A2A2A' : '#f0f0f0';
  const iconColor = useThemeColor({}, 'icon');
  const { userRole } = useUserContext();
  const insets = useSafeAreaInsets();
  const darkBg = '#181C20';
  const darkCard = '#23272b';
  const darkBorder = '#2D333B';
  const darkText = '#F3F6FA';
  const darkSecondary = '#AEB6C1';
  const darkHighlight = '#43C6AC';
  const { getHomeRoute } = useUserContext();
  const handleBack = () => {
    router.back();
  };

  // Helper function to get registration count
  const getRegistrationCount = (eventId: string) => {
    // Find the event and return its registered count
    const event = events.find(e => e.id === eventId);
    return event?.registeredCount || 0;
  };

  // Load user event statuses
  useEffect(() => {
    const loadUserEventStatuses = async () => {
      const statuses: {[key: string]: any} = {};
      
      for (const event of events) {
        const userStatus = await getUserEventStatus(event.id);
        if (userStatus) {
          statuses[event.id] = userStatus;
        }
      }
      
      setUserEventStatuses(statuses);
    };

    if (events.length > 0) {
      loadUserEventStatuses();
    }
  }, [events, getUserEventStatus]);

  // Filter events based on tab and search
  const filteredEvents = events.filter(e => {
    const eventDate = new Date(e.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    
    if (activeTab === 'Upcoming') {
      // Show only future events
      return eventDate >= today;
    }
    if (activeTab === 'Past') {
      // Show only past events
      return eventDate < today;
    }
    // For 'All' tab, show all events
    return true;
  }).filter(e => e.title.toLowerCase().includes(search.toLowerCase()));

  // Registered events for My Events tab
  const registeredEvents = events.filter(e => registered.includes(e.id));
  // Bookmarked events for Bookmark tab
  const bookmarkedEvents = events.filter(e => bookmarks.includes(e.id));

  // Dynamically select the nearest upcoming event as featured
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingEvents = events
    .filter(e => new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const featured = upcomingEvents.length > 0 ? upcomingEvents[0] : null;

  // Helper function to check if an event is in the past
  const isEventInPast = (eventDate: string) => {
    const eventDateObj = new Date(eventDate);
    return eventDateObj < today;
  };

  // Helper function to get button text and state for an event
  const getEventButtonState = (eventId: string, eventDate: string) => {
    const isPast = isEventInPast(eventDate);
    const isRegistered = registered.includes(eventId);
    const isCompleted = userEventStatuses[eventId]?.status === 'completed';
    
    if (isCompleted) return { text: 'Completed', disabled: true };
    if (isRegistered) return { text: 'Registered', disabled: true };
    if (isPast) return { text: 'Event Passed', disabled: true };
    return { text: 'Register', disabled: false };
  };

  return (
    <View style={{ flex: 1, backgroundColor: (userRole === 'employee' || userRole === 'trainee') && isDarkMode ? darkCard : cardBackground }}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      {(userRole === 'employee' || userRole === 'trainee') && (
        <View style={{
          paddingTop: insets.top,
          backgroundColor: isDarkMode ? darkCard : cardBackground,
          borderBottomColor: isDarkMode ? darkBorder : borderColor,
          borderBottomWidth: 1,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingBottom: 12,
        }}>
          <TouchableOpacity onPress={handleBack} style={{ padding: 4, marginRight: 8 }}>
            <Ionicons name="arrow-back" size={24} color={iconColor} />
          </TouchableOpacity>
          <Text style={{
            fontSize: 22,
            fontWeight: '700',
            letterSpacing: 0.5,
            flex: 1,
            textAlign: 'center',
            color: isDarkMode ? darkText : textColor
          }}>
            MIT<Text style={{ color: darkHighlight }}>Connect</Text>
          </Text>
          <View style={{ width: 32 }} />
        </View>
      )}
      {/* Search Bar */}
      <View style={{
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: (userRole === 'employee' || userRole === 'trainee') && isDarkMode ? darkCard : '#F2F2F7',
        borderRadius: 12,
        marginHorizontal: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: (userRole === 'employee' || userRole === 'trainee') && isDarkMode ? darkBorder : '#E0E0E0',
      }}>
        <Ionicons name="search" size={20} color={(userRole === 'employee' || userRole === 'trainee') && isDarkMode ? darkSecondary : secondaryTextColor} style={{ marginRight: 8 }} />
        <TextInput
          style={{ flex: 1, fontSize: 16, color: (userRole === 'employee' || userRole === 'trainee') && isDarkMode ? darkText : textColor }}
          placeholder="Search events..."
          placeholderTextColor={(userRole === 'employee' || userRole === 'trainee') && isDarkMode ? darkSecondary : secondaryTextColor}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      {/* Tabs for My Events and Bookmark */}
      <View style={{
        marginTop: 8,
        backgroundColor: (userRole === 'employee' || userRole === 'trainee') && isDarkMode ? '#23272b' : '#fff',
        borderBottomWidth: 1,
        borderBottomColor: (userRole === 'employee' || userRole === 'trainee') && isDarkMode ? '#2D333B' : '#f0f0f0',
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-start' }}>
            {EVENT_TABS.map(tab => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 18,
                    borderRadius: 20,
                    backgroundColor: (userRole === 'employee' || userRole === 'trainee') && isDarkMode && isActive ? '#23272b' : 'transparent',
                    marginRight: 8,
                  }}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={{
                    fontSize: 15,
                    fontWeight: 'bold',
                    color: (userRole === 'employee' || userRole === 'trainee') && isDarkMode
                      ? (isActive ? '#F3F6FA' : '#AEB6C1')
                      : (isActive ? '#43C6AC' : secondaryTextColor),
                  }}>{tab}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
      <View style={{ flex: 1 }}>
        {activeTab === 'All' ? (
          <FlatList
            data={filteredEvents}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <EventCard
                event={item}
                isBookmarked={bookmarks.includes(item.id)}
                onBookmark={() => {
                  if (bookmarks.includes(item.id)) {
                    unbookmarkEvent(item.id);
                  } else {
                    bookmarkEvent(item.id);
                  }
                }}
                onRegister={() => {
                  if (!getEventButtonState(item.id, item.date).disabled) {
                    registerEvent(item.id);
                  }
                }}
                onPress={() => router.push({ pathname: '/event-details', params: { id: item.id } })}
                buttonText={getEventButtonState(item.id, item.date).text}
                buttonDisabled={getEventButtonState(item.id, item.date).disabled}
                registrationCount={getRegistrationCount(item.id)}
              />
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={64} color="#ccc" />
                <Text style={styles.emptyStateTitle}>No Events Available</Text>
                <Text style={styles.emptyStateText}>
                  There are no events scheduled at the moment. Check back later for exciting activities!
                </Text>
              </View>
            )}
          />
        ) : activeTab === 'Upcoming' ? (
          <FlatList
            data={upcomingEvents}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <EventCard
                event={item}
                isBookmarked={bookmarks.includes(item.id)}
                onBookmark={() => {
                  if (bookmarks.includes(item.id)) {
                    unbookmarkEvent(item.id);
                  } else {
                    bookmarkEvent(item.id);
                  }
                }}
                onRegister={() => {
                  if (!getEventButtonState(item.id, item.date).disabled) {
                    registerEvent(item.id);
                  }
                }}
                onPress={() => router.push({ pathname: '/event-details', params: { id: item.id } })}
                buttonText={getEventButtonState(item.id, item.date).text}
                buttonDisabled={getEventButtonState(item.id, item.date).disabled}
                registrationCount={getRegistrationCount(item.id)}
              />
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={64} color="#ccc" />
                <Text style={styles.emptyStateTitle}>No Upcoming Events</Text>
                <Text style={styles.emptyStateText}>
                  There are no upcoming events at the moment.
                </Text>
              </View>
            )}
          />
        ) : activeTab === 'My Events' ? (
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 12, marginBottom: 8 }}>
              <TouchableOpacity
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 24,
                  borderRadius: 20,
                  backgroundColor: myEventsTab === 'Registered' ? '#e0f7f4' : 'transparent',
                  marginRight: 8,
                }}
                onPress={() => setMyEventsTab('Registered')}
              >
                <Text style={{
                  fontWeight: 'bold',
                  color: myEventsTab === 'Registered' ? '#43C6AC' : secondaryTextColor,
                  fontSize: 16,
                }}>Registered</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 24,
                  borderRadius: 20,
                  backgroundColor: myEventsTab === 'Bookmarked' ? '#e0f7f4' : 'transparent',
                }}
                onPress={() => setMyEventsTab('Bookmarked')}
              >
                <Text style={{
                  fontWeight: 'bold',
                  color: myEventsTab === 'Bookmarked' ? '#43C6AC' : secondaryTextColor,
                  fontSize: 16,
                }}>Bookmarked</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
              {myEventsTab === 'Registered' ? (
                registeredEvents.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="calendar-outline" size={48} color={secondaryTextColor} />
                    <Text style={styles.emptyStateTitle}>No Registered Events</Text>
                    <Text style={styles.emptyStateText}>You haven't registered for any events yet.</Text>
                  </View>
                ) : registeredEvents.map(item => (
                  <EventCard
                    key={item.id}
                    event={item}
                    isBookmarked={bookmarks.includes(item.id)}
                    onBookmark={() => {
                      if (bookmarks.includes(item.id)) {
                        unbookmarkEvent(item.id);
                      } else {
                        bookmarkEvent(item.id);
                      }
                    }}
                    onRegister={() => {
                      if (!getEventButtonState(item.id, item.date).disabled) {
                        registerEvent(item.id);
                      }
                    }}
                    onPress={() => router.push({ pathname: '/event-details', params: { id: item.id } })}
                    buttonText={getEventButtonState(item.id, item.date).text}
                    buttonDisabled={getEventButtonState(item.id, item.date).disabled}
                    registrationCount={getRegistrationCount(item.id)}
                  />
                ))
              ) : myEventsTab === 'Bookmarked' ? (
                bookmarkedEvents.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="bookmark-outline" size={48} color={secondaryTextColor} />
                    <Text style={styles.emptyStateTitle}>No Bookmarks Yet</Text>
                    <Text style={styles.emptyStateText}>You haven't bookmarked any events yet. Start exploring events and save the ones you're interested in!</Text>
                  </View>
                ) : bookmarkedEvents.map(item => (
                  <EventCard
                    key={item.id}
                    event={item}
                    isBookmarked={bookmarks.includes(item.id)}
                    onBookmark={() => {
                      if (bookmarks.includes(item.id)) {
                        unbookmarkEvent(item.id);
                      } else {
                        bookmarkEvent(item.id);
                      }
                    }}
                    onRegister={() => {
                      if (!getEventButtonState(item.id, item.date).disabled) {
                        registerEvent(item.id);
                      }
                    }}
                    onPress={() => router.push({ pathname: '/event-details', params: { id: item.id } })}
                    buttonText={getEventButtonState(item.id, item.date).text}
                    buttonDisabled={getEventButtonState(item.id, item.date).disabled}
                    registrationCount={getRegistrationCount(item.id)}
                  />
                ))
              ) : null}
            </ScrollView>
          </View>
        ) : null}
      </View>
      <EventsTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
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
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
}); 