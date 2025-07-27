import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useEventContext } from '../components/EventContext';
import { useUserContext } from '../components/UserContext';
import { Ionicons, Feather } from '@expo/vector-icons';

const TABS = ['All', 'Upcoming', 'Past'];

// Helper function to determine event status based on date
const getEventStatus = (eventDate: string) => {
  const eventDateObj = new Date(eventDate);
  const today = new Date();
  
  if (eventDateObj < today) {
    // Past event - randomly assign Attended or Missed for demo
    return Math.random() > 0.3 ? 'Attended' : 'Missed';
  } else {
    return 'Registered';
  }
};

// Helper function to determine event type
const getEventType = (location: string) => {
  return location.toLowerCase().includes('online') ? 'Online' : 'MITC';
};

export default function MyEventsScreen() {
  const router = useRouter();
  const { events, registered, getUserEventStatus, markUserAsAttended } = useEventContext();
  const [activeTab, setActiveTab] = useState('All');
  const [userEventStatuses, setUserEventStatuses] = useState<{[key: string]: any}>({});

  console.log('My Events Screen - Total events:', events.length);
  console.log('My Events Screen - Registered events:', registered);
  console.log('My Events Screen - Registered array length:', registered.length);

  // Get only events that the user has registered for
  const userRegisteredEvents = events.filter(event => registered.includes(event.id));
  
  console.log('My Events Screen - User registered events:', userRegisteredEvents.length);

  // Load user event statuses
  useEffect(() => {
    const loadUserEventStatuses = async () => {
      const statuses: {[key: string]: any} = {};
      
      for (const event of userRegisteredEvents) {
        const userStatus = await getUserEventStatus(event.id);
        if (userStatus) {
          statuses[event.id] = userStatus;
        }
      }
      
      setUserEventStatuses(statuses);
    };

    if (userRegisteredEvents.length > 0) {
      loadUserEventStatuses();
    }
  }, [userRegisteredEvents, getUserEventStatus]);

  // Add status and type to each event
  const eventsWithStatus = userRegisteredEvents.map(event => {
    const userStatus = userEventStatuses[event.id];
    let status = 'Registered';
    
    if (userStatus) {
      if (userStatus.status === 'completed') {
        status = 'Completed';
      } else if (userStatus.status === 'attended') {
        status = 'Attended';
      } else if (userStatus.status === 'missed') {
        status = 'Missed';
      } else {
        // For past events that are still 'registered', determine if attended or missed
        const eventDate = new Date(event.date);
        const today = new Date();
        if (eventDate < today) {
          status = Math.random() > 0.3 ? 'Attended' : 'Missed';
        }
      }
    } else {
      // Fallback to date-based logic for demo
      const eventDate = new Date(event.date);
      const today = new Date();
      if (eventDate < today) {
        status = Math.random() > 0.3 ? 'Attended' : 'Missed';
      }
    }
    
    console.log(`Event "${event.title}" (${event.date}) -> Status: ${status}`);
    return {
      ...event,
      status: status,
      type: getEventType(event.location),
      userStatus: userStatus,
    };
  });

  // Filter events based on tab
  const filteredEvents = eventsWithStatus.filter(event => {
    let shouldInclude = false;
    if (activeTab === 'All') shouldInclude = true;
    if (activeTab === 'Upcoming') shouldInclude = event.status === 'Registered';
    if (activeTab === 'Past') shouldInclude = event.status === 'Attended' || event.status === 'Missed';
    
    console.log(`Filtering "${event.title}" (${event.status}) for tab "${activeTab}": ${shouldInclude}`);
    return shouldInclude;
  });

  const getActionButton = (event: any) => {
    switch (event.status) {
      case 'Registered':
        return { text: 'View Details', action: () => router.push({ pathname: 'event-details' as any, params: { id: event.id } }) };
      case 'Attended':
        return { text: 'Give Feedback', action: () => router.push({ pathname: 'event-feedback' as any, params: { id: event.id } }) };
      case 'Completed':
        return { text: 'View Details', action: () => router.push({ pathname: 'event-details' as any, params: { id: event.id } }) };
      case 'Missed':
        // Check if user has already completed this event (attended + feedback)
        if (event.userStatus && event.userStatus.status === 'completed') {
          return { text: 'Completed', action: () => {} };
        }
        return { text: 'Re-register', action: () => router.push({ pathname: 'event-details' as any, params: { id: event.id } }) };
      default:
        return { text: 'View Details', action: () => {} };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Registered':
        return '#43C6AC';
      case 'Attended':
        return '#4ECB71';
      case 'Completed':
        return '#4ECB71';
      case 'Missed':
        return '#FF6B6B';
      default:
        return '#888';
    }
  };

  const renderEventCard = ({ item }: { item: any }) => {
    const actionButton = getActionButton(item);
    
    return (
      <View style={styles.eventCard}>
        <View style={styles.eventContent}>
          <View style={styles.eventInfo}>
            <Text style={[styles.statusBadge, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.eventDetails}>{item.type} | {item.date}</Text>
            <TouchableOpacity style={styles.actionButton} onPress={actionButton.action}>
              <Text style={styles.actionButtonText}>{actionButton.text}</Text>
            </TouchableOpacity>
          </View>
          <Image source={item.image} style={styles.eventImage} />
        </View>
      </View>
    );
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
          <Feather name="globe" size={20} color="#222" style={styles.headerIcon} />
          <Feather name="bell" size={20} color="#222" style={styles.headerIcon} />
          <Feather name="user" size={20} color="#222" style={styles.headerIcon} />
        </View>
      </View>

      {/* Screen Title with Back Button */}
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>My Events</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
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

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color="#ccc" />
          <Text style={styles.emptyStateTitle}>No events found</Text>
          <Text style={styles.emptyStateText}>
            {activeTab === 'All' 
              ? "You haven't registered for any events yet."
              : activeTab === 'Upcoming'
              ? "You don't have any upcoming events."
              : "You don't have any past events."
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={item => item.id}
          renderItem={renderEventCard}
          contentContainerStyle={styles.eventsList}
          showsVerticalScrollIndicator={false}
        />
      )}

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
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 4,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  eventsList: {
    padding: 16,
    paddingBottom: 80,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  eventContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventInfo: {
    flex: 1,
    marginRight: 16,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  eventDetails: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#222',
  },
  eventImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 64,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
  },
}); 