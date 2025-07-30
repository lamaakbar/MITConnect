import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to MIT Connect</Text>
      <Text style={styles.subtitle}>Your portal to events, resources, and community.</Text>
      
      {/* Team Credit */}
      <Text style={styles.creditText}>Made by IT Pulse Team – Summer 2025</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  creditText: {
    fontSize: 11,
    color: '#888',
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.8,
    paddingHorizontal: 16,
  },
}); 

