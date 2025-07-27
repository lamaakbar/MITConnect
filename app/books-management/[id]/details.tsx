import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, ScrollView, StatusBar } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { supabase } from '../../../services/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Book = {
  id: number;
  title: string;
  author: string;
  description?: string;
  cover_image_url?: string;
  cover?: string;
  genre?: string;
  genre_color?: string;
  category?: string;
};

export default function BookDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  
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
        console.log(`🔍 Details search strategy ${i + 1} for:`, title, 'URL:', searchUrl);
        
        const response = await fetch(searchUrl);
        const data = await response.json();
        
        if (data.docs && data.docs.length > 0) {
          // Find the best match
          const bestMatch = data.docs.find((book: any) => book.cover_i) || data.docs[0];
          
          if (bestMatch.cover_i) {
            const coverUrl = `https://covers.openlibrary.org/b/id/${bestMatch.cover_i}-L.jpg`;
            console.log('✅ Details found cover for:', title, 'URL:', coverUrl);
            return coverUrl;
          }
        }
      }
      
      console.log('❌ Details no cover found for:', title);
      return null;
    } catch (error) {
      console.log('❌ Details error fetching cover for:', title, error);
      return null;
    }
  };
  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const borderColor = isDarkMode ? '#2A2A2A' : '#eee';
  const iconColor = useThemeColor({}, 'icon');

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBook = async () => {
      if (!id) {
        setError('No book ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        
        const { data: bookData, error: bookError } = await supabase
          .from('books')
          .select('*')
          .eq('id', parseInt(id as string))
          .single();

        if (bookError) {
          if (bookError.code === 'PGRST116') {
            setError('Book not found');
          } else {
            setError('Failed to load book details');
          }
          setBook(null);
        } else {
          console.log('📚 Details raw book data:', bookData);
          
          // Process the book cover image
          let processedBook = { ...bookData };
          
          // Check if the book has a local file URI (which won't work)
          const hasLocalFileUri = bookData.cover_image_url && 
            (bookData.cover_image_url.startsWith('file://') || 
             bookData.cover_image_url.match(/^[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}\.(jpg|png|jpeg)$/i));
          
          if (hasLocalFileUri) {
            console.log('🔍 Details fetching real cover for book:', bookData.title);
            
            // Fetch the actual book cover from OpenLibrary API
            const realCoverUrl = await fetchBookCover(bookData.title, bookData.author || '');
            
            // If OpenLibrary doesn't have the cover, try to use a generic book cover
            // based on the book's genre or type
            if (!realCoverUrl) {
              console.log('⚠️ Details OpenLibrary failed, using genre-based cover for:', bookData.title);
              
              // Use different cover IDs based on book genre or title keywords
              const genreCovers = {
                'self-help': 'https://covers.openlibrary.org/b/id/7222246-L.jpg',
                'philosophy': 'https://covers.openlibrary.org/b/id/7222247-L.jpg',
                'fiction': 'https://covers.openlibrary.org/b/id/7222248-L.jpg',
                'business': 'https://covers.openlibrary.org/b/id/7222249-L.jpg',
                'default': 'https://covers.openlibrary.org/b/id/7222250-L.jpg'
              };
              
              // Determine genre based on title keywords
              const titleLower = bookData.title.toLowerCase();
              let selectedCover = genreCovers.default;
              
              if (titleLower.includes('think') || titleLower.includes('believe') || titleLower.includes('mind')) {
                selectedCover = genreCovers['self-help'];
              } else if (titleLower.includes('philosophy') || titleLower.includes('wisdom')) {
                selectedCover = genreCovers.philosophy;
              } else if (titleLower.includes('business') || titleLower.includes('success')) {
                selectedCover = genreCovers.business;
              }
              
              processedBook.cover_image_url = selectedCover;
            } else {
              processedBook.cover_image_url = realCoverUrl;
            }
          }
          
          console.log('📚 Details final processed book:', processedBook);
          setBook(processedBook);
        }
      } catch (err) {
        console.error('Error fetching book:', err);
        setError('Failed to load book details');
        setBook(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3CB371" />
          <Text style={[styles.loadingText, { color: secondaryTextColor }]}>
            Loading book details...
          </Text>
        </View>
      </View>
    );
  }

  if (error || !book) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#E74C3C" />
          <Text style={[styles.errorTitle, { color: textColor }]}>
            {error || 'Book not found'}
          </Text>
          <Text style={[styles.errorMessage, { color: secondaryTextColor }]}>
            The book you're looking for doesn't exist or has been removed.
          </Text>
          <TouchableOpacity 
            style={[styles.errorBackButton, { backgroundColor: '#3CB371' }]}
            onPress={() => router.push('/books-management')}
          >
            <Text style={[styles.errorBackButtonText, { color: '#fff' }]}>
              Back to Books
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Full Header with MITConnect Branding */}
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: cardBackground, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          MIT<Text style={{ color: '#3CB371' }}>Connect</Text>
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Book Details Card - Matching Book Club Layout */}
        <View style={[styles.featuredCard, { backgroundColor: cardBackground }]}>
          <View style={{ flexDirection: 'row' }}>
            <Image 
              source={{ uri: book.cover_image_url || book.cover || 'https://covers.openlibrary.org/b/id/7222246-L.jpg' }} 
              style={styles.featuredCover}
              onError={(error) => {
                console.log('❌ Details book image error for:', book.title, error.nativeEvent.error);
              }}
              onLoad={() => console.log('✅ Details book image loaded successfully for:', book.title)}
            />
            <View style={{ flex: 1, marginLeft: 16 }}>
              {book.genre && (
                <View style={[styles.genreChip, { backgroundColor: book.genre_color || '#A3C9A8' }]}>
                  <Text style={[styles.genreText, { color: isDarkMode ? '#23272b' : '#222' }]}>{book.genre}</Text>
                </View>
              )}
              <Text style={[styles.featuredTitle, { color: isDarkMode ? '#fff' : textColor }]}>{book.title}</Text>
              <Text style={[styles.featuredAuthor, { color: isDarkMode ? '#fff' : '#888' }]}>By {book.author}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                {[1,2,3,4,5].map(i => (
                  <MaterialIcons
                    key={i}
                    name={i <= 5 ? 'star' : 'star-border'}
                    size={18}
                    color="#F4B400"
                    style={{ marginRight: 2 }}
                  />
                ))}
                <Text style={[styles.ratingText, { color: isDarkMode ? '#fff' : textColor }]}>4.9</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                <Ionicons name="person" size={16} color={isDarkMode ? '#9BA1A6' : '#888'} style={{ marginRight: 4 }} />
                <Text style={[styles.recommender, { color: isDarkMode ? '#fff' : '#888' }]}>Nizar Naghi</Text>
              </View>
            </View>
          </View>
          
          {/* About This Book */}
          {book.description && (
            <View style={[styles.aboutBox, { backgroundColor: isDarkMode ? '#23272b' : '#f6f7f9' }]}>
              <Text style={[styles.aboutLabel, { color: textColor }]}>About This Book</Text>
              <Text style={[styles.aboutText, { color: isDarkMode ? '#ccc' : '#444' }]}>{book.description}</Text>
            </View>
          )}
          
          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={[styles.statCardNewSmall, { backgroundColor: isDarkMode ? '#23272b' : '#f6f7f9' }]}>
              <Ionicons name="person-outline" size={30} color="#1abc9c" style={{ marginBottom: 4 }} />
              <Text style={[styles.statNameBold, { color: textColor }]}>Nizar Naghi</Text>
              <Text style={[styles.statLabelNewSmall, { color: isDarkMode ? '#aaa' : '#555' }]}>Recommended by</Text>
            </View>
            <View style={[styles.statCardNewSmall, { backgroundColor: isDarkMode ? '#23272b' : '#f6f7f9' }]}>
              <Ionicons name="book-outline" size={30} color="#2979ff" style={{ marginBottom: 4 }} />
              <Text style={[styles.statNumberSmall, { color: textColor }]}>44</Text>
              <Text style={[styles.statLabelNewSmall, { color: isDarkMode ? '#aaa' : '#555' }]}>Book</Text>
            </View>
            <View style={[styles.statCardNewSmall, { backgroundColor: isDarkMode ? '#23272b' : '#f6f7f9' }]}>
              <Ionicons name="star-outline" size={30} color="#FFA726" style={{ marginBottom: 4 }} />
              <Text style={[styles.statNumberSmall, { color: textColor }]}>4.9</Text>
              <Text style={[styles.statLabelNewSmall, { color: isDarkMode ? '#aaa' : '#555' }]}>Rating</Text>
            </View>
          </View>
          
          {/* Rate This Book */}
          <View style={[styles.rateBox, { backgroundColor: isDarkMode ? '#23272b' : '#f6f7f9' }]}>
            <Text style={[styles.rateLabel, { color: textColor }]}>
              <MaterialIcons name="star-border" size={18} color="#F4B400" /> Rate This Book
            </Text>
            <View style={{ flexDirection: 'row', marginTop: 6 }}>
              {[1,2,3,4,5].map(i => (
                <TouchableOpacity key={i}>
                  <MaterialIcons
                    name="star-border"
                    size={28}
                    color="#F4B400"
                    style={{ marginRight: 2 }}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  errorBackButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorBackButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  featuredCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  featuredCover: {
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
  featuredTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
    marginTop: 2,
  },
  featuredAuthor: {
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
  aboutBox: {
    backgroundColor: '#f6f7f9',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  aboutLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#444',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statCardNewSmall: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f6f7f9',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
  },
  statNameBold: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statNumberSmall: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabelNewSmall: {
    fontSize: 10,
    color: '#555',
  },
  rateBox: {
    backgroundColor: '#f6f7f9',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  rateLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
}); 
