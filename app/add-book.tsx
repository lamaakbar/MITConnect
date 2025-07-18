import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useBooks } from '../components/BookContext';

const GENRES = [
  { name: 'Philosophical Fiction', color: '#A3C9A8' },
  { name: 'Finance', color: '#B5D6F6' },
  { name: 'Personal Development', color: '#F6E7B5' },
];

const CARD_SHADOW = Platform.OS === 'ios'
  ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    }
  : {
      elevation: 3,
    };

export default function AddBookScreen() {
  const router = useRouter();
  const { addBook } = useBooks();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('');
  const [genreColor, setGenreColor] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [showGenreList, setShowGenreList] = useState(false);
  const [error, setError] = useState('');

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (!asset.uri) return;
      // Validate file type
      if (!asset.uri.match(/\.(jpg|jpeg|png)$/i)) {
        setError('Only PNG or JPG images are allowed.');
        return;
      }
      // Validate file size (max 10MB)
      if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB.');
        return;
      }
      setImage(asset.uri);
      setError('');
    }
  };

  const handleAddBook = () => {
    if (!title.trim() || !author.trim() || !genre.trim() || !image) {
      setError('Please fill in all required fields.');
      return;
    }
    const newBook = {
      id: Date.now().toString(),
      title,
      author,
      genre,
      genreColor: genreColor || '#eee',
      cover: image,
      description,
    };
    addBook(newBook);
    setTitle('');
    setAuthor('');
    setGenre('');
    setGenreColor('');
    setDescription('');
    setImage(null);
    setError('');
    router.push('/book-added');
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.push('/books-management')} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.header}>Add New Book</Text>
      </View>
      <Text style={styles.subHeader}>Add a new book to the MITConnect Library</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {/* Book Information Card */}
      <View style={[styles.card, CARD_SHADOW]}>  
        <Text style={styles.sectionTitle}>Book Information</Text>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Book Title <Text style={{ color: 'red' }}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Enter book title"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#bdbdbd"
          />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Author <Text style={{ color: 'red' }}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Enter author name"
            value={author}
            onChangeText={setAuthor}
            placeholderTextColor="#bdbdbd"
          />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Genre <Text style={{ color: 'red' }}>*</Text></Text>
          <TouchableOpacity
            style={[styles.input, styles.dropdown]}
            onPress={() => setShowGenreList(!showGenreList)}
            activeOpacity={0.7}
          >
            <Text style={{ color: genre ? '#222' : '#bdbdbd' }}>{genre || 'Select Genre'}</Text>
            <Ionicons name={showGenreList ? 'chevron-up' : 'chevron-down'} size={18} color="#bdbdbd" style={{ position: 'absolute', right: 16, top: 16 }} />
          </TouchableOpacity>
          {showGenreList && (
            <View style={styles.genreList}>
              {GENRES.map((g) => (
                <TouchableOpacity
                  key={g.name}
                  style={styles.genreItem}
                  onPress={() => {
                    setGenre(g.name);
                    setGenreColor(g.color);
                    setShowGenreList(false);
                  }}
                >
                  <Text style={{ color: '#222' }}>{g.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Book Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter a detailed description about the book..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholderTextColor="#bdbdbd"
          />
        </View>
      </View>
      {/* Book Cover Card */}
      <View style={[styles.card, CARD_SHADOW, { marginTop: 24 }]}>  
        <Text style={styles.sectionTitle}>Book Cover <Text style={{ color: 'red' }}>*</Text></Text>
        <TouchableOpacity style={styles.uploadArea} onPress={pickImage} activeOpacity={0.8}>
          {image ? (
            <Image source={{ uri: image }} style={styles.coverPreview} />
          ) : (
            <View style={styles.uploadPlaceholder}>
              <Ionicons name="cloud-upload-outline" size={40} color="#bdbdbd" />
              <Text style={styles.uploadText}>Upload book cover</Text>
              <Text style={styles.uploadSubText}>PNG, JPG up to 10MB</Text>
              <TouchableOpacity style={styles.chooseFileBtn} onPress={pickImage}>
                <Text style={styles.chooseFileText}>Choose File</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </View>
      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.addBtn} onPress={handleAddBook}>
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.push('/books-management')}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 20,
    backgroundColor: '#F8FAF9',
    flexGrow: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
  subHeader: {
    fontSize: 15,
    color: '#888',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 12,
    color: '#222',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#222',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#222',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  genreList: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
  },
  genreItem: {
    padding: 12,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  uploadArea: {
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  coverPreview: {
    width: 120,
    height: 160,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  uploadText: {
    color: '#888',
    fontSize: 15,
    marginTop: 8,
  },
  uploadSubText: {
    color: '#bdbdbd',
    fontSize: 13,
    marginBottom: 8,
  },
  chooseFileBtn: {
    backgroundColor: '#F2F2F2',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
  },
  chooseFileText: {
    color: '#444',
    fontWeight: 'bold',
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: 24,
  },
  addBtn: {
    backgroundColor: '#3AC569',
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelBtn: {
    backgroundColor: '#F2F2F2',
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
  cancelBtnText: {
    color: '#444',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 