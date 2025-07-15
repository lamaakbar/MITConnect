import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

// Mock data for events
const mockEvents = [
  {
    id: '1',
    title: 'Technology Table Tennis',
    type: 'Workshop',
    date: '2024-06-24',
    time: '12:00 PM',
    location: 'MITC, Grand floor',
    description: 'A fun table tennis event with a tech twist!',
    coverImage: require('../../assets/images/partial-react-logo.png'),
    featured: true,
  },
  {
    id: '2',
    title: 'AI in Business Conference',
    type: 'Seminar',
    date: '2025-01-20',
    time: '8:00 AM',
    location: 'Digital Banking Center',
    description: 'Explore the future of AI in business.',
    coverImage: require('../../assets/images/react-logo.png'),
    featured: false,
  },
  {
    id: '3',
    title: 'Design Thinking Workshop',
    type: 'Workshop',
    date: '2024-12-05',
    time: '10:00 AM',
    location: 'MITC',
    description: 'Hands-on workshop on design thinking.',
    coverImage: require('../../assets/images/splash-icon.png'),
    featured: false,
  },
];

const FILTERS = ['All', 'Upcoming', 'Past'];

const AdminEventListScreen: React.FC = () => {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  // Filter events based on filter selection (mock logic)
  const featuredEvent = mockEvents.find((e) => e.featured);
  const filteredEvents = mockEvents.filter((e) => !e.featured);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.logoText}>MIT<Text style={{ color: '#4ECB71' }}>Connect</Text></Text>
        <Pressable style={styles.menuButton}>
          <Ionicons name="menu" size={28} color="#222" />
        </Pressable>
      </View>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#B0B0B0" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search events"
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#B0B0B0"
        />
      </View>
      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTERS.map((filter) => (
          <Pressable
            key={filter}
            style={[styles.filterButton, selectedFilter === filter && styles.filterButtonActive]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}>{filter}</Text>
          </Pressable>
        ))}
        <View style={{ flex: 1 }} />
        <Pressable style={styles.addButton} onPress={() => router.push('/admin-events/add')}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </Pressable>
      </View>
      {/* Featured Event */}
      {featuredEvent && (
        <View style={styles.featuredCard}>
          <Image source={featuredEvent.coverImage} style={styles.featuredImage} />
          <Text style={styles.featuredTitle}>{featuredEvent.title}</Text>
          <View style={styles.featuredInfoRow}>
            <MaterialIcons name="location-on" size={18} color="#4ECB71" style={{ marginRight: 4 }} />
            <Text style={styles.featuredInfoText}>{featuredEvent.location}</Text>
          </View>
          <View style={styles.featuredInfoRow}>
            <Ionicons name="time-outline" size={18} color="#4ECB71" style={{ marginRight: 4 }} />
            <Text style={styles.featuredInfoText}>{featuredEvent.time}, {formatDate(featuredEvent.date)}</Text>
          </View>
          <Pressable
            style={styles.editButton}
            onPress={() => router.push(`/admin-events/${featuredEvent.id}/edit`)}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </Pressable>
        </View>
      )}
      {/* All Events */}
      <Text style={styles.allEventsTitle}>All Events</Text>
      <View style={styles.eventListContainer}>
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.eventRow}>
              <Image source={item.coverImage} style={styles.eventImage} />
              <View style={{ flex: 1 }}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventLocation}>{item.location} · {formatDate(item.date)}, {item.time}</Text>
              </View>
              <View style={styles.eventActions}>
                <Pressable
                  style={styles.actionBtn}
                  onPress={() => router.push(`/admin-events/${item.id}/edit`)}
                >
                  <Text style={styles.actionBtnText}>Edit</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: '#E8F8F5', marginLeft: 6 }]}
                  onPress={() => router.push(`/admin-events/${item.id}/details`)}
                >
                  <Text style={[styles.actionBtnText, { color: '#004080' }]}>Attendees</Text>
                </Pressable>
              </View>
            </View>
          )}
          style={{ marginTop: 8 }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#F8FFFA',
    paddingBottom: 24,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FFFA',
    paddingHorizontal: 16,
    paddingTop: 48,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
    color: '#222',
    flex: 1,
  },
  menuButton: {
    padding: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F4F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#222',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterButton: {
    backgroundColor: '#F2F4F7',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#4ECB71',
  },
  filterText: {
    color: '#222',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#4ECB71',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginLeft: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  featuredCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    alignItems: 'center',
  },
  featuredImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginBottom: 8,
    resizeMode: 'contain',
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  featuredInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  featuredInfoText: {
    fontSize: 14,
    color: '#222',
  },
  editButton: {
    marginTop: 12,
    backgroundColor: '#4ECB71',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  allEventsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#222',
  },
  eventListContainer: {
    flexGrow: 0,
    maxHeight: 340,
    marginBottom: 16,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  eventImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
    resizeMode: 'cover',
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  eventLocation: {
    fontSize: 13,
    color: '#888',
  },
  eventActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionBtn: {
    backgroundColor: '#4ECB71',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default AdminEventListScreen; 