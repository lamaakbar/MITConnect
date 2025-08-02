import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, Platform, Alert, StatusBar, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useBooks } from '../components/BookContext';
import { useTheme } from '../components/ThemeContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { uploadImageFromLibrary, uploadImageFromLibraryFallback } from '../services/imageUploadService';
import { uploadPDFFromLibrary, uploadPDFFromLibraryFallback, uploadPDFToImagesBucket, getPDFPublicUrl } from '../services/pdfUploadService';
import { BOOK_GENRES } from '../constants/Genres';

const { width: screenWidth } = Dimensions.get('window');

const GENRES = BOOK_GENRES;

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
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [showGenreList, setShowGenreList] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('library');
  const [isUploadingPDF, setIsUploadingPDF] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const pickImage = async () => {
    if (isUploadingImage || isUploadingPDF) {
      setError('Please wait for the current upload to complete.');
      return;
    }

    try {
      setIsUploadingImage(true);
      console.log('🚀 Starting image upload...');
      
      // Try primary upload method first
      let imageUrl = await uploadImageFromLibrary('images', 'book-covers');
      
      // If primary method fails, try fallback
      if (!imageUrl) {
        console.log('⚠️ Primary upload failed, trying fallback...');
        imageUrl = await uploadImageFromLibraryFallback('images', 'book-covers');
      }
      
      if (imageUrl) {
        console.log('✅ Book image uploaded:', imageUrl);
        setImage(imageUrl);
        setError('');
      } else {
        setError('Failed to upload image. Please check your internet connection and try again.');
      }
    } catch (error) {
      console.error('❌ Image upload error:', error);
      setError('Failed to upload image. Please check your internet connection and try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const pickPDF = async () => {
    if (isUploadingPDF || isUploadingImage) {
      setError('Please wait for the current upload to complete.');
      return;
    }

    try {
      setIsUploadingPDF(true);
      console.log('🚀 Starting PDF upload...');
      
      // Try using images bucket directly (which should already work)
      let uploadedPdfPath = await uploadPDFToImagesBucket('pdfs');
      
      // If that fails, try the original method
      if (!uploadedPdfPath) {
        console.log('⚠️ Images bucket upload failed, trying book-pdfs...');
        uploadedPdfPath = await uploadPDFFromLibrary('book-pdfs', 'pdfs');
      }
      
      // If that also fails, try fallback
      if (!uploadedPdfPath) {
        console.log('⚠️ Primary PDF upload failed, trying fallback...');
        uploadedPdfPath = await uploadPDFFromLibraryFallback('book-pdfs', 'pdfs');
      }
      
      if (uploadedPdfPath) {
        console.log('✅ PDF uploaded:', uploadedPdfPath);
        setPdfPath(uploadedPdfPath);
        // Extract filename from path for display
        const fileName = uploadedPdfPath.split('/').pop() || 'PDF file';
        setPdfFileName(fileName);
        setError('');
      } else {
        setError('Failed to upload PDF. Please check your internet connection and try again.');
      }
    } catch (error) {
      console.error('❌ PDF upload error:', error);
      setError('Failed to upload PDF. Please check your internet connection and try again.');
    } finally {
      setIsUploadingPDF(false);
    }
  };

  const handleAddBook = async () => {
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
      category,
      pdf_path: pdfPath,
    };
    try {
      await addBook({ ...newBook, pdf_path: pdfPath ?? undefined });
      setTitle('');
      setAuthor('');
      setGenre('');
      setGenreColor('');
      setDescription('');
      setImage(null);
      setPdfPath(null);
      setPdfFileName(null);
      setError('');
      setCategory('library');
      router.push('/book-added');
    } catch (err) {
      setError('Failed to add book. Please try again.');
    }
  };

  const insets = useSafeAreaInsets();
  
  return (
    <View style={{ flex: 1, backgroundColor }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      
      {/* Header */}
            <View style={[styles.header, { 
        paddingTop: insets.top, 
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: cardBackground, 
        borderBottomColor: borderColor 
      }]}>  
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            letterSpacing: 0.5,
            color: textColor,
            textAlign: 'center',
          }}>Add Book</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>
      
      <ScrollView 
        contentContainerStyle={[styles.scrollContainer, { backgroundColor }]} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.subHeader, { color: secondaryTextColor }]}>
          Add a new book to the MITConnect Library
        </Text>
        
        {error ? (
          <View style={[styles.errorContainer, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FEE' }]}>
            <Ionicons name="alert-circle" size={20} color="#E74C3C" />
            <Text style={[styles.errorText, { color: '#E74C3C' }]}>{error}</Text>
          </View>
        ) : null}

        {/* Book Information Card */}
        <View style={[styles.card, CARD_SHADOW, { backgroundColor: cardBackground, borderColor }]}>  
          <Text style={[styles.sectionTitle, { color: textColor }]}>Book Information</Text>
          
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: textColor }]}>
              Book Title <Text style={{ color: '#E74C3C' }}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { color: textColor, backgroundColor: searchBackground, borderColor }]}
              placeholder="Enter book title"
              placeholderTextColor={secondaryTextColor}
              value={title}
              onChangeText={setTitle}
            />
          </View>
          
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: textColor }]}>
              Author <Text style={{ color: '#E74C3C' }}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { color: textColor, backgroundColor: searchBackground, borderColor }]}
              placeholder="Enter author name"
              placeholderTextColor={secondaryTextColor}
              value={author}
              onChangeText={setAuthor}
            />
          </View>
          
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: textColor }]}>
              Genre <Text style={{ color: '#E74C3C' }}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.input, styles.dropdown, { backgroundColor: searchBackground, borderColor }]}
              onPress={() => setShowGenreList(!showGenreList)}
              activeOpacity={0.7}
            >
              <Text style={{ color: genre ? textColor : secondaryTextColor }}>
                {genre || 'Select Genre'}
              </Text>
              <Ionicons 
                name={showGenreList ? 'chevron-up' : 'chevron-down'} 
                size={18} 
                color={secondaryTextColor} 
                style={styles.dropdownIcon} 
              />
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

        {/* Book Category Card */}
        <View style={[styles.card, CARD_SHADOW, { marginTop: 16, backgroundColor: cardBackground, borderColor }]}>  
          <Text style={[styles.sectionTitle, { color: textColor }]}>Book Category</Text>
          <View style={styles.categoryContainer}>
            <TouchableOpacity
              style={[
                styles.categoryOption,
                { 
                  backgroundColor: category === 'library' ? '#3CB371' : searchBackground,
                  borderColor: category === 'library' ? '#3CB371' : borderColor
                }
              ]}
              onPress={() => setCategory('library')}
            >
              <Ionicons 
                name="library-outline" 
                size={20} 
                color={category === 'library' ? '#fff' : secondaryTextColor} 
              />
              <Text style={[
                styles.categoryText,
                { color: category === 'library' ? '#fff' : textColor }
              ]}>Library Book</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.categoryOption,
                { 
                  backgroundColor: category === 'book_of_the_month' ? '#3CB371' : searchBackground,
                  borderColor: category === 'book_of_the_month' ? '#3CB371' : borderColor
                }
              ]}
              onPress={() => setCategory('book_of_the_month')}
            >
              <Ionicons 
                name="star-outline" 
                size={20} 
                color={category === 'book_of_the_month' ? '#fff' : secondaryTextColor} 
              />
              <Text style={[
                styles.categoryText,
                { color: category === 'book_of_the_month' ? '#fff' : textColor }
              ]}>Book of the Month</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Book Cover Card */}
        <View style={[styles.card, CARD_SHADOW, { marginTop: 16, backgroundColor: cardBackground, borderColor }]}>  
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Book Cover <Text style={{ color: '#E74C3C' }}>*</Text>
          </Text>
          <TouchableOpacity 
            style={[styles.uploadArea, { borderColor }]} 
            onPress={pickImage} 
            activeOpacity={0.8}
          >
            {image ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: image }} style={styles.coverPreview} />
                <TouchableOpacity 
                  style={[styles.changeImageButton, isUploadingImage && styles.disabledButton]}
                  onPress={pickImage}
                  disabled={isUploadingImage}
                >
                  <Text style={styles.changeImageText}>
                    {isUploadingImage ? 'Uploading...' : 'Change Image'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="cloud-upload-outline" size={48} color={secondaryTextColor} />
                <Text style={[styles.uploadText, { color: textColor }]}>Upload book cover</Text>
                <Text style={[styles.uploadSubText, { color: secondaryTextColor }]}>
                  PNG, JPG up to 10MB
                </Text>
                <TouchableOpacity 
                  style={[styles.chooseFileBtn, { backgroundColor: searchBackground }, isUploadingImage && styles.disabledButton]} 
                  onPress={pickImage}
                  disabled={isUploadingImage}
                >
                  <Text style={[styles.chooseFileText, { color: textColor }]}>
                    {isUploadingImage ? 'Uploading...' : 'Choose File'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* PDF Upload Card */}
        <View style={[styles.card, CARD_SHADOW, { marginTop: 16, backgroundColor: cardBackground, borderColor }]}>  
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Book PDF (Optional)
          </Text>
          <TouchableOpacity 
            style={[styles.uploadArea, { borderColor }]} 
            onPress={pickPDF} 
            activeOpacity={0.8}
          >
            {pdfPath ? (
              <View style={styles.pdfPreviewContainer}>
                <Ionicons name="document-text" size={48} color="#3CB371" />
                <Text style={[styles.pdfFileName, { color: textColor }]}>{pdfFileName}</Text>
                <Text style={[styles.pdfPath, { color: secondaryTextColor }]}>
                  {pdfPath}
                </Text>
                <TouchableOpacity 
                  style={[styles.changePDFButton, isUploadingPDF && styles.disabledButton]}
                  onPress={pickPDF}
                  disabled={isUploadingPDF}
                >
                  <Text style={styles.changePDFText}>
                    {isUploadingPDF ? 'Uploading...' : 'Replace PDF'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="document-text-outline" size={48} color={secondaryTextColor} />
                <Text style={[styles.uploadText, { color: textColor }]}>Upload book PDF</Text>
                <Text style={[styles.uploadSubText, { color: secondaryTextColor }]}>
                  PDF files up to 50MB
                </Text>
                <TouchableOpacity 
                  style={[styles.chooseFileBtn, { backgroundColor: searchBackground }, isUploadingPDF && styles.disabledButton]} 
                  onPress={pickPDF}
                  disabled={isUploadingPDF}
                >
                  <Text style={[styles.chooseFileText, { color: textColor }]}>
                    {isUploadingPDF ? 'Uploading...' : 'Choose PDF'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.cancelBtn, { backgroundColor: searchBackground }]} 
            onPress={() => router.push('/books-management')}
          >
            <Text style={[styles.cancelBtnText, { color: textColor }]}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.addBtn, { backgroundColor: '#3CB371' }]} 
            onPress={handleAddBook}
          >
            <Text style={[styles.addBtnText, { color: '#fff' }]}>Add Book</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  scrollContainer: {
    padding: 20,
    flexGrow: 1,
    paddingBottom: 40,
  },
  subHeader: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  dropdownIcon: {
    position: 'absolute',
    right: 16,
  },
  genreList: {
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    overflow: 'hidden',
  },
  genreItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  categoryOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  categoryText: {
    fontWeight: '600',
    fontSize: 14,
  },
  uploadArea: {
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 24,
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  imagePreviewContainer: {
    alignItems: 'center',
  },
  coverPreview: {
    width: 140,
    height: 180,
    borderRadius: 12,
    resizeMode: 'cover',
    marginBottom: 16,
  },
  changeImageButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
  },
  changeImageText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  pdfPreviewContainer: {
    alignItems: 'center',
  },
  pdfFileName: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  pdfPath: {
    fontSize: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  changePDFButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
  },
  changePDFText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.6,
  },
  uploadText: {
    fontSize: 18,
    marginTop: 12,
    fontWeight: '600',
  },
  uploadSubText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  chooseFileBtn: {
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  chooseFileText: {
    fontWeight: '600',
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: 24,
    gap: 16,
  },
  addBtn: {
    flex: 2,
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addBtnText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontWeight: '600',
    fontSize: 16,
  },
}); 