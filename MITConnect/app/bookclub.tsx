import { View, Text, StyleSheet } from 'react-native';

export default function BookClubScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Book Club</Text>
      <Text>Book Club feature coming soon.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
}); 