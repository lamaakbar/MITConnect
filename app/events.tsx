import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ScrollView, StatusBar, ActivityIndicator, RefreshControl, Animated } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useEventContext } from '../components/EventContext';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../components/ThemeContext';
import { useThemeColor } from '../hooks/useThemeColor';
import { useUserContext } from '../components/UserContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EventCard from '../components/EventCard';
import eventService from '../services/EventService';

const EVENT_TABS = ['All', 'Upcoming', 'My Events'];

export default function EventsScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const { events, bookmarks, bookmarkEvent, unbookmarkEvent, registered, registerEvent, getUserEventStatus, searchEvents } = useEventContext();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [userEventStatuses, setUserEventStatuses] = useState<{[key: string]: any}>({});
  const [myEventsTab, setMyEventsTab] = useState<'Registered' | 'Bookmarked'>('Registered');
  const [refreshing, setRefreshing] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const { isDarkMode } = useTheme();
  
  // Enhanced theme-aware colors with better contrast
  const textColor = isDarkMode ? '#FFFFFF' : '#1A1A1A';
  const cardBackground = isDarkMode ? '#1E1E1E' : '#FFFFFF';
  const secondaryTextColor = isDarkMode ? '#B0B0B0' : '#666666';
  const borderColor = isDarkMode ? '#333333' : '#E5E5E5';
  const iconColor = isDarkMode ? '#FFFFFF' : '#1A1A1A';
  const { userRole, getHomeRoute, viewAs, setViewAs } = useUserContext();
  const insets = useSafeAreaInsets();
  
  // Debug viewAs state
  console.log('Events: viewAs state:', viewAs);
  console.log('Events: userRole:', userRole);
  
  // Dark mode specific colors
  const darkBg = '#121212';
  const darkCard = '#1E1E1E';
  const darkBorder = '#333333';
  const darkText = '#FFFFFF';
  const darkSecondary = '#B0B0B0';
  const darkHighlight = '#43C6AC';
  const darkSearchBg = '#2A2A2A';
  const darkTabBg = '#2A2A2A';
  const darkTabBorder = '#404040';
  const darkEmptyStateBg = '#2A2A2A';
  
  // Light mode specific colors
  const lightSearchBg = '#F8F9FA';
  const lightTabBg = '#FFFFFF';
  const lightTabBorder = '#E0E0E0';
  const lightEmptyStateBg = '#F8F9FA';
  
  // Tab colors for better visibility - ensuring consistency
  const activeTabBg = isDarkMode ? '#43C6AC' : '#2E7D32';
  const activeTabText = isDarkMode ? '#FFFFFF' : '#FFFFFF';
  const inactiveTabText = isDarkMode ? '#B0B0B0' : '#666666';
  const activeTabBorder = isDarkMode ? '#43C6AC' : '#2E7D32';
  const inactiveTabBorder = isDarkMode ? '#404040' : '#E0E0E0';
  
  // Helper function for consistent tab styling
  const getTabStyle = (isActive: boolean) => ({
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 28,
    backgroundColor: isActive ? activeTabBg : 'transparent',
    marginRight: 12,
    borderWidth: 2,
    borderColor: isActive ? activeTabBorder : inactiveTabBorder,
    shadowColor: isActive ? activeTabBg : 'transparent',
    shadowOpacity: isActive ? 0.3 : 0,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: isActive ? 4 : 0,
  });

  const getTabTextStyle = (isActive: boolean) => ({
    fontSize: 15,
    fontWeight: '600' as const,
    color: isActive ? activeTabText : inactiveTabText,
  });
  

  
  // Animation values
  const searchScale = new Animated.Value(1);
  const tabOpacity = new Animated.Value(1);
  
  const handleBack = () => {
    const homeRoute = getHomeRoute();
    if (pathname !== homeRoute) {
      if (homeRoute === '/home') {
        router.push('/home');
      } else if (homeRoute === '/admin-home') {
        router.push('/admin-home');
      } else if (homeRoute === '/employee-home') {
        router.push('/employee-home');
      } else if (homeRoute === '/trainee-home') {
        router.push('/trainee-home');
      } else {
        router.push('/home');
      }
    }
  };

  // Helper function to get registration count
  const getRegistrationCount = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    return event?.registeredCount || 0;
  };

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  // Search focus animations
  const onSearchFocus = () => {
    setSearchFocused(true);
    Animated.spring(searchScale, {
      toValue: 1.02,
      useNativeDriver: true,
    }).start();
  };

  const onSearchBlur = () => {
    setSearchFocused(false);
    Animated.spring(searchScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  // Tab change animation
  const handleTabChange = (tab: string) => {
    Animated.sequence([
      Animated.timing(tabOpacity, {
        toValue: 0.5,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(tabOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    setActiveTab(tab);
  };

  // Search effect
  useEffect(() => {
    const performSearch = async () => {
      if (search.trim()) {
        setIsSearching(true);
        try {
          const results = await searchEvents(search);
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

    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [search, searchEvents]);

  // Load user event statuses
  useEffect(() => {
    const loadUserEventStatuses = async () => {
      const statuses: {[key: string]: any} = {};
      
      const eventsToProcess = search.trim() ? searchResults : events;
      
      for (const event of eventsToProcess) {
        const userStatus = await getUserEventStatus(event.id);
        if (userStatus) {
          statuses[event.id] = userStatus;
        }
      }
      
      setUserEventStatuses(statuses);
    };

    if ((search.trim() ? searchResults : events).length > 0) {
      loadUserEventStatuses();
    }
  }, [events, searchResults, search, getUserEventStatus]);

  // Update event statuses when component mounts
  useEffect(() => {
    const updateStatuses = async () => {
      try {
        await eventService.updateAllEventStatuses();
      } catch (error) {
        console.error('Error updating event statuses:', error);
      }
    };
    
    updateStatuses();
  }, []);

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

  // Filter events based on tab
  let filteredEvents: any[] = [];
  
  if (activeTab === 'Upcoming') {
    filteredEvents = upcomingEvents;
  } else if (activeTab === 'Past') {
    filteredEvents = pastEvents;
  } else {
    filteredEvents = eventsToUse;
  }

  // Registered events for My Events tab
  const registeredEvents = events.filter(e => registered.includes(e.id));
  const bookmarkedEvents = events.filter(e => bookmarks.includes(e.id));

  // Helper function to get button text and state for an event
  const getEventButtonState = (eventId: string, eventDate: string, eventTime: string) => {
    const isPast = isEventInPast(eventDate, eventTime);
    const isRegistered = registered.includes(eventId);
    const isCompleted = userEventStatuses[eventId]?.status === 'completed';
    
    if (isCompleted) return { text: 'Completed', disabled: true };
    if (isRegistered) return { text: 'Registered', disabled: true };
    if (isPast) return { text: 'Event Passed', disabled: true };
    return { text: 'Register', disabled: false };
  };

  return (
    <View style={{ flex: 1, backgroundColor: (userRole === 'employee' || userRole === 'trainee') && isDarkMode ? darkCard : cardBackground }}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      {(userRole === 'employee' || userRole === 'trainee') && (
        <View style={{
          paddingTop: insets.top,
          backgroundColor: isDarkMode ? darkCard : cardBackground,
          borderBottomColor: isDarkMode ? darkBorder : borderColor,
          borderBottomWidth: 1,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
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
            {viewAs && (
              <Text style={{ color: '#FF6B6B', fontSize: 12, fontWeight: 'normal' }}> (Preview Mode)</Text>
            )}
          </Text>
          <View style={{ width: 32 }} />
        </View>
      )}
      
      {/* Enhanced Search Bar */}
      <Animated.View style={{
        marginTop: 16,
        transform: [{ scale: searchScale }],
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDarkMode ? darkSearchBg : lightSearchBg,
        borderRadius: 20,
        marginHorizontal: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 2,
        borderColor: searchFocused 
          ? '#43C6AC' 
          : isDarkMode ? darkBorder : '#E9ECEF',
        shadowColor: '#000',
        shadowOpacity: searchFocused ? 0.1 : 0.05,
        shadowRadius: searchFocused ? 8 : 4,
        shadowOffset: { width: 0, height: searchFocused ? 4 : 2 },
        elevation: searchFocused ? 4 : 2,
      }}>
        <Ionicons 
          name="search" 
          size={20} 
          color={searchFocused ? '#43C6AC' : (isDarkMode ? darkSecondary : secondaryTextColor)} 
          style={{ marginRight: 12 }} 
        />
        <TextInput
          style={{ flex: 1, fontSize: 16, color: isDarkMode ? darkText : textColor }}
          placeholder="Search events..."
          placeholderTextColor={isDarkMode ? darkSecondary : secondaryTextColor}
          value={search}
          onChangeText={setSearch}
          onFocus={onSearchFocus}
          onBlur={onSearchBlur}
        />
        {isSearching && (
          <ActivityIndicator size="small" color="#43C6AC" style={{ marginLeft: 8 }} />
        )}
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={{ marginLeft: 8 }}>
            <Ionicons name="close-circle" size={20} color={isDarkMode ? darkSecondary : secondaryTextColor} />
          </TouchableOpacity>
        )}
      </Animated.View>
      
      {/* Enhanced Tabs */}
      <Animated.View style={{
        marginTop: 16,
        opacity: tabOpacity,
        backgroundColor: isDarkMode ? darkTabBg : lightTabBg,
        borderBottomWidth: 1,
        borderBottomColor: isDarkMode ? darkBorder : borderColor,
        paddingHorizontal: 16,
        paddingVertical: 16,
      }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-start' }}>
            {EVENT_TABS.map(tab => {
              const isActive = activeTab === tab;
              return (
                                 <TouchableOpacity
                   key={tab}
                   style={getTabStyle(isActive)}
                   onPress={() => handleTabChange(tab)}
                   activeOpacity={0.8}
                 >
                   <Text style={getTabTextStyle(isActive)}>{tab}</Text>
                 </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </Animated.View>
      
      {/* Return to Admin Button - Only show in View As mode */}
      {viewAs && (
        <View style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: isDarkMode ? darkCard : cardBackground,
          borderBottomWidth: 1,
          borderBottomColor: isDarkMode ? darkBorder : borderColor,
        }}>
          <TouchableOpacity
            style={{
              backgroundColor: '#FF6B6B',
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#FF6B6B',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
            onPress={() => {
              setViewAs(null);
              router.replace('/admin-home');
            }}
          >
            <Ionicons name="arrow-back-circle" size={20} color="#fff" />
            <Text style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: '600',
              marginLeft: 8,
            }}>
              Return to Admin View
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      <View style={{ flex: 1 }}>
        {activeTab === 'All' ? (
          <ScrollView 
            contentContainerStyle={{ padding: 16 }} 
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#43C6AC']}
                tintColor="#43C6AC"
              />
            }
          >
            {/* Upcoming Events Section */}
            {upcomingEvents.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconContainer, { backgroundColor: isDarkMode ? darkEmptyStateBg : lightEmptyStateBg }]}>
                    <Ionicons name="calendar-outline" size={20} color="#43C6AC" />
                  </View>
                  <Text style={[styles.sectionTitle, { color: textColor }]}>Upcoming Events ({upcomingEvents.length})</Text>
                </View>
                {upcomingEvents.map((item, index) => (
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
                      if (!getEventButtonState(item.id, item.date, item.time).disabled) {
                        registerEvent(item.id);
                      }
                    }}
                    onPress={() => router.push({ pathname: '/event-details', params: { id: item.id } })}
                    buttonText={getEventButtonState(item.id, item.date, item.time).text}
                    buttonDisabled={getEventButtonState(item.id, item.date, item.time).disabled}
                    registrationCount={getRegistrationCount(item.id)}
                  />
                ))}
              </View>
            )}

            {/* Past Events Section */}
            {pastEvents.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconContainer, { backgroundColor: isDarkMode ? darkEmptyStateBg : lightEmptyStateBg }]}>
                    <Ionicons name="time-outline" size={20} color="#888" />
                  </View>
                  <Text style={[styles.sectionTitle, { color: textColor }]}>Past Events ({pastEvents.length})</Text>
                </View>
                {pastEvents.map(item => (
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
                      if (!getEventButtonState(item.id, item.date, item.time).disabled) {
                        registerEvent(item.id);
                      }
                    }}
                    onPress={() => router.push({ pathname: '/event-details', params: { id: item.id } })}
                    buttonText={getEventButtonState(item.id, item.date, item.time).text}
                    buttonDisabled={getEventButtonState(item.id, item.date, item.time).disabled}
                    registrationCount={getRegistrationCount(item.id)}
                  />
                ))}
              </View>
            )}

            {/* Enhanced Empty State */}
            {upcomingEvents.length === 0 && pastEvents.length === 0 && (
              <View style={styles.emptyState}>
                <View style={[styles.emptyStateIconContainer, { backgroundColor: isDarkMode ? darkEmptyStateBg : lightEmptyStateBg }]}>
                  <Ionicons name="calendar-outline" size={64} color={isDarkMode ? '#666' : '#ccc'} />
                </View>
                <Text style={[styles.emptyStateTitle, { color: textColor }]}>
                  {search.trim() ? 'No Events Found' : 'No Events Available'}
                </Text>
                <Text style={[styles.emptyStateText, { color: secondaryTextColor }]}>
                  {search.trim() 
                    ? `No events found matching "${search}". Try a different search term.`
                    : 'There are no events scheduled at the moment. Check back later for exciting activities!'
                  }
                </Text>
              </View>
            )}
          </ScrollView>
        ) : activeTab === 'Upcoming' ? (
          <FlatList
            data={upcomingEvents}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 16 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#43C6AC']}
                tintColor="#43C6AC"
              />
            }
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
                  if (!getEventButtonState(item.id, item.date, item.time).disabled) {
                    registerEvent(item.id);
                  }
                }}
                onPress={() => router.push({ pathname: '/event-details', params: { id: item.id } })}
                buttonText={getEventButtonState(item.id, item.date, item.time).text}
                buttonDisabled={getEventButtonState(item.id, item.date, item.time).disabled}
                registrationCount={getRegistrationCount(item.id)}
              />
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <View style={[styles.emptyStateIconContainer, { backgroundColor: isDarkMode ? darkEmptyStateBg : lightEmptyStateBg }]}>
                  <Ionicons name="calendar-outline" size={64} color={isDarkMode ? '#666' : '#ccc'} />
                </View>
                <Text style={[styles.emptyStateTitle, { color: textColor }]}>
                  {search.trim() ? 'No Upcoming Events Found' : 'No Upcoming Events'}
                </Text>
                <Text style={[styles.emptyStateText, { color: secondaryTextColor }]}>
                  {search.trim() 
                    ? `No upcoming events found matching "${search}". Try a different search term.`
                    : 'There are no upcoming events at the moment.'
                  }
                </Text>
              </View>
            )}
          />
        ) : activeTab === 'My Events' ? (
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16, marginBottom: 8 }}>
                             <TouchableOpacity
                 style={getTabStyle(myEventsTab === 'Registered')}
                 onPress={() => setMyEventsTab('Registered')}
                 activeOpacity={0.8}
               >
                 <Text style={getTabTextStyle(myEventsTab === 'Registered')}>Registered</Text>
               </TouchableOpacity>
               <TouchableOpacity
                 style={getTabStyle(myEventsTab === 'Bookmarked')}
                 onPress={() => setMyEventsTab('Bookmarked')}
                 activeOpacity={0.8}
               >
                 <Text style={getTabTextStyle(myEventsTab === 'Bookmarked')}>Bookmarked</Text>
               </TouchableOpacity>
            </View>
            <ScrollView 
              contentContainerStyle={{ padding: 16, paddingBottom: 32 }} 
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#43C6AC']}
                  tintColor="#43C6AC"
                />
              }
            >
              {myEventsTab === 'Registered' ? (
                registeredEvents.length === 0 ? (
                  <View style={styles.emptyState}>
                    <View style={[styles.emptyStateIconContainer, { backgroundColor: isDarkMode ? darkEmptyStateBg : lightEmptyStateBg }]}>
                      <Ionicons name="calendar-outline" size={48} color={isDarkMode ? darkSecondary : secondaryTextColor} />
                    </View>
                    <Text style={[styles.emptyStateTitle, { color: textColor }]}>No Registered Events</Text>
                    <Text style={[styles.emptyStateText, { color: secondaryTextColor }]}>You haven't registered for any events yet.</Text>
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
                      if (!getEventButtonState(item.id, item.date, item.time).disabled) {
                        registerEvent(item.id);
                      }
                    }}
                    onPress={() => router.push({ pathname: '/event-details', params: { id: item.id } })}
                    buttonText={getEventButtonState(item.id, item.date, item.time).text}
                    buttonDisabled={getEventButtonState(item.id, item.date, item.time).disabled}
                    registrationCount={getRegistrationCount(item.id)}
                  />
                ))
              ) : myEventsTab === 'Bookmarked' ? (
                bookmarkedEvents.length === 0 ? (
                  <View style={styles.emptyState}>
                    <View style={[styles.emptyStateIconContainer, { backgroundColor: isDarkMode ? darkEmptyStateBg : lightEmptyStateBg }]}>
                      <Ionicons name="bookmark-outline" size={48} color={isDarkMode ? darkSecondary : secondaryTextColor} />
                    </View>
                    <Text style={[styles.emptyStateTitle, { color: textColor }]}>No Bookmarks Yet</Text>
                    <Text style={[styles.emptyStateText, { color: secondaryTextColor }]}>You haven't bookmarked any events yet. Start exploring events and save the ones you're interested in!</Text>
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
                      if (!getEventButtonState(item.id, item.date, item.time).disabled) {
                        registerEvent(item.id);
                      }
                    }}
                    onPress={() => router.push({ pathname: '/event-details', params: { id: item.id } })}
                    buttonText={getEventButtonState(item.id, item.date, item.time).text}
                    buttonDisabled={getEventButtonState(item.id, item.date, item.time).disabled}
                    registrationCount={getRegistrationCount(item.id)}
                  />
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyStateIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
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
    paddingHorizontal: 4,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 