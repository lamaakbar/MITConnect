import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useBooks } from '../../../components/BookContext';

export default function BookDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { books } = useBooks();
  const book = books.find(b => b.id === id);

  if (!book) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Book not found.</Text>
        <TouchableOpacity onPress={() => router.push('/books-management')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.push('/books-management')} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color="#222" />
      </TouchableOpacity>
      <Image source={{ uri: book.cover }} style={styles.cover} />
      <Text style={styles.title}>{book.title}</Text>
      <Text style={styles.author}>By {book.author}</Text>
      <View style={[styles.genreChip, { backgroundColor: book.genreColor }]}> 
        <Text style={styles.genreText}>{book.genre}</Text>
      </View>
      {book.description ? (
        <Text style={styles.description}>{book.description}</Text>
      ) : null}
      <Text style={styles.idText}>Book ID: {book.id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF9',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  backBtn: {
    position: 'absolute',
    top: 48,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
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
    color: '#222',
    marginBottom: 6,
    textAlign: 'center',
  },
  author: {
    fontSize: 15,
    color: '#888',
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
    color: '#222',
  },
  description: {
    fontSize: 15,
    color: '#444',
    marginBottom: 18,
    textAlign: 'center',
  },
  idText: {
    fontSize: 12,
    color: '#bbb',
    marginTop: 12,
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginTop: 80,
    textAlign: 'center',
  },
}); 