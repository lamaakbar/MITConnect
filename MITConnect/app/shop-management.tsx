import { View, Text, StyleSheet } from 'react-native';

export default function ShopManagement() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shop Management</Text>
      <Text>Feature coming soon.</Text>
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