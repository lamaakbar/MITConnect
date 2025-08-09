import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeContext';
import { useUserContext } from './UserContext';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    category: string;
    location: string;
    date: string;
    time: string;
    coverImage?: string;
    image: any;
    status?: string;
  };
  isBookmarked: boolean;
  onBookmark: () => void;
  onRegister: () => void;
  onPress: () => void;
  buttonText: string;
  buttonDisabled: boolean;
  registrationCount: number;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  isBookmarked,
  onBookmark,
  onRegister,
  onPress,
  buttonText,
  buttonDisabled,
  registrationCount
}) => {
  const { isDarkMode } = useTheme();
  const { viewAs } = useUserContext();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Debug event data
  console.log('EventCard render for:', event.title);
  console.log('Event coverImage:', event.coverImage);
  console.log('Event image:', event.image);

  // Debug viewAs state
  console.log('EventCard: viewAs state:', viewAs);

  // Helper function to format date and time
  const formatDateAndTime = (dateStr: string, timeStr: string) => {
    const date = new Date(dateStr);
    const formattedDate = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
    
    const time = timeStr || 'TBD';
    return `${formattedDate} · ${time}`;
  };

  // Enhanced theme-aware colors with better contrast
  const cardBackground = isDarkMode ? '#1E1E1E' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#1A1A1A';
  const secondaryTextColor = isDarkMode ? '#B0B0B0' : '#666666';
  const borderColor = isDarkMode ? '#333333' : '#E5E5E5';
  const shadowColor = isDarkMode ? '#000000' : '#000000';
  const accentColor = '#43C6AC';
  const categoryBadgeBg = isDarkMode ? '#2A3A2A' : '#E8F5E8';
  const categoryTextColor = isDarkMode ? '#4CAF50' : '#2E7D32';
  const iconColor = isDarkMode ? '#4CAF50' : '#43C6AC';
  const disabledButtonBg = isDarkMode ? '#404040' : '#E0E0E0';
  const disabledButtonText = isDarkMode ? '#888888' : '#999999';

  // Handle image loading
  const handleImageLoad = () => {
    console.log('Image loaded successfully for event:', event.title);
    console.log('Image source:', event.coverImage ? { uri: event.coverImage } : event.image);
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = (error: any) => {
    console.log('Image loading error for event:', event.title, 'Error:', error.nativeEvent.error);
    console.log('Event coverImage:', event.coverImage);
    console.log('Event image:', event.image);
    setImageLoading(false);
    setImageError(true);
  };

  return (
    <TouchableOpacity 
      style={[
        styles.eventCard,
        {
          backgroundColor: cardBackground,
          borderColor: borderColor,
          shadowColor: shadowColor,
        }
      ]} 
      onPress={onPress} 
      activeOpacity={0.9}
    >
      {/* Cover Image */}
      <View style={styles.imageContainer}>
        {imageLoading && (
          <View style={[styles.imageLoadingContainer, { backgroundColor: isDarkMode ? '#2A2A2A' : '#F5F5F5' }]}>
            <ActivityIndicator size="large" color={accentColor} />
          </View>
        )}
        
        <Image 
          source={event.coverImage ? { uri: event.coverImage } : (event.image || require('../assets/images/splash-icon.png'))} 
          style={[
            styles.eventCoverImage,
            imageError && styles.imageError
          ]}
          onLoad={handleImageLoad}
          onError={handleImageError}
          defaultSource={require('../assets/images/splash-icon.png')}
        />
        
        {/* Bookmark Icon at top-right */}
        <TouchableOpacity
          style={styles.bookmarkIcon}
          onPress={onBookmark}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={isBookmarked ? "bookmark" : "bookmark-outline"} 
            size={18} 
            color={isBookmarked ? accentColor : "#FFFFFF"} 
          />
        </TouchableOpacity>
      </View>
      
      {/* Event Content */}
      <View style={styles.eventContent}>
        {/* Category Badge and Status */}
        <View style={styles.badgeContainer}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryBadgeBg }]}>
            <Text style={[styles.categoryText, { color: categoryTextColor }]}>{event.category}</Text>
          </View>
          
          {/* Event Status Badge */}
          {event.status && (
            <View style={[
              styles.statusBadge, 
              { 
                backgroundColor: event.status === 'upcoming' 
                  ? (isDarkMode ? '#2A3A2A' : '#E8F5E8') 
                  : (isDarkMode ? '#3A2A2A' : '#F5E8E8')
              }
            ]}>
              <Text style={[
                styles.statusText, 
                { 
                  color: event.status === 'upcoming' 
                    ? (isDarkMode ? '#4CAF50' : '#2E7D32') 
                    : (isDarkMode ? '#F44336' : '#D32F2F')
                }
              ]}>
                {event.status === 'upcoming' ? 'Upcoming' : 'Completed'}
              </Text>
            </View>
          )}
        </View>
        
        {/* Title - Max 2 lines */}
        <Text 
          style={[styles.eventTitle, { color: textColor }]} 
          numberOfLines={2}
        >
          {event.title}
        </Text>
        
        {/* Date & Time with icon */}
        <View style={styles.infoRow}>
          <View style={styles.iconContainer}>
            <Ionicons name="calendar-outline" size={14} color={iconColor} />
          </View>
          <Text style={[styles.infoText, { color: secondaryTextColor }]}>
            {formatDateAndTime(event.date, event.time)}
          </Text>
        </View>
        
        {/* Location with icon */}
        <View style={styles.infoRow}>
          <View style={styles.iconContainer}>
            <Ionicons name="location-outline" size={14} color={iconColor} />
          </View>
          <Text style={[styles.infoText, { color: secondaryTextColor }]} numberOfLines={1}>
            {event.location}
          </Text>
        </View>
        
        {/* Registration Count */}
        <View style={styles.registrationCount}>
          <View style={styles.iconContainer}>
            <Ionicons name="people-outline" size={14} color={iconColor} />
          </View>
          <Text style={[styles.registrationText, { color: secondaryTextColor }]}>
            {registrationCount} registered
          </Text>
        </View>
        
        {/* Register Button */}
        <TouchableOpacity
          style={[
            styles.registerBtn,
            buttonDisabled && [styles.registerBtnDisabled, { backgroundColor: disabledButtonBg }]
          ]}
          onPress={() => {
            // Allow registration even in "View As" mode, but show a different message
            if (viewAs) {
              Alert.alert(
                'Preview Mode', 
                'You are in preview mode. This registration will be processed as an admin action.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Register', onPress: () => onRegister() }
                ]
              );
              return;
            }
            onRegister();
          }}
          disabled={buttonDisabled}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.registerBtnText,
            buttonDisabled && [styles.registerBtnTextDisabled, { color: disabledButtonText }]
          ]}>
            {buttonText}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  eventCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    overflow: 'hidden',
    borderWidth: 1,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  imageLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  eventCoverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageError: {
    opacity: 0.5,
  },
  bookmarkIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
    zIndex: 2,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  eventContent: {
    padding: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    shadowColor: '#43C6AC',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconContainer: {
    width: 18,
    alignItems: 'center',
    marginRight: 6,
  },
  infoText: {
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },
  registrationCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  registrationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  registerBtn: {
    backgroundColor: '#43C6AC',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#43C6AC',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  registerBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  registerBtnDisabled: {
    opacity: 0.7,
    shadowOpacity: 0,
    elevation: 0,
  },
  registerBtnTextDisabled: {
    color: '#888',
  },
});

export default EventCard; 