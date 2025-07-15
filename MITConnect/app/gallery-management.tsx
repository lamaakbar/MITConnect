import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

// Album and Photo Types
interface Photo {
  uri: string;
}
interface Album {
  id: string;
  title: string;
  photos: Photo[];
}

const initialAlbums: Album[] = [
  {
    id: '1',
    title: 'MIT Events',
    photos: [
      { uri: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80' },
      { uri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80' },
    ],
  },
  {
    id: '2',
    title: 'Book Club',
    photos: [
      { uri: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80' },
    ],
  },
];

export default function GalleryManagement() {
  const [albums, setAlbums] = useState<Album[]>(initialAlbums);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPhotos, setNewPhotos] = useState<Photo[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

  // Pick images for new album
  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
      selectionLimit: 10,
    });
    if (!result.canceled) {
      setNewPhotos(result.assets.map((a) => ({ uri: a.uri })));
    }
  };

  // Create a new album
  const handleCreateAlbum = () => {
    if (!newTitle.trim() || newPhotos.length === 0) return;
    const newAlbum: Album = {
      id: (albums.length + 1).toString(),
      title: newTitle.trim(),
      photos: newPhotos,
    };
    setAlbums([newAlbum, ...albums]);
    setShowCreate(false);
    setNewTitle('');
    setNewPhotos([]);
  };

  // Delete an album
  const handleDeleteAlbum = (albumId: string) => {
    Alert.alert('Delete Album', 'Are you sure you want to delete this album?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setAlbums(albums.filter((a) => a.id !== albumId)),
      },
    ]);
  };

  // Delete a photo from an album
  const handleDeletePhoto = (album: Album, photoIdx: number) => {
    const updatedPhotos = album.photos.filter((_, idx) => idx !== photoIdx);
    setAlbums(albums.map((a) => (a.id === album.id ? { ...a, photos: updatedPhotos } : a)));
    setSelectedAlbum({ ...album, photos: updatedPhotos });
  };

  // Album List View
  if (!showCreate && !selectedAlbum) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>Gallery</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowCreate(true)}
            accessibilityLabel="Create new album"
          >
            <Ionicons name="add-circle" size={30} color="#007AFF" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={albums}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.albumList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.albumCard}
              onPress={() => setSelectedAlbum(item)}
              activeOpacity={0.8}
            >
              <View style={styles.albumThumbRow}>
                {item.photos.slice(0, 3).map((photo, idx) => (
                  <Image
                    key={idx}
                    source={{ uri: photo.uri }}
                    style={styles.albumThumb}
                  />
                ))}
                {item.photos.length === 0 && (
                  <View style={[styles.albumThumb, styles.albumThumbPlaceholder]} />
                )}
              </View>
              <View style={styles.albumInfoRow}>
                <Text style={styles.albumTitle}>{item.title}</Text>
                <TouchableOpacity
                  onPress={() => handleDeleteAlbum(item.id)}
                  style={styles.deleteBtn}
                  accessibilityLabel="Delete album"
                >
                  <Ionicons name="trash" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No albums yet.</Text>}
        />
      </SafeAreaView>
    );
  }

  // Create Album View
  if (showCreate) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => setShowCreate(false)}>
            <Ionicons name="chevron-back" size={28} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Album</Text>
          <View style={{ width: 30 }} />
        </View>
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Album Title"
            value={newTitle}
            onChangeText={setNewTitle}
            placeholderTextColor="#aaa"
            autoFocus
          />
          <TouchableOpacity style={styles.uploadBox} onPress={pickImages} activeOpacity={0.8}>
            <Ionicons name="images" size={32} color="#007AFF" />
            <Text style={styles.uploadText}>Select Photos</Text>
          </TouchableOpacity>
          <View style={styles.previewRow}>
            {newPhotos.map((img, idx) => (
              <Image key={idx} source={{ uri: img.uri }} style={styles.previewImg} />
            ))}
          </View>
          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: newTitle && newPhotos.length > 0 ? '#007AFF' : '#E5E5EA' }]}
            onPress={handleCreateAlbum}
            activeOpacity={0.85}
            disabled={!(newTitle && newPhotos.length > 0)}
          >
            <Text style={[styles.createBtnText, { color: newTitle && newPhotos.length > 0 ? '#fff' : '#007AFF' }]}>Create Album</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Album Detail View
  if (selectedAlbum) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => setSelectedAlbum(null)}>
            <Ionicons name="chevron-back" size={28} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedAlbum.title}</Text>
          <View style={{ width: 30 }} />
        </View>
        <FlatList
          data={selectedAlbum.photos}
          keyExtractor={(_, idx) => idx.toString()}
          numColumns={3}
          contentContainerStyle={styles.photoGrid}
          renderItem={({ item, index }) => (
            <View style={styles.photoCell}>
              <Image source={{ uri: item.uri }} style={styles.photoImg} />
              <TouchableOpacity
                style={styles.photoDeleteBtn}
                onPress={() => handleDeletePhoto(selectedAlbum, index)}
                accessibilityLabel="Delete photo"
              >
                <Ionicons name="close-circle" size={22} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No photos in this album.</Text>}
        />
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Platform.OS === 'ios' ? '#F9F9F9' : '#F6F8FB',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 8 : 18,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#222',
    textAlign: 'center',
    flex: 1,
  },
  addBtn: {
    marginLeft: 8,
  },
  albumList: {
    padding: 18,
    paddingTop: 0,
  },
  albumCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  albumThumbRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  albumThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    marginRight: 8,
    backgroundColor: '#E5E5EA',
  },
  albumThumbPlaceholder: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  albumInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  albumTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#222',
  },
  deleteBtn: {
    marginLeft: 10,
    padding: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#aaa',
    marginTop: 40,
    fontSize: 16,
  },
  formContainer: {
    padding: 24,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 18,
    color: '#222',
  },
  uploadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },
  uploadText: {
    marginLeft: 10,
    color: '#007AFF',
    fontWeight: '500',
    fontSize: 16,
  },
  previewRow: {
    flexDirection: 'row',
    marginBottom: 18,
    flexWrap: 'wrap',
  },
  previewImg: {
    width: 54,
    height: 54,
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#E5E5EA',
  },
  createBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  createBtnText: {
    fontWeight: '600',
    fontSize: 17,
  },
  photoGrid: {
    padding: 18,
    paddingTop: 0,
  },
  photoCell: {
    width: '32%',
    aspectRatio: 1,
    margin: '1%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F2F2F7',
    position: 'relative',
  },
  photoImg: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  photoDeleteBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 11,
  },
}); 