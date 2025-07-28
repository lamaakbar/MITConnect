import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, Platform, Animated, StatusBar, BackHandler, TextInput, ScrollView, Alert, Linking, Modal, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useNavigation, useFocusEffect } from 'expo-router';
import { useTheme } from '../components/ThemeContext';
import { useThemeColor } from '../hooks/useThemeColor';
import { useUserContext } from '../components/UserContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useEffect } from 'react';
import { FeedbackService, type TraineeFeedback, type CreateFeedbackInput } from '../services/FeedbackService';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';


const CHECKLIST_ITEMS = [
  'Contract',
  'Card ID',
  'Training Start Form',
  'Training Plan',
  'Bank Training Evaluation',
  'Card Submission',
];

// Helper function to format date for display
const formatDateForDisplay = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

export default function TraineeChecklist() {
  const router = useRouter();
  const navigation = useNavigation();
  const [checked, setChecked] = useState(Array(CHECKLIST_ITEMS.length).fill(false));
  const [scaleAnimations] = useState(() => 
    CHECKLIST_ITEMS.map(() => new Animated.Value(1))
  );
  
  // Feedback state management
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [submittedFeedbacks, setSubmittedFeedbacks] = useState<TraineeFeedback[]>([]);
  const [showPreviousFeedbacks, setShowPreviousFeedbacks] = useState(false);
  const [isLoadingFeedbacks, setIsLoadingFeedbacks] = useState(true);
  const [feedbackLoadError, setFeedbackLoadError] = useState<string | null>(null);
  const [userFeedbackCount, setUserFeedbackCount] = useState(0);
  const [firstFeedbackRating, setFirstFeedbackRating] = useState(0);
  
  // File upload state (single file)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [userHasUploadedFile, setUserHasUploadedFile] = useState(false);
  
  // File viewer state  
  const [viewingFile, setViewingFile] = useState<any>(null);
  const [fileViewerVisible, setFileViewerVisible] = useState(false);
  
  const completed = checked.filter(Boolean).length;
  const progress = completed / CHECKLIST_ITEMS.length;
  const isAllCompleted = progress === 1;

  const canCheckItem = (index: number) => {
    // First item can always be checked
    if (index === 0) return true;
    // Other items can only be checked if the previous item is completed
    return checked[index - 1];
  };

  const toggleCheck = (idx: number) => {
    // Only allow checking if the item is eligible
    if (!canCheckItem(idx)) return;

    // Animate the button press
    Animated.sequence([
      Animated.timing(scaleAnimations[idx], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimations[idx], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setChecked(prev => prev.map((v, i) => (i === idx ? !v : v)));
  };

  // File picker function (single file)
  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: false, // Single file only
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'image/*'
        ]
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const file = {
          name: asset.name,
          size: asset.size || 0,
          type: asset.mimeType || 'application/octet-stream',
          uri: asset.uri
        } as any;

        setSelectedFile(file);
      }
    } catch (error) {
      console.error('File picker error:', error);
      Alert.alert('Error', 'Failed to pick file. Please try again.');
    }
  };

  // Remove selected file
  const removeFile = () => {
    setSelectedFile(null);
  };

  // Handle file opening based on type
  const openFile = async (feedback: TraineeFeedback) => {
    if (!feedback.file_path || !feedback.file_name) return;
    
    try {
      const fileType = feedback.file_type?.toLowerCase() || '';
      
      // For images, show in modal within the app
      if (fileType.startsWith('image/')) {
        setViewingFile({
          file_name: feedback.file_name,
          file_path: feedback.file_path,
          file_type: feedback.file_type,
          file_size: feedback.file_size
        });
        setFileViewerVisible(true);
        return;
      }

      // For documents (PDF, Word, etc.), download and open with system app
      const fileName = feedback.file_name;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      Alert.alert(
        'Download File',
        `Do you want to download and open "${fileName}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Download & Open',
            onPress: async () => {
              try {
                // Download the file
                const { uri } = await FileSystem.downloadAsync(feedback.file_path!, fileUri);
                
                // Check if sharing is available
                const isAvailable = await Sharing.isAvailableAsync();
                if (isAvailable) {
                  await Sharing.shareAsync(uri);
                } else {
                  Alert.alert('Success', 'File downloaded successfully!');
                }
              } catch (error) {
                console.error('Error downloading file:', error);
                Alert.alert('Error', 'Failed to download file. Please try again.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error opening file:', error);
      Alert.alert('Error', 'Failed to open file. Please try again.');
    }
  };

  // Close file viewer
  const closeFileViewer = () => {
    setViewingFile(null);
    setFileViewerVisible(false);
  };

  // Feedback submission function
  const submitFeedback = async () => {
    // Check if user has reached the limit
    if (userFeedbackCount >= 2) {
      Alert.alert('Limit Reached', 'You have already submitted the maximum number of feedbacks (2).');
      return;
    }
    
    if (!feedbackText.trim()) {
      Alert.alert('Error', 'Please enter your feedback before submitting.');
      return;
    }
    
    // For second feedback, rating is automatically set to first feedback's rating
    const finalRating = userFeedbackCount === 1 ? firstFeedbackRating : feedbackRating;
    
    if (userFeedbackCount === 0 && feedbackRating === 0) {
      Alert.alert('Error', 'Please select a rating before submitting.');
      return;
    }

    setIsSubmittingFeedback(true);
    
    try {
      // Create feedback input for the service
      const feedbackInput: CreateFeedbackInput = {
        feedback_text: feedbackText.trim(),
        rating: finalRating,
        file: (!userHasUploadedFile && selectedFile) ? selectedFile : undefined,
        // trainee_name will be automatically derived from user profile in the service
      };

      // Submit feedback to database
      const { data, error } = await FeedbackService.submitFeedback(feedbackInput);
      
      if (error) {
        Alert.alert('Error', error);
        return;
      }
      
      if (data) {
        // Add new feedback to local state
        setSubmittedFeedbacks(prev => [data, ...prev]);
        
        // Update user feedback count and set first rating if this was the first feedback
        setUserFeedbackCount(prev => prev + 1);
        if (userFeedbackCount === 0) {
          setFirstFeedbackRating(finalRating);
        }
        
        // If a file was uploaded with this feedback, mark user as having uploaded
        if (data.file_name && data.file_path) {
          setUserHasUploadedFile(true);
        }
        
        // Reset form
        setFeedbackText('');
        setSelectedFile(null);
        if (userFeedbackCount === 0) {
          setFeedbackRating(0); // Only reset rating for first feedback
        }
        
        const isSecondFeedback = userFeedbackCount === 1;
        Alert.alert(
          'Success!', 
          isSecondFeedback 
            ? 'Thank you for your additional feedback! You have now submitted both of your allowed feedbacks.'
            : 'Thank you for your feedback! You can submit one more feedback with the same rating.',
          [{ text: 'OK', style: 'default' }]
        );
      }
      
    } catch (error) {
      console.error('Unexpected error submitting feedback:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Rating component handler
  const setRating = (rating: number) => {
    setFeedbackRating(rating);
  };

  // Auto-set rating for second feedback
  useEffect(() => {
    if (userFeedbackCount === 1 && firstFeedbackRating > 0) {
      setFeedbackRating(firstFeedbackRating);
    }
  }, [userFeedbackCount, firstFeedbackRating]);





  const renderChecklistItem = ({ item, index }: { item: string; index: number }) => {
    const isCompleted = checked[index];
    const isAvailable = canCheckItem(index);
    const isLocked = !isAvailable && !isCompleted;

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnimations[index] }] }}>
        <TouchableOpacity
          style={[
            styles.checklistCard,
            isCompleted && styles.checklistCardCompleted,
            isLocked && styles.checklistCardLocked
          ]}
          onPress={() => toggleCheck(index)}
          activeOpacity={isLocked ? 1 : 0.7}
          disabled={isLocked}
        >
          <View style={styles.cardContent}>
            <View style={styles.checkboxContainer}>
              <View style={[
                styles.checkbox,
                isCompleted && styles.checkboxCompleted,
                isLocked && styles.checkboxLocked
              ]}>
                {isCompleted && (
                  <Ionicons 
                    name="checkmark-sharp" 
                    size={16} 
                    color="#fff" 
                    style={styles.checkmark}
                  />
                )}
                {isLocked && (
                  <Ionicons 
                    name="lock-closed" 
                    size={16} 
                    color="#C7C7CC" 
                  />
                )}
              </View>
            </View>
            
            <View style={styles.textContainer}>
              <Text style={[
                styles.itemTitle,
                isCompleted && styles.itemTitleCompleted,
                isLocked && styles.itemTitleLocked
              ]}>
                {item}
              </Text>
              <Text style={[
                styles.itemSubtitle,
                isLocked && styles.itemSubtitleLocked
              ]}>
                {isCompleted ? 'Completed' : isLocked ? 'Complete previous step first' : 'Pending'}
              </Text>
            </View>
            
            <View style={styles.statusIcon}>
              <Ionicons 
                name={isCompleted ? "checkmark-circle" : isLocked ? "lock-closed" : "ellipse-outline"} 
                size={24} 
                color={isCompleted ? "#34C759" : isLocked ? "#C7C7CC" : "#C7C7CC"} 
              />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const { isDarkMode, toggleTheme } = useTheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  const borderColor = isDarkMode ? '#2A2A2A' : '#F2F2F7';
  const iconColor = useThemeColor({}, 'icon');
  const { userRole } = useUserContext();
  const insets = useSafeAreaInsets();
  const darkBg = '#181C20';
  const darkCard = '#23272b';
  const darkBorder = '#2D333B';
  const darkText = '#F3F6FA';
  const darkSecondary = '#AEB6C1';
  const darkHighlight = '#43C6AC';

  // Disable swipe gestures for trainee security - only allow arrow back navigation
  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: false, // Disable swipe to go back
      swipeEnabled: false,   // Additional swipe protection  
      animationEnabled: false, // Disable screen transition animations
      headerBackVisible: true, // Keep the back arrow visible
      headerLeft: undefined, // Remove any custom header left components
      ...(Platform.OS === 'ios' && {
        gestureResponseDistance: 0, // iOS specific: disable edge swipe gesture
        gestureDirection: 'vertical', // Change gesture direction to prevent horizontal swipes
      }),
      ...(Platform.OS === 'android' && {
        gestureEnabled: false, // Android specific gesture disable
      }),
    });
  }, [navigation]);

  // Disable hardware back button for trainee security - only UI back arrow allowed
  useFocusEffect(
    useCallback(() => {
      // Prevent hardware back button on Android - trainee must use UI back arrow
      const handleBackPress = () => {
        // Block hardware back button completely for trainee security
        return true; // Returning true prevents the default back action
      };

      // Add hardware back button listener for Android
      const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

      // For web platform, prevent browser back navigation
      if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        const handlePopState = (event: Event) => {
          event.preventDefault();
          return false;
        };
        
        window.addEventListener('popstate', handlePopState);
        
        return () => {
          backHandler.remove();
          if (typeof window.removeEventListener === 'function') {
            window.removeEventListener('popstate', handlePopState);
          }
        };
      }
      
      return () => {
        backHandler.remove();
      };
    }, [])
  );

  // Load feedback data from database on component mount
  useEffect(() => {
    const loadFeedbacks = async () => {
      setIsLoadingFeedbacks(true);
      setFeedbackLoadError(null);
      
      try {
        // Get all feedbacks for display
        const { data: allData, error: allError } = await FeedbackService.getAllFeedback();
        
        if (allError) {
          console.error('Error loading all feedbacks:', allError);
          setFeedbackLoadError(allError);
          return;
        }
        
        // Get current user's feedbacks for count and rating check
        const { data: userData, error: userError } = await FeedbackService.getUserFeedback();
        
        if (userError) {
          console.error('Error loading user feedbacks:', userError);
          // Continue even if user feedback fails, just won't have limits
        }
        
        if (allData) {
          setSubmittedFeedbacks(allData);
        }
        
        if (userData) {
          setUserFeedbackCount(userData.length);
          if (userData.length > 0) {
            // Set the first feedback's rating for the second feedback form
            setFirstFeedbackRating(userData[0].rating);
            
            // Check if user has already uploaded a file in any feedback
            const hasFile = userData.some(feedback => feedback.file_name && feedback.file_path);
            setUserHasUploadedFile(hasFile);
          }
        }
      } catch (error) {
        console.error('Unexpected error loading feedbacks:', error);
        setFeedbackLoadError('Failed to load feedback data');
      } finally {
        setIsLoadingFeedbacks(false);
      }
    };

    loadFeedbacks();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: userRole === 'trainee' && isDarkMode ? darkBg : backgroundColor }}>
      {userRole === 'trainee' && (
        <>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
          <View style={{
            paddingTop: insets.top,
            backgroundColor: isDarkMode ? darkCard : cardBackground,
            borderBottomColor: isDarkMode ? darkBorder : borderColor,
            borderBottomWidth: 1,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingBottom: 12,
          }}>
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 8 }}>
              <Ionicons name="arrow-back" size={24} color={iconColor} />
            </TouchableOpacity>
            <Text style={{
              fontSize: 22,
              fontWeight: '700',
              letterSpacing: 0.5,
              flex: 1,
              textAlign: 'center',
              color: isDarkMode ? darkText : textColor
            }}>
              MIT<Text style={{ color: darkHighlight }}>Connect</Text>
            </Text>
            <View style={{ width: 32 }} />
          </View>
        </>
      )}

      {/* Progress Section */}
      <View style={{
        backgroundColor: userRole === 'trainee' && isDarkMode ? darkCard : '#fff',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
      }}>
        <View style={styles.progressHeader}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: userRole === 'trainee' && isDarkMode ? darkText : '#1C1C1E' }}>Progress</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: userRole === 'trainee' && isDarkMode ? darkHighlight : '#34C759' }}>{completed}/{CHECKLIST_ITEMS.length}</Text>
        </View>
        
        <View style={{ marginBottom: 8 }}>
          <View style={{
            height: 8,
            borderRadius: 4,
            overflow: 'hidden',
            backgroundColor: userRole === 'trainee' && isDarkMode ? darkBorder : '#F2F2F7',
          }}>
            <Animated.View
              style={{
                height: '100%',
                backgroundColor: userRole === 'trainee' && isDarkMode ? darkHighlight : '#34C759',
                borderRadius: 4,
                width: `${progress * 100}%`,
              }}
            />
          </View>
        </View>
        
        <Text style={{ fontSize: 14, color: userRole === 'trainee' && isDarkMode ? darkSecondary : '#8E8E93', textAlign: 'center', fontWeight: '500' }}>
          {Math.round(progress * 100)}% Complete
        </Text>
        

      </View>

      {/* Checklist Items and Feedback Section */}
      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Checklist Items */}
        {CHECKLIST_ITEMS.map((item, index) => {
          const isCompleted = checked[index];
          const isAvailable = canCheckItem(index);
          const isLocked = !isAvailable && !isCompleted;
          return (
            <Animated.View key={`checklist-${index}`} style={{ transform: [{ scale: scaleAnimations[index] }] }}>
              <TouchableOpacity
                style={{
                  backgroundColor: userRole === 'trainee' && isDarkMode
                    ? isCompleted
                      ? '#22332b'
                      : isLocked
                        ? '#23272b'
                        : darkCard
                    : isCompleted
                      ? '#F0FFF4'
                      : isLocked
                        ? '#F8F8F8'
                        : '#fff',
                  borderRadius: 16,
                  marginBottom: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  elevation: 3,
                  borderWidth: 1,
                  borderColor: userRole === 'trainee' && isDarkMode
                    ? isCompleted
                      ? darkHighlight
                      : isLocked
                        ? darkBorder
                        : darkBorder
                    : isCompleted
                      ? '#34C759'
                      : isLocked
                        ? '#E5E5EA'
                        : '#F2F2F7',
                  opacity: isLocked ? 0.7 : 1,
                }}
                onPress={() => toggleCheck(index)}
                activeOpacity={isLocked ? 1 : 0.7}
                disabled={isLocked}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20 }}>
                  <View style={{ marginRight: 16 }}>
                    <View style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: userRole === 'trainee' && isDarkMode
                        ? isCompleted
                          ? darkHighlight
                          : isLocked
                            ? darkBorder
                            : darkBorder
                        : isCompleted
                          ? '#34C759'
                          : isLocked
                            ? '#C7C7CC'
                            : '#C7C7CC',
                      backgroundColor: userRole === 'trainee' && isDarkMode
                        ? isCompleted
                          ? darkHighlight
                          : isLocked
                            ? darkBorder
                            : darkCard
                        : isCompleted
                          ? '#34C759'
                          : isLocked
                            ? '#E5E5EA'
                            : '#F2F2F7',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {isCompleted && (
                        <Ionicons name="checkmark-sharp" size={16} color="#fff" style={{ fontWeight: 'bold' }} />
                      )}
                      {isLocked && (
                        <Ionicons name="lock-closed" size={16} color={userRole === 'trainee' && isDarkMode ? darkSecondary : '#C7C7CC'} />
                      )}
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 18,
                      fontWeight: '600',
                      color: userRole === 'trainee' && isDarkMode
                        ? isCompleted
                          ? darkHighlight
                          : isLocked
                            ? darkSecondary
                            : darkText
                        : isCompleted
                          ? '#34C759'
                          : isLocked
                            ? '#8E8E93'
                            : '#1C1C1E',
                      marginBottom: 4,
                      textDecorationLine: isCompleted ? 'line-through' : 'none',
                    }}>{item}</Text>
                    <Text style={{
                      fontSize: 14,
                      color: userRole === 'trainee' && isDarkMode
                        ? isLocked
                          ? darkSecondary
                          : darkSecondary
                        : isLocked
                          ? '#C7C7CC'
                          : '#8E8E93',
                      fontWeight: '400',
                    }}>{isCompleted ? 'Completed' : isLocked ? 'Complete previous step first' : 'Pending'}</Text>
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Ionicons
                      name={isCompleted ? "checkmark-circle" : isLocked ? "lock-closed" : "ellipse-outline"}
                      size={24}
                      color={isCompleted
                        ? (userRole === 'trainee' && isDarkMode ? darkHighlight : '#34C759')
                        : isLocked
                          ? (userRole === 'trainee' && isDarkMode ? darkSecondary : '#C7C7CC')
                          : (userRole === 'trainee' && isDarkMode ? darkSecondary : '#C7C7CC')}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {/* Feedback Section - Only shows when all checklist items are completed */}
        {isAllCompleted && (
          <View style={{
            marginTop: 24,
            backgroundColor: userRole === 'trainee' && isDarkMode ? darkCard : '#fff',
            borderRadius: 16,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
            borderWidth: 1,
            borderColor: userRole === 'trainee' && isDarkMode ? darkHighlight : '#34C759',
          }}>
            {/* Completion Celebration */}
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <Ionicons 
                name="checkmark-circle" 
                size={48} 
                color={userRole === 'trainee' && isDarkMode ? darkHighlight : '#34C759'} 
              />
              <Text style={{
                fontSize: 22,
                fontWeight: 'bold',
                color: userRole === 'trainee' && isDarkMode ? darkHighlight : '#34C759',
                marginTop: 8,
                textAlign: 'center'
              }}>
                Congratulations!
              </Text>
              <Text style={{
                fontSize: 16,
                color: userRole === 'trainee' && isDarkMode ? darkText : '#1C1C1E',
                marginTop: 4,
                textAlign: 'center'
              }}>
                You've completed all checklist items
              </Text>
            </View>

            {/* Feedback Form - Conditional based on submission count */}
            {userFeedbackCount >= 2 ? (
              // User has reached the limit
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <Ionicons name="checkmark-circle" size={48} color="#34C759" style={{ marginBottom: 12 }} />
                <Text style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: userRole === 'trainee' && isDarkMode ? darkText : '#1C1C1E',
                  marginBottom: 8,
                  textAlign: 'center'
                }}>
                  Feedback Complete
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: userRole === 'trainee' && isDarkMode ? darkSecondary : '#8E8E93',
                  textAlign: 'center',
                  lineHeight: 20
                }}>
                  You have submitted both of your allowed feedbacks. Thank you for sharing your training experience!
                </Text>
              </View>
            ) : (
              // User can still submit feedback
              <>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: userRole === 'trainee' && isDarkMode ? darkText : '#1C1C1E',
                  marginBottom: 16
                }}>
                  {userFeedbackCount === 0 ? 'Share Your Training Experience' : 'Additional Feedback'}
                </Text>

                {userFeedbackCount === 1 && (
                  <View style={{
                    backgroundColor: userRole === 'trainee' && isDarkMode ? '#1A1A1A' : '#F0F8FF',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 16,
                    borderLeftWidth: 4,
                    borderLeftColor: '#007AFF'
                  }}>
                    <Text style={{
                      fontSize: 14,
                      color: userRole === 'trainee' && isDarkMode ? darkText : '#1C1C1E',
                      fontWeight: '500'
                    }}>
                      📝 Second Feedback: Your rating will remain the same as your first feedback. You can only update your comments.
                    </Text>
                  </View>
                )}

                {/* Rating Section */}
                <Text style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: userRole === 'trainee' && isDarkMode ? darkText : '#1C1C1E',
                  marginBottom: 8
                }}>
                  {userFeedbackCount === 1 ? 'Your rating (locked):' : 'Rate your overall experience:'}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16 }}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const currentRating = userFeedbackCount === 1 ? firstFeedbackRating : feedbackRating;
                    const isDisabled = userFeedbackCount === 1;
                    
                    return (
                      <TouchableOpacity
                        key={star}
                        onPress={() => !isDisabled && setRating(star)}
                        style={{ 
                          marginHorizontal: 4,
                          opacity: isDisabled ? 0.6 : 1
                        }}
                        disabled={isDisabled}
                      >
                        <Ionicons
                          name={star <= currentRating ? "star" : "star-outline"}
                          size={32}
                          color={star <= currentRating ? "#FFD700" : (userRole === 'trainee' && isDarkMode ? darkSecondary : "#C7C7CC")}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Feedback Text Input */}
                <Text style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: userRole === 'trainee' && isDarkMode ? darkText : '#1C1C1E',
                  marginBottom: 8
                }}>
                  {userFeedbackCount === 1 ? 'Add additional comments:' : 'Tell us about your experience:'}
                </Text>
                <TextInput
                  style={{
                    backgroundColor: userRole === 'trainee' && isDarkMode ? darkBg : '#F8F8F8',
                    borderRadius: 12,
                    padding: 16,
                    minHeight: 100,
                    fontSize: 16,
                    color: userRole === 'trainee' && isDarkMode ? darkText : '#1C1C1E',
                    textAlignVertical: 'top',
                    borderWidth: 1,
                    borderColor: userRole === 'trainee' && isDarkMode ? darkBorder : '#E5E5EA',
                    marginBottom: 16
                  }}
                  multiline
                  numberOfLines={4}
                  placeholder={
                    userFeedbackCount === 1 
                      ? "Share any additional thoughts, updates, or new observations..."
                      : "Share your thoughts about the training program, mentorship, challenges, and suggestions for improvement..."
                  }
                  placeholderTextColor={userRole === 'trainee' && isDarkMode ? darkSecondary : '#8E8E93'}
                  value={feedbackText}
                  onChangeText={setFeedbackText}
                />

                {/* File Upload Section - Only show if user hasn't uploaded a file yet */}
                {!userHasUploadedFile && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: userRole === 'trainee' && isDarkMode ? darkText : '#1C1C1E',
                      marginBottom: 8
                    }}>
                      Upload Plan File (Optional):
                    </Text>
                    
                    {!selectedFile ? (
                      /* File Upload Button */
                      <TouchableOpacity
                        style={{
                          backgroundColor: userRole === 'trainee' && isDarkMode ? darkBorder : '#F0F0F0',
                          borderRadius: 12,
                          padding: 16,
                          borderWidth: 2,
                          borderColor: userRole === 'trainee' && isDarkMode ? darkBorder : '#E5E5EA',
                          borderStyle: 'dashed',
                          alignItems: 'center',
                        }}
                        onPress={pickFile}
                      >
                        <Ionicons 
                          name="cloud-upload-outline" 
                          size={32} 
                          color={userRole === 'trainee' && isDarkMode ? darkSecondary : '#8E8E93'} 
                        />
                        <Text style={{
                          fontSize: 14,
                          color: userRole === 'trainee' && isDarkMode ? darkSecondary : '#8E8E93',
                          marginTop: 8,
                          textAlign: 'center'
                        }}>
                          Tap to upload file (PDF, Word, Images)
                        </Text>
                        <Text style={{
                          fontSize: 12,
                          color: userRole === 'trainee' && isDarkMode ? darkSecondary : '#8E8E93',
                          marginTop: 4,
                          textAlign: 'center'
                        }}>
                          Max 50MB per file • One file per trainee
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      /* Selected File Display */
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: userRole === 'trainee' && isDarkMode ? darkBg : '#F8F8F8',
                          borderRadius: 12,
                          padding: 12,
                          borderWidth: 1,
                          borderColor: userRole === 'trainee' && isDarkMode ? darkHighlight : '#34C759'
                        }}
                      >
                        <Ionicons 
                          name={
                            selectedFile.type.startsWith('image/') ? 'image-outline' :
                            selectedFile.type === 'application/pdf' ? 'document-text-outline' :
                            'document-outline'
                          }
                          size={24} 
                          color={userRole === 'trainee' && isDarkMode ? darkHighlight : '#34C759'} 
                        />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={{
                            fontSize: 14,
                            fontWeight: '500',
                            color: userRole === 'trainee' && isDarkMode ? darkText : '#1C1C1E'
                          }}>
                            {selectedFile.name}
                          </Text>
                          <Text style={{
                            fontSize: 12,
                            color: userRole === 'trainee' && isDarkMode ? darkSecondary : '#8E8E93'
                          }}>
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={removeFile}
                          style={{
                            padding: 8,
                            borderRadius: 16,
                            backgroundColor: '#FF3B30'
                          }}
                        >
                          <Ionicons name="close" size={16} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}

                {/* File Upload Restriction Notice */}
                {userHasUploadedFile && (
                  <View style={{
                    backgroundColor: userRole === 'trainee' && isDarkMode ? '#1A1A1A' : '#F0F8FF',
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 16,
                    borderLeftWidth: 4,
                    borderLeftColor: '#007AFF'
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons 
                        name="information-circle" 
                        size={16} 
                        color="#007AFF" 
                        style={{ marginRight: 8 }}
                      />
                      <Text style={{
                        fontSize: 14,
                        color: userRole === 'trainee' && isDarkMode ? darkText : '#1C1C1E',
                        fontWeight: '500',
                        flex: 1
                      }}>
                        You have already uploaded a plan file. Each trainee can upload only one file total.
                      </Text>
                    </View>
                  </View>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                  style={{
                    backgroundColor: userRole === 'trainee' && isDarkMode ? darkHighlight : '#34C759',
                    borderRadius: 12,
                    padding: 16,
                    alignItems: 'center',
                    opacity: isSubmittingFeedback ? 0.7 : 1,
                  }}
                  onPress={submitFeedback}
                  disabled={isSubmittingFeedback}
                >
                  <Text style={{
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: '600'
                  }}>
                    {isSubmittingFeedback 
                      ? 'Submitting...' 
                      : userFeedbackCount === 1 
                        ? 'Submit Additional Feedback' 
                        : 'Submit Feedback'
                    }
                  </Text>
                </TouchableOpacity>

                {userFeedbackCount === 0 && (
                  <Text style={{
                    fontSize: 12,
                    color: userRole === 'trainee' && isDarkMode ? darkSecondary : '#8E8E93',
                    textAlign: 'center',
                    marginTop: 8,
                    fontStyle: 'italic'
                  }}>
                    You can submit up to 2 feedbacks. The second feedback will keep the same rating.
                  </Text>
                )}
              </>
            )}
          </View>
        )}

        {/* Previous Feedbacks Section */}
        <View style={{
          marginTop: 24,
          backgroundColor: userRole === 'trainee' && isDarkMode ? darkCard : '#fff',
          borderRadius: 16,
          padding: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 3,
          borderWidth: 1,
          borderColor: userRole === 'trainee' && isDarkMode ? darkBorder : '#F2F2F7',
        }}>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: showPreviousFeedbacks ? 16 : 0
            }}
            onPress={() => setShowPreviousFeedbacks(!showPreviousFeedbacks)}
          >
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: userRole === 'trainee' && isDarkMode ? darkText : '#1C1C1E',
            }}>
              Previous Feedbacks {isLoadingFeedbacks ? '(Loading...)' : `(${submittedFeedbacks.length})`}
            </Text>
            <Ionicons
              name={showPreviousFeedbacks ? "chevron-up" : "chevron-down"}
              size={24}
              color={userRole === 'trainee' && isDarkMode ? darkSecondary : '#8E8E93'}
            />
          </TouchableOpacity>

          {showPreviousFeedbacks && (
            <View>
              {isLoadingFeedbacks ? (
                <View style={{
                  padding: 20,
                  alignItems: 'center'
                }}>
                  <Text style={{
                    color: userRole === 'trainee' && isDarkMode ? darkSecondary : '#8E8E93',
                    fontSize: 16
                  }}>
                    Loading feedback...
                  </Text>
                </View>
              ) : feedbackLoadError ? (
                <View style={{
                  padding: 20,
                  alignItems: 'center'
                }}>
                  <Ionicons 
                    name="alert-circle-outline" 
                    size={32} 
                    color={userRole === 'trainee' && isDarkMode ? darkSecondary : '#FF6B6B'} 
                  />
                  <Text style={{
                    color: userRole === 'trainee' && isDarkMode ? darkSecondary : '#FF6B6B',
                    fontSize: 14,
                    textAlign: 'center',
                    marginTop: 8
                  }}>
                    {feedbackLoadError}
                  </Text>
                  <TouchableOpacity
                    style={{
                      marginTop: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      backgroundColor: userRole === 'trainee' && isDarkMode ? darkHighlight : '#34C759',
                      borderRadius: 8
                    }}
                    onPress={() => {
                      // Reload feedbacks
                      const loadFeedbacks = async () => {
                        setIsLoadingFeedbacks(true);
                        setFeedbackLoadError(null);
                        
                        try {
                          // Get all feedbacks for display
                          const { data: allData, error: allError } = await FeedbackService.getAllFeedback();
                          
                          if (allError) {
                            setFeedbackLoadError(allError);
                            return;
                          }
                          
                          // Get current user's feedbacks for count and rating check
                          const { data: userData, error: userError } = await FeedbackService.getUserFeedback();
                          
                          if (allData) {
                            setSubmittedFeedbacks(allData);
                          }
                          
                          if (userData) {
                            setUserFeedbackCount(userData.length);
                            if (userData.length > 0) {
                              setFirstFeedbackRating(userData[0].rating);
                              
                              // Check if user has already uploaded a file in any feedback
                              const hasFile = userData.some(feedback => feedback.file_name && feedback.file_path);
                              setUserHasUploadedFile(hasFile);
                            }
                          }
                        } catch (error) {
                          setFeedbackLoadError('Failed to load feedback data');
                        } finally {
                          setIsLoadingFeedbacks(false);
                        }
                      };
                      loadFeedbacks();
                    }}
                  >
                    <Text style={{
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: '600'
                    }}>
                      Retry
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : submittedFeedbacks.length === 0 ? (
                <View style={{
                  padding: 20,
                  alignItems: 'center'
                }}>
                  <Ionicons 
                    name="chatbubble-outline" 
                    size={32} 
                    color={userRole === 'trainee' && isDarkMode ? darkSecondary : '#8E8E93'} 
                  />
                  <Text style={{
                    color: userRole === 'trainee' && isDarkMode ? darkSecondary : '#8E8E93',
                    fontSize: 16,
                    textAlign: 'center',
                    marginTop: 8
                  }}>
                    No feedback submitted yet
                  </Text>
                </View>
              ) : (
                submittedFeedbacks.map((feedback) => (
                  <View
                    key={feedback.id}
                    style={{
                      backgroundColor: userRole === 'trainee' && isDarkMode ? darkBg : '#F8F8F8',
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: userRole === 'trainee' && isDarkMode ? darkBorder : '#E5E5EA',
                    }}
                  >
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8
                    }}>
                      <Text style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: userRole === 'trainee' && isDarkMode ? darkText : '#1C1C1E',
                      }}>
                        {feedback.trainee_name}
                      </Text>
                      <Text style={{
                        fontSize: 12,
                        color: userRole === 'trainee' && isDarkMode ? darkSecondary : '#8E8E93',
                      }}>
                        {formatDateForDisplay(feedback.submission_date)}
                      </Text>
                    </View>
                    
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 8
                    }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= feedback.rating ? "star" : "star-outline"}
                          size={16}
                          color={star <= feedback.rating ? "#FFD700" : (userRole === 'trainee' && isDarkMode ? darkSecondary : "#C7C7CC")}
                          style={{ marginRight: 2 }}
                        />
                      ))}
                      <Text style={{
                        fontSize: 12,
                        color: userRole === 'trainee' && isDarkMode ? darkSecondary : '#8E8E93',
                        marginLeft: 8
                      }}>
                        {feedback.rating}/5
                      </Text>
                    </View>
                    
                    <Text style={{
                      fontSize: 14,
                      lineHeight: 20,
                      color: userRole === 'trainee' && isDarkMode ? darkText : '#1C1C1E',
                    }}>
                      {feedback.feedback_text}
                    </Text>

                    {/* Display uploaded file */}
                    {feedback.file_name && feedback.file_path && (
                      <View style={{ marginTop: 12 }}>
                        <Text style={{
                          fontSize: 12,
                          fontWeight: '600',
                          color: userRole === 'trainee' && isDarkMode ? darkSecondary : '#8E8E93',
                          marginBottom: 8
                        }}>
                          Plan File:
                        </Text>
                        <TouchableOpacity
                          onPress={() => openFile(feedback)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: userRole === 'trainee' && isDarkMode ? '#1A1A1A' : '#F0F0F0',
                            borderRadius: 8,
                            padding: 8
                          }}
                        >
                          <Ionicons 
                            name={
                              feedback.file_type?.startsWith('image/') ? 'image-outline' :
                              feedback.file_type === 'application/pdf' ? 'document-text-outline' :
                              'document-outline'
                            }
                            size={16} 
                            color={userRole === 'trainee' && isDarkMode ? darkHighlight : '#007AFF'} 
                          />
                          <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={{
                              fontSize: 12,
                              color: userRole === 'trainee' && isDarkMode ? darkHighlight : '#007AFF',
                              fontWeight: '500'
                            }}>
                              {feedback.file_name}
                            </Text>
                            <Text style={{
                              fontSize: 10,
                              color: userRole === 'trainee' && isDarkMode ? darkSecondary : '#8E8E93',
                              marginTop: 2
                            }}>
                              {feedback.file_type?.startsWith('image/') ? 'Tap to view' : 'Tap to download'}
                            </Text>
                          </View>
                          {feedback.file_size && (
                            <Text style={{
                              fontSize: 10,
                              color: userRole === 'trainee' && isDarkMode ? darkSecondary : '#8E8E93'
                            }}>
                              {(feedback.file_size / 1024 / 1024).toFixed(2)} MB
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* File Viewer Modal */}
      <Modal
        visible={fileViewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeFileViewer}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {/* Close Button */}
          <TouchableOpacity
            onPress={closeFileViewer}
            style={{
              position: 'absolute',
              top: 60,
              right: 20,
              zIndex: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 20,
              padding: 10
            }}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>

          {/* File Content */}
          {viewingFile && (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
              {viewingFile.file_type?.startsWith('image/') ? (
                <Image
                  source={{ uri: viewingFile.file_path }}
                  style={{
                    width: '100%',
                    height: '100%',
                    resizeMode: 'contain'
                  }}
                  onError={() => {
                    Alert.alert('Error', 'Failed to load image.');
                    closeFileViewer();
                  }}
                />
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="document-outline" size={64} color="#fff" />
                  <Text style={{
                    color: '#fff',
                    fontSize: 18,
                    fontWeight: '600',
                    marginTop: 16,
                    textAlign: 'center'
                  }}>
                    {viewingFile.file_name}
                  </Text>
                  <Text style={{
                    color: '#ccc',
                    fontSize: 14,
                    marginTop: 8,
                    textAlign: 'center'
                  }}>
                    Tap to download and open with external app
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      closeFileViewer();
                      // Create a fake feedback object for the openFile function
                      const fakeFeedback: TraineeFeedback = {
                        id: '',
                        trainee_id: '',
                        trainee_name: '',
                        feedback_text: '',
                        rating: 0,
                        submission_date: '',
                        file_name: viewingFile.file_name,
                        file_path: viewingFile.file_path,
                        file_type: viewingFile.file_type,
                        file_size: viewingFile.file_size
                      };
                      openFile(fakeFeedback);
                    }}
                    style={{
                      backgroundColor: userRole === 'trainee' && isDarkMode ? darkHighlight : '#007AFF',
                      borderRadius: 12,
                      paddingHorizontal: 24,
                      paddingVertical: 12,
                      marginTop: 20
                    }}
                  >
                    <Text style={{
                      color: '#fff',
                      fontSize: 16,
                      fontWeight: '600'
                    }}>
                      Download & Open
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 20 : 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  themeToggleButton: {
    padding: 8,
  },
  progressSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  progressCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34C759',
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  checklistCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  checklistCardCompleted: {
    backgroundColor: '#F0FFF4',
    borderColor: '#34C759',
  },
  checklistCardLocked: {
    backgroundColor: '#F8F8F8',
    borderColor: '#E5E5EA',
    opacity: 0.7,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  checkboxContainer: {
    marginRight: 16,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  checkboxLocked: {
    backgroundColor: '#E5E5EA',
    borderColor: '#C7C7CC',
  },
  checkmark: {
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  itemTitleCompleted: {
    color: '#34C759',
    textDecorationLine: 'line-through',
  },
  itemTitleLocked: {
    color: '#8E8E93',
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '400',
  },
  itemSubtitleLocked: {
    color: '#C7C7CC',
  },
  statusIcon: {
    marginLeft: 12,
  },
}); 