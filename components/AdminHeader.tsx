import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';

interface AdminHeaderProps {
  title: string;
  showBackButton?: boolean;
  backDestination?: string;
  rightComponent?: React.ReactNode;
  showShadow?: boolean;
  showLogo?: boolean;
  showDarkModeToggle?: boolean;
  showAccountButton?: boolean;
  showMenuButton?: boolean;
}

export default function AdminHeader({
  title,
  showBackButton = true,
  backDestination = '/admin-home',
  rightComponent,
  showShadow = true,
  showLogo = true,
  showDarkModeToggle = true,
  showAccountButton = true,
  showMenuButton = true,
}: AdminHeaderProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const borderColor = isDarkMode ? '#2A2A2A' : '#E0E0E0';
  const iconColor = isDarkMode ? '#9BA1A6' : '#222';

  const handleBackPress = () => {
    if (backDestination) {
      router.push(backDestination as any);
    } else {
      router.back();
    }
  };

  const toggleDarkMode = () => {
    // This would be implemented with a global theme context
    console.log('Toggle dark mode');
  };

  const openAccount = () => {
    // This would open account modal or navigate to account page
    console.log('Open account');
  };

  const openMenu = () => {
    // This would open menu or navigation drawer
    console.log('Open menu');
  };

  return (
    <View style={[
      styles.headerContainer,
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
      {/* Left Section */}
      <View style={styles.headerLeft}>
        {showBackButton && (
          <TouchableOpacity 
            onPress={handleBackPress} 
            style={[
              styles.headerIcon, 
              { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
            ]}
          >
            <Ionicons name="arrow-back" size={20} color={textColor} />
          </TouchableOpacity>
        )}
        
        {showLogo && (
          <View style={styles.logoSection}>
            <View style={[styles.logoCircle, { backgroundColor: isDarkMode ? '#2A2A2A' : '#E8F8F5' }]}>
              <Feather name="users" size={18} color="#004080" />
            </View>
            <Text style={[styles.logoText, { color: textColor }]}>
              MIT<Text style={{ color: '#3CB371' }}>Connect</Text>
            </Text>
          </View>
        )}
      </View>

      {/* Center Section - Title */}
      <Text style={[styles.headerTitle, { color: textColor }]}>{title}</Text>

      {/* Right Section */}
      <View style={styles.headerRight}>
        {rightComponent ? (
          rightComponent
        ) : (
          <>
            {showDarkModeToggle && (
              <TouchableOpacity onPress={toggleDarkMode} style={styles.headerIcon}>
                <Feather 
                  name={isDarkMode ? "sun" : "moon"} 
                  size={18} 
                  color={iconColor} 
                />
              </TouchableOpacity>
            )}
            
            {showAccountButton && (
              <TouchableOpacity onPress={openAccount} style={styles.headerIcon}>
                <Feather name="user" size={18} color={iconColor} />
              </TouchableOpacity>
            )}
            
            {showMenuButton && (
              <TouchableOpacity onPress={openMenu} style={styles.headerIcon}>
                <Feather name="menu" size={18} color={iconColor} />
              </TouchableOpacity>
            )}
          </>
        )}
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
    paddingTop: Platform.OS === 'ios' ? 20 : 28,
    paddingBottom: 16,
    borderBottomWidth: 1,
    minHeight: 80,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 2,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
}); 