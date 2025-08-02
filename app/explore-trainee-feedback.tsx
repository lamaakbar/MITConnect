import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, Share } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../components/ThemeContext';
import { useThemeColor } from '../hooks/useThemeColor';
import { FeedbackService, TraineeFeedback } from '../services/FeedbackService';
import AdminHeader from '../components/AdminHeader';

export default function ExploreTraineeFeedback() {
  const router = useRouter();
  const { traineeId, traineeName } = useLocalSearchParams();
  const [feedbacks, setFeedbacks] = useState<TraineeFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { isDarkMode } = useTheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const borderColor = isDarkMode ? '#2A2A2A' : '#E5E7E9';
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#6B7280';

  useEffect(() => {
    loadTraineeFeedback();
  }, [traineeId]);

  const loadTraineeFeedback = async () => {
    try {
      const { data: allFeedback, error } = await FeedbackService.getAllFeedback();
      
      if (error) {
        Alert.alert('Error', error);
        return;
      }

      if (allFeedback) {
        // Filter feedback for this specific trainee
        const traineeFeedback = allFeedback.filter(feedback => 
          feedback.trainee_id === traineeId || feedback.trainee_name === traineeName
        );
        setFeedbacks(traineeFeedback);
      }
    } catch (error) {
      console.error('Error loading trainee feedback:', error);
      Alert.alert('Error', 'Failed to load trainee feedback');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTraineeFeedback();
  };

  const deleteFeedback = async (feedbackId: string) => {
    Alert.alert(
      'Delete Feedback',
      'Are you sure you want to delete this feedback? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await FeedbackService.deleteFeedback(feedbackId);
              if (error) {
                Alert.alert('Error', error);
                return;
              }
              
              setFeedbacks(prev => prev.filter(f => f.id !== feedbackId));
              Alert.alert('Success', 'Feedback deleted successfully');
            } catch (error) {
              console.error('Error deleting feedback:', error);
              Alert.alert('Error', 'Failed to delete feedback');
            }
          }
        }
      ]
    );
  };

  const shareFeedbackSummary = async () => {
    if (feedbacks.length === 0) {
      Alert.alert('No Data', 'No feedback available to share');
      return;
    }

    const averageRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;
    const summary = `${traineeName || 'Trainee'} Feedback Summary:
📊 Total Feedback: ${feedbacks.length}
⭐ Average Rating: ${averageRating.toFixed(1)}/5
📅 Latest: ${new Date(feedbacks[0]?.submission_date).toLocaleDateString()}

Generated from MITConnect Admin Dashboard`;

    try {
      await Share.share({
        message: summary,
        title: `${traineeName} Feedback Summary`
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const openFile = (feedback: TraineeFeedback) => {
    if (feedback.file_path) {
      Alert.alert(
        'File Download',
        `File: ${feedback.file_name}\nSize: ${(feedback.file_size || 0) / 1024 / 1024}MB\n\nThis would download/open the file in a real implementation.`,
        [{ text: 'OK' }]
      );
    }
  };

  // Calculate statistics
  const totalFeedbacks = feedbacks.length;
  const averageRating = totalFeedbacks > 0 ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks : 0;
  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  feedbacks.forEach(feedback => {
    ratingDistribution[feedback.rating as keyof typeof ratingDistribution]++;
  });

  const renderTraineeStats = () => (
    <View style={[styles.statsCard, { backgroundColor: cardBackground, borderColor }]}>
      <View style={styles.statsHeader}>
        <View>
          <Text style={[styles.traineeName, { color: textColor }]}>{traineeName || 'Unknown Trainee'}</Text>
          <Text style={[styles.traineeId, { color: secondaryTextColor }]}>ID: {traineeId}</Text>
        </View>
        <TouchableOpacity
          style={[styles.shareButton, { backgroundColor: '#3CB371' }]}
          onPress={shareFeedbackSummary}
        >
          <Ionicons name="share-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#3CB371' }]}>{totalFeedbacks}</Text>
          <Text style={[styles.statLabel, { color: secondaryTextColor }]}>Total Feedback</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#F39C12' }]}>{averageRating.toFixed(1)}</Text>
          <Text style={[styles.statLabel, { color: secondaryTextColor }]}>Average Rating</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#E74C3C' }]}>
            {totalFeedbacks > 0 ? new Date(feedbacks[0].submission_date).toLocaleDateString() : 'N/A'}
          </Text>
          <Text style={[styles.statLabel, { color: secondaryTextColor }]}>Latest Feedback</Text>
        </View>
      </View>

      {totalFeedbacks > 0 && (
        <View style={styles.ratingDistribution}>
          <Text style={[styles.distributionTitle, { color: textColor }]}>Rating Breakdown</Text>
          {[5, 4, 3, 2, 1].map(rating => (
            <View key={rating} style={styles.distributionRow}>
              <Text style={[styles.distributionRating, { color: textColor }]}>{rating}★</Text>
              <View style={[styles.distributionBar, { backgroundColor: isDarkMode ? '#2A2A2A' : '#F3F4F6' }]}>
                <View 
                  style={[
                    styles.distributionFill, 
                    { 
                      width: `${totalFeedbacks > 0 ? (ratingDistribution[rating as keyof typeof ratingDistribution] / totalFeedbacks) * 100 : 0}%`,
                      backgroundColor: '#3CB371'
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.distributionCount, { color: secondaryTextColor }]}>
                {ratingDistribution[rating as keyof typeof ratingDistribution]}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderFeedbackItem = (feedback: TraineeFeedback, index: number) => (
    <View key={feedback.id} style={[styles.feedbackCard, { backgroundColor: cardBackground, borderColor }]}>
      <View style={styles.feedbackHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.feedbackDate, { color: secondaryTextColor }]}>
            Submitted on {new Date(feedback.submission_date).toLocaleDateString()}
          </Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= feedback.rating ? "star" : "star-outline"}
                size={18}
                color={star <= feedback.rating ? "#FFD700" : secondaryTextColor}
                style={{ marginRight: 2 }}
              />
            ))}
            <Text style={[styles.ratingText, { color: secondaryTextColor }]}>
              {feedback.rating}/5
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: '#EF4444' }]}
          onPress={() => deleteFeedback(feedback.id)}
        >
          <MaterialIcons name="delete" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <Text style={[styles.feedbackText, { color: textColor }]}>
        {feedback.feedback_text}
      </Text>
      
      {feedback.file_name && feedback.file_path && (
        <TouchableOpacity
          style={[styles.fileContainer, { backgroundColor: isDarkMode ? '#2A2A2A' : '#F3F4F6' }]}
          onPress={() => openFile(feedback)}
        >
          <Ionicons name="document-attach" size={20} color="#3CB371" />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[styles.fileName, { color: '#3CB371' }]} numberOfLines={1}>
              {feedback.file_name}
            </Text>
            <Text style={[styles.fileSize, { color: secondaryTextColor }]}>
              {feedback.file_size ? `${(feedback.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
            </Text>
          </View>
          <Text style={[styles.downloadText, { color: secondaryTextColor }]}>
            Tap to download
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <AdminHeader
          showLogo={false} 
          title="Trainee Feedback" 
          backDestination="/trainee-management"
        />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: textColor }]}>Loading trainee feedback...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <AdminHeader 
        title="Trainee Feedback" 
        backDestination="/trainee-management"
      />
      
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderTraineeStats()}
        
        <View style={styles.feedbacksList}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Feedback History ({totalFeedbacks})
          </Text>
          
          {totalFeedbacks === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: cardBackground, borderColor }]}>
              <Ionicons name="chatbubble-outline" size={48} color={secondaryTextColor} />
              <Text style={[styles.emptyStateText, { color: textColor }]}>
                No feedback submitted by this trainee yet
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: secondaryTextColor }]}>
                Feedback will appear here once the trainee completes their training checklist
              </Text>
            </View>
          ) : (
            feedbacks.map(renderFeedbackItem)
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  statsCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  traineeName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  traineeId: {
    fontSize: 12,
    marginTop: 2,
  },
  shareButton: {
    padding: 8,
    borderRadius: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  ratingDistribution: {
    marginTop: 8,
  },
  distributionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  distributionRating: {
    width: 30,
    fontSize: 14,
    fontWeight: '500',
  },
  distributionBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 8,
  },
  distributionFill: {
    height: '100%',
    borderRadius: 4,
  },
  distributionCount: {
    width: 30,
    textAlign: 'right',
    fontSize: 14,
  },
  feedbacksList: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  feedbackCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  feedbackDate: {
    fontSize: 14,
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 4,
  },
  deleteButton: {
    padding: 6,
    borderRadius: 6,
  },
  feedbackText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 12,
    marginTop: 2,
  },
  downloadText: {
    fontSize: 12,
  },
  emptyState: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
}); 