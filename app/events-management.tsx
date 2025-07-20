import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import AdminTabBar from '../components/AdminTabBar';

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
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  const borderColor = isDarkMode ? '#2A2A2A' : '#E0E0E0';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Header */}
        <View style={styles.header}>
          <MaterialIcons name="event" size={32} color={isDarkMode ? '#3CB371' : '#004080'} style={{ marginRight: 8 }} />
          <Text style={[styles.headerTitle, { color: textColor }]}>
            <Text style={{ color: '#3CB371' }}>Events</Text> Management
          </Text>
        </View>
        <Text style={[styles.headerSubtitle, { color: secondaryTextColor }]}>Manage your events and attendees</Text>

        {/* Events List */}
        {mockEvents.map((event, index) => (
          <TouchableOpacity 
            key={event.id} 
            style={[styles.eventCard, { backgroundColor: cardBackground, borderColor }]}
            activeOpacity={0.7}
          >
            <View style={styles.eventHeader}>
              <View style={[styles.eventIconContainer, { backgroundColor: isDarkMode ? 'rgba(60, 179, 113, 0.2)' : 'rgba(60, 179, 113, 0.1)' }]}>
                <Ionicons name="calendar-outline" size={24} color={isDarkMode ? '#3CB371' : '#004080'} />
              </View>
              <View style={styles.eventInfo}>
                <Text style={[styles.eventTitle, { color: textColor }]}>{event.title}</Text>
                <Text style={[styles.attendeeCount, { color: secondaryTextColor }]}>
                  {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={secondaryTextColor} />
            </View>
            
            <View style={styles.attendeesSection}>
              <Text style={[styles.attendeesTitle, { color: textColor }]}>Attendees:</Text>
              {event.attendees.length === 0 ? (
                <Text style={[styles.noAttendees, { color: secondaryTextColor }]}>No attendees yet.</Text>
              ) : (
                <View style={styles.attendeesList}>
                  {event.attendees.map((name, idx) => (
                    <View key={idx} style={styles.attendeeItem}>
                      <View style={[styles.attendeeAvatar, { backgroundColor: isDarkMode ? '#3CB371' : '#004080' }]}>
                        <Text style={styles.attendeeInitial}>{name.charAt(0)}</Text>
                      </View>
                      <Text style={[styles.attendeeName, { color: textColor }]}>{name}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}

        {mockEvents.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={secondaryTextColor} />
            <Text style={[styles.emptyText, { color: secondaryTextColor }]}>No events found</Text>
          </View>
        )}
      </ScrollView>
      
      {/* Bottom Tab Bar */}
      <AdminTabBar activeTab="events" isDarkMode={isDarkMode} />
    </View>
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