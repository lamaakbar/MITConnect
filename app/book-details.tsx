import React from 'react';
import { View, Text, StyleSheet, Image, SafeAreaView } from 'react-native';

export default function BookDetails() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Image source={{ uri: 'https://covers.openlibrary.org/b/id/7222246-L.jpg' }} style={styles.cover} />
        <Text style={styles.title}>White Nights</Text>
        <Text style={styles.author}>By Fyodor Dostoevsky</Text>
        <Text style={styles.desc}>
          "White Nights" is a short story by Fyodor Dostoevsky, first published in 1848. It is told in the first person by a nameless narrator who lives in Saint Petersburg and suffers from loneliness. The story explores themes of love, dreams, and heartbreak.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f6f7f9',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  cover: {
    width: 120,
    height: 180,
    borderRadius: 12,
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
    textAlign: 'center',
  },
  author: {
    fontSize: 18,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  desc: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
  },
}); 