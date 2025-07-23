import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useUserContext } from './UserContext';

interface StandardHeaderProps {
  title: string;
  showBackButton?: boolean;
  backDestination?: string;
  rightComponent?: React.ReactNode;
  showShadow?: boolean;
}

export default function StandardHeader({
  title,
  showBackButton = true,
  backDestination = '/admin-home',
  rightComponent,
  showShadow = true,
}: StandardHeaderProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const { getHomeRoute } = useUserContext();

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const borderColor = isDarkMode ? '#2A2A2A' : '#E0E0E0';

  // Smart back handler
  const handleBack = () => {
    if (window?.history?.length > 1) {
      router.back();
    } else {
      router.replace(getHomeRoute() as any);
    }
  };

  return (
    <View style={[
      styles.headerRow,
      { 
        backgroundColor: cardBackground, 
        borderBottomColor: borderColor,
        ...(showShadow && {
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 4,
        })
      }
    ]}>
      {showBackButton ? (
        <TouchableOpacity 
          onPress={handleBack} 
          style={[
            styles.backBtn, 
            { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
          ]}
        >
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
      ) : (
        <View style={styles.backBtn} />
      )}
      
      <Text style={[styles.headerTitle, { color: textColor }]}>{title}</Text>
      
      {rightComponent ? (
        rightComponent
      ) : (
        <View style={styles.backBtn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 28,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    minWidth: 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
}); 