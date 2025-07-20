import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, TextInput, SafeAreaView, FlatList } from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useBooks } from '../../../components/BookContext';

const FEATURED_BOOK = {
  id: 'featured',
  title: 'The Alchemist',
  author: 'Paulo Coelho',
  genre: 'Philosophical Fiction',
  genreColor: '#A3C9A8',
  cover: 'https://covers.openlibrary.org/b/id/7222246-L.jpg',
  description: 'The Alchemist is a novel by Paulo Coelho that follows the journey of Santiago, a young Andalusian shepherd who dreams of finding a hidden treasure near the Egyptian pyramids. Along the way, he meets several people — including a king, a merchant, an Englishman, and an alchemist — each helping him discover deeper truths about life. The story is a spiritual and philosophical journey that teaches readers about following one\'s dreams, listening to the heart, and trusting the universe.',
  rating: 4.9,
  ratingCount: 44,
  recommender: 'Nizar Naghi',
};

export default function FeaturedBookDetailsScreen() {
  const router = useRouter();
  const { books } = useBooks();
  const [comments, setComments] = useState<string[]>([]);
  const [commentInput, setCommentInput] = useState('');

  // Exclude featured book from recent selections
  const recentBooks = books.filter(b => b.title !== FEATURED_BOOK.title);

  const handleAddComment = () => {
    if (!commentInput.trim()) return;
    setComments([commentInput.trim(), ...comments]);
    setCommentInput('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#222" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Details</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Book Details Card */}
        <View style={styles.bookCard}>
          <View style={{ flexDirection: 'row' }}>
            <Image source={{ uri: FEATURED_BOOK.cover }} style={styles.bookCover} />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <View style={[styles.genreChip, { backgroundColor: FEATURED_BOOK.genreColor }]}> 
                <Text style={styles.genreText}>{FEATURED_BOOK.genre}</Text>
              </View>
              <Text style={styles.bookTitle}>{FEATURED_BOOK.title}</Text>
              <Text style={styles.bookAuthor}>By {FEATURED_BOOK.author}</Text>
            </View>
          </View>

          {/* About This Book */}
          {FEATURED_BOOK.description && (
            <View style={styles.aboutBox}>
              <Text style={styles.aboutLabel}>About This Book</Text>
              <Text style={styles.aboutText}>{FEATURED_BOOK.description}</Text>
            </View>
          )}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="person-outline" size={30} color="#1abc9c" style={{ marginBottom: 4 }} />
              <Text style={styles.statNameBold}>Nizar Naghi</Text>
              <Text style={styles.statLabel}>Recommended by</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="book-outline" size={30} color="#2979ff" style={{ marginBottom: 4 }} />
              <Text style={styles.statNumber}>44</Text>
              <Text style={styles.statLabel}>Book</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="star-outline" size={30} color="#FFA726" style={{ marginBottom: 4 }} />
              <Text style={styles.statNumber}>4.9</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>

          {/* Comments Section */}
          <View style={styles.commentSection}>
            <Text style={styles.commentTitle}>Comments</Text>
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInputArea}
                placeholder="Write a comment..."
                value={commentInput}
                onChangeText={setCommentInput}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
            <TouchableOpacity
              style={styles.commentPostBtn}
              onPress={handleAddComment}
              activeOpacity={0.8}
            >
              <Text style={styles.commentPostBtnText}>Post Comment</Text>
            </TouchableOpacity>
            <Text style={styles.commentSubtitle}>Recent Comments</Text>
            <View style={styles.commentList}>
              {comments.length === 0 ? (
                <Text style={styles.noComments}>No comments yet. Be the first to comment!</Text>
              ) : (
                comments.map((c, idx) => (
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
              <TouchableOpacity style={{ alignSelf: 'center' }} onPress={() => router.push({ pathname: '/library/[id]/details', params: { id: item.id } })}>
                <Text style={styles.moreDetails}>More Details</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={{ color: '#888', textAlign: 'center', marginTop: 16 }}>No recent selections.</Text>}
        />
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 8,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  bookCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  bookCover: {
    width: 110,
    height: 160,
    borderRadius: 12,
    backgroundColor: '#eee',
  },
  genreChip: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 6,
  },
  genreText: {
    fontSize: 11,
    color: '#222',
    fontWeight: '500',
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
    marginTop: 2,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
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
  statCard: {
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
  statNameBold: {
    fontSize: 15,
    color: '#222',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 0,
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
  recentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 12,
    paddingHorizontal: 4,
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
}); 