import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useBooks } from '../../../components/BookContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function BookDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { books } = useBooks();
  const book = books.find(b => b.id === id);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';

  if (!book) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <Text style={[styles.errorText, { color: '#E74C3C' }]}>Book not found.</Text>
        <TouchableOpacity onPress={() => router.push('/books-management')} style={[styles.backBtn, { backgroundColor: isDarkMode ? 'rgba(30,30,30,0.8)' : 'rgba(255,255,255,0.8)' }]}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <TouchableOpacity onPress={() => router.push('/books-management')} style={[styles.backBtn, { backgroundColor: isDarkMode ? 'rgba(30,30,30,0.8)' : 'rgba(255,255,255,0.8)' }]}>
        <Ionicons name="arrow-back" size={24} color={textColor} />
      </TouchableOpacity>
      <Image source={{ uri: book.cover }} style={styles.cover} />
      <Text style={[styles.title, { color: textColor }]}>{book.title}</Text>
      <Text style={[styles.author, { color: secondaryTextColor }]}>By {book.author}</Text>
      <View style={[styles.genreChip, { backgroundColor: book.genreColor }]}> 
        <Text style={[styles.genreText, { color: textColor }]}>{book.genre}</Text>
      </View>
      {book.description ? (
        <Text style={[styles.description, { color: textColor }]}>{book.description}</Text>
      ) : null}
      <Text style={[styles.idText, { color: secondaryTextColor }]}>Book ID: {book.id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  backBtn: {
    position: 'absolute',
    top: 48,
    left: 16,
    zIndex: 10,
    borderRadius: 20,
    padding: 4,
  },
  cover: {
    width: 160,
    height: 220,
    borderRadius: 12,
    marginBottom: 20,
    marginTop: 32,
    backgroundColor: '#eee',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  author: {
    fontSize: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  genreChip: {
    alignSelf: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 16,
  },
  genreText: {
    fontSize: 13,
  },
  description: {
    fontSize: 15,
    marginBottom: 18,
    textAlign: 'center',
  },
  idText: {
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    marginTop: 80,
    textAlign: 'center',
  },
}); 
