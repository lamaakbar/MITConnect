
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type Book = {
  id: string;
  title: string;
  author: string;
  genre: string;
  genreColor: string;
  cover: string;
};

const BOOKS: Book[] = [
  {
    id: '1',
    title: 'White Nights',
    author: 'Fyodor Dostoevsky',
    genre: 'Philosophical Fiction',
    genreColor: '#A3C9A8',
    cover: 'https://covers.openlibrary.org/b/id/11153223-L.jpg',
  },
  {
    id: '2',
    title: 'The Richest Man in Babylon',
    author: 'George S. Clason',
    genre: 'Finance',
    genreColor: '#B5D6F6',
    cover: 'https://covers.openlibrary.org/b/id/11153224-L.jpg',
  },
  {
    id: '3',
    title: 'Atomic Habits',
    author: 'James Clear',
    genre: 'Personal Development',
    genreColor: '#F6E7B5',
    cover: 'https://covers.openlibrary.org/b/id/11153225-L.jpg',
  },
];

export default function AdminBooksScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>MITConnect Library</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/add-book')}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>
      <FlatList<Book>
        data={BOOKS}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={(props: { item: Book }) => {
          const item = props.item;
          return (
            <View style={styles.card}>
              <Image source={{ uri: item.cover }} style={styles.cover} />
              <View style={styles.info}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.author}>By {item.author}</Text>
                <View style={[styles.genreChip, { backgroundColor: item.genreColor }]}> 
                  <Text style={styles.genreText}>{item.genre}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.removeBtn}>
                <Text style={styles.removeBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF9',
    paddingHorizontal: 16,
    paddingTop: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cover: {
    width: 56,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: '#eee',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  author: {
    fontSize: 13,
    color: '#888',
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
    color: '#222',
  },
  removeBtn: {
    backgroundColor: '#F2F2F2',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 12,
  },
  removeBtnText: {
    color: '#444',
    fontWeight: 'bold',
    fontSize: 14,
  },
}); 