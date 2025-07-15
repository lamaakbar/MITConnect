import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Pressable, ActivityIndicator, Platform, ToastAndroid, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';

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

// Mock ideas data
const mockIdeas: Idea[] = [
  {
    id: '1',
    title: 'Monthly Recognition Wall',
    category: 'Culture & Morale',
    description:
      'Start a monthly tradition of spotlighting employees who went above and beyond, with a small write-up and a photo on a shared digital board or office wall. This promotes a positive work culture and boosts morale across teams.',
    status: IDEA_STATUS.PENDING,
    votes: 34,
    hasPoll: false,
  },
  {
    id: '2',
    title: 'After–Hours Game Night',
    category: 'Culture & Fun',
    description:
      'Suggest a monthly game night – online or in-person – featuring video games, board games, or trivia to relax and strengthen team spirit.',
    status: IDEA_STATUS.PENDING,
    votes: 21,
    hasPoll: false,
  },
  {
    id: '3',
    title: 'Mental Health Recharge Hour',
    category: 'Employee Wellness',
    description:
      'Introduce a monthly hour where teams pause work to focus on mental health – guided meditation, nature walks, no-meeting time, or stress-relief activities.',
    status: IDEA_STATUS.PENDING,
    votes: 56,
    hasPoll: false,
  },
  {
    id: '4',
    title: 'Flexible Fridays',
    category: 'Work-Life Balance',
    description:
      'Allow employees to choose their work location or hours on Fridays to promote flexibility and work-life balance.',
    status: IDEA_STATUS.IN_PROGRESS,
    votes: 44,
    hasPoll: true,
  },
  {
    id: '5',
    title: 'Book Exchange Program',
    category: 'Learning & Growth',
    description:
      'Set up a book exchange shelf in the office for employees to share and borrow books, encouraging continuous learning.',
    status: IDEA_STATUS.APPROVED,
    votes: 111,
    hasPoll: true,
  },
];

