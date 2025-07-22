import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useBooks } from '../components/BookContext';
import { useTheme } from '../components/ThemeContext';
import { useThemeColor } from '../hooks/useThemeColor';

export default function LibraryScreen() {
  const router = useRouter();
  const { books } = useBooks();
  const { isDarkMode } = useTheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  const borderColor = isDarkMode ? '#2A2A2A' : '#eee';
  const iconColor = useThemeColor({}, 'icon');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <View style={[styles.header, { backgroundColor: cardBackground, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={iconColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>MITConnect Library</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <FlatList
        data={books}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.bookList}
        renderItem={({ item }) => (
          <View style={[styles.bookCard, { backgroundColor: cardBackground }]}>
            <Image source={{ uri: item.cover }} style={styles.bookCover} />
            <View style={styles.bookInfo}>
              <Text style={[styles.bookTitle, { color: textColor }]}>{item.title}</Text>
              <Text style={[styles.bookAuthor, { color: secondaryTextColor }]}>{`By ${item.author}`}</Text>
              <View style={[styles.genreChip, { backgroundColor: item.genreColor }]}>
                <Text style={[styles.genreText, { color: isDarkMode ? '#23272b' : '#222' }]}>{item.genre}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.moreDetailsBtn}
              onPress={() => router.push({ pathname: '/library/[id]/details', params: { id: item.id } })}
            >
              <Text style={[styles.moreDetailsText, { color: isDarkMode ? '#43C6AC' : '#2196f3' }]}>More Details</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="library-outline" size={64} color={secondaryTextColor} />
            <Text style={[styles.emptyText, { color: secondaryTextColor }]}>No books available</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
  bookList: {
    padding: 16,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  bookCover: {
    width: 60,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: '#eee',
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  genreChip: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#A3C9A8',
  },
  genreText: {
    fontSize: 11,
    color: '#222',
    fontWeight: '500',
  },
  moreDetailsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  moreDetailsText: {
    color: '#2196f3',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 16,
  },
}); 