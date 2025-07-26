import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, TextInput, Alert, StatusBar } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import EventsTabBar from '../components/EventsTabBar';
import { useEventContext } from '../components/EventContext';
import { useTheme } from '../components/ThemeContext';
import { Colors } from '../constants/Colors';
import { Event, EventStats } from '../types/events';

export default function EventFeedbackScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { events, submitFeedback, getEventStats, getUserEventStatus, markUserAsAttended } = useEventContext();
  const { isDarkMode } = useTheme();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [eventStats, setEventStats] = useState<EventStats | null>(null);
  const [userEventStatus, setUserEventStatus] = useState<any>(null);
  const [feedback, setFeedback] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [loading, setLoading] = useState(false);

  // Theme-aware colors
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const textColor = colors.text;
  const secondaryTextColor = isDarkMode ? '#B0B0B0' : '#666666';
  const borderColor = isDarkMode ? '#333333' : '#E5E5E5';

  // Load event data and stats
  useEffect(() => {
    const loadEventData = async () => {
      if (!id) return;
      
      // Find the event from context
      const foundEvent = events.find(e => e.id === id);
      if (foundEvent) {
        setEvent(foundEvent);
        
        // Load event statistics
        const stats = await getEventStats(id as string);
        setEventStats(stats);
        
        // Load user event status
        const userStatus = await getUserEventStatus(id as string);
        setUserEventStatus(userStatus);
        
        // If user hasn't attended yet, mark them as attended (simulate attendance)
        if (userStatus && userStatus.status === 'registered') {
          const eventDate = new Date(foundEvent.date);
          const today = new Date();
          if (eventDate < today) {
            await markUserAsAttended(id as string);
            setUserEventStatus({ ...userStatus, status: 'attended' });
          }
        }
      }
    };

    loadEventData();
  }, [id, events, getEventStats, getUserEventStatus, markUserAsAttended]);

  const handleSubmitFeedback = async () => {
    if (!event || !id || userRating === 0) {
      Alert.alert('Error', 'Please select a rating before submitting feedback.');
      return;
    }

    // Check if user has attended the event
    if (!userEventStatus || userEventStatus.status !== 'attended') {
      Alert.alert(
        'Cannot Submit Feedback', 
        'You can only submit feedback for events you have attended and that have already passed.',
        [
          { text: 'OK', onPress: () => {} }
        ]
      );
      return;
    }

    setLoading(true);
    try {
      const success = await submitFeedback({
        eventId: id as string,
        rating: userRating,
        comment: feedback,
      });

      if (success) {
        Alert.alert('Success', 'Thank you for your feedback!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert(
          'Submission Failed', 
          'Unable to submit feedback. Please make sure you are registered for this event and it has already passed.',
          [
            { text: 'OK', onPress: () => {} }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.back();
  };

  const renderStar = (starNumber: number) => {
    const isFilled = starNumber <= userRating;
    return (
      <TouchableOpacity
        key={starNumber}
        onPress={() => setUserRating(starNumber)}
        style={styles.starContainer}
      >
        <Ionicons
          name={isFilled ? 'star' : 'star-outline'}
          size={24}
          color={isFilled ? '#FFD700' : '#ddd'}
        />
      </TouchableOpacity>
    );
  };

  const renderRatingBar = (rating: number, percentage: number) => (
    <View key={rating} style={styles.ratingBarRow}>
      <Text style={[styles.ratingLabel, { color: textColor }]}>{rating}</Text>
      <View style={[styles.ratingBarContainer, { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' }]}>
        <View style={[styles.ratingBar, { width: `${percentage}%` }]} />
      </View>
      <Text style={[styles.ratingPercentage, { color: secondaryTextColor }]}>{percentage}%</Text>
    </View>
  );

  // Show loading state while fetching data
  if (!event) {
    return (
      <View style={[styles.center, { backgroundColor: cardBackground }]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <Text style={[styles.loadingText, { color: secondaryTextColor }]}>Loading event data...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: cardBackground }}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={[styles.headerRow, { borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Event Feedback</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={handleSkip}>
          <Ionicons name="close" size={24} color={textColor} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Event Summary */}
        <View style={styles.eventSummary}>
          <Image source={event.image} style={styles.eventLogo} />
          <View style={styles.eventDetails}>
            <Text style={[styles.eventTitle, { color: textColor }]}>{event.title}</Text>
            <Text style={[styles.eventDateTime, { color: secondaryTextColor }]}>{event.date} · {event.time}</Text>
          </View>
        </View>

        {/* Rating Statistics */}
        {eventStats && eventStats.totalReviews > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Event Rating</Text>
            <View style={styles.ratingOverview}>
              <View style={styles.ratingLeft}>
                <Text style={[styles.averageRating, { color: textColor }]}>{eventStats.averageRating}</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Ionicons
                      key={star}
                      name={star <= Math.floor(eventStats.averageRating) ? 'star' : 'star-outline'}
                      size={20}
                      color={star <= Math.floor(eventStats.averageRating) ? '#FFD700' : '#ddd'}
                    />
                  ))}
                </View>
                <Text style={[styles.totalReviews, { color: secondaryTextColor }]}>{eventStats.totalReviews} reviews</Text>
              </View>
              <View style={styles.ratingRight}>
                {[5, 4, 3, 2, 1].map(rating => 
                  renderRatingBar(rating, eventStats.ratingDistribution[rating as keyof typeof eventStats.ratingDistribution])
                )}
              </View>
            </View>
          </View>
        )}

        {/* No Reviews Message */}
        {(!eventStats || eventStats.totalReviews === 0) && (
          <View style={styles.section}>
            <View style={styles.noReviewsMessage}>
              <Ionicons name="star-outline" size={32} color={secondaryTextColor} />
              <Text style={[styles.noReviewsText, { color: secondaryTextColor }]}>Be the first to review this event!</Text>
            </View>
          </View>
        )}

        {/* User Rating */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Your Rating</Text>
          <Text style={[styles.sectionSubtitle, { color: secondaryTextColor }]}>Tap to rate this event</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map(star => renderStar(star))}
          </View>
          {userRating > 0 && (
            <Text style={[styles.ratingText, { color: textColor }]}>
              You rated this event {userRating} star{userRating > 1 ? 's' : ''}
            </Text>
          )}
        </View>

        {/* Feedback Comment */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Share Your Experience</Text>
          <Text style={[styles.sectionSubtitle, { color: secondaryTextColor }]}>
            Tell us about your experience at this event
          </Text>
          <TextInput
            style={[styles.feedbackInput, { 
              borderColor: borderColor, 
              backgroundColor: isDarkMode ? '#1E1E1E' : '#fff',
              color: textColor 
            }]}
            placeholder="Share your thoughts, suggestions, or memorable moments..."
            placeholderTextColor={secondaryTextColor}
            value={feedback}
            onChangeText={setFeedback}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
            onPress={handleSubmitFeedback}
            disabled={loading}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.submitButtonText}>
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.skipButton, { borderColor: borderColor }]} 
            onPress={handleSkip}
          >
            <Text style={[styles.skipButtonText, { color: secondaryTextColor }]}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <EventsTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontStyle: 'italic',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 80,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  iconBtn: {
    padding: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 10,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  eventSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
  },
  eventLogo: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 16,
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  eventDateTime: {
    fontSize: 14,
  },
  ratingOverview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  ratingLeft: {
    alignItems: 'center',
    marginRight: 24,
  },
  averageRating: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  totalReviews: {
    fontSize: 14,
  },
  ratingRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingLabel: {
    width: 20,
    fontSize: 14,
    textAlign: 'center',
  },
  ratingBarContainer: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  ratingBar: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 3,
  },
  ratingPercentage: {
    width: 30,
    fontSize: 12,
    textAlign: 'right',
  },
  noReviewsMessage: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noReviewsText: {
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  starContainer: {
    marginHorizontal: 6,
  },
  ratingText: {
    fontSize: 14,
    textAlign: 'center',
  },
  feedbackInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    lineHeight: 24,
  },
  actionButtons: {
    gap: 16,
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: '#43C6AC',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#43C6AC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0.1,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  skipButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  skipButtonText: {
    fontSize: 16,
  },
}); 