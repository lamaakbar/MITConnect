import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, FlatList, SafeAreaView, ScrollView as RNScrollView, Alert } from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';

// Empty data arrays - no mock data
const events: any[] = [];

const portalLinks = [
  { key: 'hub', label: 'Trainee Hub', icon: <MaterialIcons name="dashboard" size={28} color="#43C6AC" /> },
  { key: 'gallery', label: 'Gallery', icon: <Ionicons name="image-outline" size={28} color="#F7B801" /> },
  { key: 'inspire', label: 'Inspire Corner', icon: <Feather name="users" size={28} color="#43C6AC" /> },
  { key: 'bookclub', label: 'Book Club', icon: <Ionicons name="book-outline" size={28} color="#FF8C42" /> },
];

const featuredNews: any[] = [];

export default function TraineeHome() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const [registered, setRegistered] = useState<string[]>([]);
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Image source={require('../assets/images/icon.png')} style={styles.logo} />
        <Text style={styles.appName}><Text style={{ color: '#222' }}>MIT</Text><Text style={{ color: '#43C6AC' }}>Connect</Text></Text>
        <View style={styles.headerIcons}>
          <Ionicons name="globe-outline" size={22} color="#222" style={styles.headerIcon} />
          <Ionicons name="notifications-outline" size={22} color="#222" style={styles.headerIcon} />
          <Ionicons name="person-circle-outline" size={26} color="#222" />
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {featuredNews.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="star-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateTitle}>No Featured Content</Text>
            <Text style={styles.emptyStateText}>
              There are no featured highlights this week. Check back later for exciting updates!
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Featured This Week</Text>
            <FlatList
              data={featuredNews}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 18, paddingBottom: 8 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => router.push({ pathname: '/feature-details' })}
                >
                  <LinearGradient
                    colors={['#A259FF', '#3BB2B8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.featuredGradientCard}
                  >
                    <Image source={item.image} style={styles.featuredImage} />
                    <Text style={styles.featuredMonoText}>{item.text}</Text>
                    <View style={styles.featuredProgressBarBg}>
                      <View style={[styles.featuredProgressBar, { width: `${item.progress * 100}%` }]} />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            />
          </>
        )}
        
        {events.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateTitle}>No Upcoming Events</Text>
            <Text style={styles.emptyStateText}>
              There are no upcoming events scheduled. Check back later for exciting activities!
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            <FlatList
              data={events}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 8, paddingBottom: 8 }}
              renderItem={({ item }) => (
                <View style={styles.eventCard}>
                  <View style={styles.eventCardHeader}>
                    <Text style={styles.eventDaysLeft}>{item.daysLeft} days Left</Text>
                    <Ionicons name="ellipsis-horizontal" size={18} color="#bbb" />
                  </View>
                  <Text style={styles.eventTitle}>{item.title}</Text>
                  <Text style={styles.eventDesc}>{item.desc}</Text>
                  <TouchableOpacity
                    style={[styles.eventBtn, registered.includes(item.id) && { backgroundColor: '#aaa' }]}
                    onPress={() => {
                      setRegistered(prev => [...prev, item.id]);
                      Alert.alert('Registered', 'You have successfully registered for this event!');
                    }}
                    disabled={registered.includes(item.id)}
                    accessibilityLabel={`Register for ${item.title}`}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.eventBtnText}>
                      {registered.includes(item.id) ? 'Registered' : 'Register Now!'}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.eventCardFooter}>
                    <View style={styles.eventFooterItem}>
                      <Ionicons name="calendar-outline" size={16} color="#7B61FF" />
                      <Text style={styles.eventFooterText}>{item.date}</Text>
                    </View>
                    {item.time ? (
                      <View style={styles.eventFooterItem}>
                        <Ionicons name="time-outline" size={16} color="#7B61FF" />
                        <Text style={styles.eventFooterText}>{item.time}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              )}
            />
          </>
        )}
        <Text style={styles.sectionTitle}>Portal Access</Text>
        <View style={styles.portalRow}>
          {portalLinks.map(link => (
            <TouchableOpacity
              key={link.key}
              style={styles.portalIconBox}
              activeOpacity={0.8}
              onPress={() => {
                if (link.key === 'hub') router.push('/trainee-management');
                else if (link.key === 'gallery') router.push('/gallery');
                else if (link.key === 'inspire') router.push('/inspirer-corner');
                else if (link.key === 'bookclub') router.push('/bookclub');
              }}
            >
              {link.icon}
              <Text style={styles.portalLabel}>{link.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.sectionTitle}>Book of the Month</Text>
        <TouchableOpacity style={styles.featuredBookCard} onPress={() => router.push('/book-details')}>
          <Image source={{ uri: 'https://covers.openlibrary.org/b/id/7222246-L.jpg' }} style={styles.featuredBookCover} />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <View style={styles.genreChip}><Text style={styles.genreText}>Philosophical Fiction</Text></View>
            <Text style={styles.featuredBookTitle}>The Alchemist</Text>
            <Text style={styles.featuredBookAuthor}>By Paulo Coelho</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              {[1,2,3,4,5].map(i => (
                <MaterialIcons
                  key={i}
                  name={i <= 5 ? 'star' : 'star-border'}
                  size={20}
                  color="#F4B400"
                  style={{ marginRight: 2 }}
                />
              ))}
              <Text style={styles.ratingText}>4.9</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
              <Ionicons name="person" size={16} color="#888" style={{ marginRight: 4 }} />
              <Text style={styles.recommender}>Nizar Naghi</Text>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
      <RNScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bottomNavScroll}>
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navBtn} onPress={() => { setActiveTab('home'); router.push('/trainee-home'); }}>
            <Ionicons name="home" size={26} color={activeTab === 'home' ? '#43C6AC' : '#bbb'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => { setActiveTab('hub'); router.push('/trainee-management'); }}>
            <MaterialIcons name="dashboard" size={26} color={activeTab === 'hub' ? '#43C6AC' : '#bbb'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => { setActiveTab('gallery'); router.push('/gallery'); }}>
            <Ionicons name="image-outline" size={26} color={activeTab === 'gallery' ? '#43C6AC' : '#bbb'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => { setActiveTab('bookclub'); router.push('/bookclub'); }}>
            <Ionicons name="book-outline" size={26} color={activeTab === 'bookclub' ? '#43C6AC' : '#bbb'} />
          </TouchableOpacity>
          {/*
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => {
              setActiveTab('profile');
              router.push({ pathname: '/profile' });
            }}
          >
            <Ionicons name="person-circle-outline" size={26} color={activeTab === 'profile' ? '#43C6AC' : '#bbb'} />
          </TouchableOpacity>
          */}
        </View>
      </RNScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f6f7f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    marginRight: 6,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginHorizontal: 4,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginLeft: 18,
    marginTop: 18,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginLeft: 18,
    marginBottom: 18,
  },
  portalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 18,
    marginBottom: 18,
    marginTop: 8,
    gap: 12,
  },
  portalIconBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    minWidth: 70,
    width: '22%',
    maxWidth: 100,
    height: 90,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  portalLabel: {
    fontSize: 13,
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  bottomNavScroll: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minWidth: 400,
    paddingHorizontal: 12,
  },
  navBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    flex: 1,
  },
  featuredGradientCard: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 18,
    marginBottom: 12,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  featuredImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  featuredMonoText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  featuredProgressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  featuredProgressBar: {
    height: '100%',
    borderRadius: 4,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventDaysLeft: {
    fontSize: 12,
    color: '#43C6AC',
    fontWeight: '600',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  eventDesc: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  eventBtn: {
    backgroundColor: '#43C6AC',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  eventBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  eventCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  eventFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventFooterText: {
    fontSize: 12,
    color: '#7B61FF',
    marginLeft: 4,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  bookMore: {
    fontSize: 13,
    color: '#43C6AC',
    fontWeight: '600',
  },
  bookImg: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginLeft: 12,
  },
  featuredBookCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    alignItems: 'center',
  },
  featuredBookCover: {
    width: 110,
    height: 160,
    borderRadius: 12,
    backgroundColor: '#eee',
  },
  genreChip: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 2,
    backgroundColor: '#A3C9A8',
    marginBottom: 6,
  },
  genreText: {
    fontSize: 12,
    color: '#222',
    fontWeight: '500',
  },
  featuredBookTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
    marginTop: 2,
  },
  featuredBookAuthor: {
    fontSize: 15,
    color: '#888',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 15,
    color: '#222',
    marginLeft: 6,
    fontWeight: 'bold',
  },
  recommender: {
    fontSize: 13,
    color: '#888',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
    marginBottom: 20,
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