import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert, Image, FlatList, TouchableOpacity, Keyboard, KeyboardAvoidingView, Platform, ScrollView, Dimensions, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';

export default function HighlightManagement() {
  const navigation = typeof useNavigation === 'function' ? useNavigation() : { goBack: () => {} };
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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F8F9F9' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      {/* Add Highlight Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.infoTitle}>Add Highlight</Text>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Add your Title..."
              value={addTitle}
              onChangeText={setAddTitle}
              returnKeyType="done"
              onSubmitEditing={handleInputSubmit}
              blurOnSubmit
            />
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Description..."
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
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
        contentContainerStyle={{ gap: 16, paddingBottom: 40, paddingHorizontal: 20 }}
        columnWrapperStyle={{ gap: 16, justifyContent: 'flex-start' }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.container}>
            <View style={styles.headerRow}>
              <Feather name="map-pin" size={24} color="#3CB371" style={{ marginRight: 8 }} />
              <Text style={styles.headerTitle}>Weekly Highlight</Text>
            </View>
            <Text style={styles.headerSubtitle}>Manage and submit weekly highlights</Text>
            {/* Add New Highlight Button */}
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)} activeOpacity={0.85}>
              <Feather name="plus" size={18} color="#fff" />
              <Text style={styles.addBtnText}>Add New Highlight</Text>
            </TouchableOpacity>
            {/* Highlights List (always visible) */}
            <Text style={[styles.infoTitle, { marginTop: 24, marginBottom: 8 }]}>Highlights List</Text>
            {highlights.length === 0 && (
              <Text style={{ color: '#888', textAlign: 'center', marginTop: 12 }}>No highlights submitted yet.</Text>
            )}
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={styles.highlightCard}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.highlightImg} resizeMode="cover" />
            ) : (
              <View style={[styles.highlightImg, { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }]}> 
                <Feather name="image" size={32} color="#bbb" />
              </View>
            )}
            <Text style={styles.highlightTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.highlightDesc} numberOfLines={2}>{item.description}</Text>
            <View style={styles.highlightActions}>
              <TouchableOpacity onPress={() => openEditModal(index)} style={styles.actionBtn} activeOpacity={0.7}>
                <Feather name="edit" size={18} color="#3CB371" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9F9',
    padding: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 18,
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
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    flex: 1,
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    minWidth: 140,
    maxWidth: 220,
  },
  highlightImg: {
    width: 140,
    height: 100,
    borderRadius: 12,
    marginBottom: 8,
  },
  highlightTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#222',
    marginBottom: 2,
    textAlign: 'center',
    maxWidth: 140,
  },
  highlightDesc: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
    textAlign: 'center',
    maxWidth: 140,
  },
  highlightActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 2,
  },
  actionBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F2F4F7',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3CB371',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
    shadowColor: '#3CB371',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 3,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    marginLeft: 10,
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
}); 