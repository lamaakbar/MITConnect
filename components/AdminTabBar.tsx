import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUserContext } from './UserContext';
import { useTheme } from './ThemeContext';

interface AdminTabBarProps {
  activeTab: string;
  isDarkMode?: boolean;
}

export default function AdminTabBar({ activeTab }: AdminTabBarProps) {
  const router = useRouter();
  const { getHomeRoute } = useUserContext();
  const { isDarkMode } = useTheme();

  const getThemeColors = () => {
    return isDarkMode ? {
      cardBackground: '#1E1E1E',
      text: '#ECEDEE',
      textSecondary: '#9BA1A6',
      icon: '#9BA1A6',
      activeIcon: '#3CB371'
    } : {
      cardBackground: '#fff',
      text: '#222',
      textSecondary: '#888',
      icon: '#222',
      activeIcon: '#3CB371'
    };
  };

  const colors = getThemeColors();

  const handleTabPress = (tabName: string) => {
    switch (tabName) {
      case 'home':
        router.push(getHomeRoute() as any);
        break;
      case 'events':
        router.push('/admin-events');
        break;
      case 'ideas':
        router.push('/ideas-management');
        break;
      case 'trainees':
        router.push('/trainee-management');
        break;
      case 'gallery':
        router.push('/gallery-management');
        break;
      case 'books':
        router.push('/books-management');
        break;
    }
  };

  // Replace the TABS array and tab rendering logic to only show Home, Events, and Books
  const TABS = [
    {
      key: 'home',
      label: 'Home',
      icon: (color: string) => <Feather name="home" size={22} color={color} />, // keep existing icon for now
      route: '/admin-home',
    },
    {
      key: 'events',
      label: 'Events',
      icon: (color: string) => <Feather name="calendar" size={22} color={color} />, // keep existing icon for now
      route: '/admin-events',
    },
    {
      key: 'books',
      label: 'Books',
      icon: (color: string) => <MaterialIcons name="menu-book" size={22} color={color} />, // keep existing icon for now
      route: '/books-management',
    },
  ];

  const iconColor = colors.icon; // Use the default icon color for all tabs

  return (
    <View style={[styles.tabBar, { backgroundColor: colors.cardBackground }]}>
      {TABS.map((tab) => (
        <TouchableOpacity 
          key={tab.key}
          style={styles.tabItem} 
          onPress={() => handleTabPress(tab.key)}
          activeOpacity={0.7}
        >
          {tab.icon(iconColor)}
          <Text style={[
            styles.tabLabel, 
            { color: colors.textSecondary } // Use the same color for all labels
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
    paddingVertical: 12,
    paddingBottom: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
}); 