import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, TextInput, Platform, ScrollView } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';

const initialAlbumsMock = [
  {
    id: '1',
    title: 'Table Tennis',
    date: 'July 2, 2025',
    cover: require('../assets/images/react-logo.png'),
    photos: [require('../assets/images/react-logo.png')],
  },
  {
    id: '2',
    title: 'Family Memories',
    date: 'July 8, 2023',
    cover: require('../assets/images/partial-react-logo.png'),
    photos: [require('../assets/images/partial-react-logo.png')],
  },
  {
    id: '3',
    title: 'In the Sun',
    date: 'July 8, 2024',
    cover: require('../assets/images/splash-icon.png'),
    photos: [require('../assets/images/splash-icon.png')],
  },
  {
    id: '4',
    title: 'Adventure',
    date: 'July 8, 2023',
    cover: require('../assets/images/favicon.png'),
    photos: [require('../assets/images/favicon.png')],
  },
];

export default function GalleryManagement() {
  const [albums, setAlbums] = useState(initialAlbumsMock);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newPhotos, setNewPhotos] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const pickImages = async () => {
    setUploading(true);
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
      selectionLimit: 10,
    });
    setUploading(false);
    if (!result.canceled) {
      setNewPhotos(result.assets);
    }
  };

  const handleCreateAlbum = () => {
    if (!newTitle || !newDate || newPhotos.length === 0) return;
    const newAlbum = {
      id: (albums.length + 1).toString(),
      title: newTitle,
      date: newDate,
      cover: { uri: newPhotos[0].uri },
      photos: newPhotos.map((p) => ({ uri: p.uri })),
    };
    setAlbums([newAlbum, ...albums]);
    setShowCreate(false);
    setNewTitle('');
    setNewDate('');
    setNewPhotos([]);
  };

  const renderAlbum = ({ item }: { item: typeof albums[0] }) => (
    <TouchableOpacity style={styles.albumCard} activeOpacity={0.85}>
      <Image source={item.cover} style={styles.albumCover} resizeMode="cover" />
      <Text style={styles.albumTitle}>{item.title}</Text>
      <Text style={styles.albumDate}>{item.date}</Text>
    </TouchableOpacity>
  );

  if (showCreate) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => setShowCreate(false)}>
              <Ionicons name="arrow-back" size={26} color="#4F8EF7" style={{ marginRight: 8 }} />
            </TouchableOpacity>
            <ThemedText style={styles.title}>New Album</ThemedText>
          </View>
          {/* Upload Cover Photo Box */}
          <TouchableOpacity style={styles.uploadBox} onPress={pickImages} activeOpacity={0.8}>
            <View style={styles.dottedBox}>
              <Ionicons name="add" size={32} color="#4F8EF7" />
              <Text style={styles.uploadText}>Upload Cover Photo & Photos</Text>
            </View>
          </TouchableOpacity>
          {/* Preview Selected Images */}
          {newPhotos.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {newPhotos.map((img, idx) => (
                <Image key={idx} source={{ uri: img.uri }} style={styles.previewImg} />
              ))}
            </ScrollView>
          )}
          {/* Album Info Inputs */}
          <TextInput
            style={styles.input}
            placeholder="Title"
            value={newTitle}
            onChangeText={setNewTitle}
            placeholderTextColor="#aaa"
          />
          <TextInput
            style={styles.input}
            placeholder="Date (yyyy-mm-dd)"
            value={newDate}
            onChangeText={setNewDate}
            placeholderTextColor="#aaa"
          />
          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: newTitle && newDate && newPhotos.length > 0 ? '#4F8EF7' : '#E3E8F0' }]}
            onPress={handleCreateAlbum}
            activeOpacity={0.85}
            disabled={!(newTitle && newDate && newPhotos.length > 0)}
          >
            <Text style={[styles.createBtnText, { color: newTitle && newDate && newPhotos.length > 0 ? '#fff' : '#4F8EF7' }]}>Create</Text>
          </TouchableOpacity>
        </ScrollView>
        {/* Bottom Navigation Bar */}
        <View style={styles.bottomNav}>
          <Ionicons name="home-outline" size={24} color="#4F8EF7" />
          <Ionicons name="star-outline" size={24} color="#888" />
          <Ionicons name="pin-outline" size={24} color="#888" />
          <Ionicons name="bulb-outline" size={24} color="#888" />
          <FontAwesome5 name="tags" size={22} color="#888" />
          <MaterialIcons name="connect-without-contact" size={26} color="#888" />
          <Ionicons name="albums-outline" size={24} color="#4F8EF7" />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>Select Album</ThemedText>
          <Text style={styles.subtitle}>Select an album to upload the photos</Text>
        </View>
        {/* Create New Album Button */}
        <TouchableOpacity style={styles.createBtn} activeOpacity={0.85} onPress={() => setShowCreate(true)}>
          <Ionicons name="add-circle-outline" size={22} color="#4F8EF7" style={{ marginRight: 8 }} />
          <Text style={styles.createBtnText}>Create a New Album</Text>
        </TouchableOpacity>
        {/* Album Grid */}
        <View style={styles.albumGrid}>
          {albums.map((album) => renderAlbum({ item: album }))}
        </View>
      </ScrollView>
      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <Ionicons name="home-outline" size={24} color="#4F8EF7" />
        <Ionicons name="star-outline" size={24} color="#888" />
        <Ionicons name="pin-outline" size={24} color="#888" />
        <Ionicons name="bulb-outline" size={24} color="#888" />
        <FontAwesome5 name="tags" size={22} color="#888" />
        <MaterialIcons name="connect-without-contact" size={26} color="#888" />
        <Ionicons name="albums-outline" size={24} color="#4F8EF7" />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FB',
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  header: {
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 15,
    color: '#4F8EF7',
    marginBottom: 14,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3E8F0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 18,
    alignSelf: 'flex-start',
  },
  createBtnText: {
    color: '#4F8EF7',
    fontWeight: 'bold',
    fontSize: 16,
  },
  albumRow: {
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  albumGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  albumCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    width: '48%',
    marginBottom: 18,
    shadowColor: '#4F8EF7',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  albumCover: {
    width: '100%',
    height: 90,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#E3E8F0',
  },
  albumTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 2,
    textAlign: 'center',
  },
  albumDate: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
  },
  uploadBox: {
    marginBottom: 18,
    alignSelf: 'center',
    width: '100%',
  },
  dottedBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#4F8EF7',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    backgroundColor: '#F6F8FB',
  },
  uploadText: {
    color: '#4F8EF7',
    fontSize: 16,
    marginTop: 8,
    fontWeight: '500',
  },
  previewImg: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#E3E8F0',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E3E8F0',
    color: '#222',
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E3E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    zIndex: 10,
  },
}); 