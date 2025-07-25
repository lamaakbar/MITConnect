import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, FlatList, SafeAreaView, ScrollView as RNScrollView, Alert, Modal, TextInput } from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import { useEventContext } from '../components/EventContext';
import { useUserContext } from '../components/UserContext';
import RoleGuard from '../components/RoleGuard';
import { useTheme } from '../components/ThemeContext';
import { useThemeColor } from '../hooks/useThemeColor';
import { useAuth } from '../components/AuthContext';
import ProfileModal from '../components/ProfileModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AutoCarousel from '../components/AutoCarousel';
import { useLocalSearchParams } from 'expo-router';

const portalLinks = [
  { key: 'events', label: 'Events', icon: <MaterialIcons name="event" size={28} color="#7B61FF" /> },
  { key: 'hub', label: 'Trainee Hub', icon: <MaterialIcons name="dashboard" size={28} color="#43C6AC" /> },
  { key: 'gallery', label: 'Gallery', icon: <Ionicons name="image-outline" size={28} color="#F7B801" /> },
  { key: 'inspire', label: 'Inspire Corner', icon: <Feather name="zap" size={28} color="#43C6AC" /> },
  { key: 'bookclub', label: 'Book Club', icon: <Ionicons name="book-outline" size={28} color="#FF8C42" /> },
  { key: 'checklist', label: 'Check List', icon: <Ionicons name="checkmark-done-circle-outline" size={28} color="#34C759" /> },
];

const featuredNews = [
  {
    id: '1',
    image: require('../assets/images/tennis-poster.png'),
    text: 'Winner of this week',
    progress: 0.6,
    eventId: '1', // Link to event id
  },
  {
    id: '2',
    image: require('../assets/images/partial-react-logo.png'),
    text: 'Employee of the Month',
    progress: 0.9,
    eventId: '2',
  },
];

