import React from 'react';
import { View, Text, StyleSheet, FlatList, Image } from 'react-native';

const books = [
  { id: '1', title: 'White Nights', author: 'Fyodor Dostoevsky', cover: 'https://covers.openlibrary.org/b/id/7222246-L.jpg' },
  { id: '2', title: 'Atomic Habits', author: 'James Clear', cover: 'https://covers.openlibrary.org/b/id/10523340-L.jpg' },
];

export default function BookClubScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Book Club Recommendations</Text>
      <FlatList
        data={books}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.bookCard}>
            <Image source={{ uri: item.cover }} style={styles.bookCover} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bookTitle}>{item.title}</Text>
              <Text style={styles.bookAuthor}>By {item.author}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7f9',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  bookCover: {
    width: 60,
    height: 90,
    borderRadius: 8,
    marginRight: 16,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#555',
  },
}); 