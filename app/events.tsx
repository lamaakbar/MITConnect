import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useEventContext } from '../components/EventContext';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import EventsTabBar from '../components/EventsTabBar';
import { useTheme } from '../components/ThemeContext';
import { useThemeColor } from '../hooks/useThemeColor';

const EVENT_TABS = ['All', 'Upcoming', 'My Events', 'Bookmark'];

export default function EventsScreen() {
  const router = useRouter();
  const { events, bookmarks, bookmarkEvent, unbookmarkEvent, registered, registerEvent, getUserEventStatus } = useEventContext();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [userEventStatuses, setUserEventStatuses] = useState<{[key: string]: any}>({});
  const { isDarkMode, toggleTheme } = useTheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  const borderColor = isDarkMode ? '#2A2A2A' : '#f0f0f0';
  const iconColor = useThemeColor({}, 'icon');

  // Load user event statuses
  useEffect(() => {
    const loadUserEventStatuses = async () => {
      const statuses: {[key: string]: any} = {};
      
      for (const event of events) {
        const userStatus = await getUserEventStatus(event.id, 'user-123');
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
    <View style={{ flex: 1, backgroundColor }}>
      {/* App Header */}
      <View style={[styles.header, { backgroundColor: cardBackground, borderBottomColor: borderColor }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image source={require('../assets/images/icon.png')} style={{ width: 32, height: 32, marginRight: 8 }} />
          <Text style={[styles.headerTitle, { color: textColor }]}>MIT<Text style={{ color: '#43C6AC' }}>Connect</Text></Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={toggleTheme} style={styles.headerIcon}>
            <Feather name={isDarkMode ? 'sun' : 'moon'} size={20} color={iconColor} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/my-events' as any)} style={styles.headerIcon}>
            <Feather name="calendar" size={20} color={iconColor} />
          </TouchableOpacity>
          <Feather name="globe" size={20} color={iconColor} style={styles.headerIcon} />
          <Feather name="bell" size={20} color={iconColor} style={styles.headerIcon} />
          <Feather name="user" size={20} color={iconColor} style={styles.headerIcon} />
        </View>
      </View>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={secondaryTextColor} style={{ marginRight: 8 }} />
        <TextInput
          style={{ flex: 1, fontSize: 16, color: textColor }}
          placeholder="Search events..."
          value={search}
          onChangeText={setSearch}
        />
      </View>
      {/* Tabs for My Events and Bookmark */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row' }}>
          <View style={styles.tabsRow}>
            {EVENT_TABS.map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                  { color: secondaryTextColor },
                ]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
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
              <View style={styles.eventCard}>
                <Image source={item.image} style={styles.eventImage} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.eventTitle}>{item.title}</Text>
                  <Text style={styles.eventType}>{item.category === 'Seminar' ? 'Online Event' : item.category}</Text>
                </View>
              </View>
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
              <View style={styles.eventCard}>
                <Image source={item.image} style={styles.eventImage} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.eventTitle}>{item.title}</Text>
                  <Text style={styles.eventType}>{item.category === 'Seminar' ? 'Online Event' : item.category}</Text>
                </View>
              </View>
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
          <FlatList
            data={registeredEvents}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <View style={styles.eventCard}>
                <Image source={item.image} style={styles.eventImage} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.eventTitle}>{item.title}</Text>
                  <Text style={styles.eventType}>{item.category === 'Seminar' ? 'Online Event' : item.category}</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={64} color="#ccc" />
                <Text style={styles.emptyStateTitle}>No Registered Events</Text>
                <Text style={styles.emptyStateText}>
                  You haven't registered for any events yet.
                </Text>
              </View>
            )}
          />
        ) : (
          <FlatList
            data={bookmarkedEvents}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <View style={styles.eventCard}>
                <Image source={item.image} style={styles.eventImage} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.eventTitle}>{item.title}</Text>
                  <Text style={styles.eventType}>{item.category === 'Seminar' ? 'Online Event' : item.category}</Text>
                  <TouchableOpacity style={styles.removeBtn} onPress={() => unbookmarkEvent(item.id)}>
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Ionicons name="bookmark-outline" size={64} color={secondaryTextColor} />
                <Text style={styles.emptyStateTitle}>No Bookmarks Yet</Text>
                <Text style={styles.emptyStateText}>
                  You haven't bookmarked any events yet. Start exploring events and save the ones you're interested in!
                </Text>
              </View>
            )}
          />
        )}
        {/* Remove EventsTabBar from Events page */}
        {/* <EventsTabBar /> */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  headerIcon: {
    marginLeft: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: 'transparent',
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: '#e0f7f4',
  },
  tabText: {
    fontSize: 15,
    color: '#888',
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: '#43C6AC',
  },
  featuredCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    margin: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  featuredImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  featuredDesc: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    textAlign: 'center',
  },
  featuredMeta: {
    fontSize: 13,
    color: '#888',
    marginBottom: 10,
    textAlign: 'center',
  },
  registerBtn: {
    backgroundColor: '#b3e6e0',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  registerBtnText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 16,
  },
  registerBtnDisabled: {
    backgroundColor: '#e0e0e0',
    opacity: 0.7,
  },
  registerBtnTextDisabled: {
    color: '#888',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  eventCard: {
    width: 180,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginRight: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 12,
  },
  bookmarkIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 2,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  eventType: {
    fontSize: 13,
    color: '#888',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
  },
  registeredBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#43C6AC',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    zIndex: 1,
  },
  registeredBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  myEventsButton: {
    backgroundColor: '#43C6AC',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  myEventsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  removeBtn: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  removeBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
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
  emptySearchState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
  },
}); 