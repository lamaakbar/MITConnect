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
  SafeAreaView
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
  recommender: 'Nizar Naghi',
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
  
  // useState hooks
  const [tab, setTab] = useState('bookclub');
  const [rating, setRating] = useState(0);
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState<string[]>([]);
  const [modal, setModal] = useState(false);
  const [book, setBook] = useState<any>(null);
  const [booksOfMonth, setBooksOfMonth] = useState<BookOfMonth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentSelections, setRecentSelections] = useState<BookOfMonth[]>([]);
  const [loadingRecentSelections, setLoadingRecentSelections] = useState(true);

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
        
        // Handle books with local file URIs by using fallback images
        const processedBooks = (booksData || []).map(book => {
          // Check both cover_image_url and cover fields
          const hasLocalCoverImage = book.cover_image_url && book.cover_image_url.startsWith('file://');
          const hasLocalCover = book.cover && book.cover.startsWith('file://');
          
          if (hasLocalCoverImage || hasLocalCover) {
            console.log('⚠️ Book has local file URI, using fallback image:', book.title);
            return {
              ...book,
              cover_image_url: 'https://covers.openlibrary.org/b/id/7222246-L.jpg',
              cover: 'https://covers.openlibrary.org/b/id/7222246-L.jpg'
            };
          }
          return book;
        });
        
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
        
        // Handle books with local file URIs by using fallback images
        const processedRecentBooks = (booksData || []).map(book => {
          // Check both cover_image_url and cover fields
          const hasLocalCoverImage = book.cover_image_url && book.cover_image_url.startsWith('file://');
          const hasLocalCover = book.cover && book.cover.startsWith('file://');
          
          if (hasLocalCoverImage || hasLocalCover) {
            console.log('⚠️ Recent book has local file URI, using fallback image:', book.title);
            return {
              ...book,
              cover_image_url: 'https://covers.openlibrary.org/b/id/7222246-L.jpg',
              cover: 'https://covers.openlibrary.org/b/id/7222246-L.jpg'
            };
          }
          return book;
        });
        
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

  const openBookModal = (book: any) => {
    setBook(book);
    setModal(true);
  };

  const closeBookModal = () => {
    setModal(false);
    setBook(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? darkBg : backgroundColor }]}>
      {(userRole === 'employee' || userRole === 'trainee') && (
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      )}
      {userRole === 'employee' || userRole === 'trainee' ? (
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
      ) : (
        <View style={[styles.header, { backgroundColor: cardBackground, borderBottomColor: borderColor }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={iconColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>Book Club</Text>
          <TouchableOpacity onPress={toggleTheme} style={styles.themeToggleBtn}>
            <Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={24} color={iconColor} />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Featured Book Section */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          <Ionicons name="star" size={20} color="#1abc9c" /> Book of the Month
        </Text>
        {loading ? (
          <View style={[styles.featuredCard, { backgroundColor: cardBackground, alignItems: 'center', padding: 40 }]}>
            <Text style={[styles.aboutText, { color: isDarkMode ? '#ccc' : '#444' }]}>Loading Book of the Month...</Text>
          </View>
        ) : booksOfMonth.length > 0 ? (
          <TouchableOpacity 
            style={[styles.featuredCard, { backgroundColor: cardBackground }]}
            onPress={() => router.push({ 
              pathname: '/books-management/[id]/details', 
              params: { id: booksOfMonth[0].id.toString() } 
            })}
            activeOpacity={0.9}
          >
            <View style={{ flexDirection: 'row' }}>
              <View style={styles.featuredCover}>
                <Image 
                  source={{ uri: booksOfMonth[0].cover_image_url || booksOfMonth[0].cover || 'https://covers.openlibrary.org/b/id/7222246-L.jpg' }} 
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                  onError={(error) => console.log('❌ Book of month image error:', error.nativeEvent.error)}
                  onLoad={() => console.log('✅ Book of month image loaded successfully')}
                />
                {!booksOfMonth[0].cover_image_url && !booksOfMonth[0].cover && (
                  <View style={styles.fallbackImage}>
                    <Ionicons name="book-outline" size={40} color="#ccc" />
                  </View>
                )}
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                {booksOfMonth[0].genre && (
                  <View style={[styles.genreChip, { backgroundColor: booksOfMonth[0].genreColor || '#A3C9A8' }]}>
                    <Text style={[styles.genreText, { color: isDarkMode ? '#23272b' : '#222' }]}>{booksOfMonth[0].genre}</Text>
                  </View>
                )}
                <Text style={[styles.featuredTitle, { color: isDarkMode ? '#fff' : textColor }]}>{booksOfMonth[0].title}</Text>
                <Text style={[styles.featuredAuthor, { color: isDarkMode ? '#fff' : '#888' }]}>By {booksOfMonth[0].author}</Text>
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
            {booksOfMonth[0].description && (
              <View style={[styles.aboutBox, { backgroundColor: isDarkMode ? '#23272b' : '#f6f7f9' }]}>
                <Text style={[styles.aboutLabel, { color: textColor }]}>About This Book</Text>
                <Text style={[styles.aboutText, { color: isDarkMode ? '#ccc' : '#444' }]}>{booksOfMonth[0].description}</Text>
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
              <Text style={[styles.rateLabel, { color: textColor }]}> <MaterialIcons name="star-border" size={18} color="#F4B400" /> Rate This Book </Text>
              <View style={{ flexDirection: 'row', marginTop: 6 }}>
                {[1,2,3,4,5].map(i => (
                  <TouchableOpacity key={i} onPress={() => setRating(i)}>
                    <MaterialIcons
                      name={i <= rating ? 'star' : 'star-border'}
                      size={28}
                      color="#F4B400"
                      style={{ marginRight: 2 }}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {/* Main Comment Section */}
            <View style={styles.commentSection}>
              <Text style={[styles.commentTitle, { color: textColor }]}>Comments</Text>
              <View style={styles.commentInputRow}>
                <TextInput
                  style={[styles.commentInputArea, { backgroundColor: isDarkMode ? '#23272b' : '#f6f7f9', color: textColor, borderColor: borderColor }]}
                  placeholder="Write a comment..."
                  placeholderTextColor={isDarkMode ? '#888' : '#aaa'}
                  value={commentInput}
                  onChangeText={setCommentInput}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
              <TouchableOpacity
                style={[styles.commentPostBtn, { backgroundColor: isDarkMode ? '#23272b' : '#e6f0fe' }]}
                onPress={() => {
                  if (commentInput.trim()) {
                    setComments([commentInput.trim(), ...comments]);
                    setCommentInput('');
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.commentPostBtnText, { color: isDarkMode ? '#43C6AC' : '#2196f3' }]}>Post Comment</Text>
              </TouchableOpacity>
              <Text style={[styles.commentSubtitle, { color: textColor }]}>Recent Comments</Text>
              <View style={styles.commentList}>
                {comments.length === 0 ? (
                  <Text style={[styles.noComments, { color: isDarkMode ? '#aaa' : '#888' }]}>No comments yet. Be the first to comment!</Text>
                ) : (
                  comments.map((c, idx) => (
                    <View key={idx} style={[styles.commentBubble, { backgroundColor: isDarkMode ? '#23272b' : '#f6f7f9' }]}>
                      <Text style={[styles.commentText, { color: textColor }]}>{c}</Text>
                    </View>
                  ))
                )}
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={[styles.featuredCard, { backgroundColor: cardBackground, alignItems: 'center', padding: 40 }]}>
            <Ionicons name="book-outline" size={64} color={secondaryTextColor} />
            <Text style={[styles.aboutLabel, { color: textColor, marginTop: 16 }]}>No Book of the Month</Text>
            <Text style={[styles.aboutText, { color: isDarkMode ? '#ccc' : '#444', textAlign: 'center' }]}>
              No book has been set as Book of the Month yet. Check back later for exciting reads!
            </Text>
          </View>
        )}
        {/* Recent Selections */}
        <View style={styles.recentHeaderRow}>
          <Text style={[styles.sectionTitle, { color: textColor }]}> <Feather name="clock" size={16} color="#3AC569" /> Recent Selections </Text>
          <TouchableOpacity
            style={[styles.goLibraryBtnSmall, { backgroundColor: isDarkMode ? '#23272b' : '#e6f0fe' }]}
            onPress={() => {
              if (userRole === 'admin') router.push('/books-management');
              else router.push('/library');
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.goLibraryBtnTextSmall, { color: isDarkMode ? '#43C6AC' : '#2196f3' }]}>Go to MITC Library</Text>
          </TouchableOpacity>
        </View>
        {loadingRecentSelections ? (
          <View style={[styles.featuredCard, { backgroundColor: cardBackground, alignItems: 'center', padding: 20 }]}>
            <Text style={[styles.aboutText, { color: isDarkMode ? '#ccc' : '#444' }]}>Loading recent selections...</Text>
          </View>
        ) : recentSelections.length > 0 ? (
          <FlatList
            data={recentSelections}
            keyExtractor={item => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 18 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.recentBookCard, { backgroundColor: cardBackground }]}
                onPress={() => router.push({ 
                  pathname: '/books-management/[id]/details', 
                  params: { id: item.id.toString() } 
                })}
                activeOpacity={0.85}
              >
                <View style={styles.recentBookCover}>
                  <Image 
                    source={{ uri: item.cover_image_url || item.cover || 'https://covers.openlibrary.org/b/id/7222246-L.jpg' }} 
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                    onError={(error) => console.log('❌ Recent book image error:', error.nativeEvent.error)}
                    onLoad={() => console.log('✅ Recent book image loaded successfully')}
                  />
                  {!item.cover_image_url && !item.cover && (
                    <View style={styles.fallbackImage}>
                      <Ionicons name="book-outline" size={30} color="#ccc" />
                    </View>
                  )}
                </View>
                <View style={styles.recentBookInfo}>
                  <Text style={[styles.recentBookTitle, { color: textColor }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={[styles.recentBookAuthor, { color: secondaryTextColor }]} numberOfLines={1}>
                    By {item.author}
                  </Text>
                  {item.genre && (
                    <View style={[styles.genreChip, { backgroundColor: item.genreColor || '#A3C9A8' }]}>
                      <Text style={[styles.genreText, { color: isDarkMode ? '#23272b' : '#222' }]}>{item.genre}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={[styles.featuredCard, { backgroundColor: cardBackground, alignItems: 'center', padding: 20 }]}>
            <Ionicons name="book-outline" size={48} color={secondaryTextColor} />
            <Text style={[styles.aboutLabel, { color: textColor, marginTop: 16 }]}>No Recent Selections</Text>
            <Text style={[styles.aboutText, { color: isDarkMode ? '#ccc' : '#444', textAlign: 'center' }]}>
              No recent library books available. Check back later for new selections!
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
                      <View style={[styles.genreChip, { backgroundColor: book.genreColor || '#A3C9A8' }]}>
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
                        onPress={() => setRating(star)}
                        style={styles.starButton}
                      >
                        <MaterialIcons
                          name={star <= rating ? 'star' : 'star-border'}
                          size={32}
                          color="#F4B400"
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={[styles.ratingText, { color: secondaryTextColor }]}>
                    {rating > 0 ? `You rated this book ${rating} star${rating > 1 ? 's' : ''}` : 'Tap to rate'}
                  </Text>
                </View>
                
                {/* Comments Section */}
                <View style={[styles.commentsSection, { backgroundColor: cardBackground }]}>
                  <Text style={[styles.commentsTitle, { color: textColor }]}>Comments</Text>
                  <TextInput
                    style={[styles.commentInput, { 
                      backgroundColor: isDarkMode ? '#23272b' : '#f6f7f9',
                      color: textColor,
                      borderColor: borderColor
                    }]}
                    placeholder="Add a comment..."
                    placeholderTextColor={secondaryTextColor}
                    value={commentInput}
                    onChangeText={setCommentInput}
                    multiline
                  />
                  <TouchableOpacity
                    style={[styles.addCommentBtn, { backgroundColor: darkHighlight }]}
                    onPress={() => {
                      if (commentInput.trim()) {
                        setComments([...comments, commentInput.trim()]);
                        setCommentInput('');
                      }
                    }}
                  >
                    <Text style={styles.addCommentBtnText}>Add Comment</Text>
                  </TouchableOpacity>
                  
                  {comments.map((comment, index) => (
                    <View key={index} style={[styles.commentItem, { backgroundColor: isDarkMode ? '#23272b' : '#f6f7f9' }]}>
                      <Text style={[styles.commentText, { color: textColor }]}>{comment}</Text>
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