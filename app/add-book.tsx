import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, Platform, Alert, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useBooks } from '../components/BookContext';
import { useTheme } from '../components/ThemeContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const { isDarkMode } = useTheme();
  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  const borderColor = isDarkMode ? '#2A2A2A' : '#E0E0E0';
  const searchBackground = isDarkMode ? '#23272b' : '#F2F4F7';
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

  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      <View style={{
        paddingTop: insets.top,
        backgroundColor: cardBackground,
        borderBottomColor: borderColor,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 8 }}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#fff' : '#222'} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            letterSpacing: 0.5,
            color: isDarkMode ? '#fff' : '#222',
          }}>MIT<Text style={{ color: '#3CB371' }}>Connect</Text></Text>
        </View>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView contentContainerStyle={[styles.scrollContainer, { backgroundColor }]} keyboardShouldPersistTaps="handled">
        <Text style={[styles.subHeader, { color: secondaryTextColor }]}>Add a new book to the MITConnect Library</Text>
        {error ? <Text style={[styles.errorText, { color: '#E74C3C' }]}>{error}</Text> : null}
        {/* Book Information Card */}
        <View style={[styles.card, CARD_SHADOW, { backgroundColor: cardBackground, borderColor }]}>  
          <Text style={[styles.sectionTitle, { color: textColor }]}>Book Information</Text>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: textColor }]}>Book Title <Text style={{ color: 'red' }}>*</Text></Text>
            <TextInput
              style={[styles.input, { color: textColor, backgroundColor: searchBackground, borderColor }]}
              placeholder="Enter book title"
              placeholderTextColor={secondaryTextColor}
              value={title}
              onChangeText={setTitle}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: textColor }]}>Author <Text style={{ color: 'red' }}>*</Text></Text>
            <TextInput
              style={[styles.input, { color: textColor, backgroundColor: searchBackground, borderColor }]}
              placeholder="Enter author name"
              placeholderTextColor={secondaryTextColor}
              value={author}
              onChangeText={setAuthor}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: textColor }]}>Genre <Text style={{ color: 'red' }}>*</Text></Text>
            <TouchableOpacity
              style={[styles.input, styles.dropdown, { backgroundColor: searchBackground, borderColor }]}
              onPress={() => setShowGenreList(!showGenreList)}
              activeOpacity={0.7}
            >
              <Text style={{ color: genre ? textColor : secondaryTextColor }}>{genre || 'Select Genre'}</Text>
              <Ionicons name={showGenreList ? 'chevron-up' : 'chevron-down'} size={18} color={secondaryTextColor} style={{ position: 'absolute', right: 16, top: 16 }} />
            </TouchableOpacity>
                        {showGenreList && (
                <View style={[styles.genreList, { backgroundColor: cardBackground, borderColor }]}>
                  {GENRES.map((g) => (
                    <TouchableOpacity
                      key={g.name}
                      style={[styles.genreItem, { borderBottomColor: borderColor }]}
                      onPress={() => {
                        setGenre(g.name);
                        setGenreColor(g.color);
                        setShowGenreList(false);
                      }}
                    >
                      <Text style={{ color: textColor }}>{g.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
          </View>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: textColor }]}>Book Description</Text>
            <TextInput
              style={[styles.input, styles.textArea, { color: textColor, backgroundColor: searchBackground, borderColor }]}
              placeholder="Enter a detailed description about the book..."
              placeholderTextColor={secondaryTextColor}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>
        {/* Book Cover Card */}
        <View style={[styles.card, CARD_SHADOW, { marginTop: 24, backgroundColor: cardBackground, borderColor }]}>  
          <Text style={[styles.sectionTitle, { color: textColor }]}>Book Cover <Text style={{ color: 'red' }}>*</Text></Text>
          <TouchableOpacity style={[styles.uploadArea, { borderColor }]} onPress={pickImage} activeOpacity={0.8}>
            {image ? (
              <Image source={{ uri: image }} style={styles.coverPreview} />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="cloud-upload-outline" size={40} color={secondaryTextColor} />
                <Text style={[styles.uploadText, { color: textColor }]}>Upload book cover</Text>
                <Text style={[styles.uploadSubText, { color: secondaryTextColor }]}>PNG, JPG up to 10MB</Text>
                <TouchableOpacity style={[styles.chooseFileBtn, { backgroundColor: searchBackground }]} onPress={pickImage}>
                  <Text style={[styles.chooseFileText, { color: textColor }]}>Choose File</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        </View>
        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: '#3CB371' }]} onPress={handleAddBook}>
            <Text style={[styles.addBtnText, { color: '#fff' }]}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: searchBackground }]} onPress={() => router.push('/books-management')}>
            <Text style={[styles.cancelBtnText, { color: textColor }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 20,
    flexGrow: 1,
    paddingBottom: 40,
  },

  subHeader: {
    fontSize: 15,
    marginBottom: 20,
    textAlign: 'center',
  },
  errorText: {
    marginBottom: 10,
    textAlign: 'center',
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 8,
    borderWidth: 1,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 12,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  genreList: {
    borderRadius: 10,
    marginTop: 2,
    borderWidth: 1,
    overflow: 'hidden',
  },
  genreItem: {
    padding: 12,
    borderBottomWidth: 1,
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
    borderRadius: 12,
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
    fontSize: 15,
    marginTop: 8,
  },
  uploadSubText: {
    fontSize: 13,
    marginBottom: 8,
  },
  chooseFileBtn: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
  },
  chooseFileText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: 24,
    gap: 12,
  },
  addBtn: {
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    alignItems: 'center',
    flex: 1,
  },
  addBtnText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelBtn: {
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    alignItems: 'center',
    flex: 1,
  },
  cancelBtnText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 