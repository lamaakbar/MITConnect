import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ScrollView, Image, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { useEventContext } from '../components/EventContext';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import EventsTabBar from '../components/EventsTabBar';
import { useTheme } from '../components/ThemeContext';
import { useThemeColor } from '../hooks/useThemeColor';
import { useUserContext } from '../components/UserContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const EVENT_TABS = ['All', 'Upcoming', 'My Events'];

export default function EventsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { events, bookmarks, bookmarkEvent, unbookmarkEvent, registered, registerEvent, getUserEventStatus } = useEventContext();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [userEventStatuses, setUserEventStatuses] = useState<{[key: string]: any}>({});
  const [myEventsTab, setMyEventsTab] = useState<'Registered' | 'Bookmarked'>('Registered');
  const { isDarkMode, toggleTheme } = useTheme();
  const backgroundColor = useThemeColor({}, 'background');
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
    if (window?.history?.length > 1) {
      router.back();
    } else {
      router.replace(getHomeRoute() as any);
    }
  };

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

  // Determine if this is the root tab (no navigation history)
  const isRootTab = true; // Always true for the main Events tab

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
                  <View key={item.id} style={[styles.eventCard, { marginBottom: 12 }]}> 
                <Image source={item.image} style={styles.eventImage} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.eventTitle}>{item.title}</Text>
                  <Text style={styles.eventType}>{item.category === 'Seminar' ? 'Online Event' : item.category}</Text>
                </View>
              </View>
                ))
              ) : myEventsTab === 'Bookmarked' ? (
                bookmarkedEvents.length === 0 ? (
              <View style={styles.emptyState}>
                    <Ionicons name="bookmark-outline" size={48} color={secondaryTextColor} />
                    <Text style={styles.emptyStateTitle}>No Bookmarks Yet</Text>
                    <Text style={styles.emptyStateText}>You haven't bookmarked any events yet. Start exploring events and save the ones you're interested in!</Text>
              </View>
                ) : bookmarkedEvents.map(item => (
                  <View key={item.id} style={[styles.eventCard, { marginBottom: 12 }]}> 
                <Image source={item.image} style={styles.eventImage} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.eventTitle}>{item.title}</Text>
                  <Text style={styles.eventType}>{item.category === 'Seminar' ? 'Online Event' : item.category}</Text>
                  <TouchableOpacity style={styles.removeBtn} onPress={() => unbookmarkEvent(item.id)}>
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
                ))
              ) : null}
            </ScrollView>
              </View>
        ) : null}
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