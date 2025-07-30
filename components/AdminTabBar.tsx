import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useUserContext } from './UserContext';
import { useTheme } from './ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AdminTabBarProps {
  activeTab: string;
  isDarkMode?: boolean;
}

export default function AdminTabBar({ activeTab }: AdminTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { getHomeRoute } = useUserContext();
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

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
        const homeRoute = getHomeRoute();
        if (pathname !== homeRoute) {
          router.push(homeRoute as any);
        }
        break;
      case 'events':
        if (pathname !== '/admin-events') {
          router.push('/admin-events');
        }
        break;
      case 'ideas':
        if (pathname !== '/ideas-management') {
          router.push('/ideas-management');
        }
        break;
      case 'trainees':
        if (pathname !== '/trainee-management') {
          router.push('/trainee-management');
        }
        break;
      case 'gallery':
        if (pathname !== '/gallery-management') {
          router.push('/gallery-management');
        }
        break;
      case 'books':
        if (pathname !== '/books-management') {
          router.push('/books-management');
        }
        break;
    }
  };

  // Replace the TABS array and tab rendering logic to only show Home, Events, and Books
  const TABS = [
    {
      key: 'home',
      label: 'Home',
      icon: (color: string) => <Feather name="home" size={24} color={color} />,
      route: '/admin-home',
    },
    {
      key: 'events',
      label: 'Events',
      icon: (color: string) => <Feather name="calendar" size={24} color={color} />,
      route: '/admin-events',
    },
    {
      key: 'books',
      label: 'Books',
      icon: (color: string) => <MaterialIcons name="menu-book" size={24} color={color} />,
      route: '/books-management',
    },
  ];

  return (
    <View style={[
      styles.tabBar, 
      { 
        backgroundColor: colors.cardBackground,
        paddingBottom: insets.bottom + (Platform.OS === 'ios' ? 8 : 20),
        paddingTop: Platform.OS === 'android' ? 12 : 0,
      }
    ]}>
      {TABS.map((tab) => {
        const isActive = pathname === tab.route;
        return (
          <TouchableOpacity 
            key={tab.key}
            style={[
              styles.tabItem,
              Platform.OS === 'android' && styles.tabItemAndroid
            ]} 
            onPress={() => handleTabPress(tab.key)}
            activeOpacity={0.7}
          >
            {tab.icon(isActive ? colors.activeIcon : colors.icon)}
            <Text style={[
              styles.tabLabel, 
              { color: isActive ? colors.activeIcon : colors.textSecondary },
              Platform.OS === 'android' && styles.tabLabelAndroid
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopLeftRadius: Platform.OS === 'ios' ? 20 : 18,
    borderTopRightRadius: Platform.OS === 'ios' ? 20 : 18,
    shadowColor: '#000',
    shadowOpacity: Platform.OS === 'ios' ? 0.08 : 0.06,
    shadowRadius: Platform.OS === 'ios' ? 10 : 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: Platform.OS === 'ios' ? 0 : 8,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...Platform.select({
      android: {
        minHeight: 80,
        paddingVertical: 16,
        paddingBottom: 24,
      }
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Platform.OS === 'ios' ? 6 : 4,
    ...Platform.select({
      android: {
        minHeight: 56,
        justifyContent: 'center',
        paddingVertical: 8,
      }
    }),
  },
  tabItemAndroid: {
    borderRadius: 8,
    marginHorizontal: 4,
  },
  tabLabel: {
    fontSize: Platform.OS === 'ios' ? 11 : 10,
    fontWeight: '500',
    marginTop: Platform.OS === 'ios' ? 4 : 2,
    ...Platform.select({
      android: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
      }
    }),
  },
  tabLabelAndroid: {
    textAlign: 'center',
  },
}); 