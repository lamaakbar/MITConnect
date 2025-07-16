import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';

const albums = [
  {
    id: '1',
    title: 'Summer 2024',
    photos: [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
      'https://images.unsplash.com/photo-1465101046530-73398c7f28ca',
    ],
  },
  {
    id: '2',
    title: 'Team Building',
    photos: [
      'https://images.unsplash.com/photo-1519125323398-675f0ddb6308',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e',
    ],
  },
];

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
}); 