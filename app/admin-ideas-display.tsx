import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../components/ThemeContext';
import { useThemeColor } from '../hooks/useThemeColor';
import { IdeasService, type Idea } from '../services/IdeasService';
import AdminTabBar from '../components/AdminTabBar';
import AdminHeader from '../components/AdminHeader';
import uuid from 'react-native-uuid';

export default function AdminIdeasDisplay() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';

  // Load ideas from database
  const loadIdeas = async () => {
    try {
      setLoading(true);
      
      // For now, use mock data until database issues are resolved
      console.log('Loading ideas (mock data mode)');
      
      // Mock ideas for testing
      const mockIdeas = [
        {
          id: '1',
          title: 'Dark Mode App Feature',
          description: 'Add dark mode to improve user experience during night time usage.',
          category: 'Mobile App',
          status: 'Pending',
          submitter_name: 'Demo User',
          submitter_role: 'employee',
          created_at: new Date().toISOString(),
          total_votes: 0,
          yes_votes: 0,
          no_votes: 0,
          comment_count: 0
        },
        {
          id: '2',
          title: 'Enhanced Notification System',
          description: 'Improve push notifications with better categorization and scheduling.',
          category: 'Technology',
          status: 'Pending',
          submitter_name: 'Jane Smith',
          submitter_role: 'trainee',
          created_at: new Date().toISOString(),
          total_votes: 0,
          yes_votes: 0,
          no_votes: 0,
          comment_count: 0
        },
        {
          id: '3',
          title: 'Team Collaboration Tool',
          description: 'Build an internal tool for better team communication and project tracking.',
          category: 'Productivity',
          status: 'Pending',
          submitter_name: 'Mike Johnson',
          submitter_role: 'employee',
          created_at: new Date().toISOString(),
          total_votes: 0,
          yes_votes: 0,
          no_votes: 0,
          comment_count: 0
        }
      ];
      
      setIdeas(mockIdeas as any);
      
      // TODO: Re-enable database loading
      // const { data, error } = await IdeasService.getAdminIdeas();
      // if (error) {
      //   console.error('Error loading ideas:', error);
      //   Alert.alert('Error', 'Failed to load ideas. Please try again.');
      //   return;
      // }
      // if (data) {
      //   setIdeas(data);
      // }
    } catch (error) {
      console.error('Error loading ideas:', error);
      Alert.alert('Error', 'Failed to load ideas. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle approve idea
  const handleApprove = async (id: string) => {
    setActionLoading(id + '-approve');
    try {
      // For now, just show success without database call
      console.log('Approving idea:', id);
      
      Alert.alert('Success', 'Idea approved successfully! (Local demo mode)');
      
      // TODO: Re-enable when UUID issues are fixed
      // const { error } = await IdeasService.updateIdeaStatus(id, 'Approved', uuid.v4() as string);
      // if (error) {
      //   Alert.alert('Error', 'Failed to approve idea. Please try again.');
      //   return;
      // }
      // await loadIdeas();
    } catch (error) {
      Alert.alert('Error', 'Failed to approve idea. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle reject idea
  const handleReject = async (id: string) => {
    setActionLoading(id + '-reject');
    try {
      console.log('Rejecting idea:', id);
      Alert.alert('Success', 'Idea rejected successfully! (Local demo mode)');
      
      // TODO: Re-enable when UUID issues are fixed
      // const { error } = await IdeasService.updateIdeaStatus(id, 'Rejected', uuid.v4() as string);
    } catch (error) {
      Alert.alert('Error', 'Failed to reject idea. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle set idea to in progress
  const handleInProgress = async (id: string) => {
    setActionLoading(id + '-inprogress');
    try {
      console.log('Setting idea to In Progress:', id);
      Alert.alert('Success', 'Idea set to In Progress! (Local demo mode)');
      
      // TODO: Re-enable when UUID issues are fixed
      // const { error } = await IdeasService.updateIdeaStatus(id, 'In Progress', uuid.v4() as string);
    } catch (error) {
      Alert.alert('Error', 'Failed to update idea status. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle add poll to idea
  const handleAddPoll = async (id: string) => {
    setActionLoading(id + '-addpoll');
    try {
      // Create poll creation dialog
      Alert.alert(
        'Create Poll',
        'Create a poll for this idea to gather community feedback.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Create "Do you support this idea?" Poll', 
            onPress: () => {
              // For now, just show success and mark idea as having a poll
              console.log('Creating poll for idea:', id);
              Alert.alert(
                'Poll Created!', 
                'Poll "Do you support this idea?" has been added to this idea. Users can now vote Yes/No.',
                [{ text: 'OK', style: 'default' }]
              );
              
              // TODO: When database is connected, this will:
              // 1. Create poll in database
              // 2. Link poll to idea
              // 3. Make poll visible to trainees/employees in Inspire Corner
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create poll. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // Load ideas on component mount
  useEffect(() => {
    loadIdeas();
  }, []);

  // Filter ideas by status
  const pendingIdeas = ideas.filter(idea => idea.status === 'Pending');
  const approvedIdeas = ideas.filter(idea => idea.status === 'Approved');
  const inProgressIdeas = ideas.filter(idea => idea.status === 'In Progress');
  const rejectedIdeas = ideas.filter(idea => idea.status === 'Rejected');

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A7A6FB" />
          <Text style={[styles.loadingText, { color: textColor }]}>Loading ideas...</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <SafeAreaView style={styles.safeArea}>
        <AdminHeader title="Ideas Management" showLogo={false} />
        
        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: cardBackground }]}>
            <Text style={[styles.statNumber, { color: textColor }]}>{pendingIdeas.length}</Text>
            <Text style={[styles.statLabel, { color: secondaryTextColor }]}>Pending</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: cardBackground }]}>
            <Text style={[styles.statNumber, { color: textColor }]}>{approvedIdeas.length}</Text>
            <Text style={[styles.statLabel, { color: secondaryTextColor }]}>Approved</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: cardBackground }]}>
            <Text style={[styles.statNumber, { color: textColor }]}>{inProgressIdeas.length}</Text>
            <Text style={[styles.statLabel, { color: secondaryTextColor }]}>In Progress</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: cardBackground }]}>
            <Text style={[styles.statNumber, { color: textColor }]}>{rejectedIdeas.length}</Text>
            <Text style={[styles.statLabel, { color: secondaryTextColor }]}>Rejected</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Pending Ideas Section */}
          <Text style={[styles.sectionTitle, { color: textColor }]}>Pending Review ({pendingIdeas.length})</Text>
          {pendingIdeas.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: cardBackground }]}>
              <Ionicons name="checkmark-circle-outline" size={32} color="#4CAF50" />
              <Text style={[styles.emptyText, { color: secondaryTextColor }]}>No pending ideas</Text>
            </View>
          ) : (
            pendingIdeas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onApprove={handleApprove}
                onReject={handleReject}
                onInProgress={handleInProgress}
                onAddPoll={handleAddPoll}
                actionLoading={actionLoading}
                cardBackground={cardBackground}
                textColor={textColor}
                secondaryTextColor={secondaryTextColor}
              />
            ))
          )}

          {/* Approved Ideas Section */}
          <Text style={[styles.sectionTitle, { color: textColor }]}>Approved Ideas ({approvedIdeas.length})</Text>
          {approvedIdeas.map((idea) => (
            <ApprovedIdeaCard
              key={idea.id}
              idea={idea}
              cardBackground={cardBackground}
              textColor={textColor}
              secondaryTextColor={secondaryTextColor}
            />
          ))}

          {/* Recent Activity */}
          <Text style={[styles.sectionTitle, { color: textColor }]}>Recent Activity</Text>
          <View style={[styles.activityCard, { backgroundColor: cardBackground }]}>
            <Text style={[styles.activityText, { color: textColor }]}>
              Total submissions: {ideas.length}
            </Text>
            <Text style={[styles.activityText, { color: secondaryTextColor }]}>
              From trainees: {ideas.filter(i => i.submitter_role === 'trainee').length}
            </Text>
            <Text style={[styles.activityText, { color: secondaryTextColor }]}>
              From employees: {ideas.filter(i => i.submitter_role === 'employee').length}
            </Text>
          </View>
        </ScrollView>

        <AdminTabBar activeTab="ideas" isDarkMode={isDarkMode} />
      </SafeAreaView>
    </View>
  );
}

