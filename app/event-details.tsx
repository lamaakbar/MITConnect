import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Share, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEventContext } from '../components/EventContext';
import { Ionicons, Feather } from '@expo/vector-icons';
import EventsTabBar from '../components/EventsTabBar';

export default function EventDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { events, registerEvent, registered, bookmarks, bookmarkEvent, unbookmarkEvent } = useEventContext();
  const event = events.find(e => e.id === id);

  if (!event) return <View style={styles.center}><Text>Event not found</Text></View>;

  const isBookmarked = bookmarks.includes(event.id);
  const isRegistered = registered.includes(event.id);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${event.title}\n${event.desc}\n${event.date} ${event.time} @ ${event.location}`,
      });
    } catch (error) {}
  };

  const handleRegister = () => {
    console.log('Event Details: Register button pressed for event:', event.id);
    console.log('Current registered events:', registered);
    if (isRegistered) {
      console.log('Already registered, showing alert');
      Alert.alert('You\'re already registered');
      return;
    }
    console.log('Registering event...');
    registerEvent(event.id);
    console.log('After registration, navigating to success screen');
    router.push('registration-success' as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header with back and share */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.replace('/events')} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Details</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
          <Feather name="share-2" size={22} color="#222" />
        </TouchableOpacity>
      </View>
      {/* Event Image and Bookmark */}
      <View style={styles.imageContainer}>
        <Image source={event.image} style={styles.eventImage} />
        <TouchableOpacity
          style={styles.bookmarkBtn}
          onPress={() => isBookmarked ? unbookmarkEvent(event.id) : bookmarkEvent(event.id)}
        >
          <Ionicons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={isBookmarked ? '#43C6AC' : '#888'}
          />
        </TouchableOpacity>
      </View>
      {/* Event Info */}
      <View style={{ paddingHorizontal: 20 }}>
        <Text style={styles.eventCategory}>{event.category}</Text>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.eventDesc}>{event.desc}</Text>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={20} color="#43C6AC" style={styles.infoIcon} />
          <Text style={styles.infoText}>{event.date}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={20} color="#43C6AC" style={styles.infoIcon} />
          <Text style={styles.infoText}>{event.time}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={20} color="#43C6AC" style={styles.infoIcon} />
          <Text style={styles.infoText}>{event.location}</Text>
        </View>
        <TouchableOpacity
          style={[styles.registerBtn, isRegistered && styles.registerBtnDisabled]}
          onPress={handleRegister}
          disabled={isRegistered}
          activeOpacity={0.7}
        >
          <Text style={[styles.registerBtnText, isRegistered && styles.registerBtnTextDisabled]}>
            {isRegistered ? 'Registered' : 'Register'}
          </Text>
        </TouchableOpacity>
      </View>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 32,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  iconBtn: {
    padding: 8,
  },
  imageContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    position: 'relative',
  },
  eventImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
    marginBottom: 8,
  },
  bookmarkBtn: {
    position: 'absolute',
    top: 10,
    right: 30,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
    elevation: 2,
  },
  eventCategory: {
    backgroundColor: '#e0f7f4',
    color: '#222',
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 8,
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#222',
  },
  eventDesc: {
    fontSize: 15,
    color: '#444',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 15,
    color: '#222',
  },
  registerBtn: {
    backgroundColor: '#43C6AC',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 18,
  },
  registerBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  registerBtnDisabled: {
    backgroundColor: '#b3e6e0',
    opacity: 0.7,
  },
  registerBtnTextDisabled: {
    color: '#888',
  },
}); 