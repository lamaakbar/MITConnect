import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useUserContext } from './UserContext';

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
    key: 'bookmarks',
    label: 'Bookmarks',
    icon: (color: string) => <Ionicons name="bookmark" size={26} color={color} />,
    route: '/bookmarks',
  },
];

const ACTIVE_COLOR = '#111';
const INACTIVE_COLOR = '#6E7E6F';

export default function EventsTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { getHomeRoute } = useUserContext();

  return (
    <View style={styles.tabBar}>
      {TABS.map(tab => {
        const route = tab.route === 'home' ? getHomeRoute() : tab.route;
        const isActive =
          (tab.route === '/events' && pathname.startsWith('/event')) ||
          pathname === route;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabBtn}
            onPress={() => router.replace(route as any)}
            activeOpacity={0.7}
          >
            {tab.icon(isActive ? ACTIVE_COLOR : INACTIVE_COLOR)}
            <Text style={[styles.tabLabel, { color: isActive ? ACTIVE_COLOR : INACTIVE_COLOR }]}>{tab.label}</Text>
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