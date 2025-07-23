import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  TextInput,
  SafeAreaView,
  StatusBar,
  Modal,
  Dimensions,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../components/ThemeContext';
import { useThemeColor } from '../hooks/useThemeColor';
import { useUserContext } from '../components/UserContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Try to import required modules
let MediaLibrary: any = null;
let FileSystem: any = null;
try {
  MediaLibrary = require('expo-media-library');
  FileSystem = require('expo-file-system');
} catch (error) {
  console.log('Required modules not available');
}

const { width: screenWidth } = Dimensions.get('window');

// Mock albums data with actual image URLs for proper saving
const albums = [
  {
    id: '1',
    title: 'MIT Events',
    photoCount: 2,
    coverImage: { uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop' },
    photos: [
      { uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop' },
      { uri: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&h=300&fit=crop' },
    ],
  },
  {
    id: '2',
    title: 'Book Club',
    photoCount: 1,
    coverImage: { uri: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop' },
    photos: [
      { uri: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop' },
    ],
  },
  {
    id: '3',
    title: 'Team Building',
    photoCount: 3,
    coverImage: { uri: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop' },
    photos: [
      { uri: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop' },
      { uri: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop' },
      { uri: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=300&fit=crop' },
    ],
  },
  {
    id: '4',
    title: 'Workshop Sessions',
    photoCount: 4,
    coverImage: { uri: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop' },
    photos: [
      { uri: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop' },
      { uri: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop' },
      { uri: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&h=300&fit=crop' },
      { uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop' },
    ],
  },
];

export default function GalleryScreen() {
  const router = useRouter();
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const { isDarkMode, toggleTheme } = useTheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  const borderColor = isDarkMode ? '#2A2A2A' : '#E5E5EA';
  const iconColor = useThemeColor({}, 'icon');
  const { userRole, getHomeRoute } = useUserContext();
  const insets = useSafeAreaInsets();
  const darkBg = '#181C20';
  const darkCard = '#23272b';
  const darkBorder = '#2D333B';
  const darkText = '#F3F6FA';
  const darkSecondary = '#AEB6C1';
  const darkHighlight = '#43C6AC';

  const album = albums.find(a => a.id === selectedAlbum);
  
  // Filter albums based on search query
  const filteredAlbums = albums.filter(album =>
    album.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBack = () => {
    if (window?.history?.length > 1) {
      router.back();
    } else {
      router.replace(getHomeRoute() as any);
    }
  };

  const handleDownloadPhoto = async (photoSource: any) => {
    try {
      if (!MediaLibrary || !FileSystem) {
        Alert.alert('Not Available', 'Photo saving is not available in this environment.');
        return;
      }

      // Request permissions first
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Photo album access is required to save photos. Please allow access when prompted.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Show loading state (optional - can be removed for cleaner UX)
      // Alert.alert(
      //   'Downloading Photo', 
      //   'Downloading and saving photo to your device...',
      //   [{ text: 'OK' }]
      // );

      // Extract the image URL
      let imageUrl = '';
      if (photoSource && photoSource.uri) {
        imageUrl = photoSource.uri;
      } else if (typeof photoSource === 'string') {
        imageUrl = photoSource;
      }

      // Validate that we have a valid URL
      if (!imageUrl || typeof imageUrl !== 'string') {
        Alert.alert(
          'Invalid Image',
          'This image cannot be downloaded. Please try a different photo.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Download the image to local storage first
      const fileName = `photo_${Date.now()}.jpg`;
      const localUri = FileSystem.documentDirectory + fileName;
      
      const downloadResult = await FileSystem.downloadAsync(imageUrl, localUri);
      
      if (downloadResult.status !== 200) {
        throw new Error('Failed to download image');
      }

      // Save the downloaded image to photo album
      await MediaLibrary.saveToLibraryAsync(downloadResult.uri);

      // Show success message
      Alert.alert(
        'Success!', 
        'Photo has been downloaded and saved to your photo album successfully.',
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to download and save photo. Please try again.');
    }
  };

  const renderAlbumCard = ({ item }: { item: typeof albums[0] }) => (
    <TouchableOpacity 
      style={styles.albumCard} 
      onPress={() => setSelectedAlbum(item.id)}
      activeOpacity={0.8}
    >
      <Image source={item.coverImage} style={styles.albumCoverImage} />
      <View style={styles.albumOverlay}>
        <Text style={styles.albumTitle}>{item.title}</Text>
        <Text style={styles.albumPhotoCount}>{item.photoCount} photo{item.photoCount !== 1 ? 's' : ''}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderPhoto = ({ item }: { item: any }) => (
    <View style={styles.photoContainer}>
      <TouchableOpacity 
        style={styles.photoWrapper}
        onPress={() => setSelectedPhoto(item)}
        activeOpacity={0.9}
      >
        <Image source={item} style={styles.photo} />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.downloadPhotoButton}
        onPress={() => handleDownloadPhoto(item)}
        activeOpacity={0.8}
      >
        <Ionicons name="save-outline" size={16} color="#fff" />
        <Text style={styles.downloadPhotoText}>Save</Text>
      </TouchableOpacity>
    </View>
  );

  // For text and background colors
  const searchBarBackground = isDarkMode ? '#232323' : '#F2F2F7';
  const searchInputColor = isDarkMode ? '#fff' : '#000';
  const headerTitleColor = isDarkMode ? '#fff' : '#000';
  const albumCardBackground = isDarkMode ? '#18191A' : '#000';
  const albumOverlayBackground = isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)';

  // Determine if this is the root tab (no navigation history)
  const isRootTab = !selectedAlbum;

  if (selectedAlbum && album) {
    return (
      <View style={[styles.container, { backgroundColor: (userRole === 'employee' || userRole === 'trainee') && isDarkMode ? darkBg : backgroundColor }]}> 
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        {/* Header */}
        {(userRole === 'employee' || userRole === 'trainee') ? (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 18,
            paddingTop: insets.top + 10,
            paddingBottom: 6,
            backgroundColor: isDarkMode ? darkCard : cardBackground,
            borderBottomWidth: 1,
            borderBottomColor: isDarkMode ? darkBorder : borderColor,
          }}>
            <TouchableOpacity onPress={handleBack} style={{ padding: 4, marginRight: 8 }}>
              <Ionicons name="arrow-back" size={24} color={iconColor} />
            </TouchableOpacity>
            <Text style={{ fontSize: 22, fontWeight: '700', letterSpacing: 0.5, flex: 1, textAlign: 'center', color: isDarkMode ? darkText : textColor }}>
              MIT<Text style={{ color: darkHighlight }}>Connect</Text>
            </Text>
            <View style={{ width: 32 }} />
          </View>
        ) : (
          <View style={[styles.header, { backgroundColor: cardBackground, borderBottomColor: borderColor }]}> 
            <TouchableOpacity onPress={handleBack} style={styles.backButton}> 
              <Ionicons name="chevron-back" size={24} color={iconColor} /> 
            </TouchableOpacity> 
            <Text style={[styles.headerTitle, { color: headerTitleColor }]}>{album.title}</Text> 
            <View style={styles.headerSpacer} /> 
          </View>
        )}

        {/* Photos Grid */}
        <FlatList
          data={album.photos}
          keyExtractor={(item, index) => `photo-${index}`}
          numColumns={2}
          renderItem={renderPhoto}
          contentContainerStyle={styles.photosGrid}
          showsVerticalScrollIndicator={false}
        />

        {/* Photo Modal */}
        <Modal
          visible={!!selectedPhoto}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedPhoto(null)}
        >
          <View style={styles.photoModalOverlay}>
            <View style={styles.photoModalHeader}>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setSelectedPhoto(null)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.downloadButton}
                onPress={() => selectedPhoto && handleDownloadPhoto(selectedPhoto)}
              >
                <Ionicons name="save-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.photoModalContent}
              onPress={() => setSelectedPhoto(null)}
              activeOpacity={1}
            >
              {selectedPhoto && (
                <Image source={selectedPhoto} style={styles.fullScreenPhoto} />
              )}
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: (userRole === 'employee' || userRole === 'trainee') && isDarkMode ? darkBg : backgroundColor }]}> 
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      {/* Header */}
      {(userRole === 'employee' || userRole === 'trainee') ? (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 18,
          paddingTop: insets.top + 10,
          paddingBottom: 6,
          backgroundColor: isDarkMode ? darkCard : cardBackground,
          borderBottomWidth: 1,
          borderBottomColor: isDarkMode ? darkBorder : borderColor,
        }}>
          <TouchableOpacity onPress={handleBack} style={{ padding: 4, marginRight: 8 }}>
            <Ionicons name="arrow-back" size={24} color={iconColor} />
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: '700', letterSpacing: 0.5, flex: 1, textAlign: 'center', color: isDarkMode ? darkText : textColor }}>
            MIT<Text style={{ color: darkHighlight }}>Connect</Text>
          </Text>
          <View style={{ width: 32 }} />
        </View>
      ) : (
        <View style={[styles.header, { backgroundColor: cardBackground, borderBottomColor: borderColor }]}> 
          <TouchableOpacity onPress={handleBack} style={styles.backButton}> 
            <Ionicons name="chevron-back" size={24} color={iconColor} /> 
          </TouchableOpacity> 
          <Text style={[styles.headerTitle, { color: headerTitleColor }]}>Gallery</Text> 
          <View style={styles.headerSpacer} /> 
        </View>
      )}

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: searchBarBackground }]}>
        <Ionicons name="search" size={20} color={secondaryTextColor} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: searchInputColor }]}
          placeholder="Search Albums"
          placeholderTextColor={secondaryTextColor}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Albums Grid */}
      <FlatList
        data={filteredAlbums}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.albumCard, { backgroundColor: albumCardBackground }]}
            onPress={() => setSelectedAlbum(item.id)}
            activeOpacity={0.8}
          >
            <Image source={item.coverImage} style={styles.albumCoverImage} />
            <View style={[styles.albumOverlay, { backgroundColor: albumOverlayBackground }]}>
              <Text style={styles.albumTitle}>{item.title}</Text>
              <Text style={styles.albumPhotoCount}>{item.photoCount} photo{item.photoCount !== 1 ? 's' : ''}</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.albumsGrid}
        showsVerticalScrollIndicator={false}
        numColumns={2}
        columnWrapperStyle={styles.albumRow}
      />

      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    height: 36,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: '#000',
  },
  albumsGrid: {
    padding: 16,
  },
  albumRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  albumCard: {
    width: (Dimensions.get('window').width - 48) / 2,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  albumCoverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  albumOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  albumTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  albumPhotoCount: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  photosGrid: {
    padding: 8,
  },
  photoContainer: {
    flex: 1,
    margin: 4,
    position: 'relative',
  },
  photoWrapper: {
    flex: 1,
  },
  downloadPhotoButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  downloadPhotoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  photo: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  photoModalOverlay: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenPhoto: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').width,
    resizeMode: 'contain',
  },
  headerSpacer: {
    width: 32,
  },
  photoModalHeader: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
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