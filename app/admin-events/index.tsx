import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Pressable,
  ActivityIndicator,
  Platform,
  Alert,
  KeyboardAvoidingView,
  Keyboard,
  ToastAndroid,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import AdminTabBar from '../../components/AdminTabBar';

// Mock data for events
const mockEvents = [
  {
    id: '1',
    title: 'Technology Table Tennis',
    type: 'Workshop',
    date: '2024-06-24',
    time: '12:00 PM',
    location: 'MITC, Grand floor',
    description: 'A fun table tennis event with a tech twist!',
    coverImage: require('../../assets/images/partial-react-logo.png'),
    featured: true,
    attendees: [
      { name: "Hassan Ahmed", email: "hassan.ahmed@email.com", status: "Confirmed" },
      { name: "Mona Khateeb", email: "mona.khateeb@email.com", status: "Confirmed" },
      { name: "Lama Akbar", email: "lama.akbar@email.com", status: "Canceled" },
      { name: "Youseef Naytah", email: "youseef.naytah@email.com", status: "Canceled" },
      { name: "Khalid Alkhaibari", email: "khalid.alkhaibari@email.com", status: "Confirmed" },
    ],
  },
  {
    id: '2',
    title: 'AI in Business Conference',
    type: 'Seminar',
    date: '2025-01-20',
    time: '8:00 AM',
    location: 'Digital Banking Center',
    description: 'Explore the future of AI in business.',
    coverImage: require('../../assets/images/react-logo.png'),
    featured: false,
    attendees: [
      { name: "Bayan Alsahafi", email: "bayan.alsahafi@email.com", status: "Confirmed" },
      { name: "Hadeel Kufiah", email: "hadeel.kufiah@email.com", status: "Confirmed" },
      { name: "Hassan Ahmed", email: "hassan.ahmed@email.com", status: "Canceled" },
      { name: "Mona Khateeb", email: "mona.khateeb@email.com", status: "Canceled" },
      { name: "Lama Akbar", email: "lama.akbar@email.com", status: "Confirmed" },
    ],
  },
  {
    id: '3',
    title: 'Design Thinking Workshop',
    type: 'Workshop',
    date: '2024-12-05',
    time: '10:00 AM',
    location: 'MITC',
    description: 'Hands-on workshop on design thinking.',
    coverImage: require('../../assets/images/splash-icon.png'),
    featured: false,
    attendees: [
      { name: "Youseef Naytah", email: "youseef.naytah@email.com", status: "Confirmed" },
      { name: "Khalid Alkhaibari", email: "khalid.alkhaibari@email.com", status: "Canceled" },
      { name: "Bayan Alsahafi", email: "bayan.alsahafi@email.com", status: "Confirmed" },
      { name: "Hadeel Kufiah", email: "hadeel.kufiah@email.com", status: "Canceled" },
      { name: "Hassan Ahmed", email: "hassan.ahmed@email.com", status: "Confirmed" },
    ],
  },
];

const FILTERS = ['All', 'Upcoming', 'Past'];

