import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, TextInput, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import EventsTabBar from '../components/EventsTabBar';
import { useEventContext } from '../components/EventContext';
import { Event, EventStats } from '../types/events';

export default function EventFeedbackScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { events, submitFeedback, getEventStats, getUserEventStatus, markUserAsAttended } = useEventContext();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [eventStats, setEventStats] = useState<EventStats | null>(null);
  const [userEventStatus, setUserEventStatus] = useState<any>(null);
  const [feedback, setFeedback] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [loading, setLoading] = useState(false);

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
      Alert.alert('Error', 'You can only submit feedback for events you have attended.');
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
        Alert.alert('Error', 'Failed to submit feedback. Please try again.');
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
      <Text style={styles.ratingLabel}>{rating}</Text>
      <View style={styles.ratingBarContainer}>
        <View style={[styles.ratingBar, { width: `${percentage}%` }]} />
      </View>
      <Text style={styles.ratingPercentage}>{percentage}%</Text>
    </View>
  );

  // Show loading state while fetching data
  if (!event) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f6f7f9', justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading event data...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f6f7f9' }}>
      {/* App Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image source={require('../assets/images/icon.png')} style={{ width: 32, height: 32, marginRight: 8 }} />
          <Text style={styles.headerTitle}>MIT<Text style={{ color: '#43C6AC' }}>Connect</Text></Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Feather name="globe" size={20} color="#222" style={styles.headerIcon} />
          <Feather name="bell" size={20} color="#222" style={styles.headerIcon} />
          <Feather name="user" size={20} color="#222" style={styles.headerIcon} />
        </View>
      </View>

      {/* Screen Title with Close Button */}
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Event Feedback</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {/* Event Summary */}
        <View style={styles.eventSummary}>
          <Image source={event.image} style={styles.eventLogo} />
          <View style={styles.eventDetails}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <Text style={styles.eventDateTime}>{event.date} · {event.time}</Text>
          </View>
        </View>

        {/* Rating Overview */}
        {eventStats && eventStats.totalReviews > 0 && (
          <View style={styles.ratingOverview}>
            <View style={styles.ratingLeft}>
              <Text style={styles.averageRating}>{eventStats.averageRating}</Text>
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
              <Text style={styles.totalReviews}>{eventStats.totalReviews} reviews</Text>
            </View>
            <View style={styles.ratingRight}>
              {[5, 4, 3, 2, 1].map(rating => 
                renderRatingBar(rating, eventStats.ratingDistribution[rating as keyof typeof eventStats.ratingDistribution])
              )}
            </View>
          </View>
        )}

        {/* Show message if no reviews yet */}
        {(!eventStats || eventStats.totalReviews === 0) && (
          <View style={styles.noReviewsMessage}>
            <Text style={styles.noReviewsText}>Be the first to review this event!</Text>
          </View>
        )}

        {/* User Rating */}
        <View style={styles.userRatingSection}>
          <Text style={styles.userRatingTitle}>Rate this event</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map(star => renderStar(star))}
          </View>
        </View>

        {/* Text Box */}
        <View style={styles.feedbackSection}>
          <Text style={styles.feedbackTitle}>Share your experience</Text>
          <TextInput
            style={styles.feedbackInput}
            placeholder="Tell us about your experience at this event..."
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
            <Text style={styles.submitButtonText}>
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <EventsTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  headerIcon: {
    marginLeft: 16,
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  eventSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  eventLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eventDateTime: {
    fontSize: 14,
    color: '#888',
  },
  ratingOverview: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  ratingLeft: {
    alignItems: 'center',
    marginBottom: 16,
  },
  averageRating: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  totalReviews: {
    fontSize: 14,
    color: '#888',
  },
  ratingRight: {
    marginTop: 8,
  },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingLabel: {
    width: 20,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  ratingBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  ratingBar: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  ratingPercentage: {
    width: 30,
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
  },
  noReviewsMessage: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  noReviewsText: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
  },
  userRatingSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  userRatingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  starContainer: {
    marginHorizontal: 4,
  },
  feedbackSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
  },
  actionButtons: {
    gap: 12,
  },
  submitButton: {
    backgroundColor: '#43C6AC',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  skipButtonText: {
    color: '#888',
    fontSize: 16,
  },
}); 