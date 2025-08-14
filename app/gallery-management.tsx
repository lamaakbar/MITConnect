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
  Modal,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Keyboard,
  ToastAndroid,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

// Try to import required modules for photo saving
let MediaLibrary: any = null;
let FileSystem: any = null;
try {
  MediaLibrary = require('expo-media-library');
  FileSystem = require('expo-file-system');
} catch (error) {
  console.log('Required modules not available');
}
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTheme } from '../components/ThemeContext';
import { useUserContext } from '../components/UserContext';

import AdminHeader from '../components/AdminHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  fetchGalleryAlbums, 
  createAlbum, 
  uploadCoverImageToStorage, 
  uploadPhotosToAlbum, 
  deleteAlbum, 
  deletePhoto,
  fetchAlbumPhotos,
  Album as GalleryAlbum,
  Photo as GalleryPhoto
} from '../services/galleryService';
import { supabase } from '../services/supabase';

// Album and Photo Types
interface Photo {
  id?: string;
  uri: string;
}
interface Album {
  id: string;
  title: string;
  photos: Photo[];
  cover_image?: string;
}

// Empty albums array - no mock data
const initialAlbums: Album[] = [];

export default function GalleryManagement() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { userRole } = useUserContext();
  
  const [albums, setAlbums] = useState<Album[]>(initialAlbums);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPhotos, setNewPhotos] = useState<Photo[]>([]);
  const [coverImage, setCoverImage] = useState<Photo | null>(null);
  // Replace selectedAlbum with selectedAlbumId
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  // Add state for modal animation
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteAnimIdx, setDeleteAnimIdx] = useState<number | null>(null);
  const deleteAnim = useState(new Animated.Value(1))[0];
  // Add search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCoverImage, setEditCoverImage] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  
  // Function to handle image loading errors
  const handleImageError = (imageUri: string) => {
    setImageErrors(prev => new Set(prev).add(imageUri));
  };

  // Function to refresh authentication session
  const refreshAuthSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Error refreshing session:', error);
        return false;
      }
      return !!data.session;
    } catch (error) {
      console.error('Error refreshing session:', error);
      return false;
    }
  };

  // Fetch albums from Supabase
  const fetchAlbums = async () => {
    try {
      setLoading(true);
      const fetchedAlbums = await fetchGalleryAlbums();
      
      // Filter out any temporary albums that might be left over
      const realAlbums = fetchedAlbums.filter(album => !album.id.startsWith('temp-'));
      console.log('✅ Real albums (filtered):', realAlbums.length);
      
      // Convert to local format and load photos for each album
      const localAlbums: Album[] = await Promise.all(
        realAlbums.map(async (album) => {
          const photos = await fetchAlbumPhotos(album.id);
          const localAlbum = {
            id: album.id,
            title: album.title,
            cover_image: album.cover_image,
            photos: photos.map(photo => ({
              id: photo.id,
              uri: photo.uri
            }))
          };
          console.log('📸 Loaded album:', {
            id: localAlbum.id,
            title: localAlbum.title,
            cover_image: localAlbum.cover_image,
            photoCount: localAlbum.photos.length
          });
          return localAlbum;
        })
      );
      
      setAlbums(localAlbums);
    } catch (error) {
      console.error('Error fetching albums:', error);
      Alert.alert('Error', 'Failed to fetch albums. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load albums on component mount
  React.useEffect(() => {
    fetchAlbums();
  }, []);

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  const borderColor = isDarkMode ? '#2A2A2A' : '#E0E0E0';
  const searchBackground = isDarkMode ? '#2A2A2A' : '#F2F4F7';
  const modalBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const overlayBackground = isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.3)';

  // Refactored image picker for reuse
  const pickImagesFromLibrary = async (): Promise<Photo[]> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant photo library access to add images.');
      return [];
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8, // Reduced quality for faster uploads
      selectionLimit: 10,
    });
    console.log('ImagePicker result:', result);
    if (!result.canceled && result.assets) {
      const uris = result.assets.map((a) => a.uri);
      console.log('Selected image URIs:', uris);
      return result.assets.map((a) => ({ uri: a.uri }));
    }
    return [];
  };

  // Pick cover image separately
  const pickCoverImage = async (): Promise<Photo | null> => {
    // Note: MediaTypeOptions.Images is deprecated but still works in expo-image-picker v16.1.4
    // TODO: Update to MediaType.Images when upgrading to newer version
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant photo library access to add cover image.');
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      // Note: MediaTypeOptions.Images is deprecated but still works in expo-image-picker v16.1.4
      // TODO: Update to MediaType.Images when upgrading to newer version
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.8,
    });
    console.log('Cover ImagePicker result:', result);
    if (!result.canceled && result.assets && result.assets.length > 0) {
      return { uri: result.assets[0].uri };
    }
    return null;
  };

  // Create a new album
  const handleCreateAlbum = async () => {
    // User authentication check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Not Authenticated', 'You must be logged in to create an album.');
      return;
    }
    // Admin requires cover image, employee/trainee don't
    const requiresCover = userRole === 'admin';
    if (!newTitle.trim() || newPhotos.length === 0 || (requiresCover && !coverImage)) return;
    
    try {
      setLoading(true);
      setUploadProgress(0);
      
      console.log('🚀 Starting ULTRA-FAST album creation with', newPhotos.length, 'photos');
      
      // Step 1: Create album immediately with local cover image (no upload wait)
      setUploadProgress(30);
      const tempAlbumId = `temp-${Date.now()}`;
      
      // Use separate cover image, all photos go into album
      let albumPhotos = newPhotos;
      console.log('📸 Original photos selected:', newPhotos.length);
      console.log('📸 Cover image:', coverImage ? coverImage.uri : 'None');
      
      if (userRole === 'admin' && coverImage) {
        // Remove the cover image from the album photos if present
        const beforeFilter = albumPhotos.length;
        console.log('🖼️ Cover image URI:', coverImage.uri);
        console.log('📸 Album photos URIs:', albumPhotos.map(p => p.uri));
        
        albumPhotos = newPhotos.filter(photo => {
          const isCoverImage = photo.uri === coverImage.uri;
          if (isCoverImage) {
            console.log('🚫 Removing cover image from album photos:', photo.uri);
          }
          return !isCoverImage;
        });
        
        const afterFilter = albumPhotos.length;
        console.log(`📸 Filtered photos: ${beforeFilter} → ${afterFilter} (removed ${beforeFilter - afterFilter} cover image)`);
        console.log('📸 Remaining album photos:', albumPhotos.map(p => p.uri));
      }
      
      console.log('📸 Final album photos to upload:', albumPhotos.length);
      
      const tempAlbum = {
        id: tempAlbumId,
        title: newTitle.trim(),
        cover_image: userRole === 'admin' && coverImage ? coverImage.uri : undefined, // Use local URI for temp display
        photos: albumPhotos.map((photo, index) => ({
          id: `temp-${index}`,
          uri: photo.uri,
          image_url: photo.uri,
          created_at: new Date().toISOString()
        })),
        photoCount: albumPhotos.length // Count without cover photo
      };
      
      console.log('📸 Temporary album created:', {
        id: tempAlbum.id,
        title: tempAlbum.title,
        cover_image: tempAlbum.cover_image,
        photoCount: tempAlbum.photoCount,
        photos: tempAlbum.photos.map(p => p.uri)
      });
      
      // Add album to UI IMMEDIATELY (no waiting)
      setAlbums(prevAlbums => [tempAlbum, ...prevAlbums]);
      
      // Close modal and reset form IMMEDIATELY
      setShowCreateModal(false);
      setNewTitle('');
      setNewPhotos([]);
      setCoverImage(null);
      setUploadProgress(0);
      setLoading(false);
      
      // Show success message IMMEDIATELY
      const photoCountText = albumPhotos.length === 1 ? '1 photo' : `${albumPhotos.length} photos`;
      const coverText = userRole === 'admin' && coverImage ? ' with cover image' : '';
      Alert.alert('Success', `Album created${coverText}! ${photoCountText} uploading in the background.`);
      
      // Step 2: Do all the heavy lifting in background (user doesn't wait)
      try {
        setUploadProgress(50);
        
        // Upload cover image in background (only for admin)
        let coverImageUrl = null;
        if (userRole === 'admin' && coverImage) {
          console.log('🖼️ Uploading cover image...');
          console.log('🖼️ Cover image URI:', coverImage.uri);
          coverImageUrl = await uploadCoverImageToStorage(coverImage.uri);
          console.log('✅ Cover image uploaded:', coverImageUrl);
          if (!coverImageUrl) {
            console.error('❌ Cover image upload failed!');
          }
        } else {
          console.log('⚠️ No cover image to upload (userRole:', userRole, ', coverImage:', !!coverImage, ')');
        }
        
        // Create real album in database
        console.log('📝 Creating album in database...');
        console.log('📝 Album title:', newTitle.trim());
        console.log('📝 Cover image URL for database:', coverImageUrl || '');
        const realAlbumId = await createAlbum(newTitle.trim(), coverImageUrl || '');
        console.log('✅ Album created in database with ID:', realAlbumId);
        
        // Upload album photos (excluding cover photo)
        console.log('📸 Album photos to upload:', albumPhotos.length, 'photos');
        console.log('📸 Album photos data:', albumPhotos);
        
        if (albumPhotos.length > 0) {
          console.log('📸 Starting photo upload process...');
          const uploadedPhotos = await uploadPhotosToAlbum(realAlbumId, albumPhotos);
          console.log('✅ All photos uploaded successfully:', uploadedPhotos.length);
          console.log('✅ Uploaded photos data:', uploadedPhotos);
          
          // Replace temp album with real album
          setAlbums(prevAlbums => 
            prevAlbums.map(album => 
              album.id === tempAlbumId 
                ? { 
                    ...album, 
                    id: realAlbumId,
                    cover_image: coverImageUrl || undefined, // Preserve the cover image
                    photos: uploadedPhotos 
                  }
                : album
            )
          );
          console.log('✅ Album updated in UI with real data');
        } else {
          // No photos to upload, just update the album ID
          console.log('⚠️ No photos to upload for this album');
          setAlbums(prevAlbums => 
            prevAlbums.map(album => 
              album.id === tempAlbumId 
                ? { 
                    ...album, 
                    id: realAlbumId,
                    cover_image: coverImageUrl || undefined, // Preserve the cover image
                    photos: [] // Ensure empty photos array
                  }
                : album
            )
          );
          console.log('✅ Album updated in UI (no photos)');
        }
        
        setUploadProgress(100);
        console.log('🎉 Album creation completed successfully!');
        
      } catch (error) {
        console.error('❌ Error in background album creation:', error);
        
        // Remove the temporary album from UI since it failed
        setAlbums(prevAlbums => prevAlbums.filter(album => album.id !== tempAlbumId));
        
        // Show error message
        Alert.alert('Error', 'Failed to save album. Please try again.');
      }
        
    } catch (error) {
      console.error('Error creating album:', error);
      Alert.alert('Error', 'Failed to create album. Please try again.');
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Delete an album
  const handleDeleteAlbum = (albumId: string) => {
    Alert.alert('Delete Album', 'Are you sure you want to delete this album? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            
            // Check if this is a temporary album (starts with 'temp-')
            if (albumId.startsWith('temp-')) {
              // For temporary albums, just remove from local state (no database deletion needed)
              console.log('🗑️ Deleting temporary album:', albumId);
              const updatedAlbums = albums.filter(a => a.id !== albumId);
              setAlbums(updatedAlbums);
              
              // If we're in album view, go back to albums list
              if (selectedAlbumId === albumId) {
                setSelectedAlbumId(null);
              }
              
              Alert.alert('Success', 'Album deleted successfully!');
            } else {
              // For real albums, delete from database
              console.log('🗑️ Deleting real album from database:', albumId);
              await deleteAlbum(albumId);
              
              // Update local state immediately for better UX
              const updatedAlbums = albums.filter(a => a.id !== albumId);
              setAlbums(updatedAlbums);
              
              // If we're in album view, go back to albums list
              if (selectedAlbumId === albumId) {
                setSelectedAlbumId(null);
              }
              
              Alert.alert('Success', 'Album deleted successfully!');
            }
          } catch (error) {
            console.error('Error deleting album:', error);
            Alert.alert('Error', 'Failed to delete album. Please try again.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  // Delete a photo from an album (optimized)
  const handleDeletePhoto = async (album: Album, photoIdx: number) => {
    const photo = album.photos[photoIdx];
    if (!photo || !photo.id) {
      console.error('Photo not found or missing ID');
      return;
    }
    
    try {
      setLoading(true);
      
      // Check if this is a temporary photo (starts with 'temp-')
      if (photo.id.startsWith('temp-')) {
        // For temporary photos, just remove from local state (no database deletion needed)
        console.log('🗑️ Deleting temporary photo:', photo.id);
        
        // Update local state immediately for better UX
        const updatedAlbums = albums.map(a => {
          if (a.id === album.id) {
            const updatedPhotos = [...a.photos];
            updatedPhotos.splice(photoIdx, 1);
            return { ...a, photos: updatedPhotos };
          }
          return a;
        });
        setAlbums(updatedAlbums);
        
        // If we're viewing this album, update the current view
        if (selectedAlbumId === album.id) {
          const currentAlbum = updatedAlbums.find(a => a.id === album.id);
          if (currentAlbum) {
            // Update the current album view
            setSelectedAlbumId(null); // Force refresh
            setTimeout(() => setSelectedAlbumId(album.id), 100);
          }
        }
        
        Alert.alert('Success', 'Photo deleted successfully!');
      } else {
        // For real photos, delete from database
        console.log('🗑️ Deleting real photo from database:', photo.id);
        await deletePhoto(photo.id, photo.uri);
        
        // Update local state immediately for better UX
        const updatedAlbums = albums.map(a => {
          if (a.id === album.id) {
            const updatedPhotos = [...a.photos];
            updatedPhotos.splice(photoIdx, 1);
            return { ...a, photos: updatedPhotos };
          }
          return a;
        });
        setAlbums(updatedAlbums);
        
        // If we're viewing this album, update the current view
        if (selectedAlbumId === album.id) {
          const currentAlbum = updatedAlbums.find(a => a.id === album.id);
          if (currentAlbum) {
            // Update the current album view
            setSelectedAlbumId(null); // Force refresh
            setTimeout(() => setSelectedAlbumId(album.id), 100);
          }
        }
        
        Alert.alert('Success', 'Photo deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      Alert.alert('Error', 'Failed to delete photo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Save photo to device (same as user gallery)
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

  // Filtered albums for search
  const filteredAlbums = albums.filter(album => album.title.toLowerCase().includes(searchQuery.toLowerCase()));

  // Floating action button for adding album (FAB)
  const AddAlbumFAB = (
    <TouchableOpacity
      onPress={() => setShowCreateModal(true)}
      style={{
        position: 'absolute',
        right: 20,
        bottom: 84,
        backgroundColor: '#3CB371',
        borderRadius: 30,
        width: 60,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 10,
        zIndex: 100,
      }}
      accessibilityLabel="Add Album"
      activeOpacity={0.85}
    >
      <Ionicons name="add" size={34} color="#fff" />
    </TouchableOpacity>
  );

  // Albums Grid View
  if (!showCreate && !selectedAlbumId) {
    const insets = useSafeAreaInsets();
    return (
      <View style={{ flex: 1, backgroundColor }}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        
                {/* Header */}
        <View style={[styles.header, { 
          paddingTop: insets.top,
          paddingHorizontal: 16,
          paddingBottom: 12,
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
            }}>Gallery Management</Text>
          </View>
          <View style={{ width: 32 }} />
        </View>
        <View style={[styles.mainContainer, { backgroundColor }]}>
          {/* Search Bar */}
          <View style={[styles.searchBarContainer, { backgroundColor: searchBackground }]}>
            <Ionicons name="search" size={20} color={secondaryTextColor} style={{ marginLeft: 10, marginRight: 4 }} />
            <TextInput
              style={[styles.searchBar, { color: textColor }]}
              placeholder="Search Albums"
              placeholderTextColor={secondaryTextColor}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
          </View>

          {/* Scrollable Content */}
          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            {albums.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="images-outline" size={64} color="#ccc" />
                <Text style={[styles.emptyStateTitle, { color: textColor }]}>No Albums Created</Text>
                <Text style={[styles.emptyStateText, { color: secondaryTextColor }]}>
                  Start by creating your first album to organize and share photos with your team.
                </Text>
              </View>
            ) : (
              <View style={styles.albumGrid}>
                {filteredAlbums.map((item) => (
                  <View key={item.id} style={[styles.albumCard, { backgroundColor: cardBackground, borderColor }]}>
                    <TouchableOpacity
                      style={styles.albumCardContent}
                      onPress={() => setSelectedAlbumId(item.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.albumCoverBox}>
                        {item.cover_image ? (
                          <Image source={{ uri: item.cover_image }} style={styles.albumCoverImg} />
                        ) : item.photos[0] ? (
                          <Image source={{ uri: item.photos[0].uri }} style={styles.albumCoverImg} />
                        ) : (
                          <View style={[styles.albumCoverPlaceholder, { backgroundColor: isDarkMode ? '#2A2A2A' : '#F0F0F0' }]} />
                        )}
                        <View style={[styles.albumOverlay, { 
                          backgroundColor: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(34,34,34,0.9)',
                          borderBottomLeftRadius: 24,
                          borderBottomRightRadius: 24,
                        }]}>
                          <Text style={[styles.albumTitle, { color: '#fff' }]}>{item.title}</Text>
                          <Text style={[styles.albumCount, { color: '#fff' }]}>{item.photos.length} {item.photos.length === 1 ? 'photo' : 'photos'}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                    
                    {/* Delete Button */}
                    <TouchableOpacity
                      style={styles.deleteAlbumButton}
                      onPress={() => handleDeleteAlbum(item.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="trash-outline" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
                {filteredAlbums.length === 0 && searchQuery.length > 0 && (
                  <View style={styles.emptySearchState}>
                    <Ionicons name="search-outline" size={48} color="#ccc" />
                    <Text style={[styles.emptyStateTitle, { color: textColor }]}>No Albums Found</Text>
                    <Text style={[styles.emptyStateText, { color: secondaryTextColor }]}>
                      No albums match your search "{searchQuery}". Try different keywords.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Bottom Tab Bar */}
  
          {AddAlbumFAB}

          {/* Create Album Modal */}
          <Modal
            visible={showCreateModal}
            animationType="slide"
            transparent
            onRequestClose={() => setShowCreateModal(false)}
          >
            <View style={[styles.modalOverlay, { backgroundColor: overlayBackground }]}>
              <View style={[styles.modalContent, { backgroundColor: modalBackground }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: textColor }]}>Create New Album</Text>
                  <TouchableOpacity 
                    style={[styles.modalCloseBtn, { backgroundColor: isDarkMode ? '#2A2A2A' : '#F2F2F2' }]}
                    onPress={() => setShowCreateModal(false)}
                  >
                    <Ionicons name="close" size={20} color={textColor} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalScroll}>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: searchBackground, color: textColor, borderColor }]}
                    placeholder="Album Title"
                    placeholderTextColor={secondaryTextColor}
                    value={newTitle}
                    onChangeText={setNewTitle}
                  />
                  
                  {/* Cover Image Selection - Only for Admin */}
                  {userRole === 'admin' && (
                    <>
                      <TouchableOpacity 
                        style={[styles.addPhotosBtn, { backgroundColor: searchBackground, borderColor }]}
                        onPress={async () => {
                          const cover = await pickCoverImage();
                          if (cover) {
                            setCoverImage(cover);
                          }
                        }}
                      >
                        <Ionicons name="image" size={20} color={secondaryTextColor} />
                        <Text style={[styles.addPhotosText, { color: textColor }]}>
                          {coverImage ? 'Change Cover Image' : 'Select Cover Image'}
                        </Text>
                      </TouchableOpacity>
                      
                      {coverImage && (
                        <View style={styles.coverImageContainer}>
                          <Text style={[styles.selectedPhotosTitle, { color: textColor }]}>Cover Image</Text>
                          <View style={styles.selectedPhotoItem}>
                            <Image source={{ uri: coverImage.uri }} style={styles.selectedPhoto} />
                            <TouchableOpacity 
                              style={styles.removePhotoBtn}
                              onPress={() => setCoverImage(null)}
                            >
                              <Ionicons name="close" size={16} color="#fff" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </>
                  )}
                  
                  <TouchableOpacity 
                    style={[styles.addPhotosBtn, { backgroundColor: searchBackground, borderColor }]}
                    onPress={async () => {
                      const photos = await pickImagesFromLibrary();
                      setNewPhotos([...newPhotos, ...photos]);
                    }}
                  >
                    <Ionicons name="add" size={20} color={secondaryTextColor} />
                    <Text style={[styles.addPhotosText, { color: textColor }]}>Add Photos</Text>
                  </TouchableOpacity>
                </View>
                
                {newPhotos.length > 0 && (
                  <View style={styles.selectedPhotosContainer}>
                    <Text style={[styles.selectedPhotosTitle, { color: textColor }]}>Selected Photos ({newPhotos.length})</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {newPhotos.map((photo, index) => (
                        <View key={index} style={styles.selectedPhotoItem}>
                          <Image source={{ uri: photo.uri }} style={styles.selectedPhoto} />
                          <TouchableOpacity 
                            style={styles.removePhotoBtn}
                            onPress={() => setNewPhotos(newPhotos.filter((_, i) => i !== index))}
                          >
                            <Ionicons name="close" size={16} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.cancelBtn, { backgroundColor: searchBackground, borderColor }]} 
                    onPress={() => {
                      setShowCreateModal(false);
                      setNewTitle('');
                      setNewPhotos([]);
                      setCoverImage(null);
                    }}
                  >
                    <Text style={[styles.cancelBtnText, { color: textColor }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.createBtn, { 
                      backgroundColor: newTitle.trim() && newPhotos.length > 0 && (userRole !== 'admin' || coverImage) ? '#3CB371' : (isDarkMode ? '#2A2A2A' : '#E5E5EA'),
                      opacity: newTitle.trim() && newPhotos.length > 0 && (userRole !== 'admin' || coverImage) ? 1 : 0.6
                    }]} 
                    onPress={handleCreateAlbum}
                    disabled={!newTitle.trim() || newPhotos.length === 0 || (userRole === 'admin' && !coverImage) || loading}
                  >
                    {loading ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.createBtnText, { color: '#fff', marginRight: 8 }]}>
                          Creating...
                        </Text>
                        <Text style={[styles.createBtnText, { color: '#fff', fontSize: 12 }]}>
                          {uploadProgress}%
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.createBtnText, { 
                        color: newTitle.trim() && newPhotos.length > 0 ? '#fff' : (isDarkMode ? '#666' : '#999')
                      }]}>Create Album</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    );
  }

  // Create Album View
  if (showCreate) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor }}>
        <AdminHeader title="New Album" backDestination={undefined} />
        {/* Form */}
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <View style={styles.formContainer}>
            <TextInput
              style={styles.formInput}
              placeholder="Album Title"
              value={newTitle}
              onChangeText={setNewTitle}
              placeholderTextColor="#aaa"
              autoFocus
            />
            <TouchableOpacity
              style={styles.uploadBox}
              onPress={async () => setNewPhotos(await pickImagesFromLibrary())}
              activeOpacity={0.8}
            >
              <Ionicons name="images" size={32} color="#007AFF" />
              <Text style={styles.uploadText}>Select Photos</Text>
            </TouchableOpacity>
            <View style={styles.previewRow}>
              {newPhotos.map((img, idx) => (
                <Image key={idx} source={{ uri: img.uri }} style={styles.previewImg} />
              ))}
            </View>
            <TouchableOpacity
              style={[
                styles.createBtn,
                { backgroundColor: newTitle && newPhotos.length > 0 ? '#007AFF' : '#E5E5EA' }
              ]}
              onPress={handleCreateAlbum}
              activeOpacity={0.85}
              disabled={!(newTitle && newPhotos.length > 0)}
            >
              <Text style={[
                styles.createBtnText,
                { color: newTitle && newPhotos.length > 0 ? '#fff' : '#007AFF' }
              ]}>
                Create Album
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

      </SafeAreaView>
    );
  }

  // Album Detail View: Widget style
  if (selectedAlbumId) {
    const handleAddPhotosToAlbum = async () => {
      try {
        const newImgs = await pickImagesFromLibrary();
        console.log('Picked images:', newImgs);
        
        if (newImgs.length > 0) {
          // Show loading state
          Alert.alert('Uploading', 'Uploading photos...');
          
          // Upload photos to Supabase
          const uploadedPhotos = await uploadPhotosToAlbum(selectedAlbumId, newImgs);
          console.log('Uploaded photos:', uploadedPhotos);
          
          if (uploadedPhotos && uploadedPhotos.length > 0) {
            // Update local state with uploaded photos
            const current = albums.find(a => a.id === selectedAlbumId);
            if (current) {
              const updatedAlbum = {
                ...current,
                photos: [...current.photos, ...uploadedPhotos],
              } as Album;
              setAlbums(albums.map((a) => (a.id === selectedAlbumId ? updatedAlbum : a)));
              setSelectedAlbumId(selectedAlbumId);
              console.log('Updated album photos:', updatedAlbum.photos);
              Alert.alert('Success', `${uploadedPhotos.length} photos added successfully!`);
            }
          } else {
            Alert.alert('Error', 'Failed to upload photos');
          }
        }
      } catch (error) {
        console.error('Error adding photos to album:', error);
        Alert.alert('Error', 'Error uploading photos');
      }
    };
    const handleAnimatedDeletePhoto = (album: Album, photoIdx: number) => {
      setDeleteAnimIdx(photoIdx);
      Animated.timing(deleteAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        handleDeletePhoto(album, photoIdx);
        setDeleteAnimIdx(null);
        deleteAnim.setValue(1);
      });
    };
    const openEditModal = () => {
      const currentAlbum = albums.find(a => a.id === selectedAlbumId);
      setEditTitle(currentAlbum?.title || '');
      // Initialize edit cover image with current cover if it exists
      if (currentAlbum?.cover_image) {
        setEditCoverImage({ uri: currentAlbum.cover_image });
      } else {
        setEditCoverImage(null);
      }
      setShowEditModal(true);
    };
    
    const pickEditCoverImage = async () => {
      const newCoverImage = await pickCoverImage();
      if (newCoverImage) {
        setEditCoverImage(newCoverImage);
      }
    };
    const handleSaveEdit = async () => {
      if (!editTitle.trim()) return;
      
      try {
        const current = albums.find(a => a.id === selectedAlbumId);
        if (!current) return;
        
        let newCoverImageUrl = current.cover_image;
        
        // Upload new cover image if selected
        if (editCoverImage && editCoverImage.uri !== current.cover_image) {
          Alert.alert('Uploading', 'Uploading cover image...');
          const coverImageUrl = await uploadCoverImageToStorage(editCoverImage.uri);
          if (coverImageUrl) {
            newCoverImageUrl = coverImageUrl;
            console.log('✅ New cover image uploaded:', coverImageUrl);
          } else {
            Alert.alert('Error', 'Failed to upload cover image');
            return;
          }
        }
        
        // Update album in database
        const { data, error } = await supabase
          .from('gallery_albums')
          .update({ 
            name: editTitle.trim(),
            cover_image: newCoverImageUrl 
          })
          .eq('id', selectedAlbumId)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating album:', error);
          Alert.alert('Error', 'Failed to update album. Please try again.');
          return;
        }
        
        // Update local state
        const updatedAlbum: Album = { 
          ...current, 
          title: editTitle.trim(),
          cover_image: newCoverImageUrl
        };
        setAlbums(albums.map((a) => (a.id === selectedAlbumId ? updatedAlbum : a)));
        setSelectedAlbumId(selectedAlbumId);
        setShowEditModal(false);
        setEditCoverImage(null);
        Keyboard.dismiss();
        Alert.alert('Success', 'Album updated successfully!');
        
      } catch (error) {
        console.error('Error saving album edit:', error);
        Alert.alert('Error', 'Error updating album');
      }
    };
    const currentAlbum = albums.find(a => a.id === selectedAlbumId);
    if (selectedAlbumId && currentAlbum) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor }}>
          <AdminHeader 
            title={currentAlbum.title}
            backDestination={undefined}
            onBackPress={() => setSelectedAlbumId(null)}
            showLogo={false}
            titleSize={18}
          />
          
          {/* Admin-only action buttons */}
          {userRole === 'admin' && (
            <View style={styles.albumActionButtons}>
              <TouchableOpacity
                style={[styles.albumActionBtn, styles.editAlbumBtn]}
                onPress={openEditModal}
                accessibilityLabel="Edit album"
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={18} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.albumActionBtn, styles.deleteAlbumBtn]}
                onPress={() => handleDeleteAlbum(selectedAlbumId!)}
                accessibilityLabel="Delete album"
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={18} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.albumActionBtn, styles.addPhotoBtn]}
                onPress={handleAddPhotosToAlbum}
                accessibilityLabel="Add photos to album"
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
          
          <FlatList
            key={`album-detail-${selectedAlbumId}`}
            data={currentAlbum.photos}
            keyExtractor={(_, idx) => idx.toString()}
            numColumns={1}
            contentContainerStyle={styles.photoWidgetList}
            renderItem={({ item, index }) => {
              const hasError = imageErrors.has(item.uri);
              return (
                <Animated.View style={[styles.photoWidgetListItem, deleteAnimIdx === index && { opacity: deleteAnim, transform: [{ scale: deleteAnim }] }]}>
                  <TouchableOpacity 
                    onPress={() => setSelectedPhoto(item)}
                    activeOpacity={0.9}
                    style={{ flex: 1 }}
                  >
                    {!hasError ? (
                      <Image
                        source={{ uri: item.uri }}
                        style={styles.photoWidgetListImg}
                        onError={() => handleImageError(item.uri)}
                      />
                    ) : (
                      <View style={[styles.photoWidgetListImg, { alignItems: 'center', justifyContent: 'center' }]}>
                        <Ionicons name="alert-circle-outline" size={40} color="#f00" />
                        <Text style={{ color: '#f00', fontSize: 12, textAlign: 'center' }}>Failed to load</Text>
                      </View>
                    )}
                    <View style={styles.photoWidgetOverlay} />
                  </TouchableOpacity>
                  
                  {/* Photo action buttons container */}
                  <View style={styles.photoButtonsContainer}>
                    <TouchableOpacity
                      style={styles.downloadPhotoButton}
                      onPress={() => handleDownloadPhoto(item)}
                      accessibilityLabel="Save photo"
                      activeOpacity={0.8}
                    >
                      <Ionicons name="save-outline" size={16} color="#fff" />
                      <Text style={styles.downloadPhotoText}>Save</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.photoDeleteBtnWidget}
                      onPress={() => handleAnimatedDeletePhoto(currentAlbum, index)}
                      accessibilityLabel="Delete photo"
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              );
            }}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', marginTop: 60 }}>
                <Ionicons name="image-outline" size={64} color="#bbb" />
                <Text style={{ color: '#bbb', fontSize: 18, marginTop: 12 }}>No photos in this album.</Text>
              </View>
            }
          />
          {/* Edit Album Modal */}
          <Modal
            visible={showEditModal}
            animationType="slide"
            transparent
            onRequestClose={() => setShowEditModal(false)}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ flex: 1 }}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalSheet}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Edit Album</Text>
                    <TouchableOpacity onPress={() => {
                      setShowEditModal(false);
                      setEditCoverImage(null);
                    }} style={styles.modalCloseBtn}>
                      <Ionicons name="close" size={28} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.formContainer}>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Album Title"
                      value={editTitle}
                      onChangeText={setEditTitle}
                      placeholderTextColor="#aaa"
                      autoFocus
                    />
                    
                    {/* Cover Image Selection */}
                    <View style={{ marginTop: 20 }}>
                      <Text style={[styles.formLabel, { color: textColor }]}>Album Cover</Text>
                      <TouchableOpacity
                        style={styles.coverImageSelector}
                        onPress={pickEditCoverImage}
                        activeOpacity={0.8}
                      >
                        {editCoverImage && !imageErrors.has(editCoverImage.uri) ? (
                          <Image 
                            source={{ uri: editCoverImage.uri }} 
                            style={styles.coverImagePreview}
                            onError={() => handleImageError(editCoverImage.uri)}
                          />
                        ) : (
                          <View style={[styles.coverImagePlaceholder, { backgroundColor: isDarkMode ? '#2A2A2A' : '#F0F0F0' }]}>
                            <Ionicons name="image-outline" size={32} color="#bbb" />
                            <Text style={{ color: '#bbb', fontSize: 14, marginTop: 8 }}>Select Cover Image</Text>
                          </View>
                        )}
                        <View style={styles.coverImageOverlay}>
                          <Ionicons name="camera" size={20} color="#fff" />
                        </View>
                      </TouchableOpacity>
                    </View>
                    
                    <TouchableOpacity
                      style={[styles.createBtn, { backgroundColor: '#222' }]}
                      onPress={handleSaveEdit}
                      activeOpacity={0.85}
                      disabled={!editTitle.trim()}
                    >
                      <Text style={[styles.createBtnText, { color: '#fff' }]}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>
          
          {/* Full-Screen Photo Modal */}
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
        </SafeAreaView>
      );
    }
  }

  // Main Gallery Management View (Album List)
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }}>
      <AdminHeader 
        title="Gallery Management"
        backDestination={undefined}
        showLogo={false}
      />
      
      {/* Search Bar */}
      <View style={[styles.searchBarContainer, { backgroundColor: searchBackground }]}>
        <Ionicons name="search" size={20} color={secondaryTextColor} style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.searchBar, { color: textColor }]}
          placeholder="Search albums..."
          placeholderTextColor={secondaryTextColor}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Albums List */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.albumGrid}>
          {albums.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="images-outline" size={64} color="#bbb" />
              <Text style={[styles.emptyStateTitle, { color: textColor }]}>No Albums Yet</Text>
              <Text style={[styles.emptyStateText, { color: secondaryTextColor }]}>
                Create your first album to start organizing photos
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => setShowCreateModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.emptyStateButtonText}>Create Album</Text>
              </TouchableOpacity>
            </View>
          ) : (
            albums.map((album) => (
              <TouchableOpacity
                key={album.id}
                style={[styles.albumCard, { backgroundColor: cardBackground, borderColor: borderColor }]}
                onPress={() => setSelectedAlbumId(album.id)}
                activeOpacity={0.9}
              >
                <View style={styles.albumCardContent}>
                  <View style={styles.albumCoverBox}>
                    {album.cover_image && !imageErrors.has(album.cover_image) ? (
                      <Image 
                        source={{ uri: album.cover_image }} 
                        style={styles.albumCoverImg}
                        onError={() => album.cover_image && handleImageError(album.cover_image)}
                      />
                    ) : album.photos[0] && !imageErrors.has(album.photos[0].uri) ? (
                      <Image 
                        source={{ uri: album.photos[0].uri }} 
                        style={styles.albumCoverImg}
                        onError={() => handleImageError(album.photos[0].uri)}
                      />
                    ) : (
                      <View style={[styles.albumCoverPlaceholder, { backgroundColor: isDarkMode ? '#2A2A2A' : '#F0F0F0' }]}>
                        <Ionicons name="image-outline" size={32} color="#bbb" />
                      </View>
                    )}
                    <View style={styles.albumOverlay}>
                      <Text style={[styles.albumTitle, { color: '#fff' }]}>{album.title}</Text>
                      <Text style={[styles.albumCount, { color: '#fff' }]}>
                        {album.photos.length} photo{album.photos.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.deleteAlbumButton}
                  onPress={() => handleDeleteAlbum(album.id)}
                  accessibilityLabel="Delete album"
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={16} color="#fff" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Create Album Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { backgroundColor: modalBackground }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: textColor }]}>Create New Album</Text>
                <TouchableOpacity onPress={() => setShowCreateModal(false)} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={styles.formContainer}>
                <TextInput
                  style={[styles.formInput, { color: textColor, borderColor: borderColor }]}
                  placeholder="Album Title"
                  value={newTitle}
                  onChangeText={setNewTitle}
                  placeholderTextColor="#aaa"
                  autoFocus
                />
                
                {/* Cover Image Selection for Admin */}
                {userRole === 'admin' && (
                  <View style={{ marginTop: 20 }}>
                    <Text style={[styles.formLabel, { color: textColor }]}>Album Cover</Text>
                    <TouchableOpacity
                      style={styles.coverImageSelector}
                      onPress={async () => {
                        const cover = await pickCoverImage();
                        if (cover) setCoverImage(cover);
                      }}
                      activeOpacity={0.8}
                    >
                      {coverImage && !imageErrors.has(coverImage.uri) ? (
                        <Image 
                          source={{ uri: coverImage.uri }} 
                          style={styles.coverImagePreview}
                          onError={() => handleImageError(coverImage.uri)}
                        />
                      ) : (
                        <View style={[styles.coverImagePlaceholder, { backgroundColor: isDarkMode ? '#2A2A2A' : '#F0F0F0' }]}>
                          <Ionicons name="image-outline" size={32} color="#bbb" />
                          <Text style={{ color: '#bbb', fontSize: 14, marginTop: 8 }}>Select Cover Image</Text>
                        </View>
                      )}
                      <View style={styles.coverImageOverlay}>
                        <Ionicons name="camera" size={20} color="#fff" />
                      </View>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Photo Selection */}
                <View style={{ marginTop: 20 }}>
                  <Text style={[styles.formLabel, { color: textColor }]}>Photos</Text>
                  <TouchableOpacity
                    style={styles.coverImageSelector}
                    onPress={async () => {
                      const photos = await pickImagesFromLibrary();
                      if (photos.length > 0) setNewPhotos(photos);
                    }}
                    activeOpacity={0.8}
                  >
                    {newPhotos.length > 0 ? (
                      <View style={styles.selectedPhotosContainer}>
                        <Text style={[styles.selectedPhotosTitle, { color: textColor }]}>
                          {newPhotos.length} photo{newPhotos.length !== 1 ? 's' : ''} selected
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          {newPhotos.map((photo, index) => (
                            <View key={index} style={styles.selectedPhotoItem}>
                              {!imageErrors.has(photo.uri) ? (
                                <Image 
                                  source={{ uri: photo.uri }} 
                                  style={styles.selectedPhoto}
                                  onError={() => handleImageError(photo.uri)}
                                />
                              ) : (
                                <View style={[styles.selectedPhoto, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0' }]}>
                                  <Ionicons name="alert-circle-outline" size={20} color="#f00" />
                                </View>
                              )}
                              <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setNewPhotos(newPhotos.filter((_, i) => i !== index))}
                              >
                                <Ionicons name="close" size={16} color="#f00" />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </ScrollView>
                      </View>
                    ) : (
                      <View style={[styles.coverImagePlaceholder, { backgroundColor: isDarkMode ? '#2A2A2A' : '#F0F0F0' }]}>
                        <Ionicons name="images-outline" size={32} color="#bbb" />
                        <Text style={{ color: '#bbb', fontSize: 14, marginTop: 8 }}>Select Photos</Text>
                      </View>
                    )}
                    <View style={styles.coverImageOverlay}>
                      <Ionicons name="images" size={20} color="#fff" />
                    </View>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[
                    styles.createBtn,
                    {
                      backgroundColor: newTitle.trim() && newPhotos.length > 0 && (userRole !== 'admin' || coverImage) ? '#3CB371' : (isDarkMode ? '#2A2A2A' : '#E5E5EA'),
                      opacity: newTitle.trim() && newPhotos.length > 0 && (userRole !== 'admin' || coverImage) ? 1 : 0.6
                    }
                  ]}
                  onPress={handleCreateAlbum}
                  activeOpacity={0.85}
                  disabled={!newTitle.trim() || newPhotos.length === 0 || (userRole === 'admin' && !coverImage) || loading}
                >
                  <Text style={[styles.createBtnText, { color: newTitle.trim() && newPhotos.length > 0 && (userRole !== 'admin' || coverImage) ? '#fff' : secondaryTextColor }]}>
                    Create Album
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const albumColors = [
  '#43c6ac', '#f8ffae', '#ff6e7f', '#bfe9ff', '#f9d423', '#fc6076', '#92fe9d', '#f7971e', '#c471f5', '#fa709a', '#30cfd0', '#330867',
];
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    paddingBottom: 100,
  },

  addBtn: {
    marginLeft: 8,
    borderRadius: 24,
    padding: 10,
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  editBtn: {
    marginLeft: 8,
    borderRadius: 24,
    padding: 10,
    backgroundColor: 'rgba(255, 149, 0, 0.9)',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  deleteBtn: {
    marginLeft: 8,
    borderRadius: 24,
    padding: 10,
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  searchBar: {
    flex: 1,
    fontSize: 16,
    backgroundColor: 'transparent',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  albumGrid: {
    padding: 20,
    paddingTop: 0,
  },
  albumCard: {
    borderRadius: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  albumCardContent: {
    flex: 1,
  },
  deleteAlbumButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    zIndex: 10,
  },
  albumCoverBox: {
    width: '100%',
    aspectRatio: 2.3,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  albumCoverImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  albumCoverPlaceholder: {
    flex: 1,
  },
  albumOverlay: {
    width: '100%',
    padding: 24,
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  albumTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    letterSpacing: 0.3,
  },
  albumCount: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    opacity: 0.9,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 60,
    fontSize: 18,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
    elevation: 10,
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
  },
  modalCloseBtn: {
    marginLeft: 12,
    borderRadius: 20,
    backgroundColor: '#222',
    padding: 4,
  },
  modalScroll: {
    paddingHorizontal: 28,
  },
  modalLabel: {
    fontSize: 16,
    color: '#222',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
  },
  modalInput: {
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
  },
  addPhotosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  addPhotosText: {
    marginLeft: 12,
    fontWeight: '600',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
  },
  photosPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 18,
  },
  photoPreviewItem: {
    position: 'relative',
    marginRight: 8,
    marginBottom: 8,
  },
  photoPreview: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#E5E5EA',
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'rgba(255,68,68,0.8)',
    borderRadius: 12,
    padding: 2,
  },
  createAlbumBtn: {
    borderRadius: 22,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#222',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  createAlbumBtnDisabled: {
    backgroundColor: '#E5E5EA',
    opacity: 0.7,
  },
  createAlbumBtnText: {
    fontWeight: '700',
    fontSize: 18,
    color: '#fff',
    letterSpacing: 0.2,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
  },
  // Album detail grid
  photoWidgetGrid: {
    padding: 18,
    paddingTop: 0,
  },
  photoWidgetCard: {
    backgroundColor: '#222',
    borderRadius: 18,
    margin: 8,
    shadowColor: '#000',
    shadowOpacity: 0.13,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  photoWidgetImg: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  photoWidgetOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(34,34,34,0.18)',
  },
  photoDeleteBtnWidget: {
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // Photo buttons container and save button styles (from user gallery)
  photoButtonsContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
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

  // Add styles for vertical list
  photoWidgetList: {
    padding: 18,
    paddingTop: 0,
  },
  photoWidgetListItem: {
    backgroundColor: '#222',
    borderRadius: 18,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.13,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  photoWidgetListImg: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  headerSpacer: {
    width: 40,
  },
  formContainer: {
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 20,
    margin: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  formInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#222',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
  },
  uploadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#222',
  },
  uploadText: {
    marginLeft: 10,
    color: '#222',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
  },
  previewRow: {
    flexDirection: 'row',
    marginBottom: 18,
    flexWrap: 'wrap',
  },
  previewImg: {
    width: 64,
    height: 64,
    borderRadius: 14,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#E5E5EA',
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
  },
  createBtn: {
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  createBtnText: {
    fontWeight: '700',
    fontSize: 18,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
  },
  selectedPhotosContainer: {
    marginTop: 16,
    paddingBottom: 16,
  },
  coverImageContainer: {
    marginTop: 16,
    paddingBottom: 16,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
  },
  coverImageSelector: {
    position: 'relative',
    width: '100%',
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  coverImagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  coverImageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedPhotosTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
  },
  selectedPhotoItem: {
    position: 'relative',
    marginRight: 8,
  },
  selectedPhoto: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#E5E5EA',
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 12,
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
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
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#3CB371',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptySearchState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Album Action Buttons Styles
  albumActionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 12,
  },
  albumActionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  editAlbumBtn: {
    backgroundColor: '#FF9500',
  },
  deleteAlbumBtn: {
    backgroundColor: '#FF3B30',
  },
  addPhotoBtn: {
    backgroundColor: '#34C759',
  },
  
  // Full-screen photo modal styles (from user gallery)
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 