export default function IdeasManagement() {
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
    setPendingPoll({ ideaId: pollModalIdea!.id, question: pollQuestion, options: pollOptions });
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
    <View style={styles.pageContainer}>
      {/* Toast */}
      {toast && <View style={styles.toast}><Text style={styles.toastText}>{toast}</Text></View>}
      {/* Create Poll Modal - Fullscreen, scrollable, with close icon */}
      <Modal visible={!!pollModalIdea} animationType="slide" transparent>
        <View style={styles.pollModalOverlay}>
          <View style={styles.pollModalFullScreen}>
            <View style={styles.pollModalHeader}>
              <Text style={styles.pollModalHeaderLabel}>Create a Poll</Text>
              <TouchableOpacity onPress={() => setPollModalIdea(null)} accessibilityLabel="Close poll modal">
                <Ionicons name="close" size={28} color="#888" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.pollModalScroll} keyboardShouldPersistTaps="handled">
              <Text style={styles.pollModalLabel}>Poll Question</Text>
              <TextInput
                style={styles.pollModalTitleInput}
                placeholder="What's on your mind?..."
                value={pollQuestion}
                onChangeText={setPollQuestion}
                maxLength={100}
                autoFocus
                placeholderTextColor="#bbb"
              />
              <Text style={styles.pollModalLabel}>Options</Text>
              {pollOptions.map((opt, idx) => (
                <View key={idx} style={styles.pollOptionInputRow}>
                  <Text style={styles.pollOptionNum}>{idx + 1}.</Text>
                  <View style={styles.pollOptionInputBox}>
                    <TextInput
                      style={styles.pollOptionInput}
                      placeholder={`Option #${idx + 1}`}
                      value={opt}
                      onChangeText={v => handlePollOptionChange(idx, v)}
                      placeholderTextColor="#bbb"
                    />
                  </View>
                  {pollOptions.length > 2 && (
                    <TouchableOpacity onPress={() => handleRemovePollOption(idx)} accessibilityLabel="Remove option">
                      <Ionicons name="close-circle" size={18} color="#E74C3C" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity style={styles.moreOptionsBtn} onPress={handleAddPollOption} accessibilityLabel="Add more options">
                <Text style={styles.moreOptionsText}>More options </Text>
                <Ionicons name="add-circle" size={16} color="#C678F5" />
              </TouchableOpacity>
              {pollError && <Text style={styles.pollError}>{pollError}</Text>}
              <TouchableOpacity style={styles.createPollMainBtn} onPress={handlePollCreate} accessibilityLabel="Create poll">
                <Text style={styles.createPollMainBtnText}>Create</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* Header */}
      <View style={styles.headerRow}>
        <Ionicons name="bulb-outline" size={24} color="#F7B32B" style={{ marginRight: 8 }} />
        <View>
          <Text style={styles.headerTitle}>Inspire Corner</Text>
          <Text style={styles.headerSubtitle}>Innovation & Ideas Hub</Text>
        </View>
      </View>
      {/* Summary Cards */}
      <View style={styles.statsRow}>
        <StatCard label="Total Ideas" value={totalIdeas} icon="bulb-outline" />
        <StatCard label="In Progress" value={inProgress} icon="time-outline" />
        <StatCard label="Approved" value={approved} icon="checkmark-circle-outline" />
        <StatCard label="Total Votes" value={totalVotes} icon="people-outline" />
      </View>
      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'pending' && styles.tabBtnActive]}
          onPress={() => setTab('pending')}
          accessibilityLabel="Show pending ideas"
        >
          <Text style={[styles.tabText, tab === 'pending' && styles.tabTextActive]}>Pending Ideas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'submitted' && styles.tabBtnActive]}
          onPress={() => setTab('submitted')}
          accessibilityLabel="Show submitted ideas"
        >
          <Text style={[styles.tabText, tab === 'submitted' && styles.tabTextActive]}>Submitted Ideas</Text>
        </TouchableOpacity>
      </View>
      {/* Ideas List */}
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {tab === 'pending' ? (
          <>
            <Text style={styles.sectionTitle}>{pendingIdeas.length} Pending Ideas</Text>
            {pendingIdeas.map(idea => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onApprove={handleApprove}
                onReject={handleReject}
                onCreatePoll={handleCreatePoll}
                isPending
                actionLoading={actionLoading}
              />
            ))}
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>{submittedIdeas.length} Submitted Ideas</Text>
            {submittedIdeas.map(idea => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onManage={() => setManageIdea(idea)}
              />
            ))}
          </>
        )}
      </ScrollView>
      {/* Manage Idea Modal */}
      <Modal visible={!!manageIdea} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Manage Idea</Text>
            {manageIdea && (
              <>
                <Text style={styles.modalIdeaTitle}>{manageIdea.title}</Text>
                {/* Status Action Buttons Row */}
                <View style={styles.manageActionsRow}>
                  <TouchableOpacity style={styles.inProgressBtn} onPress={() => handleUpdateStatus(manageIdea.id, IDEA_STATUS.IN_PROGRESS)}>
                    <Text style={styles.inProgressBtnText}>In Progress</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => handleUpdateStatus(manageIdea.id, IDEA_STATUS.PENDING)}>
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
                {/* Poll Results Section */}
                <PollResult votesYes={manageIdea.votes} votesNo={5} />
              </>
            )}
            <Pressable style={styles.closeModalBtn} onPress={() => setManageIdea(null)}>
              <Text style={styles.closeModalText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Stat Card Component
function StatCard({ label, value, icon }: { label: string; value: number; icon: any }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={24} color="#7D3C98" style={{ marginBottom: 4 }} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  const isApproveLoading = actionLoading === idea.id + '-approve';
  const isRejectLoading = actionLoading === idea.id + '-reject';
  const isPollLoading = actionLoading === idea.id + '-poll';
  return (
    <View style={styles.ideaCard}>
      <View style={styles.ideaCardHeader}>
        <Text style={styles.ideaCardTitle}>{idea.title}</Text>
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
      <Text style={styles.ideaCardCategory}>Category: {idea.category}</Text>
      <Text style={styles.ideaCardDesc}>{idea.description}</Text>
      {/* Show poll if present and not pending */}
      {!isPending && idea.poll && (
        <View style={styles.ideaPollBox}>
          <Text style={styles.ideaPollQuestion}>{idea.poll.question}</Text>
          {idea.poll.options.map((opt, idx) => (
            <View key={idx} style={styles.ideaPollOptionRow}>
              <Text style={styles.ideaPollOptionNum}>{idx + 1}.</Text>
              <Text style={styles.ideaPollOptionText}>{opt}</Text>
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
  pageContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
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
    color: '#3CB371',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    textAlign: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
    marginTop: 2,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#7D3C98',
  },
  tabText: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: '#7D3C98',
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
    backgroundColor: '#fff',
    borderRadius: 14,
    marginHorizontal: 16,
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
    color: '#222',
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
    color: '#666',
    marginBottom: 2,
  },
  ideaCardDesc: {
    fontSize: 13,
    color: '#444',
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
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  modalIdeaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  modalIdeaCategory: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  modalIdeaDesc: {
    fontSize: 13,
    color: '#444',
    marginBottom: 10,
    marginTop: 2,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 14,
    color: '#222',
    marginRight: 8,
  },
  statusBtn: {
    backgroundColor: '#eee',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginHorizontal: 4,
  },
  statusBtnActive: {
    backgroundColor: '#3CB371',
  },
  statusBtnText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 13,
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
  pollResultsBox: {
    backgroundColor: '#E1BEE7',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginLeft: 8,
  },
  pollResultsLabel: {
    color: '#7D3C98',
    fontWeight: 'bold',
    fontSize: 13,
  },
  pollResultsVotes: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 15,
    marginTop: 2,
  },
  closeModalBtn: {
    marginTop: 18,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 24,
    backgroundColor: '#888',
    borderRadius: 8,
  },
  closeModalText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  manageActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
  },
  inProgressBtn: {
    backgroundColor: '#2D3A8C',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginHorizontal: 4,
  },
  inProgressBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
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
    marginRight: 8,
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
    backgroundColor: '#fff',
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
  pollModalTitleInput: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#888',
    marginBottom: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pollOptionInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pollOptionInputBox: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    marginLeft: 4,
    marginRight: 4,
  },
  pollOptionInput: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#444',
  },
  moreOptionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 2,
    marginBottom: 10,
  },
  moreOptionsText: {
    color: '#C678F5',
    fontWeight: 'bold',
    fontSize: 13,
  },
  createPollMainBtn: {
    backgroundColor: '#C678F5',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    shadowColor: '#C678F5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  createPollMainBtnText: {
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
    color: '#444',
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
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.12, shadowRadius: 12 }, android: { elevation: 8 } }),
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
    color: '#7D3C98',
  },
  pollModalScroll: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  pollModalLabel: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#444',
    marginTop: 12,
    marginBottom: 4,
  },
}); 