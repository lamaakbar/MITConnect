import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useEventContext } from '../components/EventContext';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import EventsTabBar from '../components/EventsTabBar';

const TABS = ['All', 'Upcoming', 'Past'];

export default function EventsScreen() {
  const router = useRouter();
  const { events, bookmarks, bookmarkEvent, unbookmarkEvent, registered, registerEvent, getUserEventStatus } = useEventContext();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [userEventStatuses, setUserEventStatuses] = useState<{[key: string]: any}>({});

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
    <View style={{ flex: 1, backgroundColor: '#f6f7f9' }}>
      {/* App Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image source={require('../assets/images/icon.png')} style={{ width: 32, height: 32, marginRight: 8 }} />
          <Text style={styles.headerTitle}>MIT<Text style={{ color: '#43C6AC' }}>Connect</Text></Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.push('/my-events' as any)} style={styles.headerIcon}>
            <Feather name="calendar" size={20} color="#222" />
          </TouchableOpacity>
          <Feather name="globe" size={20} color="#222" style={styles.headerIcon} />
          <Feather name="bell" size={20} color="#222" style={styles.headerIcon} />
          <Feather name="user" size={20} color="#222" style={styles.headerIcon} />
        </View>
      </View>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#888" style={{ marginRight: 8 }} />
        <TextInput
          style={{ flex: 1, fontSize: 16 }}
          placeholder="Search events..."
          value={search}
          onChangeText={setSearch}
        />
      </View>
      {/* Tabs and My Events Button */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabsRow}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={styles.myEventsButton}
          onPress={() => router.push('/my-events' as any)}
        >
          <MaterialIcons name="event-available" size={20} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.myEventsButtonText}>My Events</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
<<<<<<< HEAD
        {/* Empty State */}
        {events.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateTitle}>No Events Available</Text>
            <Text style={styles.emptyStateText}>
              There are no events scheduled at the moment. Check back later for exciting activities!
            </Text>
=======
        {/* Featured Event */}
        {featured && (
          <View style={styles.featuredCard}>
            <Image source={featured.image} style={styles.featuredImage} />
            <Text style={styles.featuredTitle}>{featured.title}</Text>
            <Text style={styles.featuredDesc}>{featured.desc}</Text>
            <Text style={styles.featuredMeta}>{featured.date} • {featured.time} • {featured.location}</Text>
            <TouchableOpacity
              style={[styles.registerBtn, getEventButtonState(featured.id, featured.date).disabled && styles.registerBtnDisabled]}
              onPress={async () => {
                console.log('Button pressed for event:', featured.id);
                console.log('Current registered events:', registered);
                const success = await registerEvent(featured.id);
                if (success) {
                  console.log('After registration, registered events:', [...registered, featured.id]);
                  router.push('registration-success' as any);
                } else {
                  console.log('Registration failed - event may have passed or user already completed');
                }
              }}
              disabled={getEventButtonState(featured.id, featured.date).disabled}
              activeOpacity={0.7}
            >
              <Text style={[styles.registerBtnText, getEventButtonState(featured.id, featured.date).disabled && styles.registerBtnTextDisabled]}>
                {getEventButtonState(featured.id, featured.date).text}
              </Text>
            </TouchableOpacity>
>>>>>>> eeb9c86659111ac5ee704886c9945b524298f82b
          </View>
        ) : (
          <>
            {/* Featured Event */}
            {featured && (
              <View style={styles.featuredCard}>
                <Image source={featured.image} style={styles.featuredImage} />
                <Text style={styles.featuredTitle}>{featured.title}</Text>
                <Text style={styles.featuredDesc}>{featured.desc}</Text>
                <Text style={styles.featuredMeta}>{featured.date} • {featured.time} • {featured.location}</Text>
                <TouchableOpacity
                  style={[styles.registerBtn, (registered.includes(featured.id) || userEventStatuses[featured.id]?.status === 'completed') && styles.registerBtnDisabled]}
                  onPress={async () => {
                    console.log('Button pressed for event:', featured.id);
                    console.log('Current registered events:', registered);
                    const success = await registerEvent(featured.id);
                    if (success) {
                      console.log('After registration, registered events:', [...registered, featured.id]);
                      router.push('registration-success' as any);
                    } else {
                      console.log('Registration failed - user may have already completed this event');
                    }
                  }}
                  disabled={registered.includes(featured.id) || userEventStatuses[featured.id]?.status === 'completed'}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.registerBtnText, (registered.includes(featured.id) || userEventStatuses[featured.id]?.status === 'completed') && styles.registerBtnTextDisabled]}>
                    {userEventStatuses[featured.id]?.status === 'completed' ? 'Completed' : registered.includes(featured.id) ? 'Registered' : 'Register'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            {/* All Events */}
            {filteredEvents.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>All Events</Text>
                <FlatList
                  data={filteredEvents}
                  keyExtractor={item => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.eventCard}
                      onPress={() => router.push({ pathname: 'event-details' as any, params: { id: item.id } })}
                    >
                      <Image source={item.image} style={styles.eventImage} />
                      <TouchableOpacity
                        style={styles.bookmarkIcon}
                        onPress={() => bookmarks.includes(item.id) ? unbookmarkEvent(item.id) : bookmarkEvent(item.id)}
                      >
                        <Ionicons
                          name={bookmarks.includes(item.id) ? 'bookmark' : 'bookmark-outline'}
                          size={22}
                          color={bookmarks.includes(item.id) ? '#43C6AC' : '#888'}
                        />
                      </TouchableOpacity>
                      <Text style={styles.eventTitle}>{item.title}</Text>
                      <Text style={styles.eventDate}>{item.date}</Text>
                      {registered.includes(item.id) && (
                        <View style={styles.registeredBadge}>
                          <Text style={styles.registeredBadgeText}>Registered</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                />
              </>
            )}
            {/* No events match search */}
            {events.length > 0 && filteredEvents.length === 0 && search.length > 0 && (
              <View style={styles.emptySearchState}>
                <Ionicons name="search-outline" size={48} color="#ccc" />
                <Text style={styles.emptyStateTitle}>No Events Found</Text>
                <Text style={styles.emptyStateText}>
                  No events match your search "{search}". Try different keywords.
                </Text>
              </View>
            )}
          </>
        )}
        <EventsTabBar />
      </ScrollView>
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
  },
  eventImage: {
    width: '100%',
    height: 80,
    borderRadius: 12,
    marginBottom: 8,
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