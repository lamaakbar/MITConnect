import React, { useState } from 'react';
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

// Mock recent books
const recentBooks = [
  {
    id: '2',
    title: 'White Nights',
    author: 'Fyodor Dostoevsky',
    genre: 'Philosophical Fiction',
    genreColor: '#A3C9A8',
    cover: 'https://covers.openlibrary.org/b/id/11153223-L.jpg',
  },
  {
    id: '3',
    title: 'The Richest Man in Babylon',
    author: 'George S. Clason',
    genre: 'Finance',
    genreColor: '#B5D6F6',
    cover: 'https://covers.openlibrary.org/b/id/11153224-L.jpg',
  },
];

export default function BookClubScreen() {
  const router = useRouter();
  const { books } = useBooks();
  const [activeTab, setActiveTab] = useState('bookclub');
  const [userRating, setUserRating] = useState(0);
  const [mainCommentInput, setMainCommentInput] = useState('');
  const [mainComments, setMainComments] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const { isDarkMode, toggleTheme } = useTheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  const borderColor = isDarkMode ? '#2A2A2A' : '#eee';
  const iconColor = useThemeColor({}, 'icon');

  const openBookModal = (book: any) => {
    setSelectedBook(book);
    setModalVisible(true);
  };

  const closeBookModal = () => {
    setModalVisible(false);
    setSelectedBook(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Club</Text>
        <TouchableOpacity onPress={toggleTheme} style={styles.themeToggleBtn}>
          <Ionicons name={isDarkMode ? 'moon' : 'sunny'} size={24} color={iconColor} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Featured Book Section */}
        <Text style={styles.sectionTitle}>
          <Ionicons name="star" size={20} color="#1abc9c" /> Featured Book This Week
        </Text>
        <View style={styles.featuredCard}>
          <View style={{ flexDirection: 'row' }}>
            <Image source={{ uri: FEATURED_BOOK.cover }} style={styles.featuredCover} />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <View style={styles.genreChip}>
                <Text style={styles.genreText}>{FEATURED_BOOK.genre}</Text>
              </View>
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
            <Text style={styles.rateLabel}>
              <MaterialIcons name="star-border" size={18} color="#F4B400" /> Rate This Book
            </Text>
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
          <Text style={styles.sectionTitle}>
            <Feather name="clock" size={16} color="#3AC569" /> Recent Selections
          </Text>
          <TouchableOpacity
            style={styles.goLibraryBtnSmall}
            onPress={() => router.push('/books-management')}
            activeOpacity={0.7}
          >
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
              <TouchableOpacity
                style={{ alignSelf: 'center' }}
                onPress={() => router.push('/book-details')}
                activeOpacity={0.7}
              >
                <Text style={styles.moreDetails}>More Details</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <Text style={{ color: '#888', textAlign: 'center', marginTop: 16 }}>
              No recent selections.
            </Text>
          }
        />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
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
  themeToggleBtn: {
    padding: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  featuredCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
    marginTop: 2,
  },
  featuredAuthor: {
    fontSize: 15,
    color: '#888',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 15,
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
    padding: 12,
    marginTop: 16,
    marginBottom: 12,
  },
  aboutLabel: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 6,
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
  commentText: {
    fontSize: 14,
    color: '#222',
    lineHeight: 20,
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
  recentCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  recentCover: {
    width: 60,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  recentAuthor: {
    fontSize: 13,
    color: '#888',
    marginBottom: 4,
  },
  moreDetails: {
    fontSize: 13,
    color: '#2196f3',
    fontWeight: '600',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
}); 