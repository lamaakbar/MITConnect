import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Pressable, SafeAreaView, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { ToastAndroid, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserContext } from '../components/UserContext';
import { useTheme } from '../components/ThemeContext';
import { useThemeColor } from '../hooks/useThemeColor';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

type VoteType = 'yesno' | 'likedislike';
type Idea = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'In Progress' | 'Approved' | 'Pending' | 'Rejected';
  voteType?: VoteType;
  votes?: { [key: string]: number };
  likes?: number;
  dislikes?: number;
  comments: number;
  submitterId: string;
  totalVotes?: number;
};

const categories = [
  'Mobile App',
  'Banking Innovation',
  'Internship Experience',
  'Other',
];

// Updated stats data
const stats = {
  totalIdeas: 3,
  inProgress: 1,
  approved: 1,
  totalVotes: 111,
};

const currentUserId = 'user1';
const ideas: Idea[] = [
  {
    id: '1',
    title: 'Mobile App Dark Mode Feature',
    description: 'Add a dark mode toggle to the mobile banking app to improve user experience during night time usage and reduce eye strain.',
    category: 'Mobile App',
    status: 'In Progress',
    voteType: 'yesno',
    votes: { yes: 35, no: 2 },
    likes: 35,
    dislikes: 2,
    comments: 8,
    submitterId: 'user1',
    totalVotes: 120,
  },
  {
    id: '2',
    title: 'AI-Powered Customer Support Chatbot',
    description: 'Implement an intelligent chatbot that handle basic customer inquiries and route complex issues to appropriate departments.',
    category: 'Banking Innovation',
    status: 'In Progress',
    voteType: 'likedislike',
    votes: { like: 45, dislike: 0 },
    likes: 45,
    dislikes: 0,
    comments: 6,
    submitterId: 'user2',
    totalVotes: 45,
  },
  {
    id: '3',
    title: 'Internship Mentorship Program',
    description: 'Create a structured mentorship program where senior employees are paired with interns to provide guidance and career development support.',
    category: 'Internship Experience',
    status: 'Approved',
    voteType: 'likedislike',
    votes: { like: 28, dislike: 1 },
    likes: 28,
    dislikes: 1,
    comments: 12,
    submitterId: 'user2',
    totalVotes: 29,
  },
];

