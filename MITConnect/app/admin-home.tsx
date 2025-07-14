import { View, Text, StyleSheet } from 'react-native';

export default function AdminHome() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Home</Text>
      <Text>Welcome, Admin! (Dashboard coming soon)</Text>
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