import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTheme } from '../components/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AdminHeaderProps {
  title: string;
  showBackButton?: boolean;
  backDestination?: string;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  showShadow?: boolean;
  showLogo?: boolean;
  showDarkModeToggle?: boolean;
  showAccountButton?: boolean;
  showMenuButton?: boolean;
  titleSize?: number;
}

export default function AdminHeader({
  title,
  showBackButton = true,
  backDestination = '/admin-home',
  onBackPress,
  rightComponent,
  showShadow = true,
  showLogo = true,
  showDarkModeToggle = false,
  showAccountButton = false,
  showMenuButton = false,
  titleSize,
}: AdminHeaderProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const logoCircleBg = isDarkMode ? '#2A2A2A' : '#E8F8F5';
  const textColor = useThemeColor({}, 'text');
  const borderColor = 'transparent';
  const iconColor = useThemeColor({}, 'icon');

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else if (backDestination) {
      router.push(backDestination as any);
    } else {
      router.back();
    }
  };

  const { toggleTheme } = useTheme();
  
  const toggleDarkMode = () => {
    toggleTheme();
  };

  const openAccount = () => {
    // This would open account modal or navigate to account page
    console.log('Open account');
  };

  const openMenu = () => {
    // This would open menu or navigation drawer
    console.log('Open menu');
  };

  const showLightShadow = !isDarkMode;

  return (
    <View style={[
      styles.headerContainer,
      { 
        backgroundColor: cardBackground,
        borderBottomColor: 'transparent',
        paddingTop: insets.top,
        paddingBottom: 12,
        paddingHorizontal: 16,
      }
    ]}>
      {/* Left Section */}
      <View style={styles.headerLeft}>
        {showBackButton && (
          <TouchableOpacity 
            onPress={handleBackPress} 
            style={[
              styles.headerIcon, 
              { backgroundColor: cardBackground }
            ]}
          >
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
        )}
        {showLogo ? (
          <View style={styles.logoSection}>
            <View style={[styles.logoCircle, { backgroundColor: logoCircleBg, width: 36, height: 36, borderRadius: 18 }]}> 
              <Feather name="users" size={18} color="#004080" />
            </View>
            <Text style={{ color: textColor, fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 }}>{title}</Text>
          </View>
        ) : (
          <Text style={[styles.headerTitle, { color: textColor, fontSize: titleSize || 20, fontWeight: 'bold', marginLeft: 8, marginTop: 0 }]} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
        )}
      </View>
      {/* Center Section - Title (absolutely centered) - only when logo is shown */}
      {showLogo && (
        <View pointerEvents="none" style={styles.headerTitleWrapper}>
          <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
        </View>
      )}
      {/* Right Section for rightComponent */}
      <View style={styles.headerRight}>
        {showDarkModeToggle && (
          <TouchableOpacity 
            style={[styles.themeButton, { backgroundColor: isDarkMode ? '#2A2A2A' : '#F0F0F0' }]}
            onPress={toggleDarkMode}
          >
            <Ionicons 
              name={isDarkMode ? 'sunny' : 'moon'} 
              size={20} 
              color={isDarkMode ? '#FFD700' : '#666'} 
            />
          </TouchableOpacity>
        )}
        {rightComponent}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    minHeight: Platform.OS === 'ios' ? 60 : 56,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  headerIcon: {
    padding: 8,
    borderRadius: 20,
    marginRight: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  logoText: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  headerTitleWrapper: {
    position: 'absolute',
    left: 60,
    right: 60,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    height: 56,
    pointerEvents: 'none',
  },
  headerTitle: {
    fontSize: Platform.OS === 'ios' ? 17 : 16,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
    maxWidth: '100%',
    marginTop: Platform.OS === 'ios' ? 16 : 18,
  },
  themeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
}); 