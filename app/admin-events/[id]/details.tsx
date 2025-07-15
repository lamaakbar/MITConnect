import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const mockEvent = {
  id: '1',
  title: 'Technology Table Tennis',
  date: '2025-07-22',
  time: '12:00 PM - 1:00 PM',
  location: 'MITC, Jeddah',
  coverImage: require('../../../assets/images/partial-react-logo.png'),
  attendees: [
    { name: 'John Smith', id: '903258' },
    { name: 'Jane Doe', id: '909485' },
    { name: 'Michael Johnson', id: '907647' },
    { name: 'Emily Davis', id: '903476' },
  ],
};

const EventDetailsScreen: React.FC = () => {
  const { id } = useLocalSearchParams();
  // In a real app, fetch event by id
  const event = mockEvent;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Header (logo and title row can be added if needed) */}
      <Image source={event.coverImage} style={styles.coverImage} />
      {/* Bookmark icon placeholder */}
      <View style={styles.bookmarkIconBox}>
        <Ionicons name="bookmark-outline" size={28} color="#222" />
      </View>
      <Text style={styles.title}>{event.title}</Text>
      {/* Date, Time, Location */}
      <View style={styles.infoRow}>
        <View style={styles.infoIconBox}><MaterialIcons name="calendar-today" size={20} color="#222" /></View>
        <Text style={styles.infoText}>July  22, 2025</Text>
      </View>
      <View style={styles.infoRow}>
        <View style={styles.infoIconBox}><Ionicons name="time-outline" size={20} color="#222" /></View>
        <Text style={styles.infoText}>{event.time}</Text>
      </View>
      <View style={styles.infoRow}>
        <View style={styles.infoIconBox}><Ionicons name="location-outline" size={20} color="#222" /></View>
        <Text style={styles.infoText}>{event.location}</Text>
      </View>
      {/* Attendees */}
      <Text style={styles.attendeeTitle}>Events  Attendee</Text>
      <FlatList
        data={event.attendees}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.attendeeRow}>
            <Text style={styles.attendeeName}>{item.name}</Text>
            <Text style={styles.attendeeId}>{item.id}</Text>
          </View>
        )}
        scrollEnabled={false}
        style={{ marginBottom: 24 }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: '#fff',
  },
  container: {
    padding: 0,
    backgroundColor: '#fff',
    alignItems: 'stretch',
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
    color: '#222',
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
    backgroundColor: '#F3F5F2',
    borderRadius: 8,
    padding: 6,
    marginRight: 10,
  },
  infoText: {
    fontSize: 15,
    color: '#222',
  },
  attendeeTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 16,
    color: '#222',
  },
  attendeeRow: {
    borderTopWidth: 1,
    borderTopColor: '#D6E3D7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  attendeeName: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#222',
  },
  attendeeId: {
    fontSize: 14,
    color: '#444',
    marginTop: 2,
  },
});

export default EventDetailsScreen; 