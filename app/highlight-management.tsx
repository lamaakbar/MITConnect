import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert, Image, FlatList, TouchableOpacity, Keyboard, KeyboardAvoidingView, Platform, ScrollView, Dimensions, Modal, ActivityIndicator, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTheme } from '../components/ThemeContext';

import AdminHeader from '../components/AdminHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { supabase, fetchHighlights, addHighlight, updateHighlight, deleteHighlight } from '../services/supabase';
import mime from 'mime';
import { decode } from 'base64-arraybuffer';

type Highlight = {
  id: string;
  title: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export default function HighlightManagement() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  const borderColor = isDarkMode ? '#2A2A2A' : '#E0E0E0';
  const searchBackground = isDarkMode ? '#2A2A2A' : '#F2F4F7';
  const modalBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const overlayBackground = isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.3)';
  
  // State management
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Add form state for Add Modal
  const [addTitle, setAddTitle] = useState('');
  const [addImage, setAddImage] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);

  // Edit form state for Edit Modal
  const [editTitle, setEditTitle] = useState('');
  const [editImage, setEditImage] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const numColumns = Dimensions.get('window').width > 600 ? 4 : Dimensions.get('window').width > 400 ? 3 : 2;

  // Image upload function
  const uploadImageToSupabase = async (uri: string): Promise<string | null> => {
    try {
      const ext = uri.split('.').pop() || 'jpg';
      const fileName = `highlight-${Date.now()}.${ext}`;
      const mimeType = mime.getType(uri) || 'image/jpeg';

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert to ArrayBuffer
      const fileBuffer = decode(base64);

      // Upload as binary
      const { data, error } = await supabase.storage
        .from("highlight-images")
        .upload(fileName, fileBuffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (error) {
        console.error("❌ Upload error:", error.message);
        return null;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from("highlight-images")
        .getPublicUrl(data.path);

      console.log("✅ Final image public URL:", publicUrl);
      return publicUrl;
    } catch (error) {
      console.error("❌ Unexpected upload error:", error);
      return null;
    }
  };

  // Load highlights from Supabase
  const loadHighlights = async () => {
    try {
      setRefreshing(true);
      const data = await fetchHighlights();
      console.log("✅ Highlights fetched from DB:", data);
      setHighlights(data);
    } catch (error) {
      console.error('Error loading highlights:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHighlights();
  }, []);

  const pickImage = async (setImageFn: (uri: string) => void) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      // Note: MediaTypeOptions.Images is deprecated but still works in expo-image-picker v16.1.4
      // TODO: Update to MediaType.Images when upgrading to newer version
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageFn(result.assets[0].uri);
    }
  };

  // Add Modal Handlers
  const handleAddSubmit = async () => {
    if (!addTitle) {
      Alert.alert('Error', 'Please enter a title.');
      return;
    }

    setAddLoading(true);
    try {
      let uploadedUrl: string | null = null;
      if (addImage) {
        console.log('Starting image upload for:', addImage);
        uploadedUrl = await uploadImageToSupabase(addImage);
        console.log('Upload result:', uploadedUrl);
      }

      console.log('Adding highlight with URL:', uploadedUrl);
      await addHighlight(addTitle, uploadedUrl);
      console.log('Highlight added successfully');
      await loadHighlights();
      setShowAddModal(false);
      setAddTitle('');
      setAddImage(null);
    } catch (error) {
      console.error('Error in handleAddSubmit:', error);
      Alert.alert('Error', 'Failed to add highlight.');
    } finally {
      setAddLoading(false);
    }
  };

  // Edit Modal Handlers
  const openEditModal = (idx: number) => {
    const h = highlights[idx];
    setEditTitle(h.title);
    setEditImage(h.image_url);
    setEditIndex(idx);
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (editIndex === null || !editTitle) {
      Alert.alert('Error', 'Please enter a title.');
      return;
    }

    const id = highlights[editIndex].id;
    setEditLoading(true);

    try {
      let uploadedUrl = highlights[editIndex].image_url;
      if (editImage && editImage !== uploadedUrl) {
        uploadedUrl = await uploadImageToSupabase(editImage);
      }

      await updateHighlight(id, editTitle, uploadedUrl);
      await loadHighlights();
      setShowEditModal(false);
      setEditIndex(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update highlight.');
    } finally {
      setEditLoading(false);
    }
  };

  // Delete highlight function
  const handleDeleteHighlight = async () => {
    if (editIndex === null) return;
    const id = highlights[editIndex].id;

    try {
      await deleteHighlight(id);
      await loadHighlights();
      setShowEditModal(false);
      setEditIndex(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete highlight.');
    }
  };

  const handleInputSubmit = () => {
    Keyboard.dismiss();
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
            fontSize: 18,
            fontWeight: 'bold',
            letterSpacing: 0.5,
            color: isDarkMode ? '#fff' : '#222',
            textAlign: 'center',
          }}>Highlight Management</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
      {/* Add Highlight Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: overlayBackground }]}>
          <View style={[styles.modalContent, { backgroundColor: modalBackground }]}>
            <Text style={[styles.infoTitle, { color: textColor }]}>Add Highlight</Text>
            <Text style={[styles.label, { color: textColor }]}>Title</Text>
            <TextInput
              style={[styles.input, { color: textColor, backgroundColor: searchBackground, borderColor }]}
              placeholder="Add your Title..."
              placeholderTextColor={secondaryTextColor}
              value={addTitle}
              onChangeText={setAddTitle}
              returnKeyType="done"
              onSubmitEditing={handleInputSubmit}
              blurOnSubmit
            />

            <Text style={styles.label}>Picture</Text>
            <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage(setAddImage)} activeOpacity={0.85}>
              <Text style={styles.uploadBtnText}>{addImage ? 'Change Picture' : 'Upload Picture'}</Text>
            </TouchableOpacity>
            {addImage && (
              <Image source={{ uri: addImage }} style={styles.previewImg} resizeMode="cover" />
            )}
            <Pressable style={styles.button} onPress={handleAddSubmit} disabled={addLoading}>
              <Text style={styles.buttonText}>{addLoading ? 'Submitting...' : 'Submit'}</Text>
            </Pressable>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Edit Highlight Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: overlayBackground }]}>
          <View style={[styles.modalContent, { backgroundColor: modalBackground }]}>
            <Text style={styles.infoTitle}>Edit Highlight</Text>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Edit Title..."
              value={editTitle}
              onChangeText={setEditTitle}
              returnKeyType="done"
              onSubmitEditing={handleInputSubmit}
              blurOnSubmit
            />

            <Text style={styles.label}>Picture</Text>
            <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage(setEditImage)} activeOpacity={0.85}>
              <Text style={styles.uploadBtnText}>{editImage ? 'Change Picture' : 'Upload Picture'}</Text>
            </TouchableOpacity>
            {editImage && (
              <Image source={{ uri: editImage }} style={styles.previewImg} resizeMode="cover" />
            )}
            <Pressable style={styles.button} onPress={handleEditSubmit} disabled={editLoading}>
              <Text style={styles.buttonText}>{editLoading ? 'Saving...' : 'Save'}</Text>
            </Pressable>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteHighlight}>
              <Text style={styles.deleteBtnText}>Delete Highlight</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowEditModal(false); setEditIndex(null); }}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <FlatList
        data={highlights}
        keyExtractor={(_, idx) => idx.toString()}
        numColumns={numColumns}
        contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 8, flexGrow: 1 }}
        columnWrapperStyle={{ gap: 12, justifyContent: 'space-between', flexWrap: 'wrap' }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={[styles.containerNoBottomPadding, { backgroundColor }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="location" size={24} color="#3CB371" style={{ marginRight: 8 }} />
              <Text style={[styles.sectionTitle, { color: textColor }]}>Weekly Highlight</Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: secondaryTextColor }]}>Manage and submit weekly highlights</Text>
            {/* Add New Highlight Button */}
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)} activeOpacity={0.85}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.addBtnText}>Add New Highlight</Text>
            </TouchableOpacity>
            
            {/* Highlights List Section */}
            <View style={styles.sectionHeaderTight}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Highlights List</Text>
              <Text style={[styles.sectionSubtitle, { color: secondaryTextColor }]}>Your current highlights</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={48} color={secondaryTextColor} />
            <Text style={[styles.emptyStateText, { color: secondaryTextColor }]}>No highlights submitted yet</Text>
            <Text style={[styles.emptyStateSubtext, { color: secondaryTextColor }]}>Add your first highlight to get started</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          // Debug logging to check image_url
          console.log(`Highlight ${index}:`, { 
            id: item.id, 
            title: item.title, 
            image_url: item.image_url,
            hasImage: !!item.image_url 
          });
          console.log("📸 Rendering highlight:", item.title, "URL:", item.image_url);
          
          return (
            <View style={[styles.highlightCardCompact, { backgroundColor: cardBackground, borderColor }]}>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.highlightImgCompact} resizeMode="cover" />
              ) : (
                <View style={[styles.highlightImgCompact, { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }]}> 
                  <Ionicons name="image" size={24} color="#bbb" />
                </View>
              )}
              <Text style={[styles.highlightTitleCompact, { color: textColor }]} numberOfLines={1}>{item.title}</Text>
              <Text style={[styles.highlightDescCompact, { color: secondaryTextColor }]} numberOfLines={2}>{item.description}</Text>
              <TouchableOpacity onPress={() => openEditModal(index)} style={[styles.actionBtnCompact, { backgroundColor: searchBackground }]} activeOpacity={0.7}>
                <Ionicons name="create" size={16} color="#3CB371" />
              </TouchableOpacity>
            </View>
          );
        }}
      />
      
      {/* Bottom Tab Bar */}
      
    </KeyboardAvoidingView>
  </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
    paddingBottom: 100,
    minHeight: '100%',
  },
  containerNoBottomPadding: {
    flex: 1,
    padding: 16,
    paddingBottom: 0,
    minHeight: '100%',
  },

  headerSubtitle: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  sectionHeader: {
    marginTop: 32,
    marginBottom: 20,
  },
  sectionHeaderCompact: {
    marginTop: 16,
    marginBottom: 0,
  },
  sectionHeaderTight: {
    marginTop: 12,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  infoTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
    color: '#222',
  },
  label: {
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 10,
    marginBottom: 4,
    color: '#222',
  },
  input: {
    backgroundColor: '#F4F6F7',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E5E7E9',
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#5AC8FA',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#5AC8FA',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  uploadBtn: {
    backgroundColor: '#E5E7E9',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  uploadBtnText: {
    color: '#3CB371',
    fontWeight: 'bold',
    fontSize: 15,
  },
  previewImg: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 8,
  },
  highlightCard: {
    borderRadius: 20,
    padding: 18,
    flex: 1,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    minWidth: 140,
    maxWidth: 280,
    borderWidth: 1,
    minHeight: 180,
    flexGrow: 1,
  },
  highlightCardCompact: {
    borderRadius: 12,
    padding: 12,
    flex: 1,
    marginBottom: 12,
    marginTop: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    minWidth: 120,
    maxWidth: 200,
    borderWidth: 1,
    minHeight: 140,
    flexGrow: 1,
  },
  highlightImg: {
    width: '100%',
    height: 100,
    borderRadius: 16,
    marginBottom: 12,
    maxWidth: 150,
  },
  highlightImgCompact: {
    width: '100%',
    height: 70,
    borderRadius: 10,
    marginBottom: 8,
    maxWidth: 120,
  },
  highlightTitle: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4,
    textAlign: 'center',
    maxWidth: '100%',
    lineHeight: 22,
    flexShrink: 1,
  },
  highlightTitleCompact: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 3,
    textAlign: 'center',
    maxWidth: '100%',
    lineHeight: 18,
    flexShrink: 1,
  },
  highlightDesc: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
    maxWidth: '100%',
    lineHeight: 20,
    flexShrink: 1,
  },
  highlightDescCompact: {
    fontSize: 12,
    marginBottom: 6,
    textAlign: 'center',
    maxWidth: '100%',
    lineHeight: 16,
    flexShrink: 1,
  },
  highlightActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F2F4F7',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  actionBtnCompact: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F2F4F7',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginTop: 4,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3CB371',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 28,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 12,
    shadowColor: '#3CB371',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
    minWidth: 200,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 12,
  },
  cancelBtn: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelBtnText: {
    color: '#E74C3C',
    fontWeight: 'bold',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  deleteBtn: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#FDEDEC',
    borderRadius: 10,
  },
  deleteBtnText: {
    color: '#E74C3C',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
    opacity: 0.7,
  },
});
