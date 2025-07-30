import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useUserContext } from './UserContext';
import { useTheme } from './ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS = [
  {
    key: 'home',
    label: 'Home',
    icon: (color: string) => <Ionicons name="home-outline" size={24} color={color} />,
    route: '/employee-home',
  },
  {
    key: 'events',
    label: 'Events',
    icon: (color: string) => <MaterialIcons name="event" size={24} color={color} />,
    route: '/events',
  },
  {
    key: 'gallery',
    label: 'Gallery',
    icon: (color: string) => <Ionicons name="image-outline" size={24} color={color} />,
    route: '/gallery',
  },
];

const ACTIVE_COLOR = '#111';
const INACTIVE_COLOR = '#6E7E6F';

export default function EventsTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { getHomeRoute, userRole, effectiveRole } = useUserContext();
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  // Friendly dark mode palette for employee/trainee
  const isEmpOrTrainee = effectiveRole === 'employee' || effectiveRole === 'trainee';
  const colors = isDarkMode && isEmpOrTrainee
    ? {
        background: '#23272b',
        border: '#2D333B',
        icon: '#AEB6C1',
        label: '#AEB6C1',
        active: '#43C6AC',
      }
    : isDarkMode
    ? {
        background: '#1E1E1E',
        border: '#2A2A2A',
        icon: '#9BA1A6',
        label: '#9BA1A6',
        active: '#3CB371',
      }
    : {
        background: '#fff',
        border: '#eee',
        icon: '#222',
        label: '#888',
        active: '#3CB371',
      };

  return (
    <View style={[
      styles.tabBar, 
      { 
        backgroundColor: colors.background,
        paddingBottom: insets.bottom + (Platform.OS === 'ios' ? 8 : 20),
        paddingTop: Platform.OS === 'android' ? 12 : 0,
      }
    ]}>
      {TABS.map(tab => {
        const route = tab.route === 'home' ? getHomeRoute() : tab.route;
        const isActive = pathname === route;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabBtn,
              Platform.OS === 'android' && styles.tabBtnAndroid
            ]}
            onPress={() => {
              if (pathname !== route) {
                router.replace(route as any);
              }
            }}
            activeOpacity={0.7}
          >
            {tab.icon(isActive ? colors.active : colors.icon)}
            <Text style={[
              styles.tabLabel, 
              { color: isActive ? colors.active : colors.label },
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
    ...Platform.select({
      android: {
        minHeight: 80,
        paddingVertical: 16,
        paddingBottom: 24,
      }
    }),
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    ...Platform.select({
      android: {
        minHeight: 56,
        justifyContent: 'center',
        paddingVertical: 8,
      }
    }),
  },
  tabBtnAndroid: {
    borderRadius: 8,
    marginHorizontal: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
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