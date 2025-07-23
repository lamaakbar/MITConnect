import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert, Image, FlatList, TouchableOpacity, Keyboard, KeyboardAvoidingView, Platform, ScrollView, Dimensions, Modal, ActivityIndicator, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTheme } from '../components/ThemeContext';
import AdminTabBar from '../components/AdminTabBar';
import AdminHeader from '../components/AdminHeader';

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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [highlights, setHighlights] = useState<Array<{title: string, description: string, image: string | null}>>([
    {
      title: 'Team Building Event',
      description: 'A fun day with the team! 🎉',
      image: 'https://via.placeholder.com/300x200.png?text=Highlight+1',
    },
    {
      title: 'Product Launch',
      description: 'Launching our new app 🚀',
      image: 'https://via.placeholder.com/300x200.png?text=Highlight+2',
    },
    {
      title: 'Award Ceremony',
      description: 'Celebrating our achievements 🏆',
      image: 'https://via.placeholder.com/300x200.png?text=Highlight+3',
    },
    {
      title: 'Hackathon',
      description: 'Innovating together 💡',
      image: 'https://via.placeholder.com/300x200.png?text=Highlight+4',
    },
  ]);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Add form state for Add Modal
  const [addTitle, setAddTitle] = useState('');
  const [addDescription, setAddDescription] = useState('');
  const [addImage, setAddImage] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);

  // Edit form state for Edit Modal
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImage, setEditImage] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const numColumns = Dimensions.get('window').width > 500 ? 3 : 2;

  const pickImage = async (setImageFn: (uri: string) => void) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageFn(result.assets[0].uri);
    }
  };

  // Add Modal Handlers
  const handleAddSubmit = () => {
    setAddLoading(true);
    setTimeout(() => {
      setAddLoading(false);
      if (!addTitle || !addDescription) {
        Alert.alert('Error', 'Please fill in all fields.');
        return;
      }
      setHighlights(prev => [...prev, { title: addTitle, description: addDescription, image: addImage }]);
      setAddTitle('');
      setAddDescription('');
      setAddImage(null);
      setShowAddModal(false);
    }, 800);
  };

  // Edit Modal Handlers
  const openEditModal = (idx: number) => {
    const h = highlights[idx];
    setEditTitle(h.title);
    setEditDescription(h.description);
    setEditImage(h.image);
    setEditIndex(idx);
    setShowEditModal(true);
  };
  const handleEditSubmit = () => {
    setEditLoading(true);
    setTimeout(() => {
      setEditLoading(false);
      if (!editTitle || !editDescription) {
        Alert.alert('Error', 'Please fill in all fields.');
        return;
      }
      setHighlights(prev => prev.map((h, i) => i === editIndex ? { title: editTitle, description: editDescription, image: editImage } : h));
      setShowEditModal(false);
      setEditIndex(null);
    }, 800);
  };

  // Add this function for deleting from the Edit modal
  const handleDeleteHighlight = () => {
    if (editIndex !== null) {
      setHighlights(prev => prev.filter((_, i) => i !== editIndex));
      setShowEditModal(false);
      setEditIndex(null);
    }
  };

  const handleInputSubmit = () => {
    Keyboard.dismiss();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }}>
      <AdminHeader title="" showBackButton={true} />

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
            <Text style={[styles.label, { color: textColor }]}>Description</Text>
            <TextInput
              style={[styles.input, styles.textarea, { color: textColor, backgroundColor: searchBackground, borderColor }]}
              placeholder="Description..."
              placeholderTextColor={secondaryTextColor}
              value={addDescription}
              onChangeText={setAddDescription}
              multiline
              numberOfLines={4}
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
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Edit Description..."
              value={editDescription}
              onChangeText={setEditDescription}
              multiline
              numberOfLines={4}
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
        contentContainerStyle={{ gap: 20, paddingBottom: 40, paddingHorizontal: 8, flexGrow: 1 }}
        columnWrapperStyle={{ gap: 16, justifyContent: 'space-between', flexWrap: 'wrap' }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={[styles.container, { backgroundColor }]}>
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
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Highlights List</Text>
              <Text style={[styles.sectionSubtitle, { color: secondaryTextColor }]}>Your current highlights</Text>
            </View>
            {highlights.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="images-outline" size={48} color={secondaryTextColor} />
                <Text style={[styles.emptyStateText, { color: secondaryTextColor }]}>No highlights submitted yet</Text>
                <Text style={[styles.emptyStateSubtext, { color: secondaryTextColor }]}>Add your first highlight to get started</Text>
              </View>
            )}
          </View>
        }
        renderItem={({ item, index }) => (
                      <View style={[styles.highlightCard, { backgroundColor: cardBackground, borderColor }]}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.highlightImg} resizeMode="cover" />
            ) : (
              <View style={[styles.highlightImg, { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }]}> 
                <Ionicons name="image" size={32} color="#bbb" />
              </View>
            )}
                          <Text style={[styles.highlightTitle, { color: textColor }]} numberOfLines={1}>{item.title}</Text>
              <Text style={[styles.highlightDesc, { color: secondaryTextColor }]} numberOfLines={2}>{item.description}</Text>
                          <View style={styles.highlightActions}>
                <TouchableOpacity onPress={() => openEditModal(index)} style={[styles.actionBtn, { backgroundColor: searchBackground }]} activeOpacity={0.7}>
                  <Ionicons name="create" size={18} color="#3CB371" />
                </TouchableOpacity>
              </View>
          </View>
        )}
      />
      
      {/* Bottom Tab Bar */}
      <AdminTabBar activeTab="highlights" isDarkMode={isDarkMode} />
    </KeyboardAvoidingView>
  </SafeAreaView>
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

  headerSubtitle: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  sectionHeader: {
    marginTop: 32,
    marginBottom: 20,
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
  highlightImg: {
    width: '100%',
    height: 100,
    borderRadius: 16,
    marginBottom: 12,
    maxWidth: 150,
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
  highlightDesc: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
    maxWidth: '100%',
    lineHeight: 20,
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
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
}); 
