import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';

const mockEvents = [
  { id: '1', title: 'Brainstorming', desc: 'Brainstorming with team on storily app', date: 'Today', time: '12:45 pm' },
  { id: '2', title: 'DataCenter', desc: 'Together to Explore The Data', date: '18 July', time: '2:00 pm' },
];

export default function EventsScreen() {
  const [registered, setRegistered] = useState<string[]>([]);

  const handleRegister = (id: string) => {
    setRegistered(prev => [...prev, id]);
    Alert.alert('Registered', 'You have successfully registered for this event!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Events</Text>
      <FlatList
        data={mockEvents}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.eventCard}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.eventDesc}>{item.desc}</Text>
            <Text style={styles.eventDate}>{item.date} {item.time}</Text>
            <TouchableOpacity
              style={[styles.registerBtn, registered.includes(item.id) && { backgroundColor: '#aaa' }]}
              onPress={() => handleRegister(item.id)}
              disabled={registered.includes(item.id)}
            >
              <Text style={styles.registerBtnText}>
                {registered.includes(item.id) ? 'Registered' : 'Register'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7f9',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eventDesc: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 13,
    color: '#888',
    marginBottom: 10,
  },
  registerBtn: {
    backgroundColor: '#43C6AC',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  registerBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 