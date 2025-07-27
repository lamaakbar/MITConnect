import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, FlatList, SafeAreaView } from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, usePathname } from 'expo-router';
import { useEventContext } from '../components/EventContext';
import { useUserContext } from '../components/UserContext';
import { useTheme } from '../components/ThemeContext';
import { useThemeColor } from '../hooks/useThemeColor';
import ProfileModal from '../components/ProfileModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AutoCarousel from '../components/AutoCarousel';
import EventsTabBar from '../components/EventsTabBar';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../components/AuthContext';
import { fetchHighlights } from '../services/supabase';
import { supabase } from '../services/supabase';

// BookOfMonth type definition
// (copied from app/bookclub.tsx)
type BookOfMonth = {
  id: number;
  title: string;
  author: string;
  genre?: string;
  genreColor?: string;
  cover_image_url?: string;
  cover?: string;
  description?: string;
  category?: string;
};

const portalLinks = [
  { key: 'events', label: 'Events', icon: <MaterialIcons name="event" size={28} color="#7B61FF" /> },
  { key: 'gallery', label: 'Gallery', icon: <Ionicons name="image-outline" size={28} color="#F7B801" /> },
  { key: 'inspire', label: 'Inspire Corner', icon: <Feather name="zap" size={28} color="#43C6AC" /> },
  { key: 'bookclub', label: 'Book Club', icon: <Ionicons name="book-outline" size={28} color="#FF8C42" /> },
];

