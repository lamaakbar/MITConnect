
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useBooks } from '../components/BookContext';
import Toast from 'react-native-root-toast';

export default function AdminBooksScreen() {
  const router = useRouter();
  const { books, removeBook } = useBooks();

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

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.push('/admin-home')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.header}>MITConnect Library</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/add-book')}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={books}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/books-management/${item.id}/details`)}
            activeOpacity={0.8}
          >
            <View style={styles.card}>
              <Image source={{ uri: item.cover }} style={styles.cover} />
              <View style={styles.info}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.author}>By {item.author}</Text>
                <View style={[styles.genreChip, { backgroundColor: item.genreColor }]}> 
                  <Text style={styles.genreText}>{item.genre}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item.id, item.title)}>
                <Text style={styles.removeBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
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
  backBtn: {
    marginRight: 8,
    padding: 4,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    flex: 1,
    textAlign: 'center',
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