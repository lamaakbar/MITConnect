import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, TextInput, SafeAreaView } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useBooks } from '../../../components/BookContext';
import { useTheme } from '../../../components/ThemeContext';
import { useThemeColor } from '../../../hooks/useThemeColor';
import { useUserContext } from '../../../components/UserContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function LibraryBookDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { books } = useBooks();
  const { isDarkMode } = useTheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  const borderColor = isDarkMode ? '#2A2A2A' : '#eee';
  const iconColor = useThemeColor({}, 'icon');
  const book = books.find(b => b.id === id);
  const [comments, setComments] = useState<string[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const { userRole } = useUserContext();
  const insets = useSafeAreaInsets();
  const darkBg = '#181C20';
  const darkCard = '#23272b';
  const darkBorder = '#2D333B';
  const darkText = '#F3F6FA';
  const darkSecondary = '#AEB6C1';
  const darkHighlight = '#43C6AC';

  if (!book) {
    return (
      <View style={{ flex: 1, backgroundColor: (userRole === 'employee' || userRole === 'trainee') && isDarkMode ? darkCard : cardBackground }}>
        <View style={styles.container}>
          <Text style={[styles.errorText, { color: '#E74C3C' }]}>Book not found.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={iconColor} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleAddComment = () => {
    if (!commentInput.trim()) return;
    setComments([commentInput.trim(), ...comments]);
    setCommentInput('');
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: isDarkMode ? darkBg : backgroundColor }]}> {/* Themed background */}
      <ScrollView style={{ flex: 1, backgroundColor }} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        {userRole === 'employee' || userRole === 'trainee' ? (
          <>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 0,
              paddingTop: insets.top + 10,
              paddingBottom: 6,
              backgroundColor: isDarkMode ? darkCard : cardBackground,
              borderBottomWidth: 1,
              borderBottomColor: isDarkMode ? darkBorder : borderColor,
            }}>
              <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 8 }}>
                <Ionicons name="arrow-back" size={24} color={iconColor} />
              </TouchableOpacity>
              <Text style={{
                fontSize: 22,
                fontWeight: '700',
                letterSpacing: 0.5,
                flex: 1,
                textAlign: 'center',
                color: isDarkMode ? darkText : textColor
              }}>
                MIT<Text style={{ color: darkHighlight }}>Connect</Text>
              </Text>
              <View style={{ width: 32 }} />
            </View>
            <View style={{ height: 16 }} />
          </>
        ) : (
          <View style={[styles.header, { backgroundColor: cardBackground, borderBottomColor: borderColor }]}> {/* Themed header */}
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={iconColor} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: textColor }]}>Book Details</Text>
            <View style={{ width: 24 }} />
          </View>
        )}
        {/* Book Details Card */}
        <View style={[styles.bookCard, { backgroundColor: cardBackground }]}> {/* Themed card */}
          <View style={{ flexDirection: 'row' }}>
            <Image source={{ uri: book.cover }} style={styles.bookCover} />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <View style={[styles.genreChip, { backgroundColor: book.genreColor }]}> 
                <Text style={[styles.genreText, { color: isDarkMode ? '#23272b' : '#222' }]}>{book.genre}</Text>
              </View>
              <Text style={[styles.bookTitle, { color: textColor }]}>{book.title}</Text>
              <Text style={[styles.bookAuthor, { color: secondaryTextColor }]}>{`By ${book.author}`}</Text>
            </View>
          </View>
          {/* About This Book */}
          {book.description && (
            <View style={[styles.aboutBox, { backgroundColor: isDarkMode ? '#23272b' : '#f6f7f9' }]}> {/* Themed about box */}
              <Text style={[styles.aboutLabel, { color: textColor }]}>About This Book</Text>
              <Text style={[styles.aboutText, { color: isDarkMode ? '#ccc' : '#444' }]}>{book.description}</Text>
            </View>
          )}
          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: isDarkMode ? '#23272b' : '#f6f7f9' }]}> {/* Themed stat card */}
              <Ionicons name="person-outline" size={30} color="#1abc9c" style={{ marginBottom: 4 }} />
              <Text style={[styles.statNameBold, { color: textColor }]}>Nizar Naghi</Text>
              <Text style={[styles.statLabel, { color: secondaryTextColor }]}>Recommended by</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: isDarkMode ? '#23272b' : '#f6f7f9' }]}> {/* Themed stat card */}
              <Ionicons name="book-outline" size={30} color="#2979ff" style={{ marginBottom: 4 }} />
              <Text style={[styles.statNumber, { color: textColor }]}>44</Text>
              <Text style={[styles.statLabel, { color: secondaryTextColor }]}>Book</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: isDarkMode ? '#23272b' : '#f6f7f9' }]}> {/* Themed stat card */}
              <Ionicons name="star-outline" size={30} color="#FFA726" style={{ marginBottom: 4 }} />
              <Text style={[styles.statNumber, { color: textColor }]}>4.9</Text>
              <Text style={[styles.statLabel, { color: secondaryTextColor }]}>Rating</Text>
            </View>
          </View>
          {/* Comments Section */}
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
              onPress={handleAddComment}
              activeOpacity={0.8}
            >
              <Text style={[styles.commentPostBtnText, { color: isDarkMode ? '#43C6AC' : '#2196f3' }]}>Post Comment</Text>
            </TouchableOpacity>
            <Text style={[styles.commentSubtitle, { color: textColor }]}>Recent Comments</Text>
            <View style={styles.commentList}>
              {comments.length === 0 ? (
                <Text style={[styles.noComments, { color: secondaryTextColor }]}>No comments yet. Be the first to comment!</Text>
              ) : (
                comments.map((c, idx) => (
                  <View key={idx} style={[styles.commentBubble, { backgroundColor: isDarkMode ? '#23272b' : '#f6f7f9' }]}> {/* Themed bubble */}
                    <Text style={[styles.commentText, { color: textColor }]}>{c}</Text>
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
  errorText: {
    color: 'red',
    fontSize: 16,
    marginTop: 80,
    textAlign: 'center',
  },
}); 