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
    Alert,
    ActivityIndicator,
} from 'react-native';
import DatePickerModal from '../../components/DatePickerModal';
import TimePickerModal from '../../components/TimePickerModal';
import eventService from '../../services/EventService';
import { Event, EventStatus } from '../../types/events';
import { uploadImageFromLibrary } from '../../services/imageUploadService';
import { formatDateToYYYYMMDD } from '../../utils/dateUtils';

const EVENT_TYPES = ['Seminar', 'Workshop', 'Conference', 'Meetup'];

const AddEventScreen: React.FC = () => {
  const router = useRouter();
  
  // Form state - completely admin-driven
  const [image, setImage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('MITC');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('');
  const [status, setStatus] = useState('upcoming');
  const [featured, setFeatured] = useState(false);
  const [tags, setTags] = useState('');
  const [requirements, setRequirements] = useState('');
  const [materials, setMaterials] = useState('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Date and Time Picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());

  const pickImage = async () => {
    try {
      setUploadingImage(true);
      
      // Upload image to Supabase first
      const uploadedImageUrl = await uploadImageFromLibrary('event-images', 'event-covers');
      
      if (uploadedImageUrl) {
        setImageUrl(uploadedImageUrl);
        setImage(uploadedImageUrl); // For display
        console.log('✅ Image uploaded successfully:', uploadedImageUrl);
      } else {
        Alert.alert('Error', 'Failed to upload image. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Date Picker Functions
  const openDatePicker = () => {
    console.log('openDatePicker called - setting showDatePicker to true');
    setShowDatePicker(true);
  };

  const onDateConfirm = (date: Date) => {
    setSelectedDate(date);
    // Format date as YYYY-MM-DD for database storage
    const formattedDate = formatDateToYYYYMMDD(date);
    setDate(formattedDate);
    setShowDatePicker(false);
    
    // Auto-update status based on date
    updateStatusBasedOnDate(date);
  };

  const onDateCancel = () => {
    setShowDatePicker(false);
  };

  // Time Picker Functions
  const openTimePicker = () => {
    console.log('openTimePicker called - setting showTimePicker to true');
    setShowTimePicker(true);
  };

  const onTimeConfirm = (time: Date) => {
    setSelectedTime(time);
    const formattedTime = time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    setTime(formattedTime);
    setShowTimePicker(false);
  };

  const onTimeCancel = () => {
    setShowTimePicker(false);
  };

  // Auto-update status based on event date
  const updateStatusBasedOnDate = (eventDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
    
    const eventDateOnly = new Date(eventDate);
    eventDateOnly.setHours(0, 0, 0, 0);
    
    const newStatus = eventDateOnly >= today ? 'upcoming' : 'past';
    setStatus(newStatus);
  };

  // Create event function
  const createEvent = async () => {
    if (!title || !date || !time || !location || !description) {
      Alert.alert('Validation Error', 'Please fill in all required fields (Title, Date, Time, Location, Description)');
      return;
    }

    try {
      setSaving(true);

      // Prepare event data for creation
      const eventData: Omit<Event, 'id'> = {
        title: title.trim(),
        type: type as any,
        category: category as any,
        date: date,
        time: time,
        location: location.trim(),
        description: description.trim(),
        organizer: organizer.trim(),
        maxCapacity: maxCapacity ? parseInt(maxCapacity) || 0 : 0,
        status: status as EventStatus,
        featured: featured,
        tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        requirements: requirements ? requirements.split(',').map(req => req.trim()).filter(req => req) : [],
        materials: materials ? materials.split(',').map(mat => mat.trim()).filter(mat => mat) : [],
        coverImage: imageUrl || undefined, // Use imageUrl for the cover image
        image: imageUrl ? { uri: imageUrl } : require('../../assets/images/splash-icon.png'),
        registeredCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Create event in database using EventService
      const createdEvent = await eventService.createEvent(eventData);
      
      if (createdEvent) {
        Alert.alert('Success', 'Event created successfully!', [
          { text: 'OK', onPress: () => router.push('/admin-events') }
        ]);
      } else {
        Alert.alert('Error', 'Failed to create event. Please try again.');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Add New Event</Text>
        </View>
        
        {/* Image Upload */}
        <Text style={styles.label}>Event Cover Image</Text>
        <TouchableOpacity 
          style={styles.imageUploadBox} 
          onPress={pickImage} 
          activeOpacity={0.8}
          disabled={uploadingImage}
        >
          {uploadingImage ? (
            <View style={{ alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#43C6AC" />
              <Text style={styles.uploadText}>Uploading image...</Text>
            </View>
          ) : image ? (
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
        <Text style={styles.label}>Event Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Data Science Bootcamp"
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
        <Text style={styles.label}>Event Date *</Text>
        <TouchableOpacity 
          style={styles.input} 
          onPress={openDatePicker} 
          activeOpacity={0.7}
        >
          <Text style={date ? styles.inputText : styles.placeholderText}>
            {date || 'Select date'}
          </Text>
        </TouchableOpacity>
        
        {/* Event Time */}
        <Text style={styles.label}>Event Time *</Text>
        <TouchableOpacity 
          style={styles.input} 
          onPress={openTimePicker} 
          activeOpacity={0.7}
        >
          <Text style={time ? styles.inputText : styles.placeholderText}>
            {time || 'Select time'}
          </Text>
        </TouchableOpacity>
        
        {/* Location */}
        <Text style={styles.label}>Location *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., SNB HQ Auditorium"
          placeholderTextColor="#8BA18C"
          value={location}
          onChangeText={setLocation}
        />
        
        {/* Description */}
        <Text style={styles.label}>Description *</Text>
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
        
        {/* Status (Auto-updated based on date) */}
        <Text style={styles.label}>Status (Auto-updated based on date)</Text>
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
          <TouchableOpacity
            style={[styles.pickerOption, status === 'past' && styles.pickerOptionSelected]}
            onPress={() => setStatus('past')}
          >
            <Text style={[styles.pickerOptionText, status === 'past' && styles.pickerOptionTextSelected]}>
              Past
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
        
        {/* Create Event Button */}
        <Pressable 
          style={[styles.createBtn, saving && styles.createBtnDisabled]} 
          onPress={createEvent}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.createBtnText}>Create Event</Text>
          )}
        </Pressable>
      </View>

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={showDatePicker}
        onClose={onDateCancel}
        onConfirm={onDateConfirm}
        initialDate={selectedDate}
        title="Select Event Date"
      />

      {/* Time Picker Modal */}
      <TimePickerModal
        visible={showTimePicker}
        onClose={onTimeCancel}
        onConfirm={onTimeConfirm}
        initialTime={selectedTime}
        title="Select Event Time"
      />
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
  inputText: {
    fontSize: 15,
    color: '#222',
  },
  placeholderText: {
    fontSize: 15,
    color: '#8BA18C',
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
    flexWrap: 'wrap',
  },
  pickerOption: {
    flex: 1,
    minWidth: '45%',
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
  createBtnDisabled: {
    backgroundColor: '#ccc',
  },
  createBtnText: {
    color: '#111',
    fontWeight: 'bold',
    fontSize: 17,
  },
});

export default AddEventScreen; 