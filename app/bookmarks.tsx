import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useEventContext } from '../components/EventContext';
import { useUserContext } from '../components/UserContext';
import { Ionicons } from '@expo/vector-icons';
import EventsTabBar from '../components/EventsTabBar';

export default function BookmarksScreen() {
  const router = useRouter();
  const { events, bookmarks, unbookmarkEvent } = useEventContext();
  const { getHomeRoute } = useUserContext();
  const bookmarkedEvents = events.filter(e => bookmarks.includes(e.id));

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header with back */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.replace(getHomeRoute() as any)} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bookmarked Events</Text>
        <View style={{ width: 32 }} />
      </View>
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
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateTitle}>No Bookmarks Yet</Text>
            <Text style={styles.emptyStateText}>
              You haven't bookmarked any events yet. Start exploring events and save the ones you're interested in!
            </Text>
          </View>
        }
      />
      <EventsTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
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
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f6f7f9',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  eventImage: {
    width: 80,
    height: 60,
    borderRadius: 10,
    marginRight: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  eventType: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
  },
  removeBtn: {
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
  },
  removeBtnText: {
    color: '#43C6AC',
    fontWeight: 'bold',
    fontSize: 15,
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
}); 