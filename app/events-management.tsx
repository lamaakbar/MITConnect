import React from "react";
import { View, Text, StyleSheet } from 'react-native';

export default function EventsManagement() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Events Management</Text>
      <FlatList
        data={mockEvents}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.eventCard}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.attendeesTitle}>Attendees:</Text>
            {item.attendees.length === 0 ? (
              <Text style={styles.noAttendees}>No attendees yet.</Text>
            ) : (
              item.attendees.map((name, idx) => (
                <Text key={idx} style={styles.attendeeName}>{name}</Text>
              ))
            )}
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
    marginBottom: 8,
  },
  attendeesTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  noAttendees: {
    color: '#888',
    fontStyle: 'italic',
  },
  attendeeName: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
}); 