export default function EmployeeHome() {
  const router = useRouter();
  const pathname = usePathname();
  const { fromLogin } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('home');
  const { events, registered } = useEventContext();
  const { userRole, isInitialized } = useUserContext();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [profileVisible, setProfileVisible] = useState(false);
  const insets = useSafeAreaInsets();

  // Highlights state
  const [highlightCards, setHighlightCards] = useState<any[]>([]);

  const [bookOfMonth, setBookOfMonth] = useState<BookOfMonth | null>(null);
  const [loading, setLoading] = useState(true);

  // Handle fromLogin navigation
  useEffect(() => {
    if (fromLogin) {
      // Optionally reset navigation or scroll to top, etc.
      // For now, just log for debug
      console.log('Navigated from login, ignoring previous route state.');
    }
  }, [fromLogin]);

  // Fetch highlights from Supabase
  useEffect(() => {
    const loadHighlights = async () => {
      try {
        const data = await fetchHighlights();
        setHighlightCards(data);
      } catch (error) {
        console.error('Error loading highlights:', error);
        setHighlightCards([]);
      }
    };
    
    loadHighlights();
  }, []);

  // Function to fetch real book cover from OpenLibrary
  const fetchBookCover = async (title: string, author: string): Promise<string | null> => {
    try {
      // Try multiple search strategies
      const searchStrategies = [
        // Strategy 1: Title + Author
        `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author || '')}&limit=5`,
        // Strategy 2: Title only
        `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=5`,
        // Strategy 3: Simplified title (remove special characters)
        `https://openlibrary.org/search.json?title=${encodeURIComponent(title.replace(/[^\w\s]/g, ' ').trim())}&limit=5`
      ];
      
      for (let i = 0; i < searchStrategies.length; i++) {
        const searchUrl = searchStrategies[i];
        console.log(`🔍 EmployeeHome search strategy ${i + 1} for:`, title, 'URL:', searchUrl);
        
        const response = await fetch(searchUrl);
        const data = await response.json();
        
        if (data.docs && data.docs.length > 0) {
          // Find the best match
          const bestMatch = data.docs.find((book: any) => book.cover_i) || data.docs[0];
          
          if (bestMatch.cover_i) {
            const coverUrl = `https://covers.openlibrary.org/b/id/${bestMatch.cover_i}-L.jpg`;
            console.log('✅ EmployeeHome found cover for:', title, 'URL:', coverUrl);
            return coverUrl;
          }
        }
      }
      
      console.log('❌ EmployeeHome no cover found for:', title);
      return null;
    } catch (error) {
      console.log('❌ EmployeeHome error fetching cover for:', title, error);
      return null;
    }
  };

  // Fetch book of the month
  useEffect(() => {
    const fetchBookOfMonth = async () => {
      setLoading(true);
      try {
        const { data: booksData, error: booksError } = await supabase
          .from('books')
          .select('*')
          .eq('category', 'book_of_the_month')
          .maybeSingle();
        
        if (booksError) {
          console.error('Error fetching book of the month:', booksError);
          setBookOfMonth(null);
        } else {
          console.log('📚 EmployeeHome book of the month data:', booksData);
          
          if (booksData) {
            // Check if the book has a local file URI (which won't work)
            const hasLocalFileUri = booksData.cover_image_url && 
              (booksData.cover_image_url.startsWith('file://') || 
               booksData.cover_image_url.match(/^[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}\.(jpg|png|jpeg)$/i));
            
            if (hasLocalFileUri) {
              console.log('🔍 EmployeeHome fetching real cover for book of the month:', booksData.title);
              
              // Fetch the actual book cover from OpenLibrary API
              const realCoverUrl = await fetchBookCover(booksData.title, booksData.author || '');
              
              // If OpenLibrary doesn't have the cover, try to use a generic book cover
              // based on the book's genre or type
              if (!realCoverUrl) {
                console.log('⚠️ EmployeeHome OpenLibrary failed, using genre-based cover for:', booksData.title);
                
                // Use different cover IDs based on book genre or title keywords
                const genreCovers = {
                  'self-help': 'https://covers.openlibrary.org/b/id/7222246-L.jpg',
                  'philosophy': 'https://covers.openlibrary.org/b/id/7222247-L.jpg',
                  'fiction': 'https://covers.openlibrary.org/b/id/7222248-L.jpg',
                  'business': 'https://covers.openlibrary.org/b/id/7222249-L.jpg',
                  'default': 'https://covers.openlibrary.org/b/id/7222250-L.jpg'
                };
                
                // Determine genre based on title keywords
                const titleLower = booksData.title.toLowerCase();
                let selectedCover = genreCovers.default;
                
                if (titleLower.includes('think') || titleLower.includes('believe') || titleLower.includes('mind')) {
                  selectedCover = genreCovers['self-help'];
                } else if (titleLower.includes('philosophy') || titleLower.includes('wisdom')) {
                  selectedCover = genreCovers.philosophy;
                } else if (titleLower.includes('business') || titleLower.includes('success')) {
                  selectedCover = genreCovers.business;
                }
                
                setBookOfMonth({
                  ...booksData,
                  cover_image_url: selectedCover
                });
              } else {
                setBookOfMonth({
                  ...booksData,
                  cover_image_url: realCoverUrl
                });
              }
            } else {
              setBookOfMonth(booksData);
            }
          } else {
            setBookOfMonth(null);
          }
        }
      } catch (error) {
        console.error('Error fetching book of the month:', error);
        setBookOfMonth(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBookOfMonth();
  }, []);

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  const borderColor = isDarkMode ? '#2A2A2A' : '#E0E0E0';
  const iconColor = useThemeColor({}, 'icon');

  const portalLabelColor = isDarkMode ? '#fff' : textColor;

  // Debug logging
  console.log('EmployeeHome: Current userRole:', userRole, 'isInitialized:', isInitialized);

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

  return (
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
        <ScrollView contentContainerStyle={[styles.scrollContent, {flexGrow: 1}]} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionHeaderContainer}>
            <View style={[styles.sectionIconContainer, { backgroundColor: isDarkMode ? '#2A2A2A' : '#E8F5E8' }]}>
              <Ionicons name="star" size={20} color="#43C6AC" />
            </View>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Featured This Week</Text>
          </View>
          <AutoCarousel
            data={highlightCards}
            cardWidth={320}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => console.log('Clicked highlight:', item.title)}
                style={{
                  borderRadius: 24,
                  overflow: 'hidden',
                  width: 320,
                  height: 180,
                  marginBottom: 18,
                  marginRight: index !== highlightCards.length - 1 ? 16 : 0,
                }}
              >
                {item.image_url ? (
                  <Image
                    source={{ uri: item.image_url }}
                    style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
                  />
                ) : (
                  <View style={{ width: '100%', height: '100%', backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' }}>
                    <Text>No Image</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
              {/* Upcoming Events Section */}
          <View style={styles.sectionHeaderContainer}>
            <View style={[styles.sectionIconContainer, { backgroundColor: isDarkMode ? '#2A2A2A' : '#E8F5E8' }]}>
              <Ionicons name="calendar" size={20} color="#7B61FF" />
            </View>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Upcoming Events</Text>
          </View>
          {upcomingEvents && upcomingEvents.length > 0 ? (
            <FlatList
              data={upcomingEvents}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 8, paddingBottom: 8 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/event-details', params: { id: item.id } })}
                  activeOpacity={0.85}
                >
                  <View style={[styles.eventCard, { backgroundColor: cardBackground }]}>
                    <View style={styles.eventCardHeader}>
                      <Text style={styles.eventDaysLeft}>{item.daysLeft} days Left</Text>
                      <Ionicons name="ellipsis-horizontal" size={18} color={secondaryTextColor} />
                    </View>
                    <Text style={[styles.eventTitle, { color: textColor }]}>{item.title}</Text>
                    <Text style={styles.eventDesc}>{item.description}</Text>
                    {registered && registered.includes(item.id) && (
                      <View style={styles.registeredBadge}>
                        <Text style={styles.registeredBadgeText}>Registered</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.eventBtn}
                      activeOpacity={0.85}
                      onPress={() => router.push({ pathname: '/event-details', params: { id: item.id } })}
                    >
                      <Text style={styles.eventBtnText}>Register Now!</Text>
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
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={[styles.noEventsContainer, { backgroundColor: cardBackground }]}>
              <Text style={styles.noEventsText}>No upcoming events at the moment</Text>
            </View>
          )}

          {/* Portal Access Section */}
          <View style={styles.sectionHeaderContainer}>
            <View style={[styles.sectionIconContainer, { backgroundColor: isDarkMode ? '#2A2A2A' : '#E8F5E8' }]}>
              <Ionicons name="grid" size={20} color="#FF6B35" />
            </View>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#222' }]}>Portal Access</Text>
          </View>
          <View style={styles.portalRow}>
            {portalLinks.map(link => (
              <TouchableOpacity
                key={link.key}
                style={[styles.portalIconBox, { backgroundColor: cardBackground }]}
                activeOpacity={0.8}
                onPress={() => {
                  if (link.key === 'events') {
                    if (pathname !== '/events?noHeader=1') {
                      router.push('/events?noHeader=1');
                    }
                  } else if (link.key === 'gallery') {
                    if (pathname !== '/gallery') {
                      router.push('/gallery');
                    }
                  } else if (link.key === 'inspire') {
                    if (pathname !== '/inspirer-corner') {
                      router.push('/inspirer-corner');
                    }
                  } else if (link.key === 'bookclub') {
                    if (pathname !== '/bookclub') {
                      router.push('/bookclub');
                    }
                  }
                }}
              >
                {link.icon}
                <Text style={[styles.portalLabel, { color: portalLabelColor }]}>{link.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Book of the Month Section */}
          <View style={styles.sectionHeaderContainer}>
            <View style={[styles.sectionIconContainer, { backgroundColor: isDarkMode ? '#2A2A2A' : '#E8F5E8' }]}>
              <Ionicons name="book" size={20} color="#1abc9c" />
            </View>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#222' }]}>Book of the Month</Text>
          </View>
          {loading ? (
            <Text style={{ textAlign: 'center', color: secondaryTextColor, marginTop: 20 }}>Loading...</Text>
          ) : bookOfMonth ? (
            <TouchableOpacity
              style={[styles.featuredBookCard, { backgroundColor: cardBackground }]}
              activeOpacity={0.85}
              onPress={() => router.push({ 
                pathname: '/books-management/[id]/details', 
                params: { id: bookOfMonth.id.toString() } 
              })}
            >
              <View style={styles.featuredBookCover}>
                <Image
                  source={{ uri: bookOfMonth.cover_image_url || bookOfMonth.cover || 'https://covers.openlibrary.org/b/id/7222246-L.jpg' }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                  onError={(error) => console.log('❌ Book image error:', error.nativeEvent.error)}
                  onLoad={() => console.log('✅ Book image loaded successfully')}
                />
                {!bookOfMonth.cover_image_url && !bookOfMonth.cover && (
                  <View style={styles.fallbackImage}>
                    <Ionicons name="book-outline" size={40} color="#ccc" />
                  </View>
                )}
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                {bookOfMonth.genre && (
                  <View style={[styles.genreChip, { backgroundColor: bookOfMonth.genreColor || '#A3C9A8' }]}>
                    <Text style={[styles.genreText, { color: isDarkMode ? '#23272b' : '#222' }]}>{bookOfMonth.genre}</Text>
                  </View>
                )}
                <Text style={[styles.featuredBookTitle, { color: textColor }]}>{bookOfMonth.title}</Text>
                <Text style={[styles.featuredBookAuthor, { color: secondaryTextColor }]}>By {bookOfMonth.author}</Text>
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
                  <Text style={[styles.ratingText, { color: textColor }]}>4.9</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                  <Ionicons name="person" size={16} color={secondaryTextColor} style={{ marginRight: 4 }} />
                  <Text style={[styles.recommender, { color: secondaryTextColor }]}>Nizar Naghi</Text>
                </View>
                {bookOfMonth.description && (
                  <Text style={[styles.bookDescription, { color: isDarkMode ? '#ccc' : '#666' }]} numberOfLines={2}>
                    {bookOfMonth.description}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={48} color={secondaryTextColor} />
              <Text style={[styles.emptyStateTitle, { color: textColor }]}>No Book of the Month</Text>
              <Text style={[styles.emptyStateText, { color: secondaryTextColor }]}>
                No book has been set as Book of the Month yet.
              </Text>
            </View>
          )}
        </ScrollView>
        <ProfileModal visible={profileVisible} onClose={() => setProfileVisible(false)} />
        <EventsTabBar />
      </View>
  );
};

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
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    marginTop: 18,
    marginBottom: 12,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#222',
    marginLeft: 0,
    marginTop: 0,
    marginBottom: 0,
    letterSpacing: 0.5,
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
    color: '#222',
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
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
    width: '60%',
    height: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
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
    fontWeight: '700',
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
  // Book of the Month additional styles
  aboutBox: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  aboutLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },
  statCardNewSmall: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  statNameBold: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  statNumberSmall: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  statLabelNewSmall: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
  rateBox: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  rateLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  bookDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
    fontStyle: 'italic',
  },
  fallbackImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 20,
    padding: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
  },
});