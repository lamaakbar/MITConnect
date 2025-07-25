
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Alert, SafeAreaView, StatusBar, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useBooks } from '../components/BookContext';
import AdminTabBar from '../components/AdminTabBar';
import Toast from 'react-native-root-toast';
import AdminHeader from '../components/AdminHeader';
import { useTheme } from '../components/ThemeContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');

export default function AdminBooksScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { books, removeBook, updateBookCategory } = useBooks();

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  const borderColor = isDarkMode ? '#2A2A2A' : '#E0E0E0';

  const handleRemove = (id: string, title: string) => {
    Alert.alert(
      'Remove Book',
      `Are you sure you want to remove "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeBook(id);
              Toast.show('Book removed successfully', {
                duration: Toast.durations.SHORT,
                position: Toast.positions.BOTTOM,
              });
            } catch (error) {
              Toast.show('Failed to remove book', {
                duration: Toast.durations.SHORT,
                position: Toast.positions.BOTTOM,
              });
            }
          },
        },
      ]
    );
  };

  const handleSetAsBookOfMonth = async (id: string, title: string) => {
    Alert.alert(
      'Set as Book of the Month',
      `Are you sure you want to set "${title}" as the Book of the Month?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Set',
          onPress: async () => {
            try {
              await updateBookCategory(parseInt(id), 'book_of_the_month');
              Toast.show('Book set as Book of the Month', {
                duration: Toast.durations.SHORT,
                position: Toast.positions.BOTTOM,
              });
            } catch (error) {
              Toast.show('Failed to update book category', {
                duration: Toast.durations.SHORT,
                position: Toast.positions.BOTTOM,
              });
            }
          },
        },
      ]
    );
  };

  const insets = useSafeAreaInsets();

  const renderBookCard = ({ item }: { item: any }) => (
    <View style={[styles.bookCard, { backgroundColor: cardBackground, borderColor }]}>
      <View style={styles.bookHeader}>
        <Image source={{ uri: item.cover }} style={styles.bookCover} />
        <View style={styles.bookInfo}>
          <Text style={[styles.bookTitle, { color: textColor }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.bookAuthor, { color: secondaryTextColor }]} numberOfLines={1}>
            By {item.author}
          </Text>
          <View style={styles.bookTags}>
            {item.genre && (
              <View style={[styles.genreChip, { backgroundColor: item.genreColor || '#A3C9A8' }]}>
                <Text style={[styles.genreText, { color: isDarkMode ? '#23272b' : '#222' }]}>
                  {item.genre}
                </Text>
              </View>
            )}
            {item.category === 'book_of_the_month' && (
              <View style={[styles.categoryChip, { backgroundColor: '#F4D03F' }]}>
                <Text style={[styles.categoryText, { color: '#23272b' }]}>
                  Book of the Month
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryButton, { backgroundColor: '#43C6AC' }]}
          onPress={() => router.push({ pathname: '/books-management/[id]/details', params: { id: item.id } })}
        >
          <Ionicons name="eye-outline" size={16} color="#fff" />
          <Text style={[styles.actionButtonText, { color: '#fff' }]}>View Details</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.secondaryButton, { backgroundColor: isDarkMode ? '#2A2A2A' : '#F8F9FA' }]}
          onPress={() => handleSetAsBookOfMonth(item.id, item.title)}
        >
          <Ionicons name="star-outline" size={16} color="#F39C12" />
          <Text style={[styles.actionButtonText, { color: '#F39C12' }]}>Set as Book of Month</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.dangerButton, { backgroundColor: isDarkMode ? '#2A2A2A' : '#F8F9FA' }]}
          onPress={() => handleRemove(item.id, item.title)}
        >
          <Ionicons name="trash-outline" size={16} color="#E74C3C" />
          <Text style={[styles.actionButtonText, { color: '#E74C3C' }]}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          MIT<Text style={{ color: '#3CB371' }}>Connect</Text>
        </Text>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: '#3CB371' }]}
          onPress={() => router.push('/add-book')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats Section */}
      <View style={[styles.statsSection, { backgroundColor: cardBackground, borderColor }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: textColor }]}>{books.length}</Text>
          <Text style={[styles.statLabel, { color: secondaryTextColor }]}>Total Books</Text>
        </View>
      </View>

      {/* Books List */}
      <FlatList
        data={books}
        keyExtractor={item => item.id}
        renderItem={renderBookCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="library-outline" size={64} color={secondaryTextColor} />
            <Text style={[styles.emptyStateTitle, { color: textColor }]}>No Books Available</Text>
            <Text style={[styles.emptyStateText, { color: secondaryTextColor }]}>
              Start by adding your first book to the library.
            </Text>
            <TouchableOpacity 
              style={[styles.addFirstBookButton, { backgroundColor: '#3CB371' }]}
              onPress={() => router.push('/add-book')}
            >
              <Text style={[styles.addFirstBookButtonText, { color: '#fff' }]}>Add Your First Book</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Bottom Tab Bar */}
      <AdminTabBar activeTab="books" />
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
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  bookCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  bookHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  bookCover: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginRight: 16,
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    lineHeight: 24,
  },
  bookAuthor: {
    fontSize: 14,
    marginBottom: 8,
  },
  bookTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  genreText: {
    fontSize: 12,
    fontWeight: '500',
  },
  categoryChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  primaryButton: {
    // Primary button styles
  },
  secondaryButton: {
    // Secondary button styles
  },
  dangerButton: {
    // Danger button styles
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  addFirstBookButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstBookButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 