export default function InspirerCornerScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaCategory, setIdeaCategory] = useState('');
  const [ideaDescription, setIdeaDescription] = useState('');
  const [votes, setVotes] = useState<{ [key: string]: string }>({});
  const [userVotes, setUserVotes] = useState<{ [key: string]: 'yes' | 'no' }>({});
  const [hasVoted, setHasVoted] = useState<{ [key: string]: boolean }>({});
  
  const router = useRouter();
  const userId = currentUserId;
  
  const communityIdeas = ideas.filter(i =>
    i.status === 'Approved' || i.submitterId === userId
  );

  const { userRole } = useUserContext();
  const { isDarkMode } = useTheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  
  // Dark mode colors
  const screenBg = isDarkMode ? '#000000' : '#F5F5F7';
  const cardBg = isDarkMode ? '#1C1C1E' : '#fff';
  const primaryText = isDarkMode ? '#FFFFFF' : '#000000';
  const secondaryText = isDarkMode ? '#8E8E93' : '#666';
  const buttonBg = isDarkMode ? '#30D158' : '#A7A6FB';

  const handleVote = (ideaId: string, voteType: 'yes' | 'no') => {
    setUserVotes(prev => ({ ...prev, [ideaId]: voteType }));
  };

  const handleSubmitVote = (ideaId: string) => {
    const selectedVote = userVotes[ideaId];
    if (!selectedVote) {
      Alert.alert('Please select an option', 'You must choose Yes or No before voting.');
      return;
    }

    // Mark as voted
    setHasVoted(prev => ({ ...prev, [ideaId]: true }));
    
    // Show success message
    Alert.alert(
      'Vote Submitted!', 
      `Your vote "${selectedVote}" has been recorded.`,
      [{ text: 'OK', style: 'default' }]
    );

    // In a real app, you would send this to your backend
    console.log(`Vote submitted for idea ${ideaId}: ${selectedVote}`);
  };

  const handleSubmitIdea = () => {
    setModalVisible(false);
    setIdeaTitle('');
    setIdeaCategory('');
    setIdeaDescription('');
    Alert.alert('Success', 'Your idea has been submitted for review!');
  };

  const handleShare = (ideaId: string) => {
    const link = `https://mitconnect.app/ideas/${ideaId}`;
    Clipboard.setStringAsync(link);
    if (Platform.OS === 'android') {
      ToastAndroid.show('Link copied to clipboard!', ToastAndroid.SHORT);
    } else {
      Alert.alert('Copied', 'Link copied to clipboard!');
    }
  };

  const handleComment = (ideaId: string) => {
    // @ts-expect-error: Dynamic route is valid for Expo Router
    router.push(`/comments/${ideaId}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {userRole === 'employee' && (
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={primaryText} />
              </TouchableOpacity>
            )}
            <View style={styles.iconContainer}>
              <Ionicons name="bulb" size={24} color="#FF9500" />
            </View>
            <View>
              <Text style={[styles.title, { color: primaryText }]}>Inspire Corner</Text>
              <Text style={[styles.subtitle, { color: secondaryText }]}>Innovation & Ideas Hub</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.newIdeaBtn, { backgroundColor: buttonBg }]} onPress={() => setModalVisible(true)}>
            <Text style={styles.newIdeaBtnText}>+ New Idea</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: cardBg }]}>
              <Text style={[styles.statNumber, { color: primaryText }]}>{stats.totalIdeas}</Text>
              <Text style={[styles.statLabel, { color: secondaryText }]}>Total Ideas</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: cardBg }]}>
              <Text style={[styles.statNumber, { color: primaryText }]}>{stats.inProgress}</Text>
              <Text style={[styles.statLabel, { color: secondaryText }]}>In Progress</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: cardBg }]}>
              <Text style={[styles.statNumber, { color: primaryText }]}>{stats.approved}</Text>
              <Text style={[styles.statLabel, { color: secondaryText }]}>Approved</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: cardBg }]}>
              <Text style={[styles.statNumber, { color: primaryText }]}>{stats.totalVotes}</Text>
              <Text style={[styles.statLabel, { color: secondaryText }]}>Total Votes</Text>
            </View>
          </View>

          {/* Community Ideas */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: primaryText }]}>Community Ideas</Text>
            
            {communityIdeas.map((item) => (
                             <View key={item.id} style={[styles.ideaCard, { backgroundColor: cardBg }]}>
                                 {/* Category and Status Tags */}
                 <View style={styles.tagsRow}>
                   <View style={styles.tagsLeft}>
                     <View style={[styles.tag, styles.categoryTag]}>
                       <Text style={styles.categoryTagText}>{item.category}</Text>
                     </View>
                     <View style={[styles.tag, 
                       item.status === 'In Progress' ? styles.inProgressTag : styles.approvedTag
                     ]}>
                       <Ionicons 
                         name={item.status === 'In Progress' ? 'time-outline' : 'checkmark-circle'} 
                         size={12} 
                         color="#fff" 
                       />
                       <Text style={styles.statusTagText}>{item.status}</Text>
                     </View>
                   </View>
                   <TouchableOpacity style={[styles.manageBtn, { backgroundColor: isDarkMode ? '#3A3A3C' : '#f6f7f9' }]}>
                     <Ionicons name="settings-outline" size={14} color="#8E8E93" />
                     <Text style={[styles.manageBtnText, { color: isDarkMode ? '#8E8E93' : '#8E8E93' }]}>Manage idea</Text>
                   </TouchableOpacity>
                 </View>

                                 {/* Idea Content */}
                 <Text style={[styles.ideaTitle, { color: primaryText }]}>{item.title}</Text>
                 <Text style={[styles.ideaDescription, { color: secondaryText }]}>{item.description}</Text>

                                 {/* Voting Section */}
                 <View style={[styles.votingContainer, { backgroundColor: isDarkMode ? '#2C2C2E' : '#f6f7f9', borderColor: isDarkMode ? '#3A3A3C' : '#eee' }]}>
                                     <Text style={[styles.votingQuestion, { color: primaryText }]}>Do you support this idea?</Text>
                  
                  <View style={styles.voteOptions}>
                                         <TouchableOpacity 
                       style={[
                         styles.voteOption, 
                         { backgroundColor: isDarkMode ? '#3A3A3C' : '#fff', borderColor: isDarkMode ? '#48484A' : '#eee' },
                         userVotes[item.id] === 'yes' && { borderColor: isDarkMode ? '#30D158' : '#a7a6fb', backgroundColor: isDarkMode ? '#1E3A1E' : '#e0e7ff' }
                       ]}
                       onPress={() => handleVote(item.id, 'yes')}
                     >
                       <Text style={[styles.voteNumber, { color: primaryText }]}>1.</Text>
                       <Text style={[styles.voteText, { color: primaryText }]}>Yes</Text>
                       <View style={[styles.radioButton, { borderColor: primaryText }]}>
                         {userVotes[item.id] === 'yes' && <View style={[styles.radioButtonSelected, { backgroundColor: primaryText }]} />}
                       </View>
                     </TouchableOpacity>
                     
                     <TouchableOpacity 
                       style={[
                         styles.voteOption, 
                         { backgroundColor: isDarkMode ? '#3A3A3C' : '#fff', borderColor: isDarkMode ? '#48484A' : '#eee' },
                         userVotes[item.id] === 'no' && { borderColor: isDarkMode ? '#30D158' : '#a7a6fb', backgroundColor: isDarkMode ? '#1E3A1E' : '#e0e7ff' }
                       ]}
                       onPress={() => handleVote(item.id, 'no')}
                     >
                       <Text style={[styles.voteNumber, { color: primaryText }]}>2.</Text>
                       <Text style={[styles.voteText, { color: primaryText }]}>No</Text>
                       <View style={[styles.radioButton, { borderColor: primaryText }]}>
                         {userVotes[item.id] === 'no' && <View style={[styles.radioButtonSelected, { backgroundColor: primaryText }]} />}
                       </View>
                     </TouchableOpacity>
                  </View>
                  
                                     <Text style={[styles.totalVotes, { color: secondaryText }]}>{item.totalVotes} overall votes</Text>
                  
                                     <TouchableOpacity 
                     style={[
                       styles.voteBtn, 
                       { 
                         backgroundColor: hasVoted[item.id] ? '#8E8E93' : buttonBg,
                         opacity: hasVoted[item.id] ? 0.6 : 1
                       }
                     ]}
                     onPress={() => handleSubmitVote(item.id)}
                     disabled={hasVoted[item.id]}
                   >
                     <Text style={styles.voteBtnText}>
                       {hasVoted[item.id] ? 'Voted' : 'Vote'}
                     </Text>
                   </TouchableOpacity>
                </View>

                                 {/* Action Buttons */}
                 <View style={styles.actionButtons}>
                   <TouchableOpacity style={[styles.actionBtn, { backgroundColor: isDarkMode ? '#3A3A3C' : '#f6f7f9' }]} onPress={() => handleComment(item.id)}>
                     <Ionicons name="thumbs-up-outline" size={20} color="#34C759" />
                     <Text style={[styles.actionBtnText, { color: primaryText }]}>{item.likes}</Text>
                   </TouchableOpacity>
                   
                   <TouchableOpacity style={[styles.actionBtn, { backgroundColor: isDarkMode ? '#3A3A3C' : '#f6f7f9' }]}>
                     <Ionicons name="thumbs-down-outline" size={20} color="#FF3B30" />
                     <Text style={[styles.actionBtnText, { color: primaryText }]}>{item.dislikes}</Text>
                   </TouchableOpacity>
                   
                   <TouchableOpacity style={[styles.actionBtn, { backgroundColor: isDarkMode ? '#3A3A3C' : '#f6f7f9' }]} onPress={() => handleComment(item.id)}>
                     <Ionicons name="chatbubble-outline" size={20} color="#007AFF" />
                     <Text style={[styles.actionBtnText, { color: primaryText }]}>{item.comments}</Text>
                   </TouchableOpacity>
                 </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* New Idea Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
                         <View style={[styles.modalContainer, { backgroundColor: cardBg }]}>
               <View style={styles.modalHeader}>
                 <Text style={[styles.modalTitle, { color: primaryText }]}>Share Your Idea</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalContent}>
                                 <TextInput
                   style={[styles.input, { backgroundColor: isDarkMode ? '#3A3A3C' : '#F2F2F7', color: primaryText }]}
                   placeholder="Enter a clear, descriptive title for your idea"
                   value={ideaTitle}
                   onChangeText={setIdeaTitle}
                   placeholderTextColor="#8E8E93"
                 />
                
                                 <Text style={[styles.inputLabel, { color: primaryText }]}>Category *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[styles.categoryOption, ideaCategory === category && styles.categoryOptionSelected]}
                      onPress={() => setIdeaCategory(category)}
                    >
                      <Text style={[styles.categoryOptionText, ideaCategory === category && styles.categoryOptionTextSelected]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                
                                 <TextInput
                   style={[styles.input, styles.textArea, { backgroundColor: isDarkMode ? '#3A3A3C' : '#F2F2F7', color: primaryText }]}
                   placeholder="Describe your idea in detail..."
                   value={ideaDescription}
                   onChangeText={setIdeaDescription}
                   multiline
                   placeholderTextColor="#8E8E93"
                 />
              </ScrollView>
              
              <View style={styles.modalFooter}>
                                 <TouchableOpacity style={[styles.submitBtn, { backgroundColor: buttonBg }]} onPress={handleSubmitIdea}>
                   <Text style={styles.submitBtnText}>Submit Idea</Text>
                 </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
     header: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginTop: 24,
     marginHorizontal: 20,
     marginBottom: 12,
     flexWrap: 'wrap',
   },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: '#FFE0B2',
    borderRadius: 12,
    padding: 8,
    marginRight: 12,
  },
     title: { fontSize: 26, fontWeight: 'bold', letterSpacing: 0.5 },
   subtitle: { textAlign: 'center', marginTop: 4, fontSize: 15 },
   newIdeaBtn: { 
     borderRadius: 12, 
     paddingVertical: 8, 
     paddingHorizontal: 16, 
     shadowColor: '#818cf8', 
     shadowOpacity: 0.18, 
     shadowRadius: 8, 
     elevation: 3,
     alignSelf: 'flex-end',
     maxWidth: 120,
   },
   newIdeaBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14, letterSpacing: 0.3 },
  scrollView: { flex: 1 },
     statsContainer: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     marginVertical: 8,
     marginHorizontal: 16,
     paddingHorizontal: 4,
   },
   statCard: {
     borderRadius: 12,
     paddingVertical: 14,
     paddingHorizontal: 8,
     alignItems: 'center',
     justifyContent: 'center',
     flex: 1,
     marginHorizontal: 4,
     height: 64,
     shadowColor: '#818cf8',
     shadowOpacity: 0.08,
     shadowRadius: 6,
     elevation: 2,
   },
   statNumber: { 
     fontSize: 20, 
     fontWeight: '600', 
     lineHeight: 24,
     textAlign: 'center',
     marginBottom: 2,
   },
   statLabel: { 
     fontSize: 11, 
     fontWeight: '400',
     textAlign: 'center',
     lineHeight: 14,
     marginTop: 0,
   },
  sectionContainer: { marginTop: 12, marginBottom: 24, marginHorizontal: 20 },
     sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, letterSpacing: 0.2 },
   ideaCard: {
     borderRadius: 20,
     padding: 18,
     marginBottom: 18,
     shadowColor: '#000',
     shadowOpacity: 0.06,
     shadowRadius: 10,
     elevation: 2,
   },
     tagsRow: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'flex-start',
     marginBottom: 8,
     minHeight: 32,
   },
   tagsLeft: {
     flexDirection: 'row',
     alignItems: 'center',
     flex: 1,
     flexWrap: 'wrap',
     marginRight: 8,
   },
     tag: {
     borderRadius: 12,
     paddingHorizontal: 10,
     paddingVertical: 4,
     marginRight: 8,
     marginBottom: 4,
     flexDirection: 'row',
     alignItems: 'center',
   },
  categoryTag: { backgroundColor: '#e0e7ff' },
  categoryTagText: { fontSize: 13, fontWeight: 'bold', color: '#3730A3' },
  approvedTag: { backgroundColor: '#34d399' },
  inProgressTag: { backgroundColor: '#818cf8' },
  statusTagText: { fontSize: 12, color: '#fff', marginLeft: 4 },
     manageBtn: {
     borderRadius: 8,
     paddingVertical: 6,
     paddingHorizontal: 10,
     flexDirection: 'row',
     alignItems: 'center',
     alignSelf: 'flex-start',
     maxWidth: 110,
     minWidth: 90,
     height: 28,
   },
   manageBtnText: {
     color: '#8E8E93',
     fontSize: 12,
     fontWeight: '600',
     marginLeft: 4,
   },
  ideaTitle: { fontSize: 17, fontWeight: 'bold', marginBottom: 2 },
  ideaDescription: { fontSize: 14, marginBottom: 10 },
     votingContainer: {
     marginBottom: 12,
     paddingVertical: 12,
     paddingHorizontal: 16,
     borderRadius: 12,
     borderWidth: 1,
   },
   votingQuestion: {
     fontSize: 15,
     fontWeight: 'bold',
     marginBottom: 10,
     textAlign: 'center',
   },
  voteOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
     voteOption: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingVertical: 10,
     paddingHorizontal: 15,
     borderRadius: 12,
     borderWidth: 1,
     width: '45%',
   },
   voteNumber: {
     fontSize: 16,
     fontWeight: 'bold',
     marginRight: 8,
   },
   voteText: {
     fontSize: 15,
     fontWeight: 'bold',
   },
   radioButton: {
     width: 16,
     height: 16,
     borderRadius: 8,
     borderWidth: 1,
     justifyContent: 'center',
     alignItems: 'center',
     marginLeft: 'auto',
   },
   radioButtonSelected: {
     width: 10,
     height: 10,
     borderRadius: 5,
   },
     totalVotes: {
     fontSize: 13,
     textAlign: 'center',
     marginBottom: 10,
   },
   voteBtn: {
     borderRadius: 12,
     paddingVertical: 12,
     paddingHorizontal: 24,
     alignItems: 'center',
   },
  voteBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
     actionBtn: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingVertical: 8,
     paddingHorizontal: 15,
     borderRadius: 12,
   },
   actionBtnText: {
     fontSize: 14,
     fontWeight: 'bold',
     marginLeft: 8,
   },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 24,
    width: '92%',
    shadowColor: '#818cf8',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#3730A3',
  },
  modalContent: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 15,
    color: '#3730A3',
  },
  inputLabel: {
    fontSize: 14,
    color: '#3730A3',
    marginBottom: 6,
    fontWeight: 'bold',
  },
  categoryContainer: {
    marginBottom: 12,
  },
  categoryOption: {
    backgroundColor: '#E0E7FF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
  },
  categoryOptionSelected: {
    backgroundColor: '#A7A6FB',
  },
  categoryOptionText: {
    color: '#3730A3',
    fontWeight: 'bold',
    fontSize: 14,
  },
  categoryOptionTextSelected: {
    color: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  submitBtn: {
    backgroundColor: '#A7A6FB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    shadowColor: '#818cf8',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelBtn: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelBtnText: {
    color: '#3730A3',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 