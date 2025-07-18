import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

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

  // Replace mockAttendees with only the five specified names/emails
  // const mockAttendees = [
  //   { name: "Ahmed Ali", email: "ahmed.ali@email.com", status: "Confirmed" },
  //   { name: "Sara Khaled", email: "sara.khaled@email.com", status: "Confirmed" },
  //   { name: "Faisal Alsaif", email: "faisal.alsaif@email.com", status: "Canceled" },
  //   { name: "Layan Omar", email: "layan.omar@email.com", status: "Canceled" },
  //   { name: "Yara Alharthi", email: "yara.alharthi@email.com", status: "Confirmed" },
  // ];
  // Add unique mock attendees for 'AI in Business Conference'
  // const aiConferenceAttendees = [
  //   { name: "Mona Alzahrani", email: "mona.alzahrani@email.com", status: "Confirmed" },
  //   { name: "Omar Alotaibi", email: "omar.alotaibi@email.com", status: "Confirmed" },
  //   { name: "Huda Alharbi", email: "huda.alharbi@email.com", status: "Canceled" },
  //   { name: "Salem Alshammari", email: "salem.alshammari@email.com", status: "Canceled" },
  //   { name: "Rania Alghamdi", email: "rania.alghamdi@email.com", status: "Confirmed" },
  // ];
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);
  const [attendeesSearch, setAttendeesSearch] = useState('');
  // Add state for attendeeStatus
  const [attendeeStatus, setAttendeeStatus] = useState<'Confirmed' | 'Canceled'>('Confirmed');
  // Add state to track which event's attendees are being shown
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  // Filter attendees by status
  // In the Attendees modal, add two iOS-like buttons for 'Confirmed' and 'Canceled', and show filteredAttendees
  // Example:
  // <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16 }}>
  //   <TouchableOpacity ...>Confirmed</TouchableOpacity>
  //   <TouchableOpacity ...>Canceled</TouchableOpacity>
  // </View>
  // In the Attendees modal, only map over mockAttendees and show name/email, no status, no filter tabs

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

  // Save edits
  const handleEditSave = () => {
    setEditLoading(true);
    setTimeout(() => {
      setEditLoading(false);
      if (!editTitle || !editType || !editDate || !editTime || !editLocation || !editDescription) {
        alert('Please fill in all fields.');
        return;
      }
      setEvents(prev => prev.map((ev, i) => {
        // Find the correct event by id
        if (ev.id === filteredEvents[editIndex!].id) {
          return {
            ...ev,
            title: editTitle,
            type: editType,
            date: editDate,
            time: editTime,
            location: editLocation,
            description: editDescription,
            coverImage: editImage ? { uri: editImage } : require('../../assets/images/splash-icon.png'),
            attendees: ev.attendees, // Keep existing attendees
          };
        }
        return ev;
      }));
      setShowEditModal(false);
      setEditIndex(null);
    }, 800);
  };

  // Delete event
  const handleEditDelete = () => {
    setEvents(prev => prev.filter(ev => ev.id !== filteredEvents[editIndex!].id));
    setShowEditModal(false);
    setEditIndex(null);
  };

  // Open Attendees modal for an event (mock: always show mockAttendees)
  const openAttendeesModal = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    setCurrentEventId(eventId);
    setShowAttendeesModal(true);
    setAttendeesSearch('');
    setAttendeeStatus('Confirmed');
  };

  // Only one filteredAttendees declaration:
  // const filteredAttendees = (currentEvent?.attendees || []).filter(
  //   a => a.status === attendeeStatus &&
  //     (a.name.toLowerCase().includes(attendeesSearch.toLowerCase()) ||
  //      a.email.toLowerCase().includes(attendeesSearch.toLowerCase()))
  // );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#F8FFFA' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.headerRow}>
              <Text style={styles.logoText}>MIT<Text style={{ color: '#4ECB71' }}>Connect</Text></Text>
              {/* Remove menu/sandwich icon */}
            </View>
            {/* Search Bar */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#B0B0B0" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search events"
                value={search}
                onChangeText={setSearch}
                placeholderTextColor="#B0B0B0"
              />
            </View>
            {/* Filters */}
            <View style={styles.filterRow}>
              {FILTERS.map((filter) => (
                <Pressable
                  key={filter}
                  style={[styles.filterButton, selectedFilter === filter && styles.filterButtonActive]}
                  onPress={() => setSelectedFilter(filter)}
                >
                  <Text style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}>{filter}</Text>
                </Pressable>
              ))}
              <View style={{ flex: 1 }} />
              <Pressable style={styles.addButton} onPress={() => setShowAddModal(true)}>
                <Text style={styles.addButtonText}>+ Add</Text>
              </Pressable>
            </View>
            {/* Featured Event */}
            {featuredEvent && (
              <View style={styles.featuredCard}>
                <Image source={featuredEvent.coverImage} style={styles.featuredImage} />
                <Text style={styles.featuredTitle}>{featuredEvent.title}</Text>
                <View style={styles.featuredInfoRow}>
                  <MaterialIcons name="location-on" size={18} color="#4ECB71" style={{ marginRight: 4 }} />
                  <Text style={styles.featuredInfoText}>{featuredEvent.location}</Text>
                </View>
                <View style={styles.featuredInfoRow}>
                  <Ionicons name="time-outline" size={18} color="#4ECB71" style={{ marginRight: 4 }} />
                  <Text style={styles.featuredInfoText}>{featuredEvent.time}, {formatDate(featuredEvent.date)}</Text>
                </View>
              </View>
            )}
            {/* All Events */}
            <Text style={styles.allEventsTitle}>All Events</Text>
            {filteredEvents.length === 0 && (
              <Text style={{ color: '#888', textAlign: 'center', marginTop: 12 }}>No events found.</Text>
            )}
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={styles.eventRow}>
            <Image source={item.coverImage} style={styles.eventImage} />
            <View style={{ flex: 1 }}>
              <Text style={styles.eventTitle}>{item.title}</Text>
              <Text style={styles.eventLocation}>{item.location} · {formatDate(item.date)}, {item.time}</Text>
            </View>
            <View style={styles.eventActions}>
              <Pressable
                style={styles.actionBtn}
                onPress={() => openEditModal(index)}
              >
                <Text style={styles.actionBtnText}>Edit</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: '#E8F8F5', marginLeft: 6 }]}
                onPress={() => openAttendeesModal(item.id)}
              >
                <Text style={[styles.actionBtnText, { color: '#004080' }]}>Attendees</Text>
              </Pressable>
            </View>
          </View>
        )}
        style={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      />
      {/* Add Event Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
          <View style={modalStyles.overlay}>
            <KeyboardAvoidingView style={modalStyles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <ScrollView contentContainerStyle={modalStyles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={modalStyles.modalBox}>
                  <Text style={modalStyles.modalTitle}>Add New Event</Text>
                  {/* Image Upload */}
                  <Text style={modalStyles.label}>Event Cover Image</Text>
                  <TouchableOpacity style={modalStyles.imageUploadBox} onPress={pickImage} activeOpacity={0.8}>
                    {addImage ? (
                      <Image source={{ uri: addImage }} style={modalStyles.uploadedImage} />
                    ) : (
                      <View style={{ alignItems: 'center' }}>
                        <Text style={modalStyles.uploadText}>Tap to upload an event image</Text>
                        <Text style={modalStyles.uploadSubText}>Supported formats: .jpg, .png</Text>
                        <View style={modalStyles.uploadBtn}><Text style={modalStyles.uploadBtnText}>Upload</Text></View>
                      </View>
                    )}
                  </TouchableOpacity>
                  {/* Event Title */}
                  <Text style={modalStyles.label}>Event Title</Text>
                  <TextInput
                    style={modalStyles.input}
                    placeholder="e.g.,  Data Science Bootcamp"
                    placeholderTextColor="#8BA18C"
                    value={addTitle}
                    onChangeText={setAddTitle}
                  />
                  {/* Event Type Dropdown */}
                  <Text style={modalStyles.label}>Event Type</Text>
                  <TouchableOpacity
                    style={modalStyles.input}
                    onPress={() => setShowTypeDropdown((v) => !v)}
                    activeOpacity={0.8}
                  >
                    <Text style={[modalStyles.dropdownText, !addType && { color: '#8BA18C' }]}> {addType || 'Select  Event  Type'} </Text>
                  </TouchableOpacity>
                  {showTypeDropdown && (
                    <View style={modalStyles.dropdownMenu}>
                      {['Seminar', 'Workshop', 'Conference', 'Meetup'].map((t) => (
                        <TouchableOpacity
                          key={t}
                          style={modalStyles.dropdownItem}
                          onPress={() => {
                            setAddType(t);
                            setShowTypeDropdown(false);
                          }}
                        >
                          <Text style={modalStyles.dropdownText}>{t}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  {/* Event Date */}
                  <Text style={modalStyles.label}>Event Date</Text>
                  <TextInput
                    style={modalStyles.input}
                    placeholder="Select  date"
                    placeholderTextColor="#8BA18C"
                    value={addDate}
                    onChangeText={setAddDate}
                  />
                  {/* Event Time */}
                  <Text style={modalStyles.label}>Event Time</Text>
                  <TextInput
                    style={modalStyles.input}
                    placeholder="e.g.,  09:00 AM – 11:00 AM"
                    placeholderTextColor="#8BA18C"
                    value={addTime}
                    onChangeText={setAddTime}
                  />
                  {/* Location */}
                  <Text style={modalStyles.label}>Location</Text>
                  <TextInput
                    style={modalStyles.input}
                    placeholder="e.g.,  SNB HQ Auditorium"
                    placeholderTextColor="#8BA18C"
                    value={addLocation}
                    onChangeText={setAddLocation}
                  />
                  {/* Description */}
                  <Text style={modalStyles.label}>Description</Text>
                  <TextInput
                    style={[modalStyles.input, { height: 70, textAlignVertical: 'top' }]}
                    placeholder="Brief description of the event"
                    placeholderTextColor="#8BA18C"
                    value={addDescription}
                    onChangeText={setAddDescription}
                    multiline
                  />
                  {/* Create Event Button */}
                  <Pressable style={modalStyles.createBtn} onPress={handleAddEvent} disabled={addLoading}>
                    <Text style={modalStyles.createBtnText}>{addLoading ? 'Submitting...' : 'Create Event'}</Text>
                  </Pressable>
                  <TouchableOpacity style={modalStyles.cancelBtn} onPress={() => setShowAddModal(false)}>
                    <Text style={modalStyles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </Modal>
        {/* Edit Event Modal */}
        <Modal visible={showEditModal} animationType="slide" transparent>
          <View style={modalStyles.overlay}>
            <KeyboardAvoidingView style={modalStyles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <ScrollView contentContainerStyle={modalStyles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={modalStyles.modalBox}>
                  <Text style={modalStyles.modalTitle}>Edit Event</Text>
                  {/* Image Upload */}
                  <Text style={modalStyles.label}>Event Cover Image</Text>
                  <TouchableOpacity style={modalStyles.imageUploadBox} onPress={pickImage} activeOpacity={0.8}>
                    {editImage ? (
                      <Image source={{ uri: editImage }} style={modalStyles.uploadedImage} />
                    ) : (
                      <View style={{ alignItems: 'center' }}>
                        <Text style={modalStyles.uploadText}>Tap to upload an event image</Text>
                        <Text style={modalStyles.uploadSubText}>Supported formats: .jpg, .png</Text>
                        <View style={modalStyles.uploadBtn}><Text style={modalStyles.uploadBtnText}>Upload</Text></View>
                      </View>
                    )}
                  </TouchableOpacity>
                  {/* Event Title */}
                  <Text style={modalStyles.label}>Event Title</Text>
                  <TextInput
                    style={modalStyles.input}
                    placeholder="e.g.,  Data Science Bootcamp"
                    placeholderTextColor="#8BA18C"
                    value={editTitle}
                    onChangeText={setEditTitle}
                  />
                  {/* Event Type Dropdown */}
                  <Text style={modalStyles.label}>Event Type</Text>
                  <TouchableOpacity
                    style={modalStyles.input}
                    onPress={() => setShowEditTypeDropdown((v) => !v)}
                    activeOpacity={0.8}
                  >
                    <Text style={[modalStyles.dropdownText, !editType && { color: '#8BA18C' }]}> {editType || 'Select  Event  Type'} </Text>
                  </TouchableOpacity>
                  {showEditTypeDropdown && (
                    <View style={modalStyles.dropdownMenu}>
                      {['Seminar', 'Workshop', 'Conference', 'Meetup'].map((t) => (
                        <TouchableOpacity
                          key={t}
                          style={modalStyles.dropdownItem}
                          onPress={() => {
                            setEditType(t);
                            setShowEditTypeDropdown(false);
                          }}
                        >
                          <Text style={modalStyles.dropdownText}>{t}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  {/* Event Date */}
                  <Text style={modalStyles.label}>Event Date</Text>
                  <TextInput
                    style={modalStyles.input}
                    placeholder="Select  date"
                    placeholderTextColor="#8BA18C"
                    value={editDate}
                    onChangeText={setEditDate}
                  />
                  {/* Event Time */}
                  <Text style={modalStyles.label}>Event Time</Text>
                  <TextInput
                    style={modalStyles.input}
                    placeholder="e.g.,  09:00 AM – 11:00 AM"
                    placeholderTextColor="#8BA18C"
                    value={editTime}
                    onChangeText={setEditTime}
                  />
                  {/* Location */}
                  <Text style={modalStyles.label}>Location</Text>
                  <TextInput
                    style={modalStyles.input}
                    placeholder="e.g.,  SNB HQ Auditorium"
                    placeholderTextColor="#8BA18C"
                    value={editLocation}
                    onChangeText={setEditLocation}
                  />
                  {/* Description */}
                  <Text style={modalStyles.label}>Description</Text>
                  <TextInput
                    style={[modalStyles.input, { height: 70, textAlignVertical: 'top' }]}
                    placeholder="Brief description of the event"
                    placeholderTextColor="#8BA18C"
                    value={editDescription}
                    onChangeText={setEditDescription}
                    multiline
                  />
                  {/* Save Button */}
                  <Pressable style={modalStyles.createBtn} onPress={handleEditSave} disabled={editLoading}>
                    <Text style={modalStyles.createBtnText}>{editLoading ? 'Saving...' : 'Save'}</Text>
                  </Pressable>
                  {/* Delete Button */}
                  <TouchableOpacity style={modalStyles.cancelBtn} onPress={handleEditDelete}>
                    <Text style={[modalStyles.cancelBtnText, { color: '#E74C3C' }]}>Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={modalStyles.cancelBtn} onPress={() => { setShowEditModal(false); setEditIndex(null); }}>
                    <Text style={modalStyles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </Modal>
        {/* Attendees Modal */}
        <Modal visible={showAttendeesModal} animationType="slide" transparent>
          <View style={attendeesModalStyles.overlay}>
            <KeyboardAvoidingView style={attendeesModalStyles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={attendeesModalStyles.modalBox}>
                <Text style={attendeesModalStyles.modalTitle}>Attendees</Text>
                {/* Search and Status Filter */}
                <View style={attendeesModalStyles.searchRow}>
                  <Ionicons name="search" size={18} color="#B0B0B0" style={{ marginRight: 6 }} />
                  <TextInput
                    style={attendeesModalStyles.searchInput}
                    placeholder="Search attendees"
                    value={attendeesSearch}
                    onChangeText={setAttendeesSearch}
                    placeholderTextColor="#B0B0B0"
                  />
                </View>
                {/* Remove attendeesStatus, statusOptions, and all status filter logic */}
                {/* In the Attendees modal, only map over mockAttendees and show name/email, no status, no filter tabs */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16 }}>
                  <TouchableOpacity
                    style={[
                      attendeesModalStyles.filterBtn,
                      attendeeStatus === 'Confirmed' && attendeesModalStyles.filterBtnActive,
                      { flex: 1, marginRight: 8 }
                    ]}
                    onPress={() => setAttendeeStatus('Confirmed')}
                    activeOpacity={0.8}
                  >
                    <Text style={attendeeStatus === 'Confirmed' ? attendeesModalStyles.filterBtnTextActive : attendeesModalStyles.filterBtnText}>
                      Confirmed
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      attendeesModalStyles.filterBtn,
                      attendeeStatus === 'Canceled' && attendeesModalStyles.filterBtnActive,
                      { flex: 1, marginLeft: 8 }
                    ]}
                    onPress={() => setAttendeeStatus('Canceled')}
                    activeOpacity={0.8}
                  >
                    <Text style={attendeeStatus === 'Canceled' ? attendeesModalStyles.filterBtnTextActive : attendeesModalStyles.filterBtnText}>
                      Canceled
                    </Text>
                  </TouchableOpacity>
                </View>
                {currentEventId && (() => {
                  const currentEvent = events.find(e => e.id === currentEventId);
                  const filteredAttendees = (currentEvent?.attendees || []).filter(
                    a => a.status === attendeeStatus &&
                      (a.name.toLowerCase().includes(attendeesSearch.toLowerCase()) ||
                       a.email.toLowerCase().includes(attendeesSearch.toLowerCase()))
                  );
                  return (
                    <>
                      <Text style={attendeesModalStyles.modalTitle}>Attendees</Text>
                      <View style={{ width: '100%', maxHeight: 260, overflow: 'hidden', alignSelf: 'center' }}>
                        <ScrollView
                          style={{ width: '100%' }}
                          contentContainerStyle={{ paddingBottom: 16, flexGrow: 1 }}
                          showsVerticalScrollIndicator={true}
                          horizontal={false}
                        >
                          {filteredAttendees.length === 0 ? (
                            <Text style={{ color: '#888', textAlign: 'center', marginTop: 24 }}>No attendees found.</Text>
                          ) : (
                            filteredAttendees.map((a, idx) => (
                              <View key={a.email + idx} style={attendeesModalStyles.attendeeCard}>
                                <Text style={attendeesModalStyles.attendeeName}>{a.name}</Text>
                                <Text style={attendeesModalStyles.attendeeEmail}>{a.email}</Text>
                              </View>
                            ))
                          )}
                        </ScrollView>
                      </View>
                    </>
                  );
                })()}
                <TouchableOpacity style={attendeesModalStyles.closeBtn} onPress={() => setShowAttendeesModal(false)}>
                  <Text style={attendeesModalStyles.closeBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
    </KeyboardAvoidingView>
  );
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#F8FFFA',
    paddingBottom: 24,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FFFA',
    paddingHorizontal: 16,
    paddingTop: 48,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
    color: '#222',
    flex: 1,
  },
  menuButton: {
    padding: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F4F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#222',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterButton: {
    backgroundColor: '#F2F4F7',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#4ECB71',
  },
  filterText: {
    color: '#222',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#4ECB71',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginLeft: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  featuredCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    alignItems: 'center',
  },
  featuredImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginBottom: 8,
    resizeMode: 'contain',
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  featuredInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  featuredInfoText: {
    fontSize: 14,
    color: '#222',
  },
  editButton: {
    marginTop: 12,
    backgroundColor: '#4ECB71',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  allEventsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#222',
  },
  eventListContainer: {
    flexGrow: 0,
    maxHeight: 340,
    marginBottom: 16,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  eventImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
    resizeMode: 'cover',
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  eventLocation: {
    fontSize: 13,
    color: '#888',
  },
  eventActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionBtn: {
    backgroundColor: '#4ECB71',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  attendeesContainer: {
    width: '100%',
    backgroundColor: '#F7F8FA',
    borderRadius: 12,
    marginTop: 10,
    padding: 8,
    maxHeight: 140,
    overflow: 'hidden',
  },
  attendeeRow: {
    width: '100%',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    alignItems: 'flex-start',
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: '100%',
    paddingBottom: 24,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    width: '92%',
    maxWidth: 420,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginBottom: 12,
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
  uploadedImage: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 8,
  },
  uploadText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#222',
    textAlign: 'center',
    marginBottom: 4,
  },
  uploadSubText: {
    fontSize: 13,
    color: '#888',
    marginBottom: 4,
    textAlign: 'center',
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
  input: {
    backgroundColor: '#F4F6F7',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E5E7E9',
  },
  dropdownText: {
    fontSize: 15,
    color: '#222',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 4,
    zIndex: 100,
    paddingVertical: 4,
  },
  dropdownItem: {
    padding: 10,
  },
  createBtn: {
    backgroundColor: '#4ECB71',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 18,
    shadowColor: '#4ECB71',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  createBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
});

const attendeesModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    width: '92%',
    maxWidth: 420,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F4F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#222',
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  filterBtn: {
    backgroundColor: '#F7F8FA',
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterBtnActive: {
    backgroundColor: '#fff',
    borderColor: '#007AFF',
    shadowOpacity: 0.12,
    elevation: 2,
  },
  filterBtnText: {
    color: '#888',
    fontWeight: '600',
    fontSize: 16,
  },
  filterBtnTextActive: {
    color: '#007AFF',
    fontWeight: '700',
    fontSize: 16,
  },
  attendeeCard: {
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  attendeeName: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#222',
    marginBottom: 2,
  },
  attendeeEmail: {
    fontSize: 13,
    color: '#888',
  },
  statusBox: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  closeBtn: {
    backgroundColor: '#4ECB71',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  closeBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AdminEventListScreen; 