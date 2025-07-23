
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Alert, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useBooks } from '../components/BookContext';
import AdminTabBar from '../components/AdminTabBar';
import Toast from 'react-native-root-toast';
import AdminHeader from '../components/AdminHeader';
import { useTheme } from '../components/ThemeContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminBooksScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { books, removeBook } = useBooks();

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  const borderColor = isDarkMode ? '#2A2A2A' : '#E0E0E0';

  const handleRemove = (id: string, title: string) => {
    Alert.alert(
      'Remove Book',
      `Are you sure you want to remove this book?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeBook(id);
            Toast.show('Book removed successfully', {
              duration: Toast.durations.SHORT,
              position: Toast.positions.BOTTOM,
            });
          },
        },
      ]
    );
  };

  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      <View style={{
        paddingTop: insets.top,
        backgroundColor: cardBackground,
        borderBottomColor: borderColor,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 8 }}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#fff' : '#222'} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            letterSpacing: 0.5,
            color: isDarkMode ? '#fff' : '#222',
          }}>MIT<Text style={{ color: '#3CB371' }}>Connect</Text></Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/add-book')}
          style={{
            backgroundColor: '#3CB371',
            borderRadius: 24,
            width: 40,
            height: 40,
            marginLeft: 8,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.12,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
            elevation: 3,
          }}
          activeOpacity={0.85}
          accessibilityLabel="Add Book"
        >
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={[styles.container, { backgroundColor }]}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: cardBackground, borderColor }]}>
            <Text style={[styles.statNumber, { color: textColor }]}>{books.length}</Text>
            <Text style={[styles.statLabel, { color: secondaryTextColor }]}>Total Books</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: cardBackground, borderColor }]}>
            <Text style={[styles.statNumber, { color: textColor }]}>
              {books.filter(book => book.genre === 'Technology').length}
            </Text>
            <Text style={[styles.statLabel, { color: secondaryTextColor }]}>Technology</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: cardBackground, borderColor }]}>
            <Text style={[styles.statNumber, { color: textColor }]}>
              {books.filter(book => book.genre === 'Business').length}
            </Text>
            <Text style={[styles.statLabel, { color: secondaryTextColor }]}>Business</Text>
          </View>
        </View>

        {/* Books List */}
        {books.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="library-outline" size={64} color="#ccc" />
            <Text style={[styles.emptyStateTitle, { color: textColor }]}>No Books in Library</Text>
            <Text style={[styles.emptyStateText, { color: secondaryTextColor }]}>
              Start building your library by adding the first book. Share knowledge and inspire your team!
            </Text>
            <TouchableOpacity 
              style={styles.emptyStateButton}
              onPress={() => router.push('/add-book')}
            >
              <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.emptyStateButtonText}>Add First Book</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={books}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/books-management/[id]/details', params: { id: item.id } })}
                activeOpacity={0.8}
              >
                <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
                  <Image source={{ uri: item.cover }} style={styles.cover} />
                  <View style={styles.info}>
                    <Text style={[styles.title, { color: textColor }]}>{item.title}</Text>
                    <Text style={[styles.author, { color: secondaryTextColor }]}>By {item.author}</Text>
                    <View style={[styles.genreChip, { backgroundColor: item.genreColor }]}> 
                      <Text style={[styles.genreText, { color: textColor }]}>{item.genre}</Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={[styles.removeBtn, { backgroundColor: isDarkMode ? '#2A2A2A' : '#F2F2F2' }]} 
                    onPress={() => handleRemove(item.id, item.title)}
                  >
                    <Text style={[styles.removeBtnText, { color: isDarkMode ? '#E74C3C' : '#444' }]}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Bottom Tab Bar */}
        <AdminTabBar activeTab="books" />
      </View>
    </View>
  ); 
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3AC569',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  listContainer: {
    paddingBottom: 100, // Extra padding for tab bar
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    minHeight: 100,
  },
  cover: {
    width: 60,
    height: 85,
    borderRadius: 10,
    marginRight: 16,
    backgroundColor: '#eee',
    flexShrink: 0,
  },
  info: {
    flex: 1,
    flexShrink: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
    flexShrink: 1,
  },
  author: {
    fontSize: 13,
    marginBottom: 8,
  },
  genreChip: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginTop: 2,
  },
  genreText: {
    fontSize: 12,
  },
  removeBtn: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 12,
  },
  removeBtnText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#3AC569',
    flexDirection: 'row',
    alignItems: 'center',
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