import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

const ideas = [
  { id: '1', text: 'Start a mentorship program', accepted: true },
  { id: '2', text: 'Monthly team lunch', accepted: true, poll: { question: 'Which cuisine?', options: ['Italian', 'Mexican', 'Indian'], votes: [2, 1, 0] } },
];

export default function InspirerCornerScreen() {
  const [voted, setVoted] = useState<{ [key: string]: number }>({});

  const handleVote = (ideaId: string, optionIdx: number) => {
    setVoted(prev => ({ ...prev, [ideaId]: optionIdx }));
    // In a real app, increment the vote count in backend/state
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inspire Corner</Text>
      <FlatList
        data={ideas.filter(i => i.accepted)}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.ideaCard}>
            <Text style={styles.ideaText}>{item.text}</Text>
            {item.poll && (
              <View style={styles.pollBox}>
                <Text style={styles.pollQuestion}>{item.poll.question}</Text>
                {voted[item.id] === undefined ? (
                  item.poll.options.map((opt, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.pollOption}
                      onPress={() => handleVote(item.id, idx)}
                    >
                      <Text style={styles.pollOptionText}>{opt}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View>
                    <Text style={styles.pollResultTitle}>Results:</Text>
                    {item.poll.options.map((opt, idx) => (
                      <Text key={idx} style={styles.pollResultText}>
                        {opt}: {item.poll.votes[idx] + (voted[item.id] === idx ? 1 : 0)} votes
                      </Text>
                    ))}
                  </View>
                )}
              </View>
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
  ideaCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  ideaText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  pollBox: {
    marginTop: 10,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 10,
  },
  pollQuestion: {
    fontWeight: '600',
    marginBottom: 8,
  },
  pollOption: {
    backgroundColor: '#43C6AC',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    alignItems: 'center',
  },
  pollOptionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  pollResultTitle: {
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  pollResultText: {
    fontSize: 14,
    color: '#333',
  },
}); 