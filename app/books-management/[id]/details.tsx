import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  ScrollView, 
  TextInput,
  Alert
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../components/ThemeContext';
import { useThemeColor } from '../../../hooks/useThemeColor';
import { useUserContext } from '../../../components/UserContext';
import { supabase } from '../../../services/supabase';
import { getGenreColor } from '../../../constants/Genres';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LibraryHeader from '../../../components/LibraryHeader';

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

type Rating = {
  id: number;
  user_id: string;
  book_id: number;
  rating: number;
  created_at: string;
  user_name?: string;
};

type Comment = {
  id: number;
  user_id: string;
  book_id: number;
  content: string;
  created_at: string;
  user_name?: string;
};

export default function BookDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { isDarkMode, toggleTheme } = useTheme();
  const { userRole } = useUserContext();
  const insets = useSafeAreaInsets();
  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const darkCard = isDarkMode ? '#23272b' : '#fff';
  const darkBorder = isDarkMode ? '#2D333B' : '#eee';
  const darkText = isDarkMode ? '#fff' : '#222';
  const borderColor = isDarkMode ? '#2A2A2A' : '#eee';
  const darkHighlight = '#43C6AC';
  const iconColor = isDarkMode ? '#fff' : '#222';

  const [book, setBook] = useState<Book | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState('');

  // Function to fetch real book cover from OpenLibrary
  const fetchBookCover = async (title: string, author: string): Promise<string | null> => {
    try {
      const searchStrategies = [
        `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author || '')}&limit=5`,
        `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=5`,
        `https://openlibrary.org/search.json?title=${encodeURIComponent(title.replace(/[^\w\s]/g, ' ').trim())}&limit=5`
      ];
      
      for (let i = 0; i < searchStrategies.length; i++) {
        const searchUrl = searchStrategies[i];
        const response = await fetch(searchUrl);
        const data = await response.json();
        
        if (data.docs && data.docs.length > 0) {
          const bestMatch = data.docs.find((book: any) => book.cover_i) || data.docs[0];
          
          if (bestMatch.cover_i) {
            const coverUrl = `https://covers.openlibrary.org/b/id/${bestMatch.cover_i}-L.jpg`;
            return coverUrl;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching book cover:', error);
      return null;
    }
  };

  const fetchBookDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        // Check if the book has a local file URI (which won't work)
        const hasLocalFileUri = data.cover_image_url && 
          (data.cover_image_url.startsWith('file://') || 
           data.cover_image_url.match(/^[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}\.(jpg|png|jpeg)$/i));
        
        if (hasLocalFileUri) {
          console.log('🔍 Fetching real cover for book:', data.title);
          
          // Fetch the actual book cover from OpenLibrary API
          const realCoverUrl = await fetchBookCover(data.title, data.author || '');
          
          if (realCoverUrl) {
            data.cover_image_url = realCoverUrl;
          }
        }
        
        setBook(data);
      }
    } catch (error) {
      console.error('Error fetching book details:', error);
      setError('Failed to load book details');
    } finally {
      setLoading(false);
    }
  };

  const fetchRatings = async () => {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select(`
          *,
          users:user_id(name)
        `)
        .eq('book_id', id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const processedRatings = data.map((rating: any) => ({
        ...rating,
        user_name: rating.users?.name || 'Anonymous'
      }));
      
      setRatings(processedRatings);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          users:user_id(name)
        `)
        .eq('book_id', id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const processedComments = data.map((comment: any) => ({
        ...comment,
        user_name: comment.users?.name || 'Anonymous'
      }));
      
      setComments(processedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Get user's existing rating
        const { data: userRatingData } = await supabase
          .from('ratings')
          .select('rating')
          .eq('book_id', id)
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

  const submitRating = async (rating: number) => {
    if (!user) {
      Alert.alert('Error', 'Please log in to rate this book');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const { error } = await supabase
        .from('ratings')
        .upsert({
          user_id: user.id,
          book_id: parseInt(id as string),
          rating: rating
        });
      
      if (error) throw error;
      
      setUserRating(rating);
      await fetchRatings();
      Alert.alert('Success', 'Rating submitted successfully!');
    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  const submitComment = async () => {
    if (!user) {
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
          user_id: user.id,
          book_id: parseInt(id as string),
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

  const averageRating = ratings.length > 0 
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
    : 0;

  useEffect(() => {
    if (id) {
      Promise.all([
        fetchBookDetails(),
        fetchRatings(),
        fetchComments(),
        getCurrentUser()
      ]);
    }
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={darkHighlight} />
          <Text style={[styles.loadingText, { color: textColor }]}>Loading book details...</Text>
        </View>
      </View>
    );
  }

  if (!book) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#e74c3c" />
          <Text style={[styles.errorText, { color: textColor }]}>
            {error || 'Book not found'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
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
        {userRole !== 'admin' ? (
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
        ) : (
          <View style={{ width: 32 }} />
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
            <ActivityIndicator size="large" color={darkHighlight} />
            <Text style={{ color: isDarkMode ? '#ccc' : '#444', marginTop: 16 }}>Loading Book Details...</Text>
          </View>
        ) : book ? (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
            {/* Book Information Section */}
            <View style={{ padding: 18 }}>
              <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                <View style={{ width: 120, height: 180, borderRadius: 12, overflow: 'hidden', marginRight: 16 }}>
                  <Image 
                    source={{ uri: book.cover_image_url || 'https://covers.openlibrary.org/b/id/7222246-L.jpg' }} 
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                    onError={(error) => console.log('❌ Book image error:', error.nativeEvent.error)}
                    onLoad={() => console.log('✅ Book image loaded successfully')}
                  />
                  {!book.cover_image_url && (
                    <View style={{ width: '100%', height: '100%', backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="book-outline" size={40} color="#666" />
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: textColor, fontSize: 24, fontWeight: '700', marginBottom: 8 }}>{book.title}</Text>
                  <Text style={{ color: secondaryTextColor, fontSize: 16, marginBottom: 12 }}>By {book.author}</Text>
                  
                  {book.genre && (
                    <View style={{ backgroundColor: getGenreColor(book.genre || ''), paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, alignSelf: 'flex-start', marginBottom: 12 }}>
                      <Text style={{ color: isDarkMode ? '#23272b' : '#222', fontSize: 12, fontWeight: '600' }}>{book.genre}</Text>
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
                    <Text style={{ color: textColor, marginLeft: 8, fontSize: 16 }}>
                      {averageRating.toFixed(1)} ({ratings.length} ratings)
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* About This Book */}
              {book.description && (
                <View style={{ backgroundColor: isDarkMode ? '#23272b' : '#f6f7f9', marginBottom: 24, padding: 16, borderRadius: 12 }}>
                  <Text style={{ color: textColor, fontSize: 16, fontWeight: '600', marginBottom: 8 }}>About This Book</Text>
                  <Text style={{ color: isDarkMode ? '#ccc' : '#444', lineHeight: 20 }}>{book.description}</Text>
                </View>
              )}
            </View>

            {/* User Rating Section */}
            <View style={{ paddingHorizontal: 18, marginBottom: 24 }}>
              <View style={{ backgroundColor: isDarkMode ? '#23272b' : '#f6f7f9', padding: 16, borderRadius: 12 }}>
                <Text style={{ color: textColor, fontSize: 18, fontWeight: '600', marginBottom: 12 }}>
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
                  <Text style={{ color: isDarkMode ? '#aaa' : '#555', textAlign: 'center', fontSize: 14 }}>
                    You rated this book {userRating} star{userRating > 1 ? 's' : ''}
                  </Text>
                )}
              </View>
            </View>

            {/* Comments Section */}
            <View style={{ paddingHorizontal: 18 }}>
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: textColor, fontSize: 18, fontWeight: '600', marginBottom: 16 }}>
                  Comments ({comments.length})
                </Text>
                
                {user && (
                  <>
                    <View style={{ marginBottom: 12 }}>
                      <TextInput
                        style={{ 
                          backgroundColor: isDarkMode ? '#23272b' : '#f6f7f9', 
                          color: textColor, 
                          borderColor: borderColor,
                          minHeight: 80,
                          padding: 12,
                          borderRadius: 8,
                          borderWidth: 1
                        }}
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
                      style={{ 
                        backgroundColor: isDarkMode ? '#23272b' : '#e6f0fe',
                        paddingVertical: 12,
                        paddingHorizontal: 20,
                        borderRadius: 8,
                        marginBottom: 16
                      }}
                      onPress={submitComment}
                      disabled={submitting || !newComment.trim()}
                      activeOpacity={0.8}
                    >
                      <Text style={{ 
                        color: isDarkMode ? '#43C6AC' : '#2196f3',
                        textAlign: 'center',
                        fontWeight: '600'
                      }}>
                        {submitting ? 'Posting...' : 'Post Comment'}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
                
                <Text style={{ color: textColor, marginBottom: 12 }}>Recent Comments</Text>
                <View>
                  {comments.length === 0 ? (
                    <Text style={{ color: isDarkMode ? '#aaa' : '#888' }}>
                      No comments yet. Be the first to comment!
                    </Text>
                  ) : (
                    comments.map((comment, idx) => (
                      <View key={idx} style={{ 
                        backgroundColor: isDarkMode ? '#23272b' : '#f6f7f9',
                        marginBottom: 12,
                        padding: 16,
                        borderRadius: 12
                      }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <Text style={{ color: textColor, fontWeight: '600', fontSize: 14 }}>
                            {comment.user_name || 'Anonymous'}
                          </Text>
                          <Text style={{ color: isDarkMode ? '#aaa' : '#888', fontSize: 12 }}>
                            {new Date(comment.created_at).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: '2-digit', 
                              day: '2-digit' 
                            })}
                          </Text>
                        </View>
                        <Text style={{ color: isDarkMode ? '#ccc' : '#444', lineHeight: 18 }}>
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
            <Text style={{ color: textColor, marginTop: 16, fontSize: 18 }}>Book Not Found</Text>
            <Text style={{ color: isDarkMode ? '#ccc' : '#444', textAlign: 'center', marginTop: 8 }}>
              The book you're looking for could not be found.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  featuredTitle: {
    fontSize: 20,
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
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  noComments: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
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
}); 
