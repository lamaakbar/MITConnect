import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Pressable, SafeAreaView, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { ToastAndroid, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserContext } from '../components/UserContext';
import { useTheme } from '../components/ThemeContext';
import { useThemeColor } from '../hooks/useThemeColor';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { IdeasService, type Idea as DatabaseIdea } from '../services/IdeasService';
import { IdeaLikesService, type IdeaWithLikes } from '../services/IdeaLikesService';
import SharedIdeasService from '../services/SharedIdeasService';
import { supabase } from '../services/supabase';
import RoleGuard from '../components/RoleGuard';



export default function InspirerCornerScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [votingModalVisible, setVotingModalVisible] = useState(false);
  const [pollVotingModalVisible, setPollVotingModalVisible] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<IdeaWithLikes | null>(null);
  const [selectedPollIdea, setSelectedPollIdea] = useState<IdeaWithLikes | null>(null);

  const [ideaTitle, setIdeaTitle] = useState('');

  const [ideaDescription, setIdeaDescription] = useState('');
  const [ideas, setIdeas] = useState<IdeaWithLikes[]>([]);
  const [expandedCards, setExpandedCards] = useState<{ [key: string]: boolean }>({});
  const [showAllIdeas, setShowAllIdeas] = useState(false);
  const [allIdeasLoaded, setAllIdeasLoaded] = useState(false);
  const [loadingAllIdeas, setLoadingAllIdeas] = useState(false);
  const [userReactions, setUserReactions] = useState<{ [key: string]: boolean | null }>({});
  const [stats, setStats] = useState({
    totalIdeas: 0,
    inProgress: 0,
    approved: 0,
    totalReactions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const router = useRouter();
  const { userRole, userProfile } = useUserContext();
  const { isDarkMode } = useTheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  
  // Dark mode colors
  const screenBg = isDarkMode ? '#121212' : '#F5F5F7';
  const cardBg = isDarkMode ? '#1E1E1E' : '#fff';
  const primaryText = isDarkMode ? '#E0E0E0' : '#000000';
  const secondaryText = isDarkMode ? '#8E8E93' : '#666';
  const buttonBg = isDarkMode ? '#4FD1C5' : '#A7A6FB';

  // Load ideas and user reactions
  useEffect(() => {
    loadIdeasAndReactions();
  }, []);

  const loadIdeasAndReactions = async () => {
    try {
      setLoading(true);
      
      // Get user session first to avoid multiple auth calls
      const { data: { user } } = await supabase.auth.getUser();
      
      // Load only approved ideas with polls directly from database for faster loading
      const { data: approvedIdeasData, error: ideasError } = await supabase
        .rpc('get_ideas_with_votes')
        .eq('status', 'Approved')
        .order('created_at', { ascending: false })
        .limit(10); // Limit to first 10 for faster loading
      
      if (ideasError) {
        console.error('Error loading ideas:', ideasError);
        return;
      }

      if (approvedIdeasData) {
        // Transform data to match IdeaWithLikes type with poll information
        // Transform data to match IdeaWithLikes type with poll information
        const ideasWithVotes = approvedIdeasData.map((idea: any) => {
          const likes_count = idea.like_votes || 0;
          const dislikes_count = idea.dislike_votes || 0;
          const total_reactions = likes_count + dislikes_count;
          
          return {
            ...idea,
            likes_count,
            dislikes_count,
            total_reactions,
            hasPoll: !!idea.poll_id,
            poll: idea.poll_id ? {
              id: idea.poll_id,
              question: idea.poll_question || '',
              options: typeof idea.poll_options === 'string' 
                ? JSON.parse(idea.poll_options) 
                : idea.poll_options || []
            } : undefined
          };
        });
        
        setIdeas(ideasWithVotes);
        
        // Calculate stats efficiently
        const totalIdeas = ideasWithVotes.length;
        const totalReactions = ideasWithVotes.reduce((sum: number, idea: any) => sum + idea.total_reactions, 0);
        
        // Get stats for all ideas in a separate query (non-blocking)
        (async () => {
          try {
            const { data: allIdeas } = await supabase
              .from('ideas')
              .select('status');
            
            if (allIdeas) {
              const inProgress = allIdeas.filter(i => i.status === 'In Progress').length;
              const approved = allIdeas.filter(i => i.status === 'Approved').length;
              
              setStats({
                totalIdeas: approved,
                inProgress,
                approved,
                totalReactions,
              });
            }
          } catch (error) {
            console.error('Error loading stats:', error);
          }
        })();

        // Load user reactions in background (non-blocking)
        if (user?.id && approvedIdeasData.length > 0) {
          (async () => {
            try {
              const { data: userReactions } = await supabase
                .from('idea_votes')
                .select('idea_id, vote_type')
                .eq('user_id', user.id)
                .in('idea_id', approvedIdeasData.map((idea: any) => idea.id));
              
              const userReactionsData: { [key: string]: boolean | null } = {};
              
              // Initialize all reactions as null
              approvedIdeasData.forEach((idea: any) => {
                userReactionsData[idea.id] = null;
              });

              // Map the batch results
              userReactions?.forEach(reaction => {
                userReactionsData[reaction.idea_id] = reaction.vote_type === 'like';
              });
              
              setUserReactions(userReactionsData);
            } catch (error) {
              console.error('Error loading user reactions:', error);
            }
          })();
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setInitialLoadComplete(true);
    }
  };

  const handleLikeReaction = useCallback(async (ideaId: string, liked: boolean) => {
    // Get current user from Supabase session
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || !user.id) {
      Alert.alert('Login Required', 'You must be logged in to react to ideas.');
      return;
    }

    // Optimistic UI update - immediately reflect the change
    const previousReaction = userReactions[ideaId];
    setUserReactions(prev => ({
      ...prev,
      [ideaId]: liked
    }));

    // Optimistically update the idea counts
    setIdeas(prevIdeas => 
      prevIdeas.map(idea => {
          if (idea.id === ideaId) {
          // Adjust counts based on previous reaction
          if (previousReaction === true && liked) {
            // Was liked, still liked - no change
            return idea;
          } else if (previousReaction === false && !liked) {
            // Was disliked, still disliked - no change
            return idea;
          } else if (previousReaction === true && !liked) {
            // Was liked, now disliked
            return {
              ...idea,
              likes_count: idea.likes_count - 1,
              dislikes_count: idea.dislikes_count + 1,
              total_reactions: idea.total_reactions
            };
          } else if (previousReaction === false && liked) {
            // Was disliked, now liked
            return {
              ...idea,
              likes_count: idea.likes_count + 1,
              dislikes_count: idea.dislikes_count - 1,
              total_reactions: idea.total_reactions
            };
          } else if (previousReaction === null) {
            // No previous reaction
            return {
              ...idea,
              likes_count: idea.likes_count + (liked ? 1 : 0),
              dislikes_count: idea.dislikes_count + (liked ? 0 : 1),
              total_reactions: idea.total_reactions + 1
            };
          }
          }
          return idea;
      })
    );

    try {
      const { data, error } = await IdeaLikesService.submitReaction(
        user.id, 
        ideaId, 
        liked, 
        userProfile?.name || user.email || 'Anonymous User',
        userRole
      );
      
      if (error) {
        console.error('Error submitting reaction:', error);
        // Revert optimistic update on error
        setUserReactions(prev => ({
          ...prev,
          [ideaId]: previousReaction
        }));
        setIdeas(prevIdeas => 
          prevIdeas.map(idea => 
            idea.id === ideaId ? {
              ...idea,
              likes_count: idea.likes_count - (liked ? 1 : 0),
              dislikes_count: idea.dislikes_count - (liked ? 0 : 1),
              total_reactions: idea.total_reactions - (previousReaction === null ? 1 : 0)
            } : idea
          )
        );
        Alert.alert('Error', 'Failed to submit reaction. Please try again.');
        return;
      }

      // Success - no need to refresh since we already updated optimistically
    } catch (error) {
      console.error('Error handling reaction:', error);
      // Revert optimistic update on error
      setUserReactions(prev => ({
        ...prev,
        [ideaId]: previousReaction
      }));
      setIdeas(prevIdeas => 
        prevIdeas.map(idea => 
          idea.id === ideaId ? {
            ...idea,
            likes_count: idea.likes_count - (liked ? 1 : 0),
            dislikes_count: idea.dislikes_count - (liked ? 0 : 1),
            total_reactions: idea.total_reactions - (previousReaction === null ? 1 : 0)
          } : idea
        )
      );
      Alert.alert('Error', 'Failed to submit reaction. Please try again.');
    }
  }, [userReactions, userProfile?.name, userRole]);

  const handleSubmitIdea = async () => {
    if (!ideaTitle.trim() || !ideaDescription.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Get current user from Supabase session
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || !user.id) {
      Alert.alert('Login Required', 'You must be logged in to submit ideas.');
      return;
    }

    try {
      // Submit idea using IdeasService (status will be 'Pending' by default)
      const { data, error } = await IdeasService.submitIdea({
        title: ideaTitle.trim(),
        description: ideaDescription.trim(),
        category: 'Other', // Default category since we removed the selection
        submitter_id: user.id,
        submitter_name: userProfile?.name || user.email || 'Employee User',
        submitter_role: userRole as 'trainee' | 'employee' | 'admin'
      });

      if (error) {
        console.error('Error submitting idea:', error);
        Alert.alert('Error', 'Failed to submit idea. Please try again.');
        return;
      }

      console.log('Idea submitted:', data);

      setModalVisible(false);
      setIdeaTitle('');
      setIdeaDescription('');
      
      Alert.alert(
        'Success!', 
        'Your idea has been submitted and is pending admin review. It will appear here once approved.',
        [{ text: 'OK', style: 'default' }]
      );

      // Refresh ideas list
      await loadIdeasAndReactions();
    } catch (error) {
      console.error('Error submitting idea:', error);
      Alert.alert('Error', 'Failed to submit idea. Please try again.');
    }
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

  const toggleCardExpansion = (ideaId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [ideaId]: !prev[ideaId]
    }));
  };

  const loadAllIdeas = async () => {
    if (allIdeasLoaded) {
      setShowAllIdeas(true);
      return;
    }

    setLoadingAllIdeas(true);
    try {
      const { data: allApprovedIdeas, error } = await supabase
        .from('ideas')
        .select(`
          id,
          title,
          description,
          category,
          status,
          submitter_id,
          submitter_name,
          submitter_role,
          created_at
        `)
        .eq('status', 'Approved')
        .order('created_at', { ascending: false });

      if (!error && allApprovedIdeas) {
        // Transform data to match IdeaWithLikes type and calculate vote counts
        const ideasWithVotes = await Promise.all(
          allApprovedIdeas.map(async (idea) => {
            // Get vote counts for this idea
            const { data: votes } = await supabase
              .from('idea_votes')
              .select('vote_type')
              .eq('idea_id', idea.id);
            
            const likes_count = votes?.filter(v => v.vote_type === 'like').length || 0;
            const dislikes_count = votes?.filter(v => v.vote_type === 'dislike').length || 0;
            const total_reactions = likes_count + dislikes_count;
            
            return {
              ...idea,
              likes_count,
              dislikes_count,
              total_reactions
            };
          })
        );
        
        setIdeas(ideasWithVotes);
        setAllIdeasLoaded(true);
        setShowAllIdeas(true);
      }
    } catch (error) {
      console.error('Error loading all ideas:', error);
    } finally {
      setLoadingAllIdeas(false);
    }
  };

  const openVotingModal = (idea: IdeaWithLikes) => {
    setSelectedIdea(idea);
    setVotingModalVisible(true);
  };

  const openPollVotingModal = (idea: IdeaWithLikes) => {
    setSelectedPollIdea(idea);
    setPollVotingModalVisible(true);
  };

  

  const handlePollVote = async (optionIndex: number) => {
    if (!selectedPollIdea || !selectedPollIdea.poll) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !user.id) {
        Alert.alert('Login Required', 'You must be logged in to vote on polls.');
        return;
      }

      // Submit poll response - get poll ID from the idea data
      const pollId = (selectedPollIdea as any).poll_id || selectedPollIdea.poll?.id;
      
      if (!pollId) {
        Alert.alert('Error', 'Poll ID not found.');
        return;
      }

      const { error } = await IdeasService.submitPollResponse({
        poll_id: pollId,
        user_id: user.id,
        user_name: userProfile?.name || user.email || 'Anonymous User',
        user_role: userRole || 'trainee',
        selected_option: optionIndex
      });

      if (error) {
        console.error('Error submitting poll vote:', error);
        Alert.alert('Error', 'Failed to submit vote. Please try again.');
        return;
      }

      // Reload ideas to reflect the new vote
      await loadIdeasAndReactions();
      
      // Close modal
      setPollVotingModalVisible(false);
      setSelectedPollIdea(null);
      
      Alert.alert('Success!', '✅ Your vote has been recorded.', [{ text: 'OK' }]);
    } catch (error) {
      console.error('Error voting on poll:', error);
      Alert.alert('Error', 'Failed to submit vote. Please try again.');
    }
  };

  const displayedIdeas = useMemo(() => 
    showAllIdeas ? ideas : ideas.slice(0, 3), 
    [showAllIdeas, ideas]
  );
  
  const communityIdeas = useMemo(() => 
    ideas.filter(i => i.status === 'Approved'),
    [ideas]
  );

  // Show loading only for initial page load, not for background data fetching
  if (!initialLoadComplete && loading) {
  return (
      <View style={[styles.container, { backgroundColor: screenBg }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: primaryText }]}>Loading ideas...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <RoleGuard allowedRoles={['trainee', 'employee']}>
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={primaryText} />
              </TouchableOpacity>
            <View style={styles.iconContainer}>
              <Ionicons name="bulb" size={24} color="#FF9500" />
            </View>
            <View>
              <Text style={[styles.title, { color: primaryText }]}>Inspire Corner</Text>
              <Text style={[styles.subtitle, { color: secondaryText }]}>Innovation & Ideas Hub</Text>
            </View>
          </View>
        </View>

        {/* New Idea Button - Centered below header */}
        <View style={styles.newIdeaButtonContainer}>
          <TouchableOpacity style={[styles.newIdeaBtn, { backgroundColor: isDarkMode ? '#4FD1C5' : buttonBg }]} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.newIdeaBtnText}>New Idea</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                  {/* Compact Stats Row */}
          <View style={styles.statsContainer}>
          <View style={[styles.statItem, { backgroundColor: cardBg }]}>
            <Ionicons name="bulb-outline" size={16} color="#FF9500" style={styles.statIcon} />
              <Text style={[styles.statNumber, { color: primaryText }]}>{stats.totalIdeas}</Text>
              <Text style={[styles.statLabel, { color: secondaryText }]}>Total Ideas</Text>
            </View>
            
          <View style={[styles.statItem, { backgroundColor: cardBg }]}>
            <Ionicons name="settings-outline" size={16} color="#007AFF" style={styles.statIcon} />
              <Text style={[styles.statNumber, { color: primaryText }]}>{stats.inProgress}</Text>
              <Text style={[styles.statLabel, { color: secondaryText }]}>In Progress</Text>
            </View>
            
          <View style={[styles.statItem, { backgroundColor: cardBg }]}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#34C759" style={styles.statIcon} />
              <Text style={[styles.statNumber, { color: primaryText }]}>{stats.approved}</Text>
              <Text style={[styles.statLabel, { color: secondaryText }]}>Approved</Text>
            </View>
          </View>

          {/* Community Ideas */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: primaryText }]}>Community Ideas</Text>
            
            {displayedIdeas.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.ideaCard, { backgroundColor: cardBg }]}
                onPress={() => toggleCardExpansion(item.id)}
                activeOpacity={0.7}
              >
                {/* Status Tag Only */}
                 <View style={styles.tagsRow}>
                  <View style={[
                    styles.tag, 
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

                                 {/* Idea Content */}
                 <Text style={[styles.ideaTitle, { color: primaryText }]}>{item.title}</Text>
                 <Text style={[styles.ideaDescription, { color: secondaryText }]}>{item.description}</Text>

                {/* Like/Dislike Buttons */}
                <View style={styles.reactionButtons}>
                  {loading && !initialLoadComplete && (
                    <View style={styles.reactionLoadingIndicator}>
                      <Text style={[styles.reactionLoadingText, { color: secondaryText }]}>Loading reactions...</Text>
                    </View>
                  )}
                                         <TouchableOpacity 
                       style={[
                      styles.reactionButton,
                      userReactions[item.id] === true && styles.reactionButtonActive
                    ]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleLikeReaction(item.id, true);
                    }}
                  >
                    <Ionicons 
                      name={userReactions[item.id] === true ? "thumbs-up" : "thumbs-up-outline"} 
                      size={16} 
                      color={userReactions[item.id] === true ? "#34C759" : "#666"} 
                    />
                    <Text style={[
                      styles.reactionButtonText, 
                      { color: userReactions[item.id] === true ? "#34C759" : secondaryText }
                    ]}>
                      {item.likes_count}
                    </Text>
                     </TouchableOpacity>
                     
                     <TouchableOpacity 
                       style={[
                      styles.reactionButton,
                      userReactions[item.id] === false && styles.reactionButtonActive
                    ]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleLikeReaction(item.id, false);
                    }}
                  >
                    <Ionicons 
                      name={userReactions[item.id] === false ? "thumbs-down" : "thumbs-down-outline"} 
                      size={16} 
                      color={userReactions[item.id] === false ? "#FF3B30" : "#666"} 
                    />
                    <Text style={[
                      styles.reactionButtonText, 
                      { color: userReactions[item.id] === false ? "#FF3B30" : secondaryText }
                    ]}>
                      {item.dislikes_count}
                    </Text>
                     </TouchableOpacity>
                  </View>

                  {/* Poll Section - Simplified */}
                  {item.hasPoll && item.poll && (
                    <View style={styles.pollSection}>
                      <Text style={[styles.pollQuestion, { color: primaryText }]}>
                        📊 Poll: {item.poll.question}
                      </Text>
                      <Text style={[styles.pollVoteCount, { color: secondaryText }]}>
                        {item.poll_total_responses || 0} votes • Poll available
                      </Text>
                      <TouchableOpacity 
                        style={styles.viewResultsButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          openPollVotingModal(item);
                        }}
                      >
                        <Text style={[styles.viewResultsText, { color: '#007AFF' }]}>View Poll</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                {/* Expanded Content */}
                {expandedCards[item.id] && (
                  <View style={styles.expandedContent}>
                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: isDarkMode ? '#3A3A3C' : '#f6f7f9' }]}
                        onPress={() => handleShare(item.id)}
                      >
                        <Ionicons name="share-outline" size={16} color="#007AFF" />
                        <Text style={[styles.actionBtnText, { color: primaryText }]}>Share</Text>
                      </TouchableOpacity>

                      {/* Admin Manage Button */}
                      {userRole === 'admin' && (
                                     <TouchableOpacity 
                          style={[styles.actionBtn, { backgroundColor: isDarkMode ? '#3A3A3C' : '#f6f7f9' }]}
                        >
                          <Ionicons name="settings-outline" size={16} color="#8E8E93" />
                          <Text style={[styles.actionBtnText, { color: primaryText }]}>Manage</Text>
                   </TouchableOpacity>
                      )}
                </View>
                  </View>
                )}
                   </TouchableOpacity>
            ))}

            {/* View All Ideas Button */}
            {!showAllIdeas && ideas.length > 3 && (
              <TouchableOpacity 
                style={[styles.viewAllButton, { backgroundColor: cardBg }]}
                onPress={loadAllIdeas}
                disabled={loadingAllIdeas}
              >
                <Text style={[styles.viewAllButtonText, { color: primaryText }]}>
                  {loadingAllIdeas ? 'Loading...' : `View All Ideas (${ideas.length})`}
                </Text>
                <Ionicons name={loadingAllIdeas ? "hourglass-outline" : "chevron-down"} size={20} color={primaryText} />
                   </TouchableOpacity>
            )}

            {/* Show Less Button */}
            {showAllIdeas && (
              <TouchableOpacity 
                style={[styles.viewAllButton, { backgroundColor: cardBg }]}
                onPress={() => setShowAllIdeas(false)}
              >
                <Text style={[styles.viewAllButtonText, { color: primaryText }]}>Show Less</Text>
                <Ionicons name="chevron-up" size={20} color={primaryText} />
                   </TouchableOpacity>
            )}
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

        {/* Poll Voting Modal */}
        <Modal
          visible={pollVotingModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setPollVotingModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: cardBg }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: primaryText }]}>Vote on Poll</Text>
                <TouchableOpacity onPress={() => setPollVotingModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalContent}>
                {selectedPollIdea && selectedPollIdea.poll && (
                  <>
                    <Text style={[styles.pollModalQuestion, { color: primaryText }]}>
                      {selectedPollIdea.poll.question}
                    </Text>
                    <View style={styles.pollModalOptions}>
                      {selectedPollIdea.poll.options.map((option, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[styles.pollModalOption, { backgroundColor: isDarkMode ? '#3A3A3C' : '#F2F2F7' }]}
                          onPress={() => handlePollVote(index)}
                        >
                          <Text style={[styles.pollModalOptionText, { color: primaryText }]}>
                            {option}
                          </Text>
                          <Ionicons name="chevron-forward" size={20} color={secondaryText} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
              </ScrollView>
              
              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setPollVotingModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
    loadingText: { 
    fontSize: 16, 
    fontWeight: '500',
  },
  reactionLoadingIndicator: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  reactionLoadingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
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
  title: { fontSize: 20, fontWeight: 'bold', letterSpacing: 0.5 },
  subtitle: { textAlign: 'center', marginTop: 2, fontSize: 12 },
  newIdeaButtonContainer: {
    alignItems: 'center',
    marginVertical: 12,
    marginHorizontal: 20,
  },
   newIdeaBtn: { 
     borderRadius: 12, 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
     shadowColor: '#818cf8', 
     shadowOpacity: 0.18, 
     shadowRadius: 8, 
     elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 140,
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
  statItem: {
     borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
     alignItems: 'center',
     justifyContent: 'center',
     flex: 1,
     marginHorizontal: 4,
     shadowColor: '#818cf8',
     shadowOpacity: 0.08,
     shadowRadius: 6,
     elevation: 2,
   },
  statIcon: {
    marginBottom: 4,
  },
   statNumber: { 
    fontSize: 18, 
     fontWeight: '600', 
    lineHeight: 22,
     textAlign: 'center',
     marginBottom: 2,
   },
   statLabel: { 
    fontSize: 10, 
     fontWeight: '400',
     textAlign: 'center',
    lineHeight: 12,
     marginTop: 0,
   },
  sectionContainer: { marginTop: 12, marginBottom: 24, marginHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, letterSpacing: 0.2 },
   ideaCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
     shadowColor: '#000',
     shadowOpacity: 0.06,
    shadowRadius: 8,
     elevation: 2,
   },
     tagsRow: {
     flexDirection: 'row',
     alignItems: 'center',
    marginBottom: 12,
     flexWrap: 'wrap',
   },
     tag: {
    borderRadius: 8,
    paddingHorizontal: 8,
     paddingVertical: 4,
     marginRight: 8,
     marginBottom: 4,
     flexDirection: 'row',
     alignItems: 'center',
   },

  approvedTag: { backgroundColor: '#34d399' },
  inProgressTag: { backgroundColor: '#818cf8' },
  statusTagText: { fontSize: 11, color: '#fff', marginLeft: 4 },
  ideaTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, lineHeight: 22 },
  ideaDescription: { fontSize: 13, marginBottom: 16, lineHeight: 18, color: '#666' },
  reactionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  reactionButton: {
     flexDirection: 'row',
     alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
     borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  reactionButtonActive: {
    backgroundColor: '#e8f5e8',
  },
  reactionButtonText: {
     fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  pollSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  pollQuestion: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },

  pollModalQuestion: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  pollModalOptions: {
    marginBottom: 20,
  },
  pollModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  pollModalOptionText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
     actionBtn: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
   },
   actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  viewAllButtonText: {
     fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
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
  pollVoteCount: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  viewResultsButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  viewResultsText: {
    fontSize: 12,
    fontWeight: '600',
  },
}); 