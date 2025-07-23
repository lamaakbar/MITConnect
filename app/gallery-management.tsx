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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTheme } from '../components/ThemeContext';
import AdminTabBar from '../components/AdminTabBar';
import AdminHeader from '../components/AdminHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Album and Photo Types
interface Photo {
  uri: string;
}
interface Album {
  id: string;
  title: string;
  photos: Photo[];
}

// Empty albums array - no mock data
const initialAlbums: Album[] = [];

export default function GalleryManagement() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  
  const [albums, setAlbums] = useState<Album[]>(initialAlbums);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPhotos, setNewPhotos] = useState<Photo[]>([]);
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
      quality: 1,
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
    setSelectedAlbumId(album.id);
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
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.albumCard, { backgroundColor: cardBackground, borderColor }]}
                    onPress={() => setSelectedAlbumId(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.albumCoverBox}>
                      {item.photos[0] ? (
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
          <AdminTabBar activeTab="gallery" isDarkMode={isDarkMode} />
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
                    }}
                  >
                    <Text style={[styles.cancelBtnText, { color: textColor }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.createBtn, { 
                      backgroundColor: newTitle.trim() && newPhotos.length > 0 ? '#3CB371' : (isDarkMode ? '#2A2A2A' : '#E5E5EA'),
                      opacity: newTitle.trim() && newPhotos.length > 0 ? 1 : 0.6
                    }]} 
                    onPress={handleCreateAlbum}
                    disabled={!newTitle.trim() || newPhotos.length === 0}
                  >
                    <Text style={[styles.createBtnText, { 
                      color: newTitle.trim() && newPhotos.length > 0 ? '#fff' : (isDarkMode ? '#666' : '#999')
                    }]}>Create Album</Text>
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
        <AdminHeader title="New Album" />
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
        <AdminTabBar activeTab="gallery" />
      </SafeAreaView>
    );
  }

  // Album Detail View: Widget style
  if (selectedAlbumId) {
    const handleAddPhotosToAlbum = async () => {
      const newImgs = await pickImagesFromLibrary();
      console.log('Picked images:', newImgs);
      if (newImgs.length > 0) {
        const current = albums.find(a => a.id === selectedAlbumId);
        const updatedAlbum = {
          ...current,
          photos: [...(current?.photos || []), ...newImgs] as Photo[],
        } as Album;
        setAlbums(albums.map((a) => (a.id === selectedAlbumId ? updatedAlbum : a)));
        setSelectedAlbumId(selectedAlbumId);
        console.log('Updated album photos:', updatedAlbum.photos);
        ToastAndroid.show('Photos added!', ToastAndroid.SHORT);
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
      setEditTitle(albums.find(a => a.id === selectedAlbumId)?.title || '');
      setShowEditModal(true);
    };
    const handleSaveEdit = () => {
      if (!editTitle.trim()) return;
      const current = albums.find(a => a.id === selectedAlbumId);
      if (!current) return;
      const updatedAlbum: Album = { ...current, title: editTitle.trim() };
      setAlbums(albums.map((a) => (a.id === selectedAlbumId ? updatedAlbum : a)));
      setSelectedAlbumId(selectedAlbumId);
      setShowEditModal(false);
      Keyboard.dismiss();
      ToastAndroid.show('Album updated!', ToastAndroid.SHORT);
    };
    const currentAlbum = albums.find(a => a.id === selectedAlbumId);
    if (selectedAlbumId && currentAlbum) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor }}>
          <AdminHeader 
            title=""
            rightComponent={
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity
                  style={[styles.addBtn, { marginRight: 8 }]}
                  onPress={handleAddPhotosToAlbum}
                  accessibilityLabel="Add photos to album"
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={openEditModal}
                  accessibilityLabel="Edit album"
                  activeOpacity={0.7}
                >
                  <Ionicons name="create-outline" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            }
          />
          <FlatList
            key={`album-detail-${selectedAlbumId}`}
            data={currentAlbum.photos}
            keyExtractor={(_, idx) => idx.toString()}
            numColumns={1}
            contentContainerStyle={styles.photoWidgetList}
            renderItem={({ item, index }) => {
              let loadError = false;
              return (
                <Animated.View style={[styles.photoWidgetListItem, deleteAnimIdx === index && { opacity: deleteAnim, transform: [{ scale: deleteAnim }] }]}>
                  {!loadError ? (
                    <Image
                      source={{ uri: item.uri }}
                      style={styles.photoWidgetListImg}
                      onError={() => { loadError = true; }}
                    />
                  ) : (
                    <View style={[styles.photoWidgetListImg, { alignItems: 'center', justifyContent: 'center' }]}>
                      <Ionicons name="alert-circle-outline" size={40} color="#f00" />
                      <Text style={{ color: '#f00', fontSize: 12, textAlign: 'center' }}>Failed to load</Text>
                    </View>
                  )}
                  <View style={styles.photoWidgetOverlay} />
                  <Text style={{ color: '#888', fontSize: 10, margin: 2, textAlign: 'center' }}>{item.uri}</Text>
                  <TouchableOpacity
                    style={styles.photoDeleteBtnWidget}
                    onPress={() => handleAnimatedDeletePhoto(currentAlbum, index)}
                    accessibilityLabel="Delete photo"
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={18} color="#fff" />
                  </TouchableOpacity>
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
                    <TouchableOpacity onPress={() => setShowEditModal(false)} style={styles.modalCloseBtn}>
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
        </SafeAreaView>
      );
    }
  }

  return null;
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
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(34,34,34,0.82)',
    borderRadius: 16,
    padding: 4,
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
}); 