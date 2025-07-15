import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Image,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const EVENT_TYPES = ['Seminar', 'Workshop', 'Conference', 'Meetup'];

const AddEventScreen: React.FC = () => {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          {/* Removed back arrow */}
          <Text style={styles.headerTitle}>Add New Event</Text>
          <View style={{ width: 24 }} />
        </View>
        {/* Image Upload */}
        <Text style={styles.label}>Event Cover Image</Text>
        <TouchableOpacity style={styles.imageUploadBox} onPress={pickImage} activeOpacity={0.8}>
          {image ? (
            <Image source={{ uri: image }} style={styles.uploadedImage} />
          ) : (
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.uploadText}>Tap to upload an event image</Text>
              <Text style={styles.uploadSubText}>Supported formats: .jpg, .png</Text>
              <View style={styles.uploadBtn}><Text style={styles.uploadBtnText}>Upload</Text></View>
            </View>
          )}
        </TouchableOpacity>
        {/* Event Title */}
        <Text style={styles.label}>Event Title</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g.,  Data Science Bootcamp"
          placeholderTextColor="#8BA18C"
          value={title}
          onChangeText={setTitle}
        />
        {/* Event Type Dropdown */}
        <Text style={styles.label}>Event Type</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowTypeDropdown((v) => !v)}
          activeOpacity={0.8}
        >
          <Text style={[styles.dropdownText, !type && { color: '#8BA18C' }]}> {type || 'Select  Event  Type'} </Text>
        </TouchableOpacity>
        {showTypeDropdown && (
          <View style={styles.dropdownMenu}>
            {EVENT_TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                style={styles.dropdownItem}
                onPress={() => {
                  setType(t);
                  setShowTypeDropdown(false);
                }}
              >
                <Text style={styles.dropdownText}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {/* Event Date */}
        <Text style={styles.label}>Event Date</Text>
        <TextInput
          style={styles.input}
          placeholder="Select  date"
          placeholderTextColor="#8BA18C"
          value={date}
          onChangeText={setDate}
        />
        {/* Event Time */}
        <Text style={styles.label}>Event Time</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g.,  09:00 AM – 11:00 AM"
          placeholderTextColor="#8BA18C"
          value={time}
          onChangeText={setTime}
        />
        {/* Location */}
        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g.,  SNB HQ Auditorium"
          placeholderTextColor="#8BA18C"
          value={location}
          onChangeText={setLocation}
        />
        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
          placeholder="Brief description of the event"
          placeholderTextColor="#8BA18C"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        {/* Create Event Button */}
        <Pressable style={styles.createBtn} onPress={() => {}}>
          <Text style={styles.createBtnText}>Create Event</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#fff',
    paddingBottom: 24,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    flex: 1,
    textAlign: 'center',
    marginLeft: -24,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 15,
    marginTop: 16,
    marginBottom: 6,
    color: '#222',
  },
  imageUploadBox: {
    borderWidth: 1,
    borderColor: '#D6E3D7',
    borderStyle: 'dashed',
    borderRadius: 12,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: '#FAFCFA',
  },
  uploadText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#222',
    textAlign: 'center',
    marginBottom: 4,
  },
  uploadSubText: {
    color: '#888',
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'center',
  },
  uploadBtn: {
    backgroundColor: '#F3F5F2',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 6,
    alignItems: 'center',
  },
  uploadBtnText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 15,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    resizeMode: 'cover',
  },
  input: {
    backgroundColor: '#F3F5F2',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 15,
    color: '#222',
    marginBottom: 0,
  },
  dropdownText: {
    fontSize: 15,
    color: '#222',
  },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 2,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#D6E3D7',
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  createBtn: {
    backgroundColor: '#4ECB71',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  createBtnText: {
    color: '#111',
    fontWeight: 'bold',
    fontSize: 17,
  },
});

export default AddEventScreen; 