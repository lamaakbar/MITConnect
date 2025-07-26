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
        
        // Process books to handle image URLs properly
        const processedBooks = (booksData || []).map(book => {
          console.log('📚 Processing book:', book.title, 'Cover URL:', book.cover_image_url);
          
          // Check if the book has a valid cover image URL
          const hasValidCoverImage = book.cover_image_url && 
            !book.cover_image_url.startsWith('file://') && 
            (book.cover_image_url.startsWith('http://') || book.cover_image_url.startsWith('https://'));
          
          if (!hasValidCoverImage) {
            // Use a reliable fallback image from OpenLibrary
            const fallbackImageUrl = 'https://covers.openlibrary.org/b/id/7222246-L.jpg';
            console.log('⚠️ Library book using fallback image for:', book.title);
            return {
              ...book,
              cover_image_url: fallbackImageUrl
            };
          }
          
          console.log('✅ Library book has valid image for:', book.title, 'URL:', book.cover_image_url);
          return book;
        });
        
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
            <View style={{ width: 32 }} />
          </View>
        </>
      ) : null}
      
      <FlatList
        data={books}
        keyExtractor={item => item.id?.toString()}
        contentContainerStyle={styles.bookList}
        renderItem={({ item }) => (
          <View style={[styles.bookCard, { backgroundColor: cardBackground }]}> 
            <View style={styles.bookCoverContainer}>
              <Image 
                source={{ uri: item.cover_image_url || 'https://covers.openlibrary.org/b/id/7222246-L.jpg' }} 
                style={styles.bookCover}
                resizeMode="cover"
                onError={(error) => {
                  console.log('❌ Library book image error for:', item.title, error.nativeEvent.error);
                  setFailedImages(prev => new Set(prev).add(item.id));
                }}
                onLoad={() => console.log('✅ Library book image loaded successfully for:', item.title)}
              />
              {failedImages.has(item.id) && (
                <View style={styles.fallbackImage}>
                  <Ionicons name="book-outline" size={30} color="#ccc" />
                </View>
              )}
            </View>
            <View style={styles.bookInfo}>
              <Text style={[styles.bookTitle, { color: textColor }]}>{item.title}</Text>
              <Text style={[styles.bookAuthor, { color: secondaryTextColor }]}>{`By ${item.author}`}</Text>
              <Text style={[styles.bookDebug, { color: secondaryTextColor, fontSize: 10 }]}>
                Cover: {item.cover_image_url ? 'Yes' : 'No'} | ID: {item.id}
              </Text>
              {/* Optionally display genre if available */}
              {item.genre && (
                <View style={[styles.genreChip, { backgroundColor: item.genreColor || '#A3C9A8' }]}> 
                  <Text style={[styles.genreText, { color: isDarkMode ? '#23272b' : '#222' }]}>{item.genre}</Text>
                </View>
              )}
            </View>
          </View>
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
    marginBottom: 8,
  },
  bookDebug: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  genreChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  genreText: {
    fontSize: 12,
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