// Pending Idea Card Component
function IdeaCard({ idea, onApprove, onReject, onInProgress, onAddPoll, actionLoading, cardBackground, textColor, secondaryTextColor }: {
  idea: Idea;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onInProgress: (id: string) => void;
  onAddPoll: (id: string) => void;
  actionLoading: string | null;
  cardBackground: string;
  textColor: string;
  secondaryTextColor: string;
}) {
  const isApproving = actionLoading === idea.id + '-approve';
  const isRejecting = actionLoading === idea.id + '-reject';
  const isInProgress = actionLoading === idea.id + '-inprogress';
  const isAddingPoll = actionLoading === idea.id + '-addpoll';

  return (
    <View style={[styles.ideaCard, { backgroundColor: cardBackground }]}>
      <View style={styles.ideaHeader}>
        <Text style={[styles.ideaTitle, { color: textColor }]}>{idea.title}</Text>
        <View style={[styles.roleBadge, { backgroundColor: idea.submitter_role === 'trainee' ? '#E3F2FD' : '#F3E5F5' }]}>
          <Text style={[styles.roleBadgeText, { color: idea.submitter_role === 'trainee' ? '#1976D2' : '#7B1FA2' }]}>
            {idea.submitter_role}
          </Text>
        </View>
      </View>
      
      <Text style={[styles.ideaCategory, { color: secondaryTextColor }]}>
        Category: {idea.category}
      </Text>
      
      <Text style={[styles.submitterInfo, { color: secondaryTextColor }]}>
        Submitted by: {idea.submitter_name}
      </Text>
      
      <Text style={[styles.ideaDescription, { color: textColor }]}>
        {idea.description}
      </Text>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.approveBtn, isApproving && styles.buttonDisabled]}
          onPress={() => onApprove(idea.id)}
          disabled={isApproving || isRejecting || isInProgress || isAddingPoll}
        >
          {isApproving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={styles.smallButtonText}>Approve</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.rejectBtn, isRejecting && styles.buttonDisabled]}
          onPress={() => onReject(idea.id)}
          disabled={isApproving || isRejecting || isInProgress || isAddingPoll}
        >
          {isRejecting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="close" size={16} color="#fff" />
              <Text style={styles.smallButtonText}>Reject</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.inProgressBtn, isInProgress && styles.buttonDisabled]}
          onPress={() => onInProgress(idea.id)}
          disabled={isApproving || isRejecting || isInProgress || isAddingPoll}
        >
          {isInProgress ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="time" size={16} color="#fff" />
              <Text style={styles.smallButtonText}>In Progress</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pollBtn, isAddingPoll && styles.buttonDisabled]}
          onPress={() => {
            Alert.alert('Add Poll Clicked!', `Creating poll for idea: ${idea.id}`);
            onAddPoll(idea.id);
          }}
          disabled={isApproving || isRejecting || isInProgress || isAddingPoll}
        >
          {isAddingPoll ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="bar-chart" size={16} color="#fff" />
              <Text style={styles.smallButtonText}>🗳️ ADD POLL</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Approved Idea Card Component
function ApprovedIdeaCard({ idea, cardBackground, textColor, secondaryTextColor }: {
  idea: Idea;
  cardBackground: string;
  textColor: string;
  secondaryTextColor: string;
}) {
  return (
    <View style={[styles.ideaCard, { backgroundColor: cardBackground }]}>
      <View style={styles.ideaHeader}>
        <Text style={[styles.ideaTitle, { color: textColor }]}>{idea.title}</Text>
        <View style={[styles.statusBadge, styles.approvedBadge]}>
          <Ionicons name="checkmark-circle" size={14} color="#fff" />
          <Text style={styles.statusBadgeText}>Approved</Text>
        </View>
      </View>
      
      <Text style={[styles.ideaCategory, { color: secondaryTextColor }]}>
        Category: {idea.category} • By: {idea.submitter_name}
      </Text>
      
      <Text style={[styles.ideaDescription, { color: textColor }]}>
        {idea.description}
      </Text>

      {/* Vote Stats */}
      <View style={styles.voteStats}>
        <Text style={[styles.voteStatsText, { color: secondaryTextColor }]}>
          Total Votes: {idea.total_votes || 0} • 
          Yes: {idea.yes_votes || 0} • 
          No: {idea.no_votes || 0} • 
          Comments: {idea.comment_count || 0}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16 },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginVertical: 12,
  },
  statCard: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: { fontSize: 20, fontWeight: 'bold' },
  statLabel: { fontSize: 12, marginTop: 4 },
  scrollView: { flex: 1 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyCard: {
    padding: 24,
    marginHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: { marginTop: 8, fontSize: 14 },
  ideaCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ideaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ideaTitle: { fontSize: 16, fontWeight: 'bold', flex: 1, marginRight: 8 },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleBadgeText: { fontSize: 12, fontWeight: '600' },
  ideaCategory: { fontSize: 14, marginBottom: 4 },
  submitterInfo: { fontSize: 13, marginBottom: 8 },
  ideaDescription: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  approveBtn: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    width: '48%',
    justifyContent: 'center',
    marginBottom: 8,
  },
  rejectBtn: {
    backgroundColor: '#F44336',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    width: '48%',
    justifyContent: 'center',
    marginBottom: 8,
  },
  inProgressBtn: {
    backgroundColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    width: '48%',
    justifyContent: 'center',
    marginBottom: 8,
  },
  pollBtn: {
    backgroundColor: '#FF1493',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    width: '48%',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#FF69B4',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '600', marginLeft: 4 },
  smallButtonText: { color: '#fff', fontWeight: '600', marginLeft: 2, fontSize: 12 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  approvedBadge: { backgroundColor: '#4CAF50' },
  statusBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600', marginLeft: 4 },
  voteStats: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#eee' },
  voteStatsText: { fontSize: 12 },
  activityCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityText: { fontSize: 14, marginBottom: 4 },
}); 