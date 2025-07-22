import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTheme } from '../components/ThemeContext';
import AdminTabBar from '../components/AdminTabBar';
import AdminHeader from '../components/AdminHeader';
import { Colors } from '@/constants/Colors';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';

const mockEvents = [
  {
    id: '1',
    title: 'Technology Table Tennis',
    attendees: [
      'Hassan Ahmed',
      'Mona Khateeb',
      'Lama Akbar',
      'Youseef Naytah',
      'Khalid Alkhaibari',
    ],
  },
  {
    id: '2',
    title: 'AI in Business Conference',
    attendees: [
      'Bayan Alsahafi',
      'Hadeel Kufiah',
      'Hassan Ahmed',
      'Mona Khateeb',
      'Lama Akbar',
    ],
  },
  {
    id: '3',
    title: 'Design Thinking Workshop',
    attendees: [
      'Youseef Naytah',
      'Khalid Alkhaibari',
      'Bayan Alsahafi',
      'Hadeel Kufiah',
      'Hassan Ahmed',
    ],
  },
];

export default function EventsManagement() {
  const { isDarkMode } = useTheme();
  const [selectedTab, setSelectedTab] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false); // For future add event modal
  const FILTERS = ['All', 'Upcoming', 'Past'];
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = isDarkMode ? '#23272b' : '#fff';
  const secondaryTextColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'background');
  const iconBg = isDarkMode ? Colors.dark.icon : Colors.light.icon;
  const iconColor = isDarkMode ? Colors.dark.tint : Colors.light.tint;
  // Inline theme-aware colors for search bar and tabs
  const tabBg = isDarkMode ? '#23272b' : '#F2F4F7';
  const tabActiveBg = '#3CB371';
  const tabText = isDarkMode ? '#ECEDEE' : '#222';
  const tabInactiveText = isDarkMode ? '#9BA1A6' : '#222';
  const searchBg = isDarkMode ? '#23272b' : '#fff';
  const searchPlaceholder = isDarkMode ? '#9BA1A6' : '#888';

  const filteredEvents = mockEvents.filter(event => {
    if (selectedTab === 'All') return true;
    // Add your logic for 'Upcoming' and 'Past' here, e.g. by event.date
    // For now, just return false for demonstration
    return false;
  });

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }}>
      <AdminHeader title="" />
      <View style={[styles.container, { backgroundColor, flex: 1 }]}> 
        {/* Search Bar - all styles inline */}
        <ThemedView style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 12, margin: 16, paddingHorizontal: 12, height: 44 }}>
          <Ionicons name="search" size={20} color={searchPlaceholder} style={{ marginRight: 8 }} />
          <ThemedText style={{ color: searchPlaceholder, fontSize: 16 }}>Search events</ThemedText>
        </ThemedView>
        {/* Filter Tabs - all styles inline */}
        <ThemedView style={{ flexDirection: 'row', marginHorizontal: 16, marginBottom: 16 }}>
          {FILTERS.map((filter) => (
            <ThemedView
              key={filter}
              style={{
                flex: 1,
                backgroundColor: selectedTab === filter ? tabActiveBg : tabBg,
                borderRadius: 12,
                marginRight: filter !== 'Past' ? 8 : 0,
                alignItems: 'center',
                justifyContent: 'center',
                height: 44,
              }}
            >
              <TouchableOpacity
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}
                onPress={() => setSelectedTab(filter)}
                activeOpacity={0.8}
              >
                <ThemedText style={{
                  color: selectedTab === filter ? '#fff' : tabInactiveText,
                  fontWeight: 'bold',
                  fontSize: 16,
                }}>{filter}</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          ))}
        </ThemedView>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* Events List */}
          {filteredEvents.map((event, index) => (
            <ThemedView key={event.id} style={[styles.eventCard, { backgroundColor: cardBackground, borderColor }]}> 
              <TouchableOpacity activeOpacity={0.7}>
                <View style={styles.eventHeader}>
                  <View style={[styles.eventIconContainer, { backgroundColor: iconBg }]}> 
                    <Ionicons name="calendar-outline" size={24} color={iconColor} />
                  </View>
                  <View style={styles.eventInfo}>
                    <ThemedText style={[styles.eventTitle]}>{event.title}</ThemedText>
                    <ThemedText style={[styles.attendeeCount]}> {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}</ThemedText>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={secondaryTextColor} />
                </View>
                <View style={styles.attendeesSection}>
                  <ThemedText style={[styles.attendeesTitle]}>Attendees:</ThemedText>
                  {event.attendees.length === 0 ? (
                    <ThemedText style={[styles.noAttendees]}>No attendees yet.</ThemedText>
                  ) : (
                    <View style={styles.attendeesList}>
                      {event.attendees.map((name, idx) => (
                        <View key={idx} style={styles.attendeeItem}>
                          <View style={[styles.attendeeAvatar, { backgroundColor: iconBg }]}> 
                            <ThemedText style={styles.attendeeInitial}>{name.charAt(0)}</ThemedText>
                          </View>
                          <ThemedText style={[styles.attendeeName]}>{name}</ThemedText>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </ThemedView>
          ))}
          {mockEvents.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={secondaryTextColor} />
              <Text style={[styles.emptyText, { color: secondaryTextColor }]}>No events found</Text>
            </View>
          )}
        </ScrollView>
        <AdminTabBar activeTab="events" />
        {AddEventFAB}
      </View>
      {/* Future: Add Event Modal can go here, controlled by showAddModal */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 4,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginLeft: 20,
    marginBottom: 16,
  },
  eventCard: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  attendeeCount: {
    fontSize: 12,
  },
  attendeesSection: {
    marginTop: 8,
  },
  attendeesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  attendeesList: {
    gap: 8,
  },
  attendeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  attendeeAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  attendeeInitial: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  attendeeName: {
    fontSize: 14,
  },
  noAttendees: {
    fontStyle: 'italic',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 64,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 8,
  },
}); 