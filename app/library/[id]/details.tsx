import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  SafeAreaView,
  Alert,
  ActivityIndicator,
  FlatList,
  Linking
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useBooks } from '../../../components/BookContext';
import { useTheme } from '../../../components/ThemeContext';
import { useThemeColor } from '../../../hooks/useThemeColor';
import { useUserContext } from '../../../components/UserContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../../services/supabase';
import { getGenreColor } from '../../../constants/Genres';
import LibraryHeader from '../../../components/LibraryHeader';

type Book = {
  id: number;
  title: string;
  author: string;
  description?: string;
  cover_image_url?: string;
  cover?: string;
  genre?: string;
  genreColor?: string;
  pdf_path?: string;
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

export default function LibraryBookDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { books } = useBooks();
  const { isDarkMode, toggleTheme } = useTheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  const borderColor = isDarkMode ? '#2A2A2A' : '#eee';
  const iconColor = useThemeColor({}, 'icon');
  const { userRole } = useUserContext();
  const insets = useSafeAreaInsets();
  
  const darkBg = '#181C20';
  const darkCard = '#23272b';
  const darkBorder = '#2D333B';
  const darkText = '#F3F6FA';
  const darkSecondary = '#AEB6C1';
  const darkHighlight = '#43C6AC';

  // State
  const [book, setBook] = useState<Book | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Function to open PDF
  const openPDF = async (pdfPath: string) => {
    try {
      console.log('📄 Attempting to open PDF with path:', pdfPath);
      
      // Determine the correct bucket and path
      let bucket = 'book-pdfs';
      let storagePath = pdfPath;
      
      // If the path contains 'pdfs/', it's likely in the images bucket
      if (pdfPath.includes('pdfs/')) {
        bucket = 'images';
        storagePath = pdfPath; // Keep the full path
      } else if (pdfPath.includes('/')) {
        // If it has slashes but doesn't contain 'pdfs/', it might be in book-pdfs
        bucket = 'book-pdfs';
        storagePath = pdfPath;
      } else {
        // If it's just a filename, try both buckets
        bucket = 'images';
        storagePath = `pdfs/${pdfPath}`;
      }
      
      console.log('🔍 Trying bucket:', bucket, 'with path:', storagePath);
      
      // Get the public URL
      const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
      const pdfUrl = data.publicUrl;
      
      console.log('📄 Generated PDF URL:', pdfUrl);
      
      // Test if the URL is accessible
      try {
        const response = await fetch(pdfUrl, { method: 'HEAD' });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        console.log('✅ PDF URL is accessible');
      } catch (fetchError) {
        console.error('❌ PDF URL not accessible:', fetchError);
        
        // Try alternative bucket if first attempt failed
        if (bucket === 'images') {
          console.log('🔄 Trying book-pdfs bucket as fallback...');
          const altBucket = 'book-pdfs';
          const altPath = pdfPath.includes('pdfs/') ? pdfPath.replace('pdfs/', '') : pdfPath;
          const { data: altData } = supabase.storage.from(altBucket).getPublicUrl(altPath);
          const altPdfUrl = altData.publicUrl;
          
          console.log('📄 Trying alternative URL:', altPdfUrl);
          
          // Test alternative URL
          try {
            const altResponse = await fetch(altPdfUrl, { method: 'HEAD' });
            if (altResponse.ok) {
              console.log('✅ Alternative PDF URL is accessible');
              await Linking.openURL(altPdfUrl);
              return;
            }
          } catch (altFetchError) {
            console.error('❌ Alternative PDF URL also not accessible:', altFetchError);
          }
        }
        
        Alert.alert(
          'PDF Not Found',
          'The PDF file could not be found or accessed. It may have been deleted or moved.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Check if the URL can be opened
      const canOpen = await Linking.canOpenURL(pdfUrl);
      if (canOpen) {
        await Linking.openURL(pdfUrl);
      } else {
        Alert.alert(
          'Cannot Open PDF',
          'Unable to open the PDF file. Please try downloading it manually.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      // Silently handle unexpected errors - specific cases are already handled above
      console.log('📄 PDF opening attempt completed');
    }
  };

  // Fetch book details
  const fetchBookDetails = async () => {
    if (!id) return;
    
    console.log('🔍 Fetching book with ID:', id);
    console.log('📚 Available books in context:', books.length);
    console.log('📚 Books in context:', books.map(b => ({ id: b.id, title: b.title })));
    
    // First try to get book from context (this is where library books are stored)
    const contextBook = books.find(b => b.id === id);
    console.log('📚 Context book found:', contextBook);
    
    if (contextBook) {
      const bookData = {
        id: parseInt(contextBook.id as string),
        title: contextBook.title,
        author: contextBook.author,
        description: contextBook.description,
        cover_image_url: contextBook.cover,
        cover: contextBook.cover,
        genre: contextBook.genre,
        genreColor: contextBook.genreColor,
        pdf_path: contextBook.pdf_path
      };
          console.log('✅ Setting book from context:', bookData);
    console.log('📄 PDF path from context:', bookData.pdf_path);
    setBook(bookData);
    return;
    }
    
    // Try with string ID comparison as well
    const contextBookString = books.find(b => b.id.toString() === id.toString());
    console.log('📚 Context book found with string comparison:', contextBookString);
    
    if (contextBookString) {
      const bookData = {
        id: parseInt(contextBookString.id as string),
        title: contextBookString.title,
        author: contextBookString.author,
        description: contextBookString.description,
        cover_image_url: contextBookString.cover,
        cover: contextBookString.cover,
        genre: contextBookString.genre,
        genreColor: contextBookString.genreColor,
        pdf_path: contextBookString.pdf_path
      };
          console.log('✅ Setting book from context (string match):', bookData);
    console.log('📄 PDF path from context (string match):', bookData.pdf_path);
    setBook(bookData);
    return;
    }
    
    // Fallback to database if not found in context
    try {
      console.log('🔄 Trying database fallback...');
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', parseInt(id as string))
        .single();
      
      if (error) throw error;
      console.log('✅ Book data fetched from database:', data);
      console.log('📄 PDF path from database:', data.pdf_path);
      setBook(data);
    } catch (error) {
      console.error('❌ Error fetching book from database:', error);
      console.log('❌ No book found in context or database');
    }
  };

  // Fetch ratings
  const fetchRatings = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select(`
          *,
          users:user_id(name)
        `)
        .eq('book_id', parseInt(id as string))
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
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          users:user_id(name)
        `)
        .eq('book_id', parseInt(id as string))
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
      
      if (user && id) {
        // Get user's existing rating
        const { data: userRatingData } = await supabase
          .from('ratings')
          .select('rating')
          .eq('book_id', parseInt(id as string))
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
    if (!user || !id) {
      Alert.alert('Error', 'Please log in to rate this book');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // First, check if user has already rated this book
      const { data: existingRating, error: checkError } = await supabase
        .from('ratings')
        .select('rating')
        .eq('user_id', user.id)
        .eq('book_id', parseInt(id as string))
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
          user_id: user.id,
          book_id: parseInt(id as string),
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
    if (!user || !id) {
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

  // Delete comment (admin only)
  const deleteComment = async (commentId: number) => {
    try {
      // Show confirmation dialog
      Alert.alert(
        'Delete Comment',
        'Are you sure you want to delete this comment? This action cannot be undone.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                const { error } = await supabase
                  .from('comments')
                  .delete()
                  .eq('id', commentId);
                
                if (error) throw error;
                
                // Refresh comments after deletion
                await fetchComments();
                
                Alert.alert('Success', 'Comment deleted successfully');
              } catch (error) {
                console.error('Error deleting comment:', error);
                Alert.alert('Error', 'Failed to delete comment');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error in delete comment:', error);
      Alert.alert('Error', 'Failed to delete comment');
    }
  };

  // Calculate average rating
  const averageRating = ratings.length > 0 
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
    : 0;

  useEffect(() => {
    if (id) {
      setLoading(true);
      Promise.all([
        fetchBookDetails(),
        fetchRatings(),
        fetchComments(),
        getCurrentUser()
      ]).finally(() => setLoading(false));
    }
  }, [id, books]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: isDarkMode ? darkBg : backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={[styles.loadingText, { color: textColor }]}>Loading book details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!book) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: isDarkMode ? darkBg : backgroundColor }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#e74c3c" />
          <Text style={[styles.errorText, { color: textColor }]}>Book not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.safeArea, { backgroundColor: isDarkMode ? darkBg : backgroundColor }]}>
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
        <Text style={{ fontSize: 18, fontWeight: '700', letterSpacing: 0.5, flex: 1, textAlign: 'center', color: isDarkMode ? darkText : textColor }}>
          Book Details
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
            <ActivityIndicator size="large" color={darkHighlight} />
            <Text style={{ color: isDarkMode ? '#ccc' : '#444', marginTop: 16 }}>Loading Book Details...</Text>
          </View>
        ) : book ? (
          <>
            {/* Book Information Section */}
            <View style={{ padding: 18 }}>
              <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                <View style={{ width: 120, height: 180, borderRadius: 12, overflow: 'hidden', marginRight: 16 }}>
                  <Image 
                    source={{ uri: book.cover_image_url || book.cover || 'https://covers.openlibrary.org/b/id/7222246-L.jpg' }} 
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                    onError={(error) => console.log('❌ Book image error:', error.nativeEvent.error)}
                    onLoad={() => console.log('✅ Book image loaded successfully')}
                  />
                  {!book.cover_image_url && !book.cover && (
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

              {/* PDF Section */}
              <View style={{ backgroundColor: isDarkMode ? '#23272b' : '#f6f7f9', marginBottom: 24, padding: 16, borderRadius: 12 }}>
                <Text style={{ color: textColor, fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
                  <Ionicons name="document-text" size={20} color="#3CB371" style={{ marginRight: 8 }} />
                  Book PDF
                </Text>
                {book.pdf_path ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: isDarkMode ? '#ccc' : '#444', fontSize: 14, marginBottom: 4 }}>
                        {book.pdf_path.split('/').pop() || 'PDF Document'}
                      </Text>
                      <Text style={{ color: secondaryTextColor, fontSize: 12 }}>
                        Available for download
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#3CB371',
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 8,
                        flexDirection: 'row',
                        alignItems: 'center'
                      }}
                      onPress={() => openPDF(book.pdf_path!)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="download" size={16} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Download</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="document-text-outline" size={20} color={secondaryTextColor} style={{ marginRight: 8 }} />
                    <Text style={{ color: secondaryTextColor, fontSize: 14 }}>
                      No PDF available for this book
                    </Text>
                  </View>
                )}
              </View>
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
                          <View style={{ flex: 1 }}>
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
                          {userRole === 'admin' && (
                            <TouchableOpacity
                              onPress={() => deleteComment(comment.id)}
                              style={{
                                padding: 8,
                                backgroundColor: '#E74C3C',
                                borderRadius: 6,
                                marginLeft: 8
                              }}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="trash-outline" size={16} color="#fff" />
                            </TouchableOpacity>
                          )}
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
    </View>
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
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
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