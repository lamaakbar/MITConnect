import { View, Text, StyleSheet } from 'react-native';

export default function InspirerCornerScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inspirer Corner</Text>
      <Text>Inspirer Corner feature coming soon.</Text>
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