import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, TextInput } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../components/ThemeContext';
import { useThemeColor } from '../../hooks/useThemeColor';
import { FeedbackService, TraineeFeedback } from '../../services/FeedbackService';

export default function TraineeFeedbackManagement() {
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState<TraineeFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [stats, setStats] = useState<{
    totalFeedbacks: number;
    averageRating: number;
    ratingDistribution: { [key: number]: number };
  }>({
    totalFeedbacks: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });

  const { isDarkMode } = useTheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const borderColor = isDarkMode ? '#2A2A2A' : '#E5E7E9';
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#6B7280';

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    try {
      const { data: feedbackData, error: feedbackError } = await FeedbackService.getAllFeedback();
      const { data: statsData, error: statsError } = await FeedbackService.getFeedbackStats();
      
      if (feedbackError) {
        Alert.alert('Error', feedbackError);
        return;
      }

      if (feedbackData) {
        setFeedbacks(feedbackData);
      }

      if (statsData) {
        setStats({
          totalFeedbacks: statsData.totalFeedbacks,
          averageRating: statsData.averageRating,
          ratingDistribution: statsData.ratingDistribution
        });
      }
    } catch (error) {
      console.error('Error loading feedback:', error);
      Alert.alert('Error', 'Failed to load feedback data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFeedbacks();
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
              
              // Remove feedback from local state
              setFeedbacks(prev => prev.filter(f => f.id !== feedbackId));
              Alert.alert('Success', 'Feedback deleted successfully');
              
              // Reload to update stats
              loadFeedbacks();
            } catch (error) {
              console.error('Error deleting feedback:', error);
              Alert.alert('Error', 'Failed to delete feedback');
            }
          }
        }
      ]
    );
  };

  const openFile = (feedback: TraineeFeedback) => {
    if (feedback.file_path) {
      // In a real app, you'd open the file with a proper file viewer
      Alert.alert(
        'File Download',
        `File: ${feedback.file_name}\nSize: ${(feedback.file_size || 0) / 1024 / 1024}MB\n\nThis would download/open the file in a real implementation.`,
        [{ text: 'OK' }]
      );
    }
  };

  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesSearch = searchText === '' || 
      feedback.trainee_name.toLowerCase().includes(searchText.toLowerCase()) ||
      feedback.feedback_text.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesRating = selectedRating === null || feedback.rating === selectedRating;
    
    return matchesSearch && matchesRating;
  });

  const renderStatsCard = () => (
    <View style={[styles.statsCard, { backgroundColor: cardBackground, borderColor }]}>
      <Text style={[styles.statsTitle, { color: textColor }]}>Feedback Overview</Text>
      
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#3CB371' }]}>{stats.totalFeedbacks}</Text>
          <Text style={[styles.statLabel, { color: secondaryTextColor }]}>Total Feedbacks</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#F39C12' }]}>{stats.averageRating.toFixed(1)}</Text>
          <Text style={[styles.statLabel, { color: secondaryTextColor }]}>Average Rating</Text>
        </View>
      </View>

      <View style={styles.ratingDistribution}>
        <Text style={[styles.distributionTitle, { color: textColor }]}>Rating Distribution</Text>
        {[5, 4, 3, 2, 1].map(rating => (
          <View key={rating} style={styles.distributionRow}>
            <Text style={[styles.distributionRating, { color: textColor }]}>{rating}★</Text>
            <View style={[styles.distributionBar, { backgroundColor: isDarkMode ? '#2A2A2A' : '#F3F4F6' }]}>
              <View 
                style={[
                  styles.distributionFill, 
                  { 
                    width: `${stats.totalFeedbacks > 0 ? (stats.ratingDistribution[rating] / stats.totalFeedbacks) * 100 : 0}%`,
                    backgroundColor: '#3CB371'
                  }
                ]} 
              />
            </View>
            <Text style={[styles.distributionCount, { color: secondaryTextColor }]}>
              {stats.ratingDistribution[rating]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderFilters = () => (
    <View style={[styles.filtersCard, { backgroundColor: cardBackground, borderColor }]}>
      <TextInput
        style={[styles.searchInput, { 
          backgroundColor: isDarkMode ? '#2A2A2A' : '#F9FAFB', 
          color: textColor,
          borderColor
        }]}
        placeholder="Search by trainee name or feedback..."
        placeholderTextColor={secondaryTextColor}
        value={searchText}
        onChangeText={setSearchText}
      />
      
      <View style={styles.ratingFilters}>
        <TouchableOpacity
          style={[
            styles.ratingFilter,
            { backgroundColor: selectedRating === null ? '#3CB371' : (isDarkMode ? '#2A2A2A' : '#F3F4F6') }
          ]}
          onPress={() => setSelectedRating(null)}
        >
          <Text style={[
            styles.ratingFilterText,
            { color: selectedRating === null ? '#fff' : textColor }
          ]}>All</Text>
        </TouchableOpacity>
        
        {[5, 4, 3, 2, 1].map(rating => (
          <TouchableOpacity
            key={rating}
            style={[
              styles.ratingFilter,
              { backgroundColor: selectedRating === rating ? '#3CB371' : (isDarkMode ? '#2A2A2A' : '#F3F4F6') }
            ]}
            onPress={() => setSelectedRating(rating)}
          >
            <Text style={[
              styles.ratingFilterText,
              { color: selectedRating === rating ? '#fff' : textColor }
            ]}>{rating}★</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderFeedbackItem = (feedback: TraineeFeedback, index: number) => (
    <View key={feedback.id} style={[styles.feedbackCard, { backgroundColor: cardBackground, borderColor }]}>
      <View style={styles.feedbackHeader}>
        <View>
          <TouchableOpacity
            onPress={() => router.push(`/explore-trainee-feedback?traineeId=${feedback.trainee_id}&traineeName=${encodeURIComponent(feedback.trainee_name)}`)}
            activeOpacity={0.7}
          >
            <Text style={[styles.traineeName, { color: '#3CB371', textDecorationLine: 'underline' }]}>
              {feedback.trainee_name}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.feedbackDate, { color: secondaryTextColor }]}>
            {new Date(feedback.submission_date).toLocaleDateString()}
          </Text>
        </View>
        
        <View style={styles.feedbackActions}>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= feedback.rating ? "star" : "star-outline"}
                size={16}
                color={star <= feedback.rating ? "#FFD700" : secondaryTextColor}
                style={{ marginRight: 2 }}
              />
            ))}
            <Text style={[styles.ratingText, { color: secondaryTextColor }]}>
              {feedback.rating}/5
            </Text>
          </View>
          
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: '#EF4444' }]}
            onPress={() => deleteFeedback(feedback.id)}
          >
            <MaterialIcons name="delete" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
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
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: textColor }]}>Loading feedback...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderStatsCard()}
        {renderFilters()}
        
        <View style={styles.feedbacksList}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            All Feedback ({filteredFeedbacks.length})
          </Text>
          
          {filteredFeedbacks.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: cardBackground, borderColor }]}>
              <Ionicons name="chatbubble-outline" size={48} color={secondaryTextColor} />
              <Text style={[styles.emptyStateText, { color: textColor }]}>
                {searchText || selectedRating ? 'No feedback matches your filters' : 'No feedback submitted yet'}
              </Text>
              {(searchText || selectedRating) && (
                <TouchableOpacity
                  style={[styles.clearFiltersButton, { backgroundColor: '#3CB371' }]}
                  onPress={() => {
                    setSearchText('');
                    setSelectedRating(null);
                  }}
                >
                  <Text style={styles.clearFiltersText}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredFeedbacks.map(renderFeedbackItem)
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
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
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
  filtersCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  ratingFilters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ratingFilter: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 50,
    alignItems: 'center',
  },
  ratingFilterText: {
    fontSize: 14,
    fontWeight: '500',
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
  traineeName: {
    fontSize: 16,
    fontWeight: '600',
  },
  feedbackDate: {
    fontSize: 12,
    marginTop: 2,
  },
  feedbackActions: {
    alignItems: 'flex-end',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
  },
  clearFiltersButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  clearFiltersText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
}); 