import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useEventContext } from '../components/EventContext';
import { Ionicons, Feather } from '@expo/vector-icons';
import EventsTabBar from '../components/EventsTabBar';

const TABS = ['All', 'Upcoming', 'Past'];

export default function EventsScreen() {
  const router = useRouter();
  const { events, bookmarks, bookmarkEvent, unbookmarkEvent, registered, registerEvent } = useEventContext();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  // Filter events based on tab and search
  const filteredEvents = events.filter(e => {
    if (activeTab === 'Upcoming') return true; // TODO: Add real date logic
    if (activeTab === 'Past') return false; // TODO: Add real date logic
    return true;
  }).filter(e => e.title.toLowerCase().includes(search.toLowerCase()));

  const featured = events.find(e => e.featured);
  const allEvents = events.filter(e => !e.featured);

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
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Featured Event */}
        {featured && (
          <View style={styles.featuredCard}>
            <Image source={featured.image} style={styles.featuredImage} />
            <Text style={styles.featuredTitle}>{featured.title}</Text>
            <Text style={styles.featuredDesc}>{featured.desc}</Text>
            <Text style={styles.featuredMeta}>{featured.date} • {featured.time} • {featured.location}</Text>
            <TouchableOpacity
              style={[styles.registerBtn, registered.includes(featured.id) && styles.registerBtnDisabled]}
              onPress={() => {
                console.log('Button pressed for event:', featured.id);
                console.log('Current registered events:', registered);
                registerEvent(featured.id);
                console.log('After registration, registered events:', [...registered, featured.id]);
                router.push('registration-success' as any);
              }}
              disabled={registered.includes(featured.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.registerBtnText, registered.includes(featured.id) && styles.registerBtnTextDisabled]}>
                {registered.includes(featured.id) ? 'Registered' : 'Register'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {/* All Events */}
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
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 8,
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
}); 