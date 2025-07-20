import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function BookAddedConfirmationScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <TouchableOpacity onPress={() => router.push('/books-management')} style={[styles.backBtn, { backgroundColor: isDarkMode ? 'rgba(30,30,30,0.8)' : 'rgba(255,255,255,0.8)' }]}>
        <Ionicons name="arrow-back" size={24} color={textColor} />
      </TouchableOpacity>
      <Text style={[styles.header, { color: textColor }]}>Book Added !</Text>
      <Text style={[styles.subHeader, { color: secondaryTextColor }]}>The new book has been successfully added to the MITConnect Library</Text>
      <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? '#1E3A2E' : '#E6F7EC' }]}>
        <Ionicons name="checkmark" size={56} color="#3AC569" />
      </View>
      <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/add-book')}>
        <Text style={styles.addBtnText}>Add New Book</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.viewBtn, { backgroundColor: isDarkMode ? '#2A2A2A' : '#F2F2F2' }]} onPress={() => router.push('/books-management')}>
        <Text style={[styles.viewBtnText, { color: textColor }]}>View All Books</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  backBtn: {
    position: 'absolute',
    top: 48,
    left: 16,
    zIndex: 10,
    borderRadius: 20,
    padding: 4,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    marginTop: 48,
  },
  subHeader: {
    fontSize: 15,
    marginBottom: 32,
    textAlign: 'center',
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  addBtn: {
    backgroundColor: '#3AC569',
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  viewBtn: {
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  viewBtnText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 