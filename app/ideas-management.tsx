import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert, ActivityIndicator, Platform, ToastAndroid } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import AdminTabBar from '../components/AdminTabBar';
import AdminHeader from '../components/AdminHeader';

// Idea status types
const IDEA_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in progress',
  APPROVED: 'approved',
};

// Add poll data to Idea type
type Poll = {
  question: string;
  options: string[];
};
type Idea = {
  id: string;
  title: string;
  category: string;
  description: string;
  status: string;
  votes: number;
  hasPoll?: boolean;
  poll?: Poll;
};

// Empty ideas array - no mock data
const mockIdeas: Idea[] = [];

export default function IdeasManagement() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  const [tab, setTab] = useState<'pending' | 'submitted'>('pending');
  const [manageIdea, setManageIdea] = useState<Idea | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>(mockIdeas);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pollModalIdea, setPollModalIdea] = useState<Idea | null>(null);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollError, setPollError] = useState<string | null>(null);
  // In IdeasManagement component state, add a pendingPoll state
  const [pendingPoll, setPendingPoll] = useState<{ ideaId: string, question: string, options: string[] } | null>(null);

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

  // Handlers
  const handleApprove = (id: string) => {
    setActionLoading(id + '-approve');
    setTimeout(() => {
      setIdeas(prev => prev.map(i => {
        if (i.id === id) {
          if (pendingPoll && pendingPoll.ideaId === id) {
            return { ...i, status: IDEA_STATUS.APPROVED, hasPoll: true, poll: { question: pendingPoll.question, options: pendingPoll.options } };
          }
          return { ...i, status: IDEA_STATUS.APPROVED };
        }
        return i;
      }));
      setPendingPoll(null);
      setActionLoading(null);
      showToast('Idea approved');
    }, 800);
  };
  const handleReject = (id: string) => {
    setActionLoading(id + '-reject');
    setTimeout(() => {
      setIdeas(prev => prev.filter(i => i.id !== id));
      setActionLoading(null);
      showToast('Idea discarded');
    }, 800);
  };
  const handleCreatePoll = (id: string) => {
    const idea = ideas.find(i => i.id === id);
    setPollModalIdea(idea || null);
    setPollQuestion('');
    setPollOptions(['', '']);
    setPollError(null);
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
    setPendingPoll({ ideaId: pollModalIdea.id, question: pollQuestion, options: pollOptions });
    setPollModalIdea(null);
    showToast('Poll ready to be attached. Approve to publish.');
  };
  const handleUpdateStatus = (id: string, status: string) => {
    setActionLoading(id + '-status');
    setTimeout(() => {
      setIdeas(prev => prev.map(i => i.id === id ? { ...i, status } : i));
      setActionLoading(null);
      showToast('Status updated');
      setManageIdea(null);
    }, 800);
  };
  const handleDelete = (id: string) => {
    Alert.alert('Delete Idea', 'Are you sure you want to delete this idea?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: () => {
          setIdeas(prev => prev.filter(i => i.id !== id));
          setManageIdea(null);
          showToast('Idea deleted');
        }
      }
    ]);
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor }]}>
      {/* Unified Admin Header */}
      <AdminHeader title="Ideas Management" />

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
                onCreatePoll={tab === 'pending' ? handleCreatePoll : undefined}
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
                  onPress={() => manageIdea && handleUpdateStatus(manageIdea.id, IDEA_STATUS.IN_PROGRESS)}
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
                  onPress={() => manageIdea && handleUpdateStatus(manageIdea.id, IDEA_STATUS.APPROVED)}
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
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const textColor = isDarkMode ? '#ECEDEE' : '#222';
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  
  return (
    <View style={[styles.statCard, { backgroundColor: cardBackground }]}>
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
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const textColor = isDarkMode ? '#ECEDEE' : '#222';
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  
  const isApproveLoading = actionLoading === idea.id + '-approve';
  const isRejectLoading = actionLoading === idea.id + '-reject';
  const isPollLoading = actionLoading === idea.id + '-poll';
  
  return (
    <View style={[styles.ideaCard, { backgroundColor: cardBackground }]}>
      <View style={styles.ideaCardHeader}>
        <Text style={[styles.ideaCardTitle, { color: textColor }]}>{idea.title}</Text>
        {isPending && (
          <TouchableOpacity style={[styles.createPollBtn, isPollLoading && styles.btnDisabled]} onPress={() => !isPollLoading && onCreatePoll && onCreatePoll(idea.id)} disabled={isPollLoading} accessibilityLabel="Create a poll for this idea">
            {isPollLoading ? <ActivityIndicator size={12} color="#fff" /> : <Text style={styles.createPollText}>CREATE A POLL</Text>}
          </TouchableOpacity>
        )}
        {!isPending && (
          <View style={[styles.statusBadge, idea.status === 'approved' ? styles.statusApproved : styles.statusInProgress]}>
            <Text style={styles.statusBadgeText}>{idea.status === 'approved' ? 'Approved' : 'In Progress'}</Text>
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
      {isPending ? (
        <View style={styles.ideaCardActions}>
          <TouchableOpacity style={[styles.rejectBtn, isRejectLoading && styles.btnDisabled]} onPress={() => !isRejectLoading && onReject && onReject(idea.id)} disabled={isRejectLoading} accessibilityLabel="Reject this idea">
            {isRejectLoading ? <ActivityIndicator size={16} color="#fff" /> : <Text style={styles.rejectBtnText}>Reject</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.approveBtn, isApproveLoading && styles.btnDisabled]} onPress={() => !isApproveLoading && onApprove && onApprove(idea.id)} disabled={isApproveLoading} accessibilityLabel="Approve this idea">
            {isApproveLoading ? <ActivityIndicator size={16} color="#fff" /> : <Text style={styles.approveBtnText}>Approve</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.manageBtn} onPress={onManage} accessibilityLabel="Manage this idea">
          <Text style={styles.manageBtnText}>Manage Idea</Text>
        </TouchableOpacity>
      )}
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
    justifyContent: 'space-between',
    marginTop: 8,
  },
  rejectBtn: {
    backgroundColor: '#E74C3C',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  rejectBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  approveBtn: {
    backgroundColor: '#3CB371',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 24,
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
    paddingHorizontal: 24,
    alignSelf: 'flex-end',
    marginTop: 8,
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