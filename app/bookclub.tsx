import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ScrollView, SafeAreaView, Modal, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useBooks } from '../components/BookContext';
import type { Book } from '../components/BookContext';
import { useRouter } from 'expo-router';

const FEATURED_BOOK = {
  id: 'featured',
  title: 'The Alchemist',
  author: 'Paulo Coelho',
  genre: 'Philosophical Fiction',
  genreColor: '#A3C9A8',
  cover: 'https://covers.openlibrary.org/b/id/7222246-L.jpg',
  description:
    'The Alchemist is a novel by Paulo Coelho that follows the journey of Santiago, a young Andalusian shepherd who dreams of finding a hidden treasure near the Egyptian pyramids. Along the way, he meets several people — including a king, a merchant, an Englishman, and an alchemist — each helping him discover deeper truths about life. The story is a spiritual and philosophical journey that teaches readers about following one’s dreams, listening to the heart, and trusting the universe.',
  rating: 4.9,
  ratingCount: 44,
  recommender: 'Nizar Naghi',
};

export default function BookClubScreen() {
  const { books } = useBooks();
  const [userRating, setUserRating] = useState(0);
  const [activeTab, setActiveTab] = useState('bookclub');
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [comments, setComments] = useState<{ [bookId: string]: string[] }>({});
  const [commentInput, setCommentInput] = useState('');
  const [mainComments, setMainComments] = useState<string[]>([]);
  const [mainCommentInput, setMainCommentInput] = useState('');

  // Exclude featured book from recent selections
  const recentBooks = books.filter(b => FEATURED_BOOK && b.title !== FEATURED_BOOK.title);

  const openBookModal = (book: Book) => {
    setSelectedBook(book);
    setModalVisible(true);
    setCommentInput('');
  };
  const closeBookModal = () => {
    setModalVisible(false);
    setSelectedBook(null);
    setCommentInput('');
  };
  const handleAddComment = () => {
    if (!selectedBook || !commentInput.trim()) return;
    setComments(prev => ({
      ...prev,
      [selectedBook.id]: [...(prev[selectedBook.id] || []), commentInput.trim()]
    }));
    setCommentInput('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Featured Book Section */}
        {!FEATURED_BOOK ? (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateTitle}>No Featured Book</Text>
            <Text style={styles.emptyStateText}>
              There's no featured book this week. Check the library for great reads!
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => router.push('/books-management')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyStateButtonText}>Browse Library</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Header row with button */}
            <View style={styles.featuredHeaderRow}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="star" size={20} color="#1abc9c" /> Featured Book This Week
              </Text>
              <TouchableOpacity
                style={[styles.goLibraryBtn, books.length === 0 && styles.goLibraryBtnDisabled]}
                onPress={() => router.push('/books-management')}
                disabled={books.length === 0}
                activeOpacity={0.8}
              >
                <Text style={styles.goLibraryBtnText}>Go to Library</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.featuredCard}>
          <View style={{ flexDirection: 'row' }}>
            <Image source={{ uri: FEATURED_BOOK.cover }} style={styles.featuredCover} />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <View style={styles.genreChip}><Text style={styles.genreText}>{FEATURED_BOOK.genre}</Text></View>
              <Text style={styles.featuredTitle}>{FEATURED_BOOK.title}</Text>
              <Text style={styles.featuredAuthor}>By {FEATURED_BOOK.author}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                {[1,2,3,4,5].map(i => (
                  <MaterialIcons
                    key={i}
                    name={i <= Math.round(FEATURED_BOOK.rating) ? 'star' : 'star-border'}
                    size={18}
                    color="#F4B400"
                    style={{ marginRight: 2 }}
                  />
                ))}
                <Text style={styles.ratingText}>{FEATURED_BOOK.rating}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                <Ionicons name="person" size={16} color="#888" style={{ marginRight: 4 }} />
                <Text style={styles.recommender}>{FEATURED_BOOK.recommender}</Text>
              </View>
            </View>
          </View>
          {/* About This Book */}
          <View style={styles.aboutBox}>
            <Text style={styles.aboutLabel}>About This Book</Text>
            <Text style={styles.aboutText}>{FEATURED_BOOK.description}</Text>
          </View>
          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCardNewSmall}>
              <Ionicons name="person-outline" size={30} color="#1abc9c" style={{ marginBottom: 4 }} />
              <Text style={styles.statNameBold}>Nizar Naghi</Text>
              <Text style={styles.statLabelNewSmall}>Recommended by</Text>
            </View>
            <View style={styles.statCardNewSmall}>
              <Ionicons name="book-outline" size={30} color="#2979ff" style={{ marginBottom: 4 }} />
              <Text style={styles.statNumberSmall}>44</Text>
              <Text style={styles.statLabelNewSmall}>Book</Text>
            </View>
            <View style={styles.statCardNewSmall}>
              <Ionicons name="star-outline" size={30} color="#FFA726" style={{ marginBottom: 4 }} />
              <Text style={styles.statNumberSmall}>4.9</Text>
              <Text style={styles.statLabelNewSmall}>Rating</Text>
            </View>
          </View>
          {/* Rate This Book */}
          <View style={styles.rateBox}>
            <Text style={styles.rateLabel}><MaterialIcons name="star-border" size={18} color="#F4B400" /> Rate This Book</Text>
            <View style={{ flexDirection: 'row', marginTop: 6 }}>
              {[1,2,3,4,5].map(i => (
                <TouchableOpacity key={i} onPress={() => setUserRating(i)}>
                  <MaterialIcons
                    name={i <= userRating ? 'star' : 'star-border'}
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
            <Text style={styles.commentTitle}>Comments</Text>
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInputArea}
                placeholder="Write a comment..."
                value={mainCommentInput}
                onChangeText={setMainCommentInput}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
            <TouchableOpacity
              style={styles.commentPostBtn}
              onPress={() => {
                if (mainCommentInput.trim()) {
                  setMainComments([mainCommentInput.trim(), ...mainComments]);
                  setMainCommentInput('');
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.commentPostBtnText}>Post Comment</Text>
            </TouchableOpacity>
            <Text style={styles.commentSubtitle}>Recent Comments</Text>
            <View style={styles.commentList}>
              {mainComments.length === 0 ? (
                <Text style={styles.noComments}>No comments yet. Be the first to comment!</Text>
              ) : (
                mainComments.map((c, idx) => (
                  <View key={idx} style={styles.commentBubble}>
                    <Text style={styles.commentText}>{c}</Text>
                  </View>
                ))
              )}
            </View>
                    </View>
        </View>



        {/* Recent Selections */}
        <View style={styles.recentHeaderRow}>
          <Text style={styles.sectionTitle}><Feather name="clock" size={16} color="#3AC569" /> Recent Selections</Text>
          <TouchableOpacity style={styles.goLibraryBtnSmall} onPress={() => router.push('/library')}>
            <Text style={styles.goLibraryBtnTextSmall}>Go to MITC Library</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={recentBooks}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.recentCard}>
              <Image source={{ uri: item.cover }} style={styles.recentCover} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.recentTitle}>{item.title}</Text>
                <Text style={styles.recentAuthor}>By {item.author}</Text>
                <View style={[styles.genreChip, { alignSelf: 'flex-start', marginTop: 4, backgroundColor: item.genreColor }]}> 
                  <Text style={styles.genreText}>{item.genre}</Text>
                </View>
              </View>
              <TouchableOpacity style={{ alignSelf: 'center' }} onPress={() => router.push(`/library/${item.id}/details`)}>
                <Text style={styles.moreDetails}>More Details</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={{ color: '#888', textAlign: 'center', marginTop: 16 }}>No recent selections.</Text>}
        />
          </>
        )}
      </ScrollView>
      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navBtn} onPress={() => { setActiveTab('home'); router.push('/trainee-home'); }}>
          <Ionicons name="home" size={28} color={activeTab === 'home' ? '#43C6AC' : '#bbb'} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => { setActiveTab('calendar'); router.push('/events'); }}>
          <Ionicons name="calendar-outline" size={28} color={activeTab === 'calendar' ? '#43C6AC' : '#bbb'} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => { setActiveTab('gallery'); router.push('/gallery'); }}>
          <Ionicons name="image-outline" size={28} color={activeTab === 'gallery' ? '#43C6AC' : '#bbb'} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => { setActiveTab('bookclub'); router.push('/bookclub'); }}>
          <Ionicons name="book-outline" size={28} color={activeTab === 'bookclub' ? '#43C6AC' : '#bbb'} />
        </TouchableOpacity>
      </View>
      {/* Book Details Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeBookModal}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
          {selectedBook && (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ width: '100%', alignItems: 'center', flex: 1 }}
            >
              <ScrollView
                style={{ width: '100%' }}
                contentContainerStyle={{ alignItems: 'center', paddingBottom: 24 }}
                keyboardShouldPersistTaps="handled"
              >
                <View style={[styles.featuredCard, { width: '92%', maxWidth: 400, marginTop: 40 }]}> 
                  <TouchableOpacity onPress={closeBookModal} style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}>
                    <Ionicons name="close" size={26} color="#888" />
                  </TouchableOpacity>
                  <View style={{ flexDirection: 'row' }}>
                    <Image source={{ uri: selectedBook.cover }} style={styles.featuredCover} />
                    <View style={{ flex: 1, marginLeft: 16 }}>
                      <View style={[styles.genreChip, { backgroundColor: selectedBook.genreColor }]}><Text style={styles.genreText}>{selectedBook.genre}</Text></View>
                      <Text style={styles.featuredTitle}>{selectedBook.title}</Text>
                      <Text style={styles.featuredAuthor}>By {selectedBook.author}</Text>
                    </View>
                  </View>
                  {/* About This Book */}
                  {selectedBook.description && (
                    <View style={styles.aboutBox}>
                      <Text style={styles.aboutLabel}>About This Book</Text>
                      <Text style={styles.aboutText}>{selectedBook.description}</Text>
                    </View>
                  )}
                  {/* Stats Row (reuse) */}
                  <View style={styles.statsRow}>
                    <View style={styles.statCardNewSmall}>
                      <Ionicons name="person-outline" size={30} color="#1abc9c" style={{ marginBottom: 4 }} />
                      <Text style={styles.statNameBold}>Nizar Naghi</Text>
                      <Text style={styles.statLabelNewSmall}>Recommended by</Text>
                    </View>
                    <View style={styles.statCardNewSmall}>
                      <Ionicons name="book-outline" size={30} color="#2979ff" style={{ marginBottom: 4 }} />
                      <Text style={styles.statNumberSmall}>44</Text>
                      <Text style={styles.statLabelNewSmall}>Book</Text>
                    </View>
                    <View style={styles.statCardNewSmall}>
                      <Ionicons name="star-outline" size={30} color="#FFA726" style={{ marginBottom: 4 }} />
                      <Text style={styles.statNumberSmall}>4.9</Text>
                      <Text style={styles.statLabelNewSmall}>Rating</Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f6f7f9',
  },
  container: {
    flex: 1,
    backgroundColor: '#f6f7f9',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#222',
    marginTop: 0,
    marginBottom: 0,
    flexShrink: 0,
    flexGrow: 1,
  },
  featuredCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
    marginTop: 2,
  },
  featuredAuthor: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  ratingText: {
    fontSize: 14,
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
    borderRadius: 10,
    padding: 10,
    marginTop: 16,
    marginBottom: 10,
  },
  aboutLabel: {
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 4,
    color: '#222',
  },
  aboutText: {
    fontSize: 13,
    color: '#444',
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 10,
  },
  statCardNew: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 32,
    marginHorizontal: 8,
    alignItems: 'center',
    paddingVertical: 28,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabelNew: {
    fontSize: 22,
    color: '#555',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 0,
  },
  rateBox: {
    backgroundColor: '#f6f7f9',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    alignItems: 'flex-start',
  },
  rateLabel: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#222',
    marginBottom: 4,
  },
  recentCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 10,
    marginBottom: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  recentCover: {
    width: 54,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  recentAuthor: {
    fontSize: 13,
    color: '#555',
  },
  moreDetails: {
    color: '#3AC569',
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 8,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minWidth: 400,
    zIndex: 10,
  },
  navBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  statCardNewSmall: {
    flex: 1,
    backgroundColor: '#f6f7f9',
    borderRadius: 20,
    marginHorizontal: 4,
    alignItems: 'center',
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statNumberSmall: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
    textAlign: 'center',
  },
  statLabelNewSmall: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 0,
  },
  statRecommender: {
    fontSize: 13,
    color: '#222',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
    lineHeight: 16,
  },
  statRecommenderSubtle: {
    fontSize: 13,
    color: '#888',
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 2,
    lineHeight: 16,
  },
  statNameSubtle: {
    fontSize: 14,
    color: '#888',
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 2,
  },
  statNameBold: {
    fontSize: 15,
    color: '#222',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  commentSection: {
    marginTop: 18,
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
  commentList: {
    marginBottom: 10,
    maxHeight: 120,
  },
  noComments: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
  },
  commentBubble: {
    backgroundColor: '#f6f7f9',
    borderRadius: 10,
    padding: 8,
    marginBottom: 6,
    alignSelf: 'flex-start',
    maxWidth: '90%',
  },
  commentText: {
    fontSize: 14,
    color: '#222',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f6f7f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#222',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  commentSendBtn: {
    padding: 6,
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
    fontWeight: 'bold',
    fontSize: 20,
  },
  commentSubtitle: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#222',
    marginBottom: 6,
    marginTop: 8,
  },
  featuredHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  goLibraryBtn: {
    backgroundColor: '#1abc9c',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
    maxWidth: 100,
    flexGrow: 0,
    flexShrink: 0,
  },
  goLibraryBtnDisabled: {
    opacity: 0.5,
  },
  goLibraryBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  recentHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  seeMoreBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  seeMoreText: {
    color: '#3AC569',
    fontWeight: 'bold',
    fontSize: 14,
  },
  goLibraryBtnSmall: {
    backgroundColor: '#1abc9c',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goLibraryBtnTextSmall: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#1abc9c',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 