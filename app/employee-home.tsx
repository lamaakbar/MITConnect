import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, FlatList, SafeAreaView, Platform, ActivityIndicator } from 'react-native';
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
import { getGenreColor } from '../constants/Genres';
import RoleGuard from '../components/RoleGuard';

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
  const { events, registered, registerEvent } = useEventContext();
  const { effectiveRole, isInitialized, viewAs, setViewAs } = useUserContext();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [profileVisible, setProfileVisible] = useState(false);
  const insets = useSafeAreaInsets();

  // Debug viewAs state
  console.log('EmployeeHome: viewAs state:', viewAs);

  // Highlights state
  const [highlightCards, setHighlightCards] = useState<any[]>([]);
  const [loadingHighlights, setLoadingHighlights] = useState(true);

  const [bookOfMonth, setBookOfMonth] = useState<BookOfMonth | null>(null);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [showFooter, setShowFooter] = useState(false);

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
      setLoadingHighlights(true);
      try {
        console.log('🔄 Loading highlights...');
        const data = await fetchHighlights();
        console.log('✅ Highlights loaded:', data?.length || 0, 'items');
        setHighlightCards(data || []);
      } catch (error) {
        console.error('❌ Error loading highlights:', error);
        setHighlightCards([]);
      } finally {
        setLoadingHighlights(false);
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

  // Fetch ratings for book of the month
  const fetchRatings = async () => {
    try {
      if (bookOfMonth) {
        const { data, error } = await supabase
          .from('ratings')
          .select('*')
          .eq('book_id', bookOfMonth.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setRatings(data || []);
        
        // Calculate average rating
        if (data && data.length > 0) {
          const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
          setAverageRating(avg);
        } else {
          setAverageRating(0);
        }
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
      setAverageRating(0);
    }
  };

  // Fetch ratings when book of the month changes
  useEffect(() => {
    if (bookOfMonth) {
      fetchRatings();
    }
  }, [bookOfMonth]);

  // Set up real-time subscription for Book of the Month ratings
  useEffect(() => {
    if (!bookOfMonth) return;

    console.log('🔄 EmployeeHome: Setting up real-time subscription for book ID:', bookOfMonth.id);
    
    // Set up real-time subscription for ratings
    const ratingsSubscription = supabase
      .channel('employee-home-ratings')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'ratings',
          filter: `book_id=eq.${bookOfMonth.id}`
        },
        (payload) => {
          console.log('🔄 EmployeeHome: Real-time rating change detected:', payload);
          
          // Handle different types of changes
          if (payload.eventType === 'INSERT') {
            console.log('➕ EmployeeHome: New rating added:', payload.new);
            // Add the new rating to the list
            setRatings(prevRatings => [payload.new, ...prevRatings]);
          } else if (payload.eventType === 'UPDATE') {
            console.log('✏️ EmployeeHome: Rating updated:', payload.new);
            // Update the existing rating in the list
            setRatings(prevRatings => 
              prevRatings.map(rating => 
                rating.id === payload.new.id 
                  ? { ...rating, ...payload.new }
                  : rating
              )
            );
          } else if (payload.eventType === 'DELETE') {
            console.log('🗑️ EmployeeHome: Rating deleted:', payload.old);
            // Remove the deleted rating from the list
            setRatings(prevRatings => 
              prevRatings.filter(rating => rating.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    // Cleanup subscription on component unmount or when book changes
    return () => {
      console.log('🔌 EmployeeHome: Cleaning up real-time subscription');
      ratingsSubscription.unsubscribe();
    };
  }, [bookOfMonth]); // Re-subscribe when book of the month changes

  // Recalculate average rating when ratings change
  useEffect(() => {
    if (ratings.length > 0) {
      const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
      setAverageRating(avg);
      console.log('📊 EmployeeHome: Average rating updated to:', avg.toFixed(1), 'from', ratings.length, 'ratings');
    } else {
      setAverageRating(0);
      console.log('📊 EmployeeHome: No ratings, average set to 0');
    }
  }, [ratings]);

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  const borderColor = isDarkMode ? '#2A2A2A' : '#E0E0E0';
  const iconColor = useThemeColor({}, 'icon');

  const portalLabelColor = isDarkMode ? '#fff' : textColor;

  // Debug logging
  console.log('EmployeeHome: Current effectiveRole:', effectiveRole, 'isInitialized:', isInitialized);

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
    <RoleGuard allowedRoles={['employee']}>
      <View style={[styles.container, { backgroundColor }]}> 
      <StatusBar style={isDarkMode ? 'light' : 'dark'} translucent backgroundColor="transparent" />
        <View style={[styles.header, { 
          backgroundColor: cardBackground, 
          borderBottomColor: borderColor, 
          paddingTop: insets.top,
          paddingBottom: 12,
        }]}>   
        <Image source={require('../assets/images/mitconnect-logo.png')} style={styles.logo} />
        <Text style={[styles.appName, { color: textColor }]}>
          MIT<Text style={{ color: '#43C6AC' }}>Connect</Text>
          {viewAs && (
            <Text style={{ color: '#FF6B6B', fontSize: 12, fontWeight: 'normal' }}> (Preview Mode)</Text>
          )}
        </Text>
        <View style={styles.headerIcons}> 
          <TouchableOpacity onPress={() => router.push('/library')} style={styles.headerIcon}> 
            <Ionicons name="library-outline" size={22} color={iconColor} /> 
          </TouchableOpacity> 
          <TouchableOpacity onPress={toggleTheme} style={styles.headerIcon}> 
            <Feather name={isDarkMode ? 'sun' : 'moon'} size={22} color={iconColor} /> 
          </TouchableOpacity> 
          <TouchableOpacity onPress={() => setProfileVisible(true)} style={styles.headerIcon}> 
            <Ionicons name="person-circle-outline" size={26} color={iconColor} /> 
          </TouchableOpacity> 
        </View>
      </View>

      {/* Return to Admin View Banner - Show when in viewAs mode */}
      {viewAs && (
        <View style={{
          backgroundColor: '#FF6B6B',
          paddingVertical: 12,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Ionicons name="warning" size={20} color="#fff" />
          <Text style={{
            color: '#fff',
            fontSize: 16,
            fontWeight: '600',
            marginLeft: 8,
            flex: 1,
            textAlign: 'center',
          }}>
            Preview Mode - Viewing as {viewAs}
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
            }}
            onPress={() => {
              console.log('EmployeeHome Banner: Reset to Admin View pressed');
              setViewAs(null);
              router.replace('/admin-home');
            }}
          >
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
              Exit Preview
            </Text>
          </TouchableOpacity>
        </View>
      )}

        <ScrollView 
          contentContainerStyle={[styles.scrollContent, {flexGrow: 1}]} 
          showsVerticalScrollIndicator={false}
          onScroll={(event) => {
            const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
            const isCloseToBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 50;
            setShowFooter(isCloseToBottom);
          }}
          scrollEventThrottle={16}
        >
          <View style={styles.sectionHeaderContainer}>
            <View style={[styles.sectionIconContainer, { backgroundColor: isDarkMode ? '#2A2A2A' : '#E8F5E8' }]}>
              <Ionicons name="star" size={20} color="#43C6AC" />
            </View>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Featured This Week</Text>
          </View>
          {loadingHighlights ? (
            <View style={{
              height: 180,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: isDarkMode ? '#2A2A2A' : '#F8F8F8',
              borderRadius: 24,
              marginHorizontal: 16,
            }}>
              <ActivityIndicator size="large" color="#43C6AC" />
              <Text style={{
                marginTop: 12,
                fontSize: 16,
                color: isDarkMode ? '#E0E0E0' : '#666',
                fontWeight: '500'
              }}>
                Loading featured content...
              </Text>
            </View>
          ) : highlightCards.length > 0 ? (
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
          ) : (
            <View style={{
              height: 180,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: isDarkMode ? '#2A2A2A' : '#F8F8F8',
              borderRadius: 24,
              marginHorizontal: 16,
            }}>
              <Ionicons name="star-outline" size={48} color={isDarkMode ? '#666' : '#999'} />
              <Text style={{
                marginTop: 12,
                fontSize: 16,
                color: isDarkMode ? '#E0E0E0' : '#666',
                fontWeight: '500'
              }}>
                No featured content available
              </Text>
            </View>
          )}
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
              contentContainerStyle={{ 
                paddingLeft: 16, 
                paddingRight: 24,
                paddingBottom: 8
              }}
              ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/event-details', params: { id: item.id, from: 'employee-home' } })}
                  activeOpacity={0.85}
                >
                  <View style={[styles.eventCard, { backgroundColor: cardBackground }]}>
                    <View style={styles.eventCardContent}>
                      <View style={styles.eventCardHeader}>
                        <Text style={styles.eventDaysLeft}>{item.daysLeft} days Left</Text>
                        <Ionicons name="ellipsis-horizontal" size={18} color={secondaryTextColor} />
                      </View>
                      <Text style={[styles.eventTitle, { color: textColor }]} numberOfLines={2}>{item.title}</Text>
                      <Text style={styles.eventDesc} numberOfLines={2}>{item.description}</Text>
                    </View>
                    <View style={styles.eventCardActions}>
                      <TouchableOpacity
                        style={[
                          styles.eventBtn,
                          registered.includes(item.id) && styles.eventBtnRegistered
                        ]}
                        activeOpacity={0.85}
                        onPress={(e) => {
                          e.stopPropagation(); // Prevent navigation to event details
                          if (!registered.includes(item.id)) {
                            registerEvent(item.id);
                          }
                        }}
                        disabled={registered.includes(item.id)}
                      >
                        <Text style={[
                          styles.eventBtnText,
                          registered.includes(item.id) && styles.eventBtnTextRegistered
                        ]}>
                          {registered.includes(item.id) ? '✅ Registered' : 'Register Now!'}
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
                    if (pathname !== '/library') {
                      router.push('/library');
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
                  <View style={[styles.genreChip, { backgroundColor: getGenreColor(bookOfMonth.genre) }]}>
                    <Text style={[styles.genreText, { color: isDarkMode ? '#23272b' : '#222' }]}>{bookOfMonth.genre}</Text>
                  </View>
                )}
                <Text style={[styles.featuredBookTitle, { color: textColor }]}>{bookOfMonth.title}</Text>
                <Text style={[styles.featuredBookAuthor, { color: secondaryTextColor }]}>By {bookOfMonth.author}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  {[1,2,3,4,5].map(i => (
                    <MaterialIcons
                      key={i}
                      name={i <= averageRating ? 'star' : 'star-border'}
                      size={20}
                      color="#F4B400"
                      style={{ marginRight: 2 }}
                    />
                  ))}
                  <Text style={[styles.ratingText, { color: textColor, fontSize: 12 }]}>
                    {averageRating > 0 ? averageRating.toFixed(1) : 'No ratings'} {ratings.length > 0 && `(${ratings.length} ratings)`}
                  </Text>
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
        
        {/* Team Credit - Only visible when scrolled to bottom */}
        {showFooter && (
          <View style={styles.creditContainer}>
            <Text style={[styles.creditText, { color: secondaryTextColor }]}>
              Made by IT Pulse Team – Summer 2025
            </Text>
          </View>
        )}
        
        <ProfileModal visible={profileVisible} onClose={() => setProfileVisible(false)} />
        <EventsTabBar />
      </View>
    </RoleGuard>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#f6f7f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: 8,
    marginLeft: 24,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
    marginLeft: 32,
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
    borderRadius: 20,
    padding: 18,
    width: 260,
    height: 180,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    justifyContent: 'space-between',
  },
  eventCardContent: {
    flex: 1,
    marginBottom: 12,
  },
  eventCardActions: {
    marginTop: 'auto',
  },
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
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
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 22,
  },
  eventDesc: {
    fontSize: 14,
    color: '#888',
    marginBottom: 10,
    lineHeight: 18,
  },
  eventBtn: {
    backgroundColor: '#E6F0FF',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  eventBtnText: {
    color: '#2196F3',
    fontWeight: '700',
    fontSize: 14,
  },
  eventCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
  },
  eventFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  eventFooterText: {
    color: '#7B61FF',
    fontSize: 13,
    marginLeft: 4,
    fontWeight: '500',
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
  eventBtnRegistered: {
    backgroundColor: '#43C6AC',
    opacity: 0.7,
  },
  eventBtnTextRegistered: {
    color: '#fff',
  },
  creditContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 1,
  },
  creditText: {
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    opacity: 0.8,
  },
});