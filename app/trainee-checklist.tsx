import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, Platform, Animated, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '../components/ThemeContext';
import { useThemeColor } from '../hooks/useThemeColor';
import { useUserContext } from '../components/UserContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CHECKLIST_ITEMS = [
  'Contract',
  'Card ID',
  'Training Start Form',
  'Training Plan',
  'Bank Training Evaluation',
  'Card Submission',
];

export default function TraineeChecklist() {
  const router = useRouter();
  const [checked, setChecked] = useState(Array(CHECKLIST_ITEMS.length).fill(false));
  const [scaleAnimations] = useState(() => 
    CHECKLIST_ITEMS.map(() => new Animated.Value(1))
  );
  
  const completed = checked.filter(Boolean).length;
  const progress = completed / CHECKLIST_ITEMS.length;

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

      {/* Checklist Items */}
      <FlatList
        data={CHECKLIST_ITEMS}
        keyExtractor={(item, index) => `checklist-${index}`}
        renderItem={({ item, index }) => {
          const isCompleted = checked[index];
          const isAvailable = canCheckItem(index);
          const isLocked = !isAvailable && !isCompleted;
          return (
            <Animated.View style={{ transform: [{ scale: scaleAnimations[index] }] }}>
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
        }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      />
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