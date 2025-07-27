import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useTheme } from './ThemeContext';
import { useThemeColor } from '../hooks/useThemeColor';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface LibraryHeaderProps {
  title?: string;
}

export default function LibraryHeader({ title = "MITConnect" }: LibraryHeaderProps) {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Theme colors - exact same as Library screen
  const backgroundColor = useThemeColor({}, 'background') || '#f6f7f9';
  const textColor = useThemeColor({}, 'text') || '#222';
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const borderColor = isDarkMode ? '#2A2A2A' : '#eee';
  const iconColor = useThemeColor({}, 'icon') || '#222';
  const darkCard = isDarkMode ? '#23272b' : '#fff';
  const darkBorder = isDarkMode ? '#2D333B' : '#eee';
  const darkText = isDarkMode ? '#fff' : '#222';
  const darkHighlight = '#43C6AC';

  return (
    <>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} translucent backgroundColor="transparent" />
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingTop: insets.top + 10,
        paddingBottom: 6,
        backgroundColor: isDarkMode ? darkCard : cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: isDarkMode ? darkBorder : borderColor,
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 8 }}>
          <Ionicons name="arrow-back" size={24} color={iconColor} />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '700', letterSpacing: 0.5, flex: 1, textAlign: 'center', color: isDarkMode ? darkText : textColor }}>
          MIT<Text style={{ color: darkHighlight }}>Connect</Text>
        </Text>
        <View style={{ width: 32 }} />
      </View>
    </>
  );
} 