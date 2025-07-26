import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useBooks } from '../components/BookContext';
import { useTheme } from '../components/ThemeContext';
import { useThemeColor } from '../hooks/useThemeColor';
import { useUserContext } from '../components/UserContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../components/AuthContext';
import { supabase } from '../services/supabase';
import { useEffect, useState } from 'react';

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
  // const { books } = useBooks();
  const { isDarkMode } = useTheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  const borderColor = isDarkMode ? '#2A2A2A' : '#eee';
  const iconColor = useThemeColor({}, 'icon');
  const { userRole } = useUserContext();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserBooks = async () => {
      if (!user) return;
      setLoading(true);
      setError('');
      try {
        // 1. Get all book_ids linked to this user
        const { data: userBooks, error: userBooksError } = await supabase
          .from('user_books')
          .select('book_id')
          .eq('user_id', user.id);
        if (userBooksError) throw userBooksError;
        if (!userBooks || userBooks.length === 0) {
          setBooks([]);
          setLoading(false);
          return;
        }
        const bookIds = userBooks.map(ub => ub.book_id);
        // 2. Get the actual book details
        const { data: booksData, error: booksError } = await supabase
          .from('books')
          .select('*')
          .in('id', bookIds);
        if (booksError) throw booksError;
        setBooks(booksData || []);
      } catch (err) {
        setError('Failed to load books.');
        setBooks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUserBooks();
  }, [user]);

  const darkBg = '#181C20';
  const darkCard = '#23272b';
  const darkBorder = '#2D333B';
  const darkText = '#F3F6FA';
  const darkSecondary = '#AEB6C1';
  const darkHighlight = '#43C6AC';

  return (
    <View style={[styles.safeArea, { backgroundColor: isDarkMode ? darkBg : backgroundColor }]}> {/* Themed background */}
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
            <Image source={{ uri: item.cover_image_url || item.cover }} style={styles.bookCover} />
            <View style={styles.bookInfo}>
              <Text style={[styles.bookTitle, { color: textColor }]}>{item.title}</Text>
              <Text style={[styles.bookAuthor, { color: secondaryTextColor }]}>{`By ${item.author}`}</Text>
              {/* Optionally display genre if available */}
              {item.genre && (
                <View style={[styles.genreChip, { backgroundColor: item.genreColor || '#A3C9A8' }]}> 
                  <Text style={[styles.genreText, { color: isDarkMode ? '#23272b' : '#222' }]}>{item.genre}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity 
              style={styles.moreDetailsBtn}
              onPress={() => router.push({ pathname: '/library/[id]/details', params: { id: item.id } })}
            >
              <Text style={[styles.moreDetailsText, { color: isDarkMode ? '#43C6AC' : '#2196f3' }]}>More Details</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <Text style={{ textAlign: 'center', color: secondaryTextColor, marginTop: 40 }}>Loading...</Text>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="library-outline" size={64} color={secondaryTextColor} />
              <Text style={[styles.emptyText, { color: secondaryTextColor }]}>{error || 'No books available'}</Text>
            </View>
          )
        }
      />
    </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  bookList: {
    padding: 16,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  bookCover: {
    width: 60,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: '#eee',
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  genreChip: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#A3C9A8',
  },
  genreText: {
    fontSize: 11,
    color: '#222',
    fontWeight: '500',
  },
  moreDetailsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  moreDetailsText: {
    color: '#2196f3',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 16,
  },
}); 