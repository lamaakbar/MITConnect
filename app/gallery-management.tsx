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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

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
  // Replace selectedAlbum with selectedAlbumId
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  // Add state for modal animation
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteAnimIdx, setDeleteAnimIdx] = useState<number | null>(null);
  const deleteAnim = useState(new Animated.Value(1))[0];
  // Add search state
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');

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

  // Albums Grid View
  if (!showCreate && !selectedAlbumId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.sectionHeaderRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtnWidget} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={28} color="#222" />
          </TouchableOpacity>
          <Text style={styles.sectionHeader}>Albums</Text>
          <TouchableOpacity
            style={styles.addBtnWidget}
            onPress={() => setShowCreateModal(true)}
            accessibilityLabel="Create new album"
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={20} color="#888" style={{ marginLeft: 10, marginRight: 4 }} />
          <TextInput
            style={styles.searchBar}
            placeholder="Search Albums"
            placeholderTextColor="#aaa"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
        <FlatList
          data={filteredAlbums}
          keyExtractor={(item) => item.id}
          numColumns={1}
          contentContainerStyle={styles.albumWidgetGrid}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.albumWidgetCard}
              onPress={() => setSelectedAlbumId(item.id)}
              activeOpacity={0.85}
            >
              <View style={styles.albumWidgetCoverBox}>
                {item.photos[0] ? (
                  <Image source={{ uri: item.photos[0].uri }} style={styles.albumWidgetCoverImg} />
                ) : (
                  <View style={styles.albumWidgetCoverPlaceholder} />
                )}
                <View style={styles.albumWidgetOverlay}>
                  <Text style={styles.albumWidgetTitle}>{item.title}</Text>
                  <Text style={styles.albumWidgetCount}>{item.photos.length} {item.photos.length === 1 ? 'photo' : 'photos'}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.emptyTextWidget}>No albums yet.</Text>}
        />
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
            <View style={styles.modalOverlayWidget}>
              <View style={styles.modalSheetWidget}>
                <View style={styles.modalHeaderWidget}>
                  <Text style={styles.modalTitleWidget}>New Album</Text>
                  <TouchableOpacity onPress={() => setShowCreateModal(false)} style={styles.modalCloseBtnWidget}>
                    <Ionicons name="close" size={28} color="#fff" />
                  </TouchableOpacity>
                </View>
                <View style={styles.formContainerWidget}>
                  <TextInput
                    style={styles.inputWidget}
                    placeholder="Album Title"
                    value={newTitle}
                    onChangeText={setNewTitle}
                    placeholderTextColor="#aaa"
                    autoFocus
                  />
                  <TouchableOpacity style={styles.uploadBoxWidget} onPress={async () => setNewPhotos(await pickImagesFromLibrary())} activeOpacity={0.8}>
                    <Ionicons name="images" size={32} color="#fff" />
                    <Text style={styles.uploadTextWidget}>Select Photos</Text>
                  </TouchableOpacity>
                  <View style={styles.previewRowWidget}>
                    {newPhotos.map((img, idx) => (
                      <Image key={idx} source={{ uri: img.uri }} style={styles.previewImgWidget} />
                    ))}
                  </View>
                  <TouchableOpacity
                    style={[styles.createBtnWidget, { backgroundColor: '#222' }]}
                    onPress={() => {
                      handleCreateAlbum();
                      setShowCreateModal(false);
                    }}
                    activeOpacity={0.85}
                    disabled={!(newTitle && newPhotos.length > 0)}
                  >
                    <Text style={[styles.createBtnTextWidget, { color: '#fff' }]}>Create</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    );
  }

  // Create Album View
  if (showCreate) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 8,
            backgroundColor: '#fff',
            borderBottomWidth: 1,
            borderBottomColor: '#F2F2F7',
          }}
        >
          <TouchableOpacity onPress={() => setShowCreate(false)} style={{ padding: 4 }}>
            <Ionicons name="chevron-back" size={28} color="#007AFF" />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: '#111',
              flex: 1,
              textAlign: 'center',
              marginLeft: -28, // visually center title between back and right
            }}
            numberOfLines={1}
          >
            New Album
          </Text>
          <View style={{ width: 28 }} />
        </View>
        {/* Form */}
        <View style={styles.formContainerWidget}>
          <TextInput
            style={styles.inputWidget}
            placeholder="Album Title"
            value={newTitle}
            onChangeText={setNewTitle}
            placeholderTextColor="#aaa"
            autoFocus
          />
          <TouchableOpacity
            style={styles.uploadBoxWidget}
            onPress={async () => setNewPhotos(await pickImagesFromLibrary())}
            activeOpacity={0.8}
          >
            <Ionicons name="images" size={32} color="#007AFF" />
            <Text style={styles.uploadTextWidget}>Select Photos</Text>
          </TouchableOpacity>
          <View style={styles.previewRowWidget}>
            {newPhotos.map((img, idx) => (
              <Image key={idx} source={{ uri: img.uri }} style={styles.previewImgWidget} />
            ))}
          </View>
          <TouchableOpacity
            style={[
              styles.createBtnWidget,
              { backgroundColor: newTitle && newPhotos.length > 0 ? '#007AFF' : '#E5E5EA' }
            ]}
            onPress={handleCreateAlbum}
            activeOpacity={0.85}
            disabled={!(newTitle && newPhotos.length > 0)}
          >
            <Text style={[
              styles.createBtnTextWidget,
              { color: newTitle && newPhotos.length > 0 ? '#fff' : '#007AFF' }
            ]}>
              Create Album
            </Text>
          </TouchableOpacity>
        </View>
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
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.sectionHeaderRow}>
            <TouchableOpacity onPress={() => setSelectedAlbumId(null)} style={styles.backBtnWidget} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={28} color="#222" />
            </TouchableOpacity>
            <Text style={styles.sectionHeader}>{currentAlbum.title}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                style={[styles.addBtnWidget, { marginRight: 8 }]}
                onPress={handleAddPhotosToAlbum}
                accessibilityLabel="Add photos to album"
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={28} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addBtnWidget}
                onPress={openEditModal}
                accessibilityLabel="Edit album"
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
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
              <View style={styles.modalOverlayWidget}>
                <View style={styles.modalSheetWidget}>
                  <View style={styles.modalHeaderWidget}>
                    <Text style={styles.modalTitleWidget}>Edit Album</Text>
                    <TouchableOpacity onPress={() => setShowEditModal(false)} style={styles.modalCloseBtnWidget}>
                      <Ionicons name="close" size={28} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.formContainerWidget}>
                    <TextInput
                      style={styles.inputWidget}
                      placeholder="Album Title"
                      value={editTitle}
                      onChangeText={setEditTitle}
                      placeholderTextColor="#aaa"
                      autoFocus
                    />
                    <TouchableOpacity
                      style={[styles.createBtnWidget, { backgroundColor: '#222' }]}
                      onPress={handleSaveEdit}
                      activeOpacity={0.85}
                      disabled={!editTitle.trim()}
                    >
                      <Text style={[styles.createBtnTextWidget, { color: '#fff' }]}>Save</Text>
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
  safeArea: {
    flex: 1,
    backgroundColor: '#f6f7f9',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 18 : 24,
    paddingBottom: 8,
  },
  sectionHeader: {
    fontSize: 26,
    fontWeight: '800',
    color: '#222',
    flex: 1,
    textAlign: 'left',
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
  },
  addBtnWidget: {
    marginLeft: 8,
    borderRadius: 16,
    backgroundColor: '#222',
    padding: 6,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  backBtnWidget: {
    borderRadius: 16,
    backgroundColor: '#f2f2f7',
    padding: 2,
    marginRight: 8,
  },
  albumWidgetGrid: {
    padding: 18,
    paddingTop: 0,
  },
  albumWidgetCard: {
    backgroundColor: '#222',
    borderRadius: 18,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.13,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    overflow: 'hidden',
  },
  albumWidgetCoverBox: {
    width: '100%',
    aspectRatio: 2.8,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#333',
    justifyContent: 'flex-end',
  },
  albumWidgetCoverImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  albumWidgetCoverPlaceholder: {
    flex: 1,
    backgroundColor: '#444',
  },
  albumWidgetOverlay: {
    width: '100%',
    padding: 16,
    backgroundColor: 'rgba(34,34,34,0.82)',
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  albumWidgetTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
  },
  albumWidgetCount: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
  },
  emptyTextWidget: {
    textAlign: 'center',
    color: '#B0B0B0',
    marginTop: 40,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
  },
  // Modal
  modalOverlayWidget: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'flex-end',
  },
  modalSheetWidget: {
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
  modalHeaderWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 8,
  },
  modalTitleWidget: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    flex: 1,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
  },
  modalCloseBtnWidget: {
    marginLeft: 12,
    borderRadius: 20,
    backgroundColor: '#222',
    padding: 4,
  },
  formContainerWidget: {
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
  inputWidget: {
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    padding: 18,
    fontSize: 16,
    marginBottom: 18,
    color: '#222',
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
  },
  uploadBoxWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: '#222',
  },
  uploadTextWidget: {
    marginLeft: 10,
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
  },
  previewRowWidget: {
    flexDirection: 'row',
    marginBottom: 18,
    flexWrap: 'wrap',
  },
  previewImgWidget: {
    width: 64,
    height: 64,
    borderRadius: 14,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#E5E5EA',
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
  },
  createBtnWidget: {
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
  createBtnTextWidget: {
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
  // Add search bar and keyboard avoiding styles
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  searchBar: {
    flex: 1,
    fontSize: 16,
    color: '#222',
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
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
}); 