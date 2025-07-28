import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Alert, 
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../components/ThemeContext';
import { useThemeColor } from '../../../hooks/useThemeColor';
import { useUserContext } from '../../../components/UserContext';
import { supabase } from '../../../services/supabase';
import { getGenreColor } from '../../../constants/Genres';

// Featured book data
const FEATURED_BOOK = {
  id: 1,
  title: "Think and Grow Rich",
  author: "Napoleon Hill",
  genre: "Self-Help",
  genreColor: getGenreColor("Self-Help"),
  cover: "https://covers.openlibrary.org/b/id/7222246-L.jpg",
  description: "Think and Grow Rich is a personal development and self-help book written by Napoleon Hill and inspired by a suggestion from Scottish-American businessman Andrew Carnegie. The book was first published in 1937 and has sold over 100 million copies worldwide.",

  ratingCount: 44,
  averageRating: 4.9
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

export default function FeaturedBookDetailsScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { userRole } = useUserContext();
  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  const borderColor = isDarkMode ? '#2A2A2A' : '#eee';
  const darkHighlight = '#43C6AC';
  const iconColor = isDarkMode ? '#fff' : '#222';

  // State for ratings and comments
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [userRating, setUserRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Fetch ratings, comments, and user data
  useEffect(() => {
    Promise.all([
      fetchRatings(),
      fetchComments(),
      getCurrentUser()
    ]);
  }, []);

  // Fetch ratings for featured book
  const fetchRatings = async () => {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select(`
          *,
          users:user_id(name)
        `)
        .eq('book_id', FEATURED_BOOK.id)
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

  // Fetch comments for featured book
  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          users:user_id(name)
        `)
        .eq('book_id', FEATURED_BOOK.id)
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

  // Get current user and their rating
  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      if (user) {
        // Get user's existing rating
        const { data: userRatingData } = await supabase
          .from('ratings')
          .select('rating')
          .eq('book_id', FEATURED_BOOK.id)
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
    if (!currentUser) {
      Alert.alert('Error', 'Please log in to rate this book');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const { error } = await supabase
        .from('ratings')
        .upsert({
          user_id: currentUser.id,
          book_id: FEATURED_BOOK.id,
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
    if (!currentUser) {
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
          book_id: FEATURED_BOOK.id,
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
    : FEATURED_BOOK.averageRating;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { 
        backgroundColor: isDarkMode ? '#23272b' : '#fff',
        borderBottomColor: borderColor
      }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 8 }}>
          <Ionicons name="arrow-back" size={24} color={iconColor} />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '700', letterSpacing: 0.5, flex: 1, textAlign: 'center', color: isDarkMode ? '#fff' : textColor }}>
          MIT<Text style={{ color: darkHighlight }}>Connect</Text>
        </Text>
        <TouchableOpacity 
          onPress={() => router.push('/library')} 
          style={{ 
            padding: 8, 
            backgroundColor: darkHighlight, 
            borderRadius: 8,
            marginLeft: 8
          }}
        >
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Library</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Book Information Section */}
        <View style={{ padding: 18 }}>
          <View style={{ flexDirection: 'row', marginBottom: 20 }}>
            <View style={{ width: 120, height: 180, borderRadius: 12, overflow: 'hidden', marginRight: 16 }}>
              <Image 
                source={{ uri: FEATURED_BOOK.cover }} 
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
                onError={(error) => console.log('❌ Book image error:', error.nativeEvent.error)}
                onLoad={() => console.log('✅ Book image loaded successfully')}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.featuredTitle, { color: textColor, fontSize: 24, fontWeight: '700', marginBottom: 8 }]}>{FEATURED_BOOK.title}</Text>
              <Text style={[styles.featuredAuthor, { color: secondaryTextColor, fontSize: 16, marginBottom: 12 }]}>By {FEATURED_BOOK.author}</Text>
              
              <View style={[styles.genreChip, { backgroundColor: FEATURED_BOOK.genreColor, marginBottom: 12 }]}>
                <Text style={[styles.genreText, { color: isDarkMode ? '#23272b' : '#222' }]}>{FEATURED_BOOK.genre}</Text>
              </View>
              
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
          <View style={[styles.aboutBox, { backgroundColor: isDarkMode ? '#23272b' : '#f6f7f9', marginBottom: 24 }]}>
            <Text style={[styles.aboutLabel, { color: textColor }]}>About This Book</Text>
            <Text style={[styles.aboutText, { color: isDarkMode ? '#ccc' : '#444' }]}>{FEATURED_BOOK.description}</Text>
          </View>
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
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
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