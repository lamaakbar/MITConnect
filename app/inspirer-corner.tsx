import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Pressable, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { ToastAndroid, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserContext } from '../components/UserContext';
import { useTheme } from '../components/ThemeContext';
import { useThemeColor } from '../hooks/useThemeColor';

type VoteType = 'yesno' | 'likedislike';
type Idea = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'In Progress' | 'Approved' | 'Pending' | 'Rejected';
  voteType?: VoteType;
  votes?: { [key: string]: number };
  comments: number;
  submitterId: string;
};

const categories = [
  'Mobile App',
  'Banking Innovation',
  'Internship Experience',
  'Other',
];

// Placeholder data for stats and ideas
const stats = {
  totalIdeas: 3,
  inProgress: 1,
  approved: 1,
  totalVotes: 111,
};

const currentUserId = 'user1'; // Simulate current user
const ideas: Idea[] = [
  {
    id: '1',
    title: 'Mobile App Dark Mode Feature',
    description: 'Add a dark mode toggle to the mobile banking app to improve user experience during night time usage and reduce eye strain.',
    category: 'Mobile App',
    status: 'In Progress',
    voteType: 'yesno',
    votes: { yes: 35, no: 2 },
    comments: 8,
    submitterId: 'user1',
  },
  {
    id: '2',
    title: 'AI-Powered Customer Support Chatbot',
    description: 'Implement an intelligent chatbot that handles basic customer inquiries and routes complex issues to appropriate departments.',
    category: 'Banking Innovation',
    status: 'In Progress',
    voteType: 'likedislike',
    votes: { like: 45, dislike: 0 },
    comments: 6,
    submitterId: 'user2',
  },
  {
    id: '3',
    title: 'Internship Mentorship Program',
    description: 'Create a structured mentorship program where senior employees are paired with interns to provide guidance and career development support.',
    category: 'Internship Experience',
    status: 'Approved',
    voteType: 'likedislike',
    votes: { like: 28, dislike: 1 },
    comments: 12,
    submitterId: 'user2',
  },
  {
    id: '4',
    title: 'Rejected Idea Example',
    description: 'This idea was rejected by the admin.',
    category: 'Other',
    status: 'Rejected',
    comments: 0,
    submitterId: 'user1',
  },
];

