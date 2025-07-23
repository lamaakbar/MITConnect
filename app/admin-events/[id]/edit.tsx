import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import AdminHeader from '../../../components/AdminHeader';

const EVENT_TYPES = ['Seminar', 'Workshop', 'Conference', 'Meetup'];

const mockEvent = {
  id: '1',
  title: 'Technology Table Tennis',
  type: 'MITC',
  category: 'Workshop',
  date: '2025-07-22',
  time: '12:00 PM - 1:00 PM',
  location: 'MITC, Jeddah',
  description: 'A fun table tennis event with a tech twist!',
  organizer: 'John Doe',
  maxCapacity: 30,
  status: 'upcoming',
  featured: false,
  tags: ['technology', 'sports', 'fun'],
  requirements: ['Basic knowledge', 'Comfortable clothes'],
  materials: ['Rackets provided', 'Balls provided'],
  coverImage: require('../../../assets/images/partial-react-logo.png'),
};

const EditEventScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  // In a real app, fetch event by id
  const event = mockEvent;

  const [image, setImage] = useState<string | null>(null);
  const [title, setTitle] = useState(event.title);
  const [type, setType] = useState(event.type);
  const [category, setCategory] = useState(event.category);
  const [date, setDate] = useState(event.date);
  const [time, setTime] = useState(event.time);
  const [location, setLocation] = useState(event.location);
  const [description, setDescription] = useState(event.description);
  const [organizer, setOrganizer] = useState(event.organizer);
  const [maxCapacity, setMaxCapacity] = useState(event.maxCapacity.toString());
  const [status, setStatus] = useState(event.status);
  const [featured, setFeatured] = useState(event.featured);
  const [tags, setTags] = useState(event.tags.join(', '));
  const [requirements, setRequirements] = useState(event.requirements.join(', '));
  const [materials, setMaterials] = useState(event.materials.join(', '));
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
    <View style={styles.container}>
      <AdminHeader title="Edit Event" />
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Image Upload */}
        <Text style={styles.label}>Event Cover Image</Text>
        <TouchableOpacity style={styles.imageUploadBox} onPress={pickImage} activeOpacity={0.8}>
          {image ? (
            <Image source={{ uri: image }} style={styles.uploadedImage} />
          ) : (
            <Image source={event.coverImage} style={styles.uploadedImage} />
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
        {/* Event Type Input */}
        <Text style={styles.label}>Event Type</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter event type (e.g., Workshop, Seminar, Conference, etc.)"
          placeholderTextColor="#8BA18C"
          value={type}
          onChangeText={setType}
        />
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
        
        {/* Category */}
        <Text style={styles.label}>Category</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Workshop, Seminar, Conference, etc."
          placeholderTextColor="#8BA18C"
          value={category}
          onChangeText={setCategory}
        />
        
        {/* Organizer */}
        <Text style={styles.label}>Organizer</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., John Doe"
          placeholderTextColor="#8BA18C"
          value={organizer}
          onChangeText={setOrganizer}
        />
        
        {/* Max Capacity */}
        <Text style={styles.label}>Maximum Capacity</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 50"
          placeholderTextColor="#8BA18C"
          value={maxCapacity}
          onChangeText={setMaxCapacity}
          keyboardType="numeric"
        />
        
        {/* Status */}
        <Text style={styles.label}>Status</Text>
        <View style={styles.pickerContainer}>
          <TouchableOpacity
            style={[styles.pickerOption, status === 'upcoming' && styles.pickerOptionSelected]}
            onPress={() => setStatus('upcoming')}
          >
            <Text style={[styles.pickerOptionText, status === 'upcoming' && styles.pickerOptionTextSelected]}>
              Upcoming
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pickerOption, status === 'ongoing' && styles.pickerOptionSelected]}
            onPress={() => setStatus('ongoing')}
          >
            <Text style={[styles.pickerOptionText, status === 'ongoing' && styles.pickerOptionTextSelected]}>
              Ongoing
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pickerOption, status === 'completed' && styles.pickerOptionSelected]}
            onPress={() => setStatus('completed')}
          >
            <Text style={[styles.pickerOptionText, status === 'completed' && styles.pickerOptionTextSelected]}>
              Completed
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Featured Event */}
        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            style={[styles.checkbox, featured && styles.checkboxChecked]}
            onPress={() => setFeatured(!featured)}
          >
            {featured && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          <Text style={styles.checkboxLabel}>Featured Event</Text>
        </View>
        
        {/* Tags */}
        <Text style={styles.label}>Tags (comma-separated)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., technology, workshop, beginners"
          placeholderTextColor="#8BA18C"
          value={tags}
          onChangeText={setTags}
        />
        
        {/* Requirements */}
        <Text style={styles.label}>Requirements (comma-separated)</Text>
        <TextInput
          style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
          placeholder="e.g., Basic programming knowledge, Laptop"
          placeholderTextColor="#8BA18C"
          value={requirements}
          onChangeText={setRequirements}
          multiline
        />
        
        {/* Materials */}
        <Text style={styles.label}>Materials (comma-separated)</Text>
        <TextInput
          style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
          placeholder="e.g., Notebook, Pen, Handouts"
          placeholderTextColor="#8BA18C"
          value={materials}
          onChangeText={setMaterials}
          multiline
        />
        
        {/* Save Event Button */}
        <Pressable style={styles.createBtn} onPress={() => {}}>
          <Text style={styles.createBtnText}>Save Event</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  pickerContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  pickerOption: {
    flex: 1,
    backgroundColor: '#F3F5F2',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D6E3D7',
  },
  pickerOptionSelected: {
    backgroundColor: '#4ECB71',
    borderColor: '#4ECB71',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#222',
    fontWeight: '500',
  },
  pickerOptionTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D6E3D7',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4ECB71',
    borderColor: '#4ECB71',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#222',
    fontWeight: '500',
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

export default EditEventScreen; 