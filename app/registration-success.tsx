import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useEventContext } from '../components/EventContext';
import { useUserContext } from '../components/UserContext';
import { Ionicons } from '@expo/vector-icons';
import EventsTabBar from '../components/EventsTabBar';

export default function RegistrationSuccessScreen() {
  const router = useRouter();
  const { events, registered } = useEventContext();
  const { getHomeRoute } = useUserContext();
  // Get the last registered event
  const lastRegisteredId = registered.length > 0 ? registered[registered.length - 1] : null;
  const event = lastRegisteredId ? events.find(e => e.id === lastRegisteredId) : null;

  if (!event) return <View style={styles.center}><Text>No event found.</Text></View>;

  const handleAddToCalendar = () => {
    Alert.alert('Calendar', 'Event added to your calendar (simulated).');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header with back */}
      <TouchableOpacity onPress={() => router.replace('/events')} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color="#222" />
      </TouchableOpacity>
      <Text style={styles.successTitle}>You're successfully registered!</Text>
      <View style={styles.imageContainer}>
        <Image source={event.image} style={styles.eventImage} />
      </View>
      <Text style={styles.eventTitle}>{event.title}</Text>
      <Text style={styles.eventDesc}>{event.desc}</Text>
      <TouchableOpacity style={styles.calendarBtn} onPress={handleAddToCalendar}>
        <Text style={styles.calendarBtnText}>Add to Calendar</Text>
        <Ionicons name="calendar-outline" size={20} color="#222" style={{ marginLeft: 8 }} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.doneBtn} onPress={() => router.replace(getHomeRoute() as any)}>
        <Text style={styles.doneBtnText}>Done</Text>
      </TouchableOpacity>
      <EventsTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    marginTop: 40,
    marginLeft: 16,
    marginBottom: 8,
    alignSelf: 'flex-start',
    padding: 8,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  eventImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  eventDesc: {
    fontSize: 15,
    color: '#444',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  calendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'center',
    marginBottom: 16,
  },
  calendarBtnText: {
    fontSize: 16,
    color: '#222',
    fontWeight: 'bold',
  },
  doneBtn: {
    backgroundColor: '#b3e6e0',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignSelf: 'center',
    marginTop: 8,
  },
  doneBtnText: {
    fontSize: 18,
    color: '#43C6AC',
    fontWeight: 'bold',
  },
}); 