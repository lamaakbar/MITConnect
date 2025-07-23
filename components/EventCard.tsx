import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  };
  isBookmarked: boolean;
  onBookmark: () => void;
  onRegister: () => void;
  onPress: () => void; // Add navigation handler
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
  // Helper function to format date and time
  const formatDateAndTime = (dateStr: string, timeStr: string) => {
    const date = new Date(dateStr);
    const formattedDate = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    const time = timeStr || 'TBD';
    return `${formattedDate} · ${time}`;
  };

  return (
    <TouchableOpacity style={styles.eventCard} onPress={onPress} activeOpacity={0.7}>
      {/* Cover Image */}
      <View style={styles.imageContainer}>
        <Image 
          source={event.coverImage ? { uri: event.coverImage } : event.image} 
          style={styles.eventCoverImage} 
        />
        
        {/* Bookmark Icon at top-right */}
        <TouchableOpacity
          style={styles.bookmarkIcon}
          onPress={onBookmark}
        >
          <Ionicons 
            name={isBookmarked ? "bookmark" : "bookmark-outline"} 
            size={20} 
            color={isBookmarked ? "#43C6AC" : "#fff"} 
          />
        </TouchableOpacity>
      </View>
      
      {/* Event Content */}
      <View style={styles.eventContent}>
        {/* Category Badge */}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{event.category}</Text>
        </View>
        
        {/* Title */}
        <Text style={styles.eventTitle}>{event.title}</Text>
        
        {/* Location */}
        <Text style={styles.eventLocation}>{event.location}</Text>
        
        {/* Date & Time */}
        <Text style={styles.eventDateTime}>{formatDateAndTime(event.date, event.time)}</Text>
        
        {/* Registration Count */}
        <View style={styles.registrationCount}>
          <Ionicons name="people-outline" size={16} color="#888" />
          <Text style={styles.registrationText}>+{registrationCount} registered</Text>
        </View>
        
        {/* Register Button */}
        <TouchableOpacity
          style={[
            styles.registerBtn,
            buttonDisabled && styles.registerBtnDisabled
          ]}
          onPress={onRegister}
          disabled={buttonDisabled}
        >
          <Text style={[
            styles.registerBtnText,
            buttonDisabled && styles.registerBtnTextDisabled
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
    width: 320,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 160,
  },
  eventCoverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bookmarkIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    padding: 8,
    zIndex: 2,
  },
  eventContent: {
    padding: 16,
  },
  categoryBadge: {
    backgroundColor: '#e0f7f4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryText: {
    color: '#43C6AC',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#222',
    lineHeight: 24,
  },
  eventLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  eventDateTime: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  registrationCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  registrationText: {
    fontSize: 14,
    color: '#888',
    marginLeft: 6,
  },
  registerBtn: {
    backgroundColor: '#43C6AC',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  registerBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  registerBtnDisabled: {
    backgroundColor: '#e0e0e0',
    opacity: 0.7,
  },
  registerBtnTextDisabled: {
    color: '#888',
  },
});

export default EventCard; 