const AdminEventListScreen: React.FC = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  const borderColor = isDarkMode ? '#2A2A2A' : '#E0E0E0';
  const searchBackground = isDarkMode ? '#2A2A2A' : '#F2F4F7';
  const modalBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const overlayBackground = isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.3)';
  
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [events, setEvents] = useState(mockEvents);
  const [showAddModal, setShowAddModal] = useState(false);
  // Add Event form state
  const [addImage, setAddImage] = useState<string | null>(null);
  const [addTitle, setAddTitle] = useState('');
  const [addType, setAddType] = useState('');
  const [addDate, setAddDate] = useState('');
  const [addTime, setAddTime] = useState('');
  const [addLocation, setAddLocation] = useState('');
  const [addDescription, setAddDescription] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  // Add Edit Event modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editImage, setEditImage] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [showEditTypeDropdown, setShowEditTypeDropdown] = useState(false);

  const [showAttendeesModal, setShowAttendeesModal] = useState(false);
  const [attendeesSearch, setAttendeesSearch] = useState('');
  // Add state for attendeeStatus
  const [attendeeStatus, setAttendeeStatus] = useState<'Confirmed' | 'Canceled'>('Confirmed');
  // Add state to track which event's attendees are being shown
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);

  // Filter events based on filter selection (mock logic)
  const featuredEvent = events.find((e) => e.featured);
  const filteredEvents = events.filter((e) => !e.featured);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      setAddImage(result.assets[0].uri);
    }
  };

  const handleAddEvent = () => {
    setAddLoading(true);
    setTimeout(() => {
      setAddLoading(false);
      if (!addTitle || !addType || !addDate || !addTime || !addLocation || !addDescription) {
        alert('Please fill in all fields.');
        return;
      }
      setEvents(prev => [
        ...prev,
        {
          id: (prev.length + 1).toString(),
          title: addTitle,
          type: addType,
          date: addDate,
          time: addTime,
          location: addLocation,
          description: addDescription,
          coverImage: addImage ? { uri: addImage } : require('../../assets/images/splash-icon.png'),
          featured: false,
          attendees: [], // Add an empty attendees array for new events
        },
      ]);
      setShowAddModal(false);
      setAddImage(null);
      setAddTitle('');
      setAddType('');
      setAddDate('');
      setAddTime('');
      setAddLocation('');
      setAddDescription('');
    }, 800);
  };

  // Open Edit Modal and populate fields
  const openEditModal = (idx: number) => {
    const e = filteredEvents[idx];
    setEditIndex(idx);
    setEditImage(e.coverImage?.uri || null);
    setEditTitle(e.title);
    setEditType(e.type);
    setEditDate(e.date);
    setEditTime(e.time);
    setEditLocation(e.location);
    setEditDescription(e.description);
    setShowEditModal(true);
  };

  // Handle Edit Save
  const handleEditSave = () => {
    setEditLoading(true);
    setTimeout(() => {
      setEditLoading(false);
      if (!editTitle || !editType || !editDate || !editTime || !editLocation || !editDescription) {
        alert('Please fill in all fields.');
        return;
      }
      if (editIndex !== null) {
        const updatedEvents = [...events];
        const eventToUpdate = updatedEvents.find(e => e.id === filteredEvents[editIndex].id);
        if (eventToUpdate) {
          eventToUpdate.title = editTitle;
          eventToUpdate.type = editType;
          eventToUpdate.date = editDate;
          eventToUpdate.time = editTime;
          eventToUpdate.location = editLocation;
          eventToUpdate.description = editDescription;
          if (editImage) {
            eventToUpdate.coverImage = { uri: editImage };
          }
        }
        setEvents(updatedEvents);
      }
      setShowEditModal(false);
      setEditIndex(null);
      setEditImage(null);
      setEditTitle('');
      setEditType('');
      setEditDate('');
      setEditTime('');
      setEditLocation('');
      setEditDescription('');
    }, 800);
  };

  // Handle Edit Delete
  const handleEditDelete = () => {
    if (editIndex !== null) {
      const eventToDelete = filteredEvents[editIndex];
      setEvents(prev => prev.filter(e => e.id !== eventToDelete.id));
    }
    setShowEditModal(false);
    setEditIndex(null);
  };

  // Open Attendees Modal
  const openAttendeesModal = (eventId: string) => {
    setCurrentEventId(eventId);
    setAttendeesSearch('');
    setShowAttendeesModal(true);
  };

  // Get current event's attendees
  const currentEvent = events.find(e => e.id === currentEventId);
  const filteredAttendees = currentEvent?.attendees.filter(a => 
    (a.name.toLowerCase().includes(attendeesSearch.toLowerCase()) ||
     a.email.toLowerCase().includes(attendeesSearch.toLowerCase()))
  ) || [];

  return (
    <View style={[styles.mainContainer, { backgroundColor }]}>
      {/* Header */}
      <View style={[styles.headerRow, { backgroundColor, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.push('/admin-home')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Events Management</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: searchBackground }]}>
        <Ionicons name="search" size={20} color={secondaryTextColor} style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          placeholder="Search events"
          placeholderTextColor={secondaryTextColor}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { backgroundColor: cardBackground, borderBottomColor: borderColor }]}>
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              { backgroundColor: searchBackground },
              selectedFilter === filter && styles.activeFilterTab
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={[
              styles.filterText,
              { color: textColor },
              selectedFilter === filter && styles.activeFilterText
            ]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Featured Event */}
        {featuredEvent && (
          <TouchableOpacity 
            style={styles.featuredCard}
            onPress={() => router.push(`/admin-events/${featuredEvent.id}/details`)}
            activeOpacity={0.8}
          >
            <Image source={featuredEvent.coverImage} style={styles.featuredImage} />
            <View style={styles.featuredOverlay}>
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredText}>Featured</Text>
              </View>
              <Text style={styles.featuredTitle}>{featuredEvent.title}</Text>
              <Text style={styles.featuredSubtitle}>{featuredEvent.type} • {formatDate(featuredEvent.date)}</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Regular Events */}
        {filteredEvents.map((event, index) => (
          <TouchableOpacity 
            key={event.id}
            style={[styles.eventCard, { backgroundColor: cardBackground, borderColor }]}
            onPress={() => router.push(`/admin-events/${event.id}/details`)}
            activeOpacity={0.8}
          >
            <Image source={event.coverImage} style={styles.eventImage} />
            <View style={styles.eventInfo}>
              <Text style={[styles.eventTitle, { color: textColor }]}>{event.title}</Text>
              <Text style={[styles.eventType, { color: '#3CB371' }]}>{event.type}</Text>
              <Text style={[styles.eventDate, { color: secondaryTextColor }]}>{formatDate(event.date)} • {event.time}</Text>
              <Text style={[styles.eventLocation, { color: secondaryTextColor }]}>{event.location}</Text>
            </View>
            <View style={styles.eventActions}>
              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => openAttendeesModal(event.id)}
              >
                <Ionicons name="people" size={20} color="#3CB371" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => openEditModal(index)}
              >
                <Ionicons name="create" size={20} color="#4A90E2" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bottom Tab Bar */}
      <AdminTabBar activeTab="events" isDarkMode={isDarkMode} />

      {/* Add Event Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={[styles.modalOverlay, { backgroundColor: overlayBackground }]}>
            <View style={[styles.modalContent, { backgroundColor: modalBackground }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: textColor }]}>Add New Event</Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Ionicons name="close" size={24} color={secondaryTextColor} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
                <Text style={[styles.modalLabel, { color: textColor }]}>Event Title</Text>
                <TextInput
                  style={[styles.modalInput, { color: textColor, backgroundColor: searchBackground }]}
                  value={addTitle}
                  onChangeText={setAddTitle}
                  placeholder="Enter event title..."
                  placeholderTextColor={secondaryTextColor}
                />
                <Text style={[styles.modalLabel, { color: textColor }]}>Event Type</Text>
                <TextInput
                  style={[styles.modalInput, { color: textColor, backgroundColor: searchBackground }]}
                  value={addType}
                  onChangeText={setAddType}
                  placeholder="Workshop, Seminar, etc."
                  placeholderTextColor={secondaryTextColor}
                />
                <Text style={[styles.modalLabel, { color: textColor }]}>Date</Text>
                <TextInput
                  style={[styles.modalInput, { color: textColor, backgroundColor: searchBackground }]}
                  value={addDate}
                  onChangeText={setAddDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={secondaryTextColor}
                />
                <Text style={[styles.modalLabel, { color: textColor }]}>Time</Text>
                <TextInput
                  style={[styles.modalInput, { color: textColor, backgroundColor: searchBackground }]}
                  value={addTime}
                  onChangeText={setAddTime}
                  placeholder="HH:MM AM/PM"
                  placeholderTextColor={secondaryTextColor}
                />
                <Text style={[styles.modalLabel, { color: textColor }]}>Location</Text>
                <TextInput
                  style={[styles.modalInput, { color: textColor, backgroundColor: searchBackground }]}
                  value={addLocation}
                  onChangeText={setAddLocation}
                  placeholder="Enter location..."
                  placeholderTextColor={secondaryTextColor}
                />
                <Text style={[styles.modalLabel, { color: textColor }]}>Description</Text>
                <TextInput
                  style={[styles.modalInput, styles.textArea, { color: textColor, backgroundColor: searchBackground }]}
                  value={addDescription}
                  onChangeText={setAddDescription}
                  placeholder="Enter event description..."
                  placeholderTextColor={secondaryTextColor}
                  multiline
                  numberOfLines={4}
                />
                <TouchableOpacity
                  style={[styles.addImageBtn, { backgroundColor: searchBackground, borderColor }]}
                  onPress={pickImage}
                >
                  <Ionicons name="image" size={20} color="#3CB371" />
                  <Text style={[styles.addImageText, { color: '#3CB371' }]}>Add Cover Image</Text>
                </TouchableOpacity>
                {addImage && (
                  <Image source={{ uri: addImage }} style={styles.previewImage} />
                )}
                <TouchableOpacity
                  style={[styles.saveBtn, addLoading && styles.saveBtnDisabled]}
                  onPress={handleAddEvent}
                  disabled={addLoading}
                >
                  {addLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Add Event</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Event Modal */}
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
          <View style={[styles.modalOverlay, { backgroundColor: overlayBackground }]}>
            <View style={[styles.modalContent, { backgroundColor: modalBackground }]}>
              <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
                <Text style={[styles.modalTitle, { color: textColor }]}>Edit Event</Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <Ionicons name="close" size={24} color={secondaryTextColor} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
                <Text style={[styles.modalLabel, { color: textColor }]}>Event Title</Text>
                <TextInput
                  style={[styles.modalInput, { color: textColor, backgroundColor: searchBackground, borderColor }]}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Enter event title..."
                  placeholderTextColor={secondaryTextColor}
                />
                <Text style={[styles.modalLabel, { color: textColor }]}>Event Type</Text>
                <TextInput
                  style={[styles.modalInput, { color: textColor, backgroundColor: searchBackground, borderColor }]}
                  value={editType}
                  onChangeText={setEditType}
                  placeholder="Workshop, Seminar, etc."
                  placeholderTextColor={secondaryTextColor}
                />
                <Text style={[styles.modalLabel, { color: textColor }]}>Date</Text>
                <TextInput
                  style={[styles.modalInput, { color: textColor, backgroundColor: searchBackground, borderColor }]}
                  value={editDate}
                  onChangeText={setEditDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={secondaryTextColor}
                />
                <Text style={[styles.modalLabel, { color: textColor }]}>Time</Text>
                <TextInput
                  style={[styles.modalInput, { color: textColor, backgroundColor: searchBackground, borderColor }]}
                  value={editTime}
                  onChangeText={setEditTime}
                  placeholder="HH:MM AM/PM"
                  placeholderTextColor={secondaryTextColor}
                />
                <Text style={[styles.modalLabel, { color: textColor }]}>Location</Text>
                <TextInput
                  style={[styles.modalInput, { color: textColor, backgroundColor: searchBackground, borderColor }]}
                  value={editLocation}
                  onChangeText={setEditLocation}
                  placeholder="Enter location..."
                  placeholderTextColor={secondaryTextColor}
                />
                <Text style={[styles.modalLabel, { color: textColor }]}>Description</Text>
                <TextInput
                  style={[styles.modalInput, styles.textArea, { color: textColor, backgroundColor: searchBackground, borderColor }]}
                  value={editDescription}
                  onChangeText={setEditDescription}
                  placeholder="Enter event description..."
                  placeholderTextColor={secondaryTextColor}
                  multiline
                  numberOfLines={4}
                />
                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={[styles.deleteBtn, { backgroundColor: '#E74C3C' }]}
                    onPress={handleEditDelete}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={[styles.deleteBtnText, { color: '#fff', fontWeight: '600' }]}>Delete Event</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: '#3CB371' }, editLoading && styles.saveBtnDisabled]}
                    onPress={handleEditSave}
                    disabled={editLoading}
                    activeOpacity={0.8}
                  >
                    {editLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={[styles.saveBtnText, { color: '#fff', fontWeight: '600' }]}>Save Changes</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Attendees Modal */}
      <Modal
        visible={showAttendeesModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAttendeesModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: overlayBackground }]}>
          <View style={[styles.modalContent, { backgroundColor: modalBackground }]}>
            <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Event Attendees</Text>
              <TouchableOpacity onPress={() => setShowAttendeesModal(false)}>
                <Ionicons name="close" size={24} color={secondaryTextColor} />
              </TouchableOpacity>
            </View>
            <View style={[styles.attendeesHeader, { borderBottomColor: borderColor }]}>
              <View style={[styles.searchRow, { backgroundColor: searchBackground }]}>
                <Ionicons name="search" size={18} color={secondaryTextColor} style={{ marginRight: 6 }} />
                <TextInput
                  style={[styles.attendeesSearchInput, { color: textColor }]}
                  placeholder="Search attendees"
                  placeholderTextColor={secondaryTextColor}
                  value={attendeesSearch}
                  onChangeText={setAttendeesSearch}
                />
              </View>
              <View style={styles.statusFilter}>
                <TouchableOpacity
                  style={[
                    styles.statusBtn,
                    { backgroundColor: searchBackground },
                    attendeeStatus === 'Confirmed' && styles.activeStatusBtn
                  ]}
                  onPress={() => setAttendeeStatus('Confirmed')}
                >
                  <Text style={[
                    styles.statusBtnText,
                    { color: textColor },
                    attendeeStatus === 'Confirmed' && styles.activeStatusBtnText
                  ]}>
                    Confirmed
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusBtn,
                    { backgroundColor: searchBackground },
                    attendeeStatus === 'Canceled' && styles.activeStatusBtn
                  ]}
                  onPress={() => setAttendeeStatus('Canceled')}
                >
                  <Text style={[
                    styles.statusBtnText,
                    { color: textColor },
                    attendeeStatus === 'Canceled' && styles.activeStatusBtnText
                  ]}>
                    Canceled
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView style={styles.attendeesList}>
              {filteredAttendees
                .filter(a => a.status === attendeeStatus)
                .map((attendee, index) => (
                  <View key={index} style={[styles.attendeeItem, { borderBottomColor: borderColor }]}>
                    <View style={styles.attendeeInfo}>
                      <Text style={[styles.attendeeName, { color: textColor }]}>{attendee.name}</Text>
                      <Text style={[styles.attendeeEmail, { color: secondaryTextColor }]}>{attendee.email}</Text>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: attendee.status === 'Confirmed' ? '#3CB371' : '#E74C3C' }
                    ]}>
                      <Text style={styles.statusBadgeText}>{attendee.status}</Text>
                    </View>
                  </View>
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  addBtn: {
    backgroundColor: '#3CB371',
    borderRadius: 20,
    padding: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeFilterTab: {
    backgroundColor: '#3CB371',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Extra padding for tab bar
  },
  featuredCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  featuredImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#3CB371',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  featuredText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  featuredTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  featuredSubtitle: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
  eventCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
  },
  eventImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  eventType: {
    fontSize: 12,
    color: '#3CB371',
    fontWeight: '500',
    marginBottom: 2,
  },
  eventDate: {
    fontSize: 12,
    marginBottom: 2,
  },
  eventLocation: {
    fontSize: 12,
  },
  eventActions: {
    justifyContent: 'space-between',
  },
  actionBtn: {
    padding: 8,
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalScroll: {
    padding: 20,
    paddingBottom: 40,
  },
  modalLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  modalInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  addImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  addImageText: {
    marginLeft: 8,
    color: '#3CB371',
    fontWeight: '500',
  },
  previewImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 16,
    resizeMode: 'cover',
  },
  saveBtn: {
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    minHeight: 56,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
    gap: 12,
  },
  deleteBtn: {
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    minHeight: 56,
  },
  deleteBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  attendeesHeader: {
    padding: 20,
    borderBottomWidth: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  attendeesSearchInput: {
    flex: 1,
    fontSize: 14,
  },
  statusFilter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  activeStatusBtn: {
    backgroundColor: '#3CB371',
  },
  statusBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeStatusBtnText: {
    color: '#fff',
  },
  attendeesList: {
    padding: 20,
  },
  attendeeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  attendeeEmail: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  });
  
  export default AdminEventListScreen; 