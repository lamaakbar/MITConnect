import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const GENRES = ['Fiction', 'Business', 'Tech'];

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
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGenreList, setShowGenreList] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
        setError('Image must be less than 10MB');
        return;
      }
      if (asset.uri && !asset.uri.match(/\.(jpg|jpeg|png)$/i)) {
        setError('Only PNG or JPG images are allowed');
        return;
      }
      setImage(asset.uri);
      setError('');
    }
  };

  const validate = () => {
    if (!title.trim() || !author.trim() || !genre.trim()) {
      setError('Please fill all required fields.');
      return false;
    }
    setError('');
    return true;
  };

  const handleAdd = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // Prepare form data
      const formData = new FormData();
      formData.append('title', title);
      formData.append('author', author);
      formData.append('genre', genre);
      formData.append('description', description);
      if (image) {
        const filename = image.split('/').pop() || 'cover.jpg';
        const match = /\.([a-zA-Z0-9]+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        formData.append('cover', {
          uri: image,
          name: filename,
          type,
        } as any);
      }
      // TODO: Replace with your backend endpoint
      const response = await fetch('https://your-backend-url.com/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to add book');
      Alert.alert('Book added successfully');
      navigation.goBack();
    } catch (e: any) {
      setError(e.message || 'Failed to add book');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <Text style={styles.header}>Add New Book</Text>
      <Text style={styles.subHeader}>Add a new book to the MITConnect Library</Text>

      {/* Book Information Card */}
      <View style={[styles.card, CARD_SHADOW]}>  
        <Text style={styles.sectionTitle}>Book Information</Text>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Book Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter book title"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#bdbdbd"
          />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Author</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter author name"
            value={author}
            onChangeText={setAuthor}
            placeholderTextColor="#bdbdbd"
          />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Genre</Text>
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
                  key={g}
                  style={styles.genreItem}
                  onPress={() => {
                    setGenre(g);
                    setShowGenreList(false);
                  }}
                >
                  <Text style={{ color: '#222' }}>{g}</Text>
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
        <Text style={styles.sectionTitle}>Book Cover</Text>
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

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.addButton]}
          onPress={handleAdd}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.addBtnText}>+ Add</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 0,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 32,
    marginBottom: 4,
    marginLeft: 24,
    color: '#111',
  },
  subHeader: {
    fontSize: 15,
    color: '#444',
    marginBottom: 24,
    marginLeft: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 16,
    padding: 20,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 18,
    color: '#111',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#222',
  },
  input: {
    backgroundColor: '#f7f7f7',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#222',
    borderWidth: 0,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    paddingRight: 32,
  },
  genreList: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    marginTop: 2,
    marginBottom: 8,
    elevation: 2,
    zIndex: 10,
  },
  genreItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  uploadArea: {
    minHeight: 170,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 4,
    overflow: 'hidden',
  },
  uploadPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 170,
  },
  uploadText: {
    color: '#888',
    fontSize: 15,
    marginTop: 10,
    marginBottom: 2,
  },
  uploadSubText: {
    color: '#bbb',
    fontSize: 13,
    marginBottom: 10,
  },
  chooseFileBtn: {
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d1d1',
    paddingHorizontal: 18,
    paddingVertical: 7,
    marginTop: 4,
  },
  chooseFileText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 14,
  },
  coverPreview: {
    width: 120,
    height: 160,
    borderRadius: 8,
    resizeMode: 'cover',
    alignSelf: 'center',
  },
  error: {
    color: '#d32f2f',
    marginTop: 18,
    marginBottom: 0,
    textAlign: 'center',
    fontSize: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 36,
    marginHorizontal: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  addButton: {
    backgroundColor: '#2ecc40',
  },
  cancelButton: {
    backgroundColor: '#f2f2f2',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  cancelBtnText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 17,
  },
}); 