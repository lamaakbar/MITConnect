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
import { supabase } from '../services/supabase';

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

  const [albums, setAlbums] = useState<any[]>([]);
  const [albumPhotos, setAlbumPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [photosLoading, setPhotosLoading] = useState(false);

  const fetchAlbums = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching albums...');
      
      const { data, error } = await supabase
        .from('gallery_albums')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching albums:', error.message);
        return;
      }
      
      console.log('📚 Raw albums data:', data);
      
      // Get photo counts for each album
      const albumsWithCounts = await Promise.all(
        (data ?? []).map(async (a: any) => {
          const { data: photoData, error: countError } = await supabase
            .from('gallery_photos')
            .select('id')
            .eq('album_id', a.id);
          
          const count = photoData ? photoData.length : 0;
          
          return {
            id: a.id,
            title: a.name,
            photoCount: count || 0,
            coverImage: { uri: a.cover_image },
            photos: [], // Will be populated when album is opened
          };
        })
      );
      
      console.log('✅ Albums with counts:', albumsWithCounts);
      setAlbums(albumsWithCounts);
    } catch (error) {
      console.error('❌ Error in fetchAlbums:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotosForAlbum = async (albumId: string) => {
    try {
      console.log('🔍 Fetching photos for album:', albumId);
      
      const { data, error } = await supabase
        .from('gallery_photos')
        .select('*')
        .eq('album_id', albumId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error fetching photos:', error.message);
        return [];
      }

      console.log('📸 Raw photos data:', data);

      const mappedPhotos = (data ?? []).map((photo: any) => ({ 
        id: photo.id,
        uri: photo.image_url,
        image_url: photo.image_url 
      }));

      console.log('✅ Mapped photos:', mappedPhotos);
      return mappedPhotos;
    } catch (error) {
      console.error('❌ Error in fetchPhotosForAlbum:', error);
      return [];
    }
  };

  // Delete photo from database and storage (for admin users)
  const deletePhotoFromDatabase = async (photoId: string, imageUrl: string) => {
    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('gallery_photos')
        .delete()
        .eq('id', photoId);

      if (dbError) {
        console.error('Error deleting photo from database:', dbError);
        throw dbError;
      }

      // Delete from storage (extract filename from URL)
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      if (fileName) {
        const { error: storageError } = await supabase.storage
          .from('images')
          .remove([fileName]);

        if (storageError) {
          console.error('Error deleting photo from storage:', storageError);
          // Don't throw error for storage deletion as database deletion succeeded
        }
      }

      console.log('Photo deleted successfully:', photoId);
      return true;
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  };

  // Update album selection to fetch photos
  const handleAlbumSelect = async (albumId: string) => {
    try {
      setSelectedAlbum(albumId);
      setPhotosLoading(true);
      
      console.log('🎯 Selecting album:', albumId);
      const photos = await fetchPhotosForAlbum(albumId);
      setAlbumPhotos(photos);
      
      console.log('📸 Photos loaded:', photos.length);
      
      // Update album with photo count
      setAlbums(prevAlbums => 
        prevAlbums.map(album => 
          album.id === albumId 
            ? { ...album, photos, photoCount: photos.length }
            : album
        )
      );
    } catch (error) {
      console.error('❌ Error selecting album:', error);
      Alert.alert('Error', 'Failed to load album photos. Please try again.');
    } finally {
      setPhotosLoading(false);
    }
  };

  // Handle photo deletion (for admin users) - optimized
  const handleDeletePhoto = async (photoId: string, imageUrl: string) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove photo from local state immediately for better UX
              setAlbumPhotos(prevPhotos => prevPhotos.filter(photo => photo.id !== photoId));
              
              // Update album photo count immediately
              setAlbums(prevAlbums => 
                prevAlbums.map(album => 
                  album.id === selectedAlbum 
                    ? { ...album, photoCount: (album.photoCount || 0) - 1 }
                    : album
                )
              );
              
              // Delete from database in background
              await deletePhotoFromDatabase(photoId, imageUrl);
              
              Alert.alert('Success', 'Photo deleted successfully!');
            } catch (error) {
              console.error('Error deleting photo:', error);
              Alert.alert('Error', 'Failed to delete photo. Please try again.');
              
              // Revert local state if deletion failed
              // Note: In a production app, you might want to refetch the data instead
            }
          },
        },
      ]
    );
  };

  React.useEffect(() => {
    fetchAlbums();
  }, []);

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
      onPress={() => handleAlbumSelect(item.id)}
      activeOpacity={0.8}
    >
      <Image source={item.coverImage} style={styles.albumCoverImage} />
      <View style={styles.albumOverlay}>
        <Text style={styles.albumTitle}>{item.title}</Text>
        <Text style={styles.albumPhotoCount}>{item.photoCount} photo{item.photoCount !== 1 ? 's' : ''}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderPhoto = ({ item }: { item: any }) => {
    console.log("📸 Rendering gallery photo:", item.image_url);
    return (
      <View style={styles.photoContainer}>
        <TouchableOpacity 
          style={styles.photoWrapper}
          onPress={() => setSelectedPhoto(item)}
          activeOpacity={0.9}
        >
          <Image 
            source={{ uri: item.uri }} 
            style={styles.photo}
            resizeMode="cover"
            onError={() => {
              console.error('❌ Image load error for:', item.uri);
            }}
            onLoad={() => {
              console.log('✅ Image loaded successfully:', item.uri);
            }}
          />
        </TouchableOpacity>
              <View style={styles.photoButtonsContainer}>
          <TouchableOpacity 
            style={styles.downloadPhotoButton}
            onPress={() => handleDownloadPhoto(item)}
            activeOpacity={0.8}
          >
            <Ionicons name="save-outline" size={16} color="#fff" />
            <Text style={styles.downloadPhotoText}>Save</Text>
          </TouchableOpacity>
          {userRole === 'admin' && (
            <TouchableOpacity 
              style={styles.deletePhotoButton}
              onPress={() => handleDeletePhoto(item.id, item.image_url)}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={16} color="#fff" />
              <Text style={styles.deletePhotoText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

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
        {photosLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: textColor }]}>Loading photos...</Text>
          </View>
        ) : albumPhotos.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={64} color={secondaryTextColor} />
            <Text style={[styles.emptyStateTitle, { color: textColor }]}>No Photos</Text>
            <Text style={[styles.emptyStateText, { color: secondaryTextColor }]}>
              This album doesn't have any photos yet.
            </Text>
          </View>
        ) : (
          <FlatList
            data={albumPhotos}
            keyExtractor={(item, index) => `photo-${index}`}
            numColumns={2}
            renderItem={renderPhoto}
            contentContainerStyle={styles.photosGrid}
            showsVerticalScrollIndicator={false}
          />
        )}

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
                <Image 
                  source={{ uri: selectedPhoto.uri }} 
                  style={styles.fullScreenPhoto}
                  resizeMode="contain"
                  onError={() => {
                    console.error('❌ Modal image load error for:', selectedPhoto.uri);
                  }}
                  onLoad={() => {
                    console.log('✅ Modal image loaded successfully:', selectedPhoto.uri);
                  }}
                />
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
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: textColor }]}>Loading albums...</Text>
        </View>
      ) : filteredAlbums.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="images-outline" size={64} color={secondaryTextColor} />
          <Text style={[styles.emptyStateTitle, { color: textColor }]}>No Albums</Text>
          <Text style={[styles.emptyStateText, { color: secondaryTextColor }]}>
            {searchQuery ? 'No albums match your search.' : 'No albums have been created yet.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredAlbums}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.albumCard, { backgroundColor: albumCardBackground }]}
              onPress={() => handleAlbumSelect(item.id)}
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
      )}

      
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
  photoButtonsContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
  },
  deletePhotoButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deletePhotoText: {
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
}); 