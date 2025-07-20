import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Empty albums array - no mock data
const albums: any[] = [];

export default function GalleryScreen() {
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);

  const album = albums.find(a => a.id === selectedAlbum);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gallery</Text>
      {selectedAlbum && album ? (
        <View>
          <TouchableOpacity onPress={() => setSelectedAlbum(null)}>
            <Text style={styles.backBtn}>{'< Back to Albums'}</Text>
          </TouchableOpacity>
          <Text style={styles.albumTitle}>{album.title}</Text>
          <FlatList
            data={album.photos}
            keyExtractor={(item, idx) => item + idx}
            numColumns={2}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.photo} />
            )}
          />
        </View>
      ) : (
        <>
          {albums.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="images-outline" size={64} color="#ccc" />
              <Text style={styles.emptyStateTitle}>No Albums Available</Text>
              <Text style={styles.emptyStateText}>
                There are no photo albums in the gallery yet. Check back later for exciting memories!
              </Text>
            </View>
          ) : (
            <FlatList
              data={albums}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.albumCard} onPress={() => setSelectedAlbum(item.id)}>
                  <Text style={styles.albumTitle}>{item.title}</Text>
                  <View style={styles.albumPreviewRow}>
                    {item.photos.slice(0, 2).map((photo, idx) => (
                      <Image key={idx} source={{ uri: photo }} style={styles.albumPreview} />
                    ))}
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </>
      )}
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
  albumCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  albumTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  albumPreviewRow: {
    flexDirection: 'row',
  },
  albumPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
  },
  backBtn: {
    color: '#43C6AC',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  photo: {
    width: 150,
    height: 150,
    borderRadius: 12,
    margin: 8,
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
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
}); 