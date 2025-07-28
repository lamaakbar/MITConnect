import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  TextInput, 
  Modal, 
  KeyboardAvoidingView, 
  Platform,
  FlatList,
  SafeAreaView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useBooks } from '../components/BookContext';
import { useTheme } from '../components/ThemeContext';
import { useThemeColor } from '../hooks/useThemeColor';
import { useUserContext } from '../components/UserContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { useAuth } from '../components/AuthContext';
import { supabase } from '../services/supabase';
import { getGenreColor } from '../constants/Genres';

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

// Mock featured book data
const FEATURED_BOOK = {
  id: '1',
  title: 'The Alchemist',
  author: 'Paulo Coelho',
  genre: 'Philosophical Fiction',
  cover: 'https://covers.openlibrary.org/b/id/7222246-L.jpg',
  rating: 4.9,

  description: 'A magical story about following your dreams and listening to your heart. This international bestseller tells the mystical story of Santiago, an Andalusian shepherd boy who yearns to travel in search of a worldly treasure as extravagant as any ever found.'
};

export default function BookClubScreen() {
  const router = useRouter();
  
  // All hooks called at the top level - no try-catch blocks
  const booksContext = useBooks();
  const themeContext = useTheme();
  const userContext = useUserContext();
  const insets = useSafeAreaInsets();
  const authContext = useAuth();
  
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
        console.log(`🔍 BookClub search strategy ${i + 1} for:`, title, 'URL:', searchUrl);
        
        const response = await fetch(searchUrl);
        const data = await response.json();
        
        if (data.docs && data.docs.length > 0) {
          // Find the best match
          const bestMatch = data.docs.find((book: any) => book.cover_i) || data.docs[0];
          
          if (bestMatch.cover_i) {
            const coverUrl = `https://covers.openlibrary.org/b/id/${bestMatch.cover_i}-L.jpg`;
            console.log('✅ BookClub found cover for:', title, 'URL:', coverUrl);
            return coverUrl;
          }
        }
      }
      
      console.log('❌ BookClub no cover found for:', title);
      return null;
    } catch (error) {
      console.log('❌ BookClub error fetching cover for:', title, error);
      return null;
    }
  };
  
  // useState hooks
  const [tab, setTab] = useState('bookclub');
  const [modal, setModal] = useState(false);
  const [book, setBook] = useState<any>(null);
  const [booksOfMonth, setBooksOfMonth] = useState<BookOfMonth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentSelections, setRecentSelections] = useState<BookOfMonth[]>([]);
  const [loadingRecentSelections, setLoadingRecentSelections] = useState(true);
  
  // Rating and Comments State (matching book details screens)
  const [ratings, setRatings] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [userRating, setUserRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Safe extraction of values with fallbacks
  const books = booksContext?.books || [];
  const isDarkMode = themeContext?.isDarkMode || false;
  const toggleTheme = themeContext?.toggleTheme || (() => {});
  const userRole = userContext?.userRole || 'trainee';
  const user = authContext?.user || null;
  
  // Theme colors with fallbacks
  const backgroundColor = useThemeColor({}, 'background') || '#f6f7f9';
  const textColor = useThemeColor({}, 'text') || '#222';
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  const borderColor = isDarkMode ? '#2A2A2A' : '#eee';
  const iconColor = useThemeColor({}, 'icon') || '#222';

  // Dark theme colors
  const darkBg = '#181C20';
  const darkCard = '#23272b';
  const darkBorder = '#2D333B';
  const darkText = '#F3F6FA';
  const darkSecondary = '#AEB6C1';
  const darkHighlight = '#43C6AC';

  // Defensive check after all hooks are called
  if (!Array.isArray(books)) {
    return (
      <View style={[styles.container, { backgroundColor: isDarkMode ? darkBg : backgroundColor }]}>
        <Text style={{ color: textColor }}>Loading...</Text>
      </View>
    );
  }

  useEffect(() => {
    const fetchBooksOfMonth = async () => {
      setLoading(true);
      setError('');
      try {
        const { data: booksData, error: booksError } = await supabase
          .from('books')
          .select('*')
          .eq('category', 'book_of_the_month');
        if (booksError) throw booksError;
        
        // Process books to handle local file URIs and fetch real covers
        const processedBooks = await Promise.all((booksData || []).map(async (book) => {
          console.log('📚 BookClub processing book of the month:', book.title, 'Cover URL:', book.cover_image_url);
          
          // Check if the book has a local file URI (which won't work)
          const hasLocalFileUri = book.cover_image_url && 
            (book.cover_image_url.startsWith('file://') || 
             book.cover_image_url.match(/^[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}\.(jpg|png|jpeg)$/i));
          
          if (hasLocalFileUri) {
            console.log('🔍 BookClub fetching real cover for book of the month:', book.title);
            
            // Fetch the actual book cover from OpenLibrary API
            const realCoverUrl = await fetchBookCover(book.title, book.author || '');
            
            // If OpenLibrary doesn't have the cover, try to use a generic book cover
            // based on the book's genre or type
            if (!realCoverUrl) {
              console.log('⚠️ BookClub OpenLibrary failed, using genre-based cover for:', book.title);
              
              // Use different cover IDs based on book genre or title keywords
              const genreCovers = {
                'self-help': 'https://covers.openlibrary.org/b/id/7222246-L.jpg',
                'philosophy': 'https://covers.openlibrary.org/b/id/7222247-L.jpg',
                'fiction': 'https://covers.openlibrary.org/b/id/7222248-L.jpg',
                'business': 'https://covers.openlibrary.org/b/id/7222249-L.jpg',
                'default': 'https://covers.openlibrary.org/b/id/7222250-L.jpg'
              };
              
              // Determine genre based on title keywords
              const titleLower = book.title.toLowerCase();
              let selectedCover = genreCovers.default;
              
              if (titleLower.includes('think') || titleLower.includes('believe') || titleLower.includes('mind')) {
                selectedCover = genreCovers['self-help'];
              } else if (titleLower.includes('philosophy') || titleLower.includes('wisdom')) {
                selectedCover = genreCovers.philosophy;
              } else if (titleLower.includes('business') || titleLower.includes('success')) {
                selectedCover = genreCovers.business;
              }
              
              return {
                ...book,
                cover_image_url: selectedCover,
                cover: selectedCover
              };
            } else {
              return {
                ...book,
                cover_image_url: realCoverUrl,
                cover: realCoverUrl
              };
            }
          }
          
          return book;
        }));
        
        setBooksOfMonth(processedBooks);
      } catch (err) {
        setError('Failed to load books of the month.');
        setBooksOfMonth([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchRecentSelections = async () => {
      setLoadingRecentSelections(true);
      try {
        const { data: booksData, error: booksError } = await supabase
          .from('books')
          .select('*')
          .eq('category', 'library')
          .order('created_at', { ascending: false })
          .limit(2);
        
        if (booksError) throw booksError;
        
        // Process recent books to handle local file URIs and fetch real covers
        const processedRecentBooks = await Promise.all((booksData || []).map(async (book) => {
          console.log('📚 BookClub processing recent book:', book.title, 'Cover URL:', book.cover_image_url);
          
          // Check if the book has a local file URI (which won't work)
          const hasLocalFileUri = book.cover_image_url && 
            (book.cover_image_url.startsWith('file://') || 
             book.cover_image_url.match(/^[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}\.(jpg|png|jpeg)$/i));
          
          if (hasLocalFileUri) {
            console.log('🔍 BookClub fetching real cover for recent book:', book.title);
            
            // Fetch the actual book cover from OpenLibrary API
            const realCoverUrl = await fetchBookCover(book.title, book.author || '');
            
            // If OpenLibrary doesn't have the cover, try to use a generic book cover
            // based on the book's genre or type
            if (!realCoverUrl) {
              console.log('⚠️ BookClub OpenLibrary failed, using genre-based cover for recent book:', book.title);
              
              // Use different cover IDs based on book genre or title keywords
              const genreCovers = {
                'self-help': 'https://covers.openlibrary.org/b/id/7222246-L.jpg',
                'philosophy': 'https://covers.openlibrary.org/b/id/7222247-L.jpg',
                'fiction': 'https://covers.openlibrary.org/b/id/7222248-L.jpg',
                'business': 'https://covers.openlibrary.org/b/id/7222249-L.jpg',
                'default': 'https://covers.openlibrary.org/b/id/7222250-L.jpg'
              };
              
              // Determine genre based on title keywords
              const titleLower = book.title.toLowerCase();
              let selectedCover = genreCovers.default;
              
              if (titleLower.includes('think') || titleLower.includes('believe') || titleLower.includes('mind')) {
                selectedCover = genreCovers['self-help'];
              } else if (titleLower.includes('philosophy') || titleLower.includes('wisdom')) {
                selectedCover = genreCovers.philosophy;
              } else if (titleLower.includes('business') || titleLower.includes('success')) {
                selectedCover = genreCovers.business;
              }
              
              return {
                ...book,
                cover_image_url: selectedCover,
                cover: selectedCover
              };
            } else {
              return {
                ...book,
                cover_image_url: realCoverUrl,
                cover: realCoverUrl
              };
            }
          }
          
          return book;
        }));
        
        setRecentSelections(processedRecentBooks);
      } catch (err) {
        console.error('Error fetching recent selections:', err);
        setRecentSelections([]);
      } finally {
        setLoadingRecentSelections(false);
      }
    };

    fetchBooksOfMonth();
    fetchRecentSelections();
  }, []);

  // Fetch ratings, comments, and user data when books of month are loaded
  useEffect(() => {
    if (booksOfMonth.length > 0) {
      Promise.all([
        fetchRatings(),
        fetchComments(),
        getCurrentUser()
      ]);
    }
  }, [booksOfMonth]);

  // Set up real-time subscription for Book of the Month ratings
  useEffect(() => {
    if (booksOfMonth.length === 0) return;

    const bookId = booksOfMonth[0].id;
    console.log('🔄 BookClub: Setting up real-time subscription for book ID:', bookId);
    
    // Set up real-time subscription for ratings
    const ratingsSubscription = supabase
      .channel('bookclub-ratings')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'ratings',
          filter: `book_id=eq.${bookId}`
        },
        (payload) => {
          console.log('🔄 BookClub: Real-time rating change detected:', payload);
          
          // Handle different types of changes
          if (payload.eventType === 'INSERT') {
            console.log('➕ BookClub: New rating added:', payload.new);
            // Add the new rating to the list
            setRatings(prevRatings => [payload.new, ...prevRatings]);
          } else if (payload.eventType === 'UPDATE') {
            console.log('✏️ BookClub: Rating updated:', payload.new);
            // Update the existing rating in the list
            setRatings(prevRatings => 
              prevRatings.map(rating => 
                rating.id === payload.new.id 
                  ? { ...rating, ...payload.new }
                  : rating
              )
            );
          } else if (payload.eventType === 'DELETE') {
            console.log('🗑️ BookClub: Rating deleted:', payload.old);
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
      console.log('🔌 BookClub: Cleaning up real-time subscription');
      ratingsSubscription.unsubscribe();
    };
  }, [booksOfMonth]); // Re-subscribe when books of month change

  const openBookModal = (book: any) => {
    setBook(book);
    setModal(true);
  };

  const closeBookModal = () => {
    setModal(false);
    setBook(null);
  };

  // Fetch ratings for book of the month
  const fetchRatings = async () => {
    try {
      if (booksOfMonth.length > 0) {
        const { data, error } = await supabase
          .from('ratings')
          .select(`
            *,
            users:user_id(name)
          `)
          .eq('book_id', booksOfMonth[0].id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const processedRatings = data.map((rating: any) => ({
          ...rating,
          user_name: rating.users?.name || 'Anonymous'
        }));
        
        setRatings(processedRatings);
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  // Fetch comments for book of the month
  const fetchComments = async () => {
    try {
      if (booksOfMonth.length > 0) {
        const { data, error } = await supabase
          .from('comments')
          .select(`
            *,
            users:user_id(name)
          `)
          .eq('book_id', booksOfMonth[0].id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const processedComments = data.map((comment: any) => ({
          ...comment,
          user_name: comment.users?.name || 'Anonymous'
        }));
        
        setComments(processedComments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  // Get current user and their rating
  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      if (user && booksOfMonth.length > 0) {
        // Get user's existing rating
        const { data: userRatingData } = await supabase
          .from('ratings')
          .select('rating')
          .eq('book_id', booksOfMonth[0].id)
          .eq('user_id', user.id)
          .single();
        
        if (userRatingData) {
          setUserRating(userRatingData.rating);
        }
      }
    } catch (error) {
      console.error('Error getting user:', error);
    }
  };

  // Submit rating
  const submitRating = async (rating: number) => {
    if (!currentUser || booksOfMonth.length === 0) {
      Alert.alert('Error', 'Please log in to rate this book');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // First, check if user has already rated this book
      const { data: existingRating, error: checkError } = await supabase
        .from('ratings')
        .select('rating')
        .eq('user_id', currentUser.id)
        .eq('book_id', booksOfMonth[0].id)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected if no rating exists
        throw checkError;
      }
      
      if (existingRating) {
        // User has already rated this book
        Alert.alert('Rating Already Submitted', 'You have already rated this book.');
        return;
      }
      
      // User has not rated this book yet, submit the rating
      const { error } = await supabase
        .from('ratings')
        .insert({
          user_id: currentUser.id,
          book_id: booksOfMonth[0].id,
          rating: rating
        });
      
      if (error) throw error;
      
      setUserRating(rating);
      await fetchRatings();
      Alert.alert('Success', 'Thank you! Your rating has been submitted.');
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', 'Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit comment
  const submitComment = async () => {
    if (!currentUser || booksOfMonth.length === 0) {
      Alert.alert('Error', 'Please log in to comment');
      return;
    }
    
    if (!newComment.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const { error } = await supabase
        .from('comments')
        .insert({
          user_id: currentUser.id,
          book_id: booksOfMonth[0].id,
          content: newComment.trim()
        });
      
      if (error) throw error;
      
      setNewComment('');
      await fetchComments();
      Alert.alert('Success', 'Comment submitted successfully!');
    } catch (error) {
      console.error('Error submitting comment:', error);
      Alert.alert('Error', 'Failed to submit comment');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate average rating
  const averageRating = ratings.length > 0 
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
    : 4.9; // Default rating for book of the month

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? darkBg : backgroundColor }]}>
      {(userRole === 'employee' || userRole === 'trainee') && (
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      )}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingTop: insets.top + 10,
        paddingBottom: 6,
        backgroundColor: isDarkMode ? darkCard : cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: isDarkMode ? darkBorder : borderColor,
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 8 }}>
          <Ionicons name="arrow-back" size={24} color={iconColor} />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '700', letterSpacing: 0.5, flex: 1, textAlign: 'center', color: isDarkMode ? darkText : textColor }}>
          MIT<Text style={{ color: darkHighlight }}>Connect</Text>
        </Text>
        <TouchableOpacity 
          onPress={() => router.push('/library')} 
          style={{ 
            padding: 8, 
            backgroundColor: darkHighlight, 
            borderRadius: 8
          }}
        >
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Library</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Featured Book Section */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          <Ionicons name="star" size={20} color="#1abc9c" /> Book of the Month
        </Text>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
            <ActivityIndicator size="large" color={darkHighlight} />
            <Text style={[styles.aboutText, { color: isDarkMode ? '#ccc' : '#444', marginTop: 16 }]}>Loading Book of the Month...</Text>
          </View>
        ) : booksOfMonth.length > 0 ? (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
            {/* Book Information Section */}
            <View style={{ padding: 18 }}>
              <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                <View style={{ width: 120, height: 180, borderRadius: 12, overflow: 'hidden', marginRight: 16 }}>
                  <Image 
                    source={{ uri: booksOfMonth[0].cover_image_url || booksOfMonth[0].cover || 'https://covers.openlibrary.org/b/id/7222246-L.jpg' }} 
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                    onError={(error) => console.log('❌ Book of month image error:', error.nativeEvent.error)}
                    onLoad={() => console.log('✅ Book of month image loaded successfully')}
                  />
                  {!booksOfMonth[0].cover_image_url && !booksOfMonth[0].cover && (
                    <View style={{ width: '100%', height: '100%', backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="book-outline" size={40} color="#666" />
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.featuredTitle, { color: textColor, fontSize: 24, fontWeight: '700', marginBottom: 8 }]}>{booksOfMonth[0].title}</Text>
                  <Text style={[styles.featuredAuthor, { color: secondaryTextColor, fontSize: 16, marginBottom: 12 }]}>By {booksOfMonth[0].author}</Text>
                  
                  {booksOfMonth[0].genre && (
                                      <View style={[styles.genreChip, { backgroundColor: getGenreColor(booksOfMonth[0].genre || ''), marginBottom: 12 }]}>
                    <Text style={[styles.genreText, { color: isDarkMode ? '#23272b' : '#222' }]}>{booksOfMonth[0].genre}</Text>
                  </View>
                  )}
                  
                  {/* Average Rating Display */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    {[1,2,3,4,5].map(i => (
                      <MaterialIcons
                        key={i}
                        name={i <= averageRating ? 'star' : 'star-border'}
                        size={20}
                        color="#F4B400"
                        style={{ marginRight: 2 }}
                      />
                    ))}
                    <Text style={[styles.ratingText, { color: textColor, marginLeft: 8, fontSize: 16 }]}>
                      {averageRating.toFixed(1)} ({ratings.length} ratings)
                    </Text>
                  </View>
                  

                </View>
              </View>
              
              {/* About This Book */}
              {booksOfMonth[0].description && (
                <View style={[styles.aboutBox, { backgroundColor: isDarkMode ? '#23272b' : '#f6f7f9', marginBottom: 24 }]}>
                  <Text style={[styles.aboutLabel, { color: textColor }]}>About This Book</Text>
                  <Text style={[styles.aboutText, { color: isDarkMode ? '#ccc' : '#444' }]}>{booksOfMonth[0].description}</Text>
                </View>
              )}
            </View>

            {/* User Rating Section */}
            <View style={{ paddingHorizontal: 18, marginBottom: 24 }}>
              <View style={[styles.rateBox, { backgroundColor: isDarkMode ? '#23272b' : '#f6f7f9' }]}>
                <Text style={[styles.rateLabel, { color: textColor, fontSize: 18, fontWeight: '600', marginBottom: 12 }]}>
                  <MaterialIcons name="star-border" size={20} color="#F4B400" /> Rate This Book
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 8 }}>
                  {[1,2,3,4,5].map(i => (
                    <TouchableOpacity key={i} onPress={() => submitRating(i)} disabled={submitting}>
                      <MaterialIcons
                        name={i <= userRating ? 'star' : 'star-border'}
                        size={32}
                        color="#F4B400"
                        style={{ marginHorizontal: 4 }}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                {userRating > 0 && (
                  <Text style={[styles.ratingText, { color: isDarkMode ? '#aaa' : '#555', textAlign: 'center', fontSize: 14 }]}>
                    You rated this book {userRating} star{userRating > 1 ? 's' : ''}
                  </Text>
                )}
              </View>
            </View>

            {/* Comments Section */}
            <View style={{ paddingHorizontal: 18 }}>
              <View style={styles.commentSection}>
                <Text style={[styles.commentTitle, { color: textColor, fontSize: 18, fontWeight: '600', marginBottom: 16 }]}>
                  Comments ({comments.length})
                </Text>
                
                {currentUser && (
                  <>
                    <View style={styles.commentInputRow}>
                      <TextInput
                        style={[styles.commentInputArea, { 
                          backgroundColor: isDarkMode ? '#23272b' : '#f6f7f9', 
                          color: textColor, 
                          borderColor: borderColor,
                          minHeight: 80,
                          padding: 12
                        }]}
                        placeholder="Write a comment..."
                        placeholderTextColor={isDarkMode ? '#888' : '#aaa'}
                        value={newComment}
                        onChangeText={setNewComment}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                      />
                    </View>
                    <TouchableOpacity
                      style={[styles.commentPostBtn, { 
                        backgroundColor: isDarkMode ? '#23272b' : '#e6f0fe',
                        paddingVertical: 12,
                        paddingHorizontal: 20,
                        borderRadius: 8,
                        marginTop: 8,
                        marginBottom: 16
                      }]}
                      onPress={submitComment}
                      disabled={submitting || !newComment.trim()}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.commentPostBtnText, { 
                        color: isDarkMode ? '#43C6AC' : '#2196f3',
                        textAlign: 'center',
                        fontWeight: '600'
                      }]}>
                        {submitting ? 'Posting...' : 'Post Comment'}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
                
                <Text style={[styles.commentSubtitle, { color: textColor, marginBottom: 12 }]}>Recent Comments</Text>
                <View style={styles.commentList}>
                  {comments.length === 0 ? (
                    <Text style={[styles.noComments, { color: isDarkMode ? '#aaa' : '#888' }]}>
                      No comments yet. Be the first to comment!
                    </Text>
                  ) : (
                    comments.map((comment, idx) => (
                      <View key={idx} style={[styles.commentBubble, { 
                        backgroundColor: isDarkMode ? '#23272b' : '#f6f7f9',
                        marginBottom: 12,
                        padding: 16
                      }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <Text style={[styles.commentAuthor, { color: textColor, fontWeight: '600' }]}>
                            {comment.user_name}
                          </Text>
                          <Text style={[styles.commentDate, { color: isDarkMode ? '#aaa' : '#888', fontSize: 12 }]}>
                            {new Date(comment.created_at).toLocaleDateString()}
                          </Text>
                        </View>
                        <Text style={[styles.commentText, { color: textColor, lineHeight: 20 }]}>
                          {comment.content}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              </View>
            </View>
          </ScrollView>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
            <Ionicons name="book-outline" size={64} color={secondaryTextColor} />
            <Text style={[styles.aboutLabel, { color: textColor, marginTop: 16, fontSize: 18 }]}>No Book of the Month</Text>
            <Text style={[styles.aboutText, { color: isDarkMode ? '#ccc' : '#444', textAlign: 'center', marginTop: 8 }]}>
              No book has been set as Book of the Month yet. Check back later for exciting reads!
            </Text>
          </View>
        )}

      </ScrollView>

      {/* Book Details Modal */}
      <Modal
        visible={modal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeBookModal}
      >
        <KeyboardAvoidingView 
          style={{ flex: 1, backgroundColor: isDarkMode ? darkBg : backgroundColor }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <View style={[styles.modalHeader, { backgroundColor: cardBackground, borderBottomColor: borderColor }]}>
              <TouchableOpacity onPress={closeBookModal} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={iconColor} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: textColor }]}>Book Details</Text>
              <View style={{ width: 40 }} />
            </View>
            
            {book && (
              <ScrollView style={{ flex: 1, padding: 18 }}>
                <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                  <Image
                    source={{ uri: book.cover_image_url || book.cover }}
                    style={styles.modalBookCover}
                    resizeMode="cover"
                  />
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={[styles.modalBookTitle, { color: textColor }]}>{book.title}</Text>
                    <Text style={[styles.modalBookAuthor, { color: secondaryTextColor }]}>By {book.author}</Text>
                    {book.genre && (
                                      <View style={[styles.genreChip, { backgroundColor: getGenreColor(book.genre || '') }]}>
                  <Text style={[styles.genreText, { color: isDarkMode ? '#23272b' : '#222' }]}>{book.genre}</Text>
                </View>
                    )}
                  </View>
                </View>
                
                {book.description && (
                  <View style={[styles.modalDescriptionBox, { backgroundColor: isDarkMode ? '#23272b' : '#f6f7f9' }]}>
                    <Text style={[styles.modalDescriptionLabel, { color: textColor }]}>Description</Text>
                    <Text style={[styles.modalDescriptionText, { color: isDarkMode ? '#ccc' : '#444' }]}>{book.description}</Text>
                  </View>
                )}
                
                {/* Rating Section */}
                <View style={[styles.ratingSection, { backgroundColor: cardBackground }]}>
                  <Text style={[styles.ratingTitle, { color: textColor }]}>Rate this book</Text>
                  <View style={styles.starContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => submitRating(star)}
                        disabled={submitting}
                        style={styles.starButton}
                      >
                        <MaterialIcons
                          name={star <= userRating ? 'star' : 'star-border'}
                          size={32}
                          color="#F4B400"
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={[styles.ratingText, { color: secondaryTextColor }]}>
                    {userRating > 0 ? `You rated this book ${userRating} star${userRating > 1 ? 's' : ''}` : 'Tap to rate'}
                  </Text>
                </View>
                
                {/* Comments Section */}
                <View style={[styles.commentsSection, { backgroundColor: cardBackground }]}>
                  <Text style={[styles.commentsTitle, { color: textColor }]}>Comments ({comments.length})</Text>
                  {currentUser && (
                    <>
                      <TextInput
                        style={[styles.commentInput, { 
                          backgroundColor: isDarkMode ? '#23272b' : '#f6f7f9',
                          color: textColor,
                          borderColor: borderColor
                        }]}
                        placeholder="Add a comment..."
                        placeholderTextColor={secondaryTextColor}
                        value={newComment}
                        onChangeText={setNewComment}
                        multiline
                      />
                      <TouchableOpacity
                        style={[styles.addCommentBtn, { backgroundColor: darkHighlight }]}
                        onPress={submitComment}
                        disabled={submitting || !newComment.trim()}
                      >
                        <Text style={styles.addCommentBtnText}>
                          {submitting ? 'Posting...' : 'Add Comment'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                  
                  {comments.map((comment, index) => (
                    <View key={index} style={[styles.commentItem, { backgroundColor: isDarkMode ? '#23272b' : '#f6f7f9' }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={[styles.commentAuthor, { color: textColor, fontWeight: '600' }]}>{comment.user_name}</Text>
                        <Text style={[styles.commentDate, { color: isDarkMode ? '#aaa' : '#888', fontSize: 12 }]}>
                          {new Date(comment.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text style={[styles.commentText, { color: textColor }]}>{comment.content}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  themeToggleBtn: {
    padding: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginHorizontal: 18,
    marginTop: 24,
    marginBottom: 16,
  },
  featuredCard: {
    marginHorizontal: 18,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featuredCover: {
    width: 80,
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  featuredAuthor: {
    fontSize: 14,
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  recommender: {
    fontSize: 13,
  },
  aboutBox: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  aboutLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12,
  },
  statCardNewSmall: {
    flex: 1,
    backgroundColor: '#f6f7f9',
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    paddingVertical: 12,
  },
  statNameBold: {
    fontSize: 13,
    color: '#222',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  statNumberSmall: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
    textAlign: 'center',
  },
  statLabelNewSmall: {
    fontSize: 11,
    color: '#555',
    fontWeight: '500',
    textAlign: 'center',
  },
  rateBox: {
    backgroundColor: '#f6f7f9',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  rateLabel: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#222',
    marginBottom: 4,
  },
  commentSection: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  commentTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#222',
    marginBottom: 8,
  },
  commentInputRow: {
    marginBottom: 8,
  },
  commentInputArea: {
    backgroundColor: '#f6f7f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#222',
    borderWidth: 1,
    borderColor: '#eee',
    minHeight: 60,
    maxHeight: 120,
    width: '100%',
    marginBottom: 8,
  },
  commentPostBtn: {
    backgroundColor: '#e6f0fe',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  commentPostBtnText: {
    color: '#2196f3',
    fontSize: 16,
    fontWeight: '600',
  },
  commentSubtitle: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#222',
    marginBottom: 8,
  },
  commentList: {
    marginTop: 4,
  },
  commentBubble: {
    backgroundColor: '#f6f7f9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentDate: {
    fontSize: 12,
  },

  noComments: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  goLibraryBtnSmall: {
    backgroundColor: '#e6f0fe',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  goLibraryBtnTextSmall: {
    color: '#2196f3',
    fontSize: 12,
    fontWeight: '600',
  },
  recentBookCard: {
    width: 140,
    marginRight: 16,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recentBookCover: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  recentBookInfo: {
    flex: 1,
  },
  recentBookTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  recentBookAuthor: {
    fontSize: 12,
    marginBottom: 6,
  },
  libraryBookCard: {
    width: 140,
    marginRight: 16,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  libraryBookCover: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  libraryBookInfo: {
    flex: 1,
  },
  libraryBookTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  libraryBookAuthor: {
    fontSize: 12,
    marginBottom: 6,
  },
  genreChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  genreText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalBookCover: {
    width: 100,
    height: 150,
    borderRadius: 8,
  },
  modalBookTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalBookAuthor: {
    fontSize: 16,
    marginBottom: 8,
  },
  modalDescriptionBox: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalDescriptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalDescriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  ratingSection: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  starButton: {
    marginHorizontal: 4,
  },
  commentsSection: {
    padding: 20,
    borderRadius: 12,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  addCommentBtn: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  addCommentBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  commentItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
}); 