export default function InspirerCornerScreen() {
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  // Form state
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaCategory, setIdeaCategory] = useState('');
  const [ideaDescription, setIdeaDescription] = useState('');
  // Voting state (per idea)
  const [votes, setVotes] = useState<{ [key: string]: string }>({});
  const router = useRouter();
  // Get current user (simulate userId for now)
  // const { userId } = useUserContext(); // Uncomment if you have userId in context
  const userId = currentUserId;
  // Show all ideas submitted by the user, and only approved ideas from others
  const communityIdeas = ideas.filter(i =>
    i.status === 'Approved' || i.submitterId === userId
  );

  const { isDarkMode, toggleTheme } = useTheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  const borderColor = isDarkMode ? '#2A2A2A' : '#eee';
  const iconColor = useThemeColor({}, 'icon');

  // Handle vote
  const handleVote = (ideaId: string, type: string) => {
    setVotes(prev => ({ ...prev, [ideaId]: type }));
    // In real app, send vote to backend
  };

  // Handle idea submission
  const handleSubmitIdea = () => {
    // In real app, send to backend with status = 'pending'
    setModalVisible(false);
    setIdeaTitle('');
    setIdeaCategory('');
    setIdeaDescription('');
    // Show success message or feedback
  };

  // Share handler
  const handleShare = (ideaId: string) => {
    // You can customize the link format as needed
    const link = `https://mitconnect.app/ideas/${ideaId}`;
    Clipboard.setStringAsync(link);
    if (Platform.OS === 'android') {
      ToastAndroid.show('Link copied to clipboard!', ToastAndroid.SHORT);
    } else {
      Alert.alert('Copied', 'Link copied to clipboard!');
    }
  };

  // Comment handler
  const handleComment = (ideaId: string) => {
    // @ts-expect-error: Dynamic route is valid for Expo Router
    router.push(`/comments/${ideaId}`);
  };

  return (
    <LinearGradient colors={['#f6f7f9', '#e0e7ff']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>Inspire Corner</Text>
          <TouchableOpacity style={styles.newIdeaBtn} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
            <Text style={styles.newIdeaBtnText}>+ New Idea</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Innovation & Ideas Hub</Text>

        {/* Stats Section */}
        <View style={styles.statsRow}>
          <View style={styles.statCardShadow}>
            <LinearGradient colors={['#a7a6fb', '#e0e7ff']} style={styles.statCard}>
              <Text style={styles.statNum}>{stats.totalIdeas}</Text>
              <Text style={styles.statLabel}>Total Ideas</Text>
            </LinearGradient>
          </View>
          <View style={styles.statCardShadow}>
            <LinearGradient colors={['#818cf8', '#e0e7ff']} style={styles.statCard}>
              <Text style={styles.statNum}>{stats.inProgress}</Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </LinearGradient>
          </View>
          <View style={styles.statCardShadow}>
            <LinearGradient colors={['#34d399', '#e0e7ff']} style={styles.statCard}>
              <Text style={styles.statNum}>{stats.approved}</Text>
              <Text style={styles.statLabel}>Approved</Text>
            </LinearGradient>
          </View>
          <View style={styles.statCardShadow}>
            <LinearGradient colors={['#fbbf24', '#e0e7ff']} style={styles.statCard}>
              <Text style={styles.statNum}>{stats.totalVotes}</Text>
              <Text style={styles.statLabel}>Total Votes</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Community Ideas */}
        <Text style={styles.sectionTitle}>Community Ideas</Text>
        <FlatList<Idea>
          data={communityIdeas}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View style={styles.ideaCard}>
              <View style={styles.badgeRow}>
                <View style={[styles.pillBadge, styles.categoryPill]}>
                  <Text style={styles.pillBadgeText}>🏷️ {item.category}</Text>
                </View>
                <View style={[
                  styles.pillBadge,
                  item.status === 'Approved'
                    ? styles.approvedPill
                    : item.status === 'Rejected'
                    ? styles.rejectedPill
                    : styles.inProgressPill,
                ]}>
                  <Text style={styles.pillBadgeText}>
                    {item.status === 'Approved'
                      ? '✔️ Approved'
                      : item.status === 'Rejected'
                      ? '❌ Rejected'
                      : '⏳ In Progress'}
                  </Text>
                </View>
              </View>
              <Text style={styles.ideaTitle}>{item.title}</Text>
              <Text style={styles.ideaDesc}>{item.description}</Text>
              {/* Vote Section (optional) */}
              {item.voteType && item.votes && (
                <View style={styles.voteSection}>
                  {item.voteType === 'yesno' ? (
                    <View style={styles.voteRow}>
                      <TouchableOpacity
                        style={[styles.voteBtn, votes[item.id] === 'yes' && styles.voteBtnActive]}
                        onPress={() => handleVote(item.id, 'yes')}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.voteBtnText}>👍 Yes</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.voteBtn, votes[item.id] === 'no' && styles.voteBtnActive]}
                        onPress={() => handleVote(item.id, 'no')}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.voteBtnText}>👎 No</Text>
                      </TouchableOpacity>
                      <Text style={styles.voteCount}>
                        {((item.votes?.yes ?? 0) + (item.votes?.no ?? 0) + (votes[item.id] ? 1 : 0))} votes
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.voteRow}>
                      <TouchableOpacity
                        style={[styles.voteBtn, votes[item.id] === 'like' && styles.voteBtnActive]}
                        onPress={() => handleVote(item.id, 'like')}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.voteBtnText}>👍</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.voteBtn, votes[item.id] === 'dislike' && styles.voteBtnActive]}
                        onPress={() => handleVote(item.id, 'dislike')}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.voteBtnText}>👎</Text>
                      </TouchableOpacity>
                      <Text style={styles.voteCount}>
                        {((item.votes?.like ?? 0) + (item.votes?.dislike ?? 0) + (votes[item.id] ? 1 : 0))} votes
                      </Text>
                    </View>
                  )}
                </View>
              )}
              {/* Comments/Share - now fully clickable and responsive */}
              <View style={styles.iconRow}>
                <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={() => handleComment(item.id)}>
                  <Text style={styles.iconText}>💬 <Text style={styles.iconLabel}>Comment</Text> {item.comments}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={() => handleShare(item.id)}>
                  <Text style={styles.iconText}>🔗 <Text style={styles.iconLabel}>Share</Text></Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          style={{ marginBottom: 16 }}
        />

        {/* New Idea Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Share Your Idea</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter a clear, descriptive title for your idea"
                value={ideaTitle}
                onChangeText={setIdeaTitle}
              />
              <View style={styles.dropdownBox}>
                <Text style={styles.dropdownLabel}>Category *</Text>
                <FlatList
                  data={categories}
                  horizontal
                  keyExtractor={item => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.categoryOption, ideaCategory === item && styles.categoryOptionActive]}
                      onPress={() => setIdeaCategory(item)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.categoryOptionText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                  showsHorizontalScrollIndicator={false}
                />
              </View>
              <TextInput
                style={[styles.input, { height: 80 }]}
                placeholder="Describe your idea in detail..."
                value={ideaDescription}
                onChangeText={setIdeaDescription}
                multiline
              />
              <View style={styles.modalBtnRow}>
                <Pressable style={styles.submitBtn} onPress={handleSubmitIdea}>
                  <Text style={styles.submitBtnText}>Submit Idea</Text>
                </Pressable>
                <Pressable style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginHorizontal: 20, marginBottom: 4 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#3730A3', letterSpacing: 0.5 },
  newIdeaBtn: { backgroundColor: '#A7A6FB', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 24, shadowColor: '#818cf8', shadowOpacity: 0.18, shadowRadius: 8, elevation: 3 },
  newIdeaBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18, letterSpacing: 0.5 },
  subtitle: { textAlign: 'center', color: '#666', marginBottom: 18, fontSize: 15 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 12 },
  statCardShadow: { shadowColor: '#818cf8', shadowOpacity: 0.12, shadowRadius: 8, elevation: 2, borderRadius: 16 },
  statCard: { borderRadius: 16, padding: 14, alignItems: 'center', minWidth: 80 },
  statNum: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 13, color: '#fff', marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 24, marginTop: 12, marginBottom: 8, color: '#3730A3', letterSpacing: 0.2 },
  ideaCard: { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginHorizontal: 18, marginBottom: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  pillBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginRight: 8, flexDirection: 'row', alignItems: 'center' },
  pillBadgeText: { fontSize: 13, fontWeight: 'bold', color: '#3730A3' },
  categoryPill: { backgroundColor: '#e0e7ff' },
  approvedPill: { backgroundColor: '#34d399' },
  inProgressPill: { backgroundColor: '#818cf8' },
  ideaTitle: { fontSize: 17, fontWeight: 'bold', marginBottom: 2, color: '#222' },
  ideaDesc: { fontSize: 14, color: '#444', marginBottom: 10 },
  voteSection: { marginBottom: 8 },
  voteRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  voteBtn: { backgroundColor: '#e0e7ff', borderRadius: 16, paddingVertical: 8, paddingHorizontal: 16, marginRight: 10, shadowColor: '#818cf8', shadowOpacity: 0.08, shadowRadius: 4, elevation: 1 },
  voteBtnActive: { backgroundColor: '#a7a6fb' },
  voteBtnText: { fontWeight: 'bold', color: '#3730A3', fontSize: 15 },
  voteCount: { fontSize: 13, color: '#888', marginLeft: 8 },
  iconRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  iconBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#f6f7f9', marginRight: 10 },
  iconText: { fontSize: 15, color: '#3730A3', fontWeight: 'bold' },
  iconLabel: { fontSize: 14, color: '#3730A3', fontWeight: 'normal' },
  spotlightBox: { borderRadius: 24, margin: 18, padding: 22, alignItems: 'center', shadowColor: '#818cf8', shadowOpacity: 0.12, shadowRadius: 10, elevation: 2 },
  spotlightIcon: { fontSize: 32, marginBottom: 2 },
  spotlightTitle: { color: '#fff', fontWeight: 'bold', fontSize: 18, marginBottom: 4, letterSpacing: 0.2 },
  spotlightDesc: { color: '#fff', fontSize: 14, marginBottom: 12, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.22)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#fff', borderRadius: 22, padding: 24, width: '92%', shadowColor: '#818cf8', shadowOpacity: 0.18, shadowRadius: 12, elevation: 4 },
  closeBtn: { position: 'absolute', right: 12, top: 12, zIndex: 2, padding: 6 },
  closeBtnText: { fontSize: 22, color: '#a7a6fb' },
  modalTitle: { fontWeight: 'bold', fontSize: 20, marginBottom: 16, color: '#3730A3', textAlign: 'center' },
  input: { backgroundColor: '#F2F2F7', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 15 },
  dropdownBox: { marginBottom: 12 },
  dropdownLabel: { fontSize: 14, color: '#3730A3', marginBottom: 6, fontWeight: 'bold' },
  categoryOption: { backgroundColor: '#E0E7FF', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, marginRight: 10 },
  categoryOptionActive: { backgroundColor: '#A7A6FB' },
  categoryOptionText: { color: '#3730A3', fontWeight: 'bold', fontSize: 14 },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  submitBtn: { backgroundColor: '#A7A6FB', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, shadowColor: '#818cf8', shadowOpacity: 0.12, shadowRadius: 6, elevation: 2 },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { backgroundColor: '#F2F2F7', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
  cancelBtnText: { color: '#3730A3', fontWeight: 'bold', fontSize: 16 },
  rejectedPill: { backgroundColor: '#f87171' },
}); 