import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useUserContext } from './UserContext';
import { useTheme } from './ThemeContext';

const TABS = [
  {
    key: 'home',
    label: 'Home',
    icon: (color: string) => <Ionicons name="home" size={26} color={color} />,
    route: 'home', // Will be resolved dynamically
  },
  {
    key: 'events',
    label: 'Events',
    icon: (color: string) => <MaterialIcons name="event" size={26} color={color} />,
    route: '/events',
  },
  {
    key: 'gallery',
    label: 'Gallery',
    icon: (color: string) => <Ionicons name="image-outline" size={26} color={color} />,
    route: '/gallery',
  },
];

const ACTIVE_COLOR = '#111';
const INACTIVE_COLOR = '#6E7E6F';

export default function EventsTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { getHomeRoute, userRole } = useUserContext();
  const { isDarkMode } = useTheme();

  // Friendly dark mode palette for employee/trainee
  const isEmpOrTrainee = userRole === 'employee' || userRole === 'trainee';
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
    <View style={[styles.tabBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
      {TABS.map(tab => {
        const route = tab.route === 'home' ? getHomeRoute() : tab.route;
        const isActive = pathname === route;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabBtn}
            onPress={() => router.replace(route as any)}
            activeOpacity={0.7}
          >
            {tab.icon(isActive ? colors.active : colors.icon)}
            <Text style={[styles.tabLabel, { color: isActive ? colors.active : colors.label }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    height: 64,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
    minHeight: 48,
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
    textAlign: 'center',
  },
}); 