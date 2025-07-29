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
  const [userPollResponses, setUserPollResponses] = useState<{ [key: string]: number | null }>({});
  const [pollVotingLoading, setPollVotingLoading] = useState<{ [key: string]: boolean }>({});
  const [expandedPolls, setExpandedPolls] = useState<{ [key: string]: boolean }>({});
  const [pollVoteCounts, setPollVoteCounts] = useState<{ [key: string]: { total: number; options: { [key: number]: number } } }>({});
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
  
  // Debug log for user role
  console.log('🔍 Current userRole:', userRole);
  
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
      
      // Add retry logic for network issues
      let retryCount = 0;
      const maxRetries = 3;
      let approvedIdeasData: any = null;
      
      while (retryCount < maxRetries) {
        try {
          // Load approved and in-progress ideas with polls directly from database
          const { data, error: ideasError } = await supabase
            .rpc('get_ideas_with_votes')
            .in('status', ['Approved', 'In Progress'])
            .order('created_at', { ascending: false })
            .limit(10); // Limit to first 10 for faster loading
          
          if (ideasError) {
            // If the error is due to missing table, fall back to manual loading
            if (ideasError.message.includes('idea_comments') || ideasError.message.includes('does not exist')) {
              console.log('🔄 Falling back to manual loading due to missing table...');
              break; // Exit retry loop and use manual loading
            }
            
            // Only log other errors (not the missing table error)
            console.error('Error loading ideas:', ideasError);
            
            if (ideasError.message.includes('Network') || ideasError.message.includes('fetch')) {
              retryCount++;
              if (retryCount < maxRetries) {
                console.log(`🔄 Network error, retrying... (${retryCount}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 2000 * retryCount)); // Exponential backoff
                continue;
              }
            }
            return;
          }
          
          // If we get here, the request was successful
          approvedIdeasData = data;
          break;
        } catch (networkError) {
          retryCount++;
          console.error(`Network error (attempt ${retryCount}/${maxRetries}):`, networkError);
          
          if (retryCount < maxRetries) {
            console.log(`🔄 Retrying in ${retryCount * 2} seconds...`);
            await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
          } else {
            console.error('❌ Max retries reached, giving up');
            Alert.alert('Connection Error', 'Unable to load ideas. Please check your internet connection and try again.');
            return;
          }
        }
      }
      
      // If RPC failed due to missing table, use manual loading
      if (!approvedIdeasData) {
        console.log('🔄 Using manual loading approach...');
        
        // Load ideas and polls separately, then match them
        const { data: allIdeas, error: ideasError } = await supabase
          .from('ideas')
          .select('*')
          .in('status', ['Approved', 'In Progress'])
          .order('created_at', { ascending: false })
          .limit(10);
        
        const { data: allPolls, error: pollsError } = await supabase
          .from('idea_polls')
          .select('*')
          .eq('is_active', true);
        
        console.log('🔧 All ideas loaded:', allIdeas?.length);
        console.log('🔧 All polls loaded:', allPolls?.length);
        console.log('🔧 Ideas error:', ideasError);
        console.log('🔧 Polls error:', pollsError);
        
        // Match polls to ideas manually
        const ideasWithPolls = allIdeas?.map(idea => {
          const matchingPoll = allPolls?.find(poll => poll.idea_id === idea.id);
          return {
            ...idea,
            poll_id: matchingPoll?.id,
            poll_question: matchingPoll?.question,
            poll_options: matchingPoll?.options,
            poll_total_responses: matchingPoll?.total_votes || 0
          };
        }) || [];
        
        console.log('🔧 Ideas with polls matched:', ideasWithPolls.map(idea => ({
          id: idea.id,
          title: idea.title,
          hasPoll: !!idea.poll_id,
          poll_question: idea.poll_question
        })));
        
        // Use the manually matched data
        approvedIdeasData = ideasWithPolls;
      }

      console.log('🔍 Raw ideas data from database:', approvedIdeasData);

      // DEBUG: Check if polls exist in database
      try {
        const { data: existingPolls, error: pollsError } = await supabase
          .from('idea_polls')
          .select('*');
        
        console.log('🔍 Existing polls in database:', existingPolls);
        console.log('🔍 Polls error:', pollsError);
        
        // Also test the function directly
        const { data: functionTest, error: functionError } = await supabase
          .rpc('get_ideas_with_votes');
        
        console.log('🔍 Function test result:', functionTest?.slice(0, 2)); // Show first 2 results
        console.log('🔍 Function error:', functionError);
      } catch (error) {
        console.log('❌ Error checking polls:', error);
      }

      if (approvedIdeasData) {
        // TEMPORARY: Create a test poll for the first idea to verify functionality
        if (approvedIdeasData.length > 0) {
          const firstIdea = approvedIdeasData[0];
          console.log('🔍 Creating test poll for idea:', firstIdea.id, firstIdea.title);
          
          // Try to create a test poll
          try {
            const { data: testPoll, error: pollError } = await supabase
              .from('idea_polls')
              .insert([{
                idea_id: firstIdea.id,
                question: 'Do you support this idea?',
                options: JSON.stringify(['Yes, I support it!', 'No, I have concerns', 'Maybe, need more info']),
                created_by: user?.id || 'test',
                is_active: true
              }])
              .select()
              .single();
            
            if (pollError) {
              console.log('❌ Error creating test poll:', pollError);
            } else {
              console.log('✅ Test poll created successfully:', testPoll);
            }
          } catch (error) {
            console.log('❌ Exception creating test poll:', error);
          }
        }

        // TEMPORARY FIX: Load ideas with polls manually since the function is broken
        console.log('🔧 Using manual poll loading since function is broken...');
        
        // Load ideas and polls separately, then match them
        const { data: allIdeas, error: ideasError } = await supabase
          .from('ideas')
          .select('*')
          .in('status', ['Approved', 'In Progress'])
          .order('created_at', { ascending: false })
          .limit(10);
        
        const { data: allPolls, error: pollsError } = await supabase
          .from('idea_polls')
          .select('*')
          .eq('is_active', true);
        
        console.log('🔧 All ideas loaded:', allIdeas?.length);
        console.log('🔧 All polls loaded:', allPolls?.length);
        console.log('🔧 Ideas error:', ideasError);
        console.log('🔧 Polls error:', pollsError);
        
        // Match polls to ideas manually
        const ideasWithPolls = allIdeas?.map(idea => {
          const matchingPoll = allPolls?.find(poll => poll.idea_id === idea.id);
          return {
            ...idea,
            poll_id: matchingPoll?.id,
            poll_question: matchingPoll?.question,
            poll_options: matchingPoll?.options,
            poll_total_responses: matchingPoll?.total_votes || 0
          };
        }) || [];
        
        console.log('🔧 Ideas with polls matched:', ideasWithPolls.map(idea => ({
          id: idea.id,
          title: idea.title,
          hasPoll: !!idea.poll_id,
          poll_question: idea.poll_question
        })));
        
        // Use the manually matched data
        const finalIdeasData = ideasWithPolls;

        // Transform data to match IdeaWithLikes type with poll information
        const ideasWithVotes = finalIdeasData.map((idea: any) => {
          const likes_count = idea.like_votes || 0;
          const dislikes_count = idea.dislike_votes || 0;
          const total_reactions = likes_count + dislikes_count;
          
          // Handle both function data and manual poll loading data
          let pollData = null;
          if (idea.idea_polls && idea.idea_polls.length > 0) {
            // Manual loading structure
            pollData = idea.idea_polls[0];
          } else if (idea.poll_id) {
            // Function data structure
            pollData = {
              id: idea.poll_id,
              question: idea.poll_question,
              options: idea.poll_options,
              total_votes: idea.poll_total_responses
            };
          }
          
          const transformedIdea = {
            ...idea,
            likes_count,
            dislikes_count,
            total_reactions,
            hasPoll: !!pollData,
            poll: pollData ? {
              id: pollData.id,
              question: pollData.question || '',
              options: typeof pollData.options === 'string' 
                ? JSON.parse(pollData.options) 
                : pollData.options || []
            } : undefined,
            poll_id: pollData?.id,
            poll_question: pollData?.question,
            poll_options: typeof pollData?.options === 'string' 
              ? JSON.parse(pollData.options) 
              : pollData?.options || [],
            poll_total_responses: pollData?.total_votes || 0
          };
          
          console.log('🔍 Transformed idea:', {
            id: transformedIdea.id,
            title: transformedIdea.title,
            status: transformedIdea.status,
            hasPoll: transformedIdea.hasPoll,
            poll: transformedIdea.poll,
            poll_id: transformedIdea.poll_id,
            poll_question: transformedIdea.poll_question,
            poll_options: transformedIdea.poll_options
          });
          
          return transformedIdea;
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
        if (user?.id && finalIdeasData.length > 0) {
          (async () => {
            try {
              // Load all votes for these ideas to get accurate counts
              const { data: allVotes } = await supabase
                .from('idea_votes')
                .select('idea_id, vote_type, user_id')
                .in('idea_id', finalIdeasData.map((idea: any) => idea.id));
              
              // Calculate accurate vote counts
              const voteCounts: { [key: string]: { likes: number; dislikes: number; total: number } } = {};
              const userReactionsData: { [key: string]: boolean | null } = {};
              
              // Initialize counts for all ideas
              finalIdeasData.forEach((idea: any) => {
                voteCounts[idea.id] = { likes: 0, dislikes: 0, total: 0 };
                userReactionsData[idea.id] = null;
              });
              
              // Count votes and track user reactions
              allVotes?.forEach(vote => {
                if (voteCounts[vote.idea_id]) {
                  if (vote.vote_type === 'like') {
                    voteCounts[vote.idea_id].likes++;
                  } else if (vote.vote_type === 'dislike') {
                    voteCounts[vote.idea_id].dislikes++;
                  }
                  voteCounts[vote.idea_id].total++;
                  
                  // Track current user's reaction
                  if (vote.user_id === user.id) {
                    userReactionsData[vote.idea_id] = vote.vote_type === 'like';
                  }
                }
              });
              
              // Update ideas with accurate counts
              setIdeas(prevIdeas => 
                prevIdeas.map(idea => ({
                  ...idea,
                  likes_count: voteCounts[idea.id]?.likes || 0,
                  dislikes_count: voteCounts[idea.id]?.dislikes || 0,
                  total_reactions: voteCounts[idea.id]?.total || 0
                }))
              );
              
              setUserReactions(userReactionsData);
              
              console.log('📊 Accurate vote counts calculated:', voteCounts);
              console.log('👤 User reactions loaded:', userReactionsData);
            } catch (error) {
              console.error('Error loading user reactions:', error);
            }
          })();

          // Load user poll responses in background (non-blocking)
          if (user?.id && finalIdeasData.length > 0) {
            (async () => {
              try {
                // Get ideas with polls
                const ideasWithPolls = finalIdeasData.filter((idea: any) => idea.poll_id);
                
                if (ideasWithPolls.length > 0) {
                  // Fetch all poll responses for these polls - optimized query
                  const pollIds = ideasWithPolls.map((idea: any) => idea.poll_id);
                  const { data: allPollResponses } = await supabase
                    .from('poll_responses')
                    .select('poll_id, selected_option, user_id, created_at')
                    .in('poll_id', pollIds)
                    .order('created_at', { ascending: false });
                  
                  console.log('📊 All poll responses:', allPollResponses);
                  
                  // Optimized vote counting - group by poll and get latest per user
                  const voteCounts: { [key: string]: { total: number; options: { [key: number]: number } } } = {};
                  const userResponses: { [key: string]: number | null } = {};
                  
                  // Group responses by poll_id for faster processing
                  const responsesByPoll: { [key: string]: any[] } = {};
                  allPollResponses?.forEach(response => {
                    if (!responsesByPoll[response.poll_id]) {
                      responsesByPoll[response.poll_id] = [];
                    }
                    responsesByPoll[response.poll_id].push(response);
                  });
                  
                  // Process each poll
                  pollIds.forEach(pollId => {
                    const pollResponses = responsesByPoll[pollId] || [];
                    
                    // Get latest response per user (responses are already ordered by created_at desc)
                    const userLatestResponses: { [key: string]: any } = {};
                    pollResponses.forEach(response => {
                      if (!userLatestResponses[response.user_id]) {
                        userLatestResponses[response.user_id] = response;
                      }
                    });
                    
                    // Count votes from latest responses
                    const latestResponses = Object.values(userLatestResponses);
                    const totalVotes = latestResponses.length;
                    const optionVotes: { [key: number]: number } = {};
                    
                    latestResponses.forEach(response => {
                      const option = response.selected_option;
                      optionVotes[option] = (optionVotes[option] || 0) + 1;
                    });
                    
                    voteCounts[pollId] = { total: totalVotes, options: optionVotes };
                    
                    // Find current user's response
                    const userResponse = userLatestResponses[user.id];
                    if (userResponse) {
                      const idea = ideasWithPolls.find((idea: any) => idea.poll_id === pollId);
                      if (idea) {
                        userResponses[idea.id] = userResponse.selected_option;
                      }
                    }
                  });
                  
                  console.log('📊 Vote counts calculated:', voteCounts);
                  console.log('👤 User responses from DB:', userResponses);
                  
                  setPollVoteCounts(voteCounts);
                  
                  // Only update user responses if we don't already have a current vote for that idea
                  setUserPollResponses(prev => {
                    const updated = { ...prev };
                    Object.entries(userResponses).forEach(([ideaId, vote]) => {
                      // Only set if we don't already have a current vote for this idea
                      if (updated[ideaId] === undefined) {
                        updated[ideaId] = vote;
                      }
                    });
                    console.log('👤 Final userPollResponses:', updated);
                    return updated;
                  });
                }
              } catch (error) {
                console.error('Error loading user poll responses:', error);
              }
            })();
          }
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
              likes_count: Math.max(0, idea.likes_count - 1),
              dislikes_count: idea.dislikes_count + 1,
              total_reactions: idea.total_reactions
            };
          } else if (previousReaction === false && liked) {
            // Was disliked, now liked
            return {
              ...idea,
              likes_count: idea.likes_count + 1,
              dislikes_count: Math.max(0, idea.dislikes_count - 1),
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
              likes_count: Math.max(0, idea.likes_count - (liked ? 1 : 0)),
              dislikes_count: Math.max(0, idea.dislikes_count - (liked ? 0 : 1)),
              total_reactions: Math.max(0, idea.total_reactions - (previousReaction === null ? 1 : 0))
            } : idea
          )
        );
        Alert.alert('Error', 'Failed to submit reaction. Please try again.');
        return;
      }

      // Success - no need to refresh since we already updated optimistically
      console.log('✅ Reaction submitted successfully');
      
      // Optionally refresh counts from database to ensure accuracy
      setTimeout(async () => {
        try {
          const { data: allVotes } = await supabase
            .from('idea_votes')
            .select('idea_id, vote_type')
            .eq('idea_id', ideaId);
          
          if (allVotes) {
            const likes = allVotes.filter(v => v.vote_type === 'like').length;
            const dislikes = allVotes.filter(v => v.vote_type === 'dislike').length;
            
            setIdeas(prevIdeas => 
              prevIdeas.map(idea => 
                idea.id === ideaId ? {
                  ...idea,
                  likes_count: likes,
                  dislikes_count: dislikes,
                  total_reactions: likes + dislikes
                } : idea
              )
            );
            
            console.log(`🔄 Refreshed counts for idea ${ideaId}: ${likes} likes, ${dislikes} dislikes`);
          }
        } catch (error) {
          console.error('Error refreshing vote counts:', error);
        }
      }, 1000); // Refresh after 1 second
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
            likes_count: Math.max(0, idea.likes_count - (liked ? 1 : 0)),
            dislikes_count: Math.max(0, idea.dislikes_count - (liked ? 0 : 1)),
            total_reactions: Math.max(0, idea.total_reactions - (previousReaction === null ? 1 : 0))
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

  const handlePollVoteFromCard = async (ideaId: string, optionIndex: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to vote.');
      return;
    }

    try {
      setPollVotingLoading(prev => ({ ...prev, [`${ideaId}-${optionIndex}`]: true }));

      const idea = ideas.find(idea => idea.id === ideaId);
      if (!idea || !idea.poll?.id) {
        Alert.alert('Error', 'Poll not found. Please try again.');
        return;
      }

      const pollId = idea.poll.id;
      const previousVote = userPollResponses[ideaId];

      // Submit vote directly to database
      let retryCount = 0;
      const maxRetries = 3;
      let data: any = null;
      let error: any = null;
      
      while (retryCount < maxRetries) {
        try {
          const result = await supabase
            .from('poll_responses')
            .insert({
              poll_id: pollId,
              user_id: user.id,
              user_name: userProfile?.name || user.email || 'Anonymous User',
              user_role: userRole || 'trainee',
              selected_option: optionIndex,
              created_at: new Date().toISOString()
            })
            .select()
            .single();
          
          data = result.data;
          error = result.error;
          break;
        } catch (networkError) {
          retryCount++;
          console.error(`Network error during vote submission (attempt ${retryCount}/${maxRetries}):`, networkError);
          
          if (retryCount < maxRetries) {
            console.log(`🔄 Retrying vote submission in ${retryCount * 1} seconds...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          } else {
            console.error('❌ Max retries reached for vote submission');
            Alert.alert('Connection Error', 'Unable to submit vote. Please check your internet connection and try again.');
            return;
          }
        }
      }

      if (error) {
        console.error('Vote submission error:', error);
        Alert.alert('Error', 'Failed to submit vote. Please try again.');
        return;
      }

      // Update local state
      setUserPollResponses(prev => ({ ...prev, [ideaId]: optionIndex }));

      // Update vote counts
      setPollVoteCounts(prev => {
        const currentCounts = prev[pollId] || { total: 0, options: {} };
        const newCounts = { ...currentCounts };
        
        if (previousVote !== undefined && previousVote !== null) {
          newCounts.options[previousVote] = Math.max(0, (newCounts.options[previousVote] || 0) - 1);
          newCounts.total = Math.max(0, newCounts.total - 1);
        }
        
        newCounts.options[optionIndex] = (newCounts.options[optionIndex] || 0) + 1;
        newCounts.total = newCounts.total + 1;
        
        return { ...prev, [pollId]: newCounts };
      });

      Alert.alert('Success', 'Your vote has been saved!');
    } catch (error) {
      console.error('Vote submission error:', error);
      Alert.alert('Error', 'Failed to submit vote. Please try again.');
    } finally {
      setPollVotingLoading(prev => ({ ...prev, [`${ideaId}-${optionIndex}`]: false }));
    }
  };

  const togglePollExpansion = (ideaId: string) => {
    setExpandedPolls(prev => ({ ...prev, [ideaId]: !prev[ideaId] }));
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
        <View style={[styles.header, { 
          marginTop: Platform.OS === 'android' ? 16 : 24,
          marginBottom: Platform.OS === 'android' ? 16 : 12,
        }]}>
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
            
            {displayedIdeas.map((item) => {
              // Debug logging for each item
              console.log('🔍 Rendering item:', {
                id: item.id,
                title: item.title,
                status: item.status,
                hasPoll: item.hasPoll,
                poll: item.poll,
                userRole: userRole,
                shouldShowPoll: item.hasPoll && item.poll && userRole !== 'admin' && (item.status === 'Approved' || item.status === 'In Progress')
              });
              
              return (
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

                  {/* Poll Voting Section */}
                  {item.hasPoll && item.poll && userRole !== 'admin' && (item.status === 'Approved' || item.status === 'In Progress') && (
                    <TouchableOpacity 
                      style={[styles.pollCard, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}
                      onPress={() => togglePollExpansion(item.id)}
                      activeOpacity={0.8}
                    >
                      {/* Poll Header - Always Visible */}
                      <View style={styles.pollHeader}>
                        <View style={styles.pollIconContainer}>
                          <Text style={[styles.pollIcon, { color: isDarkMode ? '#4A90E2' : '#007AFF' }]}>📊</Text>
                        </View>
                        <View style={styles.pollTitleContainer}>
                          <Text style={[styles.pollTitle, { color: isDarkMode ? '#FFFFFF' : '#1A1A1A' }]}>
                            Poll Question
                          </Text>
                          <Text style={[styles.pollQuestion, { color: isDarkMode ? '#E0E0E0' : '#333333' }]}>
                            {item.poll.question}
                          </Text>
                        </View>
                        <View style={styles.pollExpandIcon}>
                          <Text style={[styles.pollExpandIconText, { color: isDarkMode ? '#999999' : '#666666' }]}>
                            {expandedPolls[item.id] ? '▼' : '▶'}
                          </Text>
                        </View>
                      </View>

                      {/* Poll Options - Only Visible When Expanded */}
                      {expandedPolls[item.id] && (
                        <>
                          <View style={styles.pollOptionsContainer}>
                            {item.poll?.options.map((option: string, optionIndex: number) => {
                              const isSelected = userPollResponses[item.id] === optionIndex;
                              const isLoading = pollVotingLoading[`${item.id}-${optionIndex}`];
                              
                              console.log(`🔍 Poll option ${optionIndex} for idea ${item.id}:`, {
                                option,
                                isSelected,
                                userVote: userPollResponses[item.id],
                                isLoading
                              });
                              
                              return (
                                <TouchableOpacity
                                  key={optionIndex}
                                  style={[
                                    styles.pollOptionButton,
                                    isSelected && { 
                                      backgroundColor: isDarkMode ? '#4A90E2' : '#007AFF',
                                      borderColor: isDarkMode ? '#4A90E2' : '#007AFF'
                                    },
                                    isLoading && styles.pollOptionButtonDisabled
                                  ]}
                                  onPress={() => handlePollVoteFromCard(item.id, optionIndex)}
                                  disabled={isLoading}
                                >
                                  <View style={styles.pollOptionContent}>
                                    <View style={styles.pollOptionTextContainer}>
                                      <Text style={[
                                        styles.pollOptionText,
                                        { color: isSelected ? '#FFFFFF' : (isDarkMode ? '#E0E0E0' : '#333333') }
                                      ]}>
                                        {option}
                                      </Text>
                                    </View>
                                    
                                    {/* Selection Indicator */}
                                    <View style={styles.pollOptionIndicator}>
                                      {isSelected ? (
                                        <View style={[styles.pollOptionCheck, { backgroundColor: '#FFFFFF' }]}>
                                          <Text style={[styles.pollOptionCheckText, { color: isDarkMode ? '#4A90E2' : '#007AFF' }]}>✓</Text>
                                        </View>
                                      ) : (
                                        <View style={[styles.pollOptionCircle, { borderColor: isDarkMode ? '#666666' : '#CCCCCC' }]} />
                                      )}
                                    </View>
                                  </View>
                                  
                                  {/* Loading State */}
                                  {isLoading && (
                                    <View style={styles.pollOptionLoading}>
                                      <Text style={[styles.pollOptionLoadingText, { color: isDarkMode ? '#999999' : '#666666' }]}>
                                        Voting...
                                      </Text>
                                    </View>
                                  )}
                                </TouchableOpacity>
                              );
                            })}
                          </View>

                          {/* User's Current Vote Display */}
                          {userPollResponses[item.id] !== null && userPollResponses[item.id] !== undefined && (
                            <View style={[styles.userVoteContainer, { backgroundColor: isDarkMode ? '#1A1A1A' : '#F8F9FA' }]}>
                              <Text style={[styles.userVoteLabel, { color: isDarkMode ? '#999999' : '#666666' }]}>
                                Your vote:
                              </Text>
                              <Text style={[styles.userVoteText, { color: isDarkMode ? '#4A90E2' : '#007AFF' }]}>
                                {item.poll.options[userPollResponses[item.id]!]}
                              </Text>
                            </View>
                          )}

                          {/* Poll Stats */}
                          <View style={[styles.pollStatsContainer, { borderTopColor: isDarkMode ? '#444444' : '#E0E0E0' }]}>
                            <Text style={[styles.pollStatsText, { color: isDarkMode ? '#999999' : '#666666' }]}>
                              {pollVoteCounts[item.poll?.id || '']?.total || 0} total votes
                            </Text>
                            {/* Show vote counts for each option */}
                            <View style={styles.pollOptionCounts}>
                              {item.poll?.options.map((option: string, optionIndex: number) => {
                                const voteCount = pollVoteCounts[item.poll?.id || '']?.options[optionIndex] || 0;
                                console.log(`📊 Displaying vote count for ${item.poll?.id} option ${optionIndex}:`, {
                                  option,
                                  voteCount,
                                  totalVotes: pollVoteCounts[item.poll?.id || '']?.total || 0
                                });
                                return (
                                  <Text key={optionIndex} style={[styles.pollOptionCount, { color: isDarkMode ? '#999999' : '#666666' }]}>
                                    {option}: {voteCount} votes
                                  </Text>
                                );
                              })}
                            </View>
                          </View>
                        </>
                      )}
                    </TouchableOpacity>
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
            );
            })}

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
  pollCard: {
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  pollHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pollIconContainer: {
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    padding: 8,
    marginRight: 12,
  },
  pollIcon: {
    fontSize: 24,
  },
  pollTitleContainer: {
    flex: 1,
  },
  pollTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pollOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  pollOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginVertical: 4,
    width: '48%', // Two options per row
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pollOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pollOptionTextContainer: {
    flex: 1,
  },
  pollOptionText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  pollOptionIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pollOptionCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pollOptionCheck: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pollOptionCheckText: {
    fontSize: 12,
  },
  userVoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userVoteLabel: {
    fontSize: 12,
    marginRight: 8,
  },
  pollStatsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  pollStatsText: {
    fontSize: 12,
    textAlign: 'center',
  },
  pollOptionCounts: {
    marginTop: 8,
    paddingHorizontal: 10,
  },
  pollOptionCount: {
    fontSize: 12,
    marginBottom: 4,
  },
  pollQuestion: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  pollOptionButtonDisabled: {
    opacity: 0.6,
  },
  pollOptionLoading: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -8 }],
  },
  pollOptionLoadingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  userVoteText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
  },
  pollExpandIcon: {
    marginLeft: 10,
  },
  pollExpandIconText: {
    fontSize: 18,
  },
}); 