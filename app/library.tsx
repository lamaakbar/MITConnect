import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../components/ThemeContext';
import { useThemeColor } from '../hooks/useThemeColor';
import { useUserContext } from '../components/UserContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../components/AuthContext';
import { supabase } from '../services/supabase';
import { getGenreColor } from '../constants/Genres';

type Book = {
  id: number;
  title: string;
  author: string;
  description?: string;
  cover_image_url?: string;
  cover?: string;
  genre?: string;
  genreColor?: string;
};

export default function LibraryScreen() {
  const router = useRouter();
  
  // All hooks called at the top level - no try-catch blocks
  const themeContext = useTheme();
  const userContext = useUserContext();
  const insets = useSafeAreaInsets();
  const authContext = useAuth();
  
  // useState hooks
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

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
        console.log(`🔍 Search strategy ${i + 1} for:`, title, 'URL:', searchUrl);
        
        const response = await fetch(searchUrl);
        const data = await response.json();
        
        console.log(`📊 Search ${i + 1} results:`, data.docs?.length || 0, 'books found');
        
        if (data.docs && data.docs.length > 0) {
          // Find the best match
          const bestMatch = data.docs.find((book: any) => book.cover_i) || data.docs[0];
          
          if (bestMatch.cover_i) {
            const coverUrl = `https://covers.openlibrary.org/b/id/${bestMatch.cover_i}-L.jpg`;
            console.log('✅ Found cover for:', title, 'URL:', coverUrl, 'Match:', bestMatch.title);
            return coverUrl;
          }
        }
      }
      
      console.log('❌ No cover found for:', title, 'after trying all strategies');
      return null;
    } catch (error) {
      console.log('❌ Error fetching cover for:', title, error);
      return null;
    }
  };

  // Safe extraction of values with fallbacks
  const isDarkMode = themeContext?.isDarkMode || false;
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

  useEffect(() => {
    const fetchUserBooks = async () => {
      console.log('🔍 Fetching books for user:', user?.id);
      if (!user) {
        console.log('⚠️ No user found, skipping book fetch');
        return;
      }
      setLoading(true);
      setError('');
      try {
        // 1. Get all book_ids linked to this user
        const { data: userBooks, error: userBooksError } = await supabase
          .from('user_books')
          .select('book_id')
          .eq('user_id', user.id);
        if (userBooksError) throw userBooksError;
        
        console.log('👤 User books relationship:', userBooks);
        
        if (!userBooks || userBooks.length === 0) {
          console.log('⚠️ No books assigned to user');
          setBooks([]);
          setLoading(false);
          return;
        }
        const bookIds = userBooks.map(ub => ub.book_id);
        console.log('📖 Book IDs to fetch:', bookIds);
        // 2. Get the actual book details
        const { data: booksData, error: booksError } = await supabase
          .from('books')
          .select('*')
          .in('id', bookIds);
        if (booksError) throw booksError;
        
        console.log('📚 Raw books data from database:', booksData);
        
        // Process books to handle local file URIs and fetch real covers
        const processedBooks = await Promise.all((booksData || []).map(async (book) => {
          console.log('📚 Book from database:', book.title, 'Cover URL:', book.cover_image_url);
          
          // Check if the book has a local file URI (which won't work)
          const hasLocalFileUri = book.cover_image_url && 
            (book.cover_image_url.startsWith('file://') || 
             book.cover_image_url.match(/^[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}\.(jpg|png|jpeg)$/i));
          
          if (hasLocalFileUri) {
            console.log('🔍 Fetching real cover for book:', book.title);
            
            // Fetch the actual book cover from OpenLibrary API
            const realCoverUrl = await fetchBookCover(book.title, book.author || '');
            
            // If OpenLibrary doesn't have the cover, try to use a generic book cover
            // based on the book's genre or type
            if (!realCoverUrl) {
              console.log('⚠️ OpenLibrary failed, using genre-based cover for:', book.title);
              
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
                cover_image_url: selectedCover
              };
            }
            
            return {
              ...book,
              cover_image_url: realCoverUrl
            };
          }
          
          return book; // Keep the original data from database
        }));
        
        console.log('📚 Final processed books:', processedBooks.map(b => ({ title: b.title, cover: b.cover_image_url })));
        setBooks(processedBooks);
      } catch (err) {
        setError('Failed to load books.');
        setBooks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUserBooks();
  }, [user]);

  return (
    <View style={[styles.safeArea, { backgroundColor: isDarkMode ? darkBg : backgroundColor }]}>
      {userRole === 'employee' || userRole === 'trainee' ? (
        <>
          <StatusBar style={isDarkMode ? 'light' : 'dark'} translucent backgroundColor="transparent" />
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingTop: insets.top,
            paddingBottom: 12,
            backgroundColor: isDarkMode ? darkCard : cardBackground,
            borderBottomWidth: 1,
            borderBottomColor: isDarkMode ? darkBorder : borderColor,
          }}>
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 8 }}>
              <Ionicons name="arrow-back" size={24} color={iconColor} />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                letterSpacing: 0.5,
                color: isDarkMode ? darkText : textColor,
                textAlign: 'center',
              }}>Library</Text>
            </View>
            <View style={{ width: 32 }} />
          </View>
        </>
      ) : null}
      
      <FlatList
        data={books}
        keyExtractor={item => item.id?.toString()}
        contentContainerStyle={styles.bookList}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.bookCard, { backgroundColor: cardBackground }]}
            onPress={() => router.push(`/library/${item.id}/details`)}
            activeOpacity={0.7}
          > 
            <View style={styles.bookCoverContainer}>
              {item.cover_image_url ? (
                <Image 
                  source={{ uri: item.cover_image_url }} 
                  style={styles.bookCover}
                  resizeMode="cover"
                  onError={(error) => {
                    console.log('❌ Library book image error for:', item.title, error.nativeEvent.error);
                    setFailedImages(prev => new Set(prev).add(item.id));
                  }}
                  onLoad={() => console.log('✅ Library book image loaded successfully for:', item.title)}
                />
              ) : (
                <View style={styles.fallbackImage}>
                  <Ionicons name="book-outline" size={30} color="#ccc" />
                </View>
              )}
              {failedImages.has(item.id) && (
                <View style={styles.fallbackImage}>
                  <Ionicons name="book-outline" size={30} color="#ccc" />
                </View>
              )}
            </View>
            <View style={styles.bookInfo}>
              <Text style={[styles.bookTitle, { color: textColor }]}>{item.title}</Text>
              <Text style={[styles.bookAuthor, { color: secondaryTextColor }]}>{`By ${item.author}`}</Text>
              {/* Optionally display genre if available */}
              {item.genre && (
                <View style={[styles.genreChip, { backgroundColor: getGenreColor(item.genre) }]}> 
                  <Text style={[styles.genreText, { color: isDarkMode ? '#23272b' : '#222' }]}>{item.genre}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View style={[styles.emptyState, { backgroundColor: cardBackground }]}>
            <Ionicons name="library-outline" size={64} color={secondaryTextColor} />
            <Text style={[styles.emptyStateTitle, { color: textColor }]}>Your Library is Empty</Text>
            <Text style={[styles.emptyStateText, { color: secondaryTextColor }]}>
              {loading ? 'Loading your books...' : 'No books have been assigned to you yet.'}
            </Text>
            {error && (
              <Text style={[styles.errorText, { color: '#e74c3c' }]}>{error}</Text>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  bookList: {
    padding: 16,
  },
  bookCard: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bookCoverContainer: {
    position: 'relative',
    marginRight: 16,
  },
  bookCover: {
    width: 60,
    height: 90,
    borderRadius: 8,
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
    borderRadius: 8,
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    marginBottom: 6,
  },
  genreChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 2,
  },
  genreText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderRadius: 12,
    marginTop: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
}); 