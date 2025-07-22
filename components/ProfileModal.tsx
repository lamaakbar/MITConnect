import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import { useThemeColor } from '../hooks/useThemeColor';
import { useRouter } from 'expo-router';

export default function ProfileModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { user, logout } = useAuth();
  const { isDarkMode } = useTheme();
  const cardBackground = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  const iconColor = useThemeColor({}, 'icon');
  const router = useRouter();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: cardBackground, borderRadius: 20, padding: 28, width: '85%', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16 }}>
          <TouchableOpacity onPress={onClose} style={{ position: 'absolute', top: 12, right: 12, padding: 8 }}>
            <Ionicons name="close" size={28} color={secondaryTextColor} />
          </TouchableOpacity>
          <Ionicons name="person-circle-outline" size={64} color={iconColor} style={{ marginBottom: 12 }} />
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: textColor, marginBottom: 8 }}>Profile</Text>
          <Text style={{ fontSize: 16, color: secondaryTextColor, marginBottom: 24 }}>{user?.email || 'No email found'}</Text>
          <TouchableOpacity
            style={{ backgroundColor: '#ff6b6b', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 32, marginTop: 8 }}
            onPress={async () => { await logout(); onClose(); router.replace('/'); }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
} 