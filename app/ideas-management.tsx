import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert, ActivityIndicator, Platform, ToastAndroid, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTheme } from '../components/ThemeContext';
import AdminTabBar from '../components/AdminTabBar';
import AdminHeader from '../components/AdminHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IdeasService, type Idea as DatabaseIdea } from '../services/IdeasService';
import { useUserContext } from '../components/UserContext';
import SharedIdeasService from '../services/SharedIdeasService';
import uuid from 'react-native-uuid';

// Idea status types
const IDEA_STATUS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

// Add poll data to Idea type
type Poll = {
  question: string;
  options: string[];
};

// Extended Idea type that includes database fields
type Idea = DatabaseIdea & {
  votes: number;
  hasPoll?: boolean;
  poll?: Poll;
};

export default function IdeasManagement() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  
  const [tab, setTab] = useState<'pending' | 'submitted'>('pending');
  const [manageIdea, setManageIdea] = useState<Idea | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pollModalIdea, setPollModalIdea] = useState<Idea | null>(null);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollError, setPollError] = useState<string | null>(null);
  const [pendingPoll, setPendingPoll] = useState<{ ideaId: string, question: string, options: string[] } | null>(null);

  // Load ideas from database
  const loadIdeas = async () => {
    try {
      setLoading(true);
      
      // Load ideas from shared service
      const sharedIdeas = SharedIdeasService.getAllIdeas();
      
      // Transform to match component format
      const transformedIdeas: Idea[] = sharedIdeas.map(idea => ({
        ...idea,
        updated_at: idea.created_at,
        submitter_id: 'shared-' + idea.id,
        votes: idea.votes || 0
      }));
      
      setIdeas(transformedIdeas);

      // TODO: Re-enable database loading when issues are fixed
      // const { data, error } = await IdeasService.getAdminIdeas();
      // if (error) {
      //   console.error('Error loading ideas:', error);
      //   Alert.alert('Error', 'Failed to load ideas. Please try again.');
      //   return;
      // }
      // if (data) {
      //   const transformedIdeas: Idea[] = data.map(idea => ({
      //     ...idea,
      //     votes: idea.total_votes || 0,
      //   }));
      //   setIdeas(transformedIdeas);
      // }
    } catch (error) {
      console.error('Error loading ideas:', error);
      Alert.alert('Error', 'Failed to load ideas. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load ideas on component mount
  useEffect(() => {
    loadIdeas();
  }, []);

  // Handle approve idea
  const handleApprove = async (id: string) => {
    setActionLoading(id + '-approve');
    try {
      // Update using shared service
      const success = SharedIdeasService.updateIdeaStatus(id, 'Approved');
      
      if (success) {
        // Reload ideas from shared service
        await loadIdeas();
        Alert.alert('Success!', 'Idea approved successfully! It will now appear in the Submitted tab and be visible to employees in Inspire Corner.');
      } else {
        Alert.alert('Error', 'Failed to approve idea. Please try again.');
      }
      
      // TODO: Re-enable database call when issues are fixed
      // const { error } = await IdeasService.updateIdeaStatus(id, 'Approved', uuid.v4() as string);
    } catch (error) {
      console.error('Error approving idea:', error);
      Alert.alert('Error', 'Failed to approve idea. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle reject idea
  const handleReject = async (id: string) => {
    setActionLoading(id + '-reject');
    try {
      // For now, just update locally without database
      console.log('Rejecting idea:', id);
      
      // Update local state
      setIdeas(prev => prev.map(idea => 
        idea.id === id ? { ...idea, status: 'Rejected' as const } : idea
      ));
      
      Alert.alert('Success!', 'Idea rejected successfully!');
      
      // TODO: Re-enable database call when issues are fixed
      // const { error } = await IdeasService.updateIdeaStatus(id, 'Rejected', uuid.v4() as string);
    } catch (error) {
      console.error('Error rejecting idea:', error);
      Alert.alert('Error', 'Failed to reject idea. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  const borderColor = isDarkMode ? '#2A2A2A' : '#E0E0E0';

  // Filtered ideas
  const pendingIdeas = ideas.filter(i => i.status === IDEA_STATUS.PENDING);
  const submittedIdeas = ideas.filter(i => i.status === IDEA_STATUS.APPROVED || i.status === IDEA_STATUS.IN_PROGRESS);

  // Stats
  const totalIdeas = ideas.length;
  const inProgress = ideas.filter(i => i.status === IDEA_STATUS.IN_PROGRESS).length;
  const approved = ideas.filter(i => i.status === IDEA_STATUS.APPROVED).length;
  const totalVotes = ideas.reduce((sum, i) => sum + i.votes, 0);

  // Toast helper
  const showToast = (msg: string) => {
    setToast(msg);
    if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT);
    setTimeout(() => setToast(null), 1500);
  };

  // Handlers (other handlers for polls, etc.)
  const handleCreatePoll = (id: string) => {
    const idea = ideas.find(i => i.id === id);
    setPollModalIdea(idea || null);
    
    // If idea already has a poll, pre-populate the modal for editing
    if (idea?.hasPoll && idea.poll) {
      setPollQuestion(idea.poll.question);
      setPollOptions([...idea.poll.options]);
    } else {
      // Reset for new poll
      setPollQuestion('');
      setPollOptions(['', '']);
    }
    
    setPollError(null);
    // Modal is controlled by pollModalIdea being set
  };
  const handlePollOptionChange = (idx: number, value: string) => {
    setPollOptions(opts => opts.map((opt, i) => (i === idx ? value : opt)));
  };
  const handleAddPollOption = () => {
    setPollOptions(opts => [...opts, '']);
  };
  const handleRemovePollOption = (idx: number) => {
    if (pollOptions.length > 2) setPollOptions(opts => opts.filter((_, i) => i !== idx));
  };
  const handlePollCreate = () => {
    if (!pollQuestion.trim() || pollOptions.some(opt => !opt.trim())) {
      setPollError('Question and all options are required.');
      return;
    }
    if (!pollModalIdea) {
      setPollError('No idea selected for poll creation.');
      return;
    }

    // Create the poll and attach it to the idea using shared service
    const newPoll = {
      question: pollQuestion.trim(),
      options: pollOptions.filter(opt => opt.trim()).map(opt => opt.trim())
    };

    // Add poll using shared service
    const success = SharedIdeasService.addPollToIdea(pollModalIdea.id, newPoll);
    
    if (success) {
      // Reload ideas to reflect changes
      loadIdeas();
    }

    // Close modal and reset
    setPollModalIdea(null);
    setPollQuestion('');
    setPollOptions(['', '']);
    setPollError(null);
    
    Alert.alert(
      'Poll Created!', 
      `Poll "${pollQuestion.trim()}" has been successfully created for this idea. It will be visible when the idea is approved.`,
      [{ text: 'OK', style: 'default' }]
    );

    console.log('Poll created:', newPoll, 'for idea:', pollModalIdea.id);

    // TODO: When database is connected, save poll to database
    // const { error } = await IdeasService.createPoll({
    //   idea_id: pollModalIdea.id,
    //   question: newPoll.question,
    //   options: newPoll.options
    // });
  };
  const handleUpdateStatus = async (id: string, status: 'Pending' | 'In Progress' | 'Approved' | 'Rejected') => {
    setActionLoading(id + '-status');
    try {
             const { error } = await IdeasService.updateIdeaStatus(id, status, uuid.v4() as string);
      
      if (error) {
        Alert.alert('Error', 'Failed to update status. Please try again.');
        return;
      }

      // Reload ideas to get updated data
      await loadIdeas();
      showToast('Status updated');
      setManageIdea(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update status. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };
  const handleDelete = (id: string) => {
    Alert.alert('Delete Idea', 'Are you sure you want to delete this idea?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const { error } = await IdeasService.deleteIdea(id);
            
            if (error) {
              Alert.alert('Error', 'Failed to delete idea. Please try again.');
              return;
            }

            // Reload ideas to get updated data
            await loadIdeas();
            setManageIdea(null);
            showToast('Idea deleted');
          } catch (error) {
            Alert.alert('Error', 'Failed to delete idea. Please try again.');
          }
        }
      }
    ]);
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
            fontSize: 20,
            fontWeight: 'bold',
            letterSpacing: 0.5,
            color: isDarkMode ? '#fff' : '#222',
          }}>MIT<Text style={{ color: '#3CB371' }}>Connect</Text></Text>
        </View>
        <View style={{ width: 32 }} />
      </View>
      {/* Toast */}
      {toast && <View style={styles.toast}><Text style={styles.toastText}>{toast}</Text></View>}
      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <StatCard label="Total Ideas" value={totalIdeas} icon="bulb" />
          <StatCard label="In Progress" value={inProgress} icon="time" />
          <StatCard label="Approved" value={approved} icon="checkmark-circle" />
          <StatCard label="Total Votes" value={totalVotes} icon="heart" />
        </View>
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, tab === 'pending' && styles.activeTab]}
            onPress={() => setTab('pending')}
          >
            <Text style={[styles.tabText, { color: textColor }, tab === 'pending' && styles.activeTabText]}>
              Pending ({pendingIdeas.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, tab === 'submitted' && styles.activeTab]}
            onPress={() => setTab('submitted')}
          >
            <Text style={[styles.tabText, { color: textColor }, tab === 'submitted' && styles.activeTabText]}>
              Submitted ({submittedIdeas.length})
            </Text>
          </TouchableOpacity>
        </View>
        {/* Ideas List */}
        <View style={styles.ideasContainer}>
          {(tab === 'pending' ? pendingIdeas : submittedIdeas).length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="bulb-outline" size={64} color="#ccc" />
              <Text style={[styles.emptyStateTitle, { color: textColor }]}> 
                {tab === 'pending' ? 'No Pending Ideas' : 'No Submitted Ideas'}
              </Text>
              <Text style={[styles.emptyStateText, { color: secondaryTextColor }]}> 
                {tab === 'pending' 
                  ? "There are no pending ideas waiting for review."
                  : "There are no approved or in-progress ideas yet."
                }
              </Text>
            </View>
          ) : (
            (tab === 'pending' ? pendingIdeas : submittedIdeas).map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onApprove={tab === 'pending' ? handleApprove : undefined}
                onReject={tab === 'pending' ? handleReject : undefined}
                onCreatePoll={handleCreatePoll}
                onManage={() => setManageIdea(idea)}
                isPending={tab === 'pending'}
                actionLoading={actionLoading}
              />
            ))
          )}
        </View>
      </ScrollView>
      {/* Bottom Tab Bar */}
      <AdminTabBar activeTab="ideas" isDarkMode={isDarkMode} />
      {/* Create Poll Modal - Fullscreen, scrollable, with close icon */}
      <Modal visible={!!pollModalIdea} animationType="slide" transparent>
        <View style={styles.pollModalOverlay}>
          <View style={styles.pollModalFullScreen}>
            <View style={styles.pollModalHeader}>
              <Text style={[styles.pollModalHeaderLabel, { color: textColor }]}>Create a Poll</Text>
              <TouchableOpacity onPress={() => setPollModalIdea(null)} accessibilityLabel="Close poll modal">
                <Ionicons name="close" size={28} color={secondaryTextColor} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.pollModalScroll} keyboardShouldPersistTaps="handled">
              <Text style={[styles.pollModalLabel, { color: textColor }]}>Poll Question</Text>
              <TextInput
                style={[styles.pollModalInput, { backgroundColor: cardBackground, color: textColor, borderColor }]}
                value={pollQuestion}
                onChangeText={setPollQuestion}
                placeholder="Enter your poll question..."
                placeholderTextColor={secondaryTextColor}
                multiline
              />
              <Text style={[styles.pollModalLabel, { color: textColor }]}>Poll Options</Text>
              {pollOptions.map((option, idx) => (
                <View key={idx} style={styles.pollOptionContainer}>
                  <TextInput
                    style={[styles.pollModalInput, { backgroundColor: cardBackground, color: textColor, borderColor }]}
                    value={option}
                    onChangeText={(value) => handlePollOptionChange(idx, value)}
                    placeholder={`Option ${idx + 1}`}
                    placeholderTextColor={secondaryTextColor}
                  />
                  {pollOptions.length > 2 && (
                    <TouchableOpacity 
                      onPress={() => handleRemovePollOption(idx)}
                      style={styles.removeOptionBtn}
                    >
                      <Ionicons name="close-circle" size={20} color="#ff4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity onPress={handleAddPollOption} style={styles.addOptionBtn}>
                <Ionicons name="add-circle" size={20} color="#3CB371" />
                <Text style={[styles.addOptionText, { color: '#3CB371' }]}>Add Option</Text>
              </TouchableOpacity>
              {pollError && <Text style={styles.pollError}>{pollError}</Text>}
              <TouchableOpacity onPress={handlePollCreate} style={styles.createPollBtn}>
                <Text style={styles.createPollBtnText}>Create Poll</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Manage Idea Modal */}
      <Modal visible={!!manageIdea} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.3)' }]}>
          <View style={[styles.modalContent, { backgroundColor: cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Manage Idea</Text>
              <TouchableOpacity onPress={() => setManageIdea(null)}>
                <Ionicons name="close" size={24} color={secondaryTextColor} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <Text style={[styles.modalLabel, { color: textColor }]}>Status</Text>
              <View style={styles.statusButtons}>
                <TouchableOpacity 
                  style={[
                    styles.statusBtn,
                    { backgroundColor: isDarkMode ? '#2A2A2A' : '#eee' },
                    manageIdea?.status === IDEA_STATUS.IN_PROGRESS && styles.activeStatusBtn
                  ]}
                  onPress={() => manageIdea && handleUpdateStatus(manageIdea.id, 'In Progress')}
                  disabled={actionLoading === (manageIdea?.id || '') + '-status'}
                >
                  <Text style={[
                    styles.statusBtnText,
                    { color: textColor },
                    manageIdea?.status === IDEA_STATUS.IN_PROGRESS && styles.activeStatusBtnText
                  ]}>
                    In Progress
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.statusBtn,
                    { backgroundColor: isDarkMode ? '#2A2A2A' : '#eee' },
                    manageIdea?.status === IDEA_STATUS.APPROVED && styles.activeStatusBtn
                  ]}
                  onPress={() => manageIdea && handleUpdateStatus(manageIdea.id, 'Approved')}
                  disabled={actionLoading === (manageIdea?.id || '') + '-status'}
                >
                  <Text style={[
                    styles.statusBtnText,
                    { color: textColor },
                    manageIdea?.status === IDEA_STATUS.APPROVED && styles.activeStatusBtnText
                  ]}>
                    Approved
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => manageIdea && handleDelete(manageIdea.id)}
              >
                <Text style={styles.deleteBtnText}>Delete Idea</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Stat Card Component
function StatCard({ label, value, icon }: { label: string; value: number; icon: any }) {
  const { isDarkMode } = useTheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  
  return (
    <View style={[styles.statCard, { backgroundColor }]}>
      <Ionicons name={icon} size={24} color="#7D3C98" style={{ marginBottom: 4 }} />
      <Text style={[styles.statValue, { color: textColor }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: secondaryTextColor }]}>{label}</Text>
    </View>
  );
}

// Idea Card Component
function IdeaCard({ idea, onApprove, onReject, onCreatePoll, onManage, isPending, actionLoading }: {
  idea: Idea;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onCreatePoll?: (id: string) => void;
  onManage?: () => void;
  isPending?: boolean;
  actionLoading?: string | null;
}) {
  const { isDarkMode } = useTheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  
  const isApproveLoading = actionLoading === idea.id + '-approve';
  const isRejectLoading = actionLoading === idea.id + '-reject';
  const isPollLoading = actionLoading === idea.id + '-poll';
  
  return (
    <View style={[styles.ideaCard, { backgroundColor }]}>
      <View style={styles.ideaCardHeader}>
        <Text style={[styles.ideaCardTitle, { color: textColor }]}>{idea.title}</Text>
        {isPending && (
          <TouchableOpacity style={[styles.createPollBtn, isPollLoading && styles.btnDisabled]} onPress={() => !isPollLoading && onCreatePoll && onCreatePoll(idea.id)} disabled={isPollLoading} accessibilityLabel="Create a poll for this idea">
            {isPollLoading ? <ActivityIndicator size={12} color="#fff" /> : <Text style={styles.createPollText}>CREATE A POLL</Text>}
          </TouchableOpacity>
        )}
        {!isPending && (
          <View style={[styles.statusBadge, idea.status === 'Approved' ? styles.statusApproved : styles.statusInProgress]}>
            <Text style={styles.statusBadgeText}>{idea.status === 'Approved' ? 'Approved' : 'In Progress'}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.ideaCardCategory, { color: secondaryTextColor }]}>Category: {idea.category}</Text>
      <Text style={[styles.ideaCardDesc, { color: textColor }]}>{idea.description}</Text>
      {/* Show poll if present and not pending */}
      {!isPending && idea.poll && (
        <View style={styles.ideaPollBox}>
          <Text style={[styles.ideaPollQuestion, { color: textColor }]}>{idea.poll.question}</Text>
          {idea.poll.options.map((opt, idx) => (
            <View key={idx} style={styles.ideaPollOptionRow}>
              <Text style={styles.ideaPollOptionNum}>{idx + 1}.</Text>
              <Text style={[styles.ideaPollOptionText, { color: textColor }]}>{opt}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={styles.ideaCardActions}>
        {isPending && (
          <>
            <TouchableOpacity style={[styles.rejectBtn, isRejectLoading && styles.btnDisabled]} onPress={() => !isRejectLoading && onReject && onReject(idea.id)} disabled={isRejectLoading} accessibilityLabel="Reject this idea">
              {isRejectLoading ? <ActivityIndicator size={16} color="#fff" /> : <Text style={styles.rejectBtnText}>Reject</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.approveBtn, isApproveLoading && styles.btnDisabled]} onPress={() => !isApproveLoading && onApprove && onApprove(idea.id)} disabled={isApproveLoading} accessibilityLabel="Approve this idea">
              {isApproveLoading ? <ActivityIndicator size={16} color="#fff" /> : <Text style={styles.approveBtnText}>Approve</Text>}
            </TouchableOpacity>
          </>
        )}
        
        {/* Add Poll button - always available */}
        <TouchableOpacity style={[styles.addPollBtn, isPollLoading && styles.btnDisabled]} onPress={() => !isPollLoading && onCreatePoll && onCreatePoll(idea.id)} disabled={isPollLoading} accessibilityLabel="Add poll to this idea">
          {isPollLoading ? <ActivityIndicator size={16} color="#fff" /> : <Text style={styles.addPollBtnText}>{idea.hasPoll ? 'Update Poll' : 'Add Poll'}</Text>}
        </TouchableOpacity>
        
        {!isPending && (
          <TouchableOpacity style={styles.manageBtn} onPress={onManage} accessibilityLabel="Manage this idea">
            <Text style={styles.manageBtnText}>Manage Idea</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// Add PollResult component below the modal
function PollResult({ votesYes, votesNo }: { votesYes: number; votesNo: number }) {
  const total = votesYes + votesNo;
  const percentYes = total ? Math.round((votesYes / total) * 100) : 0;
  const percentNo = 100 - percentYes;
  return (
    <View style={styles.pollBox}>
      <Text style={styles.pollQuestion}>Do you support this idea?</Text>
      <View style={styles.pollBarRow}>
        <View style={[styles.pollBar, { backgroundColor: '#B7EACD', width: `${percentYes}%` }]}/>
        <View style={[styles.pollBar, { backgroundColor: '#F2B8B5', width: `${percentNo}%` }]}/>
      </View>
      <View style={styles.pollOptionsRow}>
        <View style={[styles.pollOption, { backgroundColor: '#B7EACD' }]}> 
          <Text style={styles.pollOptionNum}>1.</Text>
          <Text style={styles.pollOptionLabel}>Yes</Text>
          <Text style={styles.pollOptionVotes}>{votesYes} votes</Text>
          <Text style={styles.pollOptionPercent}>{percentYes}%</Text>
        </View>
        <View style={[styles.pollOption, { backgroundColor: '#F2B8B5' }]}> 
          <Text style={styles.pollOptionNum}>2.</Text>
          <Text style={styles.pollOptionLabelNo}>No</Text>
          <Text style={styles.pollOptionVotes}>{votesNo} votes</Text>
          <Text style={styles.pollOptionPercent}>{percentNo}%</Text>
        </View>
      </View>
      <Text style={styles.pollTotalVotes}>{total} overall votes</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    paddingTop: 24,
  },

  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32, // Add some padding at the bottom for the tab bar
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    marginBottom: 16,
    marginTop: 20, // add space above the stat cards
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    marginTop: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#7D3C98',
  },
  tabText: {
    fontSize: 15,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#7D3C98',
  },
  ideasContainer: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginLeft: 20,
    marginTop: 10,
    marginBottom: 6,
  },
  ideaCard: {
    borderRadius: 14,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  ideaCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ideaCardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
  },
  createPollBtn: {
    backgroundColor: '#E1BEE7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
  },
  createPollText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
  },
  statusApproved: {
    backgroundColor: '#3CB371',
  },
  statusInProgress: {
    backgroundColor: '#F7B32B',
  },
  statusBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
  },
  ideaCardCategory: {
    fontSize: 13,
    marginBottom: 2,
  },
  ideaCardDesc: {
    fontSize: 13,
    marginBottom: 10,
    marginTop: 2,
  },
  ideaCardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  rejectBtn: {
    backgroundColor: '#E74C3C',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
    flex: 1,
    alignItems: 'center',
  },
  rejectBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  addPollBtn: {
    backgroundColor: '#9C27B0',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flex: 1,
    alignItems: 'center',
    minWidth: 100,
  },
  addPollBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  approveBtn: {
    backgroundColor: '#3CB371',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
    flex: 1,
    alignItems: 'center',
  },
  approveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  manageBtn: {
    backgroundColor: '#7D3C98',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
    flex: 1,
    alignItems: 'center',
  },
  manageBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  statusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statusBtn: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginHorizontal: 4,
  },
  activeStatusBtn: {
    backgroundColor: '#3CB371',
  },
  activeStatusBtnText: {
    color: '#fff',
  },
  deleteBtn: {
    backgroundColor: '#E74C3C',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  deleteBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  pollBox: {
    marginTop: 18,
    marginBottom: 8,
  },
  pollQuestion: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 8,
  },
  pollBarRow: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 8,
    backgroundColor: '#eee',
    overflow: 'hidden',
    marginBottom: 8,
  },
  pollBar: {
    height: 8,
  },
  pollOptionsRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  pollOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  pollOptionNum: {
    fontWeight: 'bold',
    marginRight: 4,
  },
  pollOptionLabel: {
    fontWeight: 'bold',
    color: '#2D3A8C',
    marginRight: 4,
  },
  pollOptionLabelNo: {
    fontWeight: 'bold',
    color: '#E74C3C',
    marginRight: 4,
  },
  pollOptionVotes: {
    marginRight: 4,
    fontSize: 13,
  },
  pollOptionPercent: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  pollTotalVotes: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  toast: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 40 : 60,
    left: 0,
    right: 0,
    zIndex: 100,
    alignItems: 'center',
  },
  toastText: {
    backgroundColor: '#222',
    color: '#fff',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    fontSize: 14,
    overflow: 'hidden',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  pollModalContent: {
    borderRadius: 16,
    padding: 24,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    alignSelf: 'center',
  },
  pollModalTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#888',
    marginBottom: 12,
  },
  pollModalInput: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
  },
  pollOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  removeOptionBtn: {
    marginLeft: 8,
  },
  addOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 2,
    marginBottom: 10,
  },
  addOptionText: {
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 4,
  },

  createPollBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  pollError: {
    color: '#E74C3C',
    fontSize: 13,
    marginBottom: 4,
    marginTop: 2,
  },
  ideaPollBox: {
    backgroundColor: '#F8F8FF',
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  ideaPollQuestion: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 6,
    color: '#7D3C98',
  },
  ideaPollOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  ideaPollOptionNum: {
    fontWeight: 'bold',
    color: '#C678F5',
    marginRight: 4,
  },
  ideaPollOptionText: {
    fontSize: 13,
  },
  pollModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.12)',
    justifyContent: 'flex-end',
  },
  pollModalFullScreen: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '70%',
    maxHeight: '90%',
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  pollModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },
  pollModalHeaderLabel: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  pollModalScroll: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  pollModalLabel: {
    fontWeight: 'bold',
    fontSize: 15,
    marginTop: 12,
    marginBottom: 4,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    alignItems: 'center',
    marginHorizontal: 4,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
  modalScroll: {
    flex: 1,
  },
  statusBtnText: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
}); 