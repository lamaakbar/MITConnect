import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, FlatList, SafeAreaView, ScrollView as RNScrollView, Alert, Modal, TextInput, BackHandler, Platform } from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, usePathname, useFocusEffect, useNavigation } from 'expo-router';
import { useState, useMemo, useEffect, useCallback } from 'react';
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
import { fetchHighlights } from '../services/supabase';
import { supabase } from '../services/supabase';
import { getGenreColor } from '../constants/Genres';

// BookOfMonth type definition
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
  genre_color?: string;
};

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
  const pathname = usePathname();
  const navigation = useNavigation();
  const { fromLogin } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('home');
  const { events, registered, registerEvent } = useEventContext();
  const { userRole, isInitialized, viewAs, setViewAs } = useUserContext();
  const { user, logout } = useAuth();
  const [profileVisible, setProfileVisible] = useState(false);
  const insets = useSafeAreaInsets();

  // Debug viewAs state
  console.log('TraineeHome: viewAs state:', viewAs);

  // Highlights state
  const [highlightCards, setHighlightCards] = useState<any[]>([]);

  // Trainee Hub modal state
  const [showHub, setShowHub] = useState(false);
  const [hubTab, setHubTab] = useState('Dashboard');
  const [plan, setPlan] = useState(''); // empty means no plan
  const [planInput, setPlanInput] = useState('');
  const [planSubmitted, setPlanSubmitted] = useState(false);

  // Book of the Month state
  const [bookOfMonth, setBookOfMonth] = useState<BookOfMonth | null>(null);
  const [loadingBookOfMonth, setLoadingBookOfMonth] = useState(true);
  const [ratings, setRatings] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);

  // Debug logging
  console.log('TraineeHome: Current userRole:', userRole, 'isInitialized:', isInitialized);

  // Disable swipe gestures for trainee security - only allow arrow back navigation
  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: false, // Disable swipe to go back
      swipeEnabled: false,   // Additional swipe protection  
      animationEnabled: false, // Disable screen transition animations
      headerBackVisible: true, // Keep the back arrow visible
      headerLeft: undefined, // Remove any custom header left components
      ...(Platform.OS === 'ios' && {
        gestureResponseDistance: 0, // iOS specific: disable edge swipe gesture
        gestureDirection: 'vertical', // Change gesture direction to prevent horizontal swipes
      }),
      ...(Platform.OS === 'android' && {
        gestureEnabled: false, // Android specific gesture disable
      }),
    });
  }, [navigation]);

  // Handle fromLogin navigation
  useEffect(() => {
    if (fromLogin) {
      // Optionally reset navigation or scroll to top, etc.
      // For now, just log for debug
      console.log('Navigated from login, ignoring previous route state.');
    }
  }, [fromLogin]);

  // Disable hardware back button for trainee security - only UI back arrow allowed
  useFocusEffect(
    useCallback(() => {
      // Prevent hardware back button on Android - trainee must use UI back arrow
      const handleBackPress = () => {
        // Block hardware back button completely for trainee security
        return true; // Returning true prevents the default back action
      };

      // Add hardware back button listener for Android
      const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

      // For web platform, prevent browser back navigation
      if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        const handlePopState = (event: Event) => {
          event.preventDefault();
          return false;
        };
        
        window.addEventListener('popstate', handlePopState);
        
        return () => {
          backHandler.remove();
          if (typeof window.removeEventListener === 'function') {
            window.removeEventListener('popstate', handlePopState);
          }
        };
      }
      
      return () => {
        backHandler.remove();
      };
    }, [])
  );

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
        console.log(`🔍 TraineeHome search strategy ${i + 1} for:`, title, 'URL:', searchUrl);
        
        const response = await fetch(searchUrl);
        const data = await response.json();
        
        if (data.docs && data.docs.length > 0) {
          // Find the best match
          const bestMatch = data.docs.find((book: any) => book.cover_i) || data.docs[0];
          
          if (bestMatch.cover_i) {
            const coverUrl = `https://covers.openlibrary.org/b/id/${bestMatch.cover_i}-L.jpg`;
            console.log('✅ TraineeHome found cover for:', title, 'URL:', coverUrl);
            return coverUrl;
          }
        }
      }
      
      console.log('❌ TraineeHome no cover found for:', title);
      return null;
    } catch (error) {
      console.log('❌ TraineeHome error fetching cover for:', title, error);
      return null;
    }
  };

  // Fetch book of the month
  useEffect(() => {
    const fetchBookOfMonth = async () => {
      setLoadingBookOfMonth(true);
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
          console.log('📚 TraineeHome book of the month data:', booksData);
          
          if (booksData) {
            // Check if the book has a local file URI (which won't work)
            const hasLocalFileUri = booksData.cover_image_url && 
              (booksData.cover_image_url.startsWith('file://') || 
               booksData.cover_image_url.match(/^[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}\.(jpg|png|jpeg)$/i));
            
            if (hasLocalFileUri) {
              console.log('🔍 TraineeHome fetching real cover for book of the month:', booksData.title);
              
              // Fetch the actual book cover from OpenLibrary API
              const realCoverUrl = await fetchBookCover(booksData.title, booksData.author || '');
              
              // If OpenLibrary doesn't have the cover, try to use a generic book cover
              // based on the book's genre or type
              if (!realCoverUrl) {
                console.log('⚠️ TraineeHome OpenLibrary failed, using genre-based cover for:', booksData.title);
                
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
        setLoadingBookOfMonth(false);
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

    console.log('🔄 TraineeHome: Setting up real-time subscription for book ID:', bookOfMonth.id);
    
    // Set up real-time subscription for ratings
    const ratingsSubscription = supabase
      .channel('trainee-home-ratings')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'ratings',
          filter: `book_id=eq.${bookOfMonth.id}`
        },
        (payload) => {
          console.log('🔄 TraineeHome: Real-time rating change detected:', payload);
          
          // Handle different types of changes
          if (payload.eventType === 'INSERT') {
            console.log('➕ TraineeHome: New rating added:', payload.new);
            // Add the new rating to the list
            setRatings(prevRatings => [payload.new, ...prevRatings]);
          } else if (payload.eventType === 'UPDATE') {
            console.log('✏️ TraineeHome: Rating updated:', payload.new);
            // Update the existing rating in the list
            setRatings(prevRatings => 
              prevRatings.map(rating => 
                rating.id === payload.new.id 
                  ? { ...rating, ...payload.new }
                  : rating
              )
            );
          } else if (payload.eventType === 'DELETE') {
            console.log('🗑️ TraineeHome: Rating deleted:', payload.old);
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
      console.log('🔌 TraineeHome: Cleaning up real-time subscription');
      ratingsSubscription.unsubscribe();
    };
  }, [bookOfMonth]); // Re-subscribe when book of the month changes

  // Recalculate average rating when ratings change
  useEffect(() => {
    if (ratings.length > 0) {
      const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
      setAverageRating(avg);
      console.log('📊 TraineeHome: Average rating updated to:', avg.toFixed(1), 'from', ratings.length, 'ratings');
    } else {
      setAverageRating(0);
      console.log('📊 TraineeHome: No ratings, average set to 0');
    }
  }, [ratings]);

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
        <View style={[styles.header, { 
          backgroundColor: cardBackground, 
          borderBottomColor: borderColor, 
          paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 10 : 16),
          paddingBottom: Platform.OS === 'ios' ? 6 : 12,
        }]}>
          <Image source={require('../assets/images/mitconnect-logo.png')} style={styles.logo} /> 
          <Text style={[styles.appName, { color: textColor }]}>
            <Text style={{ color: textColor }}>MIT</Text>
            <Text style={{ color: '#43C6AC' }}>Connect</Text>
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
                console.log('TraineeHome Banner: Reset to Admin View pressed');
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

        <ScrollView contentContainerStyle={[styles.scrollContent, {flexGrow: 1}]} showsVerticalScrollIndicator={false}>
          {highlightCards.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="star-outline" size={64} color="#ccc" />
              <Text style={styles.emptyStateTitle}>No Featured Content</Text>
              <Text style={styles.emptyStateText}>
                There are no featured highlights this week. Check back later for exciting updates!
              </Text>
            </View>
          ) : (
            <>
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
              <View style={styles.sectionHeaderContainer}>
                <View style={[styles.sectionIconContainer, { backgroundColor: isDarkMode ? '#2A2A2A' : '#E8F5E8' }]}>
                  <Ionicons name="calendar" size={20} color="#7B61FF" />
                </View>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Upcoming Events</Text>
              </View>
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
                  <TouchableOpacity onPress={() => router.push({ pathname: '/event-details', params: { id: item.id, from: 'trainee-home' } })}>
                  <View style={[styles.eventCard, { backgroundColor: cardBackground }]}>
                    <View style={styles.eventCardContent}>
                      <View style={styles.eventCardHeader}>
                        <Text style={styles.eventDaysLeft}>{item.daysLeft} days Left</Text>
                        <Ionicons name="ellipsis-horizontal" size={18} color="#bbb" />
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
            </>
          )}
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
                  } else if (link.key === 'hub') {
                    if (pathname !== '/trainee-hub') {
                      router.push('/trainee-hub');
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
                  } else if (link.key === 'checklist') {
                    if (pathname !== '/trainee-checklist') {
                      router.push('/trainee-checklist');
                    }
                  }
                }}
              >
                {link.icon}
                <Text style={[styles.portalLabel, { color: portalLabelColor }]}>{link.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
                      <View style={styles.sectionHeaderContainer}>
              <View style={[styles.sectionIconContainer, { backgroundColor: isDarkMode ? '#2A2A2A' : '#E8F5E8' }]}>
                <Ionicons name="book" size={20} color="#1abc9c" />
              </View>
              <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#222' }]}>Book of the Month</Text>
            </View>
          {loadingBookOfMonth ? (
            <View style={[styles.emptyState, { backgroundColor: cardBackground }]}>
              <Ionicons name="book-outline" size={64} color={secondaryTextColor} />
              <Text style={[styles.emptyStateTitle, { color: textColor }]}>Loading Book of the Month...</Text>
              <Text style={[styles.emptyStateText, { color: secondaryTextColor }]}>
                We are fetching the latest book of the month for you.
              </Text>
            </View>
          ) : bookOfMonth ? (
            <TouchableOpacity
              style={[styles.featuredBookCard, { backgroundColor: isDarkMode ? '#23272b' : '#fff' }]}
              activeOpacity={0.85}
              onPress={() => router.push({ 
                pathname: '/books-management/[id]/details', 
                params: { id: bookOfMonth.id.toString() } 
              })}
            >
              <View style={styles.featuredBookCover}>
                <Image 
                  source={{ uri: bookOfMonth.cover_image_url || 'https://covers.openlibrary.org/b/id/7222246-L.jpg' }} 
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
                <View style={[styles.genreChip, { backgroundColor: getGenreColor(bookOfMonth.genre || '') }]}><Text style={[styles.genreText, { color: isDarkMode ? '#23272b' : '#222' }]}>{bookOfMonth.genre || 'Philosophical Fiction'}</Text></View>
                <Text style={[styles.featuredBookTitle, { color: isDarkMode ? '#fff' : '#222' }]}>{bookOfMonth.title}</Text>
                <Text style={[styles.featuredBookAuthor, { color: isDarkMode ? '#fff' : '#888' }]}>By {bookOfMonth.author}</Text>
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
                  <Text style={[styles.ratingText, { color: isDarkMode ? '#fff' : '#222', fontSize: 12 }]}>
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
            <View style={[styles.emptyState, { backgroundColor: cardBackground }]}>
              <Ionicons name="book-outline" size={64} color={secondaryTextColor} />
              <Text style={[styles.emptyStateTitle, { color: textColor }]}>No Book of the Month Set</Text>
              <Text style={[styles.emptyStateText, { color: secondaryTextColor }]}>
                There is no book of the month currently set. Check back later for exciting reads!
              </Text>
            </View>
          )}
        </ScrollView>
        <View style={[styles.tabBar, { backgroundColor: isDarkMode ? '#23272b' : '#fff', borderTopColor: isDarkMode ? '#2D333B' : '#eee' }]}>
          <TouchableOpacity 
            style={styles.tabBtn} 
            onPress={() => { 
              setActiveTab('home'); 
              if (pathname !== '/trainee-home') {
                router.push('/trainee-home'); 
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="home" size={22} color={activeTab === 'home' ? '#43C6AC' : (isDarkMode ? '#AEB6C1' : '#222')} />
            <Text style={[styles.tabLabel, { color: isDarkMode ? '#AEB6C1' : '#888' }]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.tabBtn} 
            onPress={() => { 
              setActiveTab('events'); 
              if (pathname !== '/events?noHeader=1') {
                router.push('/events?noHeader=1'); 
              }
            }}
            activeOpacity={0.7}
          >
            <MaterialIcons name="event" size={22} color={activeTab === 'events' ? '#43C6AC' : (isDarkMode ? '#AEB6C1' : '#222')} />
            <Text style={[styles.tabLabel, { color: isDarkMode ? '#AEB6C1' : '#888' }]}>Events</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.tabBtn} 
            onPress={() => { 
              setActiveTab('hub'); 
              if (pathname !== '/trainee-hub') {
                router.push('/trainee-hub'); 
              }
            }}
            activeOpacity={0.7}
          >
            <MaterialIcons name="dashboard" size={22} color={activeTab === 'hub' ? '#43C6AC' : (isDarkMode ? '#AEB6C1' : '#222')} />
            <Text style={[styles.tabLabel, { color: isDarkMode ? '#AEB6C1' : '#888' }]}>Hub</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.tabBtn} 
            onPress={() => { 
              setActiveTab('checklist'); 
              if (pathname !== '/trainee-checklist') {
                router.push('/trainee-checklist'); 
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-done-circle-outline" size={22} color={activeTab === 'checklist' ? '#43C6AC' : (isDarkMode ? '#AEB6C1' : '#222')} />
            <Text style={[styles.tabLabel, { color: isDarkMode ? '#AEB6C1' : '#888' }]}>Checklist</Text>
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
    color: '#222',
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
  eventBtnRegistered: {
    backgroundColor: '#43C6AC',
    opacity: 0.7,
  },
  eventBtnTextRegistered: {
    color: '#fff',
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
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginBottom: 10,
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
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
    paddingVertical: 12,
    paddingBottom: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
}); 