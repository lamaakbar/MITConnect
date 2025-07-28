import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../components/ThemeContext';
import { useThemeColor } from '../hooks/useThemeColor';
import { useUserContext } from '../components/UserContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { getGenreColor } from '../constants/Genres';

type Book = {
  id: number;
  title: string;
  author: string;
  description?: string;
  cover_image_url?: string;
  genre?: string;
  genreColor?: string;
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

export default function BookDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const bookId = params.id ? parseInt(params.id as string) : null;
  
  const { isDarkMode, toggleTheme } = useTheme();
  const { userRole } = useUserContext();
  const insets = useSafeAreaInsets();
  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  const borderColor = isDarkMode ? '#2A2A2A' : '#E0E0E0';
  
  // State
  const [book, setBook] = useState<Book | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Fetch book details
  const fetchBookDetails = async () => {
    if (!bookId) return;
    
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .single();
      
      if (error) throw error;
      setBook(data);
    } catch (error) {
      console.error('Error fetching book:', error);
      Alert.alert('Error', 'Failed to load book details');
    }
  };

  // Fetch ratings
  const fetchRatings = async () => {
    if (!bookId) return;
    
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select(`
          *,
          users:user_id(name)
        `)
        .eq('book_id', bookId)
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

  // Fetch comments
  const fetchComments = async () => {
    if (!bookId) return;
    
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          users:user_id(name)
        `)
        .eq('book_id', bookId)
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

  // Get current user
  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user && bookId) {
        // Get user's existing rating
        const { data: userRatingData } = await supabase
          .from('ratings')
          .select('rating')
          .eq('book_id', bookId)
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
    if (!user || !bookId) {
      Alert.alert('Error', 'Please log in to rate this book');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const { error } = await supabase
        .from('ratings')
        .upsert({
          user_id: user.id,
          book_id: bookId,
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

  // Submit comment
  const submitComment = async () => {
    if (!user || !bookId) {
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
          book_id: bookId,
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
    : 0;

  useEffect(() => {
    if (bookId) {
      setLoading(true);
      Promise.all([
        fetchBookDetails(),
        fetchRatings(),
        fetchComments(),
        getCurrentUser()
      ]).finally(() => setLoading(false));
    }
  }, [bookId]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={[styles.loadingText, { color: textColor }]}>Loading book details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!book) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#e74c3c" />
          <Text style={[styles.errorText, { color: textColor }]}>Book not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingTop: insets.top + 10,
        paddingBottom: 6,
        backgroundColor: isDarkMode ? '#23272b' : cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: isDarkMode ? '#2D333B' : borderColor,
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 8 }}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '700', letterSpacing: 0.5, flex: 1, textAlign: 'center', color: isDarkMode ? '#fff' : textColor }}>
          MIT<Text style={{ color: '#43C6AC' }}>Connect</Text>
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={toggleTheme} style={{ padding: 4, marginRight: 8 }}>
            <Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={24} color={textColor} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => router.push('/book-details')} 
            style={{ 
              padding: 8, 
              backgroundColor: '#43C6AC', 
              borderRadius: 8
            }}
          >
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Details</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
            <ActivityIndicator size="large" color="#43C6AC" />
            <Text style={{ color: isDarkMode ? '#ccc' : '#444', marginTop: 16 }}>Loading Book Details...</Text>
          </View>
        ) : book ? (
          <>
            {/* User Rating Section */}
            <View style={{ paddingHorizontal: 18, marginTop: 20, marginBottom: 24 }}>
              <View style={{ backgroundColor: isDarkMode ? '#23272b' : '#f6f7f9', padding: 16, borderRadius: 12 }}>
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
          </>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
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
  },
  bookSection: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  bookCover: {
    width: 100,
    height: 150,
    borderRadius: 8,
    marginRight: 16,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 16,
    marginBottom: 8,
  },
  genreChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  genreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#222',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  userRatingContainer: {
    alignItems: 'center',
  },
  userRatingText: {
    marginTop: 8,
    fontSize: 14,
  },
  commentInputContainer: {
    marginBottom: 16,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
    textAlignVertical: 'top',
  },
  submitButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  commentItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentDate: {
    fontSize: 12,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
}); 