export default function TraineeHome() {
  const router = useRouter();
  const { fromLogin } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('home');
  const { events, registered } = useEventContext();
  const { userRole, isInitialized } = useUserContext();
  const { user, logout } = useAuth();
  const [profileVisible, setProfileVisible] = useState(false);
  const insets = useSafeAreaInsets();

  // Trainee Hub modal state
  const [showHub, setShowHub] = useState(false);
  const [hubTab, setHubTab] = useState('Dashboard');
  const [plan, setPlan] = useState(''); // empty means no plan
  const [planInput, setPlanInput] = useState('');
  const [planSubmitted, setPlanSubmitted] = useState(false);

  // Debug logging
  console.log('TraineeHome: Current userRole:', userRole, 'isInitialized:', isInitialized);

  React.useEffect(() => {
    if (fromLogin) {
      // Optionally reset navigation or scroll to top, etc.
      // For now, just log for debug
      console.log('Navigated from login, ignoring previous route state.');
    }
  }, [fromLogin]);

  // Get upcoming events (events with future dates)
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    return events
      .filter(event => {
        const eventDate = new Date(event.date);
        return eventDate > today;
      })
      .slice(0, 5) // Show max 5 upcoming events
      .map(event => {
        const eventDate = new Date(event.date);
        const daysLeft = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          id: event.id,
          title: event.title,
          description: event.description,
          date: event.date,
          time: event.time,
          daysLeft: daysLeft,
          image: event.image,
        };
      });
  }, [events]);

  const { isDarkMode, toggleTheme } = useTheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  const borderColor = isDarkMode ? '#2A2A2A' : '#E0E0E0';
  const iconColor = useThemeColor({}, 'icon');

  const bookTitleColor = isDarkMode ? '#fff' : textColor;
  const bookAuthorColor = isDarkMode ? '#fff' : secondaryTextColor;
  const bookRatingColor = isDarkMode ? '#fff' : textColor;
  const portalLabelColor = isDarkMode ? '#fff' : textColor;

  return (
    <RoleGuard allowedRoles={['trainee']}>
      <View style={[styles.safeArea, { backgroundColor }]}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} translucent backgroundColor="transparent" />
        <View style={[styles.header, { backgroundColor: cardBackground, borderBottomColor: borderColor, paddingTop: insets.top }]}> 
          <Image source={require('../assets/images/mitconnect-logo.png')} style={styles.logo} /> 
          <Text style={[styles.appName, { color: textColor }]}><Text style={{ color: textColor }}>MIT</Text><Text style={{ color: '#43C6AC' }}>Connect</Text></Text> 
          <View style={styles.headerIcons}> 
            <TouchableOpacity onPress={toggleTheme} style={styles.headerIcon}> 
              <Feather name={isDarkMode ? 'sun' : 'moon'} size={22} color={iconColor} /> 
            </TouchableOpacity> 
            <TouchableOpacity onPress={() => setProfileVisible(true)} style={styles.headerIcon}> 
              <Ionicons name="person-circle-outline" size={26} color={iconColor} /> 
            </TouchableOpacity> 
          </View> 
        </View>
        <ScrollView contentContainerStyle={[styles.scrollContent, {alignItems: 'center', justifyContent: 'center', flexGrow: 1}]} showsVerticalScrollIndicator={false}>
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
              <Text style={[styles.sectionTitle, { color: textColor }]}>Featured This Week</Text>
              <AutoCarousel
                data={featuredNews}
                cardWidth={320}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => router.push({ pathname: '/feature-details' })}
                    style={{
                      borderRadius: 24,
                      overflow: 'hidden',
                      width: 320,
                      height: 180,
                      marginBottom: 18,
                      marginRight: index !== featuredNews.length - 1 ? 16 : 0,
                    }}
                  >
                    <Image source={item.image} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                  </TouchableOpacity>
                )}
              />
            </>
          )}
          
          {upcomingEvents.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: cardBackground }]}>
              <Ionicons name="calendar-outline" size={64} color={secondaryTextColor} />
              <Text style={[styles.emptyStateTitle, { color: textColor }]}>No Upcoming Events</Text>
              <Text style={[styles.emptyStateText, { color: secondaryTextColor }]}>
                There are no upcoming events scheduled. Check back later for exciting activities!
              </Text>
            </View>
          ) : (
            <>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Upcoming Events</Text>
              <FlatList
                data={upcomingEvents}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingLeft: 8, paddingBottom: 8 }}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => router.push({ pathname: '/event-details', params: { id: item.id } })}>
                  <View style={[styles.eventCard, { backgroundColor: cardBackground }]}>
                    <View style={styles.eventCardHeader}>
                      <Text style={styles.eventDaysLeft}>{item.daysLeft} days Left</Text>
                      <Ionicons name="ellipsis-horizontal" size={18} color="#bbb" />
                    </View>
                    <Text style={styles.eventTitle}>{item.title}</Text>
                    <Text style={styles.eventDesc}>{item.description}</Text>
                    {registered.includes(item.id) && (
                      <View style={styles.registeredBadge}><Text style={styles.registeredBadgeText}>Registered</Text></View>
                    )}
                    <TouchableOpacity style={styles.eventBtn}><Text style={styles.eventBtnText}>Register Now!</Text></TouchableOpacity>
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
                </TouchableOpacity>
              )}
            />
            </>
          )}
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#222' }]}>Portal Access</Text>
          <View style={styles.portalRow}>
            {portalLinks.map(link => (
              <TouchableOpacity
                key={link.key}
                style={[styles.portalIconBox, { backgroundColor: cardBackground }]}
                activeOpacity={0.8}
                onPress={() => {
                  if (link.key === 'events') router.push('/events?noHeader=1');
                  else if (link.key === 'hub') router.push('/trainee-hub');
                  else if (link.key === 'gallery') router.push('/gallery');
                  else if (link.key === 'inspire') router.push('/inspirer-corner');
                  else if (link.key === 'bookclub') router.push('/bookclub');
                  else if (link.key === 'checklist') router.push('/trainee-checklist');
                }}
              >
                {link.icon}
                <Text style={[styles.portalLabel, { color: portalLabelColor }]}>{link.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#222' }]}>Book of the Month</Text>
          <TouchableOpacity style={[styles.featuredBookCard, { backgroundColor: isDarkMode ? '#23272b' : '#fff' }]} onPress={() => router.push('/bookclub')}>
            <Image source={{ uri: 'https://covers.openlibrary.org/b/id/7222246-L.jpg' }} style={styles.featuredBookCover} />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <View style={[styles.genreChip, { backgroundColor: isDarkMode ? '#7cae92' : '#A3C9A8' }]}><Text style={[styles.genreText, { color: isDarkMode ? '#23272b' : '#222' }]}>Philosophical Fiction</Text></View>
              <Text style={[styles.featuredBookTitle, { color: isDarkMode ? '#fff' : '#222' }]}>The Alchemist</Text>
              <Text style={[styles.featuredBookAuthor, { color: isDarkMode ? '#fff' : '#888' }]}>By Paulo Coelho</Text>
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
                <Text style={[styles.ratingText, { color: isDarkMode ? '#fff' : '#222' }]}>4.9</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                <Ionicons name="person" size={16} color={isDarkMode ? '#9BA1A6' : '#888'} style={{ marginRight: 4 }} />
                <Text style={[styles.recommender, { color: isDarkMode ? '#9BA1A6' : '#888' }]}>Nizar Naghi</Text>
              </View>
            </View>
          </TouchableOpacity>
        </ScrollView>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: userRole === 'trainee' && isDarkMode ? '#23272b' : '#fff',
          borderTopWidth: 1,
          borderTopColor: userRole === 'trainee' && isDarkMode ? '#2D333B' : '#F2F2F7',
          paddingVertical: 16, // Slightly bigger
          minWidth: 400,
          paddingHorizontal: 12,
        }}>
          <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }} onPress={() => { setActiveTab('home'); router.push('/trainee-home'); }}>
            <Ionicons name="home" size={28} color={userRole === 'trainee' && isDarkMode ? (activeTab === 'home' ? '#43C6AC' : '#AEB6C1') : (activeTab === 'home' ? '#43C6AC' : '#bbb')} />
          </TouchableOpacity>
          <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }} onPress={() => { setActiveTab('hub'); router.push('/trainee-hub'); }}>
            <MaterialIcons name="dashboard" size={28} color={userRole === 'trainee' && isDarkMode ? (activeTab === 'hub' ? '#43C6AC' : '#AEB6C1') : (activeTab === 'hub' ? '#43C6AC' : '#bbb')} />
          </TouchableOpacity>
          <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }} onPress={() => { setActiveTab('bookclub'); router.push('/bookclub'); }}>
            <Ionicons name="book-outline" size={28} color={userRole === 'trainee' && isDarkMode ? (activeTab === 'bookclub' ? '#43C6AC' : '#AEB6C1') : (activeTab === 'bookclub' ? '#43C6AC' : '#bbb')} />
          </TouchableOpacity>
          <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }} onPress={() => { setActiveTab('checklist'); router.push('/trainee-checklist'); }}>
            <Ionicons name="checkmark-done-circle-outline" size={28} color={userRole === 'trainee' && isDarkMode ? (activeTab === 'checklist' ? '#43C6AC' : '#AEB6C1') : (activeTab === 'checklist' ? '#43C6AC' : '#bbb')} />
          </TouchableOpacity>
        </View>
        <ProfileModal visible={profileVisible} onClose={() => setProfileVisible(false)} />
      </View>
    </RoleGuard>
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
    justifyContent: 'center',
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
    width: 100,
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
    borderRadius: 24,
    marginHorizontal: 18,
    marginBottom: 18,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#43C6AC',
    shadowOpacity: 0.10,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    minHeight: 180,
  },
  featuredImage: {
    width: 64,
    height: 64,
    marginBottom: 12,
    resizeMode: 'contain',
  },
  featuredMonoText: {
    color: '#fff',
    fontSize: 28,
    fontFamily: 'SpaceMono-Regular',
    marginBottom: 24,
    textAlign: 'center',
  },
  featuredProgressBarBg: {
    width: '80%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  featuredProgressBar: {
    width: '60%', // Example progress
    height: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginRight: 16,
    padding: 16,
    width: 220,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  eventDaysLeft: {
    backgroundColor: '#F2F2F7',
    color: '#7B61FF',
    fontWeight: '600',
    fontSize: 12,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 2,
  },
  eventDesc: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
  },
  eventBtn: {
    backgroundColor: '#E6F0FF',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
    marginBottom: 8,
  },
  eventBtnText: {
    color: '#2196F3',
    fontWeight: '700',
    fontSize: 14,
  },
  eventCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  eventFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  eventFooterText: {
    color: '#7B61FF',
    fontSize: 13,
    marginLeft: 3,
  },
  bookCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 18,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 2,
  },
  bookAuthor: {
    fontSize: 13,
    color: '#888',
    marginBottom: 6,
  },
  bookMore: {
    color: '#2196F3',
    fontWeight: '600',
    fontSize: 13,
  },
  bookImg: {
    width: 54,
    height: 74,
    borderRadius: 8,
    marginLeft: 12,
    backgroundColor: '#eee',
  },
  registeredBadge: {
    backgroundColor: '#43C6AC',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  registeredBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  noEventsContainer: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 18,
    marginBottom: 18,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  noEventsText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
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
}); 