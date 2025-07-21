import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUserContext } from './UserContext';

interface AdminTabBarProps {
  activeTab: string;
  isDarkMode?: boolean;
}

export default function AdminTabBar({ activeTab, isDarkMode = false }: AdminTabBarProps) {
  const router = useRouter();
  const { getHomeRoute } = useUserContext();

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

  return (
    <View style={[styles.tabBar, { backgroundColor: colors.cardBackground }]}>
      <TouchableOpacity 
        style={styles.tabItem} 
        onPress={() => handleTabPress('home')}
        activeOpacity={0.7}
      >
        <Feather 
          name="home" 
          size={22} 
          color={activeTab === 'home' ? colors.activeIcon : colors.icon} 
        />
        <Text style={[
          styles.tabLabel, 
          { color: activeTab === 'home' ? colors.activeIcon : colors.textSecondary }
        ]}>
          Home
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.tabItem} 
        onPress={() => handleTabPress('events')}
        activeOpacity={0.7}
      >
        <Feather 
          name="calendar" 
          size={22} 
          color={activeTab === 'events' ? colors.activeIcon : colors.icon} 
        />
        <Text style={[
          styles.tabLabel, 
          { color: activeTab === 'events' ? colors.activeIcon : colors.textSecondary }
        ]}>
          Events
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.tabItem} 
        onPress={() => handleTabPress('ideas')}
        activeOpacity={0.7}
      >
        <Feather 
          name="star" 
          size={22} 
          color={activeTab === 'ideas' ? colors.activeIcon : colors.icon} 
        />
        <Text style={[
          styles.tabLabel, 
          { color: activeTab === 'ideas' ? colors.activeIcon : colors.textSecondary }
        ]}>
          Ideas
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.tabItem} 
        onPress={() => handleTabPress('trainees')}
        activeOpacity={0.7}
      >
        <Feather 
          name="users" 
          size={22} 
          color={activeTab === 'trainees' ? colors.activeIcon : colors.icon} 
        />
        <Text style={[
          styles.tabLabel, 
          { color: activeTab === 'trainees' ? colors.activeIcon : colors.textSecondary }
        ]}>
          Trainees
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.tabItem} 
        onPress={() => handleTabPress('gallery')}
        activeOpacity={0.7}
      >
        <Feather 
          name="image" 
          size={22} 
          color={activeTab === 'gallery' ? colors.activeIcon : colors.icon} 
        />
        <Text style={[
          styles.tabLabel, 
          { color: activeTab === 'gallery' ? colors.activeIcon : colors.textSecondary }
        ]}>
          Gallery
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.tabItem} 
        onPress={() => handleTabPress('books')}
        activeOpacity={0.7}
      >
        <MaterialIcons 
          name="menu-book" 
          size={22} 
          color={activeTab === 'books' ? colors.activeIcon : colors.icon} 
        />
        <Text style={[
          styles.tabLabel, 
          { color: activeTab === 'books' ? colors.activeIcon : colors.textSecondary }
        ]}>
          Books
        </Text>
      </TouchableOpacity>
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