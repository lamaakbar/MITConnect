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
import { Ionicons } from '@expo/vector-icons';
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
  
  const { isDarkMode } = useTheme();
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
      <View style={[styles.header, { backgroundColor: cardBackground, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Book Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Book Info */}
        <View style={[styles.bookSection, { backgroundColor: cardBackground }]}>
          <View style={styles.bookHeader}>
            <Image 
              source={{ uri: book.cover_image_url || 'https://via.placeholder.com/150x200' }} 
              style={styles.bookCover}
              resizeMode="cover"
            />
            <View style={styles.bookInfo}>
              <Text style={[styles.bookTitle, { color: textColor }]}>{book.title}</Text>
              <Text style={[styles.bookAuthor, { color: secondaryTextColor }]}>By {book.author}</Text>
              {book.genre && (
                <View style={[styles.genreChip, { backgroundColor: getGenreColor(book.genre) }]}>
                  <Text style={styles.genreText}>{book.genre}</Text>
                </View>
              )}
              <View style={styles.ratingContainer}>
                <View style={styles.stars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => submitRating(star)}
                      disabled={submitting}
                    >
                      <Ionicons 
                        name={star <= averageRating ? "star" : "star-outline"} 
                        size={20} 
                        color={star <= averageRating ? "#FFD700" : secondaryTextColor} 
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.ratingText, { color: secondaryTextColor }]}>
                  {averageRating.toFixed(1)} ({ratings.length} ratings)
                </Text>
              </View>
            </View>
          </View>
          
          {book.description && (
            <Text style={[styles.description, { color: textColor }]}>{book.description}</Text>
          )}
        </View>

        {/* User Rating Section */}
        {user && (
          <View style={[styles.section, { backgroundColor: cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Your Rating</Text>
            <View style={styles.userRatingContainer}>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => submitRating(star)}
                    disabled={submitting}
                  >
                    <Ionicons 
                      name={star <= userRating ? "star" : "star-outline"} 
                      size={24} 
                      color={star <= userRating ? "#FFD700" : secondaryTextColor} 
                    />
                  </TouchableOpacity>
                ))}
              </View>
              {userRating > 0 && (
                <Text style={[styles.userRatingText, { color: secondaryTextColor }]}>
                  You rated this book {userRating} star{userRating > 1 ? 's' : ''}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Comments Section */}
        <View style={[styles.section, { backgroundColor: cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Comments ({comments.length})</Text>
          
          {user && (
            <View style={styles.commentInputContainer}>
              <TextInput
                style={[styles.commentInput, { 
                  backgroundColor: isDarkMode ? '#2A2A2A' : '#F8F9FA',
                  color: textColor,
                  borderColor: borderColor
                }]}
                placeholder="Add a comment..."
                placeholderTextColor={secondaryTextColor}
                value={newComment}
                onChangeText={setNewComment}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: '#007AFF' }]}
                onPress={submitComment}
                disabled={submitting || !newComment.trim()}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Post</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <FlatList
            data={comments}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={[styles.commentItem, { borderBottomColor: borderColor }]}>
                <View style={styles.commentHeader}>
                  <Text style={[styles.commentAuthor, { color: textColor }]}>{item.user_name}</Text>
                  <Text style={[styles.commentDate, { color: secondaryTextColor }]}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={[styles.commentContent, { color: textColor }]}>{item.content}</Text>
              </View>
            )}
            ListEmptyComponent={() => (
              <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
                No comments yet. Be the first to comment!
              </Text>
            )}
          />
        </View>
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