import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function BookAddedConfirmationScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.push('/books-management')} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color="#222" />
      </TouchableOpacity>
      <Text style={styles.header}>Book Added !</Text>
      <Text style={styles.subHeader}>The new book has been successfully added to the MITConnect Library</Text>
      <View style={styles.iconCircle}>
        <Ionicons name="checkmark" size={56} color="#3AC569" />
      </View>
      <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/add-book')}>
        <Text style={styles.addBtnText}>Add New Book</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.viewBtn} onPress={() => router.push('/books-management')}>
        <Text style={styles.viewBtnText}>View All Books</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF9',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  backBtn: {
    position: 'absolute',
    top: 48,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20,
    padding: 4,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
    textAlign: 'center',
    marginTop: 48,
  },
  subHeader: {
    fontSize: 15,
    color: '#888',
    marginBottom: 32,
    textAlign: 'center',
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E6F7EC',
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
    backgroundColor: '#F2F2F2',
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  viewBtnText: {
    color